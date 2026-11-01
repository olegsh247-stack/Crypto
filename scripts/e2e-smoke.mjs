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
for (const id of ["btc", "eth", "sol", "cake"]) {
  assert(byId.has(id), "asset " + id);
  assert(byId.get(id).asset_id === id, id + " canonical id");
  assert(byId.get(id).research_status, id + " research status");
  if (byId.get(id).research_freshness) {
    for (const field of ["last_research_at", "last_major_update_at", "next_review_at"]) {
      assert(Object.hasOwn(byId.get(id).research_freshness, field), id + " list freshness " + field);
    }
  }
}

const eth = await get("/api/assets/eth");
assert(eth.asset?.asset_id === "eth", "ETH canonical detail");
assert(eth.asset?.research_status_source === "server_engine", "ETH lifecycle server authority");
assert(eth.asset?.research_status === eth.asset?.research?.lifecycle, "ETH lifecycle consistency");
assert(["current","update_recommended","outdated"].includes(eth.asset?.research_freshness?.status), "ETH freshness contract");
assert(eth.asset?.research?.freshness === eth.asset?.research_freshness?.status, "ETH freshness consistency");
assert(eth.research_snapshot?.status === "PUBLISHED", "ETH published research snapshot");
assert(Array.isArray(eth.research_blocks) && eth.research_blocks.length === 15, "ETH has 15 research blocks");
assert(Array.isArray(eth.research_domains) && eth.research_domains.length === 6, "ETH has six research domains");
assert(Array.isArray(eth.critical_factors), "ETH critical factors exposed");
assert(Array.isArray(eth.scores), "ETH scores exposed");
assert(Array.isArray(eth.research_scenarios) && eth.research_scenarios.length >= 3, "ETH scenarios exposed");
assert(Array.isArray(eth.monitoring_signals), "ETH monitoring signals exposed");
assert(Array.isArray(eth.monitoring_events), "ETH monitoring events exposed");
assert(eth.research_blocks.every(b => ["complete", "n_a"].includes(b.status)), "ETH blocks resolved");
assert(Array.isArray(eth.evidence) && eth.evidence.length > 0, "ETH evidence chain exposed");
assert(eth.evidence.every(e => e.claim && e.source_id && e.observation_id && e.metric_id && e.thesis_impact && e.status), "ETH evidence traceability fields");

for (const id of ["btc", "eth", "sol", "cake"]) {
  const detail = id === "eth" ? eth : await get("/api/assets/" + id);
  assert(detail.asset?.asset_id === id, id + " canonical detail");
  assert(Array.isArray(detail.research_blocks), id + " research blocks contract");
  assert(Array.isArray(detail.research_domains), id + " research domains contract");
  assert(Array.isArray(detail.critical_factors), id + " factors contract");
  assert(Array.isArray(detail.scores), id + " scores contract");
  assert(Array.isArray(detail.research_scenarios), id + " scenarios contract");
  assert(Array.isArray(detail.monitoring_signals), id + " monitoring contract");
  assert(Array.isArray(detail.evidence), id + " evidence contract");
  if (detail.research_snapshot) {
    assert(detail.research_blocks.length === 15, id + " published snapshot has 15 blocks");
    assert(detail.research_domains.length === 6, id + " published snapshot has six domains");
    assert(detail.scores.every(s => s.methodology_version && s.calculated_at), id + " score metadata");
    assert(detail.monitoring_signals.every(s => Object.hasOwn(s, "threshold") && Object.hasOwn(s, "threshold_type") && s.last_updated_at), id + " monitoring metadata");
    assert(detail.research_scenarios.every(s => Object.hasOwn(s, "supporting_evidence")), id + " scenario evidence field");
    assert(detail.evidence.every(e => Object.hasOwn(e, "snapshot_id") && Object.hasOwn(e, "research_block_id") && Object.hasOwn(e, "block_number")), id + " evidence lineage fields");
    if (detail.asset?.research_freshness) {
      for (const field of ["last_research_at", "last_major_update_at", "next_review_at"]) {
        assert(Object.hasOwn(detail.asset.research_freshness, field), id + " detail freshness " + field);
      }
    }
  }
}
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

for (const symbol of ["BTC/USDT","ETH/USDT"]) {
  const ticker = await get("/api/pairs/" + encodeURIComponent(symbol) + "/ticker");
  assert(ticker.pair === symbol, symbol + " ticker identity");
  assert(Number.isFinite(Number(ticker.price)) && Number(ticker.price) > 0, symbol + " ticker price");
  assert(ticker.timestamp && !Number.isNaN(Date.parse(ticker.timestamp)), symbol + " ticker timestamp");
  assert(["Binance","Kraken","CoinGecko"].includes(ticker.source), symbol + " ticker source");
}

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
