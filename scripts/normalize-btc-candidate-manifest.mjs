#!/usr/bin/env node
/**
 * Deterministically normalizes a frozen BTC candidate manifest.
 * Offline only: no network, database access, clock reads, or persistence.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REVISION_POLICY = "append_revision_preserve_prior_versions_review_corrections";

function logicalWindow(candidate) {
  if (candidate.window_start_utc || candidate.window_end_utc_exclusive) {
    return [candidate.window_start_utc ?? null, candidate.window_end_utc_exclusive ?? null];
  }
  if (candidate.session_date) return [candidate.session_date];
  if (candidate.observed_at) return [candidate.observed_at];
  if (candidate.first_height != null || candidate.last_height != null) {
    return [candidate.first_height ?? null, candidate.last_height ?? null];
  }
  return [null];
}

function stableIdentity(candidate) {
  return [
    candidate.metric_id,
    candidate.source_id,
    ...logicalWindow(candidate).map(value => value == null ? "null" : String(value)),
  ].join("|");
}

export function normalizeBtcCandidateManifest(manifest) {
  if (!manifest || manifest.asset_id !== "btc" || !Array.isArray(manifest.candidates)) {
    throw new TypeError("Expected a BTC candidate manifest with a candidates array");
  }

  const candidates = manifest.candidates.map(candidate => {
    if (!candidate || typeof candidate.metric_id !== "string" || !candidate.metric_id
      || typeof candidate.source_id !== "string" || !candidate.source_id
      || typeof candidate.dry_run_classification !== "string") {
      throw new TypeError("Every candidate must include metric_id, source_id and dry_run_classification");
    }
    if (candidate.value != null && (typeof candidate.value !== "number" || !Number.isFinite(candidate.value))) {
      throw new TypeError("Candidate values must be finite numbers or null");
    }
    if (candidate.value != null && typeof candidate.unit !== "string") {
      throw new TypeError("Valued candidates must preserve their unit");
    }

    const rawHash = candidate.raw_body_sha256 ?? candidate.raw_artifact_sha256 ?? null;
    if (rawHash != null && !/^[a-f0-9]{64}$/i.test(rawHash)) {
      throw new TypeError("Raw evidence SHA-256 must be a 64-character hex digest");
    }

    const normalizedFields = new Set([
      "metric_id", "source_id", "source_url", "value", "unit", "observed_at", "retrieved_at",
      "session_date", "window_start_utc", "window_end_utc_exclusive", "first_height", "last_height",
      "raw_body_sha256", "raw_artifact_sha256", "source_row_identity", "dry_run_classification", "reason",
    ]);
    const sourceDetails = Object.fromEntries(
      Object.entries(candidate).filter(([key]) => !normalizedFields.has(key)).sort(([a], [b]) => a.localeCompare(b)),
    );

    return {
      candidate_key: stableIdentity(candidate),
      asset_id: "btc",
      metric_id: candidate.metric_id,
      source_id: candidate.source_id,
      source_url: candidate.source_url ?? null,
      value: candidate.value ?? null,
      unit: candidate.unit ?? null,
      observed_at: candidate.observed_at ?? null,
      retrieved_at: candidate.retrieved_at ?? null,
      session_date: candidate.session_date ?? null,
      window_start_utc: candidate.window_start_utc ?? null,
      window_end_utc_exclusive: candidate.window_end_utc_exclusive ?? null,
      first_height: candidate.first_height ?? null,
      last_height: candidate.last_height ?? null,
      raw_evidence_sha256: rawHash,
      source_row_identity: candidate.source_row_identity ?? null,
      dry_run_classification: candidate.dry_run_classification,
      reason: candidate.reason ?? null,
      revision_policy: REVISION_POLICY,
      source_details: sourceDetails,
    };
  });

  candidates.sort((a, b) => a.candidate_key.localeCompare(b.candidate_key));

  const keys = candidates.map(candidate => candidate.candidate_key);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Duplicate logical candidate keys; do not silently choose a winner");
  }

  return {
    schema_version: 1,
    asset_id: "btc",
    mode: "deterministic-offline-candidate-normalization",
    source_manifest_created_at: manifest.created_at ?? null,
    production_database_accessed: false,
    production_writes_performed: false,
    decision: "NO_INSERTS_AUTHORIZED",
    revision_policy: REVISION_POLICY,
    candidates,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const inputPath = process.argv[2] ?? "docs/data-review/BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json";
  const manifest = JSON.parse(await readFile(inputPath, "utf8"));
  process.stdout.write(JSON.stringify(normalizeBtcCandidateManifest(manifest), null, 2) + "\n");
}
