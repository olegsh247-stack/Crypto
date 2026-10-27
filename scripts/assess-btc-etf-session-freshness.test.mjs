import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { latestCompletedUsEtfSession, assessEtfSessionFreshness } from "./assess-btc-etf-session-freshness.mjs";

const calendar = JSON.parse(await readFile(new URL("../data/CryptoDataModel/calendars/us-etf-equity-session-calendar-2026-2028.json", import.meta.url), "utf8"));

test("uses New York session close, not UTC midnight, to determine the latest completed session", () => {
  assert.equal(latestCompletedUsEtfSession("2026-10-27T19:59:00Z", calendar).session_date, "2026-10-26");
  assert.equal(latestCompletedUsEtfSession("2026-10-27T20:00:00Z", calendar).session_date, "2026-10-27");
});

test("weekends and full exchange closures are not treated as sessions", () => {
  assert.equal(latestCompletedUsEtfSession("2026-10-26T21:00:00Z", calendar).session_date, "2026-10-26");
  assert.equal(latestCompletedUsEtfSession("2026-11-27T19:00:00Z", calendar).session_date, "2026-11-27");
  assert.equal(latestCompletedUsEtfSession("2026-11-26T22:00:00Z", calendar).session_date, "2026-11-25");
});

test("early close counts as a completed session at 13:00 New York time", () => {
  assert.equal(latestCompletedUsEtfSession("2026-11-27T18:00:00Z", calendar).session_date, "2026-11-27");
});

test("fails closed while Farside publication-window policy is undefined", () => {
  const result = assessEtfSessionFreshness({
    now: "2026-10-27T20:00:00Z", calendar, rows: [], publicationPolicy: null
  });
  assert.equal(result.status, "BLOCKED_PROVIDER_PUBLICATION_WINDOW_UNDEFINED");
  assert.equal(result.expected_session_date, "2026-10-27");
  assert.equal(result.observed_at, null);
});

test("does not accept an incomplete latest-session row", () => {
  const result = assessEtfSessionFreshness({
    now: "2026-10-27T20:00:00Z", calendar,
    rows: [{ period_start: "2026-10-27", status: "REPORTED_CANDIDATE", fund_values_complete: false, reconciliation_status: "INCOMPLETE" }],
    publicationPolicy: { status: "reviewed", max_session_lag: 0 }
  });
  assert.equal(result.status, "BLOCKED_LATEST_EXPECTED_SESSION_MISSING_OR_INCOMPLETE");
  assert.equal(result.accepted_row_date, null);
});

test("accepts only a complete reconciled row for the latest completed session under an explicit reviewed policy", () => {
  const result = assessEtfSessionFreshness({
    now: "2026-10-27T20:00:00Z", calendar,
    rows: [{ period_start: "2026-10-27", status: "REPORTED_CANDIDATE", fund_values_complete: true, reconciliation_status: "MATCHES_DISPLAY_ROUNDING" }],
    publicationPolicy: { status: "reviewed", max_session_lag: 0 }
  });
  assert.equal(result.status, "SESSION_FRESHNESS_REVIEW_PASS");
  assert.equal(result.accepted_row_date, "2026-10-27");
  assert.equal(result.observed_at, null);
});
