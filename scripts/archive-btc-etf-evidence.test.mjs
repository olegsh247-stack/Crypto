import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archiveBtcEtfEvidence } from "./archive-btc-etf-evidence.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");

async function fixture(t, { body = "fixture ETF source response", declaredHash, rightsStatus = "CLEARED", evidenceRef = "review/evidence-001", bodyFile = "farside.raw", status = "CAPTURED" } = {}) {
  const root = await mkdtemp(join(tmpdir(), "btc-etf-archive-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const inputDir = join(root, "input");
  const archiveRoot = join(root, "archive");
  await mkdir(inputDir);
  const bodyPath = join(inputDir, bodyFile);
  if (body !== null) await writeFile(bodyPath, body);
  const manifest = {
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: "2026-10-16T10:00:00.000Z",
    sources: [{
      source_id: "institutional.primary",
      metric_id: "institutional.etf_net_flow",
      url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
      status,
      body_file: bodyFile,
      body_sha256: declaredHash ?? sha256(body ?? ""),
      source_payload_sha256: declaredHash ?? sha256(body ?? "")
    }]
  };
  await writeFile(join(inputDir, "manifest.json"), JSON.stringify(manifest));
  const rightsFilePath = join(root, "rights.json");
  await writeFile(rightsFilePath, JSON.stringify({
    source_rights: {
      "institutional.primary": { status: rightsStatus, evidence_ref: evidenceRef }
    }
  }));
  return { root, inputDir, archiveRoot, rightsFilePath };
}

const baseArgs = fixtureArgs => ({
  ...fixtureArgs,
  reportingDate: "2026-10-07",
  snapshotId: "snapshot-test-001"
});

test("writes a new snapshot with provenance and SHA-256 without changing input", async t => {
  const f = await fixture(t);
  const result = await archiveBtcEtfEvidence(baseArgs(f));
  assert.equal(result.source_bodies, 1);
  const savedBody = await readFile(join(result.target, "source", "farside.raw"), "utf8");
  assert.equal(savedBody, "fixture ETF source response");
  const record = JSON.parse(await readFile(join(result.target, "archive-record.json"), "utf8"));
  assert.equal(record.snapshot_id, "snapshot-test-001");
  assert.equal(record.source_bodies[0].rights.status, "CLEARED");
  assert.equal(record.production_writes_performed, false);
  assert.equal(record.network_access_performed, false);
  const checksums = await readFile(join(result.target, "checksums.sha256"), "utf8");
  assert.ok(checksums.includes(sha256("fixture ETF source response")));
});

test("fails closed when source rights are unresolved or evidence reference is missing", async t => {
  const f = await fixture(t, { rightsStatus: "UNRESOLVED" });
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /source rights must be CLEARED/);
});

test("rejects a missing captured source body", async t => {
  const f = await fixture(t, { body: null });
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)));
});

test("rejects a source body whose bytes do not match the declared hash", async t => {
  const f = await fixture(t, { declaredHash: "f".repeat(64) });
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /body hash mismatch/);
});

test("refuses to overwrite an existing snapshot ID", async t => {
  const f = await fixture(t);
  await archiveBtcEtfEvidence(baseArgs(f));
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /refusing to overwrite/);
});

test("rejects an incomplete capture manifest", async t => {
  const f = await fixture(t);
  await writeFile(join(f.inputDir, "manifest.json"), JSON.stringify({ schema_version: 1, asset_id: "btc", sources: [] }));
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /manifest is incomplete/);
});

test("rejects credentials in source URL query parameters or URL userinfo", async t => {
  const f = await fixture(t);
  const manifestPath = join(f.inputDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.sources[0].url = "https://example.test/data?api_key=secret";
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /Possible credential in source URL/);
  manifest.sources[0].url = "https://user:secret@example.test/data";
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(() => archiveBtcEtfEvidence(baseArgs(f)), /Possible credential in source URL/);
});

test("rejects invalid reporting dates and unsafe snapshot identifiers", async t => {
  const f = await fixture(t);
  await assert.rejects(() => archiveBtcEtfEvidence({ ...baseArgs(f), reportingDate: "2026-02-30" }), /valid explicit/);
  await assert.rejects(() => archiveBtcEtfEvidence({ ...baseArgs(f), snapshotId: "../escape" }), /safe, explicit identifier/);
});
