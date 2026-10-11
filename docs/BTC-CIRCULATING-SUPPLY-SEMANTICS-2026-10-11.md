# BTC circulating-supply observation semantics — 2026-10-11

**Scope:** BTC only; metric `monetary.circulating_supply`, observation dated 2026-09-19.  
**Decision:** semantic/source gap confirmed; no data mutation.

## What the repository actually says

The clean-bootstrap baseline migration defines:

- Metric ID: `monetary.circulating_supply`
- Description: “Point-in-time circulating supply observation.”
- Unit: `BTC`
- Stored value: `20,086,198.00419505`
- Observation time: `2026-09-19T00:00:00Z`
- Source ID: `network.primary` (registered as Mempool.space)
- Source URL: **NULL**
- Methodology text: “Initial BTC dataset; point-in-time gettxoutsetinfo-derived estimate.”

The migration therefore does not preserve the RPC response, block height, best-block hash, `total_amount`, `total_unspendable_amount`, retrieval timestamp, or exact calculation. The metric's name/description is more specific than the evidence preserved with the observation.

## Semantic distinction

Bitcoin Core's `gettxoutsetinfo` reports a snapshot of the UTXO set, including `total_amount`, block height and best-block hash; depending on the RPC version/verbosity it can also report `total_unspendable_amount`. [Bitcoin Core RPC documentation](https://bitcoincore.org/en/doc/25.0.0/rpc/blockchain/gettxoutsetinfo/)

A UTXO-set total is not automatically identical to a general “circulating supply” metric. It represents coins represented by unspent transaction outputs at a particular chain state. It can include coins that are effectively lost but remain in spendable-looking outputs, and the unspendable-output treatment depends on the exact field/calculation. A reproducible observation must record which field was used and whether unspendable outputs were subtracted.

The current row cannot be independently reproduced from the stored metadata. Attaching the generic RPC documentation URL alone would document a method, not prove the exact historical number.

## Safe decision

1. Keep the existing observation unchanged and stale/unverified.
2. Do not attach a guessed URL, fabricate a block height/hash, or silently rename the existing metric.
3. Recover the original capture or rerun a read-only historical query at a specified block if the needed historical state is reproducible. Record block height, best-block hash, RPC/version, fields used, retrieval timestamp and calculation.
4. Decide whether the product needs:
   - a precise **UTXO-set total** metric, with a name/description reflecting the actual RPC field; or
   - a separately defined **circulating supply** metric with an explicit methodology and treatment of unspendable/lost/immature coins.
5. If the current metric ID is already consumed by factors, scores, signals or UI, preserve compatibility and introduce a separately reviewed metric definition rather than silently changing semantics in place.
6. Keep the correction revisioned and snapshot-aware; do not mutate `BTC-2026-10-07-v1` in place. Re-run the Worker/VPS contract gate after any accepted correction.

## Acceptance impact

The current value may be a useful UTXO-set-derived estimate, but the stored record does not prove that it is circulating supply or permit exact reproduction. It must not be used as a validated circulating-supply input for the BTC scenario. No observation, metric definition, published snapshot, database, monitoring signal or scenario state was changed.
