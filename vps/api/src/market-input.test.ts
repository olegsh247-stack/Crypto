import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStoredQuoteRatio, parseCoinGeckoUsdTicker, parseRequestedDays } from "./market-input.js";

test("requested history days rejects invalid values and caps valid ranges", () => {
  for (const value of ["0", "-1", "1.5", "abc", "", "Infinity"]) {
    assert.deepEqual(parseRequestedDays(value, "1d"), { ok: false }, `days=${JSON.stringify(value)}`);
  }
  assert.deepEqual(parseRequestedDays(null, "1d"), { ok: true, days: 30 });
  assert.deepEqual(parseRequestedDays(null, "4h"), { ok: true, days: 7 });
  assert.deepEqual(parseRequestedDays("90", "1d"), { ok: true, days: 30 });
  assert.deepEqual(parseRequestedDays("90", "1h"), { ok: true, days: 7 });
});

test("CoinGecko ticker accepts USD only and preserves provider update time", () => {
  const data = { bitcoin: { usd: 65000, last_updated_at: 1_760_000_000 } };
  assert.equal(parseCoinGeckoUsdTicker("BTC", "USDT", "bitcoin", data), null);
  assert.equal(parseCoinGeckoUsdTicker("BTC", "USDC", "bitcoin", data), null);
  assert.deepEqual(parseCoinGeckoUsdTicker("BTC", "USD", "bitcoin", data), {
    price: 65000,
    timestamp: new Date(1_760_000_000 * 1000).toISOString(),
    source: "CoinGecko",
  });
});

test("CoinGecko ticker rejects missing, zero, negative and non-finite provider values", () => {
  for (const row of [
    undefined,
    { usd: 0, last_updated_at: 1_760_000_000 },
    { usd: 65000, last_updated_at: 0 },
    { usd: "not-a-price", last_updated_at: 1_760_000_000 },
    { usd: 65000, last_updated_at: "invalid" },
  ]) {
    assert.throws(() => parseCoinGeckoUsdTicker("BTC", "USD", "bitcoin", { bitcoin: row }));
  }
});

test("stored quote ratio excludes zero, missing, invalid and unmatched closes", () => {
  const result = normalizeStoredQuoteRatio(
    [
      { time: "t1", close: 100 },
      { time: "t2", close: 200 },
      { time: "t3", close: 300 },
      { time: "t4", close: 400 },
      { time: "t5", close: "bad" },
      { time: "t6", close: 600 },
    ],
    [
      { time: "t1", close: 10 },
      { time: "t2", close: 0 },
      { time: "t3", close: null },
      { time: "t4", close: "bad" },
      { time: "t5", close: 5 },
    ],
  );
  assert.deepEqual(result, [{ time: "t1", close: 10 }]);
});
