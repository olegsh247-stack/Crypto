export type MarketPair = { id: string; symbol: string; base_asset_id: string; base_asset: string; quote_asset_id: string; quote_asset: string; exchange: string; enabled: boolean; created_at?: string; disabled_at?: string | null };

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
  research_status?: "not_started" | "in_progress" | "complete" | "monitoring" | null;
  research?: { lifecycle?: "not_started" | "in_progress" | "complete" | "monitoring" | null; freshness?: string | null };

  research_freshness?: { status: "current" | "update_recommended" | "outdated"; reason?: string | null } | null;
};

const API_BASE = process.env.CRYPTO_API_URL ?? "http://localhost:8787";
async function api<T>(path:string,init?:RequestInit):Promise<T>{const res=await fetch(`${API_BASE}${path}`,{...init,cache:"no-store",headers:{"Content-Type":"application/json",...(init?.headers??{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error??`Crypto API failed: ${res.status}`);return data as T}
export async function getAssets():Promise<Asset[]>{const data=await api<{assets?:Asset[]}>("/api/assets");return data.assets??[]}
export async function getAsset(assetId:string){return api<any>(`/api/assets/${encodeURIComponent(assetId)}`)}
export async function createAsset(input:{symbol:string;name:string}){return api<any>("/api/admin/assets",{method:"POST",body:JSON.stringify(input)})}
export async function disableAsset(assetId:string){return api<any>(`/api/admin/assets/${encodeURIComponent(assetId)}`,{method:"DELETE"})}
export async function getPairs():Promise<{items:MarketPair[];pairs:MarketPair[];count:number}>{return api("/api/pairs")}
export async function createPair(input:{base:string;quote:string;exchange?:string}){return api<any>("/api/admin/pairs",{method:"POST",body:JSON.stringify({symbol:`${input.base}/${input.quote}`,exchange:input.exchange})})}
export async function disablePair(id:string){return api<any>(`/api/admin/pairs/${encodeURIComponent(id)}`,{method:"DELETE"})}
export async function getPairHistory(symbol:string,days=30,interval="1d"):Promise<PairHistoryResponse>{return api<PairHistoryResponse>(`/api/pairs/${encodeURIComponent(symbol)}/history?days=${days}&interval=${encodeURIComponent(interval)}`)}
export type PairHistoryRow = { candleOpenAt?: string; candleCloseAt?: string; pair?: number; baseUsd?: number; quoteUsd?: number; [key:string]: unknown };
export type PairHistoryResponse = { status: "ok"; source: string; pair: string; interval: string; days: number; rows: PairHistoryRow[]; normalized?: { relative: Array<{value:number}>; base: Array<{value:number}>; quote: Array<{value:number}> }; interpretation?: { relative_strength?: string } };

export async function getCommodities(){return api<any>("/api/commodities")}
export async function createCommodity(input:{symbol:string;name:string;unit?:string}){return api<any>("/api/admin/commodities",{method:"POST",body:JSON.stringify(input)})}
export async function disableCommodity(id:string){return api<any>(`/api/admin/commodities/${encodeURIComponent(id)}` ,{method:"DELETE"})}
