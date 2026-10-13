# BTC Fee/Subsidy Ratio — Window Contract Review

**Date:** 2026-10-13  
**Scope:** BTC-only metric contract review.  
**Status:** Contract options documented; no option activated in code or registries.

## Finding

The canonical metric entry for `security.fee_subsidy_ratio` specifies:

- unit: `ratio`
- frequency: `1d`
- freshness window: `48h`
- source priority: `network.primary`
- validation: value is non-negative

The source registry's Mempool description refers to a documented rolling block window. The monitoring readiness matrix requires a consistent rolling series and says a one-off 144-block context value is not yet a validated trend.

These statements reveal an unresolved window contract. `frequency: 1d` describes observation cadence; it does not alone decide whether the calculation period is a UTC calendar day or a rolling block window. A daily-sampled rolling series and a completed-day series are different definitions and must not be mixed under the same metric ID without an explicit contract.

## Public API constraints verified

The [Mempool.space REST API documentation](https://mempool.space/docs/api/rest) describes:

- `GET /api/v1/blocks/:startHeight` as returning the 15 blocks up to and including the requested height, with fee/mining details in `extras`.
- `GET /api/v1/blocks-bulk/:minHeight/:maxHeight` as returning an inclusive range of up to 10 blocks.
- `GET /api/blocks/tip/height` and `GET /api/blocks/tip/hash` as separate tip reference endpoints.

Consequences for a 144-block candidate:
- A single `/api/v1/blocks/:startHeight` response is not a 144-block window.
- The documented bulk endpoint requires multiple bounded requests; respect public API rate limits and retain each request's status, URL, retrieval time and raw payload hash.
- Capture tip height and hash, then validate the requested block range against the best chain. Re-check the boundary hash/tip after collection to detect a tip change or reorg during capture.
- Do not assume `extras.totalFees` and `extras.reward` semantics/units from field names alone; verify against the documented implementation/source and fixtures before using `reward - fees` as subsidy.

## Options to resolve

### Option A — completed UTC calendar day

For each completed UTC date, select all canonical main-chain blocks whose consensus timestamps fall in `[00:00:00, next 00:00:00)`.

`ratio = sum(block_fees_sats) / sum(block_subsidy_sats)`

- Use the exact same block set for numerator and denominator.
- Publish only after the UTC day is complete.
- Retain included block heights/hashes and timestamps, calculation version, raw source URL, retrieval time and payload hash.
- Missing blocks, reorgs, duplicate heights/hashes, or missing fee/subsidy fields block the observation; never substitute zero.
- The number of blocks per day may vary. Use the actual subsidy at each included height.

This aligns directly with the registry's `frequency: 1d` and gives an unambiguous calendar period. It is the default recommendation in the earlier decision note, conditional on reconciling the source registry's rolling-window wording.

### Option B — rolling 144-block window

Select the latest 144 consecutive completed canonical main-chain blocks ending at a captured tip height.

`ratio = sum(fees_sats over window) / sum(subsidy_sats over window)`

- Record first/last heights and hashes, tip hash, timestamps, retrieval time, calculation version and raw payload hash.
- Require 144 consecutive heights, unique hashes, canonical-chain continuity, valid fee units and subsidy at each height, and a documented reorg/revision policy.
- A rolling-window observation timestamp identifies the window endpoint; it must not be presented as a UTC calendar-day value.
- Daily sampling may be used, but the window and freshness semantics must be explicitly represented in the metric contract.

This aligns with the source registry's rolling-window wording, but requires an explicit calculation-window contract rather than relying on `frequency: 1d` alone.

## Decision boundary

**No final metric-window decision is made by this review.** The earlier decision note recommends Option A for v1 because the canonical metric registry states `frequency: 1d`; this note records the conflicting rolling-window wording and the alternative Option B so the conflict is visible rather than silently selecting one interpretation.

Before implementation, the product contract must choose exactly one option and align the metric registry, source registry, monitoring matrix and calculation tests. Do not calculate both definitions into one time series or label one as the other.

## Acceptance gates before activation

- [ ] Confirm Mempool.space endpoint/raw fields and fee/subsidy units for individual blocks.
- [ ] Choose Option A or Option B and align registry wording.
- [ ] Add deterministic tests for missing blocks, duplicate heights/hashes, malformed values, zero fees, subsidy-era boundaries, stale retrieval and reorg/revision behavior.
- [ ] Define the natural key and revision/reorg policy.
- [ ] Preserve the raw source payload and calculation inputs for every candidate.
- [ ] Run only a disposable/local PostgreSQL rehearsal; do not write candidate observations to production.
- [ ] Re-run BTC scenario readiness after all required input contracts are accepted.

## Safety boundary

This document changes no calculation, source priority, registry entry, probability, scenario state, monitoring event, or database record. Captured values remain candidates. The BTC scenario remains `not_evaluable` until all required input acceptance gates are satisfied.
