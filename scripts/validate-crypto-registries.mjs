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
    assert.ok(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(metric.freshness_policy_id),
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

console.log(JSON.stringify({
  status: "PASS",
  source_count: sourceIds.length,
  metric_count: metricIds.length,
  metric_source_references_checked: metricRegistry.metrics.reduce((sum, metric) => sum + metric.source_priority.length, 0),
  seeded_source_count: seeded.size
}, null, 2));
