#!/usr/bin/env node
/**
 * Read-only public-source capture for BTC input review.
 *
 * Writes raw responses and a provenance manifest to tmp/btc-source-review.
 * Does not connect to PostgreSQL, ingest observations, or mutate scenario state.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseFarsideEtfTable } from "./parse-farside-etf-table.mjs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(process.cwd(), "tmp", "btc-source-review");
await mkdir(outDir, { recursive: true });

const retrievedAt = new Date().toISOString();
const captureProvenance = {
  contract_version: "1",
  capture_script_sha256: createHash("sha256").update(await readFile(fileURLToPath(import.meta.url))).digest("hex"),
  farside_parser_sha256: createHash("sha256").update(await readFile(fileURLToPath(new URL("./parse-farside-etf-table.mjs", import.meta.url)))).digest("hex")
};
const manifest = {
  schema_version: 1,
  asset_id: "btc",
  retrieved_at: retrievedAt,
  mode: "read-only-staging-only",
  capture_provenance: captureProvenance,
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
    retrieved_at: new Date().toISOString(),
    status: "FAILED"
  };
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Crypto-BTC-Source-Review/1.0", "accept": "application/json,text/html;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(20000)
    });
    item.http_status = response.status;
    item.content_type = response.headers.get("content-type");
    // Preserve provider/transport metadata for source-revision review. These headers
    // are evidence only; they must not be relabeled as the metric's observed_at.
    item.response_url = response.url;
    item.http_date = response.headers.get("date");
    item.provider_last_modified = response.headers.get("last-modified");
    item.etag = response.headers.get("etag");
    item.cache_control = response.headers.get("cache-control");
    item.expires = response.headers.get("expires");
    const body = await response.text();
    item.body_sha256 = await sha256(body);
    // Same digest is carried under the database-contract field name for later review-only mapping.
    item.source_payload_sha256 = item.body_sha256;
    item.body_file = `${name}.raw`;
    await writeFile(join(outDir, item.body_file), body, "utf8");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parse ? parse(body) : null;
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
  parse: body => {
    const data = JSON.parse(body);
    if (Array.isArray(data.error) && data.error.length) throw new Error(`Kraken API error: ${data.error.join(", ")}`);
    const result = data.result ?? {};
    const pairKey = Object.keys(result).find(key => key !== "last");
    const trades = result[pairKey];
    if (!pairKey || !Array.isArray(trades) || trades.length === 0) throw new Error("Kraken response has no trade rows");
    const latest = trades.reduce((best, row) => Number(row[2]) > Number(best[2]) ? row : best);
    const epochSeconds = Number(latest[2]);
    if (!Number.isFinite(epochSeconds) || !Number.isFinite(Number(latest[0]))) throw new Error("Kraken latest trade has invalid price/timestamp");
    return {
      pair_key: pairKey,
      requested_pair: "XBTUSD",
      quote_unit: "USD/BTC",
      latest_trade_price_usd_per_btc: Number(latest[0]),
      latest_trade_epoch_seconds: epochSeconds,
      latest_trade_observed_at: new Date(epochSeconds * 1000).toISOString(),
      observed_at: new Date(epochSeconds * 1000).toISOString(),
      source_row_key: `XBTUSD:${epochSeconds}:${String(latest[0])}:${String(latest[1])}:${String(latest[3] ?? "")}:${String(latest[4] ?? "")}:${String(latest[5] ?? "")}`,
      source_row_key_scope: "pair_timestamp_price_volume_side_order_type_misc",
      source_row_identity_status: "derived_composite_key_not_provider_assigned",
      methodology: "kraken-public-trades-latest-trade-v1",
      methodology_version: "1",
      trade_rows_in_response: trades.length,
      note: "Latest trade timestamp is source observation time; retrieved_at is capture time."
    };
  }
});

// These exchange feeds are corroboration candidates only. BTC/USDT is not BTC/USD;
// keep the unit and venue separate, and never merge these rows into the canonical quote.
await capture({
  name: "binance-btcusdt-trades",
  metricId: "market.spot_price",
  sourceId: "market.binance",
  url: "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=1000",
  parse: body => {
    const rows = JSON.parse(body);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Binance response has no trade rows");
    const latest = rows.reduce((best, row) => Number(row.time) > Number(best.time) ? row : best);
    const price = Number(latest.price);
    const epochMs = Number(latest.time);
    if (!(price > 0) || !Number.isFinite(epochMs)) throw new Error("Binance latest trade has invalid price/timestamp");
    return {
      pair: "BTCUSDT",
      quote_unit: "USDT/BTC",
      latest_trade_price_usdt_per_btc: price,
      latest_trade_epoch_ms: epochMs,
      latest_trade_observed_at: new Date(epochMs).toISOString(),
      observed_at: new Date(epochMs).toISOString(),
      source_row_key: `BTCUSDT:${String(latest.id)}`,
      methodology: "binance-public-trades-latest-trade-v1",
      methodology_version: "1",
      trade_rows_in_response: rows.length,
      role: "independent cross-check candidate; not canonical USD/BTC",
      note: "Trade time is source event time. Do not equate USDT with USD or blend into the Kraken quote."
    };
  }
});

// Binance documents a dedicated market-data-only domain. Keep this as a separate
// capture so a region-restricted api.binance.com response does not hide whether
// the same public market data is reachable from the runner.
await capture({
  name: "binance-btcusdt-trades-market-data",
  metricId: "market.spot_price",
  sourceId: "market.binance",
  url: "https://data-api.binance.vision/api/v3/trades?symbol=BTCUSDT&limit=1000",
  parse: body => {
    const rows = JSON.parse(body);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Binance market-data response has no trade rows");
    const latest = rows.reduce((best, row) => Number(row.time) > Number(best.time) ? row : best);
    const price = Number(latest.price);
    const epochMs = Number(latest.time);
    if (!(price > 0) || !Number.isFinite(epochMs)) throw new Error("Binance market-data latest trade has invalid price/timestamp");
    return {
      pair: "BTCUSDT",
      quote_unit: "USDT/BTC",
      latest_trade_price_usdt_per_btc: price,
      latest_trade_epoch_ms: epochMs,
      latest_trade_observed_at: new Date(epochMs).toISOString(),
      observed_at: new Date(epochMs).toISOString(),
      source_row_key: `BTCUSDT:${String(latest.id)}`,
      methodology: "binance-public-market-data-trades-latest-trade-v1",
      methodology_version: "1",
      trade_rows_in_response: rows.length,
      role: "independent cross-check candidate; not canonical USD/BTC",
      note: "Official Binance market-data-only domain; trade time is source event time. Do not equate USDT with USD or blend into the Kraken quote."
    };
  }
});

await capture({
  name: "okx-btcusdt-trades",
  metricId: "market.spot_price",
  sourceId: "market.okx",
  url: "https://www.okx.com/api/v5/market/trades?instId=BTC-USDT&limit=500",
  parse: body => {
    const data = JSON.parse(body);
    if (String(data.code) !== "0" || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error(`OKX API response invalid: code=${data.code ?? "missing"}`);
    }
    const latest = data.data.reduce((best, row) => Number(row.ts) > Number(best.ts) ? row : best);
    const price = Number(latest.px);
    const epochMs = Number(latest.ts);
    if (!(price > 0) || !Number.isFinite(epochMs)) throw new Error("OKX latest trade has invalid price/timestamp");
    return {
      pair: "BTC-USDT",
      quote_unit: "USDT/BTC",
      latest_trade_price_usdt_per_btc: price,
      latest_trade_epoch_ms: epochMs,
      latest_trade_observed_at: new Date(epochMs).toISOString(),
      observed_at: new Date(epochMs).toISOString(),
      source_row_key: `BTC-USDT:${String(latest.tradeId)}`,
      methodology: "okx-public-trades-latest-trade-v1",
      methodology_version: "1",
      trade_rows_in_response: data.data.length,
      role: "independent cross-check candidate; not canonical USD/BTC",
      note: "Trade time is source event time. Do not equate USDT with USD or blend into the Kraken quote."
    };
  }
});

await capture({
  name: "bybit-btcusdt-trades",
  metricId: "market.spot_price",
  sourceId: "market.bybit",
  url: "https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=BTCUSDT&limit=1000",
  parse: body => {
    const data = JSON.parse(body);
    if (Number(data.retCode) !== 0 || !Array.isArray(data.result?.list) || data.result.list.length === 0) {
      throw new Error(`Bybit API response invalid: retCode=${data.retCode ?? "missing"}`);
    }
    const rows = data.result.list;
    const latest = rows.reduce((best, row) => Number(row.time) > Number(best.time) ? row : best);
    const price = Number(latest.price);
    const epochMs = Number(latest.time);
    if (!(price > 0) || !Number.isFinite(epochMs)) throw new Error("Bybit latest trade has invalid price/timestamp");
    return {
      pair: "BTCUSDT",
      quote_unit: "USDT/BTC",
      latest_trade_price_usdt_per_btc: price,
      latest_trade_epoch_ms: epochMs,
      latest_trade_observed_at: new Date(epochMs).toISOString(),
      observed_at: new Date(epochMs).toISOString(),
      source_row_key: `BTCUSDT:${String(latest.execId ?? latest.exec_id ?? latest.time)}`,
      methodology: "bybit-public-recent-trade-latest-trade-v1",
      methodology_version: "1",
      trade_rows_in_response: rows.length,
      role: "independent cross-check candidate; not canonical USD/BTC",
      note: "Trade time is source event time. Do not equate USDT with USD or blend into the Kraken quote."
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

// Official Farside all-data page is captured separately as an access/reconciliation
// diagnostic. The read-only readiness gate recognizes this official URL under the same
// source identity, but ETF rows remain blocked from ingestion pending timestamp/revision
// semantics and reconciliation acceptance; this is not a source-priority change.
await capture({
  name: "farside-btc-etf-all-data-page",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.primary",
  url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
  parse: body => ({
    html_characters: body.length,
    ...parseFarsideEtfTable(body),
    note: "Official Farside all-data page captured for read-only access/reconciliation diagnostics only; row-level reporting dates and displayed fund totals are parsed, but no publication timestamp is inferred. Readiness recognizes this official URL, while ingestion remains blocked pending timestamp/revision and reconciliation acceptance."
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
  sources: manifest.sources.map(({
    name, status, http_status, error, pair, pair_key, quote_unit,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_trade_price_usdt_per_btc, trade_rows_in_response, row_count, role
  }) => ({
    name, status, http_status, error, pair: pair ?? pair_key, quote_unit,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_trade_price_usdt_per_btc, trade_rows_in_response, row_count, role
  })),
  unresolved: manifest.unresolved
}, null, 2));

const requiredNames = ["kraken-xbtusd-trades", "mempool-hashrate-1w", "mempool-block-fees-1w"];
const requiredCaptureFailed = requiredNames.some(name =>
  !manifest.sources.some(source => source.name === name && source.status === "CAPTURED"));
const etfCaptureSucceeded = manifest.sources.some(source =>
  ["farside-btc-etf-page", "tftc-btc-etf-json-candidate"].includes(source.name)
  && source.status === "CAPTURED");
if (requiredCaptureFailed || !etfCaptureSucceeded) process.exitCode = 1;
