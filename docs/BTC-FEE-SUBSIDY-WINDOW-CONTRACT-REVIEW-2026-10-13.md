# BTC Fee/Subsidy Ratio — Window Contract Review

**Date:** 2026-10-13  
**Scope:** BTC-only metric contract review.  
**Status:** Proposed contract for review; not activated in code or registries.

## Finding

The current canonical metric entry for `security.fee_subsidy_ratio` specifies:

- unit: `ratio`
- frequency: `1d`
- freshness window: `48h`
- source priority: `network.primary`
- validation: value is non-negative

The BTC monitoring readiness matrix describes this input as a **consistent rolling series** and explicitly says a one-off 144-block context value is not yet a validated rolling trend.

These statements are compatible. The metric's `frequency: 1d` specifies the observation cadence; it does not, by itself, require the numerator and denominator to be bounded by UTC calendar-day boundaries. Treating cadence and calculation window as the same concept created the apparent conflict.

## Recommended v1 contract

For each daily observation, calculate the ratio across the latest **144 consecutive completed Bitcoin blocks** available at the observation cutoff:

`ratio = sum(transaction_fees_sats) / sum(block_subsidy_sats)`

Contract details:

1. Use completed canonical-chain blocks only; never include a partial or future block.
2. Use the same exact block set for fee and subsidy totals.
3. Define the observation timestamp as the UTC cutoff/retrieval time, and retain the first/last block heights and hashes, block count, calculation version, raw source URL, retrieval time, and raw payload hash.
4. Require 144 consecutive heights, unique block hashes, valid non-negative fee totals, and positive total subsidy for the window. Fail closed if any check fails.
5. Emit at most one accepted observation per UTC day for v1. If the window is incomplete or provenance is insufficient, emit no observation rather than a partial ratio.
6. Keep the 144-block window explicit in metadata. Do not silently substitute a UTC-calendar-day ratio, a fee-per-block average, a USD-denominated value, or a single-block ratio.
7. Preserve raw source observations and make repeated logical-key writes idempotent in a future approved ingestion path.

The 144-block window is a rolling approximation of roughly one day of blocks, not a fixed 24-hour duration. Its exact block boundaries must remain auditable.

## Why this is the better fit

- It matches the monitoring matrix's rolling-series requirement.
- It preserves daily observation cadence without pretending that block production is uniform in wall-clock time.
- Fees and subsidy are aggregated over the same blocks, avoiding mismatched calendar windows.
- It makes trend comparisons more reproducible than treating one point-in-time 144-block calculation as a trend.

A completed-UTC-day ratio remains a possible alternative only if the product explicitly chooses calendar-day economics over the existing rolling-series requirement. Do not combine the two definitions in one time series.

## Acceptance gates before activation

- [ ] Confirm the Mempool.space endpoint/raw fields and unit conversions for fees and subsidy at block level.
- [ ] Validate the window against 144 consecutive completed blocks and retain first/last heights and hashes.
- [ ] Add deterministic tests for gaps, duplicate heights/hashes, zero subsidy, malformed values, stale retrieval, and a reorg/revision affecting the window.
- [ ] Define the natural key and revision/reorg policy.
- [ ] Update the metric registry or attach a machine-readable calculation contract so the rolling window is not implicit.
- [ ] Run only a disposable/local PostgreSQL rehearsal; do not write candidate observations to production.
- [ ] Re-run BTC scenario readiness after all required input contracts are accepted.

## Safety boundary

This document changes no calculation, source priority, registry entry, probability, scenario state, monitoring event, or database record. Captured values remain candidates. The BTC scenario remains `not_evaluable` until the complete input acceptance gates are satisfied.
