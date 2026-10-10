# SOL / CAKE — Evidence closure pass 02: source readiness

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Read-only source and collection-path audit. This document does not authorize publication or database changes.

## Decision

The next evidence collection must separate **direct chain facts**, **provider-derived historical activity**, and **issuer-reported tokenomics**. They are different evidence classes and must not be merged into one unsourced “current” snapshot.

## 1. SOL — viable activity-data source identified

Solana's official data portal, https://solana.com/data, lists the relevant metrics needed to close part of the current evidence gap:

- successful non-vote transaction count;
- failed non-vote transaction count;
- vote transaction count;
- fee payers;
- fees (explicitly defined by the portal as base + priority fees);
- slots and compute units;
- application revenue.

The portal describes the Data Aggregator (SDA) as the open-source project powering the dashboard. Its page says the aggregator refreshes twice daily after 10 AM and 10 PM ET, lags by one day, and accepts monthly backfill requests. Therefore these metrics are suitable for a **dated historical window**, but not as zero-lag RPC state.

Source: https://solana.com/data?tab=rpc

The public SDA repository is https://github.com/solana-foundation/solana-data-aggregator. Its README describes typed metrics and provider-specific adapters, and says provider execution depends on configured API keys; the project writes provider results to local JSON output. This is a plausible reproducible source pipeline, but the Crypto repository currently has no verified SDA integration, no confirmed provider credentials, and no captured SDA output. Do not claim those metrics are already ingested.

Repository: https://github.com/solana-foundation/solana-data-aggregator

### SOL collection contract

For the next approved capture, store each metric with:
1. provider and metric identifier;
2. exact UTC window start/end and retrieval time;
3. unit and definition, including whether vote transactions are excluded;
4. provider methodology URL and raw response/artifact;
5. freshness/lag metadata;
6. any provider disagreement or backfill status.

For fee-paying activity, use daily fee-payer counts over a consistent 30-day window where available. Do not label fee payers as retained users without cohort analysis. For transaction quality, report successful and failed non-vote transactions separately and preserve the provider's exact definitions. For fees, do not mix base + priority fees with validator tips or application revenue unless a source explicitly includes them.

The current direct-RPC capture script remains useful for supply, epoch, inflation and vote-account observations, but it does not collect these historical time series. A separate provider adapter should not be added until access requirements, data licensing, output schema, and tests are reviewed.

## 2. SOL — validator-client diversity remains a distinct gap

The current `getVoteAccounts` capture reports vote accounts and activated stake, not validator software-client shares. Vote-account counts must not be used as a proxy for client diversity. To close this gap, the evidence must include:
- dated client/version identification;
- stake-weighted shares by client family;
- source methodology and coverage;
- treatment of unknown/unidentified validators;
- the measurement date and denominator.

Until those fields are available from a reviewed source, validator-client diversity remains **unresolved**.

## 3. CAKE — supply and protocol economics remain separate evidence streams

Primary token-supply rule from PancakeSwap documentation:
- read CAKE contract `totalSupply()`;
- subtract the dead/burn address balance;
- account for CAKE irretrievably locked in the legacy CAKE pool, without double-counting.

Source: https://docs.pancakeswap.finance/protocol/cake-tokenomics

The direct capture from BSC block 126,693,951 (2026-10-09) remains a dated observation. The estimate after subtracting the dead-address balance is about 375.141M CAKE; subtracting three additional candidate balances yields about 374.982M. The latter is **not canonical** until the candidate addresses are reconciled with the official legacy-pool method. Do not replace either figure with a third-party dashboard number without aligning the timestamp, block and definition.

PancakeSwap's September 2026 Kitchen Report states 652,564 minted and 2,963,567 burned, net reduction 2,311,003 CAKE for that reporting month. This is issuer-reported period accounting, not the same thing as a block-pinned circulating-supply calculation.

Source: https://blog.pancakeswap.finance/articles/kitchen-report-september-2026

For protocol economics, capture and keep separate:
- gross fees;
- protocol revenue;
- CAKE-holder revenue or buyback/burn;
- token emissions and incentives;
- trading volume;
- TVL and liquidity depth;
- chain/product breakdown.

Use aligned rolling windows and a retrieval timestamp. If a source provides only an indexed dashboard snapshot without an explicit retrieval timestamp or raw response, label it secondary/contextual evidence, not a canonical measurement.

## 4. Automation readiness

The repository's existing `Research On-chain Capture` workflow is a read-only capture route, but the current GitHub tool connection does not expose a workflow-dispatch action. No fresh run is claimed in this pass. Do not use a prior artifact as though it were current.

Before changing automation, verify:
- whether SDA/provider access can be run without secrets or requires user-provided API keys;
- whether the provider license and terms allow storing/reusing the data in Crypto;
- a stable output schema and provenance fields;
- unit tests with fixed sample responses;
- an explicit freshness policy and failure behavior.

## 5. Publication gate remains closed

SOL and CAKE remain unpublished / `not_started`. This pass creates no scores, scenarios, monitoring events, or Research Snapshot; it performs no Neon writes, migrations, deployment, or merge to `main`.

### Next executable action

The next engineering step is to review SDA's metric schema and provider adapters against Crypto's evidence schema, then propose a minimal, tested read-only adapter only if data access is available and the source definitions fit. In parallel, obtain a fresh direct-RPC capture when workflow dispatch or an equivalent authorized execution path is available.