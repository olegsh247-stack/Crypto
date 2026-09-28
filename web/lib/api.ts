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

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE}/api/assets`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Asset API failed: ${res.status}`);
  const data = await res.json();
  return data.assets ?? [];
}

export async function getAsset(assetId: string) {
  const res = await fetch(`${API_BASE}/api/assets/${encodeURIComponent(assetId)}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Asset API failed: ${res.status}`);
  return res.json();
}
