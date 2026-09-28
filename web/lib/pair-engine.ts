export type Pair = {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  exchange?: string | null;
  enabled: boolean;
};

export function normalizePair(pair: any): Pair {
  const symbol = String(pair?.symbol ?? "");
  const [base = symbol, quote = ""] = symbol.split("/");
  return {
    id: String(pair?.id ?? symbol),
    symbol,
    base: String(pair?.base ?? base),
    quote: String(pair?.quote ?? quote),
    exchange: pair?.exchange ?? null,
    enabled: pair?.enabled !== false,
  };
}

export function pairKey(base: string, quote: string) {
  return `${base.trim().toUpperCase()}/${quote.trim().toUpperCase()}`;
}

export function canAddPair(base: string, quote: string) {
  return Boolean(base.trim() && quote.trim() && base.trim().toUpperCase() !== quote.trim().toUpperCase());
}
