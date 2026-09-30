export type Candle = { time: number; close: number };

const BINANCE_API = "https://api.binance.com/api/v3/klines";

export async function getBinanceCandles(symbol: string, days: number): Promise<Candle[]> {
  const safeDays = Math.max(1, Math.min(days, 180));
  const url = `${BINANCE_API}?symbol=${encodeURIComponent(symbol)}&interval=1d&limit=${safeDays + 1}`;
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`Binance history request failed for ${symbol}: ${response.status}`);
  const rows = await response.json() as unknown[];
  return rows.map((row: any[]) => ({ time: Number(row[0]), close: Number(row[4]) })).filter(c => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0);
}

export function relativeChangePercent(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  return ((last / first) - 1) * 100;
}

export async function getLiveRelativeStrength(baseSymbol: string, quoteSymbol: string, days: number) {
  const direct = `${baseSymbol}${quoteSymbol}`;
  const candles = await getBinanceCandles(direct, days);
  return { symbol: direct, days, changePct: relativeChangePercent(candles), candles, source: "Binance" as const, calculatedAt: new Date().toISOString() };
}
