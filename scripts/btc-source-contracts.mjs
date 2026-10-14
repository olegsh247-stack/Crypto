/**
 * Pure BTC upstream-contract helpers.
 * No network, clock reads, database access, or persistence.
 */

function finiteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Normalize Kraken's legacy /0/public/Trades tuple shape:
 * [price, volume, epoch_seconds, side, order_type, misc, trade_id].
 * Keep retrieval time supplied by the caller separate from trade time.
 */
export function normalizeKrakenLegacyTrades(payload, { retrievedAt, requestedPair = "XBTUSD" } = {}) {
  if (!payload || !Array.isArray(payload.error)) {
    throw new TypeError("Kraken payload must contain an error array");
  }
  if (payload.error.length) throw new Error(`Kraken API error: ${payload.error.join(", ")}`);
  const result = payload.result;
  if (!result || typeof result !== "object") throw new TypeError("Kraken payload is missing result");
  const pairKey = Object.keys(result).find(key => key !== "last");
  const rows = pairKey ? result[pairKey] : null;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Kraken response has no trade rows");

  const trades = rows.map(row => {
    if (!Array.isArray(row) || row.length < 3) throw new TypeError("Kraken trade row must contain price, volume and epoch timestamp");
    const price = finiteNumber(row[0]);
    const volume = finiteNumber(row[1]);
    const epochSeconds = finiteNumber(row[2]);
    if (price == null || price <= 0 || volume == null || volume < 0 || epochSeconds == null || epochSeconds <= 0) {
      throw new TypeError("Kraken trade row has invalid price, volume or epoch timestamp");
    }
    return { price, volume, epochSeconds, rawRow: row };
  });
  const latest = trades.reduce((best, row) => row.epochSeconds > best.epochSeconds ? row : best);
  const observedAt = new Date(latest.epochSeconds * 1000).toISOString();
  if (retrievedAt != null && (typeof retrievedAt !== "string" || !Number.isFinite(Date.parse(retrievedAt)))) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }

  return {
    source_id: "market.kraken",
    metric_id: "market.spot_price",
    requested_pair: requestedPair,
    source_pair_key: pairKey,
    value: latest.price,
    unit: "USD/BTC",
    observed_at: observedAt,
    retrieved_at: retrievedAt ?? null,
    raw_trade_volume: latest.volume,
    raw_trade_row: latest.rawRow,
    timestamp_semantics: "Kraken legacy Trades tuple index 2: trade epoch seconds; not retrieval time",
  };
}

/**
 * Classify one already-parsed Farside table row without coercing placeholders.
 * fundColumns must be the expected constituent column names from the table header.
 */
export function classifyFarsideEtfRow({ sessionDate, funds, total, retrievedAt = null, fundColumns }) {
  if (typeof sessionDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)
    || !Number.isFinite(Date.parse(`${sessionDate}T00:00:00Z`))) {
    throw new TypeError("sessionDate must be an ISO calendar date");
  }
  if (!funds || typeof funds !== "object" || !Array.isArray(fundColumns) || fundColumns.length === 0) {
    throw new TypeError("funds and non-empty fundColumns are required");
  }
  const parseCell = value => {
    if (typeof value !== "string" && typeof value !== "number") return { kind: "missing", value: null };
    const raw = String(value).trim();
    if (raw === "" || raw === "-") return { kind: "missing", value: null };
    const normalized = raw.replace(/,/g, "").replace(/^\((.*)\)$/, "-$1");
    const number = finiteNumber(normalized);
    return number == null ? { kind: "invalid", value: null } : { kind: "numeric", value: number };
  };

  const parsedFunds = Object.fromEntries(fundColumns.map(column => [column, parseCell(funds[column])]));
  const parsedTotal = parseCell(total);
  const values = Object.values(parsedFunds);
  const allMissing = values.every(cell => cell.kind === "missing");
  const anyMissing = values.some(cell => cell.kind === "missing");
  const anyInvalid = values.some(cell => cell.kind === "invalid") || parsedTotal.kind === "invalid";
  let status;
  if (anyInvalid) status = "INVALID_ROW";
  else if (allMissing) status = "UNREPORTED_SESSION_ROW";
  else if (anyMissing || parsedTotal.kind !== "numeric") status = "INCOMPLETE_SESSION_ROW";
  else status = "COMPLETE_CANDIDATE";

  return {
    source_id: "institutional.primary",
    metric_id: "institutional.etf_net_flow",
    session_date: sessionDate,
    value: status === "COMPLETE_CANDIDATE" ? parsedTotal.value : null,
    unit: "USD million/day",
    observed_at: null,
    retrieved_at: retrievedAt,
    source_row_status: status,
    fund_values: Object.fromEntries(Object.entries(parsedFunds).map(([key, cell]) => [key, cell.value])),
    raw_total_cell: String(total ?? ""),
    note: "A dash/blank is unreported data, never numeric zero; retrieval time is not source observation/publication time.",
  };
}
