import test from "node:test";
import assert from "node:assert/strict";
import { assessBtcScenarioReadiness } from "../dist/btc-scenario-readiness.js";

const NOW = new Date("2026-10-16T12:00:00.000Z");
const HASH = "a".repeat(64);
const iso = (hoursAgo) => new Date(NOW.getTime() - hoursAgo * 3600000).toISOString();

function price(overrides = {}) {
  return {
    metric_id: "market.spot_price",
    value_numeric: 68000,
    unit: "USD/BTC",
    expected_unit: "USD/BTC",
    observed_at: iso(0.25),
    retrieved_at: iso(0.1),
    freshness: "CURRENT",
    source_id: "market.kraken",
    source_registered: true,
    source_url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD&since=1",
    source_row_key: "kraken:XBTUSD:2026-10-16T11:45:00Z",
    source_payload_sha256: HASH,
    ...overrides,
  };
}

function etf(dayOffset, overrides = {}) {
  const period = new Date(NOW.getTime() - dayOffset * 24 * 3600000);
  const day = period.toISOString().slice(0, 10);
  return {
    metric_id: "institutional.etf_net_flow",
    value_numeric: 120,
    unit: "USD million/day",
    expected_unit: "USD million/day",
    observed_at: iso(0.5),
    period_start: new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), period.getUTCDate())).toISOString(),
    retrieved_at: iso(0.1),
    freshness: "CURRENT",
    source_id: "institutional.primary",
    source_registered: true,
    source_url: "https://farside.co.uk/btc/",
    source_row_key: `farside:btc:${day}`,
    source_payload_sha256: HASH,
    funds_reported_count: 13,
    funds_expected_count: 13,
    fund_completeness_status: "ALL_FUNDS_REPORTED",
    missing_funds: [],
    provider_revision: "published-final-1",
    finalization_status: "final",
    revision: 1,
    ...overrides,
  };
}

function completeInputs() {
  return [price(), etf(0.5), etf(1.5), etf(2.5), etf(3.5), etf(4.5)];
}

test("accepts fresh, traceable spot price and complete five-day ETF history", () => {
  const result = assessBtcScenarioReadiness(completeInputs(), NOW);
  assert.equal(result.status, "ready_for_rule_evaluation");
  assert.deepEqual(result.blockers, []);
  assert.equal(result.can_persist_scenario_state, false);
  assert.equal(result.selected_inputs["market.spot_price"].unit, "USD/BTC");
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});


test("selects the newest ETF reporting dates deterministically when observation timestamps tie", () => {
  const history = Array.from({ length: 8 }, (_, index) => etf(index + 0.5));
  // All fixture rows share observed_at. Reverse the order so stable sorting by
  // observation time alone would select the wrong sessions.
  const result = assessBtcScenarioReadiness([price(), ...history.reverse()], NOW);
  assert.equal(result.status, "ready_for_rule_evaluation");
  const selectedDays = result.selected_inputs["institutional.etf_net_flow"].map((row) => row.day);
  const expectedDays = history
    .map((row) => row.period_start.slice(0, 10))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);
  assert.deepEqual(selectedDays, expectedDays);
  assert.equal(selectedDays.length, 7);
  assert.ok(selectedDays[0] > selectedDays[6]);
});

test("blocks stale spot price", () => {
  const result = assessBtcScenarioReadiness([price({ observed_at: iso(2) }), ...completeInputs().slice(1)], NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "market.spot_price"));
});

test("blocks unapproved spot source", () => {
  const result = assessBtcScenarioReadiness([price({ source_id: "unapproved.provider" }), ...completeInputs().slice(1)], NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "market.spot_price" && b.reason === "source_not_approved_for_metric"));
});

test("blocks future-dated required spot observation", () => {
  const result = assessBtcScenarioReadiness([price({ observed_at: iso(-1) }), ...completeInputs().slice(1)], NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "market.spot_price"));
});

test("blocks incomplete ETF fund coverage", () => {
  const inputs = completeInputs();
  inputs[1] = etf(0.5, {
    funds_reported_count: 12,
    missing_funds: ["FBTC"],
    fund_completeness_status: "PARTIAL",
  });
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "institutional.etf_net_flow"));
});

test("duplicate ETF reporting dates do not satisfy the five-date minimum", () => {
  const inputs = [price(), etf(0.5), etf(0.5), etf(1.5), etf(2.5), etf(3.5)];
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "institutional.etf_net_flow" && b.reason === "requires_at_least_5_distinct_recent_daily_observations"));
});


test("blocks one ETF source row key reused across distinct reporting days", () => {
  const inputs = completeInputs();
  inputs[2] = etf(1.5, { source_row_key: inputs[1].source_row_key });
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) =>
    b.metric_id === "institutional.etf_net_flow"
    && b.reason === "duplicate_source_row_key_across_reporting_days"
  ));
});

test("blocks missing ETF revision/finality evidence", () => {
  const inputs = completeInputs();
  inputs[0] = price();
  inputs[1] = etf(0.5, { provider_revision: "", revision_policy_status: undefined, finalization_status: "provisional" });
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "institutional.etf_net_flow"));
});


test("blocks a spot observation retrieved before its source event time", () => {
  const result = assessBtcScenarioReadiness([price({ observed_at: iso(0.1), retrieved_at: iso(0.5) }), ...completeInputs().slice(1)], NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "market.spot_price"));
});

test("blocks conflicting ETF rows for a reporting date even when five other dates exist", () => {
  const inputs = [price(), etf(0.5), etf(0.5, { value_numeric: -45, provider_revision: "published-final-2", revision: 2 }), etf(1.5), etf(2.5), etf(3.5), etf(4.5), etf(5.5)];
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "institutional.etf_net_flow" && b.reason.startsWith("duplicate_or_conflicting_rows_for_reporting_date:")));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].some((x) => x.day === new Date(NOW.getTime() - 0.5 * 24 * 3600000).toISOString().slice(0,10)), false);
});

test("blocks historical ETF rows retrieved before the observation/publication timestamp", () => {
  const inputs = completeInputs();
  inputs[1] = etf(0.5, { observed_at: iso(0.05), retrieved_at: iso(0.5) });
  const result = assessBtcScenarioReadiness(inputs, NOW);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some((b) => b.metric_id === "institutional.etf_net_flow"));
});
