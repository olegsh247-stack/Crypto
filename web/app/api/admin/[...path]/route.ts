import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CRYPTO_API_URL;
const ADMIN_TOKEN = process.env.CRYPTO_ADMIN_TOKEN;
const SESSION_SECRET = process.env.CRYPTO_ADMIN_SESSION_SECRET ?? ADMIN_TOKEN;
const COOKIE_NAME = "crypto_admin_session";
const MAX_BODY_BYTES = 16 * 1024;

async function readBodyLimited(request: NextRequest, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hasValidSession(request: NextRequest) {
  if (!SESSION_SECRET) return false;
  const value = request.cookies.get(COOKIE_NAME)?.value ?? "";
  const [expiresAt, signature, extra] = value.split(".");
  if (!expiresAt || !signature || extra !== undefined || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", SESSION_SECRET).update("crypto-admin-session:" + expiresAt).digest("hex");
  return safeEqual(signature, expected);
}

function sameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin
    && request.headers.get("sec-fetch-site") !== "cross-site";
}

function resolveBackendPath(path: string[], method: string) {
  if (path.length < 1 || path.length > 2) return null;
  const [resource, id] = path;
  if (!["assets", "pairs", "commodities"].includes(resource)) return null;
  if (id !== undefined && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  if (method === "POST" && id === undefined) return "/api/" + resource;
  if (method === "DELETE" && id !== undefined) return "/api/" + resource + "/" + id;
  return null;
}

async function forward(request: NextRequest, path: string[]) {
  if (!API_BASE || !ADMIN_TOKEN || !SESSION_SECRET) {
    return NextResponse.json({ status: "error", error: "admin_proxy_not_configured" }, { status: 503 });
  }
  if (!hasValidSession(request)) {
    return NextResponse.json({ status: "error", error: "admin_session_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ status: "error", error: "same_origin_required" }, { status: 403 });
  }

  const backendPath = resolveBackendPath(path, request.method);
  if (!backendPath) {
    return NextResponse.json({ status: "error", error: "admin_route_not_allowed" }, { status: 404 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "error", error: "request_too_large" }, { status: 413 });
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBodyLimited(request, MAX_BODY_BYTES);
  if (body === null) return NextResponse.json({ status: "error", error: "request_too_large" }, { status: 413 });

  const base = API_BASE.endsWith("/") ? API_BASE : API_BASE + "/";
  const url = new URL(backendPath.replace(/^\//, ""), base);
  const response = await fetch(url, {
    method: request.method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + ADMIN_TOKEN },
    body,
    cache: "no-store",
  });
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, path);
}
