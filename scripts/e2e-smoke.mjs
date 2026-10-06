#!/usr/bin/env node
const base = (process.env.CRYPTO_API_URL || "").replace(/\/$/, "");
if (!base) throw new Error("CRYPTO_API_URL is required");

async function get(path) {
  const response = await fetch(base + path, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
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
for (const id of ["btc", "eth"]) {
  assert(byId.has(id), "asset " + id + " is enabled and visible");
  assert(byId.get(id).asset_id === id, id + " canonical id");
  assert(byId.get(id).research_status, id + " research status");
}

const eth = await get("/api/assets/eth");
assert(eth.asset?.asset_id === "eth", "ETH canonical detail");
assert(Array.isArray(eth.research_blocks) && eth.research_blocks.length === 15, "ETH has 15 research blocks");
assert(eth.research_blocks.every(b => ["complete", "n_a"].includes(b.status)), "ETH blocks resolved");

const btc = await get("/api/assets/btc");
assert(btc.asset?.asset_id === "btc", "BTC canonical detail");

const pairsResponse = await get("/api/pairs");
const pairs = pairsResponse.pairs || pairsResponse.items || [];
assert(pairs.length >= 9, "canonical pair registry");
const symbols = new Set(pairs.map(p => p.symbol));
for (const symbol of ["BTC/USDT","DASH/USDT","ETH/USDT","SOL/USDT","CAKE/USDT","BCH/USDT","LTC/USDT","XRP/USDT","TRX/USDT"]) {
  assert(symbols.has(symbol), "pair " + symbol);
}

for (const symbol of ["BTC/USDT","ETH/USDT"]) {
  const history = await get("/api/pairs/" + encodeURIComponent(symbol) + "/history?days=7&interval=1d");
  assert(history.pair === symbol, symbol + " history identity");
  assert(Array.isArray(history.rows) && history.rows.length >= 2, symbol + " history rows");
  assert(Array.isArray(history.normalized?.relative) && history.normalized.relative.length >= 2, symbol + " normalized history");
}

console.log("E2E_OK health=1 db=1 assets=2 eth_blocks=15 pairs=9 histories=2");
