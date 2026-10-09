# SOL / CAKE — Data Update
Date: 2026-10-09
Branch: `fix/product-contour-v1-contracts`
Purpose: dated research evidence refresh. This is not a publication manifest and does not authorize database writes.

## Executive result

The fresh source review improves the dated operational/economic evidence for both assets, but does **not** close the material gaps required for a publishable snapshot. No numeric score, scenario state, monitoring event, Neon write, migration, deployment or merge is authorized or performed.

A direct read-only Solana JSON-RPC request was attempted from the available execution environment but failed before reaching the endpoint because outbound DNS resolution was unavailable. Therefore this update does **not** claim a live RPC capture. Explorer and analytics figures below are publisher/indexed observations with their own timestamps and caveats.

## SOL — official Explorer snapshot

The official Solana Explorer Mainnet Beta page indexed a cluster snapshot with cluster time **2026-10-09 16:26:20 UTC**:
- Slot: **454,924,987**
- Block height: **432,962,279**
- Slot time: **217 ms** (1-minute average)
- Slot time: **219 ms** (1-hour average)
- Live TPS: **5,458**
- Cumulative transaction count: **557,968,994,851**
- Supply: **not available in this Explorer view**
- Epoch: **1,053**, progress **6.7%**

Source: https://explorer.solana.com/?cluster=mainnet_beta

**Interpretation:** this is the newest exact-time operational snapshot located in the current source review, not a direct RPC capture made during this task. TPS and cumulative transactions do not measure unique people, successful economic transactions, fee-paying demand or SOL holder value accrual. Do not compare these values with other chains without matching transaction definitions and time windows.

### SOL ecosystem dashboard — secondary indexed values

DefiLlama's indexed Solana page showed:
- DeFi TVL: **$6.249B**; another indexed view showed **$6.239B**
- Stablecoin market capitalization: **$16.083B**; 7-day change **−1.25%**
- USDC share of stablecoin capitalization: **42%**
- Chain fees (24h): **$940,134**
- Chain revenue (24h): **$107,134**
- Application fees (24h): **$12.76M**
- Application revenue (24h): **$5.18M**
- DEX volume (24h): **$2.214B**; another indexed view showed **$2.376B**
- Perpetuals volume (24h): approximately **$1.30B**
- Active addresses (24h): **3.45M**
- Transactions (24h): **122.34M**
- Token incentives (24h): **$0** in the displayed view

Sources:
- https://defillama.com/chain/solana?appFees=true&tvl=false
- https://defillama.com/chain/solana?appFees=true&appRevenue=true

**Evidence-quality limits:** the indexed results do not expose an exact retrieval timestamp for these rolling dashboard metrics, and separate views show different TVL and DEX-volume values. Keep the ranges/views distinct; do not average them or choose one as a canonical snapshot without a timestamped retrieval. Active addresses and transactions are not unique retained users. Chain fees, chain revenue, application fees and application revenue are different measures; none alone establishes SOL-holder value capture. Stablecoin market cap is not settlement volume.

### SOL remaining blockers

1. Exact-time authoritative supply and net issuance after burns, including retrieval time, context slot/epoch and method.
2. Current stake distribution and validator/client shares measured against a common denominator.
3. Successful non-vote transactions, failure rates, fee-paying accounts and transaction-quality definitions.
4. Retention cohorts and stablecoin/application activity over aligned windows.
5. Comparable competitor evidence and a reviewed evidence manifest.

Solana's official `getSupply`, `getVoteAccounts` and `getInflationRate` RPC methods are the appropriate primary data paths:
- https://solana.com/docs/rpc/http
- https://solana.com/ru/docs/rpc/http/getsupply

The current environment could not execute the required outbound JSON-RPC POST, so these endpoints have **not** been queried successfully in this task.

## CAKE — official September token-supply report

PancakeSwap's September Kitchen Report, published **2026-10-07**, reports:
- CAKE minted: **652,564**
- CAKE burned: **2,963,567**
- Net supply change: **−2,311,003 CAKE**
- Reported reduction relative to total supply: **−0.700%**
- Consecutive months of reported net supply reduction: **37**
- Cumulative reduction from peak supply: **61,644,839 CAKE**

Source: https://blog.pancakeswap.finance/articles/kitchen-report-september-2026

This is issuer-reported monthly data. It is evidence of the reported September net reduction, not proof that future deflation will continue or that CAKE price must appreciate. Reconcile the reported change with contract-level supply before publication.

### CAKE protocol dashboard — secondary indexed values

A DefiLlama PancakeSwap dashboard indexed during this source review showed:
- TVL: **$2.212B**
- BSC TVL: **$2.139B** (approximately **96.7%** of total TVL)
- Fees (trailing 30 days): **$16.86M**
- Protocol revenue (trailing 30 days): **$5.55M**
- DEX volume (trailing 30 days): **$26.37B**
- Fees (24h) in the fees view: **$457,331**, of which **$426,188** attributed to BSC
- Dashboard circulating supply: **318.32M CAKE**
- Dashboard total supply: **329.92M CAKE**
- Maximum supply: **400M CAKE**

Sources:
- https://investors.defillama.com/protocol/pancakeswap?events=false&revenue=true&tvl=false
- https://investors.defillama.com/protocol/pancakeswap?events=false&fees=true&tvl=false
- https://docs.pancakeswap.finance/protocol/cake-tokenomics

An earlier same-day indexed view showed **$2.176B TVL**, **$18.0M fees** and **$5.92M protocol revenue**, while the newer indexed view shows **$2.212B**, **$16.86M** and **$5.55M**, respectively. The exact capture timestamps are not exposed in the indexed results. Preserve both observations as separate dashboard views; do not average them or silently overwrite one with the other.

**Interpretation:** the repeatedly observed ~96.7% BSC TVL concentration is a material chain-concentration risk. Protocol fees are not the same as protocol revenue, and neither automatically accrues to CAKE holders. The dashboard's supply fields remain estimates pending on-chain reconciliation.

### CAKE remaining blockers

1. Contract-level total supply and a reproducible circulating-supply definition, including burn-address and permanently locked-supply treatment.
2. Net emissions/burns captured across consistent windows, reconciled with the official monthly report.
3. Timestamped product- and chain-level fees, revenue, holder revenue, incentives and liquidity/slippage.
4. Organic activity and user-retention evidence, not only transaction/address counts.
5. Current governance/tokenomics implementation evidence and aligned competitor metrics.

Official CAKE contract address on BNB Smart Chain: `0x0e09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82`.
Reference: https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82

## Product decision

- **SOL: not ready to publish.**
- **CAKE: not ready to publish.**
- Keep numeric scores, published snapshots, `scenario_states` and `monitoring_events` untouched until evidence is reviewed and the schema/lineage contract is confirmed.
- The next highest-value data task is to run a reproducible, read-only collection against a reachable RPC/data endpoint and store UTC retrieval time, endpoint/provider, response slot or block, method, units and raw response hash. For CAKE, capture contract `totalSupply`, decimals, burn-address balances and any permanently locked legacy supply under one explicit methodology.
