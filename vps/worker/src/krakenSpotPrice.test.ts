import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchKrakenBtcUsdSpotCandidate,
  KRAKEN_BTC_USD_TRADES_URL,
  parseKrakenBtcUsdTrades,
  toKrakenObservationCandidateRow
} from "./krakenSpotPrice.js";

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

test("network capture retains the raw response, source URL, HTTP status and hash", async () => {
  const observedAt = (Date.now() / 1000 - 10).toFixed(3);
  const rawBody = JSON.stringify({ error: [], result: { XXBTZUSD: [["83500.5", "0.01", observedAt]], last: "cursor" } });
  const fakeFetch: typeof fetch = async (input, init) => {
    assert.equal(String(input), KRAKEN_BTC_USD_TRADES_URL);
    assert.equal(init?.headers && new Headers(init.headers).get("accept"), "application/json");
    return new Response(rawBody, { status: 200, headers: { "content-type": "application/json" } });
  };
  const capture = await fetchKrakenBtcUsdSpotCandidate(fakeFetch);
  assert.equal(capture.source_url, KRAKEN_BTC_USD_TRADES_URL);
  assert.equal(capture.http_status, 200);
  assert.equal(capture.raw_response_body, rawBody);
  assert.match(capture.raw_payload_sha256, /^[a-f0-9]{64}$/);
  assert.equal(capture.acceptance_status, "CANDIDATE_ONLY");
});

test("network capture rejects HTTP failures and malformed JSON", async () => {
  const httpFailure: typeof fetch = async () => new Response("temporarily unavailable", { status: 503 });
  await assert.rejects(fetchKrakenBtcUsdSpotCandidate(httpFailure), /HTTP 503/);
  const invalidJson: typeof fetch = async () => new Response("{bad json", { status: 200 });
  await assert.rejects(fetchKrakenBtcUsdSpotCandidate(invalidJson), /not valid JSON/);
});

test("maps a provenanced current capture to the canonical observation contract without writing", async () => {
  const observedAt = (Date.now() / 1000 - 10).toFixed(3);
  const rawBody = JSON.stringify({ error: [], result: { XXBTZUSD: [["83500.5", "0.01", observedAt]], last: "cursor" } });
  const fakeFetch: typeof fetch = async () => new Response(rawBody, { status: 200 });
  const capture = await fetchKrakenBtcUsdSpotCandidate(fakeFetch);
  const row = toKrakenObservationCandidateRow(capture);
  assert.equal(row.metric_id, "market.spot_price");
  assert.equal(row.asset_id, "btc");
  assert.equal(row.value_numeric, 83500.5);
  assert.equal(row.unit, "USD/BTC");
  assert.equal(row.source_id, "market.kraken");
  assert.equal(row.source_url, KRAKEN_BTC_USD_TRADES_URL);
  assert.equal(row.freshness, "CURRENT");
  assert.equal(row.revision, 1);
  assert.match(row.methodology, /raw_payload_sha256=[a-f0-9]{64}/);
});

test("candidate observation mapper fails closed for stale data or missing provenance", async () => {
  const observedAt = (Date.now() / 1000 - 4000).toFixed(3);
  const rawBody = JSON.stringify({ error: [], result: { XXBTZUSD: [["83500.5", "0.01", observedAt]], last: "cursor" } });
  const fakeFetch: typeof fetch = async () => new Response(rawBody, { status: 200 });
  const stale = await fetchKrakenBtcUsdSpotCandidate(fakeFetch);
  assert.equal(stale.freshness, "STALE");
  assert.throws(() => toKrakenObservationCandidateRow(stale), /not current/);
  const currentObservedAt = (Date.now() / 1000 - 10).toFixed(3);
  const currentBody = JSON.stringify({ error: [], result: { XXBTZUSD: [["83500.5", "0.01", currentObservedAt]], last: "cursor" } });
  const current = await fetchKrakenBtcUsdSpotCandidate(async () => new Response(currentBody, { status: 200 }));
  assert.throws(() => toKrakenObservationCandidateRow({ ...current, raw_payload_sha256: "missing" }), /SHA-256/);
  assert.throws(() => toKrakenObservationCandidateRow({ ...current, http_status: 206 }), /source URL or HTTP status/);
});
