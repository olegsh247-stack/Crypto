import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archiveBtcEtfEvidence } from "./archive-btc-etf-evidence.mjs";
import { verifyBtcEtfEvidenceArchive } from "./verify-btc-etf-evidence-archive.mjs";

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
