/**
 * Read-only BTC scenario input-quality gate.
 *
 * This decides whether source observations are fit for a reviewed research
 * evaluation. It never selects a scenario or authorizes persistence.
 */
const REQUIRED = [
  { metricId: "market.spot_price", maxAgeHours: 24, unit: "USD/BTC", label: "spot price" },
  { metricId: "security.hashrate", maxAgeHours: 168, unit: "EH/s", label: "network hashrate" },
  { metricId: "security.fee_subsidy_ratio", maxAgeHours: 168, unit: "ratio", label: "fee-market/security economics" },
  { metricId: "macro.dxy", maxAgeHours: 120, unit: "index", label: "macro liquidity proxy (DXY)" },
];

function dateMs(value: unknown): number {
  const n = Date.parse(value == null ? "" : String(value));
  return Number.isFinite(n) ? n : NaN;
}

function validObservation(row: any, nowMs: number, maxAgeHours: number, expectedUnit?: string): boolean {
  const observedMs = dateMs(row?.observed_at);
  const value = row?.value_numeric ?? row?.value_integer;
  return Number.isFinite(observedMs)
    && observedMs <= nowMs
    && nowMs - observedMs <= maxAgeHours * 3600000
    && String(row?.freshness ?? "").toUpperCase() === "CURRENT"
    && value !== null && value !== undefined && Number.isFinite(Number(value))
    && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
    && typeof row?.source_id === "string" && row.source_id.trim().length > 0
    && row?.source_registered === true
    && typeof row?.unit === "string" && row.unit.trim().length > 0
    && (!expectedUnit || row.unit === expectedUnit);
}

export function assessBtcScenarioReadiness(observations: unknown, now: Date | string = new Date()) {
  const nowMs = dateMs(now);
  if (!Number.isFinite(nowMs)) throw new TypeError("now must be a valid date");
  const rows: any[] = Array.isArray(observations) ? observations as any[] : [];
  const blockers: Array<{metric_id: string; reason: string}> = [];
  const selected: Record<string, any> = {};

  for (const requirement of REQUIRED) {
    const matches = rows
      .filter(row => row?.metric_id === requirement.metricId)
      .sort((a, b) => dateMs(b.observed_at) - dateMs(a.observed_at)
        || Number(b.revision ?? 0) - Number(a.revision ?? 0));
    const latest = matches[0];
    if (!latest) {
      blockers.push({ metric_id: requirement.metricId, reason: "missing" });
      continue;
    }
    if (!validObservation(latest, nowMs, requirement.maxAgeHours, requirement.unit)) {
      blockers.push({
        metric_id: requirement.metricId,
        reason: String(latest.freshness ?? "").toUpperCase() !== "CURRENT"
          ? "not_marked_current"
          : latest.source_registered !== true
            ? "source_not_registered"
            : typeof latest.unit !== "string" || !latest.unit.trim()
              ? "unit_missing"
              : requirement.unit && latest.unit !== requirement.unit
                ? "unit_mismatch"
                : "stale_or_untraceable",
      });
      continue;
    }
    selected[requirement.metricId] = {
      observed_at: latest.observed_at,
      source_id: latest.source_id,
      source_url: latest.source_url,
      unit: latest.unit,
      revision: Number(latest.revision ?? 1),
      value: Number(latest.value_numeric ?? latest.value_integer),
    };
  }

  const allEtfRows = rows
    .filter(row => row?.metric_id === "institutional.etf_net_flow")
    .sort((a, b) => dateMs(b.observed_at) - dateMs(a.observed_at)
      || Number(b.revision ?? 0) - Number(a.revision ?? 0));
  const latestEtf = allEtfRows[0];
  if (!latestEtf
      || !validObservation(latestEtf, nowMs, 168, "USD million/day")
      || nowMs - dateMs(latestEtf.observed_at) > 48 * 3600000) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: "latest_observation_must_be_current_traceable_and_within_48_hours",
    });
  }

  // Never silently fall back to older rows if the latest source row is invalid.
  const etfRows = allEtfRows.filter(row => validObservation(row, nowMs, 168, "USD million/day"));
  const uniqueByDay = new Map<string, any>();
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
        source_url: row.source_url,
        unit: row.unit,
        revision: Number(row.revision ?? 1),
        observed_at: row.observed_at,
      }));
  }

  return {
    status: blockers.length === 0 ? "ready_for_rule_evaluation" : "not_evaluable",
    can_persist_scenario_state: false,
    blockers,
    selected_inputs: selected,
    note: "Read-only input readiness. This result does not select a scenario, calculate probabilities, or authorize persistence.",
  };
}
