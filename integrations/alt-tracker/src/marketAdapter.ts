export type Exchange = "binance" | "bybit" | "okx" | "mexc";

export type Observation = {
  asset_id: string;
  metric_id: "market.spot_price";
  value: number;
  unit: string;
  observed_at: string;
  source_id: string;
  methodology: "exchange spot ticker";
  status: "NORMAL" | "WATCH" | "REVIEW";
  freshness: "fresh" | "aging" | "stale" | "unknown";
  revision: number;
};

const endpoint = (exchange: Exchange, symbol: string): string => {
  if (exchange === "binance") return "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol;
  if (exchange === "bybit") return "https://api.bybit.com/v5/market/tickers?category=spot&symbol=" + symbol;
  if (exchange === "okx") return "https://www.okx.com/api/v5/market/ticker?instId=" + symbol;
  return "https://api.mexc.com/api/v3/ticker/price?symbol=" + symbol;
};

const symbol = (exchange: Exchange, asset: string): string => {
  const a = asset.toUpperCase();
  return exchange === "okx" ? a + "-USDT" : a + "USDT";
};

function parsePrice(exchange: Exchange, data: any): number {
  const raw = exchange === "binance" || exchange === "mexc"
    ? data?.price
    : exchange === "bybit"
      ? data?.result?.list?.[0]?.lastPrice
      : data?.data?.[0]?.last;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(exchange + ": invalid spot price");
  return value;
}

export async function fetchSpotObservation(exchange: Exchange, asset: string): Promise<Observation> {
  const response = await fetch(endpoint(exchange, symbol(exchange, asset)), {
    headers: { "User-Agent": "CryptoDataModel/1.0" }
  });
  if (!response.ok) throw new Error(exchange + ": HTTP " + response.status);
  const value = parsePrice(exchange, await response.json());
  return {
    asset_id: asset.toLowerCase(),
    metric_id: "market.spot_price",
    value,
    unit: "USDT/" + asset.toUpperCase(),
    observed_at: new Date().toISOString(),
    source_id: "market." + exchange,
    methodology: "exchange spot ticker",
    status: "NORMAL",
    freshness: "fresh",
    revision: 1
  };
}

export async function fetchBtcSpotObservations(): Promise<Observation[]> {
  const exchanges: Exchange[] = ["binance", "bybit", "okx", "mexc"];
  const results = await Promise.allSettled(
    exchanges.map(exchange => fetchSpotObservation(exchange, "BTC"))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<Observation> => r.status === "fulfilled")
    .map(r => r.value);
}
