import assert from "node:assert/strict";
import test from "node:test";
import { buildAssetAudit, calculateNullRates, resolveAuditConfig } from "./lib/product-contour-audit.mjs";

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
    scenario_states: [{ snapshot_id: "snapshot-old" }, { scenario_state_id: "state-without-snapshot" }],
    monitoring_signals: [], monitoring_events: [],
    sources: [{ source_id: "source-a", name: "Source A" }],
    evidence: [{ snapshot_id: "snapshot-current", source_id: "source-missing", claim: "claim" }],
    metrics: [{ source_id: "source-a", freshness: "stale" }],
    history: [],
  };
  const report = buildAssetAudit("btc", payload);
  assert.equal(report.snapshot_id, "snapshot-current");
  assert.equal(report.section_row_counts.scenario_states, 2);
  assert.equal(report.scenario_snapshot_lineage.cross_snapshot_state_count, 1);
  assert.equal(report.scenario_snapshot_lineage.state_missing_snapshot_id_count, 1);
  assert.equal(report.scenario_snapshot_lineage.invalid_state_lineage_count, 2);
  assert.deepEqual(report.source_lineage.missing_source_ids, ["source-missing"]);
  assert.ok(report.issues.some(issue => issue.code === "snapshot_id_mismatch" && issue.section === "scenario_states"));
  assert.equal(report.freshness_display.metric_counts.stale, 1);
  assert.ok(report.null_rates.research_blocks.block_number);
  assert.ok(report.null_rates.scenario_states.snapshot_id);
});

test("audit does not silently pass a missing published snapshot or omitted section", () => {
  const report = buildAssetAudit("eth", { asset: { asset_id: "eth" } });
  assert.ok(report.issues.some(issue => issue.code === "published_snapshot_missing"));
  assert.ok(report.issues.some(issue => issue.code === "section_missing" && issue.section === "scenario_states"));
});


test("audit config refuses non-staging, unconfirmed, mismatched, or unidentified targets", () => {
  const valid = {
    PRODUCT_CONTOUR_ENVIRONMENT: "staging",
    PRODUCT_CONTOUR_STAGING_CONFIRMATION: "I_CONFIRM_ISOLATED_NON_PRODUCTION",
    CRYPTO_API_URL: "https://staging.example.internal/api",
    PRODUCT_CONTOUR_STAGING_API_ORIGIN: "https://staging.example.internal",
    PRODUCT_CONTOUR_API_COMMIT_SHA: "510c05eef969a3310fafe777bb48e699575c1456",
  };
  assert.deepEqual(resolveAuditConfig(valid), {
    apiBase: "https://staging.example.internal/api",
    apiOrigin: "https://staging.example.internal",
    apiCommitSha: "510c05eef969a3310fafe777bb48e699575c1456",
    assetIds: ["btc", "eth", "sol", "cake"],
  });
  assert.throws(() => resolveAuditConfig({ ...valid, PRODUCT_CONTOUR_ENVIRONMENT: "production" }), /must be staging/);
  assert.throws(() => resolveAuditConfig({ ...valid, PRODUCT_CONTOUR_STAGING_CONFIRMATION: "" }), /confirmation/);
  assert.throws(() => resolveAuditConfig({ ...valid, CRYPTO_API_URL: "https://production.example/api" }), /does not match/);
  assert.throws(() => resolveAuditConfig({ ...valid, PRODUCT_CONTOUR_API_COMMIT_SHA: "" }), /deployed API commit/);
  assert.throws(() => resolveAuditConfig({ ...valid, CRYPTO_API_URL: "https://user:secret@staging.example.internal/api" }), /without credentials/);
});

test("asset audit preserves the API's actual snapshot version and publication date fields", () => {
  const report = buildAssetAudit("btc", {
    asset: { asset_id: "btc", enabled: true },
    research_snapshot: { snapshot_id: "snapshot-1", research_version: "7", research_date: "2026-11-03T12:00:00.000Z", title: "BTC", status: "PUBLISHED" },
  });
  assert.equal(report.snapshot_version, "7");
  assert.equal(report.snapshot_published_at, "2026-11-03T12:00:00.000Z");
  assert.equal(report.snapshot_title, "BTC");
  assert.equal(report.asset_enabled, true);
});
