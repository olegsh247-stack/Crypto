#!/usr/bin/env node

const base = (process.env.CRYPTO_API_URL || "").replace(/\/$/, "");
if (!base) throw new Error("CRYPTO_API_URL is required");

async function get(path) {
  const response = await fetch(base + path, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  console.log(path, response.status);
  if (!response.ok) {
    throw new Error(path + " -> HTTP " + response.status + " " + JSON.stringify(body));
  }
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error("Read-only production health check failed: " + message);
}

const health = await get("/api/health");
assert(health.status === "ok", "API health status");

const db = await get("/api/db-health");
assert(db.status === "ok" && db.database === "ok", "database health status");

const registryResponse = await get("/api/assets");
const assets = registryResponse.assets || [];
const byId = new Map(assets.map(asset => [asset.asset_id, asset]));
const expected = ["btc", "dash", "eth", "sol", "cake", "bch", "ltc", "xrp", "trx"];
const canonical = assets.filter(asset => asset.asset_id !== "usdt");
assert(canonical.length === expected.length, "canonical asset count");
assert(expected.every(id => byId.has(id)), "canonical asset IDs");
assert(byId.has("usdt") && byId.get("usdt").symbol === "USDT", "USDT quote asset");

const btcResponse = await get("/api/assets/btc");
const btc = btcResponse.asset || btcResponse;
assert(btc.asset_id === "btc", "canonical BTC detail");
assert(typeof btc.research_status === "string" && btc.research_status.length > 0, "BTC lifecycle status");

console.log("PRODUCTION_READ_ONLY_HEALTH_OK api=1 db=1 assets=9 usdt=1 btc=1 writes=0");
