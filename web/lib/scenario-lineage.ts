export type ScenarioDefinitionRef = { research_scenario_id: string; snapshot_id: string };
export type ScenarioStateRef = { scenario_id?: string | null; snapshot_id?: string | null };

/** Return only a state whose snapshot and scenario definition are both present in the active published set. */
export function selectSnapshotScenarioState<T extends ScenarioStateRef>(
  states: T[],
  definitions: ScenarioDefinitionRef[],
  activeSnapshotId: string | null,
): T | null {
  if (!activeSnapshotId) return null;
  const definitionIds = new Set(
    definitions.filter((definition) => definition.snapshot_id === activeSnapshotId).map((definition) => definition.research_scenario_id),
  );
  return states.find((state) => state.snapshot_id === activeSnapshotId && typeof state.scenario_id === "string" && definitionIds.has(state.scenario_id)) ?? null;
}
