export const BTC_SPOT_MAX_AGE_SECONDS = 60 * 60;
export const KRAKEN_BTC_USD_PAIR = "XBTUSD";

export interface KrakenSpotCandidate {
  metric_id: "market.spot_price";
  asset_id: "btc";
  source_id: "market.kraken";
  unit: "USD/BTC";
  requested_pair: typeof KRAKEN_BTC_USD_PAIR;
  returned_pair_key: string;
  value: number;
  observed_at: string;
  retrieved_at: string;
  age_seconds: number;
  freshness: "CURRENT" | "STALE";
  acceptance_status: "CANDIDATE_ONLY";
}

type KrakenTrade = [string | number, string | number, string | number, ...unknown[]];

function parseInstant(value: string | Date, label: string): number {
  const instant = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(instant)) throw new Error(`Kraken spot candidate: invalid ${label}`);
  return instant;
}

/**
 * Parse a public Kraken Trades response into a non-persisted candidate.
 * This function intentionally performs no network access and no database writes.
 */
export function parseKrakenBtcUsdTrades(
  payload: unknown,
  retrievedAt: string | Date = new Date()
): KrakenSpotCandidate {
  const retrievedMs = parseInstant(retrievedAt, "retrieval timestamp");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Kraken spot candidate: response must be an object");
  }

  const response = payload as { error?: unknown; result?: unknown };
  if (Array.isArray(response.error) && response.error.length > 0) {
    throw new Error(`Kraken API error: ${response.error.map(String).join(", ")}`);
  }
  if (!Array.isArray(response.error) && response.error != null) {
    throw new Error("Kraken spot candidate: malformed API error field");
  }
  if (!response.result || typeof response.result !== "object" || Array.isArray(response.result)) {
    throw new Error("Kraken spot candidate: missing result object");
  }

  const result = response.result as Record<string, unknown>;
  const pairKey = Object.keys(result).find(key => key !== "last");
  if (!pairKey || !["XXBTZUSD", "XBTUSD"].includes(pairKey)) {
    throw new Error(`Kraken spot candidate: unexpected returned pair key ${pairKey ?? "(missing)"}`);
  }
  const rows = result[pairKey];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Kraken spot candidate: no trade rows");
  }

  const validRows = rows.filter((row): row is KrakenTrade =>
    Array.isArray(row) &&
    row.length >= 3 &&
    Number.isFinite(Number(row[0])) &&
    Number(row[0]) > 0 &&
    Number.isFinite(Number(row[2]))
  );
  if (validRows.length !== rows.length) {
    throw new Error("Kraken spot candidate: one or more trade rows are malformed");
  }

  const latest = validRows.reduce((best, row) => Number(row[2]) > Number(best[2]) ? row : best);
  const observedMs = Number(latest[2]) * 1000;
  if (!Number.isFinite(observedMs)) throw new Error("Kraken spot candidate: invalid trade timestamp");
  if (observedMs > retrievedMs) {
    throw new Error("Kraken spot candidate: trade timestamp is in the future");
  }

  const ageSeconds = Math.floor((retrievedMs - observedMs) / 1000);
  return {
    metric_id: "market.spot_price",
    asset_id: "btc",
    source_id: "market.kraken",
    unit: "USD/BTC",
    requested_pair: KRAKEN_BTC_USD_PAIR,
    returned_pair_key: pairKey,
    value: Number(latest[0]),
    observed_at: new Date(observedMs).toISOString(),
    retrieved_at: new Date(retrievedMs).toISOString(),
    age_seconds: ageSeconds,
    freshness: ageSeconds <= BTC_SPOT_MAX_AGE_SECONDS ? "CURRENT" : "STALE",
    acceptance_status: "CANDIDATE_ONLY"
  };
}
