export const RESEARCH_BLOCK_STATUSES = ["not_started", "partial", "complete", "n_a"] as const;
export type ResearchBlockStatus = (typeof RESEARCH_BLOCK_STATUSES)[number];

export const RESEARCH_LIFECYCLE_STATUSES = ["not_started", "in_progress", "complete", "monitoring"] as const;
export type ResearchLifecycleStatus = (typeof RESEARCH_LIFECYCLE_STATUSES)[number];

export const RESEARCH_FRESHNESS_STATUSES = ["current", "update_recommended", "outdated"] as const;
export type ResearchFreshnessStatus = (typeof RESEARCH_FRESHNESS_STATUSES)[number];

const BLOCK_ALIASES: Record<string, ResearchBlockStatus> = {
  not_started: "not_started",
  "not started": "not_started",
  partial: "partial",
  complete: "complete",
  completed: "complete",
  published: "complete",
  done: "complete",
  "research complete": "complete",
  n_a: "n_a",
  "n/a": "n_a",
};

export function normalizeResearchBlockStatus(value: unknown): ResearchBlockStatus {
  const key = String(value ?? "").trim().toLowerCase();
  return BLOCK_ALIASES[key] ?? "not_started";
}

export function isCompletedBlock(value: unknown): boolean {
  return normalizeResearchBlockStatus(value) === "complete";
}

export function deriveResearchLifecycle(completed: number, total = 15, monitoringComplete = false): ResearchLifecycleStatus {
  if (completed === 0) return "not_started";
  if (completed < total) return "in_progress";
  return monitoringComplete ? "monitoring" : "complete";
}

export function lifecycleLabel(status: ResearchLifecycleStatus): string {
  return { not_started: "Not started", in_progress: "In progress", complete: "Research complete", monitoring: "Monitoring" }[status];
}
