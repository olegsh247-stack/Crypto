export type Asset = {
  asset_id: string;
  symbol: string;
  name: string;
  category?: string | null;
  research_tier?: string | null;
  enabled?: boolean;
  binance_symbol?: string | null;
  research_reason?: string | null;
  asset_type?: { code: string; name: string } | null;
  research_status?: string | null;
};

const API_BASE = process.env.CRYPTO_API_URL ?? "http://localhost:8787";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Crypto API failed: ${res.status}`);
  return data as T;
}

export async function getAssets(): Promise<Asset[]> {
  const data = await api<{ assets?: Asset[] }>("/api/assets");
  return data.assets ?? [];
}

export async function getAsset(assetId: string) {
  return api<any>(`/api/assets/${encodeURIComponent(assetId)}`);
}

export async function createAsset(input: { symbol: string; name: string }) {
  return api<any>("/api/assets", { method: "POST", body: JSON.stringify(input) });
}

export async function disableAsset(assetId: string) {
  return api<any>(`/api/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
}

export async function getPairs() { return api<any>("/api/pairs"); }
export async function createPair(input: { base: string; quote: string; exchange?: string }) { return api<any>("/api/pairs", { method: "POST", body: JSON.stringify(input) }); }
export async function disablePair(id: string) { return api<any>(`/api/pairs/${encodeURIComponent(id)}`, { method: "DELETE" }); }

export async function getCommodities() { return api<any>("/api/commodities"); }
export async function createCommodity(input: { symbol: string; name: string; unit?: string }) { return api<any>("/api/commodities", { method: "POST", body: JSON.stringify(input) }); }
export async function disableCommodity(id: string) { return api<any>(`/api/commodities/${encodeURIComponent(id)}`, { method: "DELETE" }); }
