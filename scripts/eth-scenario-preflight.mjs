#!/usr/bin/env node
const live = (process.env.LIVE_API_URL || "").replace(/\/$/, "");
const vps = (process.env.VPS_API_URL || "").replace(/\/$/, "");
if (!live || !vps) throw new Error("LIVE_API_URL and VPS_API_URL are required");

const requiredArrays = [
  ["research_blocks", "blocks"],
  ["research_domains", "domains"],
  ["critical_factors", "factors"],
  ["scores", "scores"],
  ["evidence", "evidence"],
  ["monitoring_signals", "signals"],
  ["monitoring_events", "events"],
  ["research_scenarios", "scenario_definitions"],
  ["scenario_states", "scenario_states"]
];

function assert(condition, message) {
  if (!condition) throw new Error("ETH scenario preflight failed: " + message);
}

async function get(base) {
  const response = await fetch(base + "/api/assets/eth", { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(base + "/api/assets/eth -> " + response.status + " " + JSON.stringify(body));
  return body;
}

function inspect(source, body, requireLineage) {
  const snapshot = body.research_snapshot;
  assert(snapshot && snapshot.snapshot_id, source + " published snapshot missing");
  assert(String(snapshot.status).toUpperCase() === "PUBLISHED",
    source + " snapshot is not published: " + JSON.stringify(snapshot));

  const scenarios = body.research_scenarios;
  const states = body.scenario_states;
  assert(Array.isArray(scenarios), source + " research_scenarios missing");
  assert(Array.isArray(states), source + " scenario_states missing");

  const types = scenarios.map(row => String(row.scenario_type || "").toLowerCase()).sort();
  assert(types.join(",") === "base,bear,bull", source + " expected Base/Bear/Bull definitions, got " + JSON.stringify(types));

  for (const row of scenarios) {
    if (requireLineage) {
      assert(row.snapshot_id === snapshot.snapshot_id, source + " scenario definition snapshot mismatch: " + JSON.stringify(row));
    } else if (row.snapshot_id != null) {
      assert(row.snapshot_id === snapshot.snapshot_id, source + " exposed scenario definition snapshot mismatch: " + JSON.stringify(row));
    }
  }
  for (const row of states) {
    if (requireLineage) {
      assert(row.snapshot_id === snapshot.snapshot_id, source + " scenario state snapshot mismatch: " + JSON.stringify(row));
    } else if (row.snapshot_id != null) {
      assert(row.snapshot_id === snapshot.snapshot_id, source + " exposed scenario state snapshot mismatch: " + JSON.stringify(row));
    }
  }
  for (const field of ["critical_factors", "scores"]) {
    for (const row of body[field] || []) {
      assert(row.snapshot_id === snapshot.snapshot_id,
        source + " " + field + " row is not scoped to latest published snapshot: " + JSON.stringify(row));
    }
  }

  const counts = {};
  for (const [field, label] of requiredArrays) {
    assert(Array.isArray(body[field]), source + " " + field + " array missing");
    counts[label] = body[field].length;
  }

  return {
    source,
    asset_id: body.asset?.asset_id ?? null,
    snapshot_id: snapshot.snapshot_id,
    snapshot_status: snapshot.status,
    published_at: snapshot.published_at ?? null,
    scenario_types: types,
    definition_lineage: scenarios.every(row => row.snapshot_id === snapshot.snapshot_id) ? "verified" : "not_exposed_by_runtime",
    state_lineage: states.every(row => row.snapshot_id === snapshot.snapshot_id) ? "verified" : (states.length === 0 ? "no_state_rows" : "not_exposed_by_runtime"),
    factor_lineage: (body.critical_factors || []).every(row => row.snapshot_id === snapshot.snapshot_id) ? "verified" : "mismatch",
    score_lineage: (body.scores || []).every(row => row.snapshot_id === snapshot.snapshot_id) ? "verified" : "mismatch",
    counts
  };
}

const [liveBody, vpsBody] = await Promise.all([get(live), get(vps)]);
const liveResult = inspect("live_worker", liveBody, false);
const vpsResult = inspect("vps_node", vpsBody, true);

assert(liveResult.asset_id === "eth" && vpsResult.asset_id === "eth", "canonical asset identity must be eth");
assert(liveResult.snapshot_id === vpsResult.snapshot_id,
  "live/VPS published snapshot mismatch: live=" + liveResult.snapshot_id + " vps=" + vpsResult.snapshot_id);
for (const key of Object.keys(liveResult.counts)) {
  assert(liveResult.counts[key] === vpsResult.counts[key],
    "live/VPS count mismatch for " + key + ": live=" + liveResult.counts[key] + " vps=" + vpsResult.counts[key]);
}

const decisionInputs = {
  metrics: (liveBody.metrics || []).map(row => ({
    metric_id: row.metric_id, value: row.value, unit: row.unit,
    observed_at: row.observed_at, source_url: row.source_url,
    status: row.status, freshness: row.freshness
  })),
  monitoring_signals: (liveBody.monitoring_signals || []).map(row => ({
    name: row.name, current_value: row.current_value, previous_value: row.previous_value,
    direction: row.direction, threshold: row.threshold, threshold_type: row.threshold_type,
    thesis_impact: row.thesis_impact, status: row.status, confidence: row.confidence,
    last_updated_at: row.last_updated_at
  })),
  critical_factors: (liveBody.critical_factors || []).map(row => ({
    name: row.name, current_state: row.current_state, trend: row.trend,
    confidence: row.confidence, thesis_impact: row.thesis_impact,
    monitoring_priority: row.monitoring_priority, snapshot_id: row.snapshot_id
  })),
  scores: (liveBody.scores || []).map(row => ({
    score_type: row.score_type, value: row.value, confidence: row.confidence,
    explanation: row.explanation, snapshot_id: row.snapshot_id
  })),
  evidence: (liveBody.evidence || []).map(row => ({
    evidence_id: row.evidence_id, research_block_id: row.research_block_id,
    research_domain_id: row.research_domain_id, claim: row.claim,
    data_summary: row.data_summary, signal: row.signal, assessment: row.assessment,
    confidence: row.confidence, thesis_impact: row.thesis_impact, status: row.status,
    as_of: row.as_of, metric_id: row.metric_id, observation_value: row.observation_value,
    observation_text: row.observation_text, observation_unit: row.observation_unit,
    source_name: row.source_name, source_url: row.source_url
  })),
  scenario_definitions: (liveBody.research_scenarios || []).map(row => ({
    scenario_type: row.scenario_type, probability: row.probability,
    assumptions: row.assumptions, supporting_evidence: row.supporting_evidence,
    invalidation_conditions: row.invalidation_conditions, thesis_impact: row.thesis_impact,
    confidence: row.confidence
  }))
};
console.log("ETH_SCENARIO_PREFLIGHT_OK " + JSON.stringify({ live: liveResult, vps: vpsResult }));
console.log("ETH_SCENARIO_DECISION_INPUTS " + JSON.stringify(decisionInputs));
