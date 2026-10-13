import test from "node:test";
import assert from "node:assert/strict";
import { expectedSubsidySats, validateBlockPage, tipAnchorMatches } from "./btc-block-window-validation.mjs";

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
