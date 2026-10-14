import test from "node:test";
import assert from "node:assert/strict";
import { auditKrakenPostTradePageChain, classifyFarsideEtfRow, evaluateFarsideSessionFreshness, normalizeKrakenLegacyTrades, normalizeKrakenPostTrade, parseFarsideHtmlTable, selectKrakenPostTradeWindowCandidate } from "./btc-source-contracts.mjs";
import { getUsEquitySessionDates2026, US_EQUITY_CALENDAR_2026_METADATA } from "./us-equity-session-calendar.mjs";

test("Kraken legacy Trades uses source trade epoch, not retrieval time", () => {
  const result = normalizeKrakenLegacyTrades({
    error: [],
    result: {
      XXBTZUSD: [
        ["83580.0", "0.01", "1791905167.125", "b", "l", ""],
        ["83588.1", "0.02", "1791905168.170", "s", "l", ""],
        ["83581.0", "0.03", "1791905166.900", "b", "l", ""],
      ],
      last: "12345",
    },
  }, { retrievedAt: "2026-10-13T15:26:13.228Z" });

  assert.equal(result.value, 83588.1);
  assert.equal(result.unit, "USD/BTC");
  assert.equal(result.source_pair_key, "XXBTZUSD");
  assert.equal(result.observed_at, "2026-10-13T15:26:08.170Z");
  assert.equal(result.retrieved_at, "2026-10-13T15:26:13.228Z");
  assert.notEqual(result.observed_at, result.retrieved_at);
  assert.match(result.timestamp_semantics, /trade epoch seconds/);
});

test("Kraken rejects API errors and malformed trade tuples", () => {
  assert.throws(() => normalizeKrakenLegacyTrades({ error: ["EGeneral:Temporary lockout"], result: {} }), /API error/);
  assert.throws(() => normalizeKrakenLegacyTrades({ error: [], result: { XXBTZUSD: [["bad", "1", "1"]] } }), /invalid price/);
});

test("Farside all-dash row with displayed 0.0 is unreported, not zero flow", () => {
  const row = classifyFarsideEtfRow({
    sessionDate: "2026-10-13",
    funds: { IBIT: "-", FBTC: "-", BITB: "-", ARKB: "-" },
    total: "0.0",
    retrievedAt: "2026-10-14T10:00:00Z",
    fundColumns: ["IBIT", "FBTC", "BITB", "ARKB"],
  });
  assert.equal(row.source_row_status, "UNREPORTED_SESSION_ROW");
  assert.equal(row.value, null);
  assert.equal(row.observed_at, null);
  assert.equal(row.retrieved_at, "2026-10-14T10:00:00Z");
  assert.equal(row.fund_values.IBIT, null);
});

test("Farside row with one dash and a numeric total remains incomplete", () => {
  const row = classifyFarsideEtfRow({
    sessionDate: "2026-10-13",
    funds: { IBIT: "-", FBTC: "21.0", BITB: "3.1", ARKB: "-2.0" },
    total: "109.8",
    fundColumns: ["IBIT", "FBTC", "BITB", "ARKB"],
  });
  assert.equal(row.source_row_status, "INCOMPLETE_SESSION_ROW");
  assert.equal(row.value, null);
});

test("Farside accepts a complete numeric row as candidate but does not invent observed_at", () => {
  const row = classifyFarsideEtfRow({
    sessionDate: "2026-10-12",
    funds: { IBIT: "-50.0", FBTC: "-10.0", BITB: "-5.4" },
    total: "-65.4",
    fundColumns: ["IBIT", "FBTC", "BITB"],
  });
  assert.equal(row.source_row_status, "COMPLETE_CANDIDATE");
  assert.equal(row.value, -65.4);
  assert.equal(row.session_date, "2026-10-12");
  assert.equal(row.observed_at, null);
});

test("Farside rejects invalid numeric cells rather than silently treating them as zero", () => {
  const row = classifyFarsideEtfRow({
    sessionDate: "2026-10-12",
    funds: { IBIT: "N/A", FBTC: "1.0" },
    total: "1.0",
    fundColumns: ["IBIT", "FBTC"],
  });
  assert.equal(row.source_row_status, "INVALID_ROW");
  assert.equal(row.value, null);
});

test("source-contract helpers reject missing or invalid contract metadata", () => {
  assert.throws(() => normalizeKrakenLegacyTrades({
    error: [],
    result: { XXBTZUSD: [["100", "1", "1791905168"]] },
  }, { retrievedAt: "not-a-time" }), /retrievedAt/);

  assert.throws(() => classifyFarsideEtfRow({
    sessionDate: "13-10-2026",
    funds: { IBIT: "1.0" },
    total: "1.0",
    fundColumns: ["IBIT"],
  }), /ISO calendar date/);
});


test("Farside session freshness uses supplied trading calendar, not retrieval time as observation time", () => {
  const row = classifyFarsideEtfRow({
    sessionDate: "2026-10-12",
    funds: { IBIT: "-50.0", FBTC: "-10.0", BITB: "-5.4" },
    total: "-65.4",
    retrievedAt: "2026-10-14T10:00:00Z",
    fundColumns: ["IBIT", "FBTC", "BITB"],
  });
  const result = evaluateFarsideSessionFreshness(row, {
    retrievedAt: "2026-10-14T10:00:00Z",
    expectedSessionDates: ["2026-10-09", "2026-10-12", "2026-10-13"],
    maxSessionLag: 1,
  });
  assert.equal(result.status, "SESSION_LAG_WITHIN_POLICY");
  assert.equal(result.session_lag, 1);
  assert.equal(result.fresh, true);
  assert.equal(result.observed_at, null);
});

test("Farside freshness blocks stale and incomplete rows", () => {
  const stale = evaluateFarsideSessionFreshness({
    session_date: "2026-10-09", source_row_status: "COMPLETE_CANDIDATE", value: 12,
  }, {
    retrievedAt: "2026-10-14T10:00:00Z",
    expectedSessionDates: ["2026-10-09", "2026-10-12", "2026-10-13"],
    maxSessionLag: 1,
  });
  assert.equal(stale.status, "STALE_SESSION_LAG");
  assert.equal(stale.fresh, false);

  const incomplete = evaluateFarsideSessionFreshness({
    session_date: "2026-10-13", source_row_status: "INCOMPLETE_SESSION_ROW", value: null,
  }, {
    retrievedAt: "2026-10-14T10:00:00Z",
    expectedSessionDates: ["2026-10-12", "2026-10-13"],
    maxSessionLag: 1,
  });
  assert.equal(incomplete.status, "BLOCKED_ROW_INCOMPLETE");
  assert.equal(incomplete.fresh, false);
});

test("Farside freshness requires an approved calendar input and rejects malformed dates", () => {
  assert.throws(() => evaluateFarsideSessionFreshness({ session_date: "2026-10-12", source_row_status: "COMPLETE_CANDIDATE", value: 1 }, {
    retrievedAt: "2026-10-14T10:00:00Z", expectedSessionDates: [], maxSessionLag: 1,
  }), /approved calendar/);
  assert.throws(() => evaluateFarsideSessionFreshness({ session_date: "2026-02-31", source_row_status: "COMPLETE_CANDIDATE", value: 1 }, {
    retrievedAt: "2026-10-14T10:00:00Z", expectedSessionDates: ["2026-10-12"], maxSessionLag: 1,
  }), /valid ISO date/);
});


test("official-source 2026 equity calendar excludes published holidays and retains early closes", () => {
  const sessions = getUsEquitySessionDates2026({ from: "2026-07-02", through: "2026-07-06" });
  assert.deepEqual(sessions, ["2026-07-02", "2026-07-06"]);
  const thanksgivingWindow = getUsEquitySessionDates2026({ from: "2026-11-25", through: "2026-11-27" });
  assert.deepEqual(thanksgivingWindow, ["2026-11-25", "2026-11-27"]);
  assert.equal(US_EQUITY_CALENDAR_2026_METADATA.early_closes_are_sessions, true);
});

test("2026 equity calendar fails closed for unsupported years and invalid dates", () => {
  assert.throws(() => getUsEquitySessionDates2026({ from: "2027-01-04" }), /valid 2026 ISO date/);
  assert.throws(() => getUsEquitySessionDates2026({ from: "2026-02-31" }), /valid 2026 ISO date/);
  assert.throws(() => getUsEquitySessionDates2026({ from: "2026-10-14", through: "2026-10-13" }), /must not be after/);
});


test("ETF freshness contract consumes the official calendar fixture rather than a hand-written weekday list", () => {
  const row = {
    session_date: "2026-10-12",
    source_row_status: "COMPLETE_CANDIDATE",
    value: -65.4,
  };
  const calendar = getUsEquitySessionDates2026({ from: "2026-10-01", through: "2026-10-13" });
  const result = evaluateFarsideSessionFreshness(row, {
    retrievedAt: "2026-10-14T10:00:00Z",
    expectedSessionDates: calendar,
    maxSessionLag: 1,
  });
  assert.equal(result.status, "SESSION_LAG_WITHIN_POLICY");
  assert.equal(result.session_lag, 1);
  assert.equal(result.fresh, true);
});


test("Farside HTML parser maps columns by header and never turns dashes into zero", () => {
  const html = `<table><thead><tr><th>Date</th><th>IBIT</th><th>FBTC</th><th>GBTC</th><th>Total</th></tr></thead><tbody><tr><td>12 Oct 2026</td><td>(50.0)</td><td>-10.0</td><td>-5.4</td><td>(65.4)</td></tr><tr><td>13 Oct 2026</td><td>-</td><td>-</td><td>-</td><td>0.0</td></tr></tbody></table>`;
  const parsed = parseFarsideHtmlTable(html, { retrievedAt: "2026-10-14T10:00:00Z" });
  assert.deepEqual(parsed.fund_columns, ["IBIT", "FBTC", "GBTC"]);
  assert.equal(parsed.rows_seen, 2);
  assert.equal(parsed.latest_session_date, "2026-10-13");
  assert.equal(parsed.latest_row.source_row_status, "UNREPORTED_SESSION_ROW");
  assert.equal(parsed.latest_row.value, null);
  assert.equal(parsed.latest_row.observed_at, null);
  assert.equal(parsed.latest_row.retrieved_at, "2026-10-14T10:00:00Z");
});

test("Farside HTML parser fails closed on changed headers or malformed dates", () => {
  assert.throws(() => parseFarsideHtmlTable("<table><tr><th>Day</th><th>Fund</th></tr><tr><td>12 Oct 2026</td><td>1</td></tr></table>"), /header with Date and Total/);
  const parsed = parseFarsideHtmlTable("<table><tr><th>Date</th><th>IBIT</th><th>Total</th></tr><tr><td>31 Foo 2026</td><td>1</td><td>1</td></tr><tr><td>12 Oct 2026</td><td>1</td><td>1</td></tr></table>");
  assert.equal(parsed.invalid_rows.length, 1);
  assert.equal(parsed.latest_session_date, "2026-10-12");
});


test("Kraken documented Post-Trade keeps trade, publication and retrieval timestamps distinct", () => {
  const result = normalizeKrakenPostTrade({
    error: [],
    result: {
      count: 2,
      last_ts: "2026-10-13T15:26:08.170000000Z",
      trades: [
        { trade_id: "T-2", price: "83588.10", quantity: "0.02", symbol: "BTC/USD", trade_ts: "2026-10-13T15:26:08.170000000Z", publication_ts: "2026-10-13T15:26:08.190000000Z" },
        { trade_id: "T-1", price: "83580.00", quantity: "0.01", symbol: "BTC/USD", trade_ts: "2026-10-13T15:26:07.170000000Z", publication_ts: "2026-10-13T15:26:07.180000000Z" },
      ],
    },
  }, { retrievedAt: "2026-10-13T15:26:13.228Z" });

  assert.equal(result.value, 83588.1);
  assert.equal(result.unit, "USD/BTC");
  assert.equal(result.observed_at, "2026-10-13T15:26:08.170000000Z");
  assert.equal(result.source_published_at, "2026-10-13T15:26:08.190000000Z");
  assert.equal(result.retrieved_at, "2026-10-13T15:26:13.228Z");
  assert.equal(result.raw_trade_id, "T-2");
  assert.equal(result.adapter_contract, "kraken-spot-post-trade-v1");
  assert.notEqual(result.observed_at, result.source_published_at);
  assert.notEqual(result.source_published_at, result.retrieved_at);
});

test("Kraken Post-Trade selects by trade timestamp, not response array position", () => {
  const result = normalizeKrakenPostTrade({
    error: [],
    result: {
      trades: [
        { trade_id: "T-later", price: "101", quantity: "1", symbol: "BTC/USD", trade_ts: "2026-10-13T15:26:08Z", publication_ts: "2026-10-13T15:26:09Z" },
        { trade_id: "T-earlier", price: "99", quantity: "1", symbol: "BTC/USD", trade_ts: "2026-10-13T15:26:07Z", publication_ts: "2026-10-13T15:26:07.1Z" },
      ],
    },
  });
  assert.equal(result.value, 101);
  assert.equal(result.raw_trade_id, "T-later");
});

test("Kraken Post-Trade rejects errors, wrong symbols and malformed timestamp fields", () => {
  const row = { trade_id: "T-1", price: "100", quantity: "1", symbol: "BTC/USD", trade_ts: "2026-10-13T15:26:08Z", publication_ts: "2026-10-13T15:26:09Z" };
  assert.throws(() => normalizeKrakenPostTrade({ error: ["EGeneral:Temporary lockout"], result: { trades: [row] } }), /API error/);
  assert.throws(() => normalizeKrakenPostTrade({ error: [], result: { trades: [{ ...row, symbol: "ETH/USD" }] } }), /symbol mismatch/);
  assert.throws(() => normalizeKrakenPostTrade({ error: [], result: { trades: [{ ...row, publication_ts: "not-a-time" }] } }), /publication_ts/);
  assert.throws(() => normalizeKrakenPostTrade({ error: [], result: {} }), /result.trades/);
});


test("Kraken Post-Trade window candidate selects the last trade in an explicit UTC bucket", () => {
  const normalized = [
    { price: 100, tradeTs: "2026-10-14T10:00:00Z", publicationTs: "2026-10-14T10:00:00.1Z", tradeId: "A", rawTrade: {} },
    { price: 101, tradeTs: "2026-10-14T10:14:59Z", publicationTs: "2026-10-14T10:14:59.1Z", tradeId: "B", rawTrade: {} },
    { price: 102, tradeTs: "2026-10-14T10:15:00Z", publicationTs: "2026-10-14T10:15:00.1Z", tradeId: "C", rawTrade: {} },
  ];
  const result = selectKrakenPostTradeWindowCandidate(normalized, {
    windowStart: "2026-10-14T10:00:00Z",
    windowEnd: "2026-10-14T10:15:00Z",
    retrievedAt: "2026-10-14T10:15:02Z",
  });
  assert.equal(result.status, "CANDIDATE");
  assert.equal(result.value, 101);
  assert.equal(result.raw_trade_id, "B");
  assert.equal(result.observed_at, "2026-10-14T10:14:59Z");
  assert.equal(result.window_semantics.includes("[window_start, window_end)"), true);
});

test("Kraken Post-Trade window candidate blocks empty buckets and invalid bounds", () => {
  const normalized = [{ price: 100, tradeTs: "2026-10-14T10:15:00Z", publicationTs: "2026-10-14T10:15:00.1Z", tradeId: "C", rawTrade: {} }];
  const result = selectKrakenPostTradeWindowCandidate(normalized, {
    windowStart: "2026-10-14T10:00:00Z",
    windowEnd: "2026-10-14T10:15:00Z",
  });
  assert.equal(result.status, "BLOCKED_NO_TRADE_IN_WINDOW");
  assert.equal(result.value, null);
  assert.equal(result.observed_at, null);
  assert.throws(() => selectKrakenPostTradeWindowCandidate(normalized, {
    windowStart: "2026-10-14T10:15:00Z",
    windowEnd: "2026-10-14T10:00:00Z",
  }), /increasing timestamps/);
});


const postTradePage = (rows, lastTs = rows[rows.length - 1]?.trade_ts) => ({
  error: [],
  result: { count: rows.length, trades: rows, last_ts: lastTs },
});

test("Kraken page-chain audit validates cursor structure but never claims completeness", () => {
  const first = [
    { trade_id: "P1", trade_ts: "2026-10-14T10:00:01Z" },
    { trade_id: "P2", trade_ts: "2026-10-14T10:00:02Z" },
  ];
  const second = [
    { trade_id: "P3", trade_ts: "2026-10-14T10:00:03Z" },
  ];
  const result = auditKrakenPostTradePageChain([
    { requestFromTs: null, payload: postTradePage(first) },
    { requestFromTs: "2026-10-14T10:00:02Z", payload: postTradePage(second) },
  ]);
  assert.equal(result.status, "STRUCTURE_VALID_COMPLETENESS_UNPROVEN");
  assert.equal(result.structurally_valid, true);
  assert.equal(result.completeness_proven, false);
  assert.equal(result.unique_trade_ids_seen, 3);
  assert.ok(result.blockers.includes("COMPLETENESS_UNPROVEN_TIMESTAMP_CURSOR_TIES"));
});

test("Kraken page-chain audit blocks cursor mismatch, non-advancement and duplicate IDs", () => {
  const first = [{ trade_id: "P1", trade_ts: "2026-10-14T10:00:02Z" }];
  const later = [{ trade_id: "P2", trade_ts: "2026-10-14T10:00:03Z" }];
  const mismatch = auditKrakenPostTradePageChain([
    { payload: postTradePage(first) },
    { requestFromTs: "2026-10-14T10:00:01Z", payload: postTradePage(later) },
  ]);
  assert.equal(mismatch.status, "BLOCKED_INVALID_PAGE_CHAIN");
  assert.equal(mismatch.pages[1].status, "BLOCKED_CURSOR_CHAIN_MISMATCH");

  const duplicate = auditKrakenPostTradePageChain([
    { payload: postTradePage(first) },
    { requestFromTs: "2026-10-14T10:00:02Z", payload: postTradePage(first) },
  ]);
  assert.equal(duplicate.status, "BLOCKED_INVALID_PAGE_CHAIN");
  assert.equal(duplicate.pages[1].status, "BLOCKED_ORDERING_OR_DUPLICATE_TRADE_ID");
});

test("Kraken page-chain audit blocks malformed counts, ordering and last_ts mismatch", () => {
  const valid = [{ trade_id: "P1", trade_ts: "2026-10-14T10:00:02Z" }];
  const badCount = postTradePage(valid);
  badCount.result.count = 2;
  assert.equal(auditKrakenPostTradePageChain([{ payload: badCount }]).status, "BLOCKED_INVALID_PAGE_CHAIN");

  const unordered = postTradePage([
    { trade_id: "P2", trade_ts: "2026-10-14T10:00:02Z" },
    { trade_id: "P1", trade_ts: "2026-10-14T10:00:01Z" },
  ]);
  assert.equal(auditKrakenPostTradePageChain([{ payload: unordered }]).pages[0].status, "BLOCKED_ORDERING_OR_DUPLICATE_TRADE_ID");

  const wrongLastTs = postTradePage(valid, "2026-10-14T10:00:03Z");
  assert.equal(auditKrakenPostTradePageChain([{ payload: wrongLastTs }]).pages[0].status, "BLOCKED_LAST_TS_MISMATCH");
});
