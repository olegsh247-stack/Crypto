import test from "node:test";
import assert from "node:assert/strict";
import { parseYahooDxyChart, runCapture, sha256 } from "./capture-btc-dxy-candidate.mjs";

const now = new Date("2026-10-13T16:00:00.000Z");
const dates = ["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-12", "2026-10-13"];
const timestamps = dates.map(date => Math.floor(new Date(`${date}T12:00:00.000Z`).getTime() / 1000));
const closes = dates.map((_, index) => 100 + index);
const payload = {
  chart: {
    error: null,
    result: [{
      meta: { symbol: "DX-Y.NYB", exchangeName: "NYB", exchangeTimezoneName: "America/New_York" },
      timestamp: timestamps,
      indicators: { quote: [{ close: closes }] }
    }]
  }
};
const body = JSON.stringify(payload);

test("DXY candidate calculates five observed-session change and excludes current New York date", () => {
  const result = parseYahooDxyChart(body, { now, rawSha256: sha256(body) });
  assert.equal(result.latest_completed_session_date_new_york, "2026-10-12");
  assert.equal(result.completed_session_count, 8);
  assert.equal(result.latest_completed_close, 107);
  assert.equal(result.close_five_sessions_prior, 102);
  assert.equal(result.five_session_change, 107 / 102 - 1);
  assert.equal(result.acceptance_status, "CANDIDATE_ONLY");
  assert.equal(result.freshness_gate, "BLOCKED_SOURCE_CONTRACT_REVIEW");
  assert.equal(result.raw_body_sha256, sha256(body));
});

test("DXY parser rejects wrong symbol and malformed series", () => {
  const wrongSymbol = structuredClone(payload);
  wrongSymbol.chart.result[0].meta.symbol = "DX=F";
  assert.throws(() => parseYahooDxyChart(wrongSymbol, { now }), /symbol_mismatch/);
  const malformed = structuredClone(payload);
  malformed.chart.result[0].indicators.quote[0].close.pop();
  assert.throws(() => parseYahooDxyChart(malformed, { now }), /series_shape_invalid/);
});

test("DXY parser rejects invalid closes and future timestamps", () => {
  const invalidClose = structuredClone(payload);
  invalidClose.chart.result[0].indicators.quote[0].close[0] = -1;
  assert.throws(() => parseYahooDxyChart(invalidClose, { now }), /close_invalid/);
  const future = structuredClone(payload);
  future.chart.result[0].timestamp[0] = Math.floor(new Date("2026-10-14T12:00:00Z").getTime() / 1000);
  assert.throws(() => parseYahooDxyChart(future, { now }), /future_timestamp/);
});

test("read-only DXY capture preserves payload and never claims production access", async () => {
  const fetchImpl = async () => new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  const result = await runCapture({ fetchImpl, now });
  assert.equal(result.status, "PASS_CANDIDATE_ONLY");
  assert.equal(result.parsed.acceptance_status, "CANDIDATE_ONLY");
  assert.equal(result.evidence.raw_body_sha256, sha256(body));
  assert.equal(result.evidence.raw_body, body);
});
