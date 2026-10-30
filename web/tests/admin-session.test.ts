import test from "node:test";
import assert from "node:assert/strict";
import {
  adminOriginAllowed,
  createAdminSession,
  csrfMatches,
  validAdminSession,
} from "../lib/admin-session.ts";

const original = {
  login: process.env.CRYPTO_ADMIN_LOGIN_SECRET,
  session: process.env.CRYPTO_ADMIN_SESSION_SECRET,
  origin: process.env.CRYPTO_ADMIN_ORIGIN,
};

test.before(() => {
  process.env.CRYPTO_ADMIN_LOGIN_SECRET = "test-login-secret-012345678901234567890123";
  process.env.CRYPTO_ADMIN_SESSION_SECRET = "test-session-secret-012345678901234567890123";
  process.env.CRYPTO_ADMIN_ORIGIN = "https://crypto.example.test";
});

test.after(() => {
  for (const [key, value] of Object.entries({
    CRYPTO_ADMIN_LOGIN_SECRET: original.login,
    CRYPTO_ADMIN_SESSION_SECRET: original.session,
    CRYPTO_ADMIN_ORIGIN: original.origin,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("creates a signed session accepted by the verifier", () => {
  const session = createAdminSession();
  assert.ok(session);
  assert.equal(validAdminSession(session.token), true);
});

test("rejects missing, malformed, and tampered sessions", () => {
  const session = createAdminSession();
  assert.ok(session);
  assert.equal(validAdminSession(undefined), false);
  assert.equal(validAdminSession("not-a-session"), false);
  assert.equal(validAdminSession(session.token + "x"), false);
});

test("requires an exact CSRF cookie/header match", () => {
  assert.equal(csrfMatches("token-1", "token-1"), true);
  assert.equal(csrfMatches("token-1", "token-2"), false);
  assert.equal(csrfMatches(undefined, "token-1"), false);
  assert.equal(csrfMatches("token-1", null), false);
});

test("allows only the configured request origin", () => {
  assert.equal(adminOriginAllowed(new Request("https://crypto.example.test/api/admin/assets", {
    headers: { origin: "https://crypto.example.test" },
  })), true);
  assert.equal(adminOriginAllowed(new Request("https://crypto.example.test/api/admin/assets", {
    headers: { origin: "https://attacker.example" },
  })), false);
  assert.equal(adminOriginAllowed(new Request("https://crypto.example.test/api/admin/assets")), false);
});
