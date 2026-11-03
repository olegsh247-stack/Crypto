import assert from "node:assert/strict";
import test from "node:test";
import { buildAssetAudit, calculateNullRates } from "./lib/product-contour-audit.mjs";

test("null-rate report keeps denominators and handles empty sections", () => {
  const result = calculateNullRates([{ source_id: "a", unit: null }, { source_id: "", unit: "BTC" }], ["source_id", "unit"]);
  assert.deepEqual(result.source_id, { row_count: 2, null_count: 1, null_rate: 0.5 });
  assert.deepEqual(result.unit, { row_count: 2, null_count: 1, null_rate: 0.5 });
  assert.deepEqual(calculateNullRates([], ["source_id"]).source_id, { row_count: 0, null_count: 0, null_rate: null });
});

test("audit reports snapshot lineage and source registry gaps without mutating data", () => {
  const payload = {
    asset: { asset_id: "btc", research_freshness: { status: "current" } },
    research_snapshot: { snapshot_id: "snapshot-current", version: 2, status: "PUBLISHED" },
    research_blocks: [], research_domains: [], critical_factors: [{ snapshot_id: "snapshot-current" }],
    scores: [{ snapshot_id: "snapshot-current" }],
    research_scenarios: [{ snapshot_id: "snapshot-current" }],
    scenario_states: [{ snapshot_id: "snapshot-old" }],
    monitoring_signals: [], monitoring_events: [],
    sources: [{ source_id: "source-a", name: "Source A" }],
    evidence: [{ snapshot_id: "snapshot-current", source_id: "source-missing", claim: "claim" }],
    metrics: [{ source_id: "source-a", freshness: "stale" }],
    history: [],
  };
  const report = buildAssetAudit("btc", payload);
  assert.equal(report.snapshot_id, "snapshot-current");
  assert.equal(report.section_row_counts.scenario_states, 1);
  assert.equal(report.scenario_snapshot_lineage.cross_snapshot_state_count, 1);
  assert.deepEqual(report.source_lineage.missing_source_ids, ["source-missing"]);
  assert.ok(report.issues.some(issue => issue.code === "snapshot_id_mismatch" && issue.section === "scenario_states"));
  assert.equal(report.freshness_display.metric_counts.stale, 1);
});

test("audit does not silently pass a missing published snapshot or omitted section", () => {
  const report = buildAssetAudit("eth", { asset: { asset_id: "eth" } });
  assert.ok(report.issues.some(issue => issue.code === "published_snapshot_missing"));
  assert.ok(report.issues.some(issue => issue.code === "section_missing" && issue.section === "scenario_states"));
});
