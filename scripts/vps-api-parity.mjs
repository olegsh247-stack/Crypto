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
function normalizeDetail(d, { requireLineage = false } = {}) {
  const snapshotId = d.research_snapshot?.snapshot_id ?? null;
  const scenarios = Array.isArray(d.research_scenarios) ? d.research_scenarios : [];
  const states = Array.isArray(d.scenario_states) ? d.scenario_states : [];

  assert(Array.isArray(d.research_scenarios), "research_scenarios array missing");
  assert(Array.isArray(d.scenario_states), "scenario_states array missing");
  assert(Array.isArray(d.critical_factors), "critical_factors array missing");
  assert(Array.isArray(d.scores), "scores array missing");
  for (const field of ["critical_factors", "scores"]) {
    for (const row of d[field]) {
      assert(!snapshotId || row.snapshot_id === snapshotId,
        field + " row is not scoped to latest published snapshot; baseline=" + snapshotId + "; row=" + JSON.stringify(row));
    }
  }
  for (const scenario of scenarios) {
    assert(!snapshotId || (requireLineage
      ? scenario.snapshot_id === snapshotId
      : scenario.snapshot_id == null || scenario.snapshot_id === snapshotId),
      "scenario definition is not scoped to latest published snapshot; baseline=" + snapshotId + "; row=" + JSON.stringify(scenario));
  }
  for (const state of states) {
    assert(!snapshotId || (requireLineage
      ? state.snapshot_id === snapshotId
      : state.snapshot_id == null || state.snapshot_id === snapshotId),
      "scenario state is not scoped to latest published snapshot");
  }

  return {
    asset: pick(d.asset, ["asset_id","symbol","name","enabled","research_status","research_status_source"]),
    research: pick(d.research, ["lifecycle","freshness"]),
    research_freshness: pick(d.research_freshness, ["status"]),
    snapshot_id: snapshotId,
    snapshot_status: d.research_snapshot?.status ?? null,
    block_count: Array.isArray(d.research_blocks) ? d.research_blocks.length : null,
    critical_factors: d.critical_factors.map(row => pick(row, [
      "name","description","importance_weight","current_state","trend","confidence",
      "thesis_impact","monitoring_priority","snapshot_id"
    ])).sort((a,b) => String(a.name).localeCompare(String(b.name))),
    scores: d.scores.map(row => pick(row, [
      "score_type","value","scale_min","scale_max","methodology_version","confidence",
      "explanation","snapshot_id"
    ])).sort((a,b) => String(a.score_type).localeCompare(String(b.score_type))),
    scenario_definitions: scenarios.map(s => pick(s, [
      "scenario_type","probability","assumptions",
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
    left = normalizeDetail(l); right = normalizeDetail(v, { requireLineage: true });
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
