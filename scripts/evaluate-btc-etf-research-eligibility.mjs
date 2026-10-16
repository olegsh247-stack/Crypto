import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBtcEtfSnapshotManifest } from "./diff-btc-etf-snapshots.mjs";

export const BTC_ETF_STABILITY_WINDOW_MS = 24 * 60 * 60 * 1000;
const REQUIRED_SOURCES = [
  { source_id: "institutional.primary", url: "https://farside.co.uk/bitcoin-etf-flow-all-data/" },
  { source_id: "institutional.tftc", url: "https://www.tftc.io/bitcoin-etf-flows/data.json" }
];

function result(status, reasons, details = {}) {
  return {
    schema_version: 1,
    mode: "offline-research-eligibility-review-only",
    status,
    reporting_date: details.reporting_date ?? null,
    previous_snapshot_id: details.previous_snapshot_id ?? null,
    current_snapshot_id: details.current_snapshot_id ?? null,
    rights_blocked_source_id: details.rights_blocked_source_id ?? null,
    elapsed_ms: details.elapsed_ms ?? null,
    source_checks: details.source_checks ?? [],
    reasons,
    production_database_accessed: false,
    production_writes_performed: false,
    scenario_state_changed: false,
    reviewer_approval_required: true,
    provider_finality_claimed: false
  };
}

function findSourceArtifact(snapshot, expected) {
  return (snapshot.source_artifacts ?? []).find(source =>
    source?.source_id === expected.source_id && source?.url === expected.url);
}

function findRows(snapshot, sourceId, sourceUrl, date) {
  return (snapshot.rows ?? []).filter(row =>
    row?.normalized?.source_id === sourceId
    && row?.normalized?.source_url === sourceUrl
    && row?.reporting_date === date);
}

function isComplete(row, sourceId) {
  const n = row?.normalized;
  if (!n || !Number.isFinite(n.total_usd_million)) return false;
  if (["UNREPORTED_PLACEHOLDER", "UNRESOLVED_ROW", "INCOMPLETE"].includes(n.row_status)) return false;
  if (sourceId === "institutional.primary"
    && (n.fund_completeness_status !== "ALL_FUNDS_REPORTED"
      || n.reconciliation_status !== "MATCHES_DISPLAY_ROUNDING"
      || !Number.isFinite(n.calculated_fund_sum_usd_million))) return false;
  return true;
}

/**
 * Evaluates one reporting date across two immutable source snapshots.
 * This produces a review candidate only; a human must approve the named date/snapshot IDs.
 */
export function evaluateBtcEtfResearchEligibility(previous, current, reportingDate, controls = {}) {
  const details = {
    reporting_date: reportingDate,
    previous_snapshot_id: previous?.snapshot_id,
    current_snapshot_id: current?.snapshot_id
  };
  const dateText = String(reportingDate ?? "");
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(dateText + "T00:00:00Z") : null;
  if (!parsedDate || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateText) {
    return result("BLOCKED_INVALID_REPORTING_DATE", ["REPORTING_DATE_MUST_BE_A_REAL_ISO_CALENDAR_DATE"], details);
  }
  if (!validateBtcEtfSnapshotManifest(previous) || !validateBtcEtfSnapshotManifest(current)) {
    return result("BLOCKED_INVALID_SNAPSHOT", ["BOTH_SNAPSHOTS_MUST_PASS_MANIFEST_INTEGRITY_VALIDATION"], details);
  }
  if (previous.snapshot_id === current.snapshot_id) {
    return result("BLOCKED_STABILITY_WINDOW", ["TWO_DISTINCT_SNAPSHOTS_REQUIRED"], details);
  }
  const previousTime = Date.parse(previous.captured_at ?? "");
  const currentTime = Date.parse(current.captured_at ?? "");
  if (!Number.isFinite(previousTime) || !Number.isFinite(currentTime) || currentTime <= previousTime) {
    return result("BLOCKED_STABILITY_WINDOW", ["CAPTURE_TIMESTAMPS_MUST_BE_VALID_AND_STRICTLY_INCREASING"], details);
  }
  const elapsed = currentTime - previousTime;
  details.elapsed_ms = elapsed;
  if (elapsed < BTC_ETF_STABILITY_WINDOW_MS) {
    return result("BLOCKED_STABILITY_WINDOW", ["CAPTURES_MUST_BE_AT_LEAST_24_HOURS_APART"], details);
  }

  const sourceChecks = [];
  for (const source of REQUIRED_SOURCES) {
    const previousArtifact = findSourceArtifact(previous, source);
    const currentArtifact = findSourceArtifact(current, source);
    if (!previousArtifact || !currentArtifact
      || previousArtifact.status !== "CAPTURED" || currentArtifact.status !== "CAPTURED") {
      sourceChecks.push({ source_id: source.source_id, status: "BLOCKED_SOURCE_COVERAGE" });
      details.source_checks = sourceChecks;
      return result("BLOCKED_SOURCE_COVERAGE", ["BOTH_CONFIGURED_SOURCES_MUST_BE_CAPTURED_IN_BOTH_SNAPSHOTS"], details);
    }
    const beforeRows = findRows(previous, source.source_id, source.url, reportingDate);
    const afterRows = findRows(current, source.source_id, source.url, reportingDate);
    if (beforeRows.length !== 1 || afterRows.length !== 1
      || !isComplete(beforeRows[0], source.source_id) || !isComplete(afterRows[0], source.source_id)) {
      sourceChecks.push({ source_id: source.source_id, status: "BLOCKED_INCOMPLETE_ROW" });
      details.source_checks = sourceChecks;
      return result("BLOCKED_INCOMPLETE_ROW", ["EACH_SOURCE_MUST_HAVE_EXACTLY_ONE_COMPLETE_ROW_IN_BOTH_SNAPSHOTS"], details);
    }
    if (beforeRows[0].fingerprint !== afterRows[0].fingerprint) {
      sourceChecks.push({
        source_id: source.source_id,
        status: "BLOCKED_REVISION_CANDIDATE",
        previous_fingerprint: beforeRows[0].fingerprint,
        current_fingerprint: afterRows[0].fingerprint
      });
      details.source_checks = sourceChecks;
      return result("BLOCKED_REVISION_CANDIDATE", ["SOURCE_ROW_CHANGED_BETWEEN_STABILITY_CAPTURES"], details);
    }
    sourceChecks.push({
      source_id: source.source_id,
      status: "UNCHANGED",
      value_usd_million: afterRows[0].normalized.total_usd_million,
      row_fingerprint: afterRows[0].fingerprint
    });
  }
  details.source_checks = sourceChecks;

  // Source-row stability is necessary but not sufficient: evidence must be durably recoverable,
  // and the retained artifact for each source must have an explicit rights clearance reference.
  if (controls.archive_restore_verified !== true) {
    return result("BLOCKED_DURABLE_ARCHIVE", ["DURABLE_ARCHIVE_AND_INDEPENDENT_RESTORE_MUST_BE_VERIFIED"], details);
  }
  for (const source of REQUIRED_SOURCES) {
    const rights = controls.source_rights?.[source.source_id];
    if (rights?.status !== "CLEARED" || typeof rights.evidence_ref !== "string" || !rights.evidence_ref.trim()) {
      return result("BLOCKED_SOURCE_RIGHTS", ["EACH_SOURCE_REQUIRES_EXPLICIT_STORAGE_REUSE_RIGHTS_CLEARANCE"], {
        ...details,
        rights_blocked_source_id: source.source_id
      });
    }
  }
  return result("ELIGIBLE_FOR_REVIEW", [], details);
}


function parseCliArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!["--previous", "--current", "--reporting-date", "--controls", "--out"].includes(key)) {
      throw new Error("Unknown argument: " + key);
    }
    const value = args[i + 1];
    if (!value || value.startsWith("--")) throw new Error("Missing value for " + key);
    if (parsed[key]) throw new Error("Duplicate argument: " + key);
    parsed[key] = value;
    i += 1;
  }
  for (const key of ["--previous", "--current", "--reporting-date", "--out"]) {
    if (!parsed[key]) {
      throw new Error("Usage: node scripts/evaluate-btc-etf-research-eligibility.mjs --previous <snapshot.json> --current <snapshot.json> --reporting-date YYYY-MM-DD [--controls <review-controls.json>] --out <report.json>");
    }
  }
  return parsed;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const previousPath = resolve(args["--previous"]);
  const currentPath = resolve(args["--current"]);
  const outputPath = resolve(args["--out"]);
  const [previousBytes, currentBytes] = await Promise.all([
    readFile(previousPath, "utf8"),
    readFile(currentPath, "utf8")
  ]);
  const previous = JSON.parse(previousBytes);
  const current = JSON.parse(currentBytes);
  if (!validateBtcEtfSnapshotManifest(previous)) {
    throw new Error("Previous input is not a valid versioned BTC ETF snapshot manifest");
  }
  if (!validateBtcEtfSnapshotManifest(current)) {
    throw new Error("Current input is not a valid versioned BTC ETF snapshot manifest");
  }

  let controls = {};
  let controlsSha256 = null;
  let controlsPath = null;
  if (args["--controls"]) {
    controlsPath = resolve(args["--controls"]);
    const controlsBytes = await readFile(controlsPath, "utf8");
    controls = JSON.parse(controlsBytes);
    if (!controls || typeof controls !== "object" || Array.isArray(controls)) {
      throw new Error("Review controls must be a JSON object");
    }
    controlsSha256 = createHash("sha256").update(controlsBytes).digest("hex");
  }

  const eligibility = evaluateBtcEtfResearchEligibility(
    previous, current, args["--reporting-date"], controls
  );
  const report = {
    ...eligibility,
    input_manifest_sha256: {
      previous: createHash("sha256").update(previousBytes).digest("hex"),
      current: createHash("sha256").update(currentBytes).digest("hex")
    },
    controls_file_sha256: controlsSha256,
    controls_supplied: controlsSha256 !== null,
    report_mode: "offline-review-only",
    scenario_evaluated: false,
    production_database_accessed: false,
    production_writes_performed: false,
    scenario_state_changed: false,
    reviewer_approval_required: true
  };
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  process.stdout.write(JSON.stringify({
    status: report.status,
    reporting_date: report.reporting_date,
    previous_snapshot_id: report.previous_snapshot_id,
    current_snapshot_id: report.current_snapshot_id,
    rights_blocked_source_id: report.rights_blocked_source_id,
    output: outputPath,
    report_mode: report.report_mode,
    scenario_evaluated: false,
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
