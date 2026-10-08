import type { AdminMutationResponse, MarketPair, PairHistoryResponse, PairTickerResponse, PairsResponse } from "../../shared/api-contract";
export type { MarketPair } from "../../shared/api-contract";

export type Asset = {
  asset_id: string; symbol: string; name: string; category?: string | null; research_tier?: string | null; enabled?: boolean; binance_symbol?: string | null; research_reason?: string | null;
  asset_type?: { code: string; name: string } | null;
  research_status?: "not_started" | "in_progress" | "complete" | "monitoring" | null;
  research?: { lifecycle?: "not_started" | "in_progress" | "complete" | "monitoring" | null; freshness?: string | null };
  research_freshness?: { status: "current" | "update_recommended" | "outdated"; reason?: string | null } | null;
};

export type ResearchBlock = {
  research_block_id: string; block_number: number; title: string;
  status: "complete" | "partial" | "n_a" | "not_started"; summary?: string | null; analysis?: string | null; confidence?: number | null;
  domains?: Array<{ code: string; name: string; relevance_weight?: number | null; display_order?: number | null }>;
};

export type CriticalFactor = {
  critical_factor_id: string; name: string; description?: string | null; importance_weight?: number | null; current_state?: string | null;
  trend?: "improving" | "stable" | "deteriorating" | "mixed" | "unknown" | null; confidence?: number | null;
  thesis_impact?: "positive" | "neutral" | "negative" | "mixed" | null; monitoring_priority?: number | null; snapshot_id?: string | null;
};

export type MonitoringSignal = {
  monitoring_signal_id: string; critical_factor_id?: string | null; metric_id?: string | null; name: string; current_value?: unknown; previous_value?: unknown;
  direction?: "improving" | "stable" | "deteriorating" | "mixed" | "unknown" | null; thesis_impact?: "positive" | "neutral" | "negative" | "mixed" | null;
  status: "active" | "watch" | "triggered" | "disabled"; confidence?: number | null; last_updated_at: string;
};

export type ResearchScenario = {
  research_scenario_id: string; scenario_type: "bull" | "base" | "bear"; probability?: number | null; assumptions: string;
  supporting_evidence?: string | null; invalidation_conditions?: string | null; thesis_impact?: "positive" | "neutral" | "negative" | "mixed" | null; confidence?: number | null;
};

export type ResearchScore = {
  score_id: string; score_type: string; value?: number | null; scale_min?: number | null; scale_max?: number | null; methodology_version: string;
  confidence?: number | null; explanation: string; calculated_at: string; snapshot_id: string;
};

export type ResearchSnapshot = { snapshot_id: string; research_version: string; methodology_version: string; research_date: string; title: string; content: Record<string, unknown>; status: "PUBLISHED" };

export type AssetDetailResponse = {
  api_version: string; engine: "DynamicAssetEngine"; asset: Asset & { secondary_asset_type_id?: string | null; asset_type_code?: string | null; asset_type_name?: string | null; asset_type_description?: string | null; research_status_source?: "server_engine"; research_freshness?: { status: "current" | "update_recommended" | "outdated"; reason?: string | null } | null };
  research_progress: { status: string; completed: number; total: number; percent: number }; metrics: Array<Record<string, unknown>>; history: Array<Record<string, unknown>>;
  research_snapshot: ResearchSnapshot | null; research_blocks: ResearchBlock[];
  research_domains: Array<{ research_domain_id: string; code: string; name: string; description?: string | null; display_order: number }>;
  critical_factors: CriticalFactor[]; scores: ResearchScore[]; research_scenarios: ResearchScenario[]; scenario_states: Array<Record<string, unknown>>;
  monitoring_signals: MonitoringSignal[]; monitoring_events: Array<Record<string, unknown>>;
  sources: Array<{ source_id: string; name: string; source_type: string; base_url?: string | null; trust_level?: string | null }>;
  evidence: Array<{ evidence_id: string; research_block_id?: string | null; research_domain_id?: string | null; observation_id?: string | null; source_id?: string | null; evidence_type: "fact" | "calculation" | "assessment" | "hypothesis"; claim: string; data_summary?: string | null; signal: "improving" | "stable" | "deteriorating" | "mixed" | "unknown"; assessment?: string | null; confidence?: number | null; thesis_impact: "positive" | "neutral" | "negative" | "mixed"; status: "strong" | "watch" | "weak" | "unknown"; as_of?: string | null; metric_id?: string | null; observation_value?: number | null; observation_text?: string | null; observation_unit?: string | null; source_name?: string | null; source_type?: string | null; source_url?: string | null }>;
};

const API_BASE = process.env.CRYPTO_API_URL ?? "http://localhost:8787";
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Crypto API failed: " + res.status);
  return data as T;
}
export async function getAssets(): Promise<Asset[]> { const data = await api<{ assets?: Asset[] }>("/api/assets"); return data.assets ?? []; }
export async function getAsset(assetId: string): Promise<AssetDetailResponse> { return api<AssetDetailResponse>("/api/assets/" + encodeURIComponent(assetId)); }
export async function createAsset(input: { symbol: string; name: string }): Promise<AdminMutationResponse<Asset>> { return api<AdminMutationResponse<Asset>>("/api/admin/assets", { method: "POST", body: JSON.stringify(input) }); }
export async function disableAsset(assetId: string): Promise<AdminMutationResponse<Asset>> { return api<AdminMutationResponse<Asset>>("/api/admin/assets/" + encodeURIComponent(assetId), { method: "DELETE" }); }
export async function getPairs(): Promise<PairsResponse> { return api<PairsResponse>("/api/pairs"); }
export async function createPair(input: { base: string; quote: string; exchange?: string }): Promise<AdminMutationResponse<MarketPair>> { return api<AdminMutationResponse<MarketPair>>("/api/admin/pairs", { method: "POST", body: JSON.stringify({ symbol: input.base + "/" + input.quote, exchange: input.exchange }) }); }
export async function disablePair(id: string): Promise<AdminMutationResponse<MarketPair>> { return api<AdminMutationResponse<MarketPair>>("/api/admin/pairs/" + encodeURIComponent(id), { method: "DELETE" }); }
export async function getPairHistory(symbol: string, days = 30, interval = "1d"): Promise<PairHistoryResponse> { return api<PairHistoryResponse>("/api/pairs/" + encodeURIComponent(symbol) + "/history?days=" + days + "&interval=" + encodeURIComponent(interval)); }
export async function getPairTicker(symbol: string): Promise<PairTickerResponse> { return api<PairTickerResponse>("/api/pairs/" + encodeURIComponent(symbol) + "/ticker"); }
export async function getCommodities() { return api<any>("/api/commodities"); }
export async function createCommodity(input: { symbol: string; name: string; unit?: string }) { return api<any>("/api/admin/commodities", { method: "POST", body: JSON.stringify(input) }); }
export async function disableCommodity(id: string) { return api<any>("/api/admin/commodities/" + encodeURIComponent(id), { method: "DELETE" }); }

export type AssetTab = "assets" | "pair" | "commodities";
