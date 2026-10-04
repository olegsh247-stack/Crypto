import { STRUCTURE_1_BLOCKS, type ResearchBlock } from "./research-structure";
import { deriveResearchLifecycle, isCompletedBlock, lifecycleLabel, normalizeResearchBlockStatus, type ResearchLifecycleStatus, type ResearchFreshnessStatus } from "../../shared/research-status-contract";

export type ResearchStatus = ResearchLifecycleStatus;

export function getResearchStatus(blocks: ResearchBlock[]): ResearchStatus {
  const completed = blocks.filter((b) => isCompletedBlock(b.status)).length;
  const monitoring = blocks.find((b) => b.number === 15);
  return deriveResearchLifecycle(completed, STRUCTURE_1_BLOCKS.length, !!monitoring && isCompletedBlock(monitoring.status));
}

export function getResearchStatusLabel(status: ResearchStatus): string {
  return lifecycleLabel(status);
}

export function getResearchProgress(blocks: ResearchBlock[]) {
  const completed = blocks.filter((b) => isCompletedBlock(b.status)).length;
  const total = STRUCTURE_1_BLOCKS.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

export function normalizeResearchBlocks(input: any[] | undefined | null): ResearchBlock[] {
  const source = Array.isArray(input) ? input : [];
  return STRUCTURE_1_BLOCKS.map((definition) => {
    const found = source.find((b) => Number(b?.block_number) === definition.number || b?.code === definition.code || Number(b?.number) === definition.number);
    return { ...definition, status: normalizeResearchBlockStatus(found?.status), summary: found?.summary ?? null, analysis: found?.analysis ?? null };
  });
}

export function normalizeResearchFreshness(value: unknown): ResearchFreshnessStatus | null {
  return value === "current" || value === "update_recommended" || value === "outdated" ? value : null;
}
