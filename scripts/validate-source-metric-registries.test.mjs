import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateRegistries } from "./validate-source-metric-registries.mjs";

const root = resolve(import.meta.dirname, "..");

async function loadRegistries() {
  const [sourceText, metricText] = await Promise.all([
    readFile(resolve(root, "data/CryptoDataModel/registry/source-registry.json"), "utf8"),
    readFile(resolve(root, "data/CryptoDataModel/registry/metric-registry.json"), "utf8"),
  ]);
  return [JSON.parse(sourceText), JSON.parse(metricText)];
}

test("current source and metric registries have unique IDs and resolvable references", async () => {
  const [sources, metrics] = await loadRegistries();
  const result = validateRegistries(sources, metrics);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.errors.length, 0);
  assert.ok(result.source_count > 0);
  assert.ok(result.metric_count > 0);
});

test("generic or unvalidated sources in metric priorities are surfaced as warnings", async () => {
  const [sources, metrics] = await loadRegistries();
  const result = validateRegistries(sources, metrics);
  assert.ok(result.warnings.some((warning) =>
    warning.code === "GENERIC_OR_UNVALIDATED_SOURCE_IN_ACTIVE_PRIORITY"
    && warning.source_id === "market.primary"
    && warning.metric_ids.includes("market.futures_open_interest")
  ));
  assert.ok(result.warnings.some((warning) =>
    warning.source_id === "macro.primary" && warning.metric_ids.includes("macro.dxy")
  ));
});

test("duplicate source IDs, duplicate metric IDs and missing source references fail validation", () => {
  const sources = { sources: [
    { source_id: "source.a", name: "A", url: "https://example.com", reliability: "high" },
    { source_id: "source.a", name: "A duplicate", url: "https://example.com", reliability: "high" },
  ] };
  const metrics = { metrics: [
    { metric_id: "metric.a", unit: "unit", source_priority: ["source.missing"] },
    { metric_id: "metric.a", unit: "unit", source_priority: ["source.a"] },
  ] };
  const result = validateRegistries(sources, metrics);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("duplicate source_id: source.a")));
  assert.ok(result.errors.some((error) => error.includes("duplicate metric_id: metric.a")));
  assert.ok(result.errors.some((error) => error.includes("unknown source_id: source.missing")));
});

test("a metric without canonical unit or source priority fails validation", () => {
  const result = validateRegistries(
    { sources: [{ source_id: "source.a", name: "A", url: "https://example.com" }] },
    { metrics: [{ metric_id: "metric.a", unit: "", source_priority: [] }] },
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("no canonical unit")));
  assert.ok(result.errors.some((error) => error.includes("at least one source_priority")));
});
