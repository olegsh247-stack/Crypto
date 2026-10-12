#!/usr/bin/env node
/**
 * Read-only public-source capture for BTC input review.
 *
 * Writes raw responses and a provenance manifest to tmp/btc-source-review.
 * Does not connect to PostgreSQL, ingest observations, or mutate scenario state.
 * CAPTURED means only that the HTTP response was saved and its parser ran;
 * validation_status separately records whether fields are usable as an input.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "tmp", "btc-source-review");
await mkdir(outDir, { recursive: true });

const manifest = {
  schema_version: 2,
  asset_id: "btc",
  retrieved_at: new Date().toISOString(),
  mode: "read-only-staging-only",
  production_database_accessed: false,
  production_writes_performed: false,
  sources: [],
  unresolved: [
    {
      metric_id: "macro.dxy",
      reason: "No canonical, accessible DXY feed and observation-time convention has been approved. Do not substitute a broad USD index or mix vendor quotes."
    },
    {
      metric_id: "institutional.etf_net_flow",
      reason: "Farside returned HTTP 403 in the latest staging run. TFTC is a candidate mirror only; source lineage, licence, revision and date semantics must be reviewed before accepting it."
    },
    {
      metric_id: "security.fee_subsidy_ratio",
      reason: "Raw fee and reward series are captured separately. Do not calculate the ratio until response semantics, units, and matched time/block windows are validated."
    }
  ]
};

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function capture({ name, metricId, sourceId, url, parse }) {
  const item = {
    name,
    metric_id: metricId,
    source_id: sourceId,
    url,
    retrieved_at: new Date().toISOString(),
    status: "FAILED",
    validation_status: "NOT_RUN"
  };
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Crypto-BTC-Source-Review/1.1",
        "accept": "application/json,text/html;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(20000)
    });
    item.http_status = response.status;
    item.content_type = response.headers.get("content-type");
    const body = await response.text();
    item.body_sha256 = await sha256(body);
    item.body_file = `${name}.raw`;
    await writeFile(join(outDir, item.body_file), body, "utf8");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parse ? parse(body) : {};
    item.status = "CAPTURED";
    Object.assign(item, parsed);
    if (item.validation_status === "NOT_RUN") item.validation_status = "RAW_ONLY";
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
    item.validation_status = "FAILED";
  }
  manifest.sources.push(item);
}

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Response is not valid JSON");
  }
}

await capture({
  name: "kraken-xbtusd-trades",
  metricId: "market.spot_price",
  sourceId: "market.kraken",
  url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
  parse: body => {
    const data = parseJson(body);
    if (Array.isArray(data.error) && data.error.length) throw new Error(`Kraken API error: ${data.error.join(", ")}`);
    const result = data.result ?? {};
    const pairKey = Object.keys(result).find(key => key !== "last");
    const trades = result[pairKey];
    if (!pairKey || !Array.isArray(trades) || trades.length === 0) throw new Error("Kraken response has no trade rows");
    const latest = trades.reduce((best, row) => Number(row[2]) > Number(best[2]) ? row : best);
    const price = Number(latest[0]);
    const epochSeconds = Number(latest[2]);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(epochSeconds) || epochSeconds <= 0) {
      throw new Error("Kraken latest trade has invalid price/timestamp");
    }
    const observedAt = new Date(epochSeconds * 1000);
    if (Number.isNaN(observedAt.getTime())) throw new Error("Kraken trade timestamp is invalid");
    return {
      validation_status: "FIELDS_PARSED_UNIT_REVIEW_REQUIRED",
      pair_key: pairKey,
      requested_pair: "XBTUSD",
      latest_trade_price_usd_per_btc: price,
      unit: "USD/BTC",
      latest_trade_epoch_seconds: epochSeconds,
      observed_at: observedAt.toISOString(),
      trade_rows_in_response: trades.length,
      note: "Source trade time is observed_at; retrieved_at is capture time. Check freshness against the metric registry before acceptance."
    };
  }
});

await capture({
  name: "mempool-hashrate-1w",
  metricId: "security.hashrate",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/hashrate/1w",
  parse: body => {
    const data = parseJson(body);
    if (!Array.isArray(data) || data.length === 0) throw new Error("Expected a non-empty hashrate series array");
    const latest = data.reduce((best, row) => Number(row?.timestamp) > Number(best?.timestamp) ? row : best);
    const epochSeconds = Number(latest?.timestamp);
    const hashesPerSecond = Number(latest?.avgHashrate);
    if (!Number.isFinite(epochSeconds) || epochSeconds <= 0 || !Number.isFinite(hashesPerSecond) || hashesPerSecond <= 0) {
      throw new Error("Hashrate series row lacks a valid timestamp/avgHashrate");
    }
    return {
      validation_status: "FIELDS_PARSED_AGGREGATION_SEMANTICS_REVIEW_REQUIRED",
      aggregation_endpoint: "1w",
      response_shape: "array",
      row_count: data.length,
      source_value_hashes_per_second: hashesPerSecond,
      latest_series_value_eh_s: hashesPerSecond / 1e18,
      unit: "EH/s",
      observed_at: new Date(epochSeconds * 1000).toISOString(),
      note: "Converted hashes/s to EH/s using 1e18. The 1w endpoint is an aggregate series; confirm bucket semantics and freshness before acceptance."
    };
  }
});

await capture({
  name: "mempool-block-fees-24h",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/blocks/fees/24h",
  parse: body => {
    const data = parseJson(body);
    const rows = Array.isArray(data) ? data : null;
    return {
      validation_status: rows && rows.length ? "RAW_CAPTURED_WINDOW_AND_UNIT_REVIEW_REQUIRED" : "RAW_CAPTURED_SCHEMA_REVIEW_REQUIRED",
      response_shape: Array.isArray(data) ? "array" : typeof data,
      row_count: rows?.length ?? null,
      note: "Raw fee component only. Do not derive a ratio until fee units and its window are reconciled with the reward component."
    };
  }
});

await capture({
  name: "mempool-block-rewards-24h",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/blocks/rewards/24h",
  parse: body => {
    const data = parseJson(body);
    const rows = Array.isArray(data) ? data : null;
    return {
      validation_status: rows && rows.length ? "RAW_CAPTURED_WINDOW_AND_UNIT_REVIEW_REQUIRED" : "RAW_CAPTURED_SCHEMA_REVIEW_REQUIRED",
      response_shape: Array.isArray(data) ? "array" : typeof data,
      row_count: rows?.length ?? null,
      note: "Raw reward component only. Do not derive a ratio until reward meaning, units and its window are reconciled with the fee component."
    };
  }
});

await capture({
  name: "farside-btc-etf-page",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.primary",
  url: "https://farside.co.uk/btc/",
  parse: body => ({
    validation_status: "RAW_HTML_ONLY_PARSER_AND_PUBLICATION_TIME_REVIEW_REQUIRED",
    html_characters: body.length,
    note: "Raw page retained for parser review. Retrieval time is not publication/observation time; dash and placeholder rows must not become zero."
  })
});

await capture({
  name: "tftc-btc-etf-json-candidate",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.tftc",
  url: "https://www.tftc.io/bitcoin-etf-flows/data.json",
  parse: body => {
    const data = parseJson(body);
    const rows = Array.isArray(data) ? data
      : Array.isArray(data.days) ? data.days
      : Array.isArray(data.data) ? data.data
      : Array.isArray(data.rows) ? data.rows
      : Array.isArray(data.flows) ? data.flows
      : null;
    return {
      validation_status: "CANDIDATE_MIRROR_NOT_CANONICAL",
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      row_count: rows ? rows.length : null,
      updated_through: data.updatedThrough ?? null,
      license: data.license ?? null,
      attribution: data.attribution ?? null,
      source_lineage: data.sources ?? null,
      first_row_keys: rows && rows.length && rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0]) : [],
      latest_day: rows && rows.length ? rows[rows.length - 1] : null,
      note: "Candidate mirror only. Do not treat as canonical until source lineage, licence, date semantics, revisions and null/dash handling are reviewed."
    };
  }
});

await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  manifest: "tmp/btc-source-review/manifest.json",
  sources: manifest.sources.map(({ name, status, validation_status, http_status, error, observed_at, latest_trade_price_usd_per_btc, latest_series_value_eh_s, row_count, body_sha256 }) =>
    ({ name, status, validation_status, http_status, error, observed_at, latest_trade_price_usd_per_btc, latest_series_value_eh_s, row_count, body_sha256 })),
  unresolved: manifest.unresolved
}, null, 2));

// This workflow validates that responses can be captured for review, not that BTC
// inputs are complete or that scenario evaluation is permitted.
const captureFailed = manifest.sources.some(source => source.status !== "CAPTURED");
if (captureFailed) process.exitCode = 1;
