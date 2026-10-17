import type { AssetDetailResponse, BtcScenarioReadiness, ResearchScenario } from "./api";
import type { MetricObservation } from "../../shared/api-contract";

// Compile-time contract fixture: the Web build must accept the response fields
// emitted by the API, including BTC readiness and scenario snapshot lineage.
const researchProgress: AssetDetailResponse["research_progress"] = {
  status: "monitoring",
  completed: 14,
  resolved: 15,
  total: 15,
  percentage: 100,
};

const scenarioReadiness: BtcScenarioReadiness = {
  status: "not_evaluable",
  can_persist_scenario_state: false,
  blockers: [{ metric_id: "market.spot_price", reason: "missing" }],
  selected_inputs: {},
  note: "Read-only input readiness.",
};

const scenario: ResearchScenario = {
  research_scenario_id: "scenario-base",
  snapshot_id: "BTC-2026-10-07-v1",
  scenario_type: "base",
  assumptions: "Fixture only; not an evaluated scenario.",
};

const detail: Pick<AssetDetailResponse, "research_progress" | "scenario_readiness" | "research_scenarios"> = {
  research_progress: researchProgress,
  scenario_readiness: scenarioReadiness,
  research_scenarios: [scenario],
};

const metricObservations: MetricObservation[] = [
  { metric_id: "market.spot_price", value: 65000, unit: "USD/BTC", observed_at: "2026-10-17T10:00:00Z", source_id: "market_binance", source_url: "https://example.invalid/fixture", status: "NORMAL", freshness: "CURRENT", revision: 1 },
  { metric_id: "institutional.etf_net_flow", value: null, unit: "USD million/day", observed_at: null, source_id: null, source_url: null, status: null, freshness: "STALE", revision: null },
  { metric_id: "macro.dxy", value: null, unit: "index", observed_at: null, source_id: null, source_url: null, status: null, freshness: "EXPIRED", revision: null },
  { metric_id: "security.hashrate", value: null, unit: "EH/s", observed_at: null, source_id: null, source_url: null, status: null, freshness: "UNCLASSIFIED", revision: null },
];

void detail;
void metricObservations;
