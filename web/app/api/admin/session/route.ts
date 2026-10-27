import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "crypto_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin
    && request.headers.get("sec-fetch-site") !== "cross-site";
}

function sessionSignature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update("crypto-admin-session:" + expiresAt).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ status: "error", error: "same_origin_required" }, { status: 403 });
  }

  const accessKey = process.env.CRYPTO_ADMIN_ACCESS_KEY ?? process.env.CRYPTO_ADMIN_TOKEN;
  const sessionSecret = process.env.CRYPTO_ADMIN_SESSION_SECRET ?? process.env.CRYPTO_ADMIN_TOKEN;
  if (!accessKey || !sessionSecret) {
    return NextResponse.json({ status: "error", error: "admin_auth_not_configured" }, { status: 503 });
  }

  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const attempt = failedAttempts.get(address);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    return NextResponse.json({ status: "error", error: "admin_login_rate_limited" }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 2048) {
    return NextResponse.json({ status: "error", error: "request_too_large" }, { status: 413 });
  }

  let submittedKey = "";
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 2048) {
      return NextResponse.json({ status: "error", error: "request_too_large" }, { status: 413 });
    }
    const payload = JSON.parse(raw) as { accessKey?: unknown };
    submittedKey = typeof payload.accessKey === "string" ? payload.accessKey : "";
  } catch {
    return NextResponse.json({ status: "error", error: "invalid_request" }, { status: 400 });
  }

  if (!safeEqual(submittedKey, accessKey)) {
    const current = failedAttempts.get(address);
    failedAttempts.set(address, {
      count: current && current.resetAt > now ? current.count + 1 : 1,
      resetAt: current && current.resetAt > now ? current.resetAt : now + 15 * 60 * 1000,
    });
    return NextResponse.json({ status: "error", error: "admin_authentication_failed" }, { status: 401 });
  }

  failedAttempts.delete(address);
  const expiresAt = String(Math.floor(now / 1000) + SESSION_TTL_SECONDS);
  const signature = sessionSignature(expiresAt, sessionSecret);
  const response = NextResponse.json({ status: "ok", expiresAt: Number(expiresAt) });
  response.cookies.set(COOKIE_NAME, expiresAt + "." + signature, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
