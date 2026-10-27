#!/usr/bin/env node
/**
 * Read-only public-source capture for BTC input review.
 *
 * Writes raw responses and a provenance manifest to tmp/btc-source-review.
 * Does not connect to PostgreSQL, ingest observations, or mutate scenario state.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { parseFarsideEtfTable } from "./parse-farside-etf-table.mjs";
import { calculateProtocolIssuedSupplyBtc, calculateProtocolIssuedSupplySats } from "./btc-protocol-supply.mjs";
import { join } from "node:path";

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
      reason: "Automated Yahoo Finance chart capture is disabled because Yahoo terms prohibit automated collection without express prior permission. DXY remains a blocked review candidate until permitted access and close/publication timestamp semantics are established. Do not substitute a broad USD index."
    },
    {
      metric_id: "institutional.etf_net_flow",
      reason: "The Farside page capture is preserved for review, but the exact publication timestamp and parser reconciliation contract are not inferred from page retrieval time."
    }
  ]
};

async function capture({ name, metricId, candidateMetricId, sourceId, url, parse }) {
  const item = {
    name,
    metric_id: metricId,
    ...(candidateMetricId ? { candidate_metric_id: candidateMetricId } : {}),
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
// Historical hourly candles are captured separately from the latest-trade quote.
// They provide a reproducible ~7-day comparison point without treating a USDT quote as USD.
await capture({
  name: "kraken-xbtusd-ohlc-1h-history",
  metricId: null,
  candidateMetricId: "market.spot_price_history_review",
  sourceId: "market.kraken",
  url: "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60",
  parse: body => {
    const data = JSON.parse(body);
    if (Array.isArray(data.error) && data.error.length) throw new Error(`Kraken OHLC API error: ${data.error.join(", ")}`);
    const result = data.result ?? {};
    const pairKey = Object.keys(result).find(key => key !== "last");
    const rows = result[pairKey];
    if (!pairKey || !Array.isArray(rows) || rows.length < 170) throw new Error("Kraken OHLC response has insufficient hourly history");
    const candles = rows.map(row => ({
      candle_start_epoch_seconds: Number(row[0]),
      open_usd_per_btc: Number(row[1]),
      high_usd_per_btc: Number(row[2]),
      low_usd_per_btc: Number(row[3]),
      close_usd_per_btc: Number(row[4]),
      vwap_usd_per_btc: Number(row[5]),
      volume_btc: Number(row[6]),
      trade_count: Number(row[7])
    })).filter(row => Number.isFinite(row.candle_start_epoch_seconds) && row.close_usd_per_btc > 0)
      .sort((a, b) => a.candle_start_epoch_seconds - b.candle_start_epoch_seconds);
    const currentHourStart = Math.floor(Date.now() / 3600000) * 3600;
    const closed = candles.filter(row => row.candle_start_epoch_seconds < currentHourStart);
    if (closed.length < 169) throw new Error("Kraken OHLC response has fewer than 169 closed hourly candles");
    const end = closed[closed.length - 1];
    const targetStart = end.candle_start_epoch_seconds - 7 * 24 * 3600;
    const start = closed.reduce((best, row) => Math.abs(row.candle_start_epoch_seconds - targetStart) < Math.abs(best.candle_start_epoch_seconds - targetStart) ? row : best, closed[0]);
    return {
      pair_key: pairKey,
      requested_pair: "XBTUSD",
      quote_unit: "USD/BTC",
      interval_minutes: 60,
      candle_count: candles.length,
      closed_candle_count: closed.length,
      latest_closed_candle: end,
      seven_day_reference_candle: start,
      seven_day_reference_delta_seconds: end.candle_start_epoch_seconds - start.candle_start_epoch_seconds,
      seven_day_close_to_close_return_pct: (end.close_usd_per_btc / start.close_usd_per_btc - 1) * 100,
      methodology: "kraken-xbtusd-hourly-closed-candle-close-to-close-7d-v1",
      methodology_version: "1",
      source_row_key: `XBTUSD:OHLC:60:${start.candle_start_epoch_seconds}:${end.candle_start_epoch_seconds}`,
      source_row_identity_status: "derived_from_provider_candle_timestamps",
      note: "Review-only historical return. Uses latest completed hourly candle versus the completed candle nearest seven days earlier; this is not the same as current trade versus exactly seven days ago."
    };
  }
});

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

// Yahoo Finance DXY was previously reachable, but its general Terms of Service prohibit
// automated data collection without prior express permission. Do not keep scraping the
// undocumented chart endpoint. Preserve the source as a blocked candidate until permission
// or a licensed/official feed is established; this record performs no network request.
manifest.sources.push({
  name: "yahoo-finance-dxy-daily",
  metric_id: "macro.dxy",
  source_id: "macro.yahoo_finance_candidate",
  url: "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=5d&interval=1d",
  retrieved_at: new Date().toISOString(),
  status: "BLOCKED_ACCESS_TERMS",
  role: "manual/review-only candidate; automated capture disabled",
  ticker: "DX-Y.NYB",
  chart_interval: "1d",
  quote_unit: "index_points",
  contract: {
    value: "latest completed daily Close, not Adj Close or intraday regularMarketPrice",
    session_date: "provider candle date interpreted in exchange timezone; preserve separately from UTC timestamp",
    candle_timestamp_semantics: "Yahoo chart timestamp is a candle/session label, not proven actual close time or publication timestamp",
    observed_at: null,
    freshness_policy: "metric registry max age 48h is not computable from candle label alone; require a trustworthy close/publication timestamp or explicitly approved session-age rule",
    access: "no automated requests until Yahoo grants express prior permission or a permitted licensed API/feed is used"
  },
  note: "No HTTP request is made by this run. Previously captured Yahoo chart data is historical review evidence only and must not be refreshed or persisted as a canonical observation."
});

// Blockchain.com public chart reports total mined bitcoins ("in circulation") by daily timestamp.
// This is total issuance, not the product's economic circulating-supply metric. Keep it unlinked
// from the canonical registry until a separate protocol-issued-supply metric is explicitly approved.
await capture({
  name: "blockchaincom-total-bitcoins-supply",
  metricId: null,
  candidateMetricId: "monetary.protocol_issued_supply",
  sourceId: "analytics",
  url: "https://api.blockchain.info/charts/total-bitcoins?timespan=all&format=json",
  parse: body => {
    const data = JSON.parse(body);
    const rows = Array.isArray(data.values) ? data.values : [];
    const latest = rows.at(-1);
    if (!latest || !Number.isFinite(Number(latest.x)) || !Number.isFinite(Number(latest.y))) {
      throw new Error("Blockchain.com supply chart has no valid latest point");
    }
    return {
      chart_name: data.name ?? null,
      chart_unit: data.unit ?? null,
      chart_period: data.period ?? null,
      row_count: rows.length,
      latest_supply_btc: Number(latest.y),
      latest_series_timestamp: new Date(Number(latest.x) * 1000).toISOString(),
      latest_series_date_utc: new Date(Number(latest.x) * 1000).toISOString().slice(0, 10),
      methodology: "blockchaincom-total-bitcoins-issued-supply-chart-v1",
      methodology_version: "1",
      acceptance_status: "REVIEW_ONLY_SOURCE_PRIORITY_AND_SEMANTICS_CHECK",
      note: "Provider's chart is total mined/issued bitcoins; this is not a direct measure of economically spendable coins. Candidate only until registry source priority, timestamp semantics, chart unit and agreement with protocol issuance are reviewed."
    };
  }
});


// CoinGecko exposes a provider-defined circulating_supply field. Keep this as a
// candidate until its supply timestamp semantics and freshness contract are proven.
await capture({
  name: "coingecko-bitcoin-circulating-supply",
  metricId: null,
  candidateMetricId: "monetary.circulating_supply",
  sourceId: "market.coingecko",
  url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin",
  parse: body => {
    const rows = JSON.parse(body);
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.id !== "bitcoin") {
      throw new Error("CoinGecko markets response must contain exactly the bitcoin row");
    }
    const row = rows[0];
    const circulating = Number(row.circulating_supply);
    const total = row.total_supply == null ? null : Number(row.total_supply);
    const maximum = row.max_supply == null ? null : Number(row.max_supply);
    if (!(circulating > 0) || !Number.isFinite(circulating)) {
      throw new Error("CoinGecko circulating_supply is missing or invalid");
    }
    if (total !== null && (!Number.isFinite(total) || circulating > total)) {
      throw new Error("CoinGecko circulating_supply exceeds or conflicts with total_supply");
    }
    if (maximum !== null && (!Number.isFinite(maximum) || maximum <= 0 || (total !== null && total > maximum))) {
      throw new Error("CoinGecko total/max supply relationship is invalid");
    }
    const providerLastUpdated = row.last_updated ?? null;
    return {
      provider_asset_id: row.id,
      symbol: row.symbol,
      asset_name: row.name,
      circulating_supply_btc: circulating,
      total_supply_btc: total,
      max_supply_btc: maximum,
      provider_last_updated: providerLastUpdated,
      observed_at: null,
      unit: "BTC",
      methodology: "coingecko-provider-defined-circulating-supply-candidate-v1",
      methodology_version: "1",
      acceptance_status: "REVIEW_ONLY_SUPPLY_TIMESTAMP_SEMANTICS",
      note: "Candidate only. Do not treat last_updated as the supply observation timestamp unless its field semantics are confirmed. No canonical metric_id and no ingestion."
    };
  }
});


/**
 * Review-only supply derivation from a consistency-checked Mempool tip.
 * Recheck height and block hash at the end to reject a moving/reorganized tip.
 */
async function captureMempoolProtocolSupply() {
  const name = "mempool-protocol-issued-supply";
  const tipHeightUrl = "https://mempool.space/api/blocks/tip/height";
  const hashAtHeightUrl = height => `https://mempool.space/api/block-height/${height}`;
  const blockUrl = hash => `https://mempool.space/api/block/${hash}`;
  const item = {
    name,
    // This is consensus-scheduled issuance, not economic circulating supply.
    // No protocol-issued-supply metric is registered yet, so do not label it canonical.
    metric_id: null,
    candidate_metric_id: "monetary.protocol_issued_supply",
    source_id: "network.primary",
    url: tipHeightUrl,
    related_urls: [ "https://mempool.space/api/block-height/{height}", "https://mempool.space/api/block/{hash}" ],
    retrieved_at: new Date().toISOString(),
    status: "FAILED",
    role: "protocol-derived total-issued-supply candidate; review-only, not accepted for canonical ingestion"
  };
  try {
    const getText = async url => {
      const response = await fetch(url, {
        headers: { "user-agent": "Crypto-BTC-Source-Review/1.0", "accept": "text/plain,application/json,*/*" },
        signal: AbortSignal.timeout(20000)
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      return {
        url,
        body,
        http_status: response.status,
        content_type: response.headers.get("content-type"),
        http_date: response.headers.get("date"),
        provider_last_modified: response.headers.get("last-modified"),
        etag: response.headers.get("etag"),
        body_sha256: await sha256(body)
      };
    };
    const firstHeightEvidence = await getText(tipHeightUrl);
    const firstHeight = Number(firstHeightEvidence.body.trim());
    if (!Number.isSafeInteger(firstHeight) || firstHeight < 0) throw new Error("Mempool tip height is not a valid non-negative integer");
    const firstHashEvidence = await getText(hashAtHeightUrl(firstHeight));
    const firstHash = firstHashEvidence.body.trim();
    if (!/^[0-9a-f]{64}$/i.test(firstHash)) throw new Error("Mempool hash-at-height response is not a 32-byte block hash");
    const blockEvidence = await getText(blockUrl(firstHash));
    const block = JSON.parse(blockEvidence.body);
    if (Number(block.height) !== firstHeight || String(block.id).toLowerCase() !== firstHash.toLowerCase()) {
      throw new Error("Block detail does not match the requested tip height/hash");
    }
    const secondHashEvidence = await getText(hashAtHeightUrl(firstHeight));
    const secondHeightEvidence = await getText(tipHeightUrl);
    const secondHeight = Number(secondHeightEvidence.body.trim());
    const secondHash = secondHashEvidence.body.trim();
    if (secondHeight !== firstHeight || secondHash.toLowerCase() !== firstHash.toLowerCase()) {
      throw new Error("Chain tip changed during supply capture; retry from a stable tip");
    }
    if (!Number.isSafeInteger(Number(block.timestamp)) || Number(block.timestamp) <= 0) {
      throw new Error("Tip block has no valid Unix timestamp");
    }
    const totalSats = calculateProtocolIssuedSupplySats(firstHeight);
    const evidence = [firstHeightEvidence, firstHashEvidence, blockEvidence, secondHashEvidence, secondHeightEvidence];
    const raw = JSON.stringify({
      captured_at: new Date().toISOString(),
      consistency_check: "tip height and hash checked before/after block lookup; tip remained stable",
      endpoints: evidence
    }, null, 2) + "\n";
    item.retrieved_at = new Date().toISOString();
    item.http_status = 200;
    item.status = "CAPTURED";
    item.response_evidence = evidence.map(({ url, http_status, content_type, http_date, provider_last_modified, etag, body_sha256 }) => ({
      url, http_status, content_type, http_date, provider_last_modified, etag, body_sha256
    }));
    item.latest_block_height = firstHeight;
    item.latest_block_hash = firstHash;
    item.latest_block_timestamp = Number(block.timestamp);
    item.latest_block_time_utc = new Date(Number(block.timestamp) * 1000).toISOString();
    item.protocol_issued_supply_sats = totalSats.toString();
    item.protocol_issued_supply_btc = calculateProtocolIssuedSupplyBtc(firstHeight);
    item.unit = "BTC";
    item.methodology = "bitcoin-consensus-subsidy-schedule-through-verified-tip-height-inclusive-v1";
    item.methodology_version = "1";
    item.freshness_basis = "tip block header timestamp and height/hash consistency check; block timestamp is miner-supplied and not an exact API publication time";
    item.acceptance_status = "REVIEW_ONLY_PROTOCOL_DERIVED_SUPPLY";
    item.source_payload_sha256 = await sha256(raw);
    item.body_sha256 = item.source_payload_sha256;
    item.body_file = name + ".raw";
    item.note = "Computes scheduled coinbase subsidy through the captured tip height inclusive using integer satoshis. This is total protocol-issued supply, not economically spendable supply or UTXO supply. Candidate only pending metric semantics and source-priority review; no registry change or ingestion.";
    await writeFile(join(outDir, item.body_file), raw, "utf8");
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
    const raw = JSON.stringify({ error: item.error, captured_at: item.retrieved_at });
    item.body_sha256 = await sha256(raw);
    item.source_payload_sha256 = item.body_sha256;
    item.body_file = name + ".raw";
    await writeFile(join(outDir, item.body_file), raw, "utf8");
  }
  manifest.sources.push(item);
}

await captureMempoolProtocolSupply();

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
      latest_period_start: Number.isFinite(epochSeconds) ? new Date((epochSeconds - 86400) * 1000).toISOString() : null,
      latest_period_end: Number.isFinite(epochSeconds) ? new Date(epochSeconds * 1000).toISOString() : null,
      latest_series_value_eh_s: Number.isFinite(hashrate) ? hashrate / 1e18 : null,
      aggregation_window_seconds: 86400,
      aggregation_method: "mempool-daily-hashrate-series-point; interval [timestamp-86400s, timestamp)",
      note: "Raw response retained. This is a daily estimated hashrate bucket, not instantaneous currentHashrate or a weekly rolling average. Period boundaries are recorded explicitly; verify endpoint parity and freshness before acceptance."
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

// Reward stats for the most recent 144 blocks are a fee/subsidy methodology candidate.
// Capture the actual payload and schema evidence, but do not calculate a ratio until
// the deployed response semantics, fee units, subsidy denominator and reorg behavior pass review.
await capture({
  name: "mempool-mining-reward-stats-144",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/reward-stats/144",
  parse: body => {
    const data = JSON.parse(body);
    const startBlock = Number(data.startBlock);
    const endBlock = Number(data.endBlock);
    const totalRewardSats = Number(data.totalReward);
    const totalFeeSats = Number(data.totalFee);
    const requestedBlockCount = 144;
    const observedBlockCount = Number.isInteger(startBlock) && Number.isInteger(endBlock)
      ? endBlock - startBlock + 1
      : null;
    const protocolSubsidySats = requestedBlockCount * 312500000;
    const inferredSubsidySats = totalRewardSats - totalFeeSats;
    const validTotals = Number.isSafeInteger(totalRewardSats)
      && Number.isSafeInteger(totalFeeSats)
      && totalRewardSats >= totalFeeSats
      && totalFeeSats >= 0;
    const exactWindow = observedBlockCount === requestedBlockCount;
    const subsidyMatchesProtocol = inferredSubsidySats === protocolSubsidySats;
    const ratio = validTotals && exactWindow && subsidyMatchesProtocol
      ? totalFeeSats / protocolSubsidySats
      : null;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      start_block: Number.isInteger(startBlock) ? startBlock : null,
      end_block: Number.isInteger(endBlock) ? endBlock : null,
      requested_block_count: requestedBlockCount,
      observed_block_count_from_height_range: observedBlockCount,
      total_reward_sats: validTotals ? totalRewardSats : null,
      total_fee_sats: validTotals ? totalFeeSats : null,
      inferred_subsidy_sats: validTotals ? inferredSubsidySats : null,
      protocol_subsidy_sats_for_window: protocolSubsidySats,
      fee_total_btc: validTotals ? totalFeeSats / 1e8 : null,
      subsidy_total_btc: validTotals ? inferredSubsidySats / 1e8 : null,
      fee_subsidy_ratio: ratio,
      fee_share_of_subsidy_percent: ratio === null ? null : ratio * 100,
      ratio_calculated: ratio !== null,
      acceptance_status: ratio === null
        ? "BLOCKED_WINDOW_OR_UNIT_CHECK"
        : "BLOCKED_REORG_AND_DEPLOYED_VERSION_UNVERIFIED",
      note: "Mempool public backend implementation sums reward and fees over the latest N blocks where stale=0. The returned aggregate contains no block hashes; reorg/finality risk remains. Ratio is emitted only when the inclusive height range is exactly 144 blocks and totalReward-totalFee equals the protocol subsidy expected for 144 blocks at 3.125 BTC each. Candidate only, not approved for production ingestion."
    };
  }
});

// Keyless hosted MCP source for BTC spot-ETF flows. Capture tool metadata and
// the returned BTC series as raw evidence; this is still review-only, not canonical.
async function mcpRequest(url, sessionId, payload) {
  const headers = { "content-type": "application/json", "accept": "application/json, text/event-stream", "user-agent": "Crypto-BTC-Source-Review/1.0" };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
  const body = await response.text();
  if (!response.ok) throw new Error("MCP HTTP " + response.status + ": " + body.slice(0, 300));
  let decoded;
  try { decoded = JSON.parse(body); }
  catch {
    const dataLines = body.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim());
    const jsonLine = dataLines.find(line => line.startsWith("{"));
    if (!jsonLine) throw new Error("MCP response was not JSON or JSON-RPC SSE data");
    decoded = JSON.parse(jsonLine);
  }
  return { response, body, decoded };
}

async function captureCryptoEtfMcp() {
  const name = "cryptoetf-today-btc-etf-flows-mcp";
  const item = { name, metric_id: "institutional.etf_net_flow", source_id: "institutional.cryptoetf_today", url: "https://mcp.cryptoetf.today/api/mcp", retrieved_at: new Date().toISOString(), status: "FAILED", role: "keyless 30-day cross-check candidate; not approved for canonical ingestion" };
  try {
    const init = await mcpRequest(item.url, null, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "crypto-btc-source-review", version: "1.0.0" } } });
    const sessionId = init.response.headers.get("mcp-session-id");
    item.initialize_protocol_version = init.decoded?.result?.protocolVersion ?? null;
    item.server_info = init.decoded?.result?.serverInfo ?? null;
    if (init.decoded?.error) throw new Error("MCP initialize error: " + JSON.stringify(init.decoded.error));
    await mcpRequest(item.url, sessionId, { jsonrpc: "2.0", method: "notifications/initialized", params: {} }).catch(() => null);
    const listed = await mcpRequest(item.url, sessionId, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    if (listed.decoded?.error) throw new Error("MCP tools/list error: " + JSON.stringify(listed.decoded.error));
    const tools = listed.decoded?.result?.tools;
    if (!Array.isArray(tools)) throw new Error("MCP tools/list response has no tools array");
    item.available_tools = tools.map(tool => tool.name);
    const tool = tools.find(candidate => candidate.name === "get_asset_flows");
    if (!tool) throw new Error("MCP source does not expose get_asset_flows");
    const properties = tool.inputSchema?.properties ?? {};
    const args = Object.hasOwn(properties, "symbol") ? { symbol: "BTC" } : Object.hasOwn(properties, "asset") ? { asset: "btc" } : Object.hasOwn(properties, "ticker") ? { ticker: "BTC" } : {};
    const called = await mcpRequest(item.url, sessionId, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: tool.name, arguments: args } });
    if (called.decoded?.error) throw new Error("MCP tool-call error: " + JSON.stringify(called.decoded.error));
    const result = called.decoded?.result;
    if (result?.isError) throw new Error("MCP tool returned error: " + (result.content ?? []).map(part => part.text ?? "").join("\n"));
    const rawText = (result?.content ?? []).filter(part => typeof part.text === "string").map(part => part.text).join("\n");
    if (!rawText) throw new Error("MCP get_asset_flows returned no text content");
    let data;
    try { data = JSON.parse(rawText); } catch { throw new Error("MCP get_asset_flows returned non-JSON content: " + rawText.slice(0, 300)); }
    const days = data.days ?? data.data ?? data.flows;
    if (!Array.isArray(days) || days.length === 0) throw new Error("MCP BTC flow response has no daily series");
    const normalized = days.map(row => ({ date: row.date ?? row.day ?? row.period, net_flow_usd_million: row.netFlowUsdM ?? row.net_flow_usd_m ?? row.netFlow ?? null }));
    if (normalized.some(row => !/^\d{4}-\d{2}-\d{2}$/.test(String(row.date)))) throw new Error("MCP BTC flow series contains a missing or invalid reporting date");
    item.http_status = init.response.status;
    item.content_type = init.response.headers.get("content-type");
    item.retrieved_at = new Date().toISOString();
    item.status = "CAPTURED";
    item.tool_name = tool.name;
    item.tool_arguments = args;
    item.window_days = data.windowDays ?? null;
    item.symbol = data.symbol ?? data.asset ?? null;
    item.updated_at = data.updatedAt ?? data.updated_at ?? null;
    item.row_count = normalized.length;
    item.latest_rows = normalized.slice(-14);
    item.series_order = "provider_response_order_preserved";
    item.source_payload_sha256 = await sha256(rawText);
    item.body_sha256 = item.source_payload_sha256;
    item.body_file = name + ".raw";
    item.note = "Provider dates are daily flow reporting dates; updatedAt is provider update time, not the observation date. The newest day may be revised; compare with Farside/TFTC before any approval.";
    await writeFile(join(outDir, item.body_file), rawText, "utf8");
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
    const errorBody = JSON.stringify({ error: item.error, captured_at: item.retrieved_at });
    item.body_sha256 = await sha256(errorBody);
    item.source_payload_sha256 = item.body_sha256;
    item.body_file = name + ".raw";
    await writeFile(join(outDir, item.body_file), errorBody, "utf8");
  }
  manifest.sources.push(item);
}

await captureCryptoEtfMcp();
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

// SoSoValue official keyed API. If no secret is configured, record the blocker without
// making an unauthenticated request. Never print or persist the API key itself.
async function captureSoSoValueEtf() {
  const name = "sosovalue-btc-etf-summary-history";
  const key = process.env.SOSOVALUE_API_KEY;
  const url = "https://openapi.sosovalue.com/openapi/v1/etfs/summary-history?symbol=BTC&country_code=US&limit=300";
  const item = {
    name,
    metric_id: "institutional.etf_net_flow",
    source_id: "institutional.sosovalue",
    url,
    retrieved_at: new Date().toISOString(),
    status: key ? "FAILED" : "BLOCKED_NO_API_KEY",
    role: "official keyed API candidate; cross-check only, not canonical ETF flow"
  };
  if (!key) {
    item.note = "SOSOVALUE_API_KEY is not configured. No network request was made; add the free key as a GitHub Actions secret or secure environment variable. Never commit the key.";
    manifest.sources.push(item);
    return;
  }
  try {
    const response = await fetch(url, {
      headers: { "accept": "application/json", "x-soso-api-key": key, "user-agent": "Crypto-BTC-Source-Review/1.0" },
      signal: AbortSignal.timeout(20000)
    });
    const body = await response.text();
    item.http_status = response.status;
    item.content_type = response.headers.get("content-type");
    item.http_date = response.headers.get("date");
    item.provider_last_modified = response.headers.get("last-modified");
    item.etag = response.headers.get("etag");
    item.body_sha256 = await sha256(body);
    item.source_payload_sha256 = item.body_sha256;
    item.body_file = name + ".raw";
    await writeFile(join(outDir, item.body_file), body, "utf8");
    if (!response.ok) throw new Error("SoSoValue API HTTP " + response.status + ": " + body.slice(0, 300));
    const decoded = JSON.parse(body);
    const rows = Array.isArray(decoded) ? decoded : decoded.data ?? decoded.result ?? decoded.records;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("SoSoValue response has no ETF summary-history rows");
    const normalized = rows.map(row => ({
      date: row.date ?? null,
      total_net_inflow_usd: row.total_net_inflow ?? null,
      total_net_inflow_usd_million: Number.isFinite(Number(row.total_net_inflow)) ? Number(row.total_net_inflow) / 1e6 : null,
      total_net_assets_usd: row.total_net_assets ?? null,
      total_value_traded_usd: row.total_value_traded ?? null
    }));
    if (normalized.some(row => !/^\d{4}-\d{2}-\d{2}$/.test(String(row.date)))) throw new Error("SoSoValue response contains a missing or invalid trading date");
    item.retrieved_at = new Date().toISOString();
    item.status = "CAPTURED";
    item.row_count = normalized.length;
    item.latest_rows = normalized.slice(0, 14);
    item.series_order = "provider_response_reverse_chronological_preserved";
    item.source_updated_at = response.headers.get("last-modified");
    item.observation_timestamp_semantics = "trading date only; exact publication/observation time and finality not supplied by documented response";
    item.note = "Daily aggregate net inflow is USD in source and converted to USD million/day for comparison. Non-trading days are omitted. Candidate only: reconcile dates/values with Farside and CryptoETF.today; no canonical priority or ingestion approval.";
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
    const errorBody = JSON.stringify({ error: item.error, captured_at: item.retrieved_at });
    item.body_sha256 = await sha256(errorBody);
    item.source_payload_sha256 = item.body_sha256;
    item.body_file = name + ".raw";
    await writeFile(join(outDir, item.body_file), errorBody, "utf8");
  }
  manifest.sources.push(item);
}

await captureSoSoValueEtf();

await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  manifest: "tmp/btc-source-review/manifest.json",
  sources: manifest.sources.map(({
    name, status, http_status, error, pair, pair_key, quote_unit,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_trade_price_usdt_per_btc, trade_rows_in_response, row_count, role,
    source_payload_sha256, retrieved_at, latest_reported_date, page_generated_date,
    latest_reported_row
  }) => ({
    name, status, http_status, error, pair: pair ?? pair_key, quote_unit,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_trade_price_usdt_per_btc, trade_rows_in_response, row_count, role,
    ...(name === "farside-btc-etf-all-data-page" ? {
      source_payload_sha256, retrieved_at, latest_reported_date, page_generated_date,
      latest_row_total_usd_million: latest_reported_row?.reported_total_usd_million ?? null,
      latest_row_reconciliation_status: latest_reported_row?.reconciliation_status ?? null
    } : {})
  })),
  unresolved: manifest.unresolved
}, null, 2));

const requiredNames = ["kraken-xbtusd-trades", "mempool-hashrate-1w", "mempool-mining-reward-stats-144"];
const requiredCaptureFailed = requiredNames.some(name =>
  !manifest.sources.some(source => source.name === name && source.status === "CAPTURED"));
const etfCaptureSucceeded = manifest.sources.some(source =>
  ["farside-btc-etf-page", "tftc-btc-etf-json-candidate"].includes(source.name)
  && source.status === "CAPTURED");
if (requiredCaptureFailed || !etfCaptureSucceeded) process.exitCode = 1;
