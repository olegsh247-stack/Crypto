# SOL / CAKE source refresh — 2026-10-09

**Purpose:** record the latest dated primary-source observations found during Product Contour v1 coverage work. This is an evidence-preparation note, not a published research snapshot. Values below are not live API observations unless explicitly stated; they retain each publisher's observation period.

## Publication and scenario-state policy

A published research snapshot is the immutable, evidence-backed analytical definition: 15 research blocks, block statuses, source-linked evidence, critical factors, scores and bull/base/bear scenario definitions.

A `scenario_state` is a separate, dated runtime evaluation of which scenario is currently supported by observed evidence. **Do not create a scenario state merely because a snapshot was published.** Create one only after an evidence-backed evaluation runs against that snapshot and records its timestamp, rationale, indicators/evidence, confidence and snapshot lineage (using only lineage fields confirmed to exist in the deployed schema).

Likewise, keep `monitoring_events` empty until a real configured trigger is observed. Empty history is valid; do not synthesize events or baseline states to fill the UI.

## SOL — latest primary-source observations found

| Observation | Publisher's observation date | Value | Source |
|---|---|---|---|
| Target slot time | September 2026 report | 250 ms | https://solana.com/research |
| Reported network uptime since February 2024 | September 2026 report | 100% | https://solana.com/research |
| Average energy per transaction | 7 October 2026 snapshot | 0.00799 Wh | https://solana.com/uk/research |
| Annualized network electricity consumption | 7 October 2026 snapshot | 7.03 GWh | https://solana.com/uk/research |

**Interpretation limits:** these are publisher-reported, dated snapshots, not a live feed. Uptime and energy figures are not sufficient by themselves to infer decentralization, fee-paying adoption, value accrual or future SOL returns. Validator/client concentration, stake distribution, net issuance after burns, user transaction quality, fees and stablecoin/application activity still need individually dated evidence before publication.

### SOL evidence still required

- Current circulating/total supply and net issuance after burns, with retrieval time and primary source.
- Staking participation, validator/stake distribution and client diversity, with dates and definitions.
- Successful user transactions separated from votes, failures and automated activity; fees and fee-paying user/account definitions.
- Stablecoin transfers/supply, application activity and competitor comparisons over aligned time windows.
- For each of the 15 blocks: reviewed status (complete, incomplete or justified N/A), claim, source URL, observation date, confidence and thesis impact.

## CAKE — latest primary-source observations found

| Observation | Publisher's observation date | Value | Source |
|---|---|---|---|
| CAKE minted in September 2026 | September 2026 monthly report, published 7 October 2026 | 652,564 CAKE | https://blog.pancakeswap.finance/articles/september-cake-burn-report |
| CAKE burned in September 2026 | Same report | 2,963,567 CAKE | https://blog.pancakeswap.finance/articles/september-cake-burn-report |
| Net supply change for September 2026 | Same report | -2,311,003 CAKE | https://blog.pancakeswap.finance/articles/september-cake-burn-report |
| Percentage of total supply reduced during September | Same report | -0.700% | https://blog.pancakeswap.finance/articles/september-cake-burn-report |
| Consecutive months of reported net supply reduction | Same report | 37 months | https://blog.pancakeswap.finance/articles/september-cake-burn-report |
| Maximum supply policy | Implemented 19 January 2026, official Kitchen Report | 400 million CAKE max supply | https://blog.pancakeswap.finance/articles/kitchen-report-january-2026 |

**Interpretation limits:** the September net supply reduction is positive evidence for the tokenomics factor, but it does not establish future deflation or price appreciation. The model must distinguish monthly net mint/burn from current circulating supply, protocol fees, incentives, revenue, liquidity and sustainable CAKE value accrual. Publisher-reported supply changes should be cross-checked against token-contract/on-chain data before snapshot publication.

### CAKE evidence still required

- Current total/circulating supply from token-contract/on-chain sources, with retrieval time.
- Monthly net emissions and burns across consistent windows, preserving publisher methodology and any exclusions.
- Protocol fees/revenue, trading volume, liquidity depth/slippage and incentives by product and chain.
- User retention/activity concentration and competitor comparison on aligned definitions.
- Current governance/tokenomics parameters and implementation status; do not reuse legacy veCAKE assumptions as current.
- For each of the 15 blocks: reviewed status (complete, incomplete or justified N/A), claim, source URL, observation date, confidence and thesis impact.

## Publication readiness

**Status: not ready to publish as a database snapshot.** This refresh adds dated primary-source observations, but it does not satisfy all required metrics or the full evidence chain for either asset. The existing SOL and CAKE Structure 1 documents remain research drafts.

Before a publication operation is approved, assemble and review a per-asset manifest with:
1. All 15 block statuses and a justification for each N/A.
2. Source-linked, dated observations and evidence claims.
3. 3–7 critical factors with explainable assessments.
4. Defined score types, methodology version, input evidence and confidence.
5. Bull/base/bear scenarios tied to the exact immutable snapshot.
6. Explicit snapshot lineage and a runtime-evaluation plan for scenario states.

No production database writes, migrations, numeric scores, scenario states or monitoring events were created by this note.
