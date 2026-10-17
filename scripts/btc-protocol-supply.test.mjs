import test from "node:test";
import assert from "node:assert/strict";
import { calculateProtocolIssuedSupplyBtc, calculateProtocolIssuedSupplySats } from "./btc-protocol-supply.mjs";

test("matches issuance boundaries at the first halving", () => {
  assert.equal(calculateProtocolIssuedSupplyBtc(0), 50);
  assert.equal(calculateProtocolIssuedSupplyBtc(209999), 10_500_000);
  assert.equal(calculateProtocolIssuedSupplyBtc(210000), 10_500_025);
});

test("matches issuance at the fourth halving boundary", () => {
  assert.equal(calculateProtocolIssuedSupplyBtc(839999), 19_687_500);
  assert.equal(calculateProtocolIssuedSupplyBtc(840000), 19_687_503.125);
});

test("reproduces the dated Blockchain.com supply point at its matching height", () => {
  assert.equal(calculateProtocolIssuedSupplyBtc(971189), 20_097_468.75);
});

test("calculates protocol issuance through a newer tip height in integer satoshis", () => {
  assert.equal(calculateProtocolIssuedSupplyBtc(971873), 20_099_606.25);
  assert.equal(calculateProtocolIssuedSupplySats(971873), 2_009_960_625_000_000n);
});

test("rejects invalid heights", () => {
  assert.throws(() => calculateProtocolIssuedSupplyBtc(-1), /non-negative safe integer/);
  assert.throws(() => calculateProtocolIssuedSupplyBtc(1.5), /non-negative safe integer/);
});
