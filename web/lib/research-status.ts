import { STRUCTURE_1_BLOCKS, type ResearchBlock } from "./research-structure";

export type ResearchStatus = "Not started" | "In progress" | "Research complete" | "Monitoring";

export function getResearchStatus(blocks: ResearchBlock[]): ResearchStatus {
  const completed = blocks.filter((b) => ["Complete", "Completed", "Research complete"].includes(b.status)).length;
  const monitoring = blocks.find((b) => b.number === 15);
  if (completed === 0) return "Not started";
  if (completed < STRUCTURE_1_BLOCKS.length) return "In progress";
  if (monitoring && ["Complete", "Completed", "Research complete"].includes(monitoring.status)) return "Monitoring";
  return "Research complete";
}

export function getResearchProgress(blocks: ResearchBlock[]) {
  const completed = blocks.filter((b) => ["Complete", "Completed", "Research complete"].includes(b.status)).length;
  const total = STRUCTURE_1_BLOCKS.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

export function normalizeResearchBlocks(input: any[] | undefined | null): ResearchBlock[] {
  const source = Array.isArray(input) ? input : [];
  return STRUCTURE_1_BLOCKS.map((definition) => {
    const found = source.find((b) => Number(b?.number) === definition.number || b?.code === definition.code);
    return { ...definition, status: String(found?.status ?? "Not started"), summary: found?.summary ?? null, analysis: found?.analysis ?? null };
  });
}
