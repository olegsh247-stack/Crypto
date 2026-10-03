import { deriveResearchLifecycle, isCompletedBlock, type ResearchLifecycleStatus } from "../../../shared/research-status-contract";

export type ResearchStatus = ResearchLifecycleStatus;

export function calculateResearchStatus(blocks: Array<{ block_number?: number; status?: string | null }>): { status: ResearchStatus; completed: number; total: number; percentage: number } {
  const total = 15;
  const completed = blocks.filter((block) => isCompletedBlock(block.status)).length;
  const monitoringComplete = blocks.some((block) => Number(block.block_number) === 15 && isCompletedBlock(block.status));
  const status = deriveResearchLifecycle(completed, total, monitoringComplete);
  return { status, completed, total, percentage: Math.round((completed / total) * 100) };
}
