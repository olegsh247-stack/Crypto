# SOL / CAKE — Evidence closure pass 01

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Purpose:** Resolve the highest-priority evidence questions without publishing unreviewed research or writing to Neon.  
**Method:** Read-only source review; existing block-pinned RPC artifact plus current public documentation/dashboard pages. Values from dashboards are not treated as a synchronized on-chain snapshot.

## Executive conclusion

The evidence review improves the **source methodology**, but does not yet justify publishing SOL or CAKE research snapshots. Two important decisions are now clearer:

1. **SOL:** retain the existing RPC capture as a dated primary observation, but do not treat it as current state on 2026-10-10. It does not establish validator-client diversity, fee-paying user retention, or net SOL issuance after burns.
2. **CAKE:** use PancakeSwap's own tokenomics instructions as the primary circulating-supply rule: start from contract total supply, subtract the burn-address balance, and also account for CAKE irretrievably locked in the legacy pool. The prior calculation that additionally subtracts the token contract's own balance and balances at precompile addresses remains provisional until each balance is shown to be permanently irretrievable under the protocol's accepted methodology.

No numeric scores, scenarios, monitoring events, published snapshots, database writes, migrations, or deployments were created.

## 1. SOL — evidence register

| Question | Best evidence currently available | What it supports | Remaining gap / decision |
|---|---|---|---|
| Circulating / non-circulating supply | Read-only Solana RPC capture, 2026-10-09; `getSupply`, context slot 454,979,264 | Circulating 588,768,304.987 SOL; non-circulating 46,768,738.054 SOL; derived total 635,537,043.041 SOL at the capture | Dated observation only. Refresh `getSupply` with its context slot and UTC retrieval time before publication |
| Inflation parameter | Same capture; `getInflationRate`, epoch 1053 | Reported total inflation parameter approximately 3.6097% for the captured epoch | Not equivalent to realized net issuance after burns. Pair with epoch rewards and fee burns over an explicit interval |
| Stake participation | Same capture; `getVoteAccounts` | 674 current and 6 delinquent vote accounts; current activated stake sum approximately 437.858M SOL | Vote-account count is not unique validator-operator count or client diversity. Need identity/client-version mapping and a common stake-share denominator |
| Network quality | Official RPC method catalogue | Confirms primary RPC methods for slot, vote accounts, supply, inflation and inflation rewards | Does not itself provide a captured performance or user-quality time series |
| User activity / value accrual | Prior DefiLlama indexed views in `SOL-CAKE-DATA-UPDATE-2026-10-09.md` | Broad ecosystem context only | Not timestamp-aligned; addresses and transactions are not retained users or necessarily fee-paying economic activity. Obtain a defined window with non-vote success/failure and fees |
| Ecosystem / stablecoins | Prior indexed DefiLlama views | Contextual TVL, stablecoin capitalization, app/chain fees and volumes | Multiple indexed views differed and exact retrieval times were not exposed. Keep as directional context, not canonical evidence |

Primary references:
- Solana RPC methods: https://solana.com/docs/rpc/http
- `getSupply`: https://solana.com/docs/rpc/http/getsupply
- Existing raw-capture workflow and review: https://github.com/olegsh247-stack/Crypto/actions/runs/37982243766

### SOL publication gate

Do not mark Tokenomics or Network / On-chain State complete until a fresh capture records UTC timestamps, context slot/epoch, units, method and raw response. Do not infer validator decentralization from vote-account count alone. Blocks 05, 06, 07, 10, 13 and 14 remain incomplete until dated ecosystem/user/competition evidence and a reviewed synthesis exist.

## 2. CAKE — supply-methodology reconciliation

### Primary rule

PancakeSwap's official tokenomics documentation instructs readers to:
1. read CAKE contract `totalSupply` on BNB Smart Chain;
2. subtract the burn-address balance;
3. also account for CAKE permanently locked in the legacy CAKE pool, which the protocol treats as burned.

Source: https://docs.pancakeswap.finance/protocol/cake-tokenomics

The official September 2026 report separately states that 652,564 CAKE were minted and 2,963,567 burned during September, for a reported net reduction of 2,311,003 CAKE (0.700% of total supply). This is issuer-reported monthly accounting, not a replacement for a block-pinned contract read.

Source: https://blog.pancakeswap.finance/articles/kitchen-report-september-2026

### Existing block-pinned capture

At BSC block 126,693,951 on 2026-10-09, the existing capture recorded:
- Contract `totalSupply()`: 5,543,692,995.751051 CAKE
- Burn-address balance: 5,168,552,286.608597 CAKE
- Total supply minus burn-address balance: 375,140,709.142454 CAKE
- Candidate additional balances (token contract + `0x…0001` + `0x…0002`): 158,290.831635 CAKE
- Supply after also subtracting those candidates: 374,982,418.310819 CAKE

The first subtraction follows the core rule described by PancakeSwap. The additional subtraction is not automatically approved: each balance must be reconciled with the legacy pool/official burn methodology and shown not to overlap another deduction. Keep 374.982M as a **provisional derived figure**, not a canonical supply field.

### New current indexed cross-check

The current DefiLlama PancakeSwap page indexed during this review reports approximately:
- circulating supply: 357.62M CAKE;
- total supply: 369.21M CAKE;
- maximum supply: 400M CAKE;
- TVL: about $2.2B;
- trailing-30-day fees: about $17M;
- trailing-30-day protocol revenue: about $5.6M;
- trailing-30-day DEX volume: about $25.708B;
- BSC: 96.7% of tracked TVL.

Sources:
- https://investors.defillama.com/protocol/pancakeswap?events=false&revenue=true&tvl=false
- https://investors.defillama.com/protocol/pancakeswap?events=false&fees=true&tvl=false

These values are **current indexed dashboard fields, not a timestamped block-pinned observation**. They differ from the 2026-10-09 RPC-derived values. The gap cannot be solved by averaging: the pages may use different capture times and definitions. The protocol's official methodology and the indexed dashboard must be compared against the same block/time and explicit supply definition before choosing a canonical circulating-supply field.

DefiLlama's methodology pages distinguish fees, protocol revenue and holders revenue; for example, its PancakeSwap AMM V3 page defines holders revenue as fees collected for CAKE buyback/burn. Therefore gross fees, protocol revenue and value accruing to CAKE holders must remain separate metrics.

Reference: https://investors.defillama.com/protocol/pancakeswap-amm-v3

### CAKE publication gate

Before publishing Tokenomics or Protocol / On-chain State:
1. obtain a new contract capture pinned to one BSC block and record block timestamp;
2. reconcile total supply minus dead-address balance with the official legacy-pool burn treatment;
3. verify whether candidate locked balances are included in that treatment and avoid double-counting;
4. capture the official burn report for the same period and reconcile its accounting window;
5. capture timestamped protocol fees, protocol revenue, holder revenue/buyback-burn, incentives, volume and liquidity depth, keeping each definition separate;
6. explain the remaining difference against DefiLlama rather than silently overriding either source.

## 3. What can and cannot change in the product now

- The evidence register can be updated with these source rules and known dated observations.
- SOL and CAKE should remain `not_started` in the published application until a reviewed snapshot is ready.
- Six domain definitions do not count as six completed research domains.
- No scores or scenario states should be generated from this partial evidence.
- No production database writes are authorized by this document.

## 4. Next execution step

The next data task is a fresh **read-only** RPC capture through the repository's existing `Research On-chain Capture` workflow, followed by same-window supply reconciliation. The current tool connection does not expose a workflow-dispatch action, so this review does not claim that a new capture was run. The prior capture remains dated 2026-10-09.

After the fresh capture, continue with SOL user-quality/validator-client evidence and CAKE product-level fee/value-accrual evidence; only then prepare a reviewed evidence manifest for publication.

## Safety record

No production database writes, migrations, deployment, DNS changes, secret updates, scores, scenario states, monitoring events, or merges to `main` were performed.
