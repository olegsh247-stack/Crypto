const SATOSHIS_PER_BTC = 100_000_000n;
const HALVING_INTERVAL = 210_000;
const INITIAL_SUBSIDY_SATS = 50n * SATOSHIS_PER_BTC;

/**
 * Computes protocol-scheduled coinbase subsidy issued through tipHeight inclusive.
 * This is total protocol issuance, not economically spendable supply or UTXO supply.
 */
export function calculateProtocolIssuedSupplySats(tipHeight) {
  if (!Number.isSafeInteger(tipHeight) || tipHeight < 0) {
    throw new TypeError("tipHeight must be a non-negative safe integer");
  }
  const lastEra = Math.floor(tipHeight / HALVING_INTERVAL);
  let totalSats = 0n;
  for (let era = 0; era <= lastEra; era += 1) {
    const firstHeight = era * HALVING_INTERVAL;
    const lastHeight = Math.min(tipHeight, firstHeight + HALVING_INTERVAL - 1);
    const blockCount = BigInt(lastHeight - firstHeight + 1);
    const subsidySats = INITIAL_SUBSIDY_SATS >> BigInt(era);
    totalSats += blockCount * subsidySats;
  }
  return totalSats;
}

export function calculateProtocolIssuedSupplyBtc(tipHeight) {
  return Number(calculateProtocolIssuedSupplySats(tipHeight)) / Number(SATOSHIS_PER_BTC);
}
