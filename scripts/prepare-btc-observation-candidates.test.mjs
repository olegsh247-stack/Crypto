import test from "node:test";
import assert from "node:assert/strict";
import { prepareBtcObservationCandidates } from "./prepare-btc-observation-candidates.mjs";

const hash = "b".repeat(64);
const manifest = (overrides = {}) => ({
  schema_version: 1,
  asset_id: "btc",
  retrieved_at: "2026-10-14T16:53:33.900Z",
  production_database_accessed: false,
  production_writes_performed: false,
  sources: [{
    name: "kraken-xbtusd-trades",
    metric_id: "market.spot_price",
    source_id: "market.kraken",
    url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
    status: "CAPTURED",
    retrieved_at: "2026-10-14T16:53:33.900Z",
    body_file: "kraken-xbtusd-trades.raw",
    body_sha256: hash,
    source_payload_sha256: hash,
    quote_unit: "USD/BTC",
    latest_trade_price_usd_per_btc: 81826.7,
    latest_trade_observed_at: "2026-10-14T16:53:33.584Z",
    observed_at: "2026-10-14T16:53:33.584Z",
    source_row_key: "XBTUSD:1791996813.584:81826.7:0.001: b",
    methodology: "kraken-public-trades-latest-trade-v1",
    methodology_version: "1",
    ...overrides
  }]
});

test("maps canonical Kraken capture into a review-only normalized observation", () => {
  const result = prepareBtcObservationCandidates(manifest());
  assert.equal(result.candidates.length, 1);
  assert.equal(result.blocked.length, 0);
  const candidate = result.candidates[0];
  assert.equal(candidate.asset_id, "btc");
  assert.equal(candidate.metric_id, "market.spot_price");
  assert.equal(candidate.value_numeric, 81826.7);
  assert.equal(candidate.unit, "USD/BTC");
  assert.equal(candidate.observed_at, "2026-10-14T16:53:33.584Z");
  assert.equal(candidate.retrieved_at, "2026-10-14T16:53:33.900Z");
  assert.equal(candidate.source_payload_sha256, hash);
  assert.equal(candidate.persistable, false);
  assert.equal(result.production_writes_performed, false);
});

test("blocks capture without a stable row key or valid payload hash", () => {
  const result = prepareBtcObservationCandidates(manifest({ source_row_key: "", source_payload_sha256: "bad" }));
  assert.equal(result.candidates.length, 0);
  assert.deepEqual(result.blocked[0].reasons, ["source_row_key_missing", "source_payload_sha256_missing_or_invalid"]);
});

test("does not accept USDT cross-checks as canonical USD/BTC observations", () => {
  const candidate = manifest({
    source_id: "market.okx",
    url: "https://www.okx.com/api/v5/market/trades?instId=BTC-USDT&limit=500",
    quote_unit: "USDT/BTC"
  });
  const result = prepareBtcObservationCandidates(candidate);
  assert.equal(result.candidates.length, 0);
});

test("keeps ETF capture blocked until row-level values and reporting dates are normalized", () => {
  const result = prepareBtcObservationCandidates({
    sources: [{ metric_id: "institutional.etf_net_flow", source_id: "institutional.primary", status: "CAPTURED" }]
  });
  assert.equal(result.candidates.length, 0);
  assert.deepEqual(result.blocked[0].reasons, ["row_level_values_and_provider_reporting_dates_not_yet_normalized"]);
});
