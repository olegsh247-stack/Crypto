#!/usr/bin/env node
const live = (process.env.LIVE_API_URL || "").replace(/\/$/, "");
const vps = (process.env.VPS_API_URL || "").replace(/\/$/, "");
if (!live || !vps) throw new Error("LIVE_API_URL and VPS_API_URL are required");

async function get(base, path) {
  const r = await fetch(base + path, { headers: { accept: "application/json" } });
  const body = await r.json().catch(() => ({}));
  const explicitEmptyHistory = r.status === 503 && body.error === "persisted_market_history_unavailable";
  if (!r.ok && !explicitEmptyHistory) throw new Error(base + path + " -> " + r.status + " " + JSON.stringify(body));
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
    // The live Worker may have stored candles while a clean VPS rehearsal DB has none.
    // Compare the explicit no-data contract rather than requiring equal data availability.
    const emptyError = "persisted_market_history_unavailable";
    if (l.error === emptyError || v.error === emptyError) {
      for (const d of [l, v]) {
        if (d.error === emptyError) {
          assert(d.status === "error" && d.storage_mode === "persisted" && d.pair === "ETH/USDT" && d.interval === "1d", "history no-data contract");
        }
      }
      console.log("PARITY_OK", path, "(explicit no-data response accepted; row parity not applicable)");
      continue;
    }
    left = normalizeHistory(l); right = normalizeHistory(v);
  } else if (path === "/api/assets") {
    left = (l.assets || []).map(x => pick(x, ["asset_id","symbol","name","enabled","research_status"])).sort((a,b)=>a.asset_id.localeCompare(b.asset_id));
    right = (v.assets || []).map(x => pick(x, ["asset_id","symbol","name","enabled","research_status"])).sort((a,b)=>a.asset_id.localeCompare(b.asset_id));
  } else if (path === "/api/pairs") {
    // Database-generated pair IDs are environment-local and are not part of API parity.
    // Compare the stable logical registry contract instead.
    const pairKeys = ["symbol","base_asset_id","base_asset","quote_asset_id","quote_asset","exchange","enabled"];
    left = (l.pairs || l.items || []).map(x => pick(x, pairKeys)).sort((a,b)=>a.symbol.localeCompare(b.symbol));
    right = (v.pairs || v.items || []).map(x => pick(x, pairKeys)).sort((a,b)=>a.symbol.localeCompare(b.symbol));
  }
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    console.error("PARITY_MISMATCH", path);
    console.error("LIVE_NORMALIZED", JSON.stringify(left));
    console.error("VPS_NORMALIZED", JSON.stringify(right));
    assert(false, path);
  }
  console.log("PARITY_OK", path);
}
console.log("VPS_API_PARITY_OK endpoints=7 volatile_fields_normalized=1");
