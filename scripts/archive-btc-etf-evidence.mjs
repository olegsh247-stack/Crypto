#!/usr/bin/env node
/**
 * Offline-only writer for a reviewed BTC ETF evidence bundle.
 * It reads an existing local capture directory, never fetches providers,
 * never accesses PostgreSQL, and refuses raw-body retention without explicit
 * per-source rights evidence. Existing snapshots are immutable.
 */
import { createHash } from "node:crypto";
import {
  copyFile, lstat, mkdir, readFile, readdir, rename, rm, writeFile
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HASH_RE = /^[a-f0-9]{64}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function validDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const ms = Date.parse(value + "T00:00:00.000Z");
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(label + " must be valid JSON");
  }
}

function validateRights(rights, sourceId) {
  const entry = rights?.source_rights?.[sourceId];
  if (entry?.status !== "CLEARED" || typeof entry?.evidence_ref !== "string" || !entry.evidence_ref.trim()) {
    throw new Error("Raw-body retention is blocked: source rights must be CLEARED with an evidence_ref for " + sourceId);
  }
  return { status: entry.status, evidence_ref: entry.evidence_ref.trim() };
}

function validateSourceUrl(url, sourceId) {
  if (typeof url !== "string" || !/^https:\/\//i.test(url)) {
    throw new Error("Source URL must be HTTPS for " + sourceId);
  }
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error("Invalid source URL for " + sourceId); }
  if (parsed.username || parsed.password
      || [...parsed.searchParams.keys()].some(key => /(api.?key|token|secret|password|authorization|credential)/i.test(key))) {
    throw new Error("Possible credential in source URL; refusing to archive " + sourceId);
  }
}

async function assertRegularFile(path, label) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(label + " must be a regular, non-symlink file");
}

export async function archiveBtcEtfEvidence({
  inputDir, archiveRoot, reportingDate, snapshotId, rightsFilePath
}) {
  if (!validDate(reportingDate)) throw new Error("A valid explicit --reporting-date (YYYY-MM-DD) is required");
  if (typeof snapshotId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(snapshotId) || snapshotId === "." || snapshotId === "..") {
    throw new Error("snapshot-id must be a safe, explicit identifier");
  }
  if (!inputDir || !archiveRoot || !rightsFilePath) {
    throw new Error("--input, --archive-root, and --rights are required");
  }

  const input = resolve(inputDir);
  const root = resolve(archiveRoot);
  const rightsPath = resolve(rightsFilePath);
  const inputInfo = await lstat(input);
  if (!inputInfo.isDirectory() || inputInfo.isSymbolicLink()) throw new Error("Input must be a regular directory, not a symlink");
  await assertRegularFile(join(input, "manifest.json"), "manifest.json");
  await assertRegularFile(rightsPath, "rights file");

  const manifestBytes = await readFile(join(input, "manifest.json"));
  const rightsBytes = await readFile(rightsPath);
  const manifest = parseJson(manifestBytes, "manifest.json");
  const rights = parseJson(rightsBytes, "rights file");
  if (manifest?.schema_version !== 1 || manifest?.asset_id !== "btc"
      || !Array.isArray(manifest?.sources) || !manifest.sources.length
      || typeof manifest?.retrieved_at !== "string" || !Number.isFinite(Date.parse(manifest.retrieved_at))) {
    throw new Error("Capture manifest is incomplete or has an unsupported schema");
  }

  const copied = [{ path: "manifest.json", sha256: sha256(manifestBytes), bytes: manifestBytes.length }];
  const sourceEntries = [];
  const seenSourceBodies = new Set();
  const seenSourceIds = new Set();
  for (const source of manifest.sources) {
    if (!source || typeof source.source_id !== "string" || !source.source_id.trim()) {
      throw new Error("Every manifest source must have a source_id");
    }
    if (seenSourceIds.has(source.source_id)) throw new Error("Duplicate source_id in manifest: " + source.source_id);
    seenSourceIds.add(source.source_id);
    if (source.url) validateSourceUrl(source.url, source.source_id);
    if (source.status === "CAPTURED" && typeof source.body_file !== "string") {
      throw new Error("Captured source is missing body_file: " + source.source_id);
    }
    if (source.body_file == null) continue;
    if (typeof source.body_file !== "string" || basename(source.body_file) !== source.body_file
        || source.body_file.includes("/") || source.body_file.includes("\\\\")
        || source.body_file === "." || source.body_file === "..") {
      throw new Error("Unsafe body_file path for " + source.source_id);
    }
    if (typeof source.url !== "string" || !source.url.trim()) {
      throw new Error("Source URL is required for every archived raw body: " + source.source_id);
    }
    if (seenSourceBodies.has(source.body_file)) throw new Error("Duplicate body_file in manifest: " + source.body_file);
    seenSourceBodies.add(source.body_file);
    const sourcePath = join(input, source.body_file);
    await assertRegularFile(sourcePath, source.body_file);
    const body = await readFile(sourcePath);
    const declaredHash = source.body_sha256 ?? source.source_payload_sha256;
    if (!HASH_RE.test(String(declaredHash ?? "")) || sha256(body) !== String(declaredHash).toLowerCase()) {
      throw new Error("Source body hash mismatch or missing hash: " + source.source_id);
    }
    const rightsEvidence = validateRights(rights, source.source_id);
    const relativePath = "source/" + source.body_file;
    sourceEntries.push({ source_id: source.source_id, body_file: source.body_file, sha256: sha256(body), bytes: body.length, rights: rightsEvidence });
    copied.push({ path: relativePath, sha256: sha256(body), bytes: body.length, source_id: source.source_id });
  }

  if (!sourceEntries.length) throw new Error("No source body files are available to archive");
  const inputNames = await readdir(input);
  if (inputNames.includes("observation-candidates.json")) {
    const candidatePath = join(input, "observation-candidates.json");
    await assertRegularFile(candidatePath, "observation-candidates.json");
    const candidateBytes = await readFile(candidatePath);
    parseJson(candidateBytes, "observation-candidates.json");
    copied.push({ path: "normalized/observation-candidates.json", sha256: sha256(candidateBytes), bytes: candidateBytes.length });
  }

  const target = join(root, reportingDate, snapshotId);
  const parent = join(root, reportingDate);
  await mkdir(parent, { recursive: true });
  const targetTemp = join(parent, "." + snapshotId + ".tmp-" + process.pid);
  try {
    await lstat(target);
    throw new Error("Snapshot already exists; refusing to overwrite: " + target);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  try {
    await mkdir(targetTemp);
    await mkdir(join(targetTemp, "source"), { recursive: true });
    await mkdir(join(targetTemp, "normalized"), { recursive: true });
    await copyFile(join(input, "manifest.json"), join(targetTemp, "manifest.json"));
    for (const source of sourceEntries) {
      await copyFile(join(input, source.body_file), join(targetTemp, "source", source.body_file));
    }
    if (inputNames.includes("observation-candidates.json")) {
      await copyFile(join(input, "observation-candidates.json"), join(targetTemp, "normalized", "observation-candidates.json"));
    }
    const archiveRecord = {
      schema_version: 1,
      mode: "offline-evidence-archive",
      asset_id: "btc",
      reporting_date: reportingDate,
      snapshot_id: snapshotId,
      archived_at: new Date().toISOString(),
      input_manifest_sha256: sha256(manifestBytes),
      rights_file_sha256: sha256(rightsBytes),
      source_bodies: sourceEntries,
      copied_files: copied,
      production_database_accessed: false,
      production_writes_performed: false,
      network_access_performed: false,
      note: "Archive creation does not verify backup/restore, source finality, or scenario eligibility."
    };
    const recordBytes = Buffer.from(JSON.stringify(archiveRecord, null, 2) + "\n");
    await writeFile(join(targetTemp, "archive-record.json"), recordBytes, { flag: "wx" });
    const checksums = [...copied, { path: "archive-record.json", sha256: sha256(recordBytes), bytes: recordBytes.length }]
      .map(file => file.sha256 + "  " + file.path)
      .join("\n") + "\n";
    await writeFile(join(targetTemp, "checksums.sha256"), checksums, { flag: "wx" });
    await rename(targetTemp, target);
    return { target, snapshot_id: snapshotId, reporting_date: reportingDate, copied_files: copied.length, source_bodies: sourceEntries.length };
  } catch (error) {
    await rm(targetTemp, { recursive: true, force: true });
    throw error;
  }
}

function argsFrom(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!["--input", "--archive-root", "--reporting-date", "--snapshot-id", "--rights"].includes(key)) {
      throw new Error("Unknown argument: " + key);
    }
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + key);
    out[{ "--input": "inputDir", "--archive-root": "archiveRoot", "--reporting-date": "reportingDate", "--snapshot-id": "snapshotId", "--rights": "rightsFilePath" }[key]] = argv[++i];
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await archiveBtcEtfEvidence(argsFrom(process.argv.slice(2)));
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write("BTC ETF evidence archive blocked: " + (error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
