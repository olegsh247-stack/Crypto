import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminOriginAllowed, adminSessionCookie, adminSessionId, createAdminSession } from "../../../../lib/admin-session";

export const runtime = "nodejs";

const API_BASE = process.env.CRYPTO_API_URL;
const ADMIN_TOKEN = process.env.CRYPTO_ADMIN_TOKEN;

async function securityApi(path: string, method: string, payload?: Record<string, unknown>) {
  if (!API_BASE || !ADMIN_TOKEN) throw new Error("admin_security_api_not_configured");
  const url = new URL(path, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/");
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + ADMIN_TOKEN,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { response, data };
}

function clientKeyHash(request: NextRequest) {
  // Caddy supplies X-Real-IP at the trusted reverse-proxy boundary.
  // Only the hash is persisted; raw client addresses are not stored.
  const address = request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",").map((value) => value.trim()).at(-1)
    ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}

function clearSessionCookies(response: NextResponse, secure: boolean) {
  response.cookies.set(adminSessionCookie, "", { httpOnly: true, secure, sameSite: "strict", path: "/api/admin", maxAge: 0 });
  response.cookies.set(adminCsrfCookie, "", { httpOnly: false, secure, sameSite: "strict", path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!adminOriginAllowed(request)) return NextResponse.json({ status: "error", error: "admin_origin_rejected" }, { status: 403 });
  const loginSecret = process.env.CRYPTO_ADMIN_LOGIN_SECRET;
  const sessionSecret = process.env.CRYPTO_ADMIN_SESSION_SECRET;
  if (!loginSecret || loginSecret.length < 32 || !sessionSecret || sessionSecret.length < 32 || !API_BASE || !ADMIN_TOKEN) {
    return NextResponse.json({ status: "error", error: "admin_session_not_configured" }, { status: 503 });
  }
  let body: { secret?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ status: "error", error: "invalid_json" }, { status: 400 });
  }

  const keyHash = clientKeyHash(request);
  let rate: Awaited<ReturnType<typeof securityApi>>;
  try {
    rate = await securityApi("/api/admin/security/login-attempt", "POST", { key_hash: keyHash, action: "attempt" });
  } catch {
    return NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503 });
  }
  if (!rate.response.ok) {
    return NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503 });
  }
  if (rate.data.allowed !== true) {
    const retry = Math.max(1, Number(rate.data.retry_after_seconds) || 900);
    const response = NextResponse.json({ status: "error", error: "admin_login_rate_limited" }, { status: 429 });
    response.headers.set("Retry-After", String(retry));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const supplied = typeof body.secret === "string" ? body.secret : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(loginSecret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ status: "error", error: "admin_login_rejected" }, { status: 401 });
  }

  try {
    const reset = await securityApi("/api/admin/security/login-attempt", "POST", { key_hash: keyHash, action: "success" });
    if (!reset.response.ok) throw new Error("rate_limit_reset_failed");
  } catch {
    return NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503 });
  }

  const session = createAdminSession();
  if (!session) return NextResponse.json({ status: "error", error: "admin_session_not_configured" }, { status: 503 });
  const sessionId = adminSessionId(session.token);
  if (!sessionId) return NextResponse.json({ status: "error", error: "admin_session_creation_failed" }, { status: 500 });
  try {
    const registered = await securityApi("/api/admin/security/sessions", "POST", {
      session_id: sessionId,
      expires_at: new Date(Date.now() + session.maxAge * 1000).toISOString(),
    });
    if (!registered.response.ok) throw new Error("session_registration_failed");
  } catch {
    return NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503 });
  }

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
  const sessionId = adminSessionId(request.cookies.get(adminSessionCookie)?.value);
  let response: NextResponse;
  if (sessionId) {
    try {
      const revoked = await securityApi("/api/admin/security/sessions/" + encodeURIComponent(sessionId), "DELETE");
      if (!revoked.response.ok) throw new Error("session_revocation_failed");
      response = NextResponse.json({ status: "ok" });
    } catch {
      response = NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503 });
    }
  } else {
    response = NextResponse.json({ status: "ok" });
  }
  return clearSessionCookies(response, secure);
}

export async function GET(request: NextRequest) {
  const sessionId = adminSessionId(request.cookies.get(adminSessionCookie)?.value);
  if (!sessionId) {
    const response = NextResponse.json({ status: "ok", authenticated: false });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  try {
    const result = await securityApi("/api/admin/security/sessions/" + encodeURIComponent(sessionId), "GET");
    if (!result.response.ok) throw new Error("admin_security_store_unavailable");
    const response = NextResponse.json({ status: "ok", authenticated: result.data.active === true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ status: "error", error: "admin_security_store_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
