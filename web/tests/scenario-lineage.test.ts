import test from "node:test";
import assert from "node:assert/strict";
import { selectSnapshotScenarioState } from "../lib/scenario-lineage.ts";

const active = "snapshot-current";
const definitions = [
  { research_scenario_id: "scenario-base", snapshot_id: active },
  { research_scenario_id: "scenario-bull-old", snapshot_id: "snapshot-old" },
];

test("selects a state only when both snapshot and scenario definition match", () => {
  const valid = { scenario_state_id: "state-1", scenario_id: "scenario-base", snapshot_id: active };
  assert.equal(selectSnapshotScenarioState([valid], definitions, active), valid);
});

test("rejects a state from another snapshot", () => {
  const stale = { scenario_id: "scenario-base", snapshot_id: "snapshot-old" };
  assert.equal(selectSnapshotScenarioState([stale], definitions, active), null);
});

test("rejects an orphan scenario id even when its snapshot matches", () => {
  const orphan = { scenario_id: "missing-definition", snapshot_id: active };
  assert.equal(selectSnapshotScenarioState([orphan], definitions, active), null);
});

test("rejects definitions from another snapshot and missing active snapshot", () => {
  const oldDefinitionState = { scenario_id: "scenario-bull-old", snapshot_id: active };
  assert.equal(selectSnapshotScenarioState([oldDefinitionState], definitions, active), null);
  assert.equal(selectSnapshotScenarioState([oldDefinitionState], definitions, null), null);
});
