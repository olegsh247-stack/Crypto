#!/usr/bin/env node
// Read-only, row-level BTC Product Contour preflight. No database writes.
const live = (process.env.LIVE_API_URL || "").replace(/\/$/, "");
const vps = (process.env.VPS_API_URL || "").replace(/\/$/, "");
const marketMetricIds = [
  "institutional.etf_net_flow",
  "market.spot_price",
  "monetary.block_subsidy",
  "monetary.circulating_supply",
  "monetary.max_supply",
  "security.hashrate"
];
if (!live || !vps) throw new Error("LIVE_API_URL and VPS_API_URL are required");

function assert(condition, message) {
  if (!condition) throw new Error("BTC scenario preflight failed: " + message);
}
async function get(base) {
  const url = base + "/api/assets/btc";
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(url + " -> " + response.status + " " + JSON.stringify(body));
  return body;
}
function arr(body, key, source) {
  assert(Array.isArray(body[key]), source + " " + key + " array missing");
  return body[key];
}
function inspect(source, body, requireLineage) {
  const assetId = body.asset?.asset_id ?? body.asset_id ?? null;
  assert(assetId === "btc", source + " canonical asset identity is " + JSON.stringify(assetId));
  const snapshot = body.research_snapshot;
  assert(snapshot?.snapshot_id, source + " published snapshot missing");
  assert(String(snapshot.status).toUpperCase() === "PUBLISHED",
    source + " latest snapshot is not PUBLISHED: " + JSON.stringify(snapshot));

  const blocks = arr(body, "research_blocks", source);
  const domains = arr(body, "research_domains", source);
  const factors = arr(body, "critical_factors", source);
  const scores = arr(body, "scores", source);
  const evidence = arr(body, "evidence", source);
  const signals = arr(body, "monitoring_signals", source);
  const events = arr(body, "monitoring_events", source);
  const scenarios = arr(body, "research_scenarios", source);
  const states = arr(body, "scenario_states", source);
  const metrics = arr(body, "metrics", source);
  const sources = arr(body, "sources", source);

    const blockNumbers = blocks.map(x => Number(x.block_number)).sort((a,b) => a-b);
  assert(blockNumbers.length === 15 && blockNumbers.every((n,i) => n === i + 1),
    source + " expected exactly blocks 1..15, got " + JSON.stringify(blockNumbers));
  assert(blocks.every(x => ["complete","n_a"].includes(String(x.status).toLowerCase())),
    source + " has unresolved research blocks");
  const scenarioTypes = scenarios.map(x => String(x.scenario_type || "").toLowerCase()).sort();
  assert(scenarioTypes.join(",") === "base,bear,bull",
    source + " expected Base/Bear/Bull definitions, got " + JSON.stringify(scenarioTypes));

  for (const row of [...factors, ...scores]) {
    assert(row.snapshot_id === snapshot.snapshot_id,
      source + " factor/score row has wrong snapshot lineage: " + JSON.stringify(row));
  }
  for (const row of scenarios) {
    if (requireLineage) {
      assert(row.snapshot_id === snapshot.snapshot_id,
        source + " scenario definition snapshot lineage missing/mismatched: " + JSON.stringify(row));
    } else if (row.snapshot_id != null) {
      assert(row.snapshot_id === snapshot.snapshot_id,
        source + " exposed scenario definition snapshot mismatch: " + JSON.stringify(row));
    }
  }

  const scenarioEvidenceContract = {
    exposed: scenarios.every(row => Array.isArray(row.evidence_links)),
    links: scenarios.reduce((total, row) => total + (Array.isArray(row.evidence_links) ? row.evidence_links.length : 0), 0),
    unexposedScenarios: scenarios.filter(row => !Array.isArray(row.evidence_links)).map(row => row.scenario_type)
  };
  for (const scenario of scenarios) {
    if (!Array.isArray(scenario.evidence_links)) continue; // older deployed API; report as a rollout gap below
    for (const link of scenario.evidence_links) {
      assert(link.research_scenario_id === scenario.research_scenario_id,
        source + " evidence link attached to wrong scenario: " + JSON.stringify(link));
      assert(link.snapshot_id === snapshot.snapshot_id && link.snapshot_id === scenario.snapshot_id,
        source + " evidence link has mismatched snapshot lineage: " + JSON.stringify(link));
      assert(!!link.evidence_id && ["supports", "contradicts", "invalidation", "context"].includes(link.relation_type),
        source + " evidence link missing ID or has invalid relation type: " + JSON.stringify(link));
      assert(typeof link.rationale === "string" && link.rationale.trim().length > 0,
        source + " evidence link has empty rationale: " + JSON.stringify(link));
      assert(/^https?:\\/\\//i.test(String(link.source_url || "")),
        source + " evidence link missing a resolvable source URL: " + JSON.stringify(link));
      if (link.observation_id) {
        assert(!!link.observation_observed_at,
          source + " observation-backed evidence link lacks observation timestamp: " + JSON.stringify(link));
      }
    }
  }
  for (const row of states) {
    if (requireLineage) {
      assert(row.snapshot_id === snapshot.snapshot_id,
        source + " scenario state snapshot lineage missing/mismatched: " + JSON.stringify(row));
    } else if (row.snapshot_id != null) {
      assert(row.snapshot_id === snapshot.snapshot_id,
        source + " exposed scenario state snapshot mismatch: " + JSON.stringify(row));
    }
  }

  const evidenceQuality = {
    rows: evidence.length,
    withEvidenceId: evidence.filter(x => !!x.evidence_id).length,
    withSourceId: evidence.filter(x => !!x.source_id).length,
    withSourceUrl: evidence.filter(x => /^https?:\/\//i.test(String(x.source_url || ""))).length,
    withObservationId: evidence.filter(x => !!x.observation_id).length,
    withMetricId: evidence.filter(x => !!x.metric_id).length,
    withAsOf: evidence.filter(x => !!x.as_of).length,
    withoutSourceUrl: evidence.filter(x => !/^https?:\/\//i.test(String(x.source_url || ""))).map(x => x.evidence_id ?? null)
  };
  const signalQuality = {
    rows: signals.length,
    withMetricId: signals.filter(x => !!x.metric_id).length,
    withFactorId: signals.filter(x => !!x.critical_factor_id).length,
    withLastUpdatedAt: signals.filter(x => !!x.last_updated_at).length,
    withCurrentValue: signals.filter(x => x.current_value !== null && x.current_value !== undefined).length,
    withThreshold: signals.filter(x => x.threshold !== null && x.threshold !== undefined).length,
    withoutUpdateTimestamp: signals.filter(x => !x.last_updated_at).map(x => x.name ?? x.monitoring_signal_id ?? null),
    withoutThreshold: signals.filter(x => x.threshold === null || x.threshold === undefined).map(x => x.name ?? x.monitoring_signal_id ?? null)
  };
  const sortedMetricTimes = metrics.map(x => x.observed_at).filter(Boolean).sort();
  const counts = {
    blocks: blocks.length, domains: domains.length, factors: factors.length, scores: scores.length,
    evidence: evidence.length, signals: signals.length, events: events.length,
    scenario_definitions: scenarios.length, scenario_states: states.length,
    metrics: metrics.length, registered_sources: sources.length
  };
  const result = {
    source, asset_id: assetId, snapshot_id: snapshot.snapshot_id, snapshot_status: snapshot.status,
    published_at: snapshot.published_at ?? null, research_lifecycle: body.asset?.research_status ?? null,
    block_numbers: blockNumbers, scenario_types: scenarioTypes,
    scenario_evidence_contract: scenarioEvidenceContract,
    definition_lineage: scenarios.every(x => x.snapshot_id === snapshot.snapshot_id) ? "verified" : "not_exposed_by_runtime",
    state_lineage: states.length === 0 ? "no_state_rows" : (states.every(x => x.snapshot_id === snapshot.snapshot_id) ? "verified" : "not_exposed_by_runtime"),
    factor_lineage: "verified", score_lineage: "verified", counts,
    evidence_quality: evidenceQuality, monitoring_quality: signalQuality,
    metric_observation_range: { oldest: sortedMetricTimes[0] ?? null, newest: sortedMetricTimes.at(-1) ?? null }
  };
  const rowAudit = {
    source,
    metrics: metrics.map(x => ({
      metric_id: x.metric_id, value: x.value, unit: x.unit, observed_at: x.observed_at,
      source_id: x.source_id, source_url: x.source_url, status: x.status, freshness: x.freshness
    })),
    blocks: blocks.map(x => ({
      block_number: x.block_number, research_block_id: x.research_block_id,
      title: x.title, status: x.status, confidence: x.confidence,
      domain_codes: (x.domains || []).map(d => d.code)
    })),
    factors: factors.map(x => ({
      critical_factor_id: x.critical_factor_id, name: x.name, current_state: x.current_state,
      trend: x.trend, confidence: x.confidence, thesis_impact: x.thesis_impact,
      monitoring_priority: x.monitoring_priority, snapshot_id: x.snapshot_id
    })),
    scores: scores.map(x => ({
      score_id: x.score_id, score_type: x.score_type, value: x.value, confidence: x.confidence,
      methodology_version: x.methodology_version, calculated_at: x.calculated_at,
      snapshot_id: x.snapshot_id
    })),
    evidence: evidence.map(x => ({
      evidence_id: x.evidence_id, research_block_id: x.research_block_id,
      research_domain_id: x.research_domain_id, observation_id: x.observation_id ?? null,
      source_id: x.source_id ?? null, metric_id: x.metric_id ?? null,
      claim: x.claim, signal: x.signal, assessment: x.assessment,
      confidence: x.confidence, thesis_impact: x.thesis_impact, status: x.status,
      as_of: x.as_of, observation_value: x.observation_value,
      observation_text: x.observation_text, observation_unit: x.observation_unit,
      source_name: x.source_name, source_url: x.source_url
    })),
    monitoring_signals: signals.map(x => ({
      monitoring_signal_id: x.monitoring_signal_id, critical_factor_id: x.critical_factor_id,
      metric_id: x.metric_id, monitoring_event_id: x.monitoring_event_id ?? null,
      name: x.name, current_value: x.current_value, previous_value: x.previous_value,
      direction: x.direction, threshold: x.threshold, threshold_type: x.threshold_type,
      thesis_impact: x.thesis_impact, status: x.status, confidence: x.confidence,
      last_updated_at: x.last_updated_at
    })),
    scenarios: scenarios.map(x => ({
      research_scenario_id: x.research_scenario_id, snapshot_id: x.snapshot_id ?? null,
      scenario_type: x.scenario_type, probability: x.probability,
      assumptions: x.assumptions, supporting_evidence: x.supporting_evidence,
      invalidation_conditions: x.invalidation_conditions, thesis_impact: x.thesis_impact,
      confidence: x.confidence,
      evidence_links: Array.isArray(x.evidence_links) ? x.evidence_links : null
    })),
    scenario_states: states.map(x => ({
      scenario_state_id: x.scenario_state_id, scenario_id: x.scenario_id,
      state: x.state, confidence: x.confidence, rationale: x.rationale,
      indicators: x.indicators, observed_at: x.observed_at, snapshot_id: x.snapshot_id
    })),
    sources: sources.map(x => ({
      source_id: x.source_id, name: x.name, source_type: x.source_type,
      base_url: x.base_url, trust_level: x.trust_level
    }))
  };
  return { result, rowAudit };
}

const [liveBody, vpsBody] = await Promise.all([get(live), get(vps)]);
const liveResult = inspect("live_worker", liveBody, false);
const vpsResult = inspect("vps_node", vpsBody, true);

const liveMetricById = new Map(liveBody.metrics.map(row => [row.metric_id, row]));
const vpsMetricById = new Map(vpsBody.metrics.map(row => [row.metric_id, row]));
const liveMetricIds = [...liveMetricById.keys()].sort();
const vpsMetricIds = [...vpsMetricById.keys()].sort();
assert(JSON.stringify(liveMetricIds) === JSON.stringify(vpsMetricIds),
  "metric registry projection differs: live=" + JSON.stringify(liveMetricIds) + " vps=" + JSON.stringify(vpsMetricIds));
const metricParity = liveMetricIds.map(metricId => {
  const liveMetric = liveMetricById.get(metricId);
  const vpsMetric = vpsMetricById.get(metricId);
  const fields = ["value", "unit", "observed_at", "source_id", "source_url", "status", "freshness"];
  const differences = fields.filter(field => (liveMetric[field] ?? null) !== (vpsMetric[field] ?? null));
  assert(differences.length === 0,
    "metric differs for " + metricId + " fields=" + differences.join(",") +
    " live=" + JSON.stringify(liveMetric) + " vps=" + JSON.stringify(vpsMetric));
  return {
    metric_id: metricId, value: liveMetric.value, unit: liveMetric.unit,
    observed_at: liveMetric.observed_at, source_id: liveMetric.source_id,
    source_url: liveMetric.source_url, status: liveMetric.status,
    freshness: liveMetric.freshness, match: true
  };
});
const marketMetricParity = metricParity.filter(row => marketMetricIds.includes(row.metric_id));
const researchMetricParity = metricParity.filter(row => row.metric_id.startsWith("btc_research_"));
assert(marketMetricParity.length === marketMetricIds.length,
  "expected " + marketMetricIds.length + " market metrics, got " + marketMetricParity.length);
assert(researchMetricParity.length === 15,
  "expected 15 qualitative research metrics, got " + researchMetricParity.length);
const liveSourceIds = liveBody.sources.map(row => row.source_id).sort();
const vpsSourceIds = vpsBody.sources.map(row => row.source_id).sort();
assert(JSON.stringify(liveSourceIds) === JSON.stringify(vpsSourceIds),
  "source registry projection differs: live=" + JSON.stringify(liveSourceIds) + " vps=" + JSON.stringify(vpsSourceIds));
assert(liveResult.result.snapshot_id === vpsResult.result.snapshot_id,
  "live/VPS published snapshot mismatch: live=" + liveResult.result.snapshot_id + " vps=" + vpsResult.result.snapshot_id);
const countParity = Object.fromEntries(Object.keys(liveResult.result.counts).map(key => [
  key,
  { live: liveResult.result.counts[key], vps: vpsResult.result.counts[key],
    match: liveResult.result.counts[key] === vpsResult.result.counts[key] }
]));
// Once the clean-bootstrap market baseline is applied, both the contour and its
// metric/source projections must match; never hide a count discrepancy.
for (const key of ["blocks", "domains", "factors", "scores", "evidence", "signals", "events", "scenario_definitions", "scenario_states", "metrics", "registered_sources"]) {
  assert(countParity[key].match,
    "live/VPS structural count mismatch for " + key + ": live=" + countParity[key].live + " vps=" + countParity[key].vps);
}
console.log("BTC_SCENARIO_PREFLIGHT_OK " + JSON.stringify({live: liveResult.result, vps: vpsResult.result, count_parity: countParity, metric_parity: {total: metricParity.length, research: researchMetricParity.length, market: marketMetricParity.length}, research_metric_parity: researchMetricParity, market_metric_parity: marketMetricParity, source_ids: liveSourceIds}));
console.log("BTC_SCENARIO_ROW_AUDIT " + JSON.stringify({live: liveResult.rowAudit, vps: vpsResult.rowAudit}));
