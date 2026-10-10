# ETH Monitoring Signal Mapping — 2026-10-10

**Issue:** [#5 — ETH vertical slice](https://github.com/olegsh247-stack/Crypto/issues/5)  
**Branch:** `fix/product-contour-v1-contracts`  
**Status:** Mapping proposal; no numeric thresholds approved and no signal evaluator writes implemented.

## Purpose

Define what evidence is required for each ETH monitoring signal before implementing a numeric evaluator. This document does not change the published `ETH-2026-10-04-v1` snapshot, assign current scenario state, or authorize production writes.

The research artifact lists six thesis signals:

1. ETH settlement/data demand
2. ETH net issuance/burn balance
3. L2 activity versus ETH value accrual
4. Glamsterdam execution on schedule
5. Competitive share loss to alternative L1s
6. Staking concentration

The signal names are thesis questions, not ready-to-run metric definitions. Numeric thresholds must not be inferred from the qualitative words “improving”, “material”, or “on schedule”.

## Mapping matrix

| Signal | Required observations | Window / comparison | What current capture can support | Missing evidence / decision boundary |
|---|---|---|---|---|
| **Settlement/data demand** | Daily L1 execution fees; blob/data fees or blob usage; a stable L1 settlement activity series | Daily observations plus comparable 7-day and 30-day aggregates | One block's base-fee burn is a chain-level point observation only | A single block does not establish daily demand. Need documented daily fee/activity source and consistent aggregation. |
| **Net issuance/burn balance** | Gross consensus-layer issuance and ETH burn retained separately; derived net issuance = issuance − burn | Daily series and comparable rolling 7-day / 30-day windows | None of the current two metrics measures gross issuance or net supply flow; single-block base-fee burn is only one component | Do not derive net issuance from burn alone. Need verified issuance definition, burn components, units and interval alignment. |
| **L2 activity vs ETH value accrual** | L2 activity (transactions/UOPS) and a fixed-universe L2 scale measure; Ethereum blob/data fees or settlement fees | Same time window and a stable L2 universe; keep USD-denominated TVS separate from activity counts | No L2 series is currently captured | L2BEAT TVS requires approved API access and schema validation. TVS is not transaction count or ETH value accrual. Need comparable activity and L1 economic-value data. |
| **Glamsterdam execution on schedule** | Official milestone status, planned date, confirmation date/status and source URL from Ethereum Foundation / official roadmap | Event/milestone state with explicit “target”, “testnet”, “mainnet confirmed”, “delayed” semantics | No current numeric observation supports this signal | This is a source-backed milestone/event signal, not a price or fee threshold. Do not mark “on schedule” from an announcement alone or treat a testnet milestone as mainnet delivery. |
| **Competitive share loss to alternative L1s** | Comparable activity or fee share across a declared peer set; consistent methodology and provider coverage for ETH and alternatives | Same daily/weekly windows, same metric definition and fixed peer universe | None of the current capture metrics measures competitive share | Need a defensible peer universe and consistent cross-chain data. Raw absolute activity from unlike chains is not a share metric. |
| **Staking concentration** | Validator/provider concentration (e.g. a documented share or concentration index), plus separate entry-queue and exit-queue observations where relevant | Repeated dated observations; compare like-for-like provider categories and windows | None of the current capture metrics measures concentration or queues | Entry and exit queues are not concentration metrics and must remain separate. A single queue snapshot cannot establish a trend. |

## Existing capture metrics and limitations

The read-only capture currently proposes two independently defined numeric observations:

- `eth.market_spot_price` — unit `USDT/ETH`; Binance does not return a provider-issued observation timestamp, so capture time is explicitly a proxy. This metric is market context only and must not alone trigger a thesis transition.
- `eth.base_fee_burned_per_block` — unit `ETH/block`; `baseFeePerGas × gasUsed` for one execution-layer block. It excludes priority fees and is not a daily fee series or net issuance measure.

The source/metric registry and idempotency migration are present on the branch and tested on disposable PostgreSQL. No production migration or observation write has been performed.

## Threshold contract — not yet populated

Before any signal can be evaluated numerically, its configuration must specify:

- the exact registered `metric_id` and source-quality policy;
- units, observation cadence, aggregation/window and comparison window;
- direction/operator and threshold value with a documented rationale;
- minimum observation count and freshness/staleness limits;
- hysteresis or confirmation count to prevent flip-flopping;
- treatment of missing, delayed, revised or conflicting observations.

**No numeric threshold is proposed in this document.** Thresholds require source history, comparable windows and a documented thesis rationale. Where those inputs are absent, the evaluator must return “not evaluable / insufficient evidence”, not invent a default.

## Evaluation and persistence invariants

1. Read only validated, persisted observations whose metric/source/unit/window contract matches the configured signal.
2. Evaluate each signal independently; a missing metric must not be replaced by ETH spot price or an unrelated proxy.
3. On successful evaluation, atomically update previous/current value, direction, status/confidence and evaluation timestamp.
4. On validation, provider, query or calculation failure, leave the previous signal state and `last_updated_at` unchanged.
5. Create a monitoring event only when an explicit configured trigger is crossed; do not generate events from data arrival alone.
6. Keep observation capture, signal evaluation, research freshness and scenario-state publication as separate operations.
7. A scenario-state candidate must be a dated, evidence-linked assessment against `ETH-2026-10-04-v1`, reviewed before any publication. Do not mutate the snapshot.

## Implementation sequence

1. Approve the metric/source definitions and source-quality rules for the six signal families.
2. Capture repeated observations for the required daily/weekly windows in disposable/rehearsal storage; resolve the known source gaps.
3. Add only explicit, reviewable signal configurations after thresholds have a defensible basis.
4. Implement the evaluator and Worker/VPS parity tests using synthetic fixtures plus real capture artifacts in disposable storage.
5. Reconcile evaluation outputs against the ETH factors and scenario assumptions. Keep scenario state unpublished pending review and separate authorization.

## Acceptance

- Each signal has a documented metric mapping, window, source and missing-data policy.
- No threshold is fabricated or copied from qualitative prose.
- Price capture time is not treated as provider time.
- Single-block burn is not mislabeled as daily fees or net issuance.
- L2 TVS, L2 activity, net issuance, fee series, staking queues/concentration and competitor share remain distinct metrics.
- Tests demonstrate atomic updates on successful evaluation and no timestamp/state changes on failure.
- No production writes, migration, deployment, scenario-state publication, or PR merge occur without explicit approval.
