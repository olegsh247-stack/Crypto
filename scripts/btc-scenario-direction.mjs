/**
 * Deterministic BTC scenario rule v1. Pure calculation only.
 * Does not fetch data, update probabilities, or persist scenario states/events.
 */
const RULE = {
  methodology_version: "BTC-Scenario-Rule-v1",
  thresholds: {
    price_return_7d_pct: { bull: 5, bear: -5 },
    etf_net_flow_5d_usd_millions: { bull: 500, bear: -500 },
    hashrate_change_7d_pct: { bull: 3, bear: -3 },
    dxy_change_5d_pct: { bull: -0.5, bear: 0.5 },
  },
};

function number(value, name) {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) {
    throw new TypeError(name + " must be a finite number");
  }
  return n;
}

function direction(value, bullThreshold, bearThreshold, inverse = false) {
  if (!inverse) return value >= bullThreshold ? 1 : value <= bearThreshold ? -1 : 0;
  return value <= bullThreshold ? 1 : value >= bearThreshold ? -1 : 0;
}

export function evaluateBtcScenarioV1(input) {
  if (input?.readiness_status !== "ready_for_rule_evaluation") {
    return { status: "not_evaluable", reason: "input_quality_gate_not_passed",
      methodology_version: RULE.methodology_version, can_persist_scenario_state: false };
  }
  const missingRequiredInputs = ["price_return_7d_pct", "etf_net_flow_5d_usd_millions",
    "hashrate_change_7d_pct", "fee_subsidy_ratio"].filter(key =>
      input[key] === null || input[key] === undefined || input[key] === ""
      || !Number.isFinite(Number(input[key])));
  if (missingRequiredInputs.length) {
    return {
      status: "not_evaluable",
      reason: "required_rule_inputs_missing_or_invalid",
      missing_required_inputs: missingRequiredInputs,
      methodology_version: RULE.methodology_version,
      can_persist_scenario_state: false,
      baseline_probabilities_changed: false
    };
  }
  const price = number(input.price_return_7d_pct, "price_return_7d_pct");
  const flows = number(input.etf_net_flow_5d_usd_millions, "etf_net_flow_5d_usd_millions");
  const hashrate = number(input.hashrate_change_7d_pct, "hashrate_change_7d_pct");
  const feeRatio = number(input.fee_subsidy_ratio, "fee_subsidy_ratio");
  if (feeRatio < 0) throw new RangeError("fee_subsidy_ratio cannot be negative");

  const signals = [
    { input: "price_return_7d_pct", value: price, score: direction(price, 5, -5) },
    { input: "etf_net_flow_5d_usd_millions", value: flows, score: direction(flows, 500, -500) },
    { input: "hashrate_change_7d_pct", value: hashrate, score: direction(hashrate, 3, -3) },
  ];

  // DXY is optional supporting context. Missing/invalid-unavailable data is omitted,
  // never converted to zero and never allowed to block evaluation by itself.
  const hasDxy = input.dxy_change_5d_pct !== null
    && input.dxy_change_5d_pct !== undefined
    && input.dxy_change_5d_pct !== "";
  if (hasDxy) {
    const dxy = number(input.dxy_change_5d_pct, "dxy_change_5d_pct");
    signals.push({
      input: "dxy_change_5d_pct",
      value: dxy,
      score: direction(dxy, -0.5, 0.5, true),
    });
  }

  const score = signals.reduce((sum, item) => sum + item.score, 0);
  const scenario = score >= 3 ? "bull" : score <= -3 ? "bear" : "base";
  return {
    status: "evaluated", methodology_version: RULE.methodology_version,
    scenario_type: scenario, directional_score: score,
    confidence_band: Math.abs(score) === 4 ? "high" : Math.abs(score) === 3 ? "medium" : "low",
    signals, context: { fee_subsidy_ratio: feeRatio, fee_subsidy_ratio_used_as_directional_signal: false,
      dxy_included: hasDxy },
    baseline_probabilities_changed: false, can_persist_scenario_state: false,
  };
}

export const BTC_SCENARIO_RULE_V1 = RULE;
