import test from "node:test";
import assert from "node:assert/strict";
import { evaluateBtcScenarioV1 } from "./btc-scenario-direction.mjs";

const ready = {
  readiness_status: "ready_for_rule_evaluation",
  price_return_7d_pct: 0,
  etf_net_flow_5d_usd_millions: 0,
  hashrate_change_7d_pct: 0,
  dxy_change_5d_pct: 0,
  fee_subsidy_ratio: 0.0041,
};

test("three aligned bullish signals select Bull without changing probabilities", () => {
  const r = evaluateBtcScenarioV1({ ...ready, price_return_7d_pct: 6,
    etf_net_flow_5d_usd_millions: 700, hashrate_change_7d_pct: 4, dxy_change_5d_pct: 0.1 });
  assert.equal(r.scenario_type, "bull");
  assert.equal(r.directional_score, 3);
  assert.equal(r.confidence_band, "medium");
  assert.equal(r.baseline_probabilities_changed, false);
  assert.equal(r.can_persist_scenario_state, false);
});

test("four bearish signals select Bear", () => {
  const r = evaluateBtcScenarioV1({ ...ready, price_return_7d_pct: -6,
    etf_net_flow_5d_usd_millions: -700, hashrate_change_7d_pct: -4, dxy_change_5d_pct: 0.7 });
  assert.equal(r.scenario_type, "bear");
  assert.equal(r.directional_score, -4);
  assert.equal(r.confidence_band, "high");
});

test("sub-threshold and mixed inputs remain Base", () => {
  const r = evaluateBtcScenarioV1({ ...ready, price_return_7d_pct: 4.9,
    etf_net_flow_5d_usd_millions: -499, hashrate_change_7d_pct: 3, dxy_change_5d_pct: -0.4 });
  assert.equal(r.scenario_type, "base");
  assert.equal(r.directional_score, 1);
  assert.equal(r.confidence_band, "low");
});

test("DXY direction is inverse to BTC risk direction", () => {
  const weak = evaluateBtcScenarioV1({ ...ready, dxy_change_5d_pct: -0.5 });
  const strong = evaluateBtcScenarioV1({ ...ready, dxy_change_5d_pct: 0.5 });
  assert.equal(weak.signals[3].score, 1);
  assert.equal(strong.signals[3].score, -1);
});

test("failed readiness gate never evaluates", () => {
  const r = evaluateBtcScenarioV1({ ...ready, readiness_status: "not_evaluable" });
  assert.equal(r.status, "not_evaluable");
  assert.equal(r.can_persist_scenario_state, false);
});

test("missing values and negative fee ratio are rejected", () => {
  assert.throws(() => evaluateBtcScenarioV1({ ...ready, price_return_7d_pct: null }), /finite number/);
  assert.throws(() => evaluateBtcScenarioV1({ ...ready, fee_subsidy_ratio: -0.1 }), /cannot be negative/);
});

test("fee ratio is context only", () => {
  const a = evaluateBtcScenarioV1({ ...ready, fee_subsidy_ratio: 0.001 });
  const b = evaluateBtcScenarioV1({ ...ready, fee_subsidy_ratio: 0.9 });
  assert.equal(a.directional_score, b.directional_score);
  assert.equal(b.context.fee_subsidy_ratio_used_as_directional_signal, false);
});
