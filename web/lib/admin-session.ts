import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "crypto_admin_session";
const CSRF_COOKIE = "crypto_admin_csrf";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkAdminLoginAttempt(key: string, success = false): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  for (const [candidate, state] of loginAttempts) {
    if (state.resetAt <= now) loginAttempts.delete(candidate);
  }
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}


function secret(name: string): string | null {
  const value = process.env[name];
  return value && value.length >= 32 ? value : null;
}

function signature(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSession() {
  const key = secret("CRYPTO_ADMIN_SESSION_SECRET");
  if (!key) return null;
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${expires}.${nonce}`;
  const token = `${payload}.${signature(payload, key)}`;
  const csrf = randomBytes(24).toString("base64url");
  return { token, csrf, maxAge: SESSION_TTL_SECONDS };
}

export function validAdminSession(token: string | undefined): boolean {
  const key = secret("CRYPTO_ADMIN_SESSION_SECRET");
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresText, nonce, supplied] = parts;
  if (!/^\d+$/.test(expiresText) || !/^[A-Za-z0-9_-]{20,}$/.test(nonce)) return false;
  const expires = Number(expiresText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expires) || expires <= now || expires > now + SESSION_TTL_SECONDS) return false;
  return safeEqual(supplied, signature(`${expiresText}.${nonce}`, key));
}

export function adminRouteAllowed(path: string[], method: string): boolean {
  const route = path.join("/");
  if (method === "GET") return route === "db-schema";
  if (method === "POST") return ["assets", "pairs", "commodities"].includes(route);
  if (method === "DELETE") {
    return /^assets\/[a-z0-9_-]{1,80}$/i.test(route)
      || /^pairs\/[0-9a-f-]{36}$/i.test(route)
      || /^commodities\/[0-9a-f-]{36}$/i.test(route);
  }
  return false;
}

export function csrfMatches(cookie: string | undefined, header: string | null): boolean {
  return !!cookie && !!header && safeEqual(cookie, header);
}

export function adminOriginAllowed(request: Request): boolean {
  const expected = process.env.CRYPTO_ADMIN_ORIGIN;
  const origin = request.headers.get("origin");
  if (!expected || !origin) return false;
  try {
    return new URL(origin).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

export const adminSessionCookie = SESSION_COOKIE;
export const adminCsrfCookie = CSRF_COOKIE;
