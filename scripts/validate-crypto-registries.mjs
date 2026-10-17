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

// Runtime readiness policy is loaded from the metric registry, not duplicated as literals.
const readinessSource = readFileSync(new URL("../vps/shared/src/btc-scenario-readiness.ts", import.meta.url), "utf8");
assert.ok(readinessSource.includes("data/CryptoDataModel/registry/metric-registry.json")
    && readinessSource.includes("resolve(process.cwd(), registryRelativePath"),
  "runtime readiness must load the canonical metric registry from the application workspace");
assert.ok(!/maxAgeHours:\s*\d/.test(readinessSource),
  "runtime readiness must not hardcode per-metric freshness thresholds");
assert.ok(!readinessSource.includes("https://api.kraken.com/0/public/Trades?pair=XBTUSD"),
  "runtime readiness must not hardcode per-metric source URL allowlists");

const readinessMetrics = new Map(metricRegistry.metrics.map(metric => [metric.metric_id, metric]));
for (const [metricId, required] of [
  ["market.spot_price", true],
  ["macro.dxy", false],
  ["institutional.etf_net_flow", true],
]) {
  const metric = readinessMetrics.get(metricId);
  assert.ok(metric, "missing BTC readiness metric " + metricId);
  assert.equal(metric.scenario_readiness?.required, required, metricId + " has an unexpected BTC readiness requirement");
  assert.ok(Array.isArray(metric.scenario_readiness?.allowed_source_url_prefixes),
    metricId + " must declare source URL prefixes in the metric registry");
}
assert.deepEqual(readinessMetrics.get("market.spot_price").scenario_readiness.allowed_source_url_prefixes,
  ["https://api.kraken.com/0/public/Trades?pair=XBTUSD"],
  "BTC spot source endpoint allowlist must remain explicit");
assert.deepEqual(readinessMetrics.get("macro.dxy").source_priority, [],
  "DXY must not imply an approved automated source");
assert.deepEqual(readinessMetrics.get("macro.dxy").scenario_readiness.allowed_source_url_prefixes, [],
  "DXY has no approved automated quote endpoint; it is optional and non-blocking");
const etfReadiness = readinessMetrics.get("institutional.etf_net_flow").scenario_readiness;
assert.equal(etfReadiness.latest_max_age_hours, 36, "ETF latest-row freshness contract changed");
assert.equal(etfReadiness.history_max_age_days, 14, "ETF reporting-date history window changed");
assert.ok(etfReadiness.minimum_distinct_days >= 5, "ETF readiness must require at least five distinct daily sessions");
assert.deepEqual(etfReadiness.allowed_source_url_prefixes,
  ["https://farside.co.uk/btc/", "https://farside.co.uk/bitcoin-etf-flow-all-data/"],
  "ETF source URL allowlist must remain explicit");

console.log(JSON.stringify({
  status: "PASS",
  source_count: sourceIds.length,
  metric_count: metricIds.length,
  metric_source_references_checked: metricRegistry.metrics.reduce((sum, metric) => sum + metric.source_priority.length, 0),
  seeded_source_count: seeded.size
}, null, 2));
