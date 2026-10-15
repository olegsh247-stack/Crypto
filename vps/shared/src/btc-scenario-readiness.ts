import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Read-only BTC scenario input-quality gate.
 *
 * Freshness limits mirror data/CryptoDataModel/registry/metric-registry.json.
 * This decides whether source observations are fit for a reviewed research
 * evaluation. It never selects a scenario or authorizes persistence.
 */
const registryRelativePath = "data/CryptoDataModel/registry/metric-registry.json";
const registryPath = [
  resolve(process.cwd(), registryRelativePath),
  resolve(process.cwd(), "../../" + registryRelativePath),
  resolve(process.cwd(), "../" + registryRelativePath),
].find(path => existsSync(path));
if (!registryPath) throw new Error("Canonical metric registry not found from the application working directory");
const metricRegistry = JSON.parse(readFileSync(registryPath, "utf8"));
const metricsById = new Map<string, any>(metricRegistry.metrics.map((metric: any) => [metric.metric_id, metric] as [string, any]));

function freshnessHours(window: unknown, metricId: string): number {
  const match = /^(\d+)(m|h|d)$/.exec(String(window ?? ""));
  if (!match) throw new Error("Metric " + metricId + " has no supported freshness_window for BTC readiness");
  return Number(match[1]) * ({ m: 1 / 60, h: 1, d: 24 } as Record<string, number>)[match[2]];
}

const REQUIRED: Array<{ metricId: string; maxAgeHours: number; unit: string; sourceIds: string[]; sourceUrlPrefixes: string[]; approvedMethodologyIds?: string[]; label: string }> =
  metricRegistry.metrics
    .filter((metric: any) => metric.scenario_readiness?.required === true && metric.metric_id !== "institutional.etf_net_flow")
    .map((metric: any) => ({
      metricId: metric.metric_id,
      maxAgeHours: freshnessHours(metric.freshness_window, metric.metric_id),
      unit: metric.unit,
      sourceIds: metric.source_priority,
      sourceUrlPrefixes: metric.scenario_readiness.allowed_source_url_prefixes,
      label: metric.name,
    }));

function dateMs(value: unknown): number {
  const n = Date.parse(value == null ? "" : String(value));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * ETF aggregates are not accepted from a reporting date and total alone.
 * Until the provider's revision/finality semantics or an approved immutable
 * snapshot reconciliation policy is present, observations remain blocked.
 */
function validEtfAcceptance(row: any): boolean {
  const fundCount = Number(row?.funds_reported_count);
  const expectedFundCount = Number(row?.funds_expected_count);
  return row?.fund_completeness_status === "ALL_FUNDS_REPORTED"
    && Number.isInteger(fundCount)
    && Number.isInteger(expectedFundCount)
    && expectedFundCount > 0
    && fundCount === expectedFundCount
    && Array.isArray(row?.missing_funds)
    && row.missing_funds.length === 0
    && typeof row?.source_payload_sha256 === "string"
    && /^[0-9a-f]{64}$/i.test(row.source_payload_sha256)
    && ((typeof row?.provider_revision === "string" && row.provider_revision.trim().length > 0)
      || row?.revision_policy_status === "approved_immutable_snapshot_reconciliation")
    && ["final", "reconciled_snapshot"].includes(String(row?.finalization_status ?? "").toLowerCase());
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
    && typeof row?.source_payload_sha256 === "string"
    && /^[0-9a-f]{64}$/i.test(row.source_payload_sha256)
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
              : typeof latest.source_payload_sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(latest.source_payload_sha256)
              ? "source_payload_hash_missing_or_invalid"
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
  const latestEtf = allEtfRows[0];
  const etfMetric = metricsById.get("institutional.etf_net_flow");
  const etfReadiness = etfMetric?.scenario_readiness;
  const etfLatestMaxAgeHours = Number(etfReadiness?.latest_max_age_hours ?? freshnessHours(etfMetric?.freshness_window, "institutional.etf_net_flow"));
  const etfHistoryMaxAgeDays = Number(etfReadiness?.history_max_age_days ?? 14);
  const etfMinimumDistinctDays = Number(etfReadiness?.minimum_distinct_days ?? 5);
  const etfSourceIds: string[] = etfMetric?.source_priority ?? [];
  const etfSourceUrlPrefixes: string[] = etfReadiness?.allowed_source_url_prefixes ?? [];
  const latestEtfPeriodMs = dateMs(latestEtf?.period_start);
  if (!latestEtf
      || !validEtfAcceptance(latestEtf)
      || !Number.isFinite(latestEtfPeriodMs)
      || latestEtfPeriodMs > nowMs
      || nowMs - latestEtfPeriodMs > etfHistoryMaxAgeDays * 24 * 3600000
      || !validObservation(latestEtf, nowMs, etfLatestMaxAgeHours, etfMetric?.unit, etfSourceIds, etfSourceUrlPrefixes)) {
    blockers.push({
      metric_id: "institutional.etf_net_flow",
      reason: !latestEtf
        ? "latest_observation_missing"
        : !validEtfAcceptance(latestEtf)
          ? "etf_fund_completeness_revision_or_finality_unverified"
          : "latest_observation_must_be_current_traceable_and_within_36_hours",
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
      && nowMs - periodMs <= etfHistoryMaxAgeDays * 24 * 3600000
      && Number.isFinite(observedMs)
      && observedMs <= nowMs
      && Number.isFinite(dateMs(row?.retrieved_at))
      && dateMs(row.retrieved_at) <= nowMs
      && typeof row?.source_row_key === "string" && row.source_row_key.trim().length > 0
      && validEtfAcceptance(row)
      && value !== null && value !== undefined && Number.isFinite(Number(value))
      && typeof row?.source_url === "string" && /^https:\/\//i.test(row.source_url)
      && typeof row?.source_id === "string" && row.source_id.trim().length > 0
      && row?.source_registered === true
      && etfSourceIds.includes(String(row?.source_id ?? ""))
      && etfSourceUrlPrefixes.some(prefix => String(row?.source_url ?? "").startsWith(prefix))
      && row?.unit === etfMetric?.unit
      && row?.expected_unit === etfMetric?.unit;
  });
  const uniqueByDay = new Map<string, any>();
  for (const row of etfRows) {
    const day = new Date(dateMs(row.period_start)).toISOString().slice(0, 10);
    if (!uniqueByDay.has(day)) uniqueByDay.set(day, row);
  }
  if (uniqueByDay.size < etfMinimumDistinctDays) {
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
