import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeBtcCandidateManifest } from "./normalize-btc-candidate-manifest.mjs";

const manifestPath = resolve(import.meta.dirname, "../docs/data-review/BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json");
const loadManifest = async () => JSON.parse(await readFile(manifestPath, "utf8"));

test("normalization is deterministic for the same frozen source manifest", async () => {
  const manifest = await loadManifest();
  assert.deepEqual(
    normalizeBtcCandidateManifest(manifest),
    normalizeBtcCandidateManifest(JSON.parse(JSON.stringify(manifest))),
  );
});

test("normalization preserves provenance, units, observation/window times and raw evidence hashes", async () => {
  const result = normalizeBtcCandidateManifest(await loadManifest());
  const price = result.candidates.find(candidate => candidate.metric_id === "market.spot_price");
  assert.equal(price.unit, "USD/BTC");
  assert.equal(price.observed_at, "2026-10-13T15:26:08.170Z");
  assert.equal(price.retrieved_at, "2026-10-13T15:26:13.228Z");
  assert.match(price.raw_evidence_sha256, /^[a-f0-9]{64}$/);
  const fees = result.candidates.find(candidate => candidate.metric_id === "security.fee_subsidy_ratio");
  assert.equal(fees.window_start_utc, "2026-10-12T00:00:00Z");
  assert.equal(fees.window_end_utc_exclusive, "2026-10-13T00:00:00Z");
  assert.match(fees.raw_evidence_sha256, /^[a-f0-9]{64}$/);\n  assert.equal(fees.source_details.block_count, 152);\n  assert.equal(fees.source_details.total_fees_sats, 286069738);\n  assert.equal(fees.source_details.freshness_window, "48h");\n  const etf = result.candidates.find(candidate => candidate.metric_id === "institutional.etf_net_flow");\n  assert.equal(etf.source_details.cross_check.source_id, "institutional.tftc");
});

test("unresolved ETF observation time and blocked DXY remain unresolved", async () => {
  const result = normalizeBtcCandidateManifest(await loadManifest());
  const etf = result.candidates.find(candidate => candidate.metric_id === "institutional.etf_net_flow");
  const dxy = result.candidates.find(candidate => candidate.metric_id === "macro.dxy");
  assert.equal(etf.observed_at, null);
  assert.equal(etf.dry_run_classification, "HOLD_OBSERVATION_TIME_FRESHNESS_UNRESOLVED");
  assert.equal(dxy.value, null);
  assert.equal(dxy.dry_run_classification, "BLOCKED_NO_CANONICAL_SOURCE");
  assert.equal(result.decision, "NO_INSERTS_AUTHORIZED");
  assert.equal(result.production_writes_performed, false);
});

test("normalization rejects duplicate logical keys instead of choosing a winner", () => {
  const candidate = {
    metric_id: "market.spot_price",
    source_id: "market.kraken",
    value: 1,
    unit: "USD/BTC",
    observed_at: "2026-10-13T00:00:00Z",
    dry_run_classification: "HOLD",
  };
  assert.throws(() => normalizeBtcCandidateManifest({
    asset_id: "btc",
    candidates: [candidate, { ...candidate, value: 2 }],
  }), /Duplicate logical candidate keys/);
});

test("normalization rejects malformed provenance hashes and non-finite values", () => {
  assert.throws(() => normalizeBtcCandidateManifest({
    asset_id: "btc",
    candidates: [{ metric_id: "x", source_id: "s", value: 1, unit: "u", raw_body_sha256: "bad", dry_run_classification: "HOLD" }],
  }), /SHA-256/);
  assert.throws(() => normalizeBtcCandidateManifest({
    asset_id: "btc",
    candidates: [{ metric_id: "x", source_id: "s", value: Number.NaN, unit: "u", dry_run_classification: "HOLD" }],
  }), /finite numbers/);
});
