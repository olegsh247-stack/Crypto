import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archiveBtcEtfEvidence } from "./archive-btc-etf-evidence.mjs";
import { verifyBtcEtfEvidenceArchive, verifyBtcEtfIndependentRestore } from "./verify-btc-etf-evidence-archive.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "btc-etf-verify-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const inputDir = join(root, "input");
  const archiveRoot = join(root, "archive");
  await mkdir(inputDir);
  const body = Buffer.from("offline fixture response");
  await writeFile(join(inputDir, "provider.raw"), body);
  await writeFile(join(inputDir, "manifest.json"), JSON.stringify({
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: "2026-10-16T10:00:00.000Z",
    sources: [{
      source_id: "test.provider",
      metric_id: "institutional.etf_net_flow",
      url: "https://example.test/etf-data",
      status: "CAPTURED",
      body_file: "provider.raw",
      body_sha256: sha256(body),
      source_payload_sha256: sha256(body)
    }]
  }));
  const rightsFilePath = join(root, "rights.json");
  await writeFile(rightsFilePath, JSON.stringify({
    source_rights: { "test.provider": { status: "CLEARED", evidence_ref: "fixture/test-rights-review" } }
  }));
  const archived = await archiveBtcEtfEvidence({
    inputDir, archiveRoot, rightsFilePath,
    reportingDate: "2026-10-07", snapshotId: "fixture-snapshot-001"
  });
  return { ...archived, root };
}

test("verifies all archived fixture bytes and provenance checksums", async t => {
  const f = await fixture(t);
  const result = await verifyBtcEtfEvidenceArchive(f.target);
  assert.equal(result.verified, true);
  assert.equal(result.snapshot_id, "fixture-snapshot-001");
  assert.equal(result.source_bodies, 1);
  assert.equal(result.verified_files, 3);
});

test("verifies a fixture snapshot copied to a separate restore directory", async t => {
  const f = await fixture(t);
  const restoredDir = join(f.root, "restore", "snapshot-restored");
  await mkdir(join(f.root, "restore"), { recursive: true });
  await cp(f.target, restoredDir, { recursive: true, errorOnExist: true, force: false });
  const result = await verifyBtcEtfEvidenceArchive(restoredDir);
  assert.equal(result.verified, true);
  assert.equal(result.snapshot_id, "fixture-snapshot-001");
  assert.equal(result.verified_files, 3);
});

test("detects a modified source body", async t => {
  const f = await fixture(t);
  await writeFile(join(f.target, "source", "provider.raw"), "modified response");
  await assert.rejects(() => verifyBtcEtfEvidenceArchive(f.target), /SHA-256 mismatch: source\/provider.raw/);
});

test("detects a missing archived source body", async t => {
  const f = await fixture(t);
  const { rm: removeFile } = await import("node:fs/promises");
  await removeFile(join(f.target, "source", "provider.raw"));
  await assert.rejects(() => verifyBtcEtfEvidenceArchive(f.target), /ENOENT/);
});

test("rejects a checksum manifest path traversal", async t => {
  const f = await fixture(t);
  const checksumsPath = join(f.target, "checksums.sha256");
  const checksums = await readFile(checksumsPath, "utf8");
  await writeFile(checksumsPath, checksums + "0".repeat(64) + "  ../outside\n");
  await assert.rejects(() => verifyBtcEtfEvidenceArchive(f.target), /Unsafe checksum path/);
});


test("verifies a restored copy plus an independent-backup evidence receipt", async t => {
  const f = await fixture(t);
  const restoredDir = join(f.root, "external-backup-restore", "snapshot");
  await mkdir(join(f.root, "external-backup-restore"), { recursive: true });
  await cp(f.target, restoredDir, { recursive: true, errorOnExist: true, force: false });
  const receiptPath = join(f.root, "restore-receipt.json");
  await writeFile(receiptPath, JSON.stringify({
    schema_version: 1,
    backup_completed_at: "2026-10-16T11:00:00.000Z",
    restore_tested_at: "2026-10-17T11:00:00.000Z",
    destination_class: "independent encrypted object storage",
    independent_failure_domain: true,
    restore_result: "PASS",
    evidence_ref: "fixture/provider-audit-log-and-restore-report"
  }));
  const result = await verifyBtcEtfIndependentRestore({
    primaryDir: f.target, restoredDir, receiptPath
  });
  assert.equal(result.verified, true);
  assert.equal(result.independent_failure_domain_attested, true);
  assert.equal(result.archive_record_sha256, sha256(await readFile(join(f.target, "archive-record.json"))));
  assert.match(result.limitation, /external attestation/);
});

test("fails closed when the independent restore receipt is missing or not cleared", async t => {
  const f = await fixture(t);
  const restoredDir = join(f.root, "restore", "snapshot");
  await mkdir(join(f.root, "restore"), { recursive: true });
  await cp(f.target, restoredDir, { recursive: true, errorOnExist: true, force: false });
  const receiptPath = join(f.root, "restore-receipt.json");
  await writeFile(receiptPath, JSON.stringify({
    schema_version: 1, backup_completed_at: "2026-10-16T11:00:00.000Z",
    restore_tested_at: "2026-10-17T11:00:00.000Z",
    destination_class: "same VPS disk", independent_failure_domain: false,
    restore_result: "PASS", evidence_ref: "fixture"
  }));
  await assert.rejects(() => verifyBtcEtfIndependentRestore({
    primaryDir: f.target, restoredDir, receiptPath
  }), /lacks required independent-backup evidence/);
  await assert.rejects(() => verifyBtcEtfIndependentRestore({
    primaryDir: f.target, restoredDir: f.target, receiptPath
  }), /different paths/);
});

test("detects a changed restored snapshot even when the receipt claims PASS", async t => {
  const f = await fixture(t);
  const restoredDir = join(f.root, "restore", "snapshot");
  await mkdir(join(f.root, "restore"), { recursive: true });
  await cp(f.target, restoredDir, { recursive: true, errorOnExist: true, force: false });
  await writeFile(join(restoredDir, "source", "provider.raw"), "corrupted after restore");
  const receiptPath = join(f.root, "restore-receipt.json");
  await writeFile(receiptPath, JSON.stringify({
    schema_version: 1, backup_completed_at: "2026-10-16T11:00:00.000Z",
    restore_tested_at: "2026-10-17T11:00:00.000Z",
    destination_class: "independent encrypted object storage",
    independent_failure_domain: true, restore_result: "PASS", evidence_ref: "fixture"
  }));
  await assert.rejects(() => verifyBtcEtfIndependentRestore({
    primaryDir: f.target, restoredDir, receiptPath
  }), /SHA-256 mismatch/);
});
