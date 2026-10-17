export type ResearchBlock = {
  number: number;
  code: string;
  title: string;
  status: string;
  summary?: string | null;
  analysis?: string | null;
};

export const STRUCTURE_1_BLOCKS: Array<{ number: number; code: string; title: string }> = [
  { number: 1, code: "CORE", title: "Essence and current role" },
  { number: 2, code: "TECH", title: "Technology" },
  { number: 3, code: "TOKENOMICS", title: "Tokenomics" },
  { number: 4, code: "NETWORK", title: "Network and on-chain state" },
  { number: 5, code: "ECOSYSTEM", title: "Ecosystem" },
  { number: 6, code: "USERS", title: "Users and activity" },
  { number: 7, code: "INSTITUTIONS", title: "Institutional use and capital" },
  { number: 8, code: "DEVELOPMENT", title: "Development and adoption" },
  { number: 9, code: "MACRO", title: "Macroeconomic context" },
  { number: 10, code: "COMPETITION", title: "Competitors and positioning" },
  { number: 11, code: "RISKS", title: "Risks" },
  { number: 12, code: "CATALYSTS", title: "Catalysts" },
  { number: 13, code: "SCENARIOS", title: "Scenarios" },
  { number: 14, code: "CONCLUSION", title: "Conclusion" },
  { number: 15, code: "MONITORING", title: "Monitoring" },
];

export function structure1Fallback(status = "Not started"): ResearchBlock[] {
  return STRUCTURE_1_BLOCKS.map((b) => ({ ...b, status }));
}
