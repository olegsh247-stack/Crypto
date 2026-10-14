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
  const sources = Array.isArray(manifest?.sources) ? manifest.sources : [];

  for (const source of sources) {
    if (source?.metric_id === "market.spot_price" && source?.source_id === "market.kraken") {
      const reasons = [];
      if (source.status !== "CAPTURED") reasons.push("source_capture_not_successful");
      if (source.url !== KRAKEN_URL) reasons.push("canonical_kraken_endpoint_mismatch");
      if (!(Number(source.latest_trade_price_usd_per_btc) > 0)
        || !Number.isFinite(Number(source.latest_trade_price_usd_per_btc))) reasons.push("price_missing_or_invalid");
      if (!validIso(source.latest_trade_observed_at) || source.latest_trade_observed_at !== source.observed_at) reasons.push("source_observation_timestamp_missing_or_inconsistent");
      if (!validIso(source.retrieved_at)) reasons.push("retrieval_timestamp_missing_or_invalid");
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
      blocked.push({
        source_id: source.source_id ?? null,
        metric_id: source.metric_id,
        reasons: ["row_level_values_and_provider_reporting_dates_not_yet_normalized"]
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
