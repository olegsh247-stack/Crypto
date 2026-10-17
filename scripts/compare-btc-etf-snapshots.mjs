import { readFile } from "node:fs/promises";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function rowSignature(row) {
  return JSON.stringify(canonical({
    fund_flows: row.fund_flows,
    reported_total_usd_million: row.reported_total_usd_million,
    calculated_fund_sum_usd_million: row.calculated_fund_sum_usd_million,
    fund_sum_minus_reported_total_usd_million: row.fund_sum_minus_reported_total_usd_million,
    reconciliation_status: row.reconciliation_status,
    status: row.status,
    fund_values_complete: row.fund_values_complete
  }));
}

function getSnapshot(manifest, label) {
  if (!manifest || !Array.isArray(manifest.sources)) throw new Error(`${label}: manifest has no sources array`);
  const source = manifest.sources.find(item => item.name === "farside-btc-etf-all-data-page");
  if (!source) throw new Error(`${label}: Farside all-data source is missing`);
  if (source.status !== "CAPTURED" || source.http_status !== 200) throw new Error(`${label}: Farside source is not a successful HTTP 200 capture`);
  if (!source.url || !source.retrieved_at || !source.source_payload_sha256 || !Array.isArray(source.latest_rows)) {
    throw new Error(`${label}: Farside source lacks URL, retrieval time, payload hash, or parsed rows`);
  }
  const retrievedMs = Date.parse(source.retrieved_at);
  if (!Number.isFinite(retrievedMs)) throw new Error(`${label}: invalid retrieval timestamp`);
  return { source, retrievedMs };
}

export function compareFarsideSnapshots(olderManifest, newerManifest) {
  const older = getSnapshot(olderManifest, "older snapshot");
  const newer = getSnapshot(newerManifest, "newer snapshot");
  if (older.source.url !== newer.source.url) throw new Error("Snapshots do not use the same source URL");
  if (newer.retrievedMs <= older.retrievedMs) throw new Error("Snapshots are not in chronological order");

  const intervalHours = (newer.retrievedMs - older.retrievedMs) / 3600000;
  const oldRows = new Map(older.source.latest_rows.map(row => [row.period_start, row]));
  const newRows = new Map(newer.source.latest_rows.map(row => [row.period_start, row]));
  const overlappingDates = [...oldRows.keys()].filter(date => newRows.has(date)).sort();
  const changedRows = [];
  const unchangedRows = [];
  for (const date of overlappingDates) {
    const oldRow = oldRows.get(date);
    const newRow = newRows.get(date);
    if (rowSignature(oldRow) === rowSignature(newRow)) unchangedRows.push(date);
    else changedRows.push({
      date,
      older: {
        fund_flows: oldRow.fund_flows,
        reported_total_usd_million: oldRow.reported_total_usd_million,
        reconciliation_status: oldRow.reconciliation_status,
        status: oldRow.status
      },
      newer: {
        fund_flows: newRow.fund_flows,
        reported_total_usd_million: newRow.reported_total_usd_million,
        reconciliation_status: newRow.reconciliation_status,
        status: newRow.status
      }
    });
  }
  const addedDates = [...newRows.keys()].filter(date => !oldRows.has(date)).sort();
  const removedDates = [...oldRows.keys()].filter(date => !newRows.has(date)).sort();
  const intervalGate = intervalHours >= 24;
  return {
    source_id: older.source.source_id,
    source_url: older.source.url,
    older_retrieved_at: older.source.retrieved_at,
    newer_retrieved_at: newer.source.retrieved_at,
    interval_hours: Number(intervalHours.toFixed(4)),
    interval_gate_passed: intervalGate,
    older_payload_sha256: older.source.source_payload_sha256,
    newer_payload_sha256: newer.source.source_payload_sha256,
    payload_changed: older.source.source_payload_sha256 !== newer.source.source_payload_sha256,
    older_latest_reported_date: older.source.latest_reported_date ?? null,
    newer_latest_reported_date: newer.source.latest_reported_date ?? null,
    overlapping_row_count: overlappingDates.length,
    unchanged_row_dates: unchangedRows,
    changed_rows: changedRows,
    added_row_dates: addedDates,
    removed_row_dates: removedDates,
    comparison_status: !intervalGate
      ? "BLOCKED_INTERVAL_UNDER_24H"
      : changedRows.length
        ? "ROW_REVISIONS_DETECTED_REVIEW_REQUIRED"
        : "TWO_SNAPSHOT_COMPARISON_COMPLETE_NO_ROW_REVISIONS_DETECTED",
    acceptance_boundary: "REVIEW_ONLY: this comparison does not approve ingestion or establish provider publication-time, finality, revision policy, or retention rights."
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [olderPath, newerPath] = process.argv.slice(2);
  if (!olderPath || !newerPath) {
    console.error("Usage: node scripts/compare-btc-etf-snapshots.mjs <older-manifest.json> <newer-manifest.json>");
    process.exit(2);
  }
  const older = JSON.parse(await readFile(olderPath, "utf8"));
  const newer = JSON.parse(await readFile(newerPath, "utf8"));
  const result = compareFarsideSnapshots(older, newer);
  console.log(JSON.stringify(result, null, 2));
  if (!result.interval_gate_passed) process.exitCode = 2;
}
