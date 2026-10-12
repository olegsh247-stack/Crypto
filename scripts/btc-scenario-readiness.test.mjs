import test from "node:test";
import assert from "node:assert/strict";
import { assessBtcScenarioReadiness } from "./btc-scenario-readiness.mjs";

const now = new Date("2026-10-12T12:00:00.000Z");
const row = (metric_id, observed_at, value_numeric = 1) => ({
  metric_id, observed_at, value_numeric, freshness: "CURRENT",
  source_id: "source.test", source_url: "https://example.com/data",
});

function completeInputs() {
  return [
    row("market.spot_price", "2026-10-12T11:00:00.000Z", 80000),
    row("security.hashrate", "2026-10-12T00:00:00.000Z", 1000),
    row("security.fee_market", "2026-10-11T00:00:00.000Z", 0.2),
    row("macro.dxy", "2026-10-11T00:00:00.000Z", 99),
    ...[
      ["2026-10-12", 10], ["2026-10-11", 20], ["2026-10-10", -5],
      ["2026-10-09", 8], ["2026-10-08", 2],
    ].map(([day, value]) => row("institutional.etf_net_flow", day+"T00:00:00.000Z", value)),
  ];
}

test("fresh and traceable inputs pass readiness but do not create a scenario", () => {
  const result = assessBtcScenarioReadiness(completeInputs(), now);
  assert.equal(result.status, "ready_for_rule_evaluation");
  assert.equal(result.can_persist_scenario_state, false);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});

test("missing fee-market metric blocks evaluation", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "security.fee_market");
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "security.fee_market" && x.reason === "missing"));
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
