import assert from "node:assert/strict";
import test from "node:test";
import { isClosedUtcDailyCandle, utcDayBoundary } from "./scheduler.js";

const boundaryCases: Array<{ name: string; input: string; expected: string }> = [
  { name: "winter date uses UTC midnight", input: "2026-01-15T12:00:00.000Z", expected: "2026-01-15T00:00:00.000Z" },
  { name: "summer date also uses UTC midnight", input: "2026-07-15T12:00:00.000Z", expected: "2026-07-15T00:00:00.000Z" },
  { name: "spring DST transition does not shift UTC candle boundary", input: "2026-03-29T12:00:00.000Z", expected: "2026-03-29T00:00:00.000Z" },
  { name: "day after spring DST transition uses UTC midnight", input: "2026-03-30T12:00:00.000Z", expected: "2026-03-30T00:00:00.000Z" },
  { name: "autumn DST transition does not shift UTC candle boundary", input: "2026-10-25T12:00:00.000Z", expected: "2026-10-25T00:00:00.000Z" },
  { name: "day after autumn DST transition uses UTC midnight", input: "2026-10-26T12:00:00.000Z", expected: "2026-10-26T00:00:00.000Z" },
];

for (const item of boundaryCases) {
  test(item.name, () => {
    assert.equal(utcDayBoundary(new Date(item.input)).toISOString(), item.expected);
  });
}

test("current UTC daily candle remains open until 24 hours have elapsed", () => {
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-27T00:30:00.000Z")), false);
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-27T23:59:59.999Z")), false);
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-28T00:00:00.000Z")), true);
});

test("previous UTC daily candle is finalized after its close", () => {
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-26T00:00:00.000Z"), new Date("2026-10-27T00:30:00.000Z")), true);
});
