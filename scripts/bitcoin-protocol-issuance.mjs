const SATOSHIS_PER_BTC = 100_000_000n;
const INITIAL_SUBSIDY_SATOSHIS = 50n * SATOSHIS_PER_BTC;
const HALVING_INTERVAL_BLOCKS = 210_000;

export function calculateProtocolIssuanceSatoshisThroughHeight(height) {
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new TypeError("height must be a non-negative safe integer");
  }

  let remainingBlocks = BigInt(height) + 1n;
  let subsidy = INITIAL_SUBSIDY_SATOSHIS;
  let total = 0n;
  const interval = BigInt(HALVING_INTERVAL_BLOCKS);

  while (remainingBlocks > 0n && subsidy > 0n) {
    const blocksThisEra = remainingBlocks < interval ? remainingBlocks : interval;
    total += blocksThisEra * subsidy;
    remainingBlocks -= blocksThisEra;
    subsidy /= 2n;
  }

  return total;
}

export function protocolIssuanceBtcThroughHeight(height) {
  const satoshis = calculateProtocolIssuanceSatoshisThroughHeight(height);
  return Number(satoshis) / Number(SATOSHIS_PER_BTC);
}
