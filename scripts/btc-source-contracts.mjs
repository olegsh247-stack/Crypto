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
  const parsedSessionDate = typeof sessionDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sessionDate)
    ? new Date(`${sessionDate}T00:00:00Z`) : null;
  if (!parsedSessionDate || !Number.isFinite(parsedSessionDate.getTime())
    || parsedSessionDate.toISOString().slice(0, 10) !== sessionDate) {
    throw new TypeError("sessionDate must be an ISO calendar date");
  }
  if (retrievedAt != null && (typeof retrievedAt !== "string" || !Number.isFinite(Date.parse(retrievedAt)))) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
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


/**
 * Apply an explicit session-lag policy to a complete Farside candidate.
 * expectedSessionDates must come from a separately approved exchange calendar;
 * this helper deliberately does not guess holidays or derive observed_at.
 */
export function evaluateFarsideSessionFreshness(row, {
  retrievedAt,
  expectedSessionDates,
  maxSessionLag,
} = {}) {
  if (!row || typeof row !== "object") throw new TypeError("row is required");
  if (typeof retrievedAt !== "string" || !Number.isFinite(Date.parse(retrievedAt))) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }
  if (!Array.isArray(expectedSessionDates) || expectedSessionDates.length === 0) {
    throw new TypeError("expectedSessionDates from an approved calendar are required");
  }
  if (!Number.isInteger(maxSessionLag) || maxSessionLag < 0) {
    throw new TypeError("maxSessionLag must be a non-negative integer");
  }
  const validDate = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + "T00:00:00Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!expectedSessionDates.every(validDate)) throw new TypeError("calendar contains an invalid ISO date");
  const sessions = [...new Set(expectedSessionDates)].sort();
  if (sessions.length !== expectedSessionDates.length) throw new TypeError("calendar contains duplicate sessions");
  if (!validDate(row.session_date)) throw new TypeError("row.session_date must be a valid ISO date");
  if (!sessions.includes(row.session_date)) {
    return {
      status: "BLOCKED_SESSION_NOT_IN_CALENDAR",
      session_lag: null,
      fresh: false,
      observed_at: null,
      retrieved_at: retrievedAt,
    };
  }
  const latestSession = sessions[sessions.length - 1];
  const lag = sessions.indexOf(latestSession) - sessions.indexOf(row.session_date);
  const candidateComplete = row.source_row_status === "COMPLETE_CANDIDATE" && Number.isFinite(row.value);
  const fresh = candidateComplete && lag <= maxSessionLag;
  return {
    status: !candidateComplete ? "BLOCKED_ROW_INCOMPLETE"
      : fresh ? "SESSION_LAG_WITHIN_POLICY" : "STALE_SESSION_LAG",
    session_lag: lag,
    fresh,
    latest_expected_session_date: latestSession,
    session_date: row.session_date,
    max_session_lag: maxSessionLag,
    observed_at: null,
    retrieved_at: retrievedAt,
    note: "Session freshness is a policy classification, not a source publication timestamp. Calendar must be approved and supplied by caller.",
  };
}


/** Parse the Farside HTML table by header names; fail closed on layout drift. */
export function parseFarsideHtmlTable(html, { retrievedAt = null } = {}) {
  if (typeof html !== "string" || !html.trim()) throw new TypeError("Farside HTML must be a non-empty string");
  const decode = value => value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&minus;/gi, "−").replace(/&#8211;|&ndash;/gi, "–").replace(/&#8212;|&mdash;/gi, "—").replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  const clean = cell => decode(cell.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => [...match[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(cell => clean(cell[1]))).filter(row => row.length);
  const header = rows.find(row => row.some(cell => /^date$/i.test(cell)) && row.some(cell => /^total$/i.test(cell)));
  if (!header) throw new Error("Farside table header with Date and Total was not found");
  const dateIndex = header.findIndex(cell => /^date$/i.test(cell));
  const totalIndex = header.findIndex(cell => /^total$/i.test(cell));
  const fundColumns = header.filter((_, index) => index !== dateIndex && index !== totalIndex);
  if (!fundColumns.length) throw new Error("Farside table has no constituent fund columns");
  const monthMap = { jan:"01", feb:"02", mar:"03", apr:"04", may:"05", jun:"06", jul:"07", aug:"08", sep:"09", oct:"10", nov:"11", dec:"12" };
  const parseDate = value => {
    const match = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (!match || !monthMap[match[2].toLowerCase()]) return null;
    const iso = `${match[3]}-${monthMap[match[2].toLowerCase()]}-${match[1].padStart(2,"0")}`;
    const date = new Date(iso + "T00:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === iso ? iso : null;
  };
  const dataRows = rows.slice(rows.indexOf(header) + 1).map(cells => {
    if (cells.length !== header.length) return { cells, sessionDate: null, parseStatus: "BLOCKED_COLUMN_COUNT_MISMATCH" };
    const sessionDate = parseDate(cells[dateIndex]);
    if (!sessionDate) return { cells, sessionDate: null, parseStatus: "BLOCKED_INVALID_SESSION_DATE" };
    const funds = Object.fromEntries(fundColumns.map(column => [column, cells[header.indexOf(column)]]));
    return { cells, sessionDate, parseStatus: "PARSED", candidate: classifyFarsideEtfRow({ sessionDate, funds, total: cells[totalIndex], retrievedAt, fundColumns }) };
  });
  if (!dataRows.length) throw new Error("Farside table contains no data rows");
  const validRows = dataRows.filter(row => row.sessionDate).sort((a,b) => a.sessionDate.localeCompare(b.sessionDate));
  if (!validRows.length) throw new Error("Farside table contains no rows with valid session dates");
  const latest = validRows[validRows.length - 1];
  return {
    parser_version: "farside-html-header-map-v1",
    table_header: header,
    fund_columns: fundColumns,
    rows_seen: dataRows.length,
    rows_with_valid_dates: validRows.length,
    invalid_rows: dataRows.filter(row => row.parseStatus !== "PARSED").map(row => ({ cells: row.cells, status: row.parseStatus })),
    latest_row: latest.candidate,
    latest_raw_cells: latest.cells,
    latest_session_date: latest.sessionDate,
    note: "Parsed from captured HTML by column headers. Retrieval time is not source publication time; only the newest dated row is considered for freshness and missing fund values remain missing."
  };
}


/**
 * Normalize Kraken's documented Spot Post-Trade response.
 * This is a separate candidate adapter; it does not replace the legacy Trades adapter.
 * Keep execution time (trade_ts), publication time (publication_ts), and retrieval time distinct.
 */
export function normalizeKrakenPostTrade(payload, { retrievedAt, requestedSymbol = "BTC/USD" } = {}) {
  if (!payload || !Array.isArray(payload.error)) {
    throw new TypeError("Kraken Post-Trade payload must contain an error array");
  }
  if (payload.error.length) throw new Error(`Kraken Post-Trade API error: ${payload.error.join(", ")}`);
  const result = payload.result;
  if (!result || typeof result !== "object" || !Array.isArray(result.trades)) {
    throw new TypeError("Kraken Post-Trade payload is missing result.trades");
  }
  if (result.trades.length === 0) throw new Error("Kraken Post-Trade response has no trade rows");
  if (typeof requestedSymbol !== "string" || !requestedSymbol.trim()) {
    throw new TypeError("requestedSymbol must be a non-empty string");
  }
  if (retrievedAt != null && (typeof retrievedAt !== "string" || !Number.isFinite(Date.parse(retrievedAt)))) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }

  const trades = result.trades.map(row => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new TypeError("Kraken Post-Trade row must be an object");
    }
    const price = finiteNumber(row.price);
    const quantity = finiteNumber(row.quantity);
    if (row.symbol !== requestedSymbol) {
      throw new TypeError(`Kraken Post-Trade symbol mismatch: expected ${requestedSymbol}`);
    }
    if (price == null || price <= 0 || quantity == null || quantity < 0) {
      throw new TypeError("Kraken Post-Trade row has invalid price or quantity");
    }
    if (typeof row.trade_ts !== "string" || !Number.isFinite(Date.parse(row.trade_ts))) {
      throw new TypeError("Kraken Post-Trade row has invalid trade_ts");
    }
    if (typeof row.publication_ts !== "string" || !Number.isFinite(Date.parse(row.publication_ts))) {
      throw new TypeError("Kraken Post-Trade row has invalid publication_ts");
    }
    if (typeof row.trade_id !== "string" || !row.trade_id) {
      throw new TypeError("Kraken Post-Trade row is missing trade_id");
    }
    return { price, quantity, tradeTs: row.trade_ts, publicationTs: row.publication_ts, tradeId: row.trade_id, rawTrade: row };
  });
  const latest = trades.reduce((best, row) => {
    const currentTime = Date.parse(row.tradeTs);
    const bestTime = Date.parse(best.tradeTs);
    if (currentTime > bestTime) return row;
    if (currentTime === bestTime && row.tradeId.localeCompare(best.tradeId) > 0) return row;
    return best;
  });

  return {
    source_id: "market.kraken",
    metric_id: "market.spot_price",
    requested_pair: requestedSymbol,
    source_pair_key: requestedSymbol,
    value: latest.price,
    unit: "USD/BTC",
    observed_at: latest.tradeTs,
    source_published_at: latest.publicationTs,
    retrieved_at: retrievedAt ?? null,
    raw_trade_quantity: latest.quantity,
    raw_trade_id: latest.tradeId,
    raw_trade_row: latest.rawTrade,
    normalized_trades: trades,
    timestamp_semantics: "Kraken documented Post-Trade: trade_ts is engine match time; publication_ts is market-data publication time; retrieved_at is capture time",
    adapter_contract: "kraken-spot-post-trade-v1",
  };
}


/**
 * Select a documented Post-Trade row for an explicit UTC observation bucket.
 * Bounds are caller-supplied; this helper never invents a bucket from retrieval time.
 * The interval is [windowStart, windowEnd): end-exclusive to avoid double-counting.
 */
export function selectKrakenPostTradeWindowCandidate(normalizedTrades, {
  windowStart,
  windowEnd,
  retrievedAt,
} = {}) {
  const validTimestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
  if (!Array.isArray(normalizedTrades) || normalizedTrades.length === 0) {
    throw new TypeError("normalizedTrades must be a non-empty array");
  }
  if (!validTimestamp(windowStart) || !validTimestamp(windowEnd)
    || Date.parse(windowStart) >= Date.parse(windowEnd)) {
    throw new TypeError("windowStart and windowEnd must be valid increasing timestamps");
  }
  if (retrievedAt != null && !validTimestamp(retrievedAt)) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }
  const start = Date.parse(windowStart);
  const end = Date.parse(windowEnd);
  const eligible = normalizedTrades.filter(row => {
    if (!row || typeof row !== "object" || !validTimestamp(row.tradeTs)
      || !validTimestamp(row.publicationTs) || !Number.isFinite(row.price) || row.price <= 0
      || typeof row.tradeId !== "string" || !row.tradeId) {
      throw new TypeError("normalized trade row has invalid candidate fields");
    }
    const time = Date.parse(row.tradeTs);
    return time >= start && time < end;
  });
  if (!eligible.length) {
    return {
      status: "BLOCKED_NO_TRADE_IN_WINDOW",
      value: null,
      observed_at: null,
      source_published_at: null,
      retrieved_at: retrievedAt ?? null,
      window_start: windowStart,
      window_end: windowEnd,
      window_semantics: "[window_start, window_end), UTC; bounds supplied by caller",
    };
  }
  const latest = eligible.reduce((best, row) => {
    const currentTime = Date.parse(row.tradeTs);
    const bestTime = Date.parse(best.tradeTs);
    if (currentTime > bestTime) return row;
    if (currentTime === bestTime && row.tradeId.localeCompare(best.tradeId) > 0) return row;
    return best;
  });
  return {
    status: "CANDIDATE",
    value: latest.price,
    unit: "USD/BTC",
    observed_at: latest.tradeTs,
    source_published_at: latest.publicationTs,
    retrieved_at: retrievedAt ?? null,
    raw_trade_id: latest.tradeId,
    raw_trade_row: latest.rawTrade,
    window_start: windowStart,
    window_end: windowEnd,
    window_semantics: "[window_start, window_end), UTC; selected latest trade by trade_ts inside supplied window",
  };
}


/**
 * Fixture-only structural audit for a sequence of Kraken Post-Trade pages.
 * It deliberately does not certify completeness: timestamp-only cursors can be
 * ambiguous when multiple trades share a trade_ts at a page boundary.
 *
 * Each page is { requestFromTs?: string|null, payload: API response }.
 */
export function auditKrakenPostTradePageChain(pages, { maxPageSize = 1000 } = {}) {
  const validTimestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new TypeError("pages must be a non-empty array");
  }
  if (!Number.isInteger(maxPageSize) || maxPageSize < 1 || maxPageSize > 1000) {
    throw new TypeError("maxPageSize must be an integer from 1 to 1000");
  }

  const seenTradeIds = new Set();
  const pageAudit = [];
  let previousLastTs = null;
  let structurallyValid = true;
  const blockers = [
    "COMPLETENESS_UNPROVEN_TIMESTAMP_CURSOR_TIES",
    "PROVIDER_CONTRACT_DOES_NOT_SPECIFY_TIE_SAFE_RESUME",
  ];

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (!page || typeof page !== "object" || !page.payload || typeof page.payload !== "object") {
      throw new TypeError(`page ${index} must contain a payload object`);
    }
    const { requestFromTs = null, payload } = page;
    if (requestFromTs != null && !validTimestamp(requestFromTs)) {
      throw new TypeError(`page ${index} requestFromTs must be a valid timestamp`);
    }
    if (index > 0) {
      if (requestFromTs == null || Date.parse(requestFromTs) !== Date.parse(previousLastTs)) {
        structurallyValid = false;
        pageAudit.push({ index, status: "BLOCKED_CURSOR_CHAIN_MISMATCH", request_from_ts: requestFromTs, expected_from_ts: previousLastTs });
        break;
      }
    }

    if (!Array.isArray(payload.error) || payload.error.length) {
      structurallyValid = false;
      pageAudit.push({ index, status: "BLOCKED_API_ERROR_OR_INVALID_ENVELOPE" });
      break;
    }
    const result = payload.result;
    if (!result || typeof result !== "object" || !Array.isArray(result.trades)
      || !Number.isInteger(result.count) || result.count !== result.trades.length
      || result.trades.length > maxPageSize || !validTimestamp(result.last_ts)) {
      structurallyValid = false;
      pageAudit.push({ index, status: "BLOCKED_PAGE_SHAPE_COUNT_OR_LIMIT" });
      break;
    }
    if (result.trades.length === 0) {
      structurallyValid = false;
      pageAudit.push({ index, status: "BLOCKED_EMPTY_PAGE" });
      break;
    }

    let priorTradeTs = null;
    let latestTradeTs = null;
    for (const row of result.trades) {
      if (!row || typeof row.trade_id !== "string" || !row.trade_id
        || !validTimestamp(row.trade_ts)) {
        structurallyValid = false;
        break;
      }
      const currentTs = Date.parse(row.trade_ts);
      if (priorTradeTs != null && currentTs < priorTradeTs) structurallyValid = false;
      if (seenTradeIds.has(row.trade_id)) structurallyValid = false;
      seenTradeIds.add(row.trade_id);
      priorTradeTs = currentTs;
      latestTradeTs = row.trade_ts;
    }
    if (!structurallyValid) {
      pageAudit.push({ index, status: "BLOCKED_ORDERING_OR_DUPLICATE_TRADE_ID" });
      break;
    }
    if (Date.parse(result.last_ts) !== Date.parse(latestTradeTs)) {
      structurallyValid = false;
      pageAudit.push({ index, status: "BLOCKED_LAST_TS_MISMATCH" });
      break;
    }
    if (previousLastTs != null && Date.parse(result.last_ts) <= Date.parse(previousLastTs)) {
      structurallyValid = false;
      pageAudit.push({ index, status: "BLOCKED_NON_ADVANCING_CURSOR" });
      break;
    }

    pageAudit.push({
      index,
      status: "STRUCTURALLY_VALID_PAGE",
      rows: result.trades.length,
      first_trade_ts: result.trades[0].trade_ts,
      last_trade_ts: latestTradeTs,
      last_ts: result.last_ts,
      full_page: result.trades.length === maxPageSize,
    });
    previousLastTs = result.last_ts;
  }

  return {
    status: structurallyValid ? "STRUCTURE_VALID_COMPLETENESS_UNPROVEN" : "BLOCKED_INVALID_PAGE_CHAIN",
    structurally_valid: structurallyValid,
    completeness_proven: false,
    pages_checked: pageAudit.length,
    unique_trade_ids_seen: seenTradeIds.size,
    pages: pageAudit,
    blockers: structurallyValid ? blockers : ["PAGE_CHAIN_STRUCTURAL_VALIDATION_FAILED"],
    note: "Fixture-only structural validation; never treats a cursor walk as proof of complete market-data coverage.",
  };
}

/**
 * Normalize Kraken's documented public Ticker response as a snapshot candidate.
 * Does not infer a source trade/quote timestamp: retrievedAt is capture time only.
 * Returns both last-trade and bid/ask-midpoint semantics; callers must choose
 * the intended metric explicitly before any registry or collector wiring.
 */
export function normalizeKrakenTicker(payload, { retrievedAt, requestedPair = "XBTUSD" } = {}) {
  if (!payload || !Array.isArray(payload.error)) {
    throw new TypeError("Kraken Ticker payload must contain an error array");
  }
  if (payload.error.length) throw new Error(`Kraken Ticker API error: ${payload.error.join(", ")}`);
  const result = payload.result;
  if (!result || typeof result !== "object") {
    throw new TypeError("Kraken Ticker payload is missing result");
  }
  const pairKey = Object.keys(result)[0];
  const ticker = pairKey ? result[pairKey] : null;
  if (!ticker || typeof ticker !== "object") {
    throw new TypeError("Kraken Ticker response is missing a pair result");
  }
  const parsePrice = (field, label) => {
    if (!Array.isArray(field) || field.length < 1) {
      throw new TypeError(`Kraken Ticker ${label} must be a non-empty array`);
    }
    const price = finiteNumber(field[0]);
    if (price == null || price <= 0) {
      throw new TypeError(`Kraken Ticker ${label} price must be positive and finite`);
    }
    return price;
  };
  const ask = parsePrice(ticker.a, "ask");
  const bid = parsePrice(ticker.b, "bid");
  const lastTrade = parsePrice(ticker.c, "last trade");
  if (bid > ask) throw new TypeError("Kraken Ticker bid must not exceed ask");
  if (retrievedAt != null && (typeof retrievedAt !== "string" || !Number.isFinite(Date.parse(retrievedAt)))) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }

  return {
    source_id: "market.kraken",
    metric_id: "market.spot_price",
    requested_pair: requestedPair,
    source_pair_key: pairKey,
    unit: "USD/BTC",
    last_trade_price: lastTrade,
    bid_price: bid,
    ask_price: ask,
    bid_ask_midpoint: (bid + ask) / 2,
    observed_at: null,
    source_published_at: null,
    retrieved_at: retrievedAt ?? null,
    timestamp_semantics: "Kraken Ticker response contains no documented per-trade or per-quote timestamp; retrieved_at is capture time only",
    status: "SNAPSHOT_CANDIDATE_SEMANTICS_UNSELECTED",
    blockers: ["METRIC_SEMANTICS_NOT_SELECTED", "SOURCE_EVENT_TIMESTAMP_UNAVAILABLE"],
  };
}



/**
 * Fixture-only normalizer for Kraken /0/public/OHLC with interval=60.
 * Kraken documents that the final OHLC row is always the current, uncommitted
 * candle; this helper excludes it and selects only the exact requested bar start.
 * It does not fetch data or change any registry/collector.
 */
export function normalizeKrakenHourlyOhlc(payload, {
  retrievedAt,
  requestedPairKey = "XXBTZUSD",
  windowStart,
} = {}) {
  const validTimestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
  if (!payload || !Array.isArray(payload.error)) {
    throw new TypeError("Kraken OHLC payload must contain an error array");
  }
  if (payload.error.length) throw new Error(`Kraken OHLC API error: ${payload.error.join(", ")}`);
  if (!validTimestamp(windowStart)) throw new TypeError("windowStart must be a valid ISO timestamp");
  if (retrievedAt != null && !validTimestamp(retrievedAt)) {
    throw new TypeError("retrievedAt must be a valid timestamp string");
  }
  const windowStartMs = Date.parse(windowStart);
  if (windowStartMs % 3_600_000 !== 0) {
    throw new TypeError("windowStart must be aligned to a UTC hour boundary");
  }
  const result = payload.result;
  if (!result || typeof result !== "object") throw new TypeError("Kraken OHLC payload is missing result");
  const rows = result[requestedPairKey];
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new TypeError("Kraken OHLC response must contain at least one closed row and the current uncommitted row");
  }

  const parseRow = (row, index) => {
    if (!Array.isArray(row) || row.length < 8) {
      throw new TypeError(`Kraken OHLC row ${index} must contain 8 documented fields`);
    }
    const epochSeconds = finiteNumber(row[0]);
    const open = finiteNumber(row[1]);
    const high = finiteNumber(row[2]);
    const low = finiteNumber(row[3]);
    const close = finiteNumber(row[4]);
    if (epochSeconds == null || epochSeconds <= 0 || !Number.isInteger(epochSeconds)
      || [open, high, low, close].some(value => value == null || value <= 0)
      || high < Math.max(open, close, low) || low > Math.min(open, close, high)) {
      throw new TypeError(`Kraken OHLC row ${index} has invalid timestamp or OHLC prices`);
    }
    return { epochSeconds, open, high, low, close };
  };

  const closedRows = rows.slice(0, -1).map(parseRow);
  const starts = new Set();
  for (const row of closedRows) {
    if (starts.has(row.epochSeconds)) throw new TypeError("Kraken OHLC response contains duplicate candle start times");
    starts.add(row.epochSeconds);
  }
  const selected = closedRows.find(row => row.epochSeconds * 1000 === windowStartMs);
  if (selected && retrievedAt != null && Date.parse(retrievedAt) < windowStartMs + 3_600_000) {
    return {
      source_id: "market.kraken",
      metric_id: "market.spot_price",
      requested_pair_key: requestedPairKey,
      unit: "USD/BTC",
      interval_minutes: 60,
      value: null,
      status: "BLOCKED_RETRIEVED_BEFORE_CANDLE_CLOSE",
      window_start: new Date(windowStartMs).toISOString(),
      window_end: new Date(windowStartMs + 3_600_000).toISOString(),
      observed_at: null,
      source_published_at: null,
      retrieved_at: retrievedAt,
      blockers: ["RETRIEVAL_PRECEDES_SCHEDULED_CANDLE_CLOSE"],
    };
  }
  if (retrievedAt == null) {
    return {
      source_id: "market.kraken",
      metric_id: "market.spot_price",
      requested_pair_key: requestedPairKey,
      unit: "USD/BTC",
      interval_minutes: 60,
      value: null,
      status: "BLOCKED_RETRIEVAL_TIMESTAMP_MISSING",
      window_start: new Date(windowStartMs).toISOString(),
      window_end: new Date(windowStartMs + 3_600_000).toISOString(),
      observed_at: null,
      source_published_at: null,
      retrieved_at: null,
      blockers: ["RETRIEVAL_TIMESTAMP_REQUIRED_FOR_FRESHNESS_AUDIT"],
    };
  }
  if (!selected) {
    return {
      source_id: "market.kraken",
      metric_id: "market.spot_price",
      requested_pair_key: requestedPairKey,
      unit: "USD/BTC",
      interval_minutes: 60,
      value: null,
      status: "BLOCKED_CLOSED_HOURLY_CANDLE_NOT_FOUND",
      window_start: new Date(windowStartMs).toISOString(),
      window_end: new Date(windowStartMs + 3_600_000).toISOString(),
      observed_at: null,
      source_published_at: null,
      retrieved_at: retrievedAt ?? null,
      blockers: ["REQUESTED_CLOSED_HOURLY_CANDLE_NOT_PRESENT"],
    };
  }

  return {
    source_id: "market.kraken",
    metric_id: "market.spot_price",
    requested_pair_key: requestedPairKey,
    unit: "USD/BTC",
    value: selected.close,
    open: selected.open,
    high: selected.high,
    low: selected.low,
    interval_minutes: 60,
    status: "CLOSED_HOURLY_CANDLE_CANDIDATE",
    window_start: new Date(windowStartMs).toISOString(),
    window_end: new Date(windowStartMs + 3_600_000).toISOString(),
    // A completed candle's logical observation window ends at bar_end_at.
    // This is not a claim about when Kraken published the row.
    observed_at: new Date(windowStartMs + 3_600_000).toISOString(),
    bar_end_at: new Date(windowStartMs + 3_600_000).toISOString(),
    source_published_at: null,
    retrieved_at: retrievedAt,
    timestamp_semantics: "observed_at/bar_end_at marks the scheduled end of the completed candle's observation window; source_published_at is unknown; retrieved_at is capture time only",
    blockers: ["TERMS_AND_RUNTIME_ACCESS_NOT_CLEARED"],
  };
}
