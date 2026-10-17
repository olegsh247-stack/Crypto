#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const catalog = readJson("../data/CryptoDataModel/registry/source-catalog.v1.json");
const sourceRegistry = readJson("../data/CryptoDataModel/registry/source-registry.json");
const metricRegistry = readJson("../data/CryptoDataModel/registry/metric-registry.json");

assert.equal(typeof catalog.catalog_version, "string", "catalog_version is required");
assert.ok(Array.isArray(catalog.endpoints), "catalog must contain endpoints[]");
assert.ok(catalog.policy?.secret_values_allowed === false, "catalog must explicitly prohibit secret values");

const catalogIds = catalog.endpoints.map((entry) => entry.catalog_id);
assert.equal(new Set(catalogIds).size, catalogIds.length, "duplicate catalog_id");
const registrySourceIds = new Set(sourceRegistry.sources.map((entry) => entry.source_id));
const metricSourceIds = new Set(metricRegistry.metrics.flatMap((metric) => metric.source_priority ?? []));
const endpointIdsBySource = new Map();

for (const endpoint of catalog.endpoints) {
  assert.ok(endpoint.catalog_id?.trim(), "catalog_id must not be blank");
  assert.ok(endpoint.source_id?.trim(), `${endpoint.catalog_id}: source_id must not be blank`);
  assert.ok(endpoint.provider?.trim(), `${endpoint.catalog_id}: provider is required`);
  assert.ok(endpoint.name?.trim(), `${endpoint.catalog_id}: name is required`);
  if (endpoint.url == null) {
    assert.ok(endpoint.operational_status === "unknown" && endpoint.data_role === "blocked" && endpoint.access_mode === "manual",
      `${endpoint.catalog_id}: URL may be null only for an explicitly blocked unselected placeholder`);
  } else {
    assert.doesNotThrow(() => new URL(endpoint.url), `${endpoint.catalog_id}: invalid URL`);
  }
  assert.ok(["public", "api_key", "licensed", "manual", "documentation"].includes(endpoint.access_mode),
    `${endpoint.catalog_id}: invalid access_mode`);
  assert.ok(["verified", "candidate", "blocked", "retired", "unknown"].includes(endpoint.operational_status),
    `${endpoint.catalog_id}: invalid operational_status`);
  assert.ok(["canonical_candidate", "cross_check", "review_only", "documentation_only", "blocked"].includes(endpoint.data_role),
    `${endpoint.catalog_id}: invalid data_role`);
  assert.ok(["registered", "candidate_unregistered"].includes(endpoint.registry_status),
    `${endpoint.catalog_id}: invalid registry_status`);
  assert.ok(endpoint.polling && ["interval", "daily", "event_driven", "on_demand", "manual"].includes(endpoint.polling.mode),
    `${endpoint.catalog_id}: invalid polling mode`);
  if (endpoint.polling.mode === "interval") {
    assert.ok(Number.isInteger(endpoint.polling.preferred_interval_minutes) && endpoint.polling.preferred_interval_minutes > 0,
      `${endpoint.catalog_id}: interval polling needs a positive preferred_interval_minutes`);
  }
  assert.ok(endpoint.data_contract?.unit, `${endpoint.catalog_id}: data contract must declare unit`);
  assert.ok(endpoint.data_contract?.observation_time, `${endpoint.catalog_id}: observation_time semantics must be stated, including if unresolved`);
  assert.ok(endpoint.data_contract?.period_semantics, `${endpoint.catalog_id}: period semantics must be stated`);
  assert.ok(endpoint.terms_status?.trim(), `${endpoint.catalog_id}: terms status is required`);

  if (endpoint.url != null) {
    const url = new URL(endpoint.url);
    for (const key of url.searchParams.keys()) {
      assert.ok(!/(api[_-]?key|token|secret|password|signature|authorization)/i.test(key),
        `${endpoint.catalog_id}: credential-like query parameter must not be stored in catalog URL`);
    }
  }
  if (endpoint.credential_env != null) {
    assert.match(endpoint.credential_env, /^[A-Z][A-Z0-9_]*$/,
      `${endpoint.catalog_id}: credential_env must be an environment variable name, not a secret`);
  }
  if (endpoint.registry_status === "registered") {
    assert.ok(registrySourceIds.has(endpoint.source_id),
      `${endpoint.catalog_id}: registered source_id ${endpoint.source_id} is absent from source-registry.json`);
  } else {
    assert.ok(!metricSourceIds.has(endpoint.source_id),
      `${endpoint.catalog_id}: unregistered candidate ${endpoint.source_id} must not be in metric source_priority`);
  }
  endpointIdsBySource.set(endpoint.source_id, (endpointIdsBySource.get(endpoint.source_id) ?? 0) + 1);
}

const catalogSourceIds = new Set(catalog.endpoints.filter((entry) => entry.registry_status === "registered").map((entry) => entry.source_id));
const registrySourcesMissingFromCatalog = [...registrySourceIds].filter((sourceId) => !catalogSourceIds.has(sourceId)).sort();
const metricSourcesMissingFromCatalog = [...metricSourceIds].filter((sourceId) => !catalogSourceIds.has(sourceId)).sort();

const result = {
  status: "PASS",
  endpoint_count: catalog.endpoints.length,
  registered_source_ids_covered: catalogSourceIds.size,
  metric_source_ids_missing_catalog_entries: metricSourcesMissingFromCatalog,
  registry_source_ids_missing_catalog_entries: registrySourcesMissingFromCatalog,
  notes: [
    "Missing catalog coverage is reported as a baseline finding, not failed yet, so legacy providers can be migrated without silently changing runtime behavior.",
    "This check validates catalog structure and references only; it does not approve sources for ingestion or scenario evaluation."
  ]
};
console.log(JSON.stringify(result, null, 2));
