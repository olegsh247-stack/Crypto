import test from "node:test";
import assert from "node:assert/strict";
import { parseCryptoEtfBtcFlows, capture, sha256 } from "./capture-btc-etf-flow-candidate.mjs";

const now = new Date("2026-10-13T12:00:00.000Z");
const body = JSON.stringify({
  symbol: "BTC",
  asset: "bitcoin",
  windowDays: 30,
  updatedAt: "2026-10-13T00:01:20.000Z",
  days: [
    { date: "2026-10-06", netFlowUsdM: 10.2 },
    { date: "2026-10-07", netFlowUsdM: -4.1 },
    { date: "2026-10-08", netFlowUsdM: 0 },
    { date: "2026-10-09", netFlowUsdM: 21.1 }
  ]
});

test("ETF parser preserves units, values and provider timestamps without conflating updatedAt with publication", () => {
  const parsed = parseCryptoEtfBtcFlows(body, { now, rawSha256: sha256(body) });
  assert.equal(parsed.source_id_candidate, "institutional.cryptoetf_today");
  assert.equal(parsed.unit, "USD million/day");
  assert.equal(parsed.latest_flow_date_utc, "2026-10-09");
  assert.equal(parsed.latest_flow_usd_million, 21.1);
  assert.equal(parsed.provider_updated_at, "2026-10-13T00:01:20.000Z");
  assert.equal(parsed.publication_timestamp_available_per_latest_row, false);
  assert.equal(parsed.freshness_gate, "BLOCKED");
  assert.match(parsed.freshness_blockers.join(" "), /per-row publication timestamp/);
  assert.equal(parsed.acceptance_status, "CANDIDATE_ONLY");
  assert.equal(parsed.production_writes_performed, false);
});

test("ETF parser rejects duplicate dates, invalid values and schema drift", () => {
  const duplicate = JSON.parse(body);
  duplicate.days.push({ date: "2026-10-09", netFlowUsdM: 99 });
  assert.throws(() => parseCryptoEtfBtcFlows(duplicate, { now }), /duplicate_date/);
  const invalid = JSON.parse(body);
  invalid.days[0].netFlowUsdM = "missing";
  assert.throws(() => parseCryptoEtfBtcFlows(invalid, { now }), /row_invalid/);
  assert.throws(() => parseCryptoEtfBtcFlows({ symbol: "ETH", days: [] }, { now }), /schema_mismatch/);
});

test("ETF parser never fills absent trading dates with zero", () => {
  const parsed = parseCryptoEtfBtcFlows(body, { now });
  assert.deepEqual(parsed.days.map(row => row.date_utc), ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"]);
  assert.equal(parsed.days.length, 4);
});

test("capture without a key makes no request and fails closed", async () => {
  let calls = 0;
  const result = await capture({ apiKey: "", fetchImpl: async () => { calls++; throw new Error("must not call"); }, now });
  assert.equal(calls, 0);
  assert.equal(result.capture_status, "BLOCKED_NO_CREDENTIAL");
  assert.equal(result.production_database_accessed, false);
  assert.equal(result.production_writes_performed, false);
});

test("capture hashes raw response and never returns credentials", async () => {
  const result = await capture({
    apiKey: "test-only-secret",
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers.authorization, "Bearer test-only-secret");
      return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
    },
    now
  });
  assert.equal(result.capture_status, "PASS_CANDIDATE_ONLY");
  assert.equal(result.evidence.raw_body_sha256, sha256(body));
  assert.equal(JSON.stringify(result).includes("test-only-secret"), false);
});
test("ETF freshness uses an explicit row publication timestamp when present", () => {
  const withPublication = JSON.parse(body);
  withPublication.days[withPublication.days.length - 1] = {
    date: "2026-10-12",
    netFlowUsdM: 14.2,
    publishedAt: "2026-10-13T05:00:00.000Z"
  };
  const parsed = parseCryptoEtfBtcFlows(withPublication, { now });
  assert.equal(parsed.publication_timestamp_available_per_latest_row, true);
  assert.equal(parsed.latest_freshness_timestamp_utc, "2026-10-13T05:00:00.000Z");
  assert.equal(parsed.latest_freshness_age_hours, 7);
  assert.equal(parsed.freshness_gate, "PASS_CANDIDATE_ONLY");
});
