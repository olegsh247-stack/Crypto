import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

const env = {
  login: process.env.CRYPTO_ADMIN_LOGIN_SECRET,
  session: process.env.CRYPTO_ADMIN_SESSION_SECRET,
  origin: process.env.CRYPTO_ADMIN_ORIGIN,
  api: process.env.CRYPTO_API_URL,
  token: process.env.CRYPTO_ADMIN_TOKEN,
};
const restore = (key: string, value: string | undefined) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
};

test("admin browser session flow protects proxy and maps db-schema to the API admin route", async () => {
  process.env.CRYPTO_ADMIN_LOGIN_SECRET = "integration-login-secret-012345678901234567890123";
  process.env.CRYPTO_ADMIN_SESSION_SECRET = "integration-session-secret-012345678901234567890123";
  process.env.CRYPTO_ADMIN_ORIGIN = "https://crypto.example.test";
  process.env.CRYPTO_API_URL = "http://api:8080";
  process.env.CRYPTO_ADMIN_TOKEN = "integration-upstream-token";

  const { GET: proxyGet, POST: proxyPost } = await import("../app/api/admin/[...path]/route.ts");
  const { POST: login, DELETE: logout } = await import("../app/api/admin/session/route.ts");
  const originalFetch = globalThis.fetch;
  let upstreamUrl = "";
  let upstreamAuthorization = "";
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    upstreamUrl = String(input);
    upstreamAuthorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ status: "ok", read_only: true }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const denied = await proxyGet(
      new NextRequest("https://crypto.example.test/api/admin/db-schema"),
      { params: Promise.resolve({ path: ["db-schema"] }) },
    );
    assert.equal(denied.status, 401, "requests without a session must be denied");

    const badOrigin = await login(new NextRequest("https://crypto.example.test/api/admin/session", {
      method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ secret: "integration-login-secret-012345678901234567890123" }),
    }));
    assert.equal(badOrigin.status, 403, "login from a different origin must be denied");

    const loggedIn = await login(new NextRequest("https://crypto.example.test/api/admin/session", {
      method: "POST",
      headers: { origin: "https://crypto.example.test", "content-type": "application/json", "x-forwarded-for": "198.51.100.42" },
      body: JSON.stringify({ secret: "integration-login-secret-012345678901234567890123" }),
    }));
    assert.equal(loggedIn.status, 200, await loggedIn.clone().text());
    const sessionCookie = loggedIn.cookies.get("crypto_admin_session")?.value;
    const csrfCookie = loggedIn.cookies.get("crypto_admin_csrf")?.value;
    assert.ok(sessionCookie);
    assert.ok(csrfCookie);

    const cookie = `crypto_admin_session=${sessionCookie}; crypto_admin_csrf=${csrfCookie}`;
    const schema = await proxyGet(
      new NextRequest("https://crypto.example.test/api/admin/db-schema", { headers: { cookie } }),
      { params: Promise.resolve({ path: ["db-schema"] }) },
    );
    assert.equal(schema.status, 200);
    assert.equal(upstreamUrl, "http://api:8080/api/admin/db-schema");
    assert.equal(upstreamAuthorization, "Bearer integration-upstream-token");

    const csrfDenied = await proxyPost(
      new NextRequest("https://crypto.example.test/api/admin/assets", {
        method: "POST",
        headers: { cookie, origin: "https://crypto.example.test", "content-type": "application/json" },
        body: JSON.stringify({ symbol: "TEST", name: "Test" }),
      }),
      { params: Promise.resolve({ path: ["assets"] }) },
    );
    assert.equal(csrfDenied.status, 403, "mutations without a matching CSRF header must be denied");

    const wrongOriginDenied = await proxyPost(
      new NextRequest("https://crypto.example.test/api/admin/assets", {
        method: "POST",
        headers: { cookie, origin: "https://attacker.example", "x-crypto-admin-csrf": csrfCookie, "content-type": "application/json" },
        body: JSON.stringify({ symbol: "TEST", name: "Test" }),
      }),
      { params: Promise.resolve({ path: ["assets"] }) },
    );
    assert.equal(wrongOriginDenied.status, 403, "mutations from a different origin must be denied");

    const loggedOut = await logout(new NextRequest("https://crypto.example.test/api/admin/session", {
      method: "DELETE", headers: { origin: "https://crypto.example.test" },
    }));
    assert.equal(loggedOut.status, 200);
    assert.equal(loggedOut.cookies.get("crypto_admin_session")?.maxAge, 0);
    assert.equal(loggedOut.cookies.get("crypto_admin_csrf")?.maxAge, 0);
  } finally {
    globalThis.fetch = originalFetch;
    restore("CRYPTO_ADMIN_LOGIN_SECRET", env.login);
    restore("CRYPTO_ADMIN_SESSION_SECRET", env.session);
    restore("CRYPTO_ADMIN_ORIGIN", env.origin);
    restore("CRYPTO_API_URL", env.api);
    restore("CRYPTO_ADMIN_TOKEN", env.token);
  }
});
