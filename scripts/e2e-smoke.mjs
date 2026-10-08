#!/usr/bin/env node
const base = (process.env.CRYPTO_API_URL || "").replace(/\/$/, "");
if (!base) throw new Error("CRYPTO_API_URL is required");

async function get(path) {
  const response = await fetch(base + path, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  console.log(path, response.status);
  if (!response.ok) throw new Error(path + " -> " + response.status + " " + JSON.stringify(body));
  return body;
}
function assert(condition, message) { if (!condition) throw new Error("E2E assertion failed: " + message); }

const health = await get("/api/health");
assert(health.status === "ok", "health");

const db = await get("/api/db-health");
assert(db.status === "ok" && db.database === "ok", "db-health");

const assetsResponse = await get("/api/assets");
const assets = assetsResponse.assets || [];
const byId = new Map(assets.map(a => [a.asset_id, a]));
const expectedAssetIds = ["btc","dash","eth","sol","cake","bch","ltc","xrp","trx"];
const canonicalAssets = assets.filter(a => a.asset_id !== "usdt");
assert(canonicalAssets.length === expectedAssetIds.length, "canonical non-stable asset registry size");
assert(expectedAssetIds.every(id => byId.has(id)), "canonical enabled asset registry identities");
assert(byId.has("usdt") && byId.get("usdt").symbol === "USDT", "USDT quote asset");
for (const id of ["btc", "eth"]) {
  assert(byId.has(id), "asset " + id);
  assert(byId.get(id).asset_id === id, id + " canonical id");
  assert(byId.get(id).research_status, id + " research status");
}

const eth = await get("/api/assets/eth");
assert(eth.asset?.asset_id === "eth", "ETH canonical detail");
assert(eth.asset?.research_status_source === "server_engine", "ETH lifecycle server authority");
assert(eth.asset?.research_status === eth.asset?.research?.lifecycle, "ETH lifecycle consistency");
assert(["current","update_recommended","outdated"].includes(eth.asset?.research_freshness?.status), "ETH freshness contract");
assert(eth.asset?.research?.freshness === eth.asset?.research_freshness?.status, "ETH freshness consistency");
assert(eth.research_snapshot?.status === "PUBLISHED", "ETH published research snapshot");
assert(Array.isArray(eth.research_blocks) && eth.research_blocks.length === 15, "ETH has 15 research blocks");
assert(eth.research_blocks.every(b => ["complete", "n_a"].includes(b.status)), "ETH blocks resolved");
assert(Array.isArray(eth.evidence) && eth.evidence.length > 0, "ETH evidence chain exposed");
assert(eth.evidence.every(e => e.claim && e.source_id && e.observation_id && e.metric_id && e.thesis_impact && e.status), "ETH evidence traceability fields");

const btc = await get("/api/assets/btc");
assert(btc.asset?.asset_id === "btc", "BTC canonical detail");

const pairsResponse = await get("/api/pairs");
const pairs = pairsResponse.pairs || pairsResponse.items || [];
assert(pairs.length === 9, "canonical pair registry size");
const symbols = new Set(pairs.map(p => p.symbol));
assert(pairs.every(p => p.exchange && p.enabled === true), "pair exchange/enabled contract");
assert(pairs.every(p => {
  const [base, quote] = String(p.symbol).toUpperCase().split("/");
  return base === String(p.base_asset).toUpperCase() && quote === String(p.quote_asset).toUpperCase();
}), "pair symbol matches registry legs");
for (const symbol of ["BTC/USDT","DASH/USDT","ETH/USDT","SOL/USDT","CAKE/USDT","BCH/USDT","LTC/USDT","XRP/USDT","TRX/USDT"]) {
  assert(symbols.has(symbol), "pair " + symbol);
}

const btcTicker = await get("/api/pairs/BTC%2FUSDT/ticker");
assert(btcTicker.pair === "BTC/USDT", "BTC ticker identity");
assert(Number.isFinite(Number(btcTicker.price)) && Number(btcTicker.price) > 0, "BTC ticker price");
assert(btcTicker.timestamp && btcTicker.source, "BTC ticker provenance");

const canonicalSymbols = ["BTC/USDT","DASH/USDT","ETH/USDT","SOL/USDT","CAKE/USDT","BCH/USDT","LTC/USDT","XRP/USDT","TRX/USDT"];
const historyResults = [];
for (const symbol of canonicalSymbols) {
  const history = await get("/api/pairs/" + encodeURIComponent(symbol) + "/history?days=7&interval=1d");
  assert(history.pair === symbol, symbol + " history identity");
  assert(history.interval === "1d", symbol + " daily interval");
  assert(history.storage_mode === "persisted", symbol + " daily storage mode");
  assert(history.source === "stored_market_history", symbol + " daily history must read persisted storage");
  assert(Array.isArray(history.rows) && history.rows.length >= 2, symbol + " history rows");
  assert(Array.isArray(history.normalized?.relative) && history.normalized.relative.length >= 2, symbol + " normalized history");
  assert(history.storage_mode === "persisted", symbol + " daily storage mode");
  historyResults.push({symbol,source:history.source,rows:history.rows.length});
}
for (const interval of ["1h","4h"]) {
  const intraday = await get("/api/pairs/BTC%2FUSDT/history?days=7&interval=" + interval);
  assert(intraday.pair === "BTC/USDT", interval + " identity");
  assert(intraday.interval === interval, interval + " interval");
  assert(intraday.storage_mode === "temporary", interval + " temporary storage mode");
  assert(Array.isArray(intraday.rows) && intraday.rows.length >= 2, interval + " rows");
}

for (const symbol of ["BTC/USDT","ETH/USDT"]) {
  for (const interval of ["1h","4h"]) {
    const intraday = await get("/api/pairs/" + encodeURIComponent(symbol) + "/history?days=7&interval=" + interval);
    assert(intraday.pair === symbol, symbol + " " + interval + " identity");
    assert(intraday.interval === interval, symbol + " " + interval + " interval");
    assert(intraday.storage_mode === "temporary", symbol + " " + interval + " temporary storage mode");
    assert(["Binance"].includes(intraday.source), symbol + " " + interval + " live source");
    assert(Array.isArray(intraday.rows) && intraday.rows.length >= 2, symbol + " " + interval + " rows");
  }
}

for (const symbol of ["BTC/USDT","ETH/USDT"]) {
  const repeat = await get("/api/pairs/" + encodeURIComponent(symbol) + "/history?days=7&interval=1d");
  assert(repeat.pair === symbol && repeat.interval === "1d" && repeat.storage_mode === "persisted" && Array.isArray(repeat.rows) && repeat.rows.length >= 2, symbol + " repeat history");
  assert(repeat.source && ["Binance","Kraken","CoinGecko","stored_market_history"].includes(repeat.source), symbol + " repeat source");
  assert(Array.isArray(repeat.normalized?.relative) && repeat.normalized.relative.length >= 2, symbol + " repeat normalized history");
}

console.log("E2E_OK health=1 db=1 assets=9_exact usdt=1 eth_blocks=15 pairs=9_identity=1 histories=9 repeat=2");
