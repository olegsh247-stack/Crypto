import test from "node:test";
import assert from "node:assert/strict";
import { prepareBtcSoSoValueEtfCandidates, SOSOVALUE_SUMMARY_HISTORY_URL } from "./prepare-btc-sosovalue-etf-candidates.mjs";

const retrievedAt = "2026-10-16T06:00:00.000Z";

test("normalizes USD to USD million and keeps retrieval time separate from reporting date", () => {
  const body = JSON.stringify({ code: 0, message: "success", data: [
    { date: "2026-10-07", total_net_inflow: -486000000 },
    { date: "2026-10-06", total_net_inflow: 124500000 }
  ]});
  const result = prepareBtcSoSoValueEtfCandidates({ responseBody: body, retrievedAt });
  assert.deepEqual(result.blockers, []);
  assert.equal(result.rows[0].reporting_date, "2026-10-07");
  assert.equal(result.rows[0].value_usd_million, -486);
  assert.equal(result.rows[0].retrieved_at, retrievedAt);
  assert.equal(result.rows[0].provider_observed_at, null);
  assert.equal(result.rows[0].finalization_status, "unknown");
  assert.equal(result.persistable, false);
});

test("accepts a direct array response documented by the API", () => {
  const result = prepareBtcSoSoValueEtfCandidates({
    responseBody: JSON.stringify([{ date: "2026-10-07", total_net_inflow: 1 }]),
    retrievedAt
  });
  assert.equal(result.rows[0].value_usd_million, 0.000001);
});

test("missing values are blocked and never imputed to zero", () => {
  const result = prepareBtcSoSoValueEtfCandidates({
    responseBody: JSON.stringify([{ date: "2026-10-07", total_net_inflow: null }]),
    retrievedAt
  });
  assert.equal(result.rows[0].status, "BLOCKED_MISSING_VALUE");
  assert.equal(result.rows[0].value_usd_million, null);
});

test("duplicate reporting dates fail closed", () => {
  const result = prepareBtcSoSoValueEtfCandidates({
    responseBody: JSON.stringify([
      { date: "2026-10-07", total_net_inflow: 1 },
      { date: "2026-10-07", total_net_inflow: 2 }
    ]),
    retrievedAt
  });
  assert.equal(result.rows[0].status, "CANDIDATE");
  assert.equal(result.rows[1].status, "BLOCKED_DUPLICATE_REPORTING_DATE");
});

test("blocks malformed payloads, timestamps, endpoint, and non-200 responses", () => {
  assert.ok(prepareBtcSoSoValueEtfCandidates({ responseBody: "{", retrievedAt }).blockers.includes("RESPONSE_BODY_NOT_VALID_JSON"));
  assert.ok(prepareBtcSoSoValueEtfCandidates({ responseBody: "[]", retrievedAt: "not-a-date" }).blockers.includes("VALID_RETRIEVAL_TIMESTAMP_REQUIRED"));
  assert.ok(prepareBtcSoSoValueEtfCandidates({ responseBody: "[]", retrievedAt, requestUrl: "https://example.com/flows" }).blockers.includes("REQUEST_URL_NOT_APPROVED_SOSOVALUE_SUMMARY_HISTORY_ENDPOINT"));
  assert.ok(prepareBtcSoSoValueEtfCandidates({ responseBody: "[]", retrievedAt, httpStatus: 403 }).blockers.includes("HTTP_STATUS_NOT_200"));
});

test("preserves response-body SHA-256 for candidate provenance", () => {
  const body = JSON.stringify([{ date: "2026-10-07", total_net_inflow: -1 }]);
  const result = prepareBtcSoSoValueEtfCandidates({ responseBody: body, retrievedAt });
  assert.match(result.source_payload_sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.rows[0].source_payload_sha256, result.source_payload_sha256);
});


test("invalid calendar dates are blocked without throwing", () => {
  const result = prepareBtcSoSoValueEtfCandidates({
    responseBody: JSON.stringify([{ date: "2026-99-99", total_net_inflow: 5 }]),
    retrievedAt
  });
  assert.equal(result.rows[0].status, "BLOCKED_INVALID_REPORTING_DATE");
});
