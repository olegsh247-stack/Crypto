# BTC Fee/Subsidy Metric Contract Decision — 2026-10-13

**Status: decision prepared; no metric registry or calculation changed.**
**Scope:** BTC only, offline contract review. No production database access or writes.

## Existing contract conflict

Two repository contracts do not fully align:

- `data/CryptoDataModel/registry/metric-registry.json` defines `security.fee_subsidy_ratio` with unit `ratio`, frequency `1d`, freshness `48h`, source priority `network.primary`.
- The source registry description for Mempool says the ratio should be fees divided by subsidy over a documented rolling block window.
- The recent staging artifact validates 165 unique blocks and calculates a candidate 144-block ratio of `0.006309380666666667` from total fees `283922130` sats and subsidy `45000000000` sats. This proves the arithmetic for that selected window; it does not resolve the product metric's time-window definition.

Do not change the registry or label a rolling 144-block result as a calendar-day observation without an explicit decision.

## Contract options

### Option A — completed UTC calendar day (recommended default)

- Select all canonical main-chain blocks whose consensus block timestamp falls within the same UTC date `[00:00:00, next 00:00:00)`.
- Numerator: sum of actual transaction fees in satoshis for those blocks.
- Denominator: sum of the protocol subsidy in satoshis for those same blocks. Exclude transaction fees from the denominator; the metric is fees divided by subsidy.
- Formula: `sum(block_fees_sats) / sum(block_subsidy_sats)`.
- Publish only after the UTC date is complete and the required block range is verified; timestamp the observation with the completed UTC date, while retaining each included height/hash and its block timestamp.
- Handle missing blocks, reorgs, duplicate hashes/heights, or unavailable fee/subsidy fields as blocked—not zero.
- This matches the metric registry's explicit `frequency: 1d` and gives an unambiguous calendar period. A day may contain a different number of blocks; the denominator uses the actual included block count and subsidy at each height.

### Option B — rolling 144-block window

- Select the latest 144 consecutive canonical main-chain blocks ending at a captured tip height.
- Formula: `sum(fees_sats over window) / sum(subsidy_sats over window)`.
- Record first/last heights and hashes, the tip hash, each block timestamp, and the retrieval time. The observation time must identify the window endpoint, not pretend the window is a UTC calendar day.
- Require all 144 heights, unique hashes, canonical-chain continuity, valid subsidy by height, fee field/unit verification, and reorg handling.
- This better matches the source registry's current phrase “rolling block window,” but requires an explicit metric-registry frequency/window contract rather than `1d` alone.

## Recommendation and approval boundary

**Recommended for v1:** Option A, completed UTC calendar day, because the canonical metric registry explicitly says `frequency: 1d`. Before implementation, reconcile or revise the source registry's rolling-window note and add fixtures for a completed day, missing blocks, subsidy-era boundary, duplicate/reorged blocks, and zero-fee blocks.

If the product owner instead intends Option B, first change the metric contract explicitly to a rolling 144-block window and define the observation timestamp/freshness semantics. Do not implement both as interchangeable values under the same metric ID.

No option is activated by this document. The existing staging ratio remains `CANDIDATE_ONLY`; no production observation, scenario state, monitoring event, or published probability was written.
