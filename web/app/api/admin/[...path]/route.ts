import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CRYPTO_API_URL;
const ADMIN_TOKEN = process.env.CRYPTO_ADMIN_TOKEN;

async function forward(request: NextRequest, path: string) {
  if (!API_BASE || !ADMIN_TOKEN) {
    return NextResponse.json({ status: "error", error: "admin_proxy_not_configured" }, { status: 503 });
  }
  const url = new URL(path, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/");
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await fetch(url, {
    method: request.method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + ADMIN_TOKEN },
    body,
    cache: "no-store",
  });
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, "/api/" + path.join("/"));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, "/api/" + path.join("/"));
}
