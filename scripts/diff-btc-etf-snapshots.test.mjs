import test from "node:test";
import assert from "node:assert/strict";
import { buildBtcEtfSnapshot, diffBtcEtfSnapshots } from "./diff-btc-etf-snapshots.mjs";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

function makeSnapshot({
  dateRows = [{ date: "2026-10-07", total: -484.9 }],
  tftcRows = [{ date: "2026-10-07", total: -487.0674115 }],
  retrievedAt = "2026-10-16T10:00:00.000Z",
  farsideStatus = "CAPTURED",
  tftcStatus = "CAPTURED",
  farsideHash = HASH_A,
  tftcHash = HASH_B
} = {}) {
  const manifest = {
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: retrievedAt,
    sources: [
      {
        source_id: "institutional.primary",
        metric_id: "institutional.etf_net_flow",
        url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
        status: farsideStatus,
        retrieved_at: retrievedAt,
        body_sha256: farsideHash,
        latest_rows: dateRows.map(row => ({
          period_start: row.date,
          status: row.status ?? "REPORTED_CANDIDATE",
          reported_total_usd_million: row.total,
          calculated_fund_sum_usd_million: row.total,
          reconciliation_status: row.reconciliation ?? "MATCHES_DISPLAY_ROUNDING",
          fund_completeness_status: row.completeness ?? "ALL_FUNDS_REPORTED",
          fund_flows: { IBIT: row.total }
        }))
      },
      {
        source_id: "institutional.tftc",
        metric_id: "institutional.etf_net_flow",
        url: "https://www.tftc.io/bitcoin-etf-flows/data.json",
        status: tftcStatus,
        retrieved_at: retrievedAt,
        body_sha256: tftcHash,
        recent_days_in_last_14_days: tftcRows.map(row => ({
          date: row.date,
          netFlowUsd: row.total * 1_000_000,
          perEtfUsd: { IBIT: row.total * 1_000_000 }
        }))
      }
    ]
  };
  return buildBtcEtfSnapshot({
    manifest,
    candidates: { mode: "review-only-normalized-candidates" },
    manifestBytes: JSON.stringify(manifest),
    candidatesBytes: JSON.stringify({ mode: "review-only-normalized-candidates" })
  });
}

test("same provider payload hashes are a no-op even when capture time changes", () => {
  const previous = makeSnapshot({ retrievedAt: "2026-10-16T10:00:00.000Z" });
  const current = makeSnapshot({ retrievedAt: "2026-10-16T11:00:00.000Z" });
  const result = diffBtcEtfSnapshots(previous, current);
  assert.equal(result.same_payload_snapshot, true);
  assert.deepEqual(result.changes, []);
  assert.ok(result.row_results.length > 0);
  assert.ok(result.row_results.every(row => row.status === "UNCHANGED"));
  assert.equal(result.summary.UNCHANGED, result.row_results.length);
});

test("row order does not affect the deterministic snapshot identity or row diff", () => {
  const previous = makeSnapshot({ dateRows: [
    { date: "2026-10-07", total: -484.9 },
    { date: "2026-10-08", total: 12.5 }
  ] });
  const current = makeSnapshot({ dateRows: [
    { date: "2026-10-08", total: 12.5 },
    { date: "2026-10-07", total: -484.9 }
  ] });
  const result = diffBtcEtfSnapshots(previous, current);
  assert.deepEqual(result.changes, []);
  assert.ok(result.row_results.every(row => row.status === "UNCHANGED"));
});

test("reports a numeric source-row change without replacing the earlier evidence", () => {
  const previous = makeSnapshot();
  const current = makeSnapshot({ dateRows: [{ date: "2026-10-07", total: -480.0 }], farsideHash: HASH_C });
  const result = diffBtcEtfSnapshots(previous, current);
  const change = result.changes.find(item => item.source_id === "institutional.primary");
  assert.equal(change.status, "VALUE_CHANGED");
  assert.equal(change.previous_row.total_usd_million, -484.9);
  assert.equal(change.current_row.total_usd_million, -480.0);
});

test("classifies a newly appearing reporting date", () => {
  const previous = makeSnapshot();
  const current = makeSnapshot({
    dateRows: [
      { date: "2026-10-07", total: -484.9 },
      { date: "2026-10-08", total: 25 }
    ],
    tftcRows: [
      { date: "2026-10-07", total: -487.0674115 },
      { date: "2026-10-08", total: 25 }
    ],
    farsideHash: HASH_C,
    tftcHash: "d".repeat(64)
  });
  const result = diffBtcEtfSnapshots(previous, current);
  assert.ok(result.changes.some(item => item.reporting_date === "2026-10-08" && item.status === "NEW"));
});

test("marks a missing date inside the current source coverage as ROW_MISSING", () => {
  const previous = makeSnapshot({
    dateRows: [
      { date: "2026-10-07", total: -484.9 },
      { date: "2026-10-08", total: 10 },
      { date: "2026-10-09", total: 12 }
    ]
  });
  const current = makeSnapshot({
    dateRows: [
      { date: "2026-10-07", total: -484.9 },
      { date: "2026-10-09", total: 12 }
    ],
    farsideHash: HASH_C
  });
  const result = diffBtcEtfSnapshots(previous, current);
  assert.ok(result.changes.some(item => item.source_id === "institutional.primary"
    && item.reporting_date === "2026-10-08" && item.status === "ROW_MISSING"));
});

test("does not turn an unreported placeholder into a zero", () => {
  const previous = makeSnapshot();
  const current = makeSnapshot({
    dateRows: [{ date: "2026-10-07", total: null, status: "UNREPORTED_PLACEHOLDER", completeness: "UNKNOWN" }],
    farsideHash: HASH_C
  });
  const result = diffBtcEtfSnapshots(previous, current);
  const change = result.changes.find(item => item.source_id === "institutional.primary");
  assert.equal(change.status, "INCOMPLETE");
  assert.equal(change.current_row.total_usd_million, null);
});

test("marks absent source coverage as NOT_COMPARABLE, not as zero or missing row", () => {
  const previous = makeSnapshot();
  const current = makeSnapshot({ farsideStatus: "FAILED", farsideHash: HASH_C });
  const result = diffBtcEtfSnapshots(previous, current);
  const change = result.changes.find(item => item.source_id === "institutional.primary");
  assert.equal(change.status, "NOT_COMPARABLE");
});

test("marks a date outside a truncated current source window as NOT_COMPARABLE", () => {
  const previous = makeSnapshot({
    dateRows: [{ date: "2026-09-01", total: 5 }]
  });
  const current = makeSnapshot({
    dateRows: [{ date: "2026-10-07", total: -484.9 }],
    farsideHash: HASH_C
  });
  const result = diffBtcEtfSnapshots(previous, current);
  const change = result.changes.find(item => item.source_id === "institutional.primary"
    && item.reporting_date === "2026-09-01");
  assert.equal(change.status, "NOT_COMPARABLE");
});

test("emits only review-mode results and never marks them persistable", () => {
  const result = diffBtcEtfSnapshots(makeSnapshot(), makeSnapshot());
  assert.equal(result.mode, "offline-review-only");
  assert.equal(result.production_database_accessed, false);
  assert.equal(result.production_writes_performed, false);
  assert.equal(result.scenario_state_changed, false);
});
