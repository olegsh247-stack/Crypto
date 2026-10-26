/**
 * Read-only BTC scenario input-quality gate.
 *
 * Freshness limits mirror data/CryptoDataModel/registry/metric-registry.json.
 * This decides whether source observations are fit for a reviewed research
 * evaluation. It never selects a scenario or authorizes persistence.
 */
const REQUIRED: Array<{ metricId: string; maxAgeHours: number; unit: string; sourceIds: string[]; sourceUrlPrefixes: string[]; approvedMethodologyIds?: string[]; label: string }> = [
  { metricId: "market.spot_price", maxAgeHours: 6, unit: "USD/BTC", sourceIds: ["market.kraken"], sourceUrlPrefixes: ["https://api.kraken.com/0/public/Trades?pair=XBTUSD"], label: "spot price" },
  // Hashrate is supporting network-health context, not a mandatory directional input
  // for the first institutional/macro BTC scenario. Validate it if/when a scenario rule uses it.
  // Fee/subsidy ratio is deferred: it is not required or calculated for this scenario.
  // Keep its source/method contract in the metric registry for future research, but do not
  // block current scenario readiness on a metric that has no approved method or current use.
  // DXY is optional macro context for the first BTC scenario. It must not block
  // readiness when no approved source is available; any supplied DXY observation
  // is not selected by this required-input gate.
];

// ETF source substitution is allowed when the chosen row is for the same reporting
// session, explicitly numeric, traceable, and normalized to USD million/day.
// This is a source fallback policy, not automatic production/source-priority approval.
const ETF_SOURCE_URL_PREFIXES: Record<string, string[]> = {
  "institutional.primary": ["https://farside.co.uk/btc/", "https://farside.co.uk/bitcoin-etf-flow-all-data/"],
  "institutional.sosovalue": ["https://openapi.sosovalue.com/openapi/v1/etfs/summary-history"],
  "institutional.cryptoetf_today": ["https://cryptoetf.today"],
  "institutional.coinpulse": ["https://coinpulsehq.com/bitcoin-etf-flows/"],
  "institutional.bittradescanner": ["https://bittradescanner.com/"],
  "institutional.tftc": ["https://www.tftc.io/bitcoin-etf-flows/"],
};
const ETF_SOURCE_PRIORITY = [
  "institutional.primary",
  "institutional.sosovalue",
  "institutional.cryptoetf_today",
  "institutional.coinpulse",
  "institutional.bittradescanner",
  "institutional.tftc",
];
function validEtfSource(row: any): boolean {
  const prefixes = ETF_SOURCE_URL_PREFIXES[String(row?.source_id ?? "")] ?? [];
  return row?.source_registered === true
    && prefixes.some(prefix => String(row?.source_url ?? "").startsWith(prefix));
}
function explicitlyIncompleteEtfPanel(row: any): boolean {
  return row?.fund_values_complete === false
    || String(row?.reconciliation_status ?? row?.reconciliation ?? "").toUpperCase() === "INCOMPLETE"
    || String(row?.completeness_status ?? "").toUpperCase() === "INCOMPLETE";
}

function dateMs(value: unknown): number {
  const n = Date.parse(value == null ? "" : String(value));
  return Number.isFinite(n) ? n : NaN;
}

function validObservation(row: any, nowMs: number, maxAgeHours: number, expectedUnit?: string, allowedSourceIds?: string[], allowedSourceUrlPrefixes?: string[], approvedMethodologyIds?: string[]): boolean {
  const observedMs = dateMs(row?.observed_at);
  const retrievedMs = dateMs(row?.retrieved_at);
  const value = row?.value_numeric ?? row?.value_integer;
  return Number.isFinite(observedMs)
    && observedMs <= nowMs
    && Number.isFinite(retrievedMs)
    && retrievedMs <= nowMs
    && typeof row?.source_row_key === "string" && row.source_row_key.trim().length > 0
    && (row?.source_payload_sha256 == null || /^[0-9a-f]{64}$/i.test(String(row.source_payload_sha256)))
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
                  : !Number.isFinite(dateMs(latest.retrieved_at)) || dateMs(latest.retrieved_at) > nowMs
              ? "retrieval_timestamp_missing_or_invalid"
              : typeof latest.source_row_key !== "string" || !latest.source_row_key.trim()
              ? "source_row_key_missing"
              : latest.source_payload_sha256 != null && !/^[0-9a-f]{64}$/i.test(String(latest.source_payload_sha256))
              ? "source_payload_hash_invalid"
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
      source_updated_at: latest.source_updated_at ?? null,
      retrieved_at: latest.retrieved_at,
      source_id: latest.source_id,
      source_url: latest.source_url,
      source_row_key: latest.source_row_key,
      source_payload_sha256: latest.source_payload_sha256 ?? null,
      methodology: latest.methodology ?? null,
      methodology_version: latest.methodology_version ?? null,
      unit: latest.unit,
      revision: Number(latest.revision ?? 1),
      value: Number(latest.value_numeric ?? latest.value_integer),
    };
  }

  const allEtfRows = rows
    .filter(row => row?.metric_id === "institutional.etf_net_flow")
    .sort((a, b) => dateMs(b.observed_at) - dateMs(a.observed_at)
      || Number(b.revision ?? 0) - Number(a.revision ?? 0));
  const latestReportedSessionMs = allEtfRows
    .map(row => dateMs(row?.period_start))
    .filter(periodMs => Number.isFinite(periodMs) && periodMs <= nowMs && nowMs - periodMs <= 14 * 24 * 3600000)
    .sort((a, b) => b - a)[0];
  const latestSessionRows = allEtfRows.filter(row => dateMs(row?.period_start) === latestReportedSessionMs);
  const latestRowBySource = new Map<string, any>();
  for (const row of latestSessionRows) {
    const sourceId = String(row?.source_id ?? "");
    const prior = latestRowBySource.get(sourceId);
    if (!prior || dateMs(row?.observed_at) > dateMs(prior?.observed_at)
        || (dateMs(row?.observed_at) === dateMs(prior?.observed_at) && Number(row?.revision ?? 0) > Number(prior?.revision ?? 0))) {
      latestRowBySource.set(sourceId, row);
    }
  }
  const latestEtf = [...latestRowBySource.values()]
    .filter(row => validEtfSource(row)
      && !explicitlyIncompleteEtfPanel(row)
      && validObservation(row, nowMs, 36, "USD million/day", [String(row?.source_id ?? "")], ETF_SOURCE_URL_PREFIXES[String(row?.source_id ?? "")]))
    .sort((a, b) => ETF_SOURCE_PRIORITY.indexOf(String(a.source_id)) - ETF_SOURCE_PRIORITY.indexOf(String(b.source_id))
      || dateMs(b.observed_at) - dateMs(a.observed_at))[0];
  const latestEtfPeriodMs = dateMs(latestEtf?.period_start);
  if (!latestEtf || !Number.isFinite(latestEtfPeriodMs)) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: "no_current_traceable_etf_source_for_latest_session_within_14_days",
    });
  }

  // Historical daily ETF rows are allowed to be older than the latest-row
  // freshness window. The provider's logical reporting date (period_start) is
  // mandatory: observed_at is an observation/publication timestamp, not a
  // substitute for the ETF trading date. Rows without a valid period_start
  // fail closed and cannot count toward the five-session minimum.
  const etfRows = allEtfRows.filter(row => {
    const periodMs = dateMs(row?.period_start);
    const observedMs = dateMs(row?.observed_at);
    const value = row?.value_numeric ?? row?.value_integer;
    return Number.isFinite(periodMs)
      && periodMs <= nowMs
      && nowMs - periodMs <= 14 * 24 * 3600000
      && Number.isFinite(observedMs)
      && observedMs <= nowMs
      && Number.isFinite(dateMs(row?.retrieved_at))
      && dateMs(row.retrieved_at) <= nowMs
      && typeof row?.source_row_key === "string" && row.source_row_key.trim().length > 0
      && (row?.source_payload_sha256 == null || /^[0-9a-f]{64}$/i.test(String(row.source_payload_sha256)))
      && value !== null && value !== undefined && Number.isFinite(Number(value))
      && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
      && typeof row?.source_id === "string" && row.source_id.trim().length > 0
      && row?.source_registered === true
      && validEtfSource(row)
      && !explicitlyIncompleteEtfPanel(row)
      && row?.unit === "USD million/day"
      && row?.expected_unit === "USD million/day";
  });
  etfRows.sort((a, b) => dateMs(b.period_start) - dateMs(a.period_start)
    || ETF_SOURCE_PRIORITY.indexOf(String(a.source_id)) - ETF_SOURCE_PRIORITY.indexOf(String(b.source_id))
    || dateMs(b.observed_at) - dateMs(a.observed_at));
  const uniqueByDay = new Map<string, any>();
  for (const row of etfRows) {
    const day = new Date(dateMs(row.period_start)).toISOString().slice(0, 10);
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
        source_updated_at: row.source_updated_at ?? null,
        retrieved_at: row.retrieved_at,
        source_row_key: row.source_row_key,
        source_payload_sha256: row.source_payload_sha256 ?? null,
        methodology: row.methodology ?? null,
        methodology_version: row.methodology_version ?? null,
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
