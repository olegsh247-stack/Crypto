import test from "node:test";
import assert from "node:assert/strict";
import { inspectTftcEtfJson } from "./inspect-tftc-etf-json.mjs";

test("reports structure for a valid local candidate without approving its use", () => {
  const result = inspectTftcEtfJson(Buffer.from(JSON.stringify({
    updatedThrough: "2026-10-14",
    sources: ["SoSoValue"],
    days: [
      { date: "2026-10-13", netFlowUsd: -1250000 },
      { date: "2026-10-14", netFlowUsd: 0 }
    ]
  })));
  assert.equal(result.status, "STRUCTURE_VALID_REVIEW_REQUIRED");
  assert.equal(result.row_count, 2);
  assert.equal(result.numeric_net_flow_rows, 2);
  assert.equal(result.zero_value_rows, 1);
  assert.equal(result.min_reporting_date, "2026-10-13");
  assert.equal(result.max_reporting_date, "2026-10-14");
  assert.equal(result.publication_timestamp, null);
  assert.equal(result.finality, "unknown");
  assert.equal(result.production_writes_performed, false);
  assert.equal(result.network_access_performed, false);
  assert.deepEqual(result.upstream_lineage, ["SoSoValue"]);
});

test("fails closed on unrecognized JSON schema", () => {
  const result = inspectTftcEtfJson(Buffer.from(JSON.stringify({ results: [{ date: "2026-10-14", netFlowUsd: 1 }] })));
  assert.equal(result.status, "BLOCKED_UNRECOGNIZED_TOP_LEVEL_SCHEMA");
});

test("flags missing values and does not convert them to zero", () => {
  const result = inspectTftcEtfJson(Buffer.from(JSON.stringify({ days: [
    { date: "2026-10-14", netFlowUsd: null }
  ] })));
  assert.equal(result.status, "BLOCKED_DATA_QUALITY");
  assert.deepEqual(result.missing_value_row_indexes, [0]);
  assert.equal(result.zero_value_rows, 0);
});

test("flags duplicate dates, invalid dates, and nonnumeric values", () => {
  const result = inspectTftcEtfJson(Buffer.from(JSON.stringify({ data: [
    { date: "2026-10-14", netFlowUsd: 5 },
    { date: "2026-10-14", netFlowUsd: "5" },
    { date: "2026-02-30", netFlowUsd: 0 }
  ] })));
  assert.equal(result.status, "BLOCKED_DATA_QUALITY");
  assert.deepEqual(result.duplicate_reporting_dates, ["2026-10-14"]);
  assert.deepEqual(result.invalid_date_row_indexes, [2]);
  assert.deepEqual(result.invalid_value_row_indexes, [1]);
});

test("rejects malformed JSON without throwing", () => {
  const result = inspectTftcEtfJson(Buffer.from("{"));
  assert.equal(result.status, "BLOCKED_INVALID_JSON");
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});
