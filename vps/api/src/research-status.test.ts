import assert from "node:assert/strict";
import test from "node:test";
import { calculateResearchStatus } from "./research-status.js";

test("research progress response matches the canonical API/Web contract", () => {
  const blocks = Array.from({ length: 15 }, (_, index) => ({
    block_number: index + 1,
    status: "complete",
  }));
  const result = calculateResearchStatus(blocks);

  assert.deepEqual(Object.keys(result).sort(), [
    "completed",
    "percentage",
    "resolved",
    "status",
    "total",
  ]);
  assert.equal(result.completed, 15);
  assert.equal(result.resolved, 15);
  assert.equal(result.total, 15);
  assert.equal(result.percentage, 100);
  assert.equal(typeof result.status, "string");
});
