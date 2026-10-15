#!/usr/bin/env node
/**
 * Deterministic, offline-only comparison of two BTC ETF source-capture snapshots.
 * Inputs are directories containing manifest.json and observation-candidates.json.
 * Never accesses the network or database; never mutates either input snapshot.
 */
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "1";
const HASH_RE = /^[a-f0-9]{64}$/i;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}
function canonicalJson(value) {
  return JSON.stringify(stable(value));
}
function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function finiteOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildBtcEtfSnapshot({ manifest, candidates, manifestBytes = "", candidatesBytes = "" }) {
  const sources = Array.isArray(manifest?.sources) ? manifest.sources : [];
  const etfSources = sources.filter(source => source?.metric_id === "institutional.etf_net_flow");
  const rows = [];
  const sourceCoverage = {};
  for (const source of etfSources) {
    const sourceId = source.source_id ?? "unknown-source";
    const sourceKey = sourceId + "|" + String(source.url ?? "");
    const sourceRows = source.status !== "CAPTURED" ? [] : sourceId === "institutional.primary"
      ? (Array.isArray(source.latest_rows) ? source.latest_rows.map(row => ({
          date: row?.period_start,
          row_status: row?.status ?? "UNRESOLVED_ROW",
          total_usd_million: finiteOrNull(row?.reported_total_usd_million),
          calculated_fund_sum_usd_million: finiteOrNull(row?.calculated_fund_sum_usd_million),
          reconciliation_status: row?.reconciliation_status ?? "INCOMPLETE",
          fund_completeness_status: row?.fund_completeness_status ?? "UNKNOWN",
          fund_flows_usd_million: row?.fund_flows && typeof row.fund_flows === "object" ? row.fund_flows : null
        })) : [])
      : (Array.isArray(source.recent_days_in_last_14_days) ? source.recent_days_in_last_14_days
        : Array.isArray(source.recent_days) ? source.recent_days : [])
          .map(row => ({
            date: row?.date ?? row?.day,
            row_status: row?.netFlowUsd == null ? "INCOMPLETE" : "REPORTED_CANDIDATE",
            total_usd_million: typeof row?.netFlowUsd === "number" && Number.isFinite(row.netFlowUsd)
              ? row.netFlowUsd / 1_000_000 : null,
            per_etf_usd_million: row?.perEtfUsd && typeof row.perEtfUsd === "object"
              ? Object.fromEntries(Object.entries(row.perEtfUsd).map(([key, value]) => [key,
                  typeof value === "number" && Number.isFinite(value) ? value / 1_000_000 : null]))
              : null,
            updated_through: source.updated_through ?? null
          }));
    const validRows = sourceRows.filter(row => isDate(row.date));
    const dates = validRows.map(row => row.date).sort();
    sourceCoverage[sourceKey] = {
      status: source.status ?? "UNKNOWN",
      min_date: dates[0] ?? null,
      max_date: dates.at(-1) ?? null,
      row_count: validRows.length,
      source_payload_sha256: HASH_RE.test(String(source.source_payload_sha256 ?? source.body_sha256 ?? ""))
        ? String(source.source_payload_sha256 ?? source.body_sha256).toLowerCase() : null
    };
    for (const row of validRows) {
      const normalized = {
        source_id: sourceId,
        source_url: source.url ?? null,
        reporting_date: row.date,
        row_status: row.row_status,
        total_usd_million: row.total_usd_million,
        calculated_fund_sum_usd_million: row.calculated_fund_sum_usd_million ?? null,
        reconciliation_status: row.reconciliation_status ?? null,
        fund_completeness_status: row.fund_completeness_status ?? null,
        fund_flows_usd_million: row.fund_flows_usd_million ?? null,
        per_etf_usd_million: row.per_etf_usd_million ?? null
      };
      const key = sourceKey + "|" + row.date;
      rows.push({ key, source_key: sourceKey, reporting_date: row.date,
        fingerprint: sha256(canonicalJson(normalized)), normalized });
    }
  }
  rows.sort((a,b) => a.key.localeCompare(b.key));
  const candidateDigest = candidatesBytes ? sha256(candidatesBytes) : sha256(canonicalJson(candidates ?? {}));
  const manifestDigest = manifestBytes ? sha256(manifestBytes) : sha256(canonicalJson(manifest ?? {}));
  const sourceHashes = etfSources.map(source => ({
    source_id: source.source_id ?? null,
    url: source.url ?? null,
    status: source.status ?? null,
    retrieved_at: source.retrieved_at ?? null,
    payload_sha256: source.source_payload_sha256 ?? source.body_sha256 ?? null
  })).sort((a,b) => canonicalJson(a).localeCompare(canonicalJson(b)));
  const sourcePayloadFingerprint = sha256(canonicalJson(sourceHashes.map(source => ({
    source_id: source.source_id, url: source.url, status: source.status,
    payload_sha256: source.payload_sha256
  }))));
  const snapshotIdentity = {
    schema_version: 1,
    diff_algorithm_version: VERSION,
    captured_at: manifest?.retrieved_at ?? null,
    manifest_sha256: manifestDigest,
    candidates_sha256: candidateDigest,
    etf_sources: sourceHashes
  };
  const snapshot = {
    schema_version: 1,
    mode: "offline-review-only-snapshot-manifest",
    snapshot_id: "btc-etf-snapshot-v1-" + sha256(canonicalJson(snapshotIdentity)),
    diff_algorithm_version: VERSION,
    captured_at: manifest?.retrieved_at ?? null,
    manifest_sha256: manifestDigest,
    candidates_sha256: candidateDigest,
    source_payload_fingerprint: sourcePayloadFingerprint,
    source_coverage: sourceCoverage,
    rows,
    production_database_accessed: false,
    production_writes_performed: false
  };
  snapshot.snapshot_content_sha256 = sha256(canonicalJson(snapshot));
  return snapshot;
}

function isComplete(row) {
  if (!row) return false;
  const n = row.normalized;
  if (n.row_status === "UNREPORTED_PLACEHOLDER" || n.row_status === "UNRESOLVED_ROW"
    || n.row_status === "INCOMPLETE") return false;
  if (n.total_usd_million === null) return false;
  if (n.source_id === "institutional.primary"
    && (n.fund_completeness_status !== "ALL_FUNDS_REPORTED"
      || n.reconciliation_status !== "MATCHES_DISPLAY_ROUNDING")) return false;
  return true;
}

export function diffBtcEtfSnapshots(previous, current) {
  const previousByKey = new Map((previous?.rows ?? []).map(row => [row.key, row]));
  const currentByKey = new Map((current?.rows ?? []).map(row => [row.key, row]));
  const allKeys = [...new Set([...previousByKey.keys(), ...currentByKey.keys()])].sort();
  const rowResults = [];
  for (const key of allKeys) {
    const before = previousByKey.get(key) ?? null;
    const after = currentByKey.get(key) ?? null;
    let status;
    if (!before) status = isComplete(after) ? "NEW" : "INCOMPLETE";
    else if (!after) {
      const coverage = current?.source_coverage?.[before.source_key];
      if (!coverage || coverage.status !== "CAPTURED") status = "NOT_COMPARABLE";
      else if (coverage.min_date && coverage.max_date
        && before.reporting_date >= coverage.min_date && before.reporting_date <= coverage.max_date) status = "ROW_MISSING";
      else status = "NOT_COMPARABLE";
    } else if (!isComplete(before) || !isComplete(after)) {
      status = "INCOMPLETE";
    } else if (before.fingerprint === after.fingerprint) status = "UNCHANGED";
    else status = "VALUE_CHANGED";
    rowResults.push({
      source_id: (after ?? before).normalized.source_id,
      source_url: (after ?? before).normalized.source_url,
      reporting_date: (after ?? before).reporting_date,
      status,
      previous_fingerprint: before?.fingerprint ?? null,
      current_fingerprint: after?.fingerprint ?? null,
      previous_row: before?.normalized ?? null,
      current_row: after?.normalized ?? null
    });
  }
  const changes = rowResults.filter(item => item.status !== "UNCHANGED");
  return {
    schema_version: 1,
    mode: "offline-review-only",
    algorithm_version: VERSION,
    previous_snapshot_id: previous?.snapshot_id ?? null,
    current_snapshot_id: current.snapshot_id,
    same_payload_snapshot: previous?.source_payload_fingerprint === current.source_payload_fingerprint,
    row_results: rowResults,
    changes,
    summary: rowResults.reduce((result, item) => {
      result[item.status] = (result[item.status] ?? 0) + 1;
      return result;
    }, {}),
    production_database_accessed: false,
    production_writes_performed: false,
    scenario_state_changed: false,
    note: "A response hash identifies captured bytes, not provider finality or a provider revision. This diff is diagnostic evidence only; it does not approve ingestion or scenario evaluation."
  };
}

export function validateBtcEtfSnapshotManifest(value) {
  const shapeValid = value?.schema_version === 1
    && value.mode === "offline-review-only-snapshot-manifest"
    && typeof value.snapshot_id === "string"
    && value.snapshot_id.startsWith("btc-etf-snapshot-v1-")
    && Array.isArray(value.rows)
    && value.source_coverage !== null
    && typeof value.source_coverage === "object"
    && typeof value.source_payload_fingerprint === "string"
    && value.production_database_accessed === false
    && value.production_writes_performed === false
    && HASH_RE.test(String(value.snapshot_content_sha256 ?? ""));
  if (!shapeValid) return false;
  const { snapshot_content_sha256, ...content } = value;
  return sha256(canonicalJson(content)) === snapshot_content_sha256;
}

async function readSnapshot(inputPath) {
  const inputInfo = await stat(inputPath);
  if (inputInfo.isFile()) {
    const parsed = JSON.parse(await readFile(inputPath, "utf8"));
    if (!validateBtcEtfSnapshotManifest(parsed)) {
      throw new Error(`Not a supported BTC ETF snapshot manifest: ${inputPath}`);
    }
    return parsed;
  }

  const manifestPath = join(inputPath, "manifest.json");
  const candidatesPath = join(inputPath, "observation-candidates.json");
  const [manifestBytes, candidatesBytes] = await Promise.all([
    readFile(manifestPath, "utf8"), readFile(candidatesPath, "utf8")
  ]);
  return buildBtcEtfSnapshot({
    manifest: JSON.parse(manifestBytes),
    candidates: JSON.parse(candidatesBytes),
    manifestBytes,
    candidatesBytes
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--build") {
    const [inputDirArg, outputArg] = args.slice(1);
    if (!inputDirArg || !outputArg) {
      throw new Error("Usage: node scripts/diff-btc-etf-snapshots.mjs --build <capture-dir> <snapshot.json>");
    }
    const outputPath = resolve(outputArg);
    const snapshot = await readSnapshot(resolve(inputDirArg));
    await writeFile(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
    process.stdout.write(JSON.stringify({
      status: "ok",
      mode: "offline-review-only-snapshot-manifest",
      snapshot_id: snapshot.snapshot_id,
      source_payload_fingerprint: snapshot.source_payload_fingerprint,
      row_count: snapshot.rows.length,
      output: outputPath,
      production_database_accessed: false,
      production_writes_performed: false
    }) + "\n");
    return;
  }

  const [previousArg, currentArg, outputArg] = args;
  if (!previousArg || !currentArg || !outputArg) {
    throw new Error("Usage: node scripts/diff-btc-etf-snapshots.mjs <previous-snapshot.json|capture-dir> <current-snapshot.json|capture-dir> <diff.json>");
  }
  const outputPath = resolve(outputArg);
  const [previous, current] = await Promise.all([
    readSnapshot(resolve(previousArg)), readSnapshot(resolve(currentArg))
  ]);
  const result = diffBtcEtfSnapshots(previous, current);
  await writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  process.stdout.write(JSON.stringify({
    status: "ok",
    mode: result.mode,
    previous_snapshot_id: result.previous_snapshot_id,
    current_snapshot_id: result.current_snapshot_id,
    same_payload_snapshot: result.same_payload_snapshot,
    summary: result.summary,
    output: outputPath,
    production_database_accessed: false,
    production_writes_performed: false
  }) + "\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  });
}
