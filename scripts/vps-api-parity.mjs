#!/usr/bin/env node
const live = (process.env.LIVE_API_URL || "").replace(/\/$/, "");
const vps = (process.env.VPS_API_URL || "").replace(/\/$/, "");
if (!live || !vps) throw new Error("LIVE_API_URL and VPS_API_URL are required");

async function get(base, path) {
  const r = await fetch(base + path, { headers: { accept: "application/json" } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(base + path + " -> " + r.status + " " + JSON.stringify(body));
  return body;
}
function assert(x, msg) { if (!x) throw new Error("PARITY assertion failed: " + msg); }
function pick(obj, keys) {
  return Object.fromEntries(keys.filter(k => Object.prototype.hasOwnProperty.call(obj ?? {}, k)).map(k => [k, obj[k]]));
}
function normalizeDetail(d) {
  return {
    asset: pick(d.asset, ["asset_id","symbol","name","enabled","research_status","research_status_source"]),
    research: pick(d.research, ["lifecycle","freshness"]),
    research_freshness: pick(d.research_freshness, ["status"]),
    snapshot_status: d.research_snapshot?.status ?? null,
    block_count: Array.isArray(d.research_blocks) ? d.research_blocks.length : null
  };
}
function normalizeHistory(d) {
  return {
    status: d.status,
    pair: d.pair,
    interval: d.interval,
    days: d.days,
    row_count: Array.isArray(d.rows) ? d.rows.length : 0,
    normalized_relative_count: Array.isArray(d.normalized?.relative) ? d.normalized.relative.length : 0,
    has_interpretation: !!d.interpretation
  };
}
const paths = [
  "/api/health",
  "/api/db-health",
  "/api/assets",
  "/api/pairs",
  "/api/assets/eth",
  "/api/assets/btc",
  "/api/pairs/ETH%2FUSDT/history?days=7&interval=1d"
];
for (const path of paths) {
  const [l, v] = await Promise.all([get(live, path), get(vps, path)]);
  let left = l, right = v;
  if (path === "/api/db-health") {
    left = pick(l, ["status","service","database"]);
    right = pick(v, ["status","service","database"]);
  } else if (path === "/api/assets/eth" || path === "/api/assets/btc") {
    left = normalizeDetail(l); right = normalizeDetail(v);
  } else if (path.includes("/history?")) {
    left = normalizeHistory(l); right = normalizeHistory(v);
  } else if (path === "/api/assets") {
    left = (l.assets || []).map(x => pick(x, ["asset_id","symbol","name","enabled","research_status"])).sort((a,b)=>a.asset_id.localeCompare(b.asset_id));
    right = (v.assets || []).map(x => pick(x, ["asset_id","symbol","name","enabled","research_status"])).sort((a,b)=>a.asset_id.localeCompare(b.asset_id));
  } else if (path === "/api/pairs") {
    left = (l.pairs || l.items || []).map(x => pick(x, ["id","symbol","base_asset_id","base_asset","quote_asset_id","quote_asset","exchange","enabled"])).sort((a,b)=>a.symbol.localeCompare(b.symbol));
    right = (v.pairs || v.items || []).map(x => pick(x, ["id","symbol","base_asset_id","base_asset","quote_asset_id","quote_asset","exchange","enabled"])).sort((a,b)=>a.symbol.localeCompare(b.symbol));
  }
  assert(JSON.stringify(left) === JSON.stringify(right), path);
  console.log("PARITY_OK", path);
}
console.log("VPS_API_PARITY_OK endpoints=7 volatile_fields_normalized=1");
