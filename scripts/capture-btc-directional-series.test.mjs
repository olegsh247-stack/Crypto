import test from "node:test";
import assert from "node:assert/strict";
import { parseKrakenOhlc, parseHashrateSeries, sha256, runCapture } from "./capture-btc-directional-series.mjs";

const now = new Date("2026-10-13T12:00:00.000Z");
const epoch = value => Math.floor(new Date(value).getTime() / 1000);
const krakenRows = [];
const hashrateRows = [];
for (let day = 4; day <= 13; day++) {
  const stamp = epoch(`2026-10-${String(day).padStart(2, "0")}T00:00:00.000Z`);
  const close = 80000 + day * 100;
  krakenRows.push([stamp, close - 100, close + 100, close - 200, close, close - 10, 12.5, 1000]);
  hashrateRows.push({ timestamp: stamp, avgHashrate: (990 + day) * 1e18 });
}
const krakenBody = JSON.stringify({ error: [], result: { XXBTZUSD: krakenRows, last: 1 } });
const hashrateBody = JSON.stringify({ hashrates: hashrateRows });

test("Kraken parser uses completed daily closes and excludes current candle", () => {
  const result = parseKrakenOhlc(krakenBody, now);
  assert.equal(result.completed_candle_count, 9);
  assert.equal(result.first_completed_day, "2026-10-04");
  assert.equal(result.latest_completed_day, "2026-10-12");
  assert.equal(result.close_seven_days_prior_usd_per_btc, 80500);
  assert.equal(result.latest_completed_close_usd_per_btc, 81200);
  assert.equal(result.seven_day_return, 81200 / 80500 - 1);
  assert.equal(result.acceptance_status, "CANDIDATE_ONLY");
  assert.equal(result.source_id_candidate, "market_kraken");
});

test("Kraken parser rejects inconsistent OHLC values and API errors", () => {
  const inconsistent = JSON.parse(krakenBody);
  inconsistent.result.XXBTZUSD[0][2] = 1;
  assert.throws(() => parseKrakenOhlc(inconsistent, now), /inconsistent_ohlc/);
  assert.throws(() => parseKrakenOhlc({ error: ["rate limit"], result: {} }, now), /kraken_api_error/);
});

test("Kraken parser fails closed on missing daily dates", () => {
  const missing = JSON.parse(krakenBody);
  missing.result.XXBTZUSD.splice(4, 1);
  assert.throws(() => parseKrakenOhlc(missing, now), /daily gap/);
});

test("Hashrate parser calculates seven-day change and preserves candidate-only semantics", () => {
  const result = parseHashrateSeries(hashrateBody, now);
  assert.equal(result.completed_daily_point_count, 9);
  assert.equal(result.first_point_day_utc, "2026-10-04");
  assert.equal(result.latest_point_day_utc, "2026-10-12");
  assert.equal(result.value_seven_days_prior_eh_s, 995);
  assert.equal(result.latest_value_eh_s, 1002);
  assert.equal(result.seven_day_change, 1002 / 995 - 1);
  assert.match(result.bucket_timestamp_convention, /NOT YET AUTHORITATIVELY CONFIRMED/);
  assert.equal(result.acceptance_status, "CANDIDATE_ONLY");
});

test("Hashrate parser rejects gaps, duplicates and invalid values", () => {
  const gap = JSON.parse(hashrateBody);
  gap.hashrates.splice(4, 1);
  assert.throws(() => parseHashrateSeries(gap, now), /daily gap/);
  const duplicate = JSON.parse(hashrateBody);
  duplicate.hashrates[2].timestamp = duplicate.hashrates[1].timestamp;
  assert.throws(() => parseHashrateSeries(duplicate, now), /duplicate UTC date/);
  const invalid = JSON.parse(hashrateBody);
  invalid.hashrates[0].avgHashrate = -1;
  assert.throws(() => parseHashrateSeries(invalid, now), /invalid_row/);
});

test("candidate capture preserves raw payload hashes and never claims production access", async () => {
  const fetchImpl = async url => {
    const body = String(url).includes("kraken") ? krakenBody : hashrateBody;
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  };
  const result = await runCapture({ fetchImpl, now });
  assert.equal(result.overall_status, "PASS_CANDIDATE_ONLY");
  assert.equal(result.production_database_accessed, false);
  assert.equal(result.production_writes_performed, false);
  assert.equal(result.sources.kraken_daily_ohlc.evidence.raw_body_sha256, sha256(krakenBody));
  assert.equal(result.sources.mempool_hashrate_history.evidence.raw_body_sha256, sha256(hashrateBody));
});
