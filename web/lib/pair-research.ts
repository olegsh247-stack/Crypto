export const PAIR_RESEARCH_BLOCKS = [
  { number: 1, code: "RELATIVE_STRENGTH", title: "Relative Strength", question: "Is the base asset gaining or losing strength against the quote asset?" },
  { number: 2, code: "BASE_ASSET", title: "Base Asset Fundamentals", question: "What fundamental forces drive the base asset?" },
  { number: 3, code: "QUOTE_ASSET", title: "Quote Asset Regime", question: "What regime is the quote asset creating for the pair?" },
  { number: 4, code: "PRICE_STRUCTURE", title: "Price Structure", question: "What does the pair's price structure and trend show?" },
  { number: 5, code: "LIQUIDITY", title: "Liquidity & Market Quality", question: "How liquid and reliable is the pair?" },
  { number: 6, code: "VOLUME", title: "Volume & Activity", question: "What does trading activity reveal about conviction?" },
  { number: 7, code: "CORRELATION", title: "Correlation & Divergence", question: "When do the two assets move together or diverge?" },
  { number: 8, code: "ECOSYSTEM", title: "Ecosystem Drivers", question: "Which ecosystem developments can change relative value?" },
  { number: 9, code: "TOKENOMICS", title: "Relative Tokenomics", question: "How do supply, emissions and value capture affect the pair?" },
  { number: 10, code: "MACRO_REGIME", title: "Market & Macro Regime", question: "Which broader market regime is affecting relative performance?" },
  { number: 11, code: "CATALYSTS", title: "Catalysts", question: "What can materially improve relative strength?" },
  { number: 12, code: "RISKS", title: "Risks", question: "What can cause sustained relative underperformance?" },
  { number: 13, code: "SCENARIOS", title: "Relative Scenarios", question: "What are the plausible future paths for the pair?" },
  { number: 14, code: "CONCLUSION", title: "Conclusion", question: "What is the current analytical conclusion?" },
  { number: 15, code: "MONITORING", title: "Monitoring", question: "Which signals should continuously update the conclusion?" },
] as const;

export function pairResearchProgress(blocks: Array<{ number?: number; status?: string | null }>) {
  const complete = new Set(["COMPLETE", "COMPLETED", "RESEARCH COMPLETE", "DONE", "PUBLISHED"]);
  const completed = blocks.filter(b => complete.has(String(b.status ?? "").toUpperCase())).length;
  return { completed, total: PAIR_RESEARCH_BLOCKS.length, percent: Math.round((completed / PAIR_RESEARCH_BLOCKS.length) * 100) };
}
