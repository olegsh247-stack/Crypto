import type { AssetDetailResponse, BtcScenarioReadiness, MonitoringEvent, MonitoringSignal, ResearchScenario } from "./api";

const freshnessContract: NonNullable<AssetDetailResponse["asset"]["research_freshness"]> = {
  status: "current",
  reason: null,
  last_research_at: "2026-10-30T00:00:00Z",
  last_major_update_at: "2026-10-20T00:00:00Z",
  next_review_at: "2026-11-07T00:00:00Z",
};

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

void detail;
void freshnessContract;

const monitoringSignal: MonitoringSignal = {
  monitoring_signal_id: "signal-1",
  asset_id: "btc",
  critical_factor_id: "factor-1",
  critical_factor_name: "Network security",
  critical_factor_snapshot_id: "BTC-2026-10-07-v1",
  metric_id: "security.hashrate",
  monitoring_event_id: "event-1",
  name: "Network security",
  current_value: { value: 1 },
  previous_value: { value: 0.9 },
  threshold: { value: 0.8 },
  threshold_type: "below",
  direction: "improving",
  thesis_impact: "positive",
  status: "active",
  confidence: 0.8,
  last_updated_at: "2026-10-30T00:00:00Z",
};

const monitoringEvent: MonitoringEvent = {
  event_id: "event-1",
  metric_id: "security.hashrate",
  event_type: "threshold_crossed",
  severity: "info",
  observed_at: "2026-10-30T00:00:00Z",
  details: { description: "Fixture only." },
  status: "open",
  created_at: "2026-10-30T00:00:00Z",
  closed_at: null,
};

void monitoringSignal;
void monitoringEvent;

const metricObservation: AssetDetailResponse["metrics"][number] = {
  metric_id: "market.spot_price", value: 68123.45, unit: "USD/BTC",
  observed_at: "2026-10-30T00:00:00Z", period_start: null,
  source_id: "market.kraken", source_name: "Kraken", source_type: "exchange", source_registered: true,
  source_url: "https://example.invalid/market", status: "NORMAL", freshness: "unknown", freshness_status: "UNCLASSIFIED",
  retrieved_at: "2026-10-30T00:01:00Z", source_updated_at: null, source_row_key: "kraken:trade:123",
  source_payload_sha256: "a".repeat(64), methodology: "Latest valid trade", methodology_version: null,
  created_at: "2026-10-30T00:01:00Z", revision: 1,
};
void metricObservation;

const evidenceRecord: AssetDetailResponse["evidence"][number] = {
  evidence_id: "evidence-1", snapshot_id: "BTC-2026-10-07-v1",
  research_block_id: "block-1", block_number: 8, block_snapshot_status: "match",
  research_domain_id: "domain-market", domain_code: "market", domain_block_status: "match",
  observation_id: "observation-1", metric_id: "market.spot_price",
  observation_value: "68123.45", observation_text: null, observation_unit: "USD/BTC",
  observation_observed_at: "2026-10-30T00:00:00Z", observation_retrieved_at: "2026-10-30T00:01:00Z",
  observation_source_id: "market.kraken", observation_source_name: "Kraken",
  observation_source_type: "exchange", observation_source_url: "https://example.invalid/price",
  source_row_key: "kraken:trade:123", source_payload_sha256: "b".repeat(64),
  methodology: "Latest valid trade", methodology_version: null,
  source_id: "market.kraken", source_name: "Kraken", source_type: "exchange",
  source_url: "https://example.invalid/price", source_link_status: "match",
  evidence_type: "fact", claim: "Fixture evidence", data_summary: "Fixture only",
  signal: "stable", assessment: "Fixture assessment", confidence: 0.8,
  thesis_impact: "neutral", status: "strong", as_of: "2026-10-30T00:00:00Z",
  created_at: "2026-10-30T00:02:00Z",
};
void evidenceRecord;
