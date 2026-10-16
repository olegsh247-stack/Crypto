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
export function evaluateBtcEtfResearchEligibility(previous, current, reportingDate) {
  const details = {
    reporting_date: reportingDate,
    previous_snapshot_id: previous?.snapshot_id,
    current_snapshot_id: current?.snapshot_id
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reportingDate ?? ""))) {
    return result("BLOCKED_INVALID_REPORTING_DATE", ["REPORTING_DATE_MUST_BE_ISO_DATE"], details);
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
  return result("ELIGIBLE_FOR_REVIEW", [], details);
}
