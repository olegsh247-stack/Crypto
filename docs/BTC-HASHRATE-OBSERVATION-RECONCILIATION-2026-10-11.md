# BTC hashrate observation reconciliation — 2026-10-11

**Scope:** BTC only; stored metric `security.hashrate`.  
**Decision:** source/date mismatch confirmed; no data mutation.

## Finding

The stored pair `1001 EH/s` with `observed_at = 2026-09-19` does not match the cited Shattered article's stated date. That article describes roughly **1,001 EH/s on 2026-09-04**, and its narrative distinguishes that one-day spike from rolling averages. [Shattered article](https://shattered.io/bitcoin-hashrate-zettahash-difficulty-2026/)

A separate historical series published by Satoshi Gazette, derived from mempool.space daily estimates, reports approximately **826 EH/s for the UTC day 2026-09-19**. Its page explicitly warns that daily estimates fluctuate with block-finding luck and are not a direct count of machines. [Dated historical series](https://satoshigazette.org/data/mining?end=2026-10-11&window=30)

These values should not be treated as two measurements of an identical metric without confirming aggregation and timestamp semantics. The 1,001 figure is tied to a 4 September snapshot; 826 is a daily estimate for 19 September. A separate difficulty-retarget estimate reported around 950 EH/s on 19 September is a different aggregation/window again. [BTC.network difficulty retarget report](https://btc.network/nl/blog/epoch-480-bitcoin-difficulty-jumps-4-2-percent)

## Data-contract issue

The current stored metric identifier and value do not expose enough metadata to distinguish:
- instantaneous/snapshot estimate versus full-UTC-day estimate;
- daily estimate versus 7-day or 30-day rolling mean;
- source-reported timestamp versus observation window end;
- estimate method and source revision.

Consequently, simply changing 1,001 to 826 would fix one date mismatch only if the product intends a daily estimated-hashrate metric. It could otherwise silently change the metric's semantics. Neither number is a direct measurement of physical mining equipment.

## Safe decision

1. Keep the existing observation unchanged and stale/unverified.
2. Do not move its timestamp to 4 September or overwrite it with 826 EH/s.
3. Inspect the canonical metric registry and original ingestion artifact to determine the intended aggregation and whether the current metric ID is used elsewhere.
4. If the intended contract is daily estimated hashrate, create a revisioned observation for 19 September with the selected source, explicit UTC-day window, retrieval timestamp, estimate method and source URL; preserve the original record as superseded/preliminary rather than rewriting history.
5. If the intended signal is network security trend, prefer a defined rolling window (for example, 7-day mean) with a stable source/method and separate metric semantics from a single-day estimate.
6. Re-run Worker/VPS parity and source-level acceptance after any reviewed data-contract change.

## Acceptance impact

The historical date/value pair is not source-supported as currently recorded. This remains a blocker for scenario assessment, but it does not justify selecting a replacement value without a metric-definition decision. No observation, published snapshot, database, monitoring signal or scenario state was changed.
