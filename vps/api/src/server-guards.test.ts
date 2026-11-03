import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import {
  configureApiServerTimeouts,
  isRequestBodyTooLarge,
  MAX_REQUEST_BODY_BYTES,
} from "./server-guards.js";

test("request body limit accepts an ordinary body and the exact limit", () => {
  assert.equal(isRequestBodyTooLarge(undefined, 512), false);
  assert.equal(isRequestBodyTooLarge(String(MAX_REQUEST_BODY_BYTES), MAX_REQUEST_BODY_BYTES), false);
});

test("request body limit rejects a declared oversized body before buffering", () => {
  assert.equal(isRequestBodyTooLarge(String(MAX_REQUEST_BODY_BYTES + 1), 0), true);
});

test("request body limit rejects streamed bytes even without a content-length header", () => {
  assert.equal(isRequestBodyTooLarge(undefined, MAX_REQUEST_BODY_BYTES + 1), true);
});

test("invalid or absent content-length does not bypass the streamed byte limit", () => {
  assert.equal(isRequestBodyTooLarge("unknown", 0), false);
  assert.equal(isRequestBodyTooLarge("unknown", MAX_REQUEST_BODY_BYTES + 1), true);
  assert.equal(isRequestBodyTooLarge(undefined, MAX_REQUEST_BODY_BYTES), false);
});

test("API server timeout configuration is explicit and bounded", () => {
  const server = http.createServer();
  configureApiServerTimeouts(server);
  assert.equal(server.requestTimeout, 35_000);
  assert.equal(server.headersTimeout, 30_000);
  assert.equal(server.keepAliveTimeout, 5_000);
  assert.equal(server.timeout, 30_000);
  server.close();
});
