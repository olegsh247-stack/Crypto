import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
