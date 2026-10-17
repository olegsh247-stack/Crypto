import test from "node:test";
import assert from "node:assert/strict";
import { compareFarsideSnapshots } from "./compare-btc-etf-snapshots.mjs";

function manifest({ retrievedAt, hash, total = -82.4, ibit = -71.8, date = "2026-10-16", status = "REPORTED_CANDIDATE" }) {
  return {
    sources: [{
      name: "farside-btc-etf-all-data-page",
      source_id: "institutional.primary",
      url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
      status: "CAPTURED",
      http_status: 200,
      retrieved_at: retrievedAt,
      source_payload_sha256: hash,
      latest_reported_date: date,
      latest_rows: [{
        period_start: date,
        fund_flows: { IBIT: ibit, FBTC: -10.6 },
        reported_total_usd_million: total,
        calculated_fund_sum_usd_million: total,
        fund_sum_minus_reported_total_usd_million: 0,
        reconciliation_status: "MATCHES_DISPLAY_ROUNDING",
        status,
        fund_values_complete: true
      }]
    }]
  };
}

test("blocks two snapshots less than 24 hours apart", () => {
  const result = compareFarsideSnapshots(
    manifest({ retrievedAt: "2026-10-17T18:00:00Z", hash: "a" }),
    manifest({ retrievedAt: "2026-10-18T17:59:59Z", hash: "b" })
  );
  assert.equal(result.interval_gate_passed, false);
  assert.equal(result.comparison_status, "BLOCKED_INTERVAL_UNDER_24H");
});

test("completes a review-only comparison after 24 hours when rows are unchanged", () => {
  const result = compareFarsideSnapshots(
    manifest({ retrievedAt: "2026-10-17T18:00:00Z", hash: "a" }),
    manifest({ retrievedAt: "2026-10-18T18:00:00Z", hash: "b" })
  );
  assert.equal(result.interval_gate_passed, true);
  assert.equal(result.overlapping_row_count, 1);
  assert.deepEqual(result.unchanged_row_dates, ["2026-10-16"]);
  assert.deepEqual(result.changed_rows, []);
  assert.equal(result.payload_changed, true);
  assert.equal(result.comparison_status, "TWO_SNAPSHOT_COMPARISON_COMPLETE_NO_ROW_REVISIONS_DETECTED");
  assert.match(result.acceptance_boundary, /does not approve ingestion/);
});

test("detects row revisions instead of smoothing them away", () => {
  const result = compareFarsideSnapshots(
    manifest({ retrievedAt: "2026-10-17T18:00:00Z", hash: "a" }),
    manifest({ retrievedAt: "2026-10-18T18:00:00Z", hash: "b", total: -90, ibit: -79.4 })
  );
  assert.equal(result.changed_rows.length, 1);
  assert.equal(result.changed_rows[0].date, "2026-10-16");
  assert.equal(result.comparison_status, "ROW_REVISIONS_DETECTED_REVIEW_REQUIRED");
});

test("rejects reversed timestamps and a noncanonical source URL", () => {
  assert.throws(() => compareFarsideSnapshots(
    manifest({ retrievedAt: "2026-10-18T18:00:00Z", hash: "a" }),
    manifest({ retrievedAt: "2026-10-17T18:00:00Z", hash: "b" })
  ), /chronological order/);
  const changedUrl = manifest({ retrievedAt: "2026-10-18T18:00:00Z", hash: "b" });
  changedUrl.sources[0].url = "https://example.com/";
  assert.throws(() => compareFarsideSnapshots(
    manifest({ retrievedAt: "2026-10-17T18:00:00Z", hash: "a" }),
    changedUrl
  ), /same source URL/);
});
