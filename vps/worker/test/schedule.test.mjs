import assert from "node:assert/strict";
import test from "node:test";
import { nextLondonDayBoundary, millisecondsUntilNextLondonDayBoundary } from "../dist/schedule.js";

function londonClock(instant) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

test("next run is exactly London midnight during GMT", () => {
  const now = new Date("2026-01-15T12:34:56.000Z");
  const next = nextLondonDayBoundary(now);
  assert.equal(next.toISOString(), "2026-01-16T00:00:00.000Z");
  assert.equal(londonClock(next), "16/01/2026, 00:00:00");
  assert.equal(millisecondsUntilNextLondonDayBoundary(now), next.getTime() - now.getTime());
});

test("next run is exactly London midnight during BST", () => {
  const now = new Date("2026-07-15T12:34:56.000Z");
  const next = nextLondonDayBoundary(now);
  assert.equal(next.toISOString(), "2026-07-15T23:00:00.000Z");
  assert.equal(londonClock(next), "16/07/2026, 00:00:00");
});

test("spring DST transition produces a 23-hour London day", () => {
  const before = nextLondonDayBoundary(new Date("2026-03-28T12:00:00.000Z"));
  const after = nextLondonDayBoundary(new Date("2026-03-29T12:00:00.000Z"));
  assert.equal(before.toISOString(), "2026-03-29T00:00:00.000Z");
  assert.equal(after.toISOString(), "2026-03-29T23:00:00.000Z");
  assert.equal(after.getTime() - before.getTime(), 23 * 60 * 60 * 1000);
});

test("autumn DST transition produces a 25-hour London day", () => {
  const before = nextLondonDayBoundary(new Date("2026-10-24T12:00:00.000Z"));
  const after = nextLondonDayBoundary(new Date("2026-10-25T12:00:00.000Z"));
  assert.equal(before.toISOString(), "2026-10-24T23:00:00.000Z");
  assert.equal(after.toISOString(), "2026-10-25T00:00:00.000Z");
  assert.equal(after.getTime() - before.getTime(), 25 * 60 * 60 * 1000);
});

test("a boundary is strictly in the future, including at midnight", () => {
  const now = new Date("2026-10-25T23:00:00.000Z");
  assert.equal(nextLondonDayBoundary(now).toISOString(), "2026-10-26T00:00:00.000Z");
});
