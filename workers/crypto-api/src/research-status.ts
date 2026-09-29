export type ResearchStatus = "Not started" | "In progress" | "Research complete" | "Monitoring";

const COMPLETE = new Set(["COMPLETED", "PUBLISHED", "DONE", "COMPLETE", "RESEARCH COMPLETE"]);

export function calculateResearchStatus(blocks: Array<{ block_number?: number; status?: string | null }>): { status: ResearchStatus; completed: number; total: number; percentage: number } {
  const total = 15;
  const completed = blocks.filter((block) => COMPLETE.has(String(block.status ?? "").trim().toUpperCase())).length;
  const monitoringComplete = blocks.some((block) => Number(block.block_number) === 15 && COMPLETE.has(String(block.status ?? "").trim().toUpperCase()));
  const status: ResearchStatus = completed === 0 ? "Not started" : completed < total ? "In progress" : monitoringComplete ? "Monitoring" : "Research complete";
  return { status, completed, total, percentage: Math.round((completed / total) * 100) };
}
