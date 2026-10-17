import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { buildBtcEtfSnapshot } from "./diff-btc-etf-snapshots.mjs";
import { evaluateBtcEtfResearchEligibility, BTC_ETF_STABILITY_WINDOW_MS } from "./evaluate-btc-etf-research-eligibility.mjs";

const H = "a".repeat(64);
const J = "b".repeat(64);
const K = "c".repeat(64);
const FAR = "https://farside.co.uk/bitcoin-etf-flow-all-data/";
const TFTC = "https://www.tftc.io/bitcoin-etf-flows/data.json";

function snapshot({ at, farside = -484.9, tftc = -487.1, farsideStatus = "CAPTURED", tftcStatus = "CAPTURED", incomplete = false } = {}) {
  const cp = { contract_version: "1", capture_script_sha256: H, farside_parser_sha256: J };
  const np = { contract_version: "1", normalizer_script_sha256: K, farside_parser_sha256: J, metric_registry_sha256: H, capture_provenance: cp };
  const manifest = {
    schema_version: 1, asset_id: "btc", retrieved_at: at, capture_provenance: cp,
    sources: [
      { source_id: "institutional.primary", metric_id: "institutional.etf_net_flow", url: FAR, status: farsideStatus, retrieved_at: at, body_sha256: H,
        latest_rows: [{ period_start: "2026-10-07", status: incomplete ? "INCOMPLETE" : "REPORTED_CANDIDATE", reported_total_usd_million: incomplete ? null : farside,
          calculated_fund_sum_usd_million: incomplete ? null : farside, reconciliation_status: incomplete ? "INCOMPLETE" : "MATCHES_DISPLAY_ROUNDING",
          fund_completeness_status: incomplete ? "UNKNOWN" : "ALL_FUNDS_REPORTED", fund_flows: { IBIT: incomplete ? null : farside } }] },
      { source_id: "institutional.tftc", metric_id: "institutional.etf_net_flow", url: TFTC, status: tftcStatus, retrieved_at: at, body_sha256: J,
        recent_days_in_last_14_days: [{ date: "2026-10-07", netFlowUsd: tftc * 1_000_000, perEtfUsd: { IBIT: tftc * 1_000_000 } }] }
    ]
  };
  const candidates = { mode: "review-only-normalized-candidates", processing_provenance: np };
  return buildBtcEtfSnapshot({ manifest, candidates, manifestBytes: JSON.stringify(manifest), candidatesBytes: JSON.stringify(candidates) });
}

const firstTime = "2026-10-14T10:00:00.000Z";
const after24h = new Date(Date.parse(firstTime) + BTC_ETF_STABILITY_WINDOW_MS).toISOString();
const verifiedControls = {
  archive_restore_verified: true,
  archive_restore_evidence_ref: "independent-restore-rehearsal:fixture-evidence",
  source_rights: {
    "institutional.primary": { status: "CLEARED", evidence_ref: "reviewed-license-or-written-permission:Farside" },
    "institutional.tftc": { status: "CLEARED", evidence_ref: "CC-BY-4.0:TFTC-open-JSON" }
  }
};

test("allows a review candidate only after two unchanged, complete source captures 24h apart", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07", verifiedControls);
  assert.equal(result.status, "ELIGIBLE_FOR_REVIEW");
  assert.equal(result.reviewer_approval_required, true);
  assert.equal(result.provider_finality_claimed, false);
  assert.deepEqual(result.source_checks.map(x => x.status), ["UNCHANGED", "UNCHANGED"]);
});

test("blocks captures less than 24 hours apart", () => {
  const current = new Date(Date.parse(firstTime) + BTC_ETF_STABILITY_WINDOW_MS - 1).toISOString();
  assert.equal(evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: current }), "2026-10-07").status, "BLOCKED_STABILITY_WINDOW");
});

test("blocks changed rows without replacing the earlier evidence", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, farside: -480 }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_REVISION_CANDIDATE");
  assert.equal(result.source_checks[0].previous_fingerprint !== result.source_checks[0].current_fingerprint, true);
});

test("blocks missing/failed source coverage rather than treating it as zero", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, tftcStatus: "FAILED" }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_SOURCE_COVERAGE");
});

test("blocks incomplete rows and does not impute a zero", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, incomplete: true }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_INCOMPLETE_ROW");
});

test("keeps independent source values even when they differ", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07");
  assert.deepEqual(result.source_checks.map(x => x.value_usd_million), [-484.9, -487.1]);
  assert.equal(result.source_checks.some(x => x.value_usd_million === -486), false);
});

test("blocks otherwise stable rows when durable archive restore is not verified", () => {
  const result = evaluateBtcEtfResearchEligibility(
    snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07",
    { ...verifiedControls, archive_restore_verified: false }
  );
  assert.equal(result.status, "BLOCKED_DURABLE_ARCHIVE");
});

test("blocks otherwise stable rows when source-specific storage/reuse rights are unresolved", () => {
  const controls = structuredClone(verifiedControls);
  controls.source_rights["institutional.primary"] = { status: "UNRESOLVED", evidence_ref: "" };
  const result = evaluateBtcEtfResearchEligibility(
    snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07", controls
  );
  assert.equal(result.status, "BLOCKED_SOURCE_RIGHTS");
  assert.equal(result.rights_blocked_source_id, "institutional.primary");
});

test("rejects impossible calendar dates", () => {
  const result = evaluateBtcEtfResearchEligibility(
    snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-02-31", verifiedControls
  );
  assert.equal(result.status, "BLOCKED_INVALID_REPORTING_DATE");
});


test("CLI writes a reproducible offline eligibility report and fails closed without review controls", async () => {
  const directory = await mkdtemp(join(tmpdir(), "btc-etf-eligibility-"));
  try {
    const previous = snapshot({ at: firstTime });
    const current = snapshot({ at: after24h });
    const previousPath = join(directory, "previous.json");
    const currentPath = join(directory, "current.json");
    const controlsPath = join(directory, "controls.json");
    const blockedPath = join(directory, "blocked-report.json");
    const eligiblePath = join(directory, "eligible-report.json");
    await Promise.all([
      writeFile(previousPath, JSON.stringify(previous), "utf8"),
      writeFile(currentPath, JSON.stringify(current), "utf8"),
      writeFile(controlsPath, JSON.stringify(verifiedControls), "utf8")
    ]);
    const scriptPath = resolve(fileURLToPath(new URL("./evaluate-btc-etf-research-eligibility.mjs", import.meta.url)));
    const baseArgs = [
      scriptPath,
      "--previous", previousPath,
      "--current", currentPath,
      "--reporting-date", "2026-10-07"
    ];

    const blocked = spawnSync(process.execPath, [...baseArgs, "--out", blockedPath], { encoding: "utf8" });
    assert.equal(blocked.status, 0, blocked.stderr);
    assert.equal(JSON.parse(blocked.stdout).status, "BLOCKED_DURABLE_ARCHIVE");
    const blockedReport = JSON.parse(await readFile(blockedPath, "utf8"));
    assert.equal(blockedReport.scenario_evaluated, false);
    assert.equal(blockedReport.production_writes_performed, false);
    assert.equal(blockedReport.reviewer_approval_required, true);

    const eligible = spawnSync(process.execPath, [
      ...baseArgs, "--controls", controlsPath, "--out", eligiblePath
    ], { encoding: "utf8" });
    assert.equal(eligible.status, 0, eligible.stderr);
    assert.equal(JSON.parse(eligible.stdout).status, "ELIGIBLE_FOR_REVIEW");
    const eligibleReport = JSON.parse(await readFile(eligiblePath, "utf8"));
    assert.match(eligibleReport.input_manifest_sha256.previous, /^[a-f0-9]{64}$/);
    assert.match(eligibleReport.input_manifest_sha256.current, /^[a-f0-9]{64}$/);
    assert.match(eligibleReport.controls_file_sha256, /^[a-f0-9]{64}$/);
    assert.equal(eligibleReport.scenario_evaluated, false);
    assert.equal(eligibleReport.production_writes_performed, false);
    assert.equal(eligibleReport.reviewer_approval_required, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test("blocks archive restore claims without an evidence reference", () => {
  const controls = { ...verifiedControls, archive_restore_evidence_ref: "  " };
  const result = evaluateBtcEtfResearchEligibility(
    snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07", controls
  );
  assert.equal(result.status, "BLOCKED_DURABLE_ARCHIVE");
  assert.equal(result.reasons.includes("DURABLE_ARCHIVE_AND_INDEPENDENT_RESTORE_REQUIRE_VERIFICATION_AND_EVIDENCE_REFERENCE"), true);
});

test("eligibility report carries the archive and source-rights evidence references", () => {
  const result = evaluateBtcEtfResearchEligibility(
    snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07", verifiedControls
  );
  assert.equal(result.status, "ELIGIBLE_FOR_REVIEW");
  assert.equal(result.archive_restore_evidence_ref, verifiedControls.archive_restore_evidence_ref);
  assert.deepEqual(result.source_rights_evidence_refs, {
    "institutional.primary": verifiedControls.source_rights["institutional.primary"].evidence_ref,
    "institutional.tftc": verifiedControls.source_rights["institutional.tftc"].evidence_ref
  });
});
