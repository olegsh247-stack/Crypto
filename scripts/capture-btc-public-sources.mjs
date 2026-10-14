#!/usr/bin/env node
/**
 * Read-only public-source capture for BTC input review.
 *
 * Writes raw responses and a provenance manifest to tmp/btc-source-review.
 * Does not connect to PostgreSQL, ingest observations, or mutate scenario state.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeKrakenLegacyTrades } from "./btc-source-contracts.mjs";

const outDir = join(process.cwd(), "tmp", "btc-source-review");
await mkdir(outDir, { recursive: true });

const retrievedAt = new Date().toISOString();
const manifest = {
  schema_version: 1,
  asset_id: "btc",
  retrieved_at: retrievedAt,
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
      reason: "The Farside page capture is preserved for review, but the exact publication timestamp and parser reconciliation contract are not inferred from page retrieval time."
    }
  ]
};

async function capture({ name, metricId, sourceId, url, parse }) {
  const item = {
    name,
    metric_id: metricId,
    source_id: sourceId,
    url,
    retrieved_at: null,
    status: "FAILED"
  };
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Crypto-BTC-Source-Review/1.0", "accept": "application/json,text/html;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(20000)
    });
    item.http_status = response.status;
    item.content_type = response.headers.get("content-type");
    const body = await response.text();
    item.retrieved_at = new Date().toISOString();
    item.body_sha256 = await sha256(body);
    item.body_file = `${name}.raw`;
    await writeFile(join(outDir, item.body_file), body, "utf8");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parse ? parse(body, item) : null;
    item.status = "CAPTURED";
    if (parsed) Object.assign(item, parsed);
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
  }
  manifest.sources.push(item);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

await capture({
  name: "kraken-xbtusd-trades",
  metricId: "market.spot_price",
  sourceId: "market.kraken",
  url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
  parse: (body, captureMeta) => {
    const normalized = normalizeKrakenLegacyTrades(JSON.parse(body), {
      retrievedAt: captureMeta.retrieved_at,
      requestedPair: "XBTUSD",
    });
    const data = JSON.parse(body);
    const trades = data.result[normalized.source_pair_key];
    return {
      pair_key: normalized.source_pair_key,
      requested_pair: normalized.requested_pair,
      latest_trade_price_usd_per_btc: normalized.value,
      latest_trade_epoch_seconds: Date.parse(normalized.observed_at) / 1000,
      latest_trade_observed_at: normalized.observed_at,
      latest_trade_volume: normalized.raw_trade_volume,
      latest_trade_raw_row: normalized.raw_trade_row,
      trade_rows_in_response: trades.length,
      timestamp_semantics: normalized.timestamp_semantics,
      note: "Latest source trade timestamp is observation time; retrieved_at is recorded after the response body is read."
    };
  }
});

await capture({
  name: "mempool-hashrate-1w",
  metricId: "security.hashrate",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/hashrate/1w",
  parse: body => {
    const data = JSON.parse(body);
    const rows = Array.isArray(data) ? data
      : Array.isArray(data.hashrates) ? data.hashrates
      : Array.isArray(data.data) ? data.data
      : [];
    const latest = rows.reduce((best, row) =>
      !best || Number(row.timestamp) > Number(best.timestamp) ? row : best, null);
    const epochSeconds = latest ? Number(latest.timestamp) : NaN;
    const hashrate = latest ? Number(latest.avgHashrate ?? latest.hashrate ?? latest.value) : NaN;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      row_count: rows.length,
      latest_series_timestamp: Number.isFinite(epochSeconds) ? new Date(epochSeconds * 1000).toISOString() : null,
      latest_series_value_eh_s: Number.isFinite(hashrate) ? hashrate / 1e18 : null,
      note: "Raw response retained. Confirm bucket/window semantics and units before treating the latest point as an observation; do not label a rolling estimate as instantaneous hashrate."
    };
  }
});

await capture({
  name: "mempool-block-fees-1w",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/blocks/fees/1w",
  parse: body => {
    const data = JSON.parse(body);
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      row_count: Array.isArray(data) ? data.length : null,
      note: "Raw response retained. Fee/subsidy values are not calculated until fee units, block window, and subsidy denominator are verified."
    };
  }
});

await capture({
  name: "farside-btc-etf-page",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.primary",
  url: "https://farside.co.uk/btc/",
  parse: body => ({
    html_characters: body.length,
    note: "Raw page retained for parser review. Retrieval time is not treated as ETF observation/publication time; dash/placeholder rows must not become zero."
  })
});

await capture({
  name: "tftc-btc-etf-json-candidate",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.tftc",
  url: "https://www.tftc.io/bitcoin-etf-flows/data.json",
  parse: body => {
    const data = JSON.parse(body);
    const rows = Array.isArray(data) ? data
      : Array.isArray(data.days) ? data.days
      : Array.isArray(data.data) ? data.data
      : Array.isArray(data.rows) ? data.rows
      : Array.isArray(data.flows) ? data.flows
      : null;
    const earliestRecentDay = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recentDays = rows ? rows.filter(row => String(row.date ?? row.day ?? "") >= earliestRecentDay) : null;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      row_count: rows ? rows.length : null,
      updated_through: data.updatedThrough ?? null,
      license: data.license ?? null,
      attribution: data.attribution ?? null,
      source_lineage: data.sources ?? null,
      first_row_keys: rows && rows.length && rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0]) : [],
      latest_day: rows && rows.length ? rows[rows.length - 1] : null,
      recent_days_in_last_14_days: recentDays,
      note: "Candidate mirror only. Inspect source lineage, date semantics, revisions and dash/null handling before using any row as canonical ETF flow."
    };
  }
});

await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  manifest: "tmp/btc-source-review/manifest.json",
  sources: manifest.sources.map(({ name, status, http_status, error, latest_trade_observed_at, latest_trade_price_usd_per_btc, row_count }) =>
    ({ name, status, http_status, error, latest_trade_observed_at, latest_trade_price_usd_per_btc, row_count })),
  unresolved: manifest.unresolved
}, null, 2));

const requiredNames = ["kraken-xbtusd-trades", "mempool-hashrate-1w", "mempool-block-fees-1w"];
const requiredCaptureFailed = requiredNames.some(name =>
  !manifest.sources.some(source => source.name === name && source.status === "CAPTURED"));
const etfCaptureSucceeded = manifest.sources.some(source =>
  ["farside-btc-etf-page", "tftc-btc-etf-json-candidate"].includes(source.name)
  && source.status === "CAPTURED");
if (requiredCaptureFailed || !etfCaptureSucceeded) process.exitCode = 1;
