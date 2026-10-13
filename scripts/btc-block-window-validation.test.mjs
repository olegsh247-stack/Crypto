import test from "node:test";
import assert from "node:assert/strict";
import { expectedSubsidySats, validateBlockPage, tipAnchorMatches, deriveUtcDayCandidate } from "./btc-block-window-validation.mjs";

test("subsidy follows height-based halving schedule", () => {
  assert.equal(expectedSubsidySats(839999), 625000000);
  assert.equal(expectedSubsidySats(840000), 312500000);
  assert.equal(expectedSubsidySats(1050000), 156250000);
  assert.equal(expectedSubsidySats(0), 5000000000);
});
test("subsidy rejects invalid heights", () => {
  assert.throws(() => expectedSubsidySats(-1), /non-negative/);
  assert.throws(() => expectedSubsidySats(1.5), /non-negative/);
});
test("validates a complete descending page", () => {
  const rows = Array.from({ length: 15 }, (_, i) => ({ height: 100 - i }));
  assert.deepEqual(validateBlockPage(rows, 100), rows.map(row => row.height));
});
test("rejects short pages, duplicates, gaps, and unexpected heights", () => {
  assert.throws(() => validateBlockPage([{ height: 100 }], 100), /Expected 15/);
  const duplicate = Array.from({ length: 15 }, (_, i) => ({ height: 100 - i }));
  duplicate[14] = { height: 100 };
  assert.throws(() => validateBlockPage(duplicate, 100), /duplicate/);
  const gap = Array.from({ length: 15 }, (_, i) => ({ height: 100 - i }));
  gap[14] = { height: 84 };
  assert.throws(() => validateBlockPage(gap, 100), /missing or unexpected/);
});
test("tip anchor requires unchanged height and valid hash", () => {
  const hash = "a".repeat(64);
  assert.equal(tipAnchorMatches({ height: 100, hash }, { height: 100, hash }), true);
  assert.equal(tipAnchorMatches({ height: 100, hash }, { height: 101, hash }), false);
  assert.equal(tipAnchorMatches({ height: 100, hash }, { height: 100, hash: "b".repeat(64) }), false);
  assert.equal(tipAnchorMatches({ height: 100, hash: "bad" }, { height: 100, hash: "bad" }), false);
});


test("derives a completed UTC-day fee/subsidy candidate with boundary buffers", () => {
  const dayStart = 1_800_000_000 - (1_800_000_000 % 86400);
  const blocks = [
    { height: 100, timestamp: dayStart - 6 * 3600, total_fees_sats_candidate: 1, subsidy_sats_candidate: 312500000 },
    { height: 101, timestamp: dayStart + 1, total_fees_sats_candidate: 10, subsidy_sats_candidate: 312500000 },
    { height: 102, timestamp: dayStart + 86400 - 1, total_fees_sats_candidate: 20, subsidy_sats_candidate: 312500000 },
    { height: 103, timestamp: dayStart + 86400 + 6 * 3600, total_fees_sats_candidate: 1, subsidy_sats_candidate: 312500000 }
  ];
  const result = deriveUtcDayCandidate(blocks, dayStart);
  assert.equal(result.block_count, 2);
  assert.equal(result.first_height, 101);
  assert.equal(result.last_height, 102);
  assert.equal(result.total_fees_sats_candidate, 30);
  assert.equal(result.total_subsidy_sats_candidate, 625000000);
  assert.equal(result.value_candidate, 30 / 625000000);
  assert.equal(result.production_approved, false);
});

test("blocks a UTC-day candidate without complete boundary coverage", () => {
  const dayStart = 1_800_000_000 - (1_800_000_000 % 86400);
  const blocks = [
    { height: 100, timestamp: dayStart, total_fees_sats_candidate: 1, subsidy_sats_candidate: 312500000 },
    { height: 101, timestamp: dayStart + 3600, total_fees_sats_candidate: 1, subsidy_sats_candidate: 312500000 }
  ];
  assert.throws(() => deriveUtcDayCandidate(blocks, dayStart), /boundary buffer/);
});
