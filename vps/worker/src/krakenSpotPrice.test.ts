import assert from "node:assert/strict";
import test from "node:test";
import { parseKrakenBtcUsdTrades } from "./krakenSpotPrice.js";

const now = "2026-10-13T06:00:00.000Z";
const payload = {
  error: [],
  result: {
    XXBTZUSD: [
      ["83400.00", "0.002", "1791871100.0000", "b", "m", ""],
      ["83501.30", "0.004", "1791871198.5000", "s", "l", ""]
    ],
    last: "cursor"
  }
};

test("selects newest XBTUSD trade and normalizes the candidate contract", () => {
  const candidate = parseKrakenBtcUsdTrades(payload, now);
  assert.equal(candidate.metric_id, "market.spot_price");
  assert.equal(candidate.asset_id, "btc");
  assert.equal(candidate.source_id, "market.kraken");
  assert.equal(candidate.unit, "USD/BTC");
  assert.equal(candidate.requested_pair, "XBTUSD");
  assert.equal(candidate.returned_pair_key, "XXBTZUSD");
  assert.equal(candidate.value, 83501.3);
  assert.equal(candidate.observed_at, "2026-10-13T05:59:58.500Z");
  assert.equal(candidate.freshness, "CURRENT");
  assert.equal(candidate.acceptance_status, "CANDIDATE_ONLY");
});

test("marks a trade older than the one-hour registry window stale", () => {
  const stalePayload = { error: [], result: { XXBTZUSD: [["83000", "1", "1791867000.0"]], last: "x" } };
  assert.equal(parseKrakenBtcUsdTrades(stalePayload, now).freshness, "STALE");
});

test("rejects future timestamps", () => {
  const futurePayload = { error: [], result: { XXBTZUSD: [["83000", "1", "1791871201.0"]], last: "x" } };
  assert.throws(() => parseKrakenBtcUsdTrades(futurePayload, now), /in the future/);
});

test("rejects Kraken API errors", () => {
  assert.throws(() => parseKrakenBtcUsdTrades({ error: ["EGeneral:Temporary lockout"], result: {} }, now), /Kraken API error/);
});

test("rejects empty or malformed trades", () => {
  assert.throws(() => parseKrakenBtcUsdTrades({ error: [], result: { XXBTZUSD: [], last: "x" } }, now), /no trade rows/);
  assert.throws(() => parseKrakenBtcUsdTrades({ error: [], result: { XXBTZUSD: [["NaN", "1", "1791871198"]], last: "x" } }, now), /malformed/);
});

test("rejects an unexpected returned pair key", () => {
  assert.throws(() => parseKrakenBtcUsdTrades({ error: [], result: { XETHZUSD: [["83000", "1", "1791871198"]], last: "x" } }, now), /unexpected returned pair key/);
});
