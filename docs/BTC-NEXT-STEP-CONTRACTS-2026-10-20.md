# BTC next-step contracts and source-priority decisions — 2026-10-20

## Mandatory operating rule: resolve discrepancies and continue

A difference between providers for the same reporting date is **not by itself a blocker** and must not cause repeated work on a historical date. For each metric, choose a canonical source by an explicit source-priority rule, record the choice and its limitations, and continue. Do not average conflicting values unless a defined metric methodology explicitly requires it. Reopen a settled historical discrepancy only when new evidence materially changes source quality, row identity, or methodology.

For the 2026-10-07 BTC ETF flow discrepancy, use **SoSoValue/TFTC as the preferred research candidate** for the current aggregate because the captured values are available at greater precision and the TFTC dataset identifies SoSoValue as an upstream source. This is a source-priority choice for test/offline research, **not** a claim that the two are independent sources or that the value is final. Farside remains a secondary comparison only. Do not average the two. Record the selected value from the current capture; do not turn a historical discrepancy into a continuing blocker.

## Fee/subsidy ratio contract

- Primary source candidate: mempool.space exact per-block fees and rewards, aligned by block height.
- Raw units: satoshis. Convert to BTC only for display, using 100,000,000 sat/BTC.
- Canonical window: the latest 144 consecutive **confirmed block heights** in the captured chain view, inclusive of both endpoints.
- Formula: sum(realized transaction fees in sats over the selected window) / sum(block subsidy in sats over the same window). This is a dimensionless ratio; display as a percentage only by multiplying by 100.
- Derive subsidy per block from the versioned Bitcoin halving schedule and the block height, or calculate total reward minus realized fees only where the endpoint's reward semantics are documented and validated. Do not use fee-rate estimates or mempool fee projections as realized fees.
- Store method version, window start/end heights, per-block hashes where available, capture time, source endpoint, units, raw-response hash, and computed numerator/denominator.
- Reorg policy: identify blocks by height **and hash**, not height alone. Before accepting the window, recheck the endpoint's tip and the hashes at the window boundaries (or refetch the full window); if a hash changes, discard the affected calculation and recompute from a coherent chain snapshot. Do not mix rows from different chain tips. A short-lived tip movement during capture is a retry condition, not a reason to alter the scenario.
- Existing evidence: the 144-block aggregate from run [#39457465132](https://github.com/olegsh247-stack/Crypto/actions/runs/39457465132) reconciled exactly with per-block sums: 181,863,392 sat fees; 45,181,863,392 sat total rewards; 45,000,000,000 sat subsidy; fee/subsidy = 0.40414%. Latest matched block 972351 had 5,498,540 sat fees and 312,500,000 sat subsidy, ratio 1.75953%. These are reproducible research results, not a production/runtime metric.

## BTC issuance identity and calculation

- Do not treat a height-only `/api/blocks/tip/height` response as a complete block identity.
- Obtain `/api/blocks/tip` (or the equivalent block lookup) and record tip height, block hash, block timestamp, retrieval time, HTTP status, and response hash together. Confirm that the height and hash agree.
- Issuance formula is the sum of the height-dependent subsidy for every height from genesis through the selected inclusive tip height, with subsidy halving every 210,000 blocks and integer satoshi arithmetic. Record the schedule/calculator version.
- Unit tests must cover heights immediately before, at, and after each relevant halving boundary, plus the current era; reject floating-point rounding in the core calculation.
- The existing height 972351 / 20,101,100 BTC result is only a research candidate until bound to a hash and timestamp. Label it theoretical cumulative issuance, not economic circulating supply. Do not silently substitute it for a circulating-supply metric.

## ETF repeat capture

- Repeat the existing one-off read-only SoSoValue test capture; do not enable a schedule or production ingestion.
- Compare reporting-date sets and per-fund/aggregate values against the prior snapshot. Compare response hashes as a change signal, not as proof of a semantic revision by themselves.
- Report only changed rows, added/missing dates, and meaningful schema changes. Preserve reporting date separately from publication/observation and retrieval times. Missing/unpublished date is not zero.
- For conflicting same-date values, apply the source-priority rule above and continue; no averaging. If the provider does not expose finality/revision metadata, mark finality unknown rather than blocking all other work.

## DXY and offline scenario

- DXY remains optional for the first BTC scenario. Use Yahoo Finance `DX-Y.NYB` only as the already tested manual/offline research reference; do not promote it to automated/runtime priority based on HTTP success alone. Do not substitute FRED `DTWEXBGS` under the DXY identity.
- Finish the offline scenario replay with a frozen, review-only fixture. Every input must include source, units, observation/session time, retrieval time where available, freshness, provenance, and method version. Use the selected ETF source consistently.
- The replay must be deterministic and must not write production data, change registry/source priorities, persist scenario state, or change probabilities. Record exact blockers that are genuinely required by the scenario contract; provider disagreement for an already resolved historical date is not one.

## Safety boundary

This document records test-stage decisions only. No live production ingestion, production DB write, runtime registry change, scheduled collection, deployment, merge, scenario-state persistence, or probability update is authorized. BTC remains `not_evaluable` until required live-input gates and the offline review are actually passed.
