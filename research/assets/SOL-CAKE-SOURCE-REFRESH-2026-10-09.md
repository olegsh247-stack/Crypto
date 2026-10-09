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

### SOL validator stake / consensus concentration — independent dated cross-check

Validators Solutions' report, based on Solana Gossip and vote accounts, was updated **19 September 2026, 08:03 UTC**. It reported **439.6M SOL active stake**, a **18-validator superminority at 33.8%**, **Nakamoto coefficient 18**, and **4.1%** for the largest validator stake (Figment).

Source: https://validators.solutions/en/validators/decentralization/

This is a secondary network-analytics source, not an official Solana Foundation metric. Its definitions and dated snapshot must be preserved. It narrows the SOL decentralization evidence gap, but does not close current validator-client diversity, operator/cloud concentration, supply/net issuance, or fee-paying adoption gaps. Re-fetch the underlying data and definitions before any publication; do not turn these figures directly into a numeric score.

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

## Additional CAKE protocol-economics snapshot — 2026-10-09

A current DefiLlama protocol dashboard snapshot was indexed on 9 October 2026. This is a secondary analytics source and should be retained as a cross-check, not substituted for primary on-chain evidence:

| Metric | Dashboard value | Window / qualification | Source |
|---|---:|---|---|
| Total value locked | $2.176B | Current dashboard snapshot; all tracked chains | https://defillama.com/protocol/pancakeswap |
| Fees | $18.0M | Trailing 30 days; protocol-wide dashboard measure | https://defillama.com/protocol/pancakeswap |
| Protocol revenue | $5.92M | Trailing 30 days; DefiLlama definition | https://defillama.com/protocol/pancakeswap |
| DEX volume | $26.37B | Trailing 30 days | https://defillama.com/protocol/pancakeswap |
| BSC share of TVL | 96.7% | Approximate share in dashboard snapshot | https://defillama.com/protocol/pancakeswap |
| Circulating supply | 318.32M CAKE | Dashboard estimate; verify against token contract and burn-address methodology | https://defillama.com/protocol/pancakeswap |
| Total supply | 329.92M CAKE | Dashboard estimate; verify against token contract | https://defillama.com/protocol/pancakeswap |
| Maximum supply | 400M CAKE | Matches PancakeSwap's official Tokenomics 3.0 policy | https://docs.pancakeswap.finance/protocol/cake-tokenomics |

**Interpretation:** these figures give a useful current cross-check for protocol activity and concentration. They are dashboard observations with rolling windows, not a month-end financial statement. Fees are not identical to protocol revenue, and neither should be treated as fully accruing to CAKE holders. The 96.7% BSC TVL share is a material concentration signal even though the protocol supports multiple chains. Record retrieval time and refresh the dashboard before any future publication; cross-check supply against the official CAKE contract and the project's burn methodology.

### SOL supply and client-diversity cross-checks — reviewed 9 October

Solscan's indexed Mainnet page showed total supply **635.305M SOL**, circulating **588.386M (92.61%)**, non-circulating **46.920M (7.39%)**, total stake **441.739M**, current stake **441.044M**, and delinquent stake **0.694M (0.157%)**. Source: https://solscan.io/?cluster=Main. The page labels the snapshot epoch 1050 but exposes no reliable observation timestamp; the official Explorer snapshot on 9 October was at epoch 1052. Keep these figures as an older secondary cross-check, not publication-ready current metrics.

Solana's official 1 October changelog lists Agave v4.4.0-beta.0 and Firedancer Mainnet Release v26.09.5: https://solana.com/news/solana-changelog-october-1-2026. Wen Firedancer's tracker labels its data last updated 9 October 2026 at 01:00 GMT+2: https://www.wenfiredancer.com/. The retrieved tracker output did not expose a network-wide stake denominator or client-share percentage. Client diversity therefore remains incomplete; do not infer adoption from the displayed validator list.

### CAKE dashboard volatility cross-check — second indexed retrieval on 9 October

A second indexed DefiLlama view reported TVL **$2.212B**, trailing-30-day fees **$16.86M**, protocol revenue **$5.55M**, DEX volume **$26.37B**, BSC TVL share **~96.7%**, circulating supply **318.32M CAKE**, total supply **329.92M CAKE**, and maximum supply **400M CAKE**. Source: https://investors.defillama.com/protocol/pancakeswap?events=false&revenue=true&tvl=false.

The earlier same-day capture in this file reported $2.176B TVL, $18.0M fees and $5.92M revenue. The discrepancy is preserved rather than silently overwritten: these are dynamic rolling dashboard values, and the second view's exact capture time is not exposed. Do not average the values or choose a canonical figure until a timestamped retrieval is captured. The repeated BSC concentration signal is consistent, but dashboard data remain secondary and supply requires contract reconciliation.

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


## Official Solana Explorer operational snapshot — 2026-10-09 07:44:06 UTC

The official [Solana Explorer Mainnet Beta view](https://explorer.solana.com/?cluster=mainnet-beta) displayed slot **454,802,678**, block height **432,840,011**, 1-minute average slot time **263 ms**, 1-hour average slot time **267 ms**, live TPS **3,989**, and cumulative transaction count **557,831,544,713**. Supply was unavailable in that view. These live counters are a dated operational snapshot only; TPS and cumulative transactions are not equivalent to unique users or successful economic transactions. They do not close the supply, validator distribution, client diversity, fee-paying activity or value-accrual evidence gaps.

## Evidence-quality note

The CAKE DefiLlama figures in this file are secondary rolling-window estimates, not an audited month-end statement. In particular, protocol fees are not protocol revenue, and neither necessarily accrues to CAKE holders. The reported ~96.7% BSC share of TVL is a concentration indicator that should be verified from the underlying chain-level data. Refresh both SOL live counters and CAKE dashboard metrics before publication and preserve the actual retrieval timestamp in the evidence record.


## Direct on-chain capture — 2026-10-09 19:44 UTC

A successful read-only GitHub Actions capture now provides primary RPC evidence for SOL and CAKE: https://github.com/olegsh247-stack/Crypto/actions/runs/37982243766

- **SOL:** `getSupply` context slot 454,979,264; circulating 588.768305M SOL; non-circulating 46.768738M SOL; derived total 635.537043M SOL. Epoch 1053; RPC inflation parameter 3.6097079%; 674 current / 6 delinquent vote accounts. Summed activated stake: 437.858116M SOL current, 9,610.856 SOL delinquent. Each RPC method has its own retrieval time; the response is not a single atomic cross-method snapshot.
- **CAKE:** all EVM contract calls were pinned to BNB Smart Chain block 126,693,951. Cumulative `totalSupply()` 5,543.693M CAKE; dead-address balance 5,168.552M; net after dead-address subtraction 375.141M. Subtracting candidate permanently locked balances (token-contract self balance + `0x…0001` + `0x…0002`, total 158,290.832 CAKE) yields a provisional 374.982M estimate.

CAKE supply remains a **reconciliation gap**, not a settled canonical value: the block-pinned estimate differs by about 56.66M CAKE from the earlier untimestamped DefiLlama supply view (318.32M circulating / 329.92M total). Keep the raw on-chain and dashboard observations separate until the supply definition and all irretrievable balances are reconciled. Official CAKE guidance: https://docs.pancakeswap.finance/protocol/cake-tokenomics; third-party methodology cross-check: https://cryptoburntracker.com/burns/pancakeswap/

The first capture attempt failed only because `getInflationRate` was called with an unsupported parameter; the script was corrected to call it with no parameters, then the capture completed successfully. The latest script pins all CAKE `eth_call` requests to the block number captured at the start of the EVM section.

