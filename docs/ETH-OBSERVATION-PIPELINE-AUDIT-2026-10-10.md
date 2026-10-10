# ETH Observation Pipeline — Schema Audit and Implementation Plan

**Date:** 2026-10-10  
**Issue:** [#5 — ETH vertical slice: persist dated numeric observations and evaluate monitoring signals](https://github.com/olegsh247-stack/Crypto/issues/5)  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Read-only source audit. No database writes, migrations, deployments, or scenario-state publication.

## 1. Findings from the canonical model

The existing `observations` table in `infrastructure/neon/schema-v1.sql` already supports the core provenance needed for numeric measurements:

- `metric_id` and optional `asset_id`;
- typed values, with a check requiring exactly one of numeric/integer/boolean/text/JSON;
- `unit`, `observed_at`, `period_start`, `period_end`;
- `source_id`, `source_url`, `methodology`;
- `status`, `freshness`, `revision`, and `created_at`.

The canonical `sources` and `metric_definitions` tables are present. The table has lookup indexes by metric/asset/time and source/time. The market-candle table is a separate instrument-history store and must not be treated as a substitute for metric observations.

**Initial conclusion:** no new observation columns are justified yet. The existing model can represent the required data lineage without a schema migration.

## 2. Confirmed gaps

1. ETH's current published snapshot contains qualitative research evidence, not the dated numeric series required to evaluate the six qualitative monitoring signals.
2. ETH's seeded signal `current_value` is a JSON object containing a description; it is not a numeric observation. `previous_value` and thresholds are not yet populated for these signals.
3. `observations.observation_id` is generated randomly and the base schema does not itself show a natural-key uniqueness constraint for idempotent numeric ingestion. Before implementing writes, inspect every applied migration and existing uniqueness/index definitions. If no appropriate constraint exists, propose a narrowly scoped additive uniqueness rule that preserves intentional revisions; rehearse it against a disposable PostgreSQL database before considering any target database.
4. The metric registry file is primarily a BTC reference registry. ETH-specific numeric metric definitions must be explicit and must not be inferred by relabeling BTC metrics.
5. The existing public market-candle ingestion has fallback providers and normalizes candles into a common table. That path is suitable for price history, but does not provide supply-flow, L1 fee, L2 scale, or staking-queue observations.

## 3. Proposed first metric contract (capture-only; not yet approved for ingestion)

Keep these data series independent. Each capture record must carry the provider's actual observation time/window, source URL, units, method, and quality caveats.

| Series | Proposed definition | Unit / window | Candidate source | Important caveat |
|---|---|---|---|---|
| ETH spot price | Provider's ETH/USD or ETH/USDT spot quote; preserve quote currency and pair | USD or USDT per ETH; point-in-time | Existing market-provider adapter, initially Binance public market data | USDT is not identical to USD; timestamp should be provider time if exposed, not capture time masquerading as observation time |
| Net supply flow | Net ETH supply change over a fully specified interval; issuance and burn should be separately retained if the source exposes them | ETH per day; daily interval | A documented Ethereum supply dataset/API to be selected after source and methodology verification | Do not calculate from partial issuance/burn components or mix cumulative supply with flow |
| L1 network fees | Actual L1 execution fees paid over a defined interval, using a documented fee definition | ETH per day or USD per day; daily interval | Ethereum node/indexer or a documented public analytics endpoint | Gas price alone is not total fees; avoid conflating gas price, fees burned, and validator tips |
| L2 scale | Total value secured (TVS) or another explicitly named aggregate, with a fixed L2 universe and source methodology | USD; provider snapshot time | L2BEAT public API/data | TVS is not transaction count and can change with asset prices or methodology |
| Staking queue | Validator entry and exit queue sizes or wait times, stored as separate metrics | validators and/or estimated days; point-in-time | Ethereum consensus/staking queue source with public documented endpoint | Do not combine entry and exit queues; preserve source's estimate and timestamp |

These are candidate definitions, not current measured values. A metric should be omitted from the first capture if its authoritative endpoint, units, or time semantics cannot be validated. No values should be fabricated to fill a row.

## 4. Implementation sequence

1. Finish the current-head Product Contour Gate, VPS Build Rehearsal, and on-chain capture workflow checks.
2. Complete a repository-wide inventory of observation-related constraints, metric definitions, monitoring signal schema, admin route patterns, and Worker/VPS parity.
3. Build a read-only capture/rehearsal artifact. Validate types, finite numeric values, timestamps, interval boundaries, source identity/URL, units, and provider error states. Do not write to the database.
4. Decide the natural key/revision behavior for idempotent observations, based on the actual schema and migrations; add a migration only if the current schema cannot enforce the required semantics safely.
5. Implement a controlled, admin-protected ingestion path using existing tables and explicit metric definitions. Ordinary CI must use disposable storage and must not write production data.
6. Evaluate signals only from persisted, validated observations. Record previous/current values, direction, threshold and evaluation timestamp atomically on successful evaluation. On failure, leave the prior signal state and timestamp unchanged.
7. Add parity tests for Worker and VPS implementations. Candle ingestion alone must not change signal evaluation timestamps.
8. Reconcile evaluated measurements to ETH's published snapshot, factors and scenario assumptions. Prepare a candidate scenario assessment for review only after the evidence chain is complete.

## 5. Non-goals and safety boundary

- Do not mutate the published `ETH-2026-10-04-v1` snapshot.
- Do not create monitoring events without a real configured trigger.
- Do not create a scenario state or score to make the interface appear complete.
- Do not expose an admin token in browser code.
- Do not run a production migration, write production observations, deploy, merge PR #3, or provision a VPS as part of this audit.
- Keep the UI state as **State not recorded** until a dated assessment has been reviewed and explicitly approved.

## 6. Acceptance

This audit is complete only as a planning artifact. Issue #5 remains open until capture validation, idempotent controlled ingestion, reproducible signal evaluation, API contract tests, and both Product Contour Gate and VPS API Build Rehearsal pass on the resulting code.


## 7. Capture rehearsal and additional implementation findings — 2026-10-10

The first successful read-only capture run is available as [ETH Observation Capture #2](https://github.com/olegsh247-stack/Crypto/actions/runs/38035169834), with artifact `eth-observation-capture-38035169834` (7-day retention). It produced two numeric candidate records (ETH/USDT spot price and one block's base-fee burn), recorded four explicit metric gaps, and performed no database or blockchain writes.

Observed source behavior:
- Binance ticker endpoint returned a positive price, but its response does not carry a provider observation timestamp. The record therefore labels the timestamp as capture-time proxy and keeps the unit as `USDT/ETH`.
- Ethereum public JSON-RPC returned a latest block and fields needed for a single-block base-fee burn calculation. This is not total fees and is not a daily series.
- The documented L2BEAT TVS request failed in the first capture. The payload was not mapped into a numeric observation. The endpoint/query/response contract must be corrected and verified before using it.
- Net supply flow and separate staking entry/exit queues remain unmeasured gaps.

Additional repository inventory:
- The canonical seed registry is BTC-centric. Existing `market.spot_price` is described as BTC and defaults to `USD/BTC`; ETH measurements must not reuse that metric ID. The capture script now uses separate `eth.*` metric IDs.
- `market_binance` exists in the market-data source migration. `ethereum_public_rpc` is a proposed source ID and is not yet registered; the future ingestion package must add only verified source/metric definitions through a reviewed migration/seed path.
- The current Worker and VPS API source files do not expose a dedicated read-only observations endpoint. This is an API contract gap to address after metric/source definitions and the observation idempotency key are agreed.
- The base observations schema has no visible natural-key uniqueness constraint for idempotent insertion. Do not implement upserts against a guessed key. First define the revision semantics and rehearse the exact constraint/index on disposable PostgreSQL.

The capture workflow's successful status validates script syntax, artifact structure and safety assertions; it does not mean all five metric families have been sourced or that the artifact is ready for database ingestion.
