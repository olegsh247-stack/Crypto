#!/usr/bin/env node
/**
 * Reproducible offline BTC scenario rehearsal.
 * Uses a committed historical test fixture only: no network, DB, ingestion,
 * scenario-state persistence, monitoring writes, or probability mutation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateBtcScenarioV1 } from "./btc-scenario-direction.mjs";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/btc-offline-scenario-v1.json", import.meta.url), "utf8"));
assert.equal(fixture.not_live, true);
assert.equal(fixture.not_database_observations, true);
assert.equal(fixture.not_approved_for_ingestion, true);

const p = fixture.provenance;
const flows = Object.values(p.etf_daily_net_flows_usd_millions).reduce((sum, value) => sum + value, 0);
const priceReturn = (p.btc_spot_close_end_usd / p.btc_spot_close_start_usd - 1) * 100;
const dxyChange = (p.dxy_close_end / p.dxy_close_start - 1) * 100;
const feeRatio = p.fee_total_btc / p.subsidy_per_block_btc;
const near = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-9, label + " does not match fixture provenance");

near(flows, fixture.derived_inputs.etf_net_flow_5d_usd_millions, "ETF five-session sum");
near(priceReturn, fixture.derived_inputs.price_return_7d_pct, "BTC price return");
near(dxyChange, fixture.derived_inputs.dxy_change_5d_pct, "DXY change");
near(feeRatio, fixture.derived_inputs.fee_subsidy_ratio, "fee/subsidy ratio");

const result = evaluateBtcScenarioV1({
  readiness_status: fixture.derived_inputs.readiness_status,
  price_return_7d_pct: priceReturn,
  etf_net_flow_5d_usd_millions: flows,
  hashrate_change_7d_pct: p.hashrate_change_7d_pct,
  dxy_change_5d_pct: dxyChange,
  fee_subsidy_ratio: feeRatio,
});
for (const [key, expected] of Object.entries(fixture.expected)) {
  assert.equal(result[key], expected, "unexpected scenario output for " + key);
}
console.log(JSON.stringify({
  mode: "historical_test",
  fresh_market_data_required: false,
  fixture_id: fixture.fixture_id,
  fixture_type: fixture.fixture_type,
  live_data_used: false,
  database_accessed: false,
  database_writes_performed: false,
  scenario_state_persisted: false,
  monitoring_events_written: false,
  output: result,
  note: "Historical test data is intentionally not fresh. This deterministic offline rehearsal does not establish current input freshness or current BTC scenario readiness; do not fetch fresh market data to satisfy this test."
}, null, 2));
