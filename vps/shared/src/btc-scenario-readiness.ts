/**
 * Read-only BTC scenario input-quality gate.
 *
 * Freshness limits mirror data/CryptoDataModel/registry/metric-registry.json.
 * This decides whether source observations are fit for a reviewed research
 * evaluation. It never selects a scenario or authorizes persistence.
 */
const REQUIRED = [
  { metricId: "market.spot_price", maxAgeHours: 1, unit: "USD/BTC", sourceIds: ["market.kraken"], sourceUrlPrefixes: ["https://api.kraken.com/0/public/Trades?pair=XBTUSD"], label: "spot price" },
  { metricId: "security.hashrate", maxAgeHours: 48, unit: "EH/s", sourceIds: ["network.primary"], sourceUrlPrefixes: ["https://mempool.space/api/v1/mining/hashrate/1w"], approvedMethodologyIds: [], label: "network hashrate" },
  // The raw fees endpoint is not itself a fee/subsidy ratio. Keep this input blocked
  // until its units, block/window semantics, subsidy denominator and method version are reviewed.
  { metricId: "security.fee_subsidy_ratio", maxAgeHours: 48, unit: "ratio", sourceIds: ["network.primary"], sourceUrlPrefixes: ["https://mempool.space/api/v1/mining/blocks/fees/1w"], approvedMethodologyIds: [], label: "fee-market/security economics" },
  // No specific DXY feed has been approved. Empty identity/URL allowlists fail closed.
  { metricId: "macro.dxy", maxAgeHours: 48, unit: "index", sourceIds: [], sourceUrlPrefixes: [], label: "macro liquidity proxy (DXY)" },
];

function dateMs(value: unknown): number {
  const n = Date.parse(value == null ? "" : String(value));
  return Number.isFinite(n) ? n : NaN;
}

function validObservation(row: any, nowMs: number, maxAgeHours: number, expectedUnit?: string, allowedSourceIds?: string[], allowedSourceUrlPrefixes?: string[], approvedMethodologyIds?: string[]): boolean {
  const observedMs = dateMs(row?.observed_at);
  const value = row?.value_numeric ?? row?.value_integer;
  return Number.isFinite(observedMs)
    && observedMs <= nowMs
    && nowMs - observedMs <= maxAgeHours * 3600000
    && String(row?.freshness ?? "").toUpperCase() === "CURRENT"
    && value !== null && value !== undefined && Number.isFinite(Number(value))
    && (row?.metric_id !== "market.spot_price" || Number(value) > 0)
    && (row?.metric_id !== "security.hashrate" || Number(value) > 0)
    && (row?.metric_id !== "security.fee_subsidy_ratio" || Number(value) >= 0)
    && (row?.metric_id !== "macro.dxy" || Number(value) > 0)
    && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
    && typeof row?.source_id === "string" && row.source_id.trim().length > 0
    && row?.source_registered === true
    && Array.isArray(allowedSourceIds) && allowedSourceIds.includes(String(row?.source_id ?? ""))
    && Array.isArray(allowedSourceUrlPrefixes) && allowedSourceUrlPrefixes.some(prefix => String(row?.source_url ?? "").startsWith(prefix))
    && (!approvedMethodologyIds || approvedMethodologyIds.includes(String(row?.methodology ?? "")))
    && typeof row?.unit === "string" && row.unit.trim().length > 0
    && (!expectedUnit || (row.unit === expectedUnit && row.expected_unit === expectedUnit));
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
    if (!validObservation(latest, nowMs, requirement.maxAgeHours, requirement.unit, requirement.sourceIds, requirement.sourceUrlPrefixes, requirement.approvedMethodologyIds)) {
      blockers.push({
        metric_id: requirement.metricId,
        reason: String(latest.freshness ?? "").toUpperCase() !== "CURRENT"
          ? "not_marked_current"
          : latest.source_registered !== true
            ? "source_not_registered"
            : !requirement.sourceIds.includes(String(latest.source_id ?? ""))
              ? "source_not_approved_for_metric"
              : !requirement.sourceUrlPrefixes.some(prefix => String(latest.source_url ?? "").startsWith(prefix))
                ? "source_url_not_approved_for_metric"
                : requirement.approvedMethodologyIds && !requirement.approvedMethodologyIds.includes(String(latest.methodology ?? ""))
                  ? "calculation_method_not_approved"
                  : typeof latest.unit !== "string" || !latest.unit.trim()
              ? "unit_missing"
              : requirement.unit && latest.expected_unit !== requirement.unit
              ? "metric_unit_contract_mismatch"
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
      || !validObservation(latestEtf, nowMs, 36, "USD million/day", ["institutional.primary"], ["https://farside.co.uk/btc/"])) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: "latest_observation_must_be_current_traceable_and_within_36_hours",
    });
  }

  // Historical daily ETF rows are allowed to be older than the latest-row
  // freshness window. They still need valid timestamps, values, canonical
  // units, registered HTTPS provenance, and must fall within the 14-day series.
  // The latest row is checked separately above against the 36-hour registry gate.
  const etfRows = allEtfRows.filter(row => {
    const observedMs = dateMs(row?.observed_at);
    const value = row?.value_numeric ?? row?.value_integer;
    return Number.isFinite(observedMs)
      && observedMs <= nowMs
      && nowMs - observedMs <= 14 * 24 * 3600000
      && value !== null && value !== undefined && Number.isFinite(Number(value))
      && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
      && typeof row?.source_id === "string" && row.source_id.trim().length > 0
      && row?.source_registered === true
      && row?.source_id === "institutional.primary"
      && String(row?.source_url ?? "").startsWith("https://farside.co.uk/btc/")
      && row?.unit === "USD million/day"
      && row?.expected_unit === "USD million/day";
  });
  const uniqueByDay = new Map<string, any>();
  for (const row of etfRows) {
    const day = new Date(dateMs(row.period_start ?? row.observed_at)).toISOString().slice(0, 10);
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
