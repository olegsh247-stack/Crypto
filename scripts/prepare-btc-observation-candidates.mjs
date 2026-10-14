#!/usr/bin/env node
/**
 * Map a read-only BTC source-capture manifest into review-only normalized candidates.
 * This script never connects to PostgreSQL or marks candidates ready for ingestion.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const KRAKEN_URL = "https://api.kraken.com/0/public/Trades?pair=XBTUSD";
const SHA256_RE = /^[0-9a-f]{64}$/i;

function validIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    && !Number.isNaN(Date.parse(value));
}

export function prepareBtcObservationCandidates(manifest) {
  const candidates = [];
  const blocked = [];
  const etfReviewRows = [];
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
      const hash = source.source_payload_sha256 ?? source.body_sha256;
      if (typeof hash !== "string" || !SHA256_RE.test(hash)) reasons.push("source_payload_sha256_missing_or_invalid");
      if (source.quote_unit !== "USD/BTC") reasons.push("canonical_unit_mismatch");

      if (reasons.length) {
        blocked.push({ source_id: source.source_id, metric_id: source.metric_id, reasons });
        continue;
      }

      candidates.push({
        candidate_state: "REVIEW_ONLY",
        persistable: false,
        asset_id: "btc",
        metric_id: "market.spot_price",
        value_numeric: Number(source.latest_trade_price_usd_per_btc),
        value_integer: null,
        unit: "USD/BTC",
        observed_at: source.latest_trade_observed_at,
        period_start: null,
        period_end: null,
        source_id: source.source_id,
        source_url: source.url,
        source_updated_at: null,
        retrieved_at: source.retrieved_at,
        source_row_key: source.source_row_key,
        source_payload_sha256: hash.toLowerCase(),
        methodology: source.methodology ?? "kraken-public-trades-latest-trade-v1",
        methodology_version: String(source.methodology_version ?? "1"),
        revision: 1,
        raw_body_file: source.body_file ?? null,
        note: "Candidate only. Freshness, duplicate/revision policy and ingestion approval remain separate checks."
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
          const date = typeof row?.period_start === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(row.period_start)
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
            candidate_state: "REVIEW_ONLY_BLOCKED",
            persistable: false,
            asset_id: "btc",
            metric_id: "institutional.etf_net_flow",
            value_numeric: reported ? row.reported_total_usd_million : null,
            value_integer: null,
            unit: "USD million/day",
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
      } else {
        blocked.push({
          source_id: source.source_id ?? null,
          metric_id: source.metric_id,
          reasons: ["ETF_source_not_canonical_or_capture_missing_parsed_reporting_rows"]
        });
      }
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
