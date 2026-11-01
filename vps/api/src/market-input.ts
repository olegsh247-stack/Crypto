export type CoinGeckoTicker = { price: number; timestamp: string; source: "CoinGecko" };

export function parseRequestedDays(rawDays: string | null, interval: string): { ok: true; days: number } | { ok: false } {
  const requestedDays = rawDays === null ? (interval === "1d" ? 30 : 7) : Number(rawDays);
  if (!Number.isInteger(requestedDays) || requestedDays < 1) return { ok: false };
  return { ok: true, days: Math.min(requestedDays, interval === "1d" ? 30 : 7) };
}

export function parseCoinGeckoUsdTicker(
  base: string,
  quote: string,
  id: string,
  data: unknown,
): CoinGeckoTicker | null {
  if (quote !== "USD") return null;
  const row = (data as Record<string, any> | null)?.[id];
  const price = Number(row?.usd);
  const updatedAt = Number(row?.last_updated_at);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(updatedAt) || updatedAt <= 0) {
    throw new Error(`CoinGecko ticker unavailable or missing provider timestamp: ${base}/USD`);
  }
  return { price, timestamp: new Date(updatedAt * 1000).toISOString(), source: "CoinGecko" };
}

export function normalizeStoredQuoteRatio(
  storedBase: Array<{ time: string; close: unknown }>,
  storedQuote: Array<{ time: string; close: unknown }>,
): Array<{ time: string; close: number }> {
  const quoteByTime = new Map(storedQuote.map((row) => [String(row.time), Number(row.close)]));
  return storedBase.flatMap((row) => {
    const quoteClose = quoteByTime.get(String(row.time));
    const baseClose = Number(row.close);
    if (!Number.isFinite(quoteClose) || quoteClose <= 0 || !Number.isFinite(baseClose) || baseClose <= 0) return [];
    const close = baseClose / quoteClose;
    return Number.isFinite(close) && close > 0 ? [{ time: row.time, close }] : [];
  });
}
