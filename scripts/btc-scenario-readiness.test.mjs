import test from "node:test";
import assert from "node:assert/strict";
import { assessBtcScenarioReadiness } from "./btc-scenario-readiness.mjs";

const now = new Date("2026-10-12T12:00:00.000Z");
const units = {
  "market.spot_price": "USD/BTC",
  "security.hashrate": "EH/s",
  "security.fee_subsidy_ratio": "ratio",
  "macro.dxy": "index",
  "institutional.etf_net_flow": "USD million/day",
};
const canonicalSources = {
  "market.spot_price": "market.kraken",
  "security.hashrate": "network.primary",
  "security.fee_subsidy_ratio": "network.primary",
  "macro.dxy": "macro.primary",
  "institutional.etf_net_flow": "institutional.primary",
};
const row = (metric_id, observed_at, value_numeric = 1, sourceId = canonicalSources[metric_id]) => ({
  metric_id, observed_at, value_numeric, freshness: "CURRENT",
  source_id: sourceId, source_url: "https://example.com/data",
  source_registered: true, unit: units[metric_id], expected_unit: units[metric_id],
});

function completeInputs() {
  return [
    row("market.spot_price", "2026-10-12T11:00:00.000Z", 80000),
    row("security.hashrate", "2026-10-12T00:00:00.000Z", 1000),
    row("security.fee_subsidy_ratio", "2026-10-11T00:00:00.000Z", 0.2),
    row("macro.dxy", "2026-10-11T00:00:00.000Z", 99),
    ...[
      ["2026-10-12", 10], ["2026-10-11", 20], ["2026-10-10", -5],
      ["2026-10-09", 8], ["2026-10-08", 2],
    ].map(([day, value]) => row("institutional.etf_net_flow", day+"T00:00:00.000Z", value)),
  ];
}

test("fresh inputs still block while no canonical DXY source is approved", () => {
  const result = assessBtcScenarioReadiness(completeInputs(), now);
  assert.equal(result.status, "not_evaluable");
  assert.equal(result.can_persist_scenario_state, false);
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy" && x.reason === "source_not_approved_for_metric"));
  assert.equal(result.selected_inputs["market.spot_price"].source_id, "market.kraken");
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});


test("historical ETF sessions count toward the five-day series even when they are no longer fresh latest inputs", () => {
  const inputs = completeInputs().map(x =>
    x.metric_id === "institutional.etf_net_flow" && x.observed_at < "2026-10-12T00:00:00.000Z"
      ? { ...x, freshness: "STALE" }
      : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy" && x.reason === "source_not_approved_for_metric"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});

test("missing fee-market metric blocks evaluation", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "security.fee_subsidy_ratio");
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "security.fee_subsidy_ratio" && x.reason === "missing"));
});

test("stale observation cannot pass even with a source URL", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, observed_at: "2026-10-10T11:00:00.000Z" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"));
});

test("ETF flows need five distinct recent days", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "institutional.etf_net_flow");
  inputs.push(
    row("institutional.etf_net_flow", "2026-10-12T01:00:00.000Z", 10),
    row("institutional.etf_net_flow", "2026-10-12T02:00:00.000Z", 20),
    row("institutional.etf_net_flow", "2026-10-11T00:00:00.000Z", 3),
  );
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"));
});

test("stale latest ETF flow blocks instead of falling back to five older current days", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "institutional.etf_net_flow");
  inputs.push(
    row("institutional.etf_net_flow", "2026-10-12T01:00:00.000Z", 10),
    row("institutional.etf_net_flow", "2026-10-11T01:00:00.000Z", 20),
    row("institutional.etf_net_flow", "2026-10-10T01:00:00.000Z", 30),
    row("institutional.etf_net_flow", "2026-10-09T01:00:00.000Z", 40),
    row("institutional.etf_net_flow", "2026-10-08T01:00:00.000Z", 50),
    { ...row("institutional.etf_net_flow", "2026-10-12T02:00:00.000Z", 60), freshness: "STALE" },
  );
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
});

test("future-dated observations are rejected", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, observed_at: "2026-10-13T00:00:00.000Z" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"));
});

test("untraceable observations are rejected", () => {
  const inputs = completeInputs().map(x => x.metric_id === "macro.dxy"
    ? { ...x, source_url: null } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy"));
});


test("unregistered source cannot pass even with an HTTPS URL", () => {
  const inputs = completeInputs().map(x => x.metric_id === "security.hashrate"
    ? { ...x, source_registered: false } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "security.hashrate" && x.reason === "source_not_registered"));
});

test("registered but unapproved ETF mirror cannot pass canonical-source gate", () => {
  const inputs = completeInputs().map(x => x.metric_id === "institutional.etf_net_flow"
    ? { ...x, source_id: "institutional.tftc" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});

test("non-canonical unit cannot pass readiness", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, unit: "USDT/BTC" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price" && x.reason === "unit_mismatch"));
});


test("metric registry unit drift blocks readiness", () => {
  const inputs = completeInputs().map(x => x.metric_id === "macro.dxy"
    ? { ...x, expected_unit: "USD/BTC" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy" && x.reason === "metric_unit_contract_mismatch"));
});
