export type AdminMutationResponse<T> = { status: "ok"; item: T };
export type ApiErrorResponse = { status: "error"; error: string };
export type MarketPair = { id: string; symbol: string; base_asset_id: string; base_asset: string; quote_asset_id: string; quote_asset: string; exchange: string; enabled: boolean; created_at?: string; disabled_at?: string | null };
export type PairsResponse = { items: MarketPair[]; pairs: MarketPair[]; count: number };
export type PairHistoryRow = { time: string; pair: number; baseUsd: number; quoteUsd: number };
export type PairHistoryResponse = { status: "ok"; source: string; pair: string; interval: string; days: number; rows: PairHistoryRow[]; normalized?: { relative: Array<{value:number}>; base: Array<{value:number}>; quote: Array<{value:number}> }; interpretation?: { relative_strength?: string } };
