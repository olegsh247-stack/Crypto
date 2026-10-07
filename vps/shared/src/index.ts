export { neon, closePool } from "./db.js";
export type { Sql } from "./db.js";
export {
  RESEARCH_BLOCK_STATUSES,
  RESEARCH_LIFECYCLE_STATUSES,
  RESEARCH_FRESHNESS_STATUSES,
  normalizeResearchBlockStatus,
  isCompletedBlock,
  isResolvedBlock,
  deriveResearchLifecycle,
  lifecycleLabel,
  blockStatusLabel,
  freshnessLabel
} from "./research-status-contract.js";
export type {
  ResearchBlockStatus,
  ResearchLifecycleStatus,
  ResearchFreshnessStatus
} from "./research-status-contract.js";
