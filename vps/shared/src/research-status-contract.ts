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
  "n/a": "n_a"
};

export function normalizeResearchBlockStatus(value: unknown): ResearchBlockStatus {
  return BLOCK_ALIASES[String(value ?? "").trim().toLowerCase()] ?? "not_started";
}

export function isCompletedBlock(value: unknown): boolean {
  return normalizeResearchBlockStatus(value) === "complete";
}

export function isResolvedBlock(value: unknown): boolean {
  const status = normalizeResearchBlockStatus(value);
  return status === "complete" || status === "n_a";
}

export function deriveResearchLifecycle(resolved: number, total = 15, monitoringComplete = false): ResearchLifecycleStatus {
  if (resolved === 0) return "not_started";
  if (resolved < total) return "in_progress";
  return monitoringComplete ? "monitoring" : "complete";
}

export function lifecycleLabel(status: ResearchLifecycleStatus): string {
  return { not_started: "Not started", in_progress: "In progress", complete: "Research complete", monitoring: "Monitoring" }[status];
}

export function blockStatusLabel(status: unknown): string {
  return { not_started: "Not started", partial: "Partial", complete: "Complete", n_a: "N/A" }[normalizeResearchBlockStatus(status)];
}

export function freshnessLabel(status: ResearchFreshnessStatus): string {
  return { current: "Current", update_recommended: "Update recommended", outdated: "Outdated" }[status];
}
