import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assessBtcScenarioReadiness } from "./btc-scenario-readiness.mjs";
import { evaluateBtcScenarioV1 } from "./btc-scenario-direction.mjs";

const manifestPath = resolve(import.meta.dirname, "../docs/data-review/BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json");

async function loadManifest() {
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

test("frozen BTC candidate staging manifest is explicitly read-only and authorizes no inserts", async () => {
  const manifest = await loadManifest();
  assert.equal(manifest.asset_id, "btc");
  assert.equal(manifest.mode, "read-only-candidate-staging-dry-run");
  assert.equal(manifest.production_database_accessed, false);
  assert.equal(manifest.production_writes_performed, false);
  assert.equal(manifest.decision, "NO_INSERTS_AUTHORIZED");
});

test("candidate classifications and counters cannot silently authorize persistence", async () => {
  const manifest = await loadManifest();
  const summary = manifest.dry_run_summary;
  assert.equal(summary.candidate_count, manifest.candidates.length);
  assert.equal(summary.ready_for_insert, 0);
  assert.equal(summary.inserted, 0);
  assert.equal(summary.updated, 0);
  assert.equal(summary.deleted, 0);
  assert.equal(summary.scenario_or_monitoring_writes, 0);
  assert.ok(manifest.candidates.every((candidate) =>
    candidate.dry_run_classification !== "READY_FOR_INSERT"
    && candidate.dry_run_classification !== "INSERT_AUTHORIZED"
  ));
  assert.ok(manifest.candidates.some((candidate) => candidate.dry_run_classification === "BLOCKED_NO_CANONICAL_SOURCE"));
});

test("candidate values preserve source/window evidence and never infer ETF observation time", async () => {
  const manifest = await loadManifest();
  for (const candidate of manifest.candidates) {
    assert.ok(candidate.metric_id, "every candidate must name its metric");
    assert.ok(candidate.source_id, "every candidate must name its source");
    assert.ok(candidate.dry_run_classification, "every candidate must carry a review classification");
    if (candidate.value !== null && candidate.value !== undefined) {
      assert.ok(candidate.source_url, `valued candidate ${candidate.metric_id} must retain its source URL`);
    }
  }
  const etf = manifest.candidates.find((candidate) => candidate.metric_id === "institutional.etf_net_flow");
  assert.ok(etf);
  assert.equal(etf.observed_at, null);
  assert.equal(etf.dry_run_classification, "HOLD_OBSERVATION_TIME_FRESHNESS_UNRESOLVED");
});


test("frozen BTC candidates cannot reach scenario evaluation until source, freshness and ETF-series gates pass", async () => {
  const manifest = await loadManifest();
  const observations = manifest.candidates.map((candidate) => ({
    metric_id: candidate.metric_id,
    observed_at: candidate.observed_at,
    value_numeric: candidate.value,
    freshness: candidate.observed_at ? "CURRENT" : "STALE",
    source_id: candidate.source_id,
    source_url: candidate.source_url,
    // The last target-database audit is stale; runtime source registration has not been reverified.
    source_registered: false,
    unit: candidate.unit,
    expected_unit: candidate.unit,
    period_start: candidate.session_date ? candidate.session_date + "T00:00:00.000Z" : undefined,
  }));
  const readiness = assessBtcScenarioReadiness(observations, new Date("2026-10-14T08:30:00.000Z"));
  assert.equal(readiness.status, "not_evaluable");
  assert.equal(readiness.can_persist_scenario_state, false);
  assert.ok(readiness.blockers.some((blocker) => blocker.metric_id === "macro.dxy"));
  assert.ok(readiness.blockers.some((blocker) => blocker.metric_id === "institutional.etf_net_flow"));
  const scenario = evaluateBtcScenarioV1({
    readiness_status: readiness.status,
    price_return_7d_pct: 0,
    etf_net_flow_5d_usd_millions: 0,
    hashrate_change_7d_pct: 0,
    dxy_change_5d_pct: 0,
    fee_subsidy_ratio: 0,
  });
  assert.equal(scenario.status, "not_evaluable");
  assert.equal(scenario.can_persist_scenario_state, false);
  assert.equal("scenario_type" in scenario, false);
});


test("UTC-day fee/subsidy candidate is arithmetically reproducible but remains unapproved", async () => {
  const manifest = await loadManifest();
  const candidate = manifest.candidates.find((item) => item.metric_id === "security.fee_subsidy_ratio");
  assert.ok(candidate, "fee/subsidy candidate must be present");
  assert.equal(candidate.unit, "ratio");
  assert.equal(candidate.window_start_utc, "2026-10-12T00:00:00Z");
  assert.equal(candidate.window_end_utc_exclusive, "2026-10-13T00:00:00Z");
  assert.equal(candidate.source_id, "network.primary");
  assert.equal(candidate.source_url, "https://mempool.space/api/v1/blocks/:startHeight");
  assert.equal(candidate.first_height, 971006);
  assert.equal(candidate.last_height, 971157);
  assert.equal(candidate.block_count, 152);
  assert.equal(candidate.last_height - candidate.first_height + 1, candidate.block_count);
  assert.equal(candidate.retrieved_at, "2026-10-13T15:21:36.811Z");
  assert.equal(candidate.raw_artifact_sha256, "dde8265c9ff0ac1791751d5907f95509c50b6dc64011ca8d05bcc4083beabdcc");
  assert.equal(candidate.total_fees_sats, 286069738);
  assert.equal(candidate.total_subsidy_sats, 47500000000);
  assert.ok(Math.abs(candidate.value - candidate.total_fees_sats / candidate.total_subsidy_sats) < 1e-12);
  assert.equal(candidate.dry_run_classification, "HOLD_CONTRACT_ACCEPTANCE");
  assert.equal(manifest.production_writes_performed, false);
  assert.equal(manifest.decision, "NO_INSERTS_AUTHORIZED");
});


test("fee/subsidy candidate stays aligned with the canonical metric registry", async () => {
  const registryPath = resolve(import.meta.dirname, "../data/CryptoDataModel/registry/metric-registry.json");
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const metric = registry.metrics.find((item) => item.metric_id === "security.fee_subsidy_ratio");
  assert.ok(metric, "canonical fee/subsidy metric must exist in the registry");
  assert.equal(metric.unit, "ratio");
  assert.equal(metric.frequency, "1d");
  assert.equal(metric.freshness_window, "48h");
  assert.deepEqual(metric.source_priority, ["network.primary"]);

  const manifest = await loadManifest();
  const candidate = manifest.candidates.find((item) => item.metric_id === "security.fee_subsidy_ratio");
  assert.ok(candidate);
  assert.equal(candidate.unit, metric.unit);
  assert.equal(candidate.source_id, metric.source_priority[0]);
  assert.equal(candidate.dry_run_classification, "HOLD_CONTRACT_ACCEPTANCE");
});
