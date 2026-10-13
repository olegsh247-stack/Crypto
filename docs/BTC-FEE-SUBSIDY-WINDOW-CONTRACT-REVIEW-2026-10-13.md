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


## Capture implementation inspection

The read-only capture script on branch `btc-capture-freshness-gates-2026-10-13` was inspected against the endpoint constraints above. It currently requests the individual-block endpoint in 11 pages of 15 blocks (165 validation rows), then separately slices the latest 144 rows as a **proposed** metric window. This is sufficient in shape to collect more than one response, but it is not yet a complete reorg-safe or contract-approved observation pipeline.

Specific gaps to close before accepting the candidate:

- The capture obtains the tip height but does not capture the tip hash before collection and re-check the tip/boundary hash after collection. A height-only anchor cannot detect every tip change or reorganization during the multi-request capture.
- Page evidence records URL, HTTP payload hash, and retrieval time, but not each response's HTTP status code or content type in the page manifest. Preserve these so failed/non-JSON responses are auditable without relying only on thrown errors.
- The code derives subsidy as `extras.reward - extras.totalFees` and compares every sampled block to the current-era subsidy constant. That is a useful recent-block diagnostic, not a general definition across subsidy-era boundaries. Contract tests should derive/validate the expected subsidy from block height and halving rules, or explicitly constrain the sample to a single known era.
- The current parser allows repeated heights with the same hash to overwrite an earlier row, and does not assert that each page contains the exact expected heights or the expected page length. Final missing-height checks catch gaps in the union, but page-level boundary and overlap checks should be explicit.
- The review payload calls the validation window 165 blocks in its fields, while a nearby note says “Last 150 individual blocks”. Align labels to the actual 165-row validation set to avoid misleading audit evidence.
- The script records a candidate ratio, but it must remain candidate-only until the product contract explicitly chooses the 144-block window or UTC-day method and the registry/source/monitoring definitions agree.

These are implementation-review findings, not production failures: the script is explicitly read-only and the captured ratio is not accepted. No metric, registry, scenario, monitoring or database state was changed by this review.

## Next implementation sequence

1. Add tip-height **and tip-hash** capture before the first page; after the last page, re-read both and block the candidate if the anchor changes. Where practical, also verify the first/last boundary hashes against the captured chain view.
2. Preserve per-page HTTP status, content type, retrieval timestamp, requested start height, returned heights and raw payload hash.
3. Reject malformed pages, unexpected heights, duplicate heights (even if the hash is identical), conflicting hashes, missing rows, and any gap/overlap not explicitly expected by the paging contract.
4. Make the subsidy check height-aware, with deterministic fixtures for the current era and halving boundaries.
5. Correct the 150-versus-165 wording and add regression tests for all gates above.
6. Keep the resulting ratio candidate-only; do not enable ingestion or scenario evaluation as part of these changes.


## Source implementation cross-check

The current public Mempool repository's `backend/src/api/blocks.ts` constructs `extras.reward` by summing the coinbase transaction output values and assigns `extras.totalFees` from its block-statistics `totalfee` field. See the upstream implementation: https://github.com/mempool/mempool/blob/master/backend/src/api/blocks.ts

This supports the **field relationship** used by the candidate calculation: coinbase reward includes the block subsidy plus transaction fees, so the proposed subtraction is `coinbase outputs total - total block fees`. It does not, by itself, complete the units contract: the underlying amount representation and API serialization still need a pinned source/version or a deterministic fixture cross-checked against known block data. Therefore the candidate's current-era subsidy match remains a diagnostic, not final unit authorization. Do not remove the units gate based only on matching one observed value.
