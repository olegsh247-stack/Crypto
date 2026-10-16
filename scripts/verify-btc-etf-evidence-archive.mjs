#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeRelativePath(value) {
  if (typeof value !== "string" || !value || isAbsolute(value)
      || value.includes("\\") || value.split("/").some(part => !part || part === "." || part === "..")) {
    throw new Error("Unsafe checksum path: " + String(value));
  }
  return value;
}

async function regularFile(path, label) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(label + " must be a regular, non-symlink file");
}

export async function verifyBtcEtfEvidenceArchive(snapshotDir) {
  if (!snapshotDir) throw new Error("--snapshot-dir is required");
  const root = resolve(snapshotDir);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("Snapshot must be a regular directory, not a symlink");

  const recordPath = join(root, "archive-record.json");
  const checksumsPath = join(root, "checksums.sha256");
  await regularFile(recordPath, "archive-record.json");
  await regularFile(checksumsPath, "checksums.sha256");
  let record;
  try { record = JSON.parse(await readFile(recordPath, "utf8")); }
  catch { throw new Error("archive-record.json must be valid JSON"); }
  if (record?.schema_version !== 1 || record?.mode !== "offline-evidence-archive"
      || record?.asset_id !== "btc" || !Array.isArray(record?.copied_files)
      || !Array.isArray(record?.source_bodies) || record.source_bodies.length < 1) {
    throw new Error("Unsupported or incomplete archive record");
  }

  const lines = (await readFile(checksumsPath, "utf8")).split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error("Checksum manifest is empty");
  const expected = new Map();
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw new Error("Malformed checksum line");
    const path = safeRelativePath(match[2]);
    if (expected.has(path)) throw new Error("Duplicate checksum path: " + path);
    expected.set(path, match[1]);
  }
  if (!expected.has("archive-record.json") || expected.get("archive-record.json") !== sha256(await readFile(recordPath))) {
    throw new Error("archive-record.json checksum mismatch");
  }

  const copied = new Map();
  for (const file of record.copied_files) {
    const path = safeRelativePath(file?.path);
    if (path === "archive-record.json" || path === "checksums.sha256" || copied.has(path)) {
      throw new Error("Duplicate or reserved copied file path: " + path);
    }
    if (!/^[a-f0-9]{64}$/.test(String(file?.sha256 ?? "")) || !Number.isSafeInteger(file?.bytes) || file.bytes < 0) {
      throw new Error("Invalid copied file metadata: " + path);
    }
    copied.set(path, file);
  }
  if (copied.size + 1 !== expected.size) throw new Error("Checksum manifest and archive record file counts differ");
  for (const [path, file] of copied) {
    if (!expected.has(path) || expected.get(path) !== file.sha256) {
      throw new Error("Checksum manifest disagrees with archive record: " + path);
    }
  }
  for (const [path, expectedHash] of expected) {
    const absolute = resolve(root, ...path.split("/"));
    const rel = relative(root, absolute);
    if (!rel || rel.startsWith(".." + sep) || rel === ".." || isAbsolute(rel)) throw new Error("Checksum path escapes snapshot: " + path);
    await regularFile(absolute, path);
    const bytes = await readFile(absolute);
    if (sha256(bytes) !== expectedHash) throw new Error("SHA-256 mismatch: " + path);
    const metadata = copied.get(path);
    if (metadata && bytes.length !== metadata.bytes) throw new Error("Byte-length mismatch: " + path);
  }

  const expectedFiles = new Set(expected.keys());
  const expectedDirs = new Set();
  for (const path of expectedFiles) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i += 1) expectedDirs.add(parts.slice(0, i).join("/"));
  }
  async function walk(directory, prefix = "") {
    for (const name of await readdir(directory)) {
      const relPath = prefix ? prefix + "/" + name : name;
      const fullPath = join(directory, name);
      const info = await lstat(fullPath);
      if (info.isSymbolicLink()) throw new Error("Symlinks are not allowed in archive: " + relPath);
      if (info.isDirectory()) {
        if (!expectedDirs.has(relPath)) throw new Error("Unexpected unmanifested directory: " + relPath);
        await walk(fullPath, relPath);
      } else if (!info.isFile() || (relPath !== "checksums.sha256" && !expectedFiles.has(relPath))) {
        throw new Error("Unexpected unmanifested file: " + relPath);
      }
    }
  }
  await walk(root);
  return {
    verified: true,
    snapshot_id: record.snapshot_id,
    reporting_date: record.reporting_date,
    verified_files: expected.size,
    source_bodies: record.source_bodies.length,
    archive_record_sha256: sha256(await readFile(recordPath))
  };
}

function argsFrom(argv) {
  if (argv.length !== 2 || argv[0] !== "--snapshot-dir" || !argv[1] || argv[1].startsWith("--")) {
    throw new Error("Usage: node scripts/verify-btc-etf-evidence-archive.mjs --snapshot-dir <snapshot-directory>");
  }
  return argv[1];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyBtcEtfEvidenceArchive(argsFrom(process.argv.slice(2)));
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write("BTC ETF evidence archive verification blocked: " + (error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
