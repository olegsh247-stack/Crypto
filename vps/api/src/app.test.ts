import assert from "node:assert/strict";
import test from "node:test";
import app from "./app.js";
import { closePool } from "@crypto/vps-runtime";

test("unknown API routes return 404 instead of a success fallback", async () => {
  const env = { DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/crypto_test" };
  try {
    const response = await app.fetch(new Request("http://localhost/api/not-a-real-route"), env);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { status: "error", error: "not_found" });
  } finally {
    await closePool();
  }
});

test("CORS fails closed when the allowed origin is missing or wildcard", async () => {
  const request = new Request("http://localhost/api/not-a-real-route", {
    method: "OPTIONS",
    headers: { Origin: "https://untrusted.example" },
  });
  for (const env of [
    { DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/crypto_test" },
    { DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/crypto_test", CORS_ORIGIN: "*" },
  ]) {
    const response = await app.fetch(request, env);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
});

test("CORS returns only the configured exact origin", async () => {
  const response = await app.fetch(
    new Request("http://localhost/api/not-a-real-route", {
      method: "OPTIONS",
      headers: { Origin: "https://crypto.example.com" },
    }),
    {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/crypto_test",
      CORS_ORIGIN: "https://crypto.example.com",
    },
  );
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://crypto.example.com");
  assert.equal(response.headers.get("Vary"), "Origin");
});
