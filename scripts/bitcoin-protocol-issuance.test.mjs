import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateProtocolIssuanceSatoshisThroughHeight,
  protocolIssuanceBtcThroughHeight,
} from "./bitcoin-protocol-issuance.mjs";

test("genesis height includes exactly the first block subsidy", () => {
  assert.equal(calculateProtocolIssuanceSatoshisThroughHeight(0), 5_000_000_000n);
  assert.equal(protocolIssuanceBtcThroughHeight(0), 50);
});

test("first halving boundary uses 50 BTC before and 25 BTC at height 210000", () => {
  assert.equal(protocolIssuanceBtcThroughHeight(209_999), 10_500_000);
  assert.equal(protocolIssuanceBtcThroughHeight(210_000), 10_500_025);
});

test("second halving boundary uses 25 BTC before and 12.5 BTC at height 420000", () => {
  assert.equal(protocolIssuanceBtcThroughHeight(419_999), 15_750_000);
  assert.equal(protocolIssuanceBtcThroughHeight(420_000), 15_750_012.5);
});

test("current reviewed height reproduces the recorded issuance candidate", () => {
  assert.equal(protocolIssuanceBtcThroughHeight(972_351), 20_101_100);
});

test("rejects negative, fractional, unsafe, and non-numeric heights", () => {
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, "972351", NaN]) {
    assert.throws(() => calculateProtocolIssuanceSatoshisThroughHeight(value), TypeError);
  }
});

test("issuance is capped when the subsidy rounds to zero", () => {
  assert.equal(
    calculateProtocolIssuanceSatoshisThroughHeight(20_000_000),
    calculateProtocolIssuanceSatoshisThroughHeight(10_000_000),
  );
});
