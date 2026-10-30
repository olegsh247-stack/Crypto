import { NextRequest, NextResponse } from "next/server";
import { adminCsrfCookie, adminOriginAllowed, adminSessionCookie, csrfMatches, validAdminSession } from "../../../../lib/admin-session";

export const runtime = "nodejs";
const API_BASE = process.env.CRYPTO_API_URL;
const ADMIN_TOKEN = process.env.CRYPTO_ADMIN_TOKEN;

function allowed(path: string[], method: string): boolean {
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

async function handle(request: NextRequest, path: string[]) {
  if (!allowed(path, request.method)) {
    return NextResponse.json({ status: "error", error: "admin_route_not_allowed" }, { status: 404 });
  }
  if (!validAdminSession(request.cookies.get(adminSessionCookie)?.value)) {
    return NextResponse.json({ status: "error", error: "admin_session_required" }, { status: 401 });
  }
  if (request.method !== "GET") {
    if (!adminOriginAllowed(request) || !csrfMatches(request.cookies.get(adminCsrfCookie)?.value, request.headers.get("x-crypto-admin-csrf"))) {
      return NextResponse.json({ status: "error", error: "admin_csrf_rejected" }, { status: 403 });
    }
  }
  if (!API_BASE || !ADMIN_TOKEN) {
    return NextResponse.json({ status: "error", error: "admin_proxy_not_configured" }, { status: 503 });
  }
  const url = new URL("/api/" + path.join("/"), API_BASE.endsWith("/") ? API_BASE : API_BASE + "/");
  const body = request.method === "GET" ? undefined : await request.text();
  const upstream = await fetch(url, {
    method: request.method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + ADMIN_TOKEN },
    body,
    cache: "no-store",
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, (await context.params).path);
}
