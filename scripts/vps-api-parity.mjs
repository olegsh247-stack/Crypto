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
  const snapshotId = d.research_snapshot?.snapshot_id ?? null;
  const scenarios = Array.isArray(d.research_scenarios) ? d.research_scenarios : [];
  const states = Array.isArray(d.scenario_states) ? d.scenario_states : [];

  assert(Array.isArray(d.research_scenarios), "research_scenarios array missing");
  assert(Array.isArray(d.scenario_states), "scenario_states array missing");
  for (const scenario of scenarios) {
    assert(!snapshotId || scenario.snapshot_id === snapshotId,
      "scenario definition is not scoped to latest published snapshot");
  }
  for (const state of states) {
    assert(!snapshotId || state.snapshot_id === snapshotId,
      "scenario state is not scoped to latest published snapshot");
  }

  return {
    asset: pick(d.asset, ["asset_id","symbol","name","enabled","research_status","research_status_source"]),
    research: pick(d.research, ["lifecycle","freshness"]),
    research_freshness: pick(d.research_freshness, ["status"]),
    snapshot_id: snapshotId,
    snapshot_status: d.research_snapshot?.status ?? null,
    block_count: Array.isArray(d.research_blocks) ? d.research_blocks.length : null,
    scenario_definitions: scenarios.map(s => pick(s, [
      "snapshot_id","scenario_type","probability","assumptions",
      "supporting_evidence","invalidation_conditions","thesis_impact","confidence"
    ])).sort((a,b) => String(a.scenario_type).localeCompare(String(b.scenario_type))),
    scenario_states: states.map(s => pick(s, [
      "scenario_id","state","confidence","rationale","indicators","observed_at","snapshot_id"
    ])).sort((a,b) => String(b.observed_at).localeCompare(String(a.observed_at)))
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
    left = (l.pairs || l.items || []).map(x => pick(x, ["symbol","base_asset_id","base_asset","quote_asset_id","quote_asset","exchange","enabled"])).sort((a,b)=>a.symbol.localeCompare(b.symbol));
    right = (v.pairs || v.items || []).map(x => pick(x, ["symbol","base_asset_id","base_asset","quote_asset_id","quote_asset","exchange","enabled"])).sort((a,b)=>a.symbol.localeCompare(b.symbol));
  }
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    console.error("PARITY_DIFF", path, JSON.stringify({ live: left, vps: right }));
  }
  assert(JSON.stringify(left) === JSON.stringify(right), path);
  console.log("PARITY_OK", path);
}
console.log("VPS_API_PARITY_OK endpoints=7 volatile_fields_normalized=1 scenario_definitions=compared scenario_states=compared snapshot_lineage=checked");
