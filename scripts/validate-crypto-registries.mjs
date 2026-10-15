#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sourceRegistry = JSON.parse(readFileSync(new URL("../data/CryptoDataModel/registry/source-registry.json", import.meta.url), "utf8"));
const metricRegistry = JSON.parse(readFileSync(new URL("../data/CryptoDataModel/registry/metric-registry.json", import.meta.url), "utf8"));
const seedSql = readFileSync(new URL("../infrastructure/postgres/seed-v1.sql", import.meta.url), "utf8");

assert.ok(Array.isArray(sourceRegistry.sources), "source registry must contain sources[]");
assert.ok(Array.isArray(metricRegistry.metrics), "metric registry must contain metrics[]");

const sourceIds = sourceRegistry.sources.map(source => source.source_id);
assert.equal(new Set(sourceIds).size, sourceIds.length, "source registry contains duplicate source_id values");
for (const source of sourceRegistry.sources) {
  assert.equal(typeof source.source_id, "string", "every source must have a source_id");
  assert.ok(source.source_id.trim(), "source_id must not be blank");
  if (source.url != null) assert.doesNotThrow(() => new URL(source.url), `invalid URL for ${source.source_id}`);
}

const knownSources = new Set(sourceIds);
const metricIds = metricRegistry.metrics.map(metric => metric.metric_id);
assert.equal(new Set(metricIds).size, metricIds.length, "metric registry contains duplicate metric_id values");
for (const metric of metricRegistry.metrics) {
  assert.ok(metric.metric_id?.trim(), "every metric must have a metric_id");
  assert.ok(metric.unit?.trim(), `metric ${metric.metric_id} is missing a unit`);
  assert.ok(Array.isArray(metric.source_priority), `metric ${metric.metric_id} must declare source_priority as an array`);
  for (const sourceId of metric.source_priority) {
    assert.ok(knownSources.has(sourceId), `metric ${metric.metric_id} references unknown source_id ${sourceId}`);
  }
  if (metric.freshness_policy_id != null) {
    assert.ok(/^[a-z0-9][a-z0-9._-]*$/.test(metric.freshness_policy_id),
      `metric ${metric.metric_id} has malformed freshness_policy_id`);
  }
}

const sourceSeedBlock = seedSql.split(/insert into sources\s*\(/i)[1]?.split(/on conflict \(source_id\)/i)[0];
assert.ok(sourceSeedBlock, "seed-v1.sql must contain the source registry seed block");
const seededSourceIds = [...sourceSeedBlock.matchAll(/^\s*\('([^']+)'/gm)].map(match => match[1]);
const seeded = new Set(seededSourceIds);
assert.equal(seeded.size, seededSourceIds.length, "seed-v1.sql contains duplicate source IDs");
for (const sourceId of sourceIds) {
  assert.ok(seeded.has(sourceId), `source registry entry ${sourceId} is not seeded into PostgreSQL sources`);
}

// Guard the runtime BTC readiness contract against silent drift from the metric registry.
// The shared TypeScript implementation is canonical for runtime behavior; these checks make
// its duplicated contract fields fail CI whenever the registry changes independently.
const readinessSource = readFileSync(new URL("../vps/shared/src/btc-scenario-readiness.ts", import.meta.url), "utf8");
const readinessBlock = readinessSource.split(/const REQUIRED:[^=]*= \\[/)[1]?.split(/\\n\\];/)[0];
assert.ok(readinessBlock, "BTC readiness REQUIRED contract must be discoverable");
const readinessRows = [...readinessBlock.matchAll(/\\{\\s*metricId:\\s*"([^"]+)"([^}]+)\\}/g)];
assert.ok(readinessRows.length > 0, "BTC readiness REQUIRED contract must contain metric entries");
const metricsById = new Map(metricRegistry.metrics.map(metric => [metric.metric_id, metric]));
function ageHours(window, metricId) {
  const match = /^(\\d+)(m|h|d)$/.exec(String(window ?? ""));
  assert.ok(match, `metric ${metricId} has no parseable freshness_window for BTC readiness`);
  const factor = { m: 1 / 60, h: 1, d: 24 }[match[2]];
  return Number(match[1]) * factor;
}
for (const [, metricId, fields] of readinessRows) {
  const metric = metricsById.get(metricId);
  assert.ok(metric, `BTC readiness references unknown metric ${metricId}`);
  const age = /maxAgeHours:\\s*(\\d+(?:\\.\\d+)?)/.exec(fields);
  const unit = /unit:\\s*"([^"]+)"/.exec(fields);
  const sourceIds = /sourceIds:\\s*(\\[[^\\]]*\\])/.exec(fields);
  assert.ok(age && unit && sourceIds, `BTC readiness contract for ${metricId} must declare age, unit and source IDs`);
  assert.equal(Number(age[1]), ageHours(metric.freshness_window, metricId), `freshness age drift for ${metricId}`);
  assert.equal(unit[1], metric.unit, `unit drift for ${metricId}`);
  assert.deepEqual(JSON.parse(sourceIds[1]), metric.source_priority, `approved source IDs drift for ${metricId}`);
}
// ETF daily history has a separate rule block (latest-row freshness + distinct reporting days).
const etfMetric = metricsById.get("institutional.etf_net_flow");
assert.ok(etfMetric, "ETF flow metric must exist in metric registry");
const etfRule = /validObservation\\(latestEtf, nowMs, (\\d+(?:\\.\\d+)?), "([^"]+)", (\\[[^\\]]*\\]), (\\[[^\\]]*\\])\\)/.exec(readinessSource);
assert.ok(etfRule, "ETF latest-row readiness rule must be discoverable");
assert.equal(Number(etfRule[1]), ageHours(etfMetric.freshness_window, etfMetric.metric_id), "ETF latest-row freshness drift");
assert.equal(etfRule[2], etfMetric.unit, "ETF flow unit drift");
assert.deepEqual(JSON.parse(etfRule[3]), etfMetric.source_priority, "ETF approved source IDs drift");
const distinctDaysRule = /uniqueByDay\\.size < (\\d+)/.exec(readinessSource);
assert.ok(distinctDaysRule, "ETF minimum distinct-day rule must be discoverable");
assert.ok(Number(distinctDaysRule[1]) >= 5, "ETF readiness must retain at least five distinct daily observations");

console.log(JSON.stringify({
  status: "PASS",
  source_count: sourceIds.length,
  metric_count: metricIds.length,
  metric_source_references_checked: metricRegistry.metrics.reduce((sum, metric) => sum + metric.source_priority.length, 0),
  seeded_source_count: seeded.size
}, null, 2));
