import { STRUCTURE_1_BLOCKS, type ResearchBlock } from "./research-structure";
import { blockStatusLabel, freshnessLabel, isCompletedBlock, isResolvedBlock, lifecycleLabel, normalizeResearchBlockStatus, type ResearchLifecycleStatus, type ResearchFreshnessStatus } from "../../shared/research-status-contract";

export type ResearchStatus = ResearchLifecycleStatus;

export function getResearchStatusLabel(status: ResearchStatus): string { return lifecycleLabel(status); }
export function getResearchBlockStatusLabel(status: unknown): string { return blockStatusLabel(status); }
export function getResearchFreshnessLabel(status: ResearchFreshnessStatus): string { return freshnessLabel(status); }

export function getResearchProgress(blocks: ResearchBlock[]) {
  const completed = blocks.filter((b) => isCompletedBlock(b.status)).length;
  const resolved = blocks.filter((b) => isResolvedBlock(b.status)).length;
  const total = STRUCTURE_1_BLOCKS.length;
  return { completed, resolved, total, percent: Math.round((resolved / total) * 100) };
}

export function normalizeResearchBlocks(input: any[] | undefined | null): ResearchBlock[] {
  const source = Array.isArray(input) ? input : [];
  return STRUCTURE_1_BLOCKS.map((definition) => {
    const found = source.find((b) => Number(b?.block_number) === definition.number || b?.code === definition.code || Number(b?.number) === definition.number);
    return { ...definition, status: normalizeResearchBlockStatus(found?.status), summary: found?.summary ?? null, analysis: found?.analysis ?? null, confidence: found?.confidence ?? null, domains: Array.isArray(found?.domains) ? found.domains : [] };
  });
}

export function normalizeResearchFreshness(value: unknown): ResearchFreshnessStatus | null {
  return value === "current" || value === "update_recommended" || value === "outdated" ? value : null;
}
