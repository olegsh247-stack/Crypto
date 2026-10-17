import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archiveBtcEtfEvidence } from "./archive-btc-etf-evidence.mjs";
import { verifyBtcEtfEvidenceArchive } from "./verify-btc-etf-evidence-archive.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");

test("synthetic BTC ETF test archive survives backup and restore; tampering is detected", async t => {
  const work = await mkdtemp(join(tmpdir(), "btc-etf-test-store-"));
  t.after(() => rm(work, { recursive: true, force: true }));
  const inputDir = join(work, "capture");
  const archiveRoot = join(work, "archive");
  const backupRoot = join(work, "backup");
  const restored = join(work, "restored");
  await mkdir(inputDir);
  await mkdir(backupRoot);

  const body = JSON.stringify({
    fixture_only: true,
    disclaimer: "SYNTHETIC_TEST_DATA_NOT_REAL_PROVIDER_DATA",
    reporting_date: "2026-10-16",
    rows: [{ fund: "TEST_A", net_flow_usd_millions: 12.5 }, { fund: "TEST_B", net_flow_usd_millions: -3.25 }]
  });
  const hash = sha256(body);
  await writeFile(join(inputDir, "fixture.json"), body);
  await writeFile(join(inputDir, "manifest.json"), JSON.stringify({
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: "2026-10-17T00:00:00.000Z",
    sources: [{
      source_id: "institutional.primary",
      metric_id: "institutional.etf_net_flow",
      url: "https://example.invalid/synthetic-test-fixture",
      status: "CAPTURED",
      body_file: "fixture.json",
      body_sha256: hash,
      source_payload_sha256: hash
    }]
  }, null, 2));
  const rightsFilePath = join(work, "test-rights.json");
  await writeFile(rightsFilePath, JSON.stringify({
    test_fixture_only: true,
    source_rights: {
      "institutional.primary": {
        status: "CLEARED",
        evidence_ref: "TEST ONLY — synthetic fixture, not a real rights attestation"
      }
    }
  }, null, 2));

  const result = await archiveBtcEtfEvidence({
    inputDir, archiveRoot, reportingDate: "2026-10-16",
    snapshotId: "synthetic-etf-test-001", rightsFilePath
  });
  const before = await verifyBtcEtfEvidenceArchive(result.target);
  assert.equal(before.verified, true);
  await cp(result.target, join(backupRoot, "snapshot"), { recursive: true });
  await cp(join(backupRoot, "snapshot"), restored, { recursive: true });
  const after = await verifyBtcEtfEvidenceArchive(restored);
  assert.equal(after.verified, true);
  assert.equal(after.archive_record_sha256, before.archive_record_sha256);

  await writeFile(join(restored, "source", "fixture.json"), body + "\nchanged");
  await assert.rejects(() => verifyBtcEtfEvidenceArchive(restored), /SHA-256 mismatch/);
  assert.equal(await readFile(join(result.target, "source", "fixture.json"), "utf8"), body);
});
