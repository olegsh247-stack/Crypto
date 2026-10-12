/**
 * BTC scenario input-quality gate.
 *
 * This deliberately does not select Bull/Base/Bear or write database rows.
 * It only decides whether the input set is sufficiently fresh and traceable
 * for a separately specified deterministic evaluator.
 */
const REQUIRED = [
  { metricId: "market.spot_price", maxAgeHours: 24, label: "spot price" },
  { metricId: "security.hashrate", maxAgeHours: 168, label: "network hashrate" },
  { metricId: "security.fee_market", maxAgeHours: 168, label: "fee-market/security economics" },
  { metricId: "macro.dxy", maxAgeHours: 120, label: "macro liquidity proxy (DXY)" },
];

function dateMs(value) {
  const n = Date.parse(value ?? "");
  return Number.isFinite(n) ? n : NaN;
}

function validObservation(row, nowMs, maxAgeHours) {
  const observedMs = dateMs(row?.observed_at);
  const value = row?.value_numeric ?? row?.value_integer;
  return Number.isFinite(observedMs)
    && observedMs <= nowMs
    && nowMs - observedMs <= maxAgeHours * 3600000
    && String(row?.freshness ?? "").toUpperCase() === "CURRENT"
    && value !== null && value !== undefined && Number.isFinite(Number(value))
    && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
    && typeof row?.source_id === "string" && row.source_id.trim().length > 0;
}

export function assessBtcScenarioReadiness(observations, now = new Date()) {
  const nowMs = dateMs(now);
  if (!Number.isFinite(nowMs)) throw new TypeError("now must be a valid date");
  const rows = Array.isArray(observations) ? observations : [];
  const blockers = [];
  const selected = {};

  for (const requirement of REQUIRED) {
    const matches = rows
      .filter(row => row?.metric_id === requirement.metricId)
      .sort((a, b) => dateMs(b.observed_at) - dateMs(a.observed_at));
    const latest = matches[0];
    if (!latest) {
      blockers.push({ metric_id: requirement.metricId, reason: "missing" });
      continue;
    }
    if (!validObservation(latest, nowMs, requirement.maxAgeHours)) {
      blockers.push({
        metric_id: requirement.metricId,
        reason: String(latest.freshness ?? "").toUpperCase() !== "CURRENT"
          ? "not_marked_current"
          : "stale_or_untraceable",
      });
      continue;
    }
    selected[requirement.metricId] = {
      observed_at: latest.observed_at,
      source_id: latest.source_id,
      value: Number(latest.value_numeric ?? latest.value_integer),
    };
  }

  const etfRows = rows
    .filter(row => row?.metric_id === "institutional.etf_net_flow")
    .filter(row => validObservation(row, nowMs, 168))
    .sort((a, b) => dateMs(b.observed_at) - dateMs(a.observed_at));
  const latestEtf = etfRows[0];
  if (!latestEtf || nowMs - dateMs(latestEtf.observed_at) > 48 * 3600000) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: "latest_observation_must_be_within_48_hours",
    });
  }
  const uniqueByDay = new Map();
  for (const row of etfRows) {
    const day = new Date(dateMs(row.observed_at)).toISOString().slice(0, 10);
    if (!uniqueByDay.has(day)) uniqueByDay.set(day, row);
  }
  if (uniqueByDay.size < 5) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: "requires_at_least_5_distinct_recent_daily_observations",
    });
  } else {
    selected["institutional.etf_net_flow"] = [...uniqueByDay.entries()]
      .slice(0, 7)
      .map(([day, row]) => ({
        day,
        value: Number(row.value_numeric ?? row.value_integer),
        source_id: row.source_id,
        observed_at: row.observed_at,
      }));
  }

  return {
    status: blockers.length === 0 ? "ready_for_rule_evaluation" : "not_evaluable",
    can_persist_scenario_state: false,
    blockers,
    selected_inputs: selected,
    note: "Input readiness only. This result does not select a scenario, calculate probabilities, or authorize persistence.",
  };
}
