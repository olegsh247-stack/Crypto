import test from "node:test";
import assert from "node:assert/strict";
import { classifyFarsideEtfRow, normalizeKrakenLegacyTrades } from "./btc-source-contracts.mjs";

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
