import { deriveResearchLifecycle, isCompletedBlock, isResolvedBlock, type ResearchLifecycleStatus } from "../../../shared/research-status-contract";

export type ResearchStatus = ResearchLifecycleStatus;

export function calculateResearchStatus(blocks: Array<{ block_number?: number; status?: string | null }>): { status: ResearchStatus; completed: number; resolved: number; total: number; percentage: number } {
  const total = 15;
  const canonicalBlocks = blocks.filter((block) => Number(block.block_number) >= 1 && Number(block.block_number) <= total);
  const completed = canonicalBlocks.filter((block) => isCompletedBlock(block.status)).length;
  const resolved = new Set(canonicalBlocks.filter((block) => isResolvedBlock(block.status)).map((block) => Number(block.block_number))).size;
  const monitoringComplete = canonicalBlocks.some((block) => Number(block.block_number) === 15 && isCompletedBlock(block.status));
  const status = deriveResearchLifecycle(resolved, total, monitoringComplete);
  return { status, completed, resolved, total, percentage: Math.round((resolved / total) * 100) };
}
