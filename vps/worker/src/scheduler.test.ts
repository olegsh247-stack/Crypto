import assert from "node:assert/strict";
import test from "node:test";
import { londonDayBoundary } from "./scheduler.js";

const cases: Array<{ name: string; input: string; expected: string }> = [
  { name: "winter GMT date", input: "2026-01-15T12:00:00.000Z", expected: "2026-01-15T00:00:00.000Z" },
  { name: "summer BST date", input: "2026-07-15T12:00:00.000Z", expected: "2026-07-14T23:00:00.000Z" },
  { name: "spring DST transition day starts at GMT midnight", input: "2026-03-29T12:00:00.000Z", expected: "2026-03-29T00:00:00.000Z" },
  { name: "day after spring DST transition uses BST", input: "2026-03-30T12:00:00.000Z", expected: "2026-03-29T23:00:00.000Z" },
  { name: "autumn DST transition day starts at BST midnight", input: "2026-10-25T12:00:00.000Z", expected: "2026-10-24T23:00:00.000Z" },
  { name: "day after autumn DST transition uses GMT", input: "2026-10-26T12:00:00.000Z", expected: "2026-10-26T00:00:00.000Z" },
];

for (const item of cases) {
  test(item.name, () => {
    assert.equal(londonDayBoundary(new Date(item.input)).toISOString(), item.expected);
  });
}
