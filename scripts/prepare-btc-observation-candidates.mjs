#!/usr/bin/env node
/**
 * Map a read-only BTC source-capture manifest into review-only normalized candidates.
 * This script never connects to PostgreSQL or marks candidates ready for ingestion.
 */
import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const KRAKEN_URL = "https://api.kraken.com/0/public/Trades?pair=XBTUSD";
const SHA256_RE = /^[0-9a-f]{64}$/i;
const metricRegistry = JSON.parse(readFileSync(new URL("../data/CryptoDataModel/registry/metric-registry.json", import.meta.url), "utf8"));
const btcSpotMetric = metricRegistry.metrics?.find(metric => metric.metric_id === "market.spot_price");
const freshnessWindow = /^(\d+)(s|m|h|d)$/.exec(String(btcSpotMetric?.freshness_window ?? ""));
if (!btcSpotMetric?.freshness_policy_id || !freshnessWindow) {
  throw new Error("BTC spot freshness policy is missing or invalid in metric-registry.json");
}
const BTC_SPOT_MAX_AGE_SECONDS = Number(freshnessWindow[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[freshnessWindow[2]]);
const BTC_SPOT_FRESHNESS_POLICY_ID = btcSpotMetric.freshness_policy_id;

function validIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    && !Number.isNaN(Date.parse(value));
}

export function prepareBtcObservationCandidates(manifest) {
  const candidates = [];
  const blocked = [];
  const etfReviewRows = [];
  const etfCrossSourceComparisons = [];
  const sources = Array.isArray(manifest?.sources) ? manifest.sources : [];

  for (const source of sources) {
    if (source?.metric_id === "market.spot_price" && source?.source_id !== "market.kraken") {
      const reasons = ["source_not_approved_for_canonical_spot"];
      if (source.status !== "CAPTURED") reasons.push("cross_check_capture_not_successful");
      if (source.quote_unit && source.quote_unit !== "USD/BTC") reasons.push("noncanonical_quote_unit");
      blocked.push({
        source_id: source.source_id ?? null,
        metric_id: source.metric_id,
        reasons
      });
      continue;
    }

    if (source?.metric_id === "market.spot_price" && source?.source_id === "market.kraken") {
      const reasons = [];
      if (source.status !== "CAPTURED") reasons.push("source_capture_not_successful");
      if (source.url !== KRAKEN_URL) reasons.push("canonical_kraken_endpoint_mismatch");
      if (!(Number(source.latest_trade_price_usd_per_btc) > 0)
        || !Number.isFinite(Number(source.latest_trade_price_usd_per_btc))) reasons.push("price_missing_or_invalid");
      if (!validIso(source.latest_trade_observed_at) || source.latest_trade_observed_at !== source.observed_at) reasons.push("source_observation_timestamp_missing_or_inconsistent");
      if (!validIso(source.retrieved_at)) reasons.push("retrieval_timestamp_missing_or_invalid");
      if (validIso(source.latest_trade_observed_at) && validIso(source.retrieved_at)
        && Date.parse(source.latest_trade_observed_at) > Date.parse(source.retrieved_at)) {
        reasons.push("source_observation_timestamp_after_retrieval");
      }
      if (typeof source.source_row_key !== "string" || !source.source_row_key.trim()) reasons.push("source_row_key_missing");
      if (source.source_row_key_scope !== "pair_timestamp_price_volume_side_order_type_misc"
        || source.source_row_identity_status !== "derived_composite_key_not_provider_assigned") {
        reasons.push("source_row_identity_semantics_missing_or_unverified");
      }
      const hash = source.source_payload_sha256 ?? source.body_sha256;
      if (typeof hash !== "string" || !SHA256_RE.test(hash)) reasons.push("source_payload_sha256_missing_or_invalid");
      if (source.quote_unit !== "USD/BTC") reasons.push("canonical_unit_mismatch");

      if (reasons.length) {
        blocked.push({ source_id: source.source_id, metric_id: source.metric_id, reasons });
        continue;
      }

      const sourceAgeSeconds = Number(((Date.parse(source.retrieved_at) - Date.parse(source.latest_trade_observed_at)) / 1000).toFixed(3));

      candidates.push({
        candidate_state: "REVIEW_ONLY",
        persistable: false,
        asset_id: "btc",
        metric_id: "market.spot_price",
        value_numeric: Number(source.latest_trade_price_usd_per_btc),
        value_integer: null,
        unit: "USD/BTC",
        observed_at: source.latest_trade_observed_at,
        source_age_seconds_at_retrieval: sourceAgeSeconds,
        freshness_status: sourceAgeSeconds <= BTC_SPOT_MAX_AGE_SECONDS ? "CURRENT" : "STALE",
        freshness_policy_id: BTC_SPOT_FRESHNESS_POLICY_ID,
        period_start: null,
        period_end: null,
        source_id: source.source_id,
        source_url: source.url,
        source_updated_at: null,
        retrieved_at: source.retrieved_at,
        source_row_key: source.source_row_key,
        source_row_key_scope: source.source_row_key_scope,
        source_row_identity_status: source.source_row_identity_status,
        source_payload_sha256: hash.toLowerCase(),
        methodology: source.methodology ?? "kraken-public-trades-latest-trade-v1",
        methodology_version: String(source.methodology_version ?? "1"),
        revision: 1,
        revision_scope: "local_candidate_observation_record",
        revision_identity_status: "not_a_provider_revision",
        raw_body_file: source.body_file ?? null,
        note: "Candidate only. Freshness, duplicate/revision policy and ingestion approval remain separate checks."
      });
    } else if (source?.metric_id === "macro.dxy") {
      const reasons = [];
      if (source.status !== "CAPTURED") reasons.push("dxy_source_capture_blocked_or_missing");
      if (source.source_id !== "macro.yahoo_finance_candidate") reasons.push("dxy_source_identity_not_reviewed");
      if (source.url !== "https://finance.yahoo.com/quote/DX-Y.NYB/history/") reasons.push("dxy_source_url_not_approved");
      if (!(Number(source.daily_close) > 0) || !Number.isFinite(Number(source.daily_close))) reasons.push("dxy_daily_close_missing_or_invalid");
      if (source.quote_unit !== "index_points") reasons.push("dxy_unit_mismatch");
      if (!validIso(source.observed_at)) reasons.push("dxy_observation_timestamp_unverified");
      if (!validIso(source.retrieved_at)) reasons.push("dxy_retrieval_timestamp_missing_or_invalid");
      blocked.push({
        source_id: source.source_id ?? null,
        metric_id: source.metric_id,
        reasons: reasons.length ? reasons : ["dxy_not_approved_for_canonical_input"],
        candidate_state: "REVIEW_ONLY_BLOCKED",
        session_date: source.session_date ?? null,
        observed_at: validIso(source.observed_at) ? source.observed_at : null,
        retrieved_at: source.retrieved_at ?? null,
        source_url: source.url ?? null,
        freshness_window: "48h",
        freshness_status: "UNVERIFIABLE_UNTIL_SOURCE_TIMESTAMP_CONTRACT_PASSES",
        persistable: false
      });
    } else if (source?.metric_id === "institutional.etf_net_flow") {
      if (source?.source_id === "institutional.primary"
        && source?.url === "https://farside.co.uk/bitcoin-etf-flow-all-data/"
        && source?.status === "CAPTURED"
        && Array.isArray(source.latest_rows)) {
        const bodyHash = source.source_payload_sha256 ?? source.body_sha256 ?? null;
        for (const row of source.latest_rows) {
          const reported = row?.status === "REPORTED_CANDIDATE";
          const reconciliationAcceptableForReview = row?.reconciliation_status === "MATCHES_DISPLAY_ROUNDING";
          const date = typeof row?.period_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.period_start)
            ? row.period_start : null;
          const reasons = [];
          if (!date) reasons.push("provider_reporting_date_missing_or_invalid");
          if (!reported) reasons.push(row?.status === "UNREPORTED_PLACEHOLDER"
            ? "unreported_placeholder_not_a_zero_observation"
            : "row_not_reported");
          if (reported && !reconciliationAcceptableForReview) reasons.push("aggregate_reconciliation_not_accepted");
          // The parser's page-level digest identifies the captured response, not a provider row revision.
          // Publication/observation timestamps and provider finalization/revision remain unknown.
          etfReviewRows.push({
            candidate_state: reported && reconciliationAcceptableForReview ? "REVIEW_ONLY" : "REVIEW_ONLY_BLOCKED",
            persistable: false,
            asset_id: "btc",
            metric_id: "institutional.etf_net_flow",
            value_numeric: reported ? row.reported_total_usd_million : null,
            value_integer: null,
            unit: "USD million/day",
            expected_unit: "USD million/day",
            source_registered: true,
            observation_timestamp_semantics: "provider publication timestamp unavailable; reporting date is explicit",
            period_start: date,
            period_end: date,
            observed_at: null,
            source_updated_at: null,
            retrieved_at: source.retrieved_at ?? manifest?.retrieved_at ?? null,
            http_date: source.http_date ?? null,
            provider_last_modified: source.provider_last_modified ?? null,
            etag: source.etag ?? null,
            cache_control: source.cache_control ?? null,
            expires: source.expires ?? null,
            source_id: source.source_id,
            source_url: source.url,
            source_row_key: date ? `farside-btc-etf-flow:${date}` : null,
            source_payload_sha256: typeof bodyHash === "string" && SHA256_RE.test(bodyHash) ? bodyHash.toLowerCase() : null,
            source_payload_hash_scope: "full_http_response_body_not_individual_row",
            provider_revision: null,
            revision_identity_status: "provider_revision_unknown",
            finalization_status: "unknown",
            reported_total_usd_million: row.reported_total_usd_million ?? null,
            calculated_fund_sum_usd_million: row.calculated_fund_sum_usd_million ?? null,
            fund_sum_minus_reported_total_usd_million: row.fund_sum_minus_reported_total_usd_million ?? null,
            reconciliation_status: row.reconciliation_status ?? "INCOMPLETE",
            row_status: row.status ?? "UNRESOLVED_ROW",
            reasons: [...reasons, "provider_observation_or_publication_timestamp_unverified", "provider_revision_and_finalization_unverified"],
            raw_body_file: source.body_file ?? null
          });
        }
      } else if (source?.status === "CAPTURED" && Array.isArray(source.latest_rows)
        && ["institutional.sosovalue", "institutional.cryptoetf_today"].includes(String(source?.source_id))) {
        const sourceId = String(source.source_id);
        const expectedUrl = sourceId === "institutional.sosovalue"
          ? "https://openapi.sosovalue.com/openapi/v1/etfs/summary-history"
          : "https://mcp.cryptoetf.today/api/mcp";
        const bodyHash = source.source_payload_sha256 ?? source.body_sha256 ?? null;
        const sosoSource = sources.find(item => item?.source_id === "institutional.sosovalue"
          && item?.status === "CAPTURED" && Array.isArray(item.latest_rows));
        const sosoLatestDate = sosoSource
          ? sosoSource.latest_rows.map(item => item?.date).filter(date => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)).sort().reverse()[0]
          : null;
        for (const row of source.latest_rows) {
          const date = typeof row?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : null;
          const value = sourceId === "institutional.sosovalue" ? row?.total_net_inflow_usd_million : row?.net_flow_usd_million;
          const dateMs = date ? Date.parse(date + "T00:00:00Z") : NaN;
          const retrievedMs = Date.parse(String(source.retrieved_at ?? manifest?.retrieved_at ?? ""));
          const isConfirmedSession = sourceId === "institutional.sosovalue" || (sosoLatestDate && date <= sosoLatestDate);
          const valid = date && Number.isFinite(dateMs) && Number.isFinite(retrievedMs)
            && dateMs <= retrievedMs && retrievedMs - dateMs <= 14 * 24 * 3600000
            && isConfirmedSession && typeof value === "number" && Number.isFinite(value);
          const reasons = [];
          if (!date) reasons.push("provider_reporting_date_missing_or_invalid");
          if (!isConfirmedSession) reasons.push("session_not_confirmed_by_date-bearing_reference; placeholder_not_accepted");
          if (typeof value !== "number" || !Number.isFinite(value)) reasons.push("aggregate_flow_missing_or_invalid");
          if (source.url !== expectedUrl && !String(source.url ?? "").startsWith(expectedUrl)) reasons.push("source_url_does_not_match_registered_adapter");
          if (!valid || (source.url !== expectedUrl && !String(source.url ?? "").startsWith(expectedUrl))) {
            etfReviewRows.push({
              candidate_state: "REVIEW_ONLY_BLOCKED", persistable: false, asset_id: "btc",
              metric_id: "institutional.etf_net_flow", value_numeric: null, value_integer: null,
              unit: "USD million/day", expected_unit: "USD million/day", source_registered: true,
              period_start: date, period_end: date, observed_at: null,
              observation_timestamp_semantics: "provider supplies trading/reporting date only; publication timestamp unavailable",
              retrieved_at: source.retrieved_at ?? manifest?.retrieved_at ?? null,
              source_id: sourceId, source_url: source.url ?? null,
              source_row_key: date ? sourceId + ":" + date : null,
              source_payload_sha256: typeof bodyHash === "string" && SHA256_RE.test(bodyHash) ? bodyHash.toLowerCase() : null,
              source_payload_hash_scope: "full_http_response_body_not_individual_row",
              revision_identity_status: "provider_revision_unknown", finalization_status: "unknown",
              reconciliation_status: "UNRESOLVED", row_status: "UNRESOLVED_ROW", reasons,
              raw_body_file: source.body_file ?? null
            });
            continue;
          }
          etfReviewRows.push({
            candidate_state: "REVIEW_ONLY", persistable: false, asset_id: "btc",
            metric_id: "institutional.etf_net_flow", value_numeric: value, value_integer: null,
            unit: "USD million/day", expected_unit: "USD million/day", source_registered: true,
            period_start: date, period_end: date, observed_at: null,
            observation_timestamp_semantics: "provider supplies trading/reporting date only; publication timestamp unavailable",
            source_updated_at: source.source_updated_at ?? source.updated_at ?? null,
            retrieved_at: source.retrieved_at ?? manifest?.retrieved_at ?? null,
            source_id: sourceId, source_url: source.url,
            source_row_key: sourceId + ":" + date,
            source_payload_sha256: typeof bodyHash === "string" && SHA256_RE.test(bodyHash) ? bodyHash.toLowerCase() : null,
            source_payload_hash_scope: "full_http_response_body_not_individual_row",
            provider_revision: null, revision_identity_status: "provider_revision_unknown", finalization_status: "unknown",
            fund_values_complete: null, reconciliation_status: "AGGREGATE_ONLY", row_status: "AGGREGATE_ONLY",
            reasons: ["aggregate-only source; does not prove per-fund panel completeness", "provider publication timestamp and finality/revision semantics unknown"],
            raw_body_file: source.body_file ?? null
          });
        }
      } else if (source?.source_id === "institutional.tftc" && source?.status === "CAPTURED"
        && Array.isArray(source.recent_days_in_last_14_days)) {
        const bodyHash = source.source_payload_sha256 ?? source.body_sha256 ?? null;
        for (const row of source.recent_days_in_last_14_days) {
          const date = typeof row?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : null;
          const value = typeof row?.netFlowUsd === "number" ? row.netFlowUsd / 1_000_000 : NaN;
          const retrievedMs = Date.parse(String(source.retrieved_at ?? manifest?.retrieved_at ?? ""));
          const dateMs = date ? Date.parse(date + "T00:00:00Z") : NaN;
          const valid = date && Number.isFinite(dateMs) && Number.isFinite(retrievedMs) && dateMs <= retrievedMs
            && retrievedMs - dateMs <= 14 * 24 * 3600000 && Number.isFinite(value);
          if (!valid) continue;
          etfReviewRows.push({
            candidate_state: "REVIEW_ONLY", persistable: false, asset_id: "btc",
            metric_id: "institutional.etf_net_flow", value_numeric: value, value_integer: null,
            unit: "USD million/day", expected_unit: "USD million/day", source_registered: true,
            period_start: date, period_end: date, observed_at: null,
            observation_timestamp_semantics: "provider supplies reporting date only; source lineage includes SoSoValue; publication timestamp unavailable",
            source_updated_at: source.dateModified ?? source.updated_through ?? null,
            retrieved_at: source.retrieved_at ?? manifest?.retrieved_at ?? null,
            source_id: source.source_id, source_url: source.url,
            source_row_key: "institutional.tftc:" + date,
            source_payload_sha256: typeof bodyHash === "string" && SHA256_RE.test(bodyHash) ? bodyHash.toLowerCase() : null,
            source_payload_hash_scope: "full_http_response_body_not_individual_row",
            provider_revision: null, revision_identity_status: "provider_revision_unknown", finalization_status: "unknown",
            fund_values_complete: row.perEtfUsd && typeof row.perEtfUsd === "object" ? Object.values(row.perEtfUsd).every(v => typeof v === "number" && Number.isFinite(v)) : null,
            reconciliation_status: "AGGREGATE_ONLY", row_status: "AGGREGATE_ONLY",
            reasons: ["TFTC aggregate lineage includes SoSoValue; not independent confirmation", "provider publication timestamp and finality/revision semantics unknown"],
            raw_body_file: source.body_file ?? null
          });
        }
      } else {
        blocked.push({
          source_id: source.source_id ?? null,
          metric_id: source.metric_id,
          reasons: ["ETF_source_not_canonical_or_capture_missing_parsed_reporting_rows"]
        });
      }
    }
  }

  const farside = sources.find(source =>
    source?.source_id === "institutional.primary"
    && source?.url === "https://farside.co.uk/bitcoin-etf-flow-all-data/"
    && source?.status === "CAPTURED"
    && Array.isArray(source.latest_rows));
  const tftc = sources.find(source =>
    source?.source_id === "institutional.tftc"
    && source?.url === "https://www.tftc.io/bitcoin-etf-flows/data.json"
    && source?.status === "CAPTURED"
    && (Array.isArray(source.recent_days_in_last_14_days) || Array.isArray(source.recent_days)));
  if (farside && tftc) {
    const tftcRecentDays = Array.isArray(tftc.recent_days_in_last_14_days)
      ? tftc.recent_days_in_last_14_days : tftc.recent_days;
    const tftcByDate = new Map(tftcRecentDays
      .filter(row => typeof row?.date === "string")
      .map(row => [row.date, row]));
    for (const row of farside.latest_rows) {
      const date = row?.period_start;
      const mirrorRow = typeof date === "string" ? tftcByDate.get(date) : null;
      if (!mirrorRow) continue;
      const farsideTotal = row?.status === "REPORTED_CANDIDATE"
        && typeof row.reported_total_usd_million === "number"
        && Number.isFinite(row.reported_total_usd_million)
        ? row.reported_total_usd_million : null;
      const tftcTotal = typeof mirrorRow.netFlowUsd === "number" && Number.isFinite(mirrorRow.netFlowUsd)
        ? mirrorRow.netFlowUsd / 1_000_000 : null;
      const delta = farsideTotal !== null && tftcTotal !== null
        ? Number((tftcTotal - farsideTotal).toFixed(9)) : null;
      const fundDeltas = {};
      const tftcFunds = mirrorRow.perEtfUsd && typeof mirrorRow.perEtfUsd === "object"
        ? mirrorRow.perEtfUsd : {};
      for (const [fund, farsideValue] of Object.entries(row?.fund_flows ?? {})) {
        if (typeof farsideValue === "number" && Number.isFinite(farsideValue)
          && Object.prototype.hasOwnProperty.call(tftcFunds, fund)
          && typeof tftcFunds[fund] === "number" && Number.isFinite(tftcFunds[fund])) {
          const difference = tftcFunds[fund] / 1_000_000 - farsideValue;
          if (Math.abs(difference) > 0.000000001) fundDeltas[fund] = Number(difference.toFixed(9));
        }
      }
      etfCrossSourceComparisons.push({
        period_start: date,
        source_a: "institutional.primary",
        source_a_url: farside.url,
        source_a_payload_sha256: farside.source_payload_sha256 ?? farside.body_sha256 ?? null,
        source_a_total_usd_million: farsideTotal,
        source_b: "institutional.tftc",
        source_b_url: tftc.url,
        source_b_payload_sha256: tftc.source_payload_sha256 ?? tftc.body_sha256 ?? null,
        source_b_total_usd_million: tftcTotal,
        delta_b_minus_a_usd_million: delta,
        absolute_delta_usd_million: delta === null ? null : Math.abs(delta),
        screening_band_usd_million: 0.65,
        screening_status: delta === null ? "NOT_COMPARABLE"
          : Math.abs(delta) > 0.65 ? "DELTA_EXCEEDS_SCREENING_BAND"
          : "DELTA_WITHIN_SCREENING_BAND",
        differing_fund_values_usd_million: fundDeltas,
        source_b_updated_through: tftc.updated_through ?? null,
        decision: "DIAGNOSTIC_ONLY_NOT_SOURCE_ACCEPTANCE",
        note: "TFTC is an auxiliary mirror with distinct lineage. The 0.65m band is a screening flag only; cross-source agreement does not approve ingestion, and a difference does not by itself prove which source is wrong."
      });
    }
  }

  const sosovalue = sources.find(source =>
    source?.source_id === "institutional.sosovalue"
    && source?.url?.startsWith("https://openapi.sosovalue.com/openapi/v1/etfs/summary-history")
    && source?.status === "CAPTURED"
    && Array.isArray(source.latest_rows));
  if (farside && sosovalue) {
    const sosoByDate = new Map(sosovalue.latest_rows
      .filter(row => typeof row?.date === "string")
      .map(row => [row.date, row]));
    for (const row of farside.latest_rows) {
      const date = row?.period_start;
      const sosoRow = typeof date === "string" ? sosoByDate.get(date) : null;
      if (!sosoRow) continue;
      const farsideTotal = row?.status === "REPORTED_CANDIDATE"
        && typeof row.reported_total_usd_million === "number"
        && Number.isFinite(row.reported_total_usd_million)
        ? row.reported_total_usd_million : null;
      const sosoTotal = typeof sosoRow.total_net_inflow_usd_million === "number"
        && Number.isFinite(sosoRow.total_net_inflow_usd_million)
        ? sosoRow.total_net_inflow_usd_million : null;
      const delta = farsideTotal !== null && sosoTotal !== null
        ? Number((sosoTotal - farsideTotal).toFixed(9)) : null;
      etfCrossSourceComparisons.push({
        period_start: date,
        source_a: "institutional.primary",
        source_a_url: farside.url,
        source_a_payload_sha256: farside.source_payload_sha256 ?? farside.body_sha256 ?? null,
        source_a_total_usd_million: farsideTotal,
        source_b: "institutional.sosovalue",
        source_b_url: sosovalue.url,
        source_b_payload_sha256: sosovalue.source_payload_sha256 ?? sosovalue.body_sha256 ?? null,
        source_b_total_usd_million: sosoTotal,
        delta_b_minus_a_usd_million: delta,
        absolute_delta_usd_million: delta === null ? null : Math.abs(delta),
        screening_band_usd_million: 0.65,
        screening_status: delta === null ? "NOT_COMPARABLE"
          : Math.abs(delta) > 0.65 ? "DELTA_EXCEEDS_SCREENING_BAND"
          : "DELTA_WITHIN_SCREENING_BAND",
        decision: "DIAGNOSTIC_ONLY_NOT_SOURCE_ACCEPTANCE",
        source_b_observation_timestamp_semantics: sosovalue.observation_timestamp_semantics ?? "trading date only; publication/finality unverified",
        note: "SoSoValue comparison is a cross-check only. Agreement does not approve either source; date-only rows do not establish publication time, finality or revision semantics."
      });
    }
  }

  return {
    schema_version: 1,
    asset_id: "btc",
    mode: "review-only-normalized-candidates",
    production_database_accessed: false,
    production_writes_performed: false,
    candidates,
    etf_review_rows: etfReviewRows,
    etf_cross_source_comparisons: etfCrossSourceComparisons,
    blocked,
    unresolved: Array.isArray(manifest?.unresolved) ? manifest.unresolved : []
  };
}

async function main() {
  const inputPath = resolve(process.argv[2] ?? "tmp/btc-source-review/manifest.json");
  const outputPath = resolve(process.argv[3] ?? join(dirname(inputPath), "observation-candidates.json"));
  const manifest = JSON.parse(await readFile(inputPath, "utf8"));
  const result = prepareBtcObservationCandidates(manifest);
  await writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  process.stdout.write(JSON.stringify({
    status: "ok",
    mode: result.mode,
    candidates: result.candidates.length,
    blocked: result.blocked.length,
    output: outputPath,
    production_database_accessed: false,
    production_writes_performed: false
  }) + "\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  });
}
