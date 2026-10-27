#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../data/CryptoDataModel/calendars/us-etf-equity-session-calendar-2026-2028.json", import.meta.url);
const calendar = JSON.parse(await readFile(path, "utf8"));

assert.equal(calendar.calendar_id, "us-etf-equity-session-calendar");
assert.match(calendar.calendar_version, /^\d+\.\d+\.\d+$/);
assert.deepEqual(calendar.coverage_years, [2026, 2027, 2028]);
assert.equal(calendar.timezone, "America/New_York");
assert.ok(Array.isArray(calendar.sources) && calendar.sources.length >= 2);
for (const source of calendar.sources) {
  assert.match(source.url, /^https:\/\//);
  assert.ok(source.name && source.scope);
}

function validateDates(rows, label) {
  assert.ok(Array.isArray(rows), label + " must be an array");
  const seen = new Set();
  for (const row of rows) {
    assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
    const date = new Date(row.date + "T12:00:00Z");
    assert.equal(date.toISOString().slice(0, 10), row.date, label + " contains an invalid date");
    assert.ok(calendar.coverage_years.includes(date.getUTCFullYear()), label + " date is outside calendar coverage");
    assert.ok(!seen.has(row.date), label + " contains duplicate dates");
    seen.add(row.date);
    assert.notEqual(date.getUTCDay(), 0, label + " must not list Sundays");
    assert.notEqual(date.getUTCDay(), 6, label + " must not list Saturdays");
  }
  return seen;
}

const fullClosures = validateDates(calendar.full_closures, "full_closures");
const earlyCloses = validateDates(calendar.early_closes, "early_closes");
for (const date of earlyCloses) {
  assert.ok(!fullClosures.has(date), "a date cannot be both a full closure and early close");
  const row = calendar.early_closes.find(x => x.date === date);
  assert.match(row.local_close_time, /^\d{2}:\d{2}$/);
  assert.equal(row.timezone, calendar.timezone);
}

// Explicitly protect the distinction: an early close is still a session day.
assert.equal(calendar.calendar_rules.early_close_counts_as_session, true);
assert.equal(calendar.calendar_rules.full_closure_counts_as_session, false);
assert.match(calendar.calendar_rules.publication_window_policy, /Do not infer Farside publication timing/);
assert.equal(calendar.calendar_rules.source_payload_hashes.status, "CAPTURED_READ_ONLY_CI");
assert.match(calendar.calendar_rules.source_payload_hashes.algorithm, /SHA-256/);
assert.ok(calendar.calendar_rules.source_payload_hashes.sources.length >= 3);
for (const source of calendar.calendar_rules.source_payload_hashes.sources) {
  assert.equal(source.http_status, 200);
  assert.match(source.sha256, /^[a-f0-9]{64}$/);
  assert.ok(source.body_bytes > 0);
}
assert.equal(calendar.calendar_rules.source_payload_hashes.farside_capture.http_status, 403);
assert.equal(calendar.calendar_rules.source_payload_hashes.farside_capture.status, "NOT_A_SOURCE_PAYLOAD");

console.log(
  `US ETF session calendar ${calendar.calendar_version}: ${fullClosures.size} full closures, ${earlyCloses.size} early closes; research baseline validated (not wired into readiness).`
);
