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
