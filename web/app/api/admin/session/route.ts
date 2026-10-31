import { NextRequest, NextResponse } from "next/server.js";
import { timingSafeEqual } from "node:crypto";
import { adminCsrfCookie, adminOriginAllowed, adminSessionCookie, checkAdminLoginAttempt, createAdminSession, validAdminSession } from "../../../../lib/admin-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!adminOriginAllowed(request)) return NextResponse.json({ status: "error", error: "admin_origin_rejected" }, { status: 403 });
  const loginSecret = process.env.CRYPTO_ADMIN_LOGIN_SECRET;
  const sessionSecret = process.env.CRYPTO_ADMIN_SESSION_SECRET;
  if (!loginSecret || loginSecret.length < 32 || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.json({ status: "error", error: "admin_session_not_configured" }, { status: 503 });
  }
  let body: { secret?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ status: "error", error: "invalid_json" }, { status: 400 });
  }
  const forwarded = request.headers.get("x-forwarded-for");
  const clientKey = forwarded?.split(",").map((value) => value.trim()).filter(Boolean).at(-1) ?? "unknown";
  const attempt = checkAdminLoginAttempt(clientKey);
  if (!attempt.allowed) {
    const response = NextResponse.json({ status: "error", error: "admin_login_rate_limited" }, { status: 429 });
    response.headers.set("Retry-After", String(attempt.retryAfterSeconds));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const supplied = typeof body.secret === "string" ? body.secret : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(loginSecret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ status: "error", error: "admin_login_rejected" }, { status: 401 });
  }
  checkAdminLoginAttempt(clientKey, true);
  const session = createAdminSession();
  if (!session) return NextResponse.json({ status: "error", error: "admin_session_not_configured" }, { status: 503 });
  const secure = process.env.CRYPTO_ADMIN_ORIGIN?.startsWith("https://") ?? true;
  const response = NextResponse.json({ status: "ok", csrfToken: session.csrf });
  response.cookies.set(adminSessionCookie, session.token, { httpOnly: true, secure, sameSite: "strict", path: "/api/admin", maxAge: session.maxAge });
  response.cookies.set(adminCsrfCookie, session.csrf, { httpOnly: false, secure, sameSite: "strict", path: "/", maxAge: session.maxAge });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!adminOriginAllowed(request)) return NextResponse.json({ status: "error", error: "admin_origin_rejected" }, { status: 403 });
  const secure = process.env.CRYPTO_ADMIN_ORIGIN?.startsWith("https://") ?? true;
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(adminSessionCookie, "", { httpOnly: true, secure, sameSite: "strict", path: "/api/admin", maxAge: 0 });
  response.cookies.set(adminCsrfCookie, "", { httpOnly: false, secure, sameSite: "strict", path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const authenticated = validAdminSession(request.cookies.get(adminSessionCookie)?.value);
  const response = NextResponse.json({ status: "ok", authenticated });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
