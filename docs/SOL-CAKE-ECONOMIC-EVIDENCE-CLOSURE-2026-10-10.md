# SOL and CAKE Economic Evidence Closure — 2026-10-10

**Branch:** `fix/product-contour-v1-contracts`  
**Status:** research protocol and source feasibility; empirical historical capture still pending  
**Safety:** no Neon writes, production migrations, deployment, PR merge, or Product Contour publication.

## Executive decision

SOL and CAKE remain unpublished. This report defines what can be independently verified and what evidence is still required. Public documentation confirms that Solana's native RPC exposes transaction execution status, fees, block/slot identity and full block transactions. PancakeSwap's own tokenomics material confirms that CAKE emissions and burns must be compared over the same period and that its reporting methodology changed in March 2025. These facts establish a sound verification route, not completed historical measurements.

## 1. SOL: source feasibility and metric contract

### Primary source

- Solana RPC `getTransaction`: https://solana.com/docs/rpc/http/getTransaction
- Solana RPC `getBlock`: https://solana.com/docs/rpc/http/getBlock
- Solana RPC JSON structures: https://solana.com/docs/rpc/json-structures
- Solana RPC method index: https://solana.com/docs/rpc/http

The documented transaction metadata contains `meta.err` (null indicates successful execution; a value indicates failure) and `meta.fee` (integer lamports). A block request can return full transaction details and metadata. Historical availability, rate limits, pruning/retention and completeness depend on the actual RPC provider/plan and must be tested against the selected historical window.

### Required definitions

| Metric | Canonical definition | Required caveat |
|---|---|---|
| Successful transactions | Count unique transaction signatures whose execution metadata has `err = null` | Distinguish transaction count from instruction count; define whether vote transactions are excluded |
| Failed transactions | Count unique signatures with non-null execution error | These are included on-chain and can still incur fees; do not classify as successful economic activity |
| Total fees | Sum `meta.fee` in lamports, then convert to SOL using 1 SOL = 1,000,000,000 lamports | Preserve integer arithmetic; define period and vote/non-vote scope |
| Fee payer | First required signer/account in the canonical transaction message, validated against the message header and account-key representation | Resolve versioned transaction address tables correctly; do not count every signer as fee payer |
| Application activity | Count transactions attributed to a verified program ID / program registry, with separate unique fee payers and active addresses | Program attribution is not equivalent to human users; multi-program transactions can overlap across applications |

### Minimum historical validation

1. Fix a reproducible window with UTC boundaries and slot boundaries.
2. Retrieve finalized blocks with full transaction details and supported transaction versions.
3. Preserve source URL/provider, retrieval timestamp, slot, block hash, transaction signature, raw response hash, units and parser version.
4. Recompute success/failure and fees from raw transaction metadata; check sampled signatures via independent RPC/explorer.
5. Report vote and non-vote activity separately. Treat non-vote transactions as a proxy for application/economic activity, not as proof that every transaction is economically meaningful.
6. Attribute app activity only where program IDs are identified and classification evidence is retained. Keep unknown/unclassified programs visible as a separate bucket.
7. Measure provider coverage, missing slots/transactions, null metadata, rate limits and historical retention before accepting a series.

### SDA provider gate

The acronym/name “SDA” is not sufficiently identified by the current repository context to establish a specific vendor or product. Do not infer identity from the acronym. Before adopting SDA, record the exact provider and product URL, API endpoint, terms/license URL and date checked; verify historical coverage, retention, rate limits, redistribution/storage rights, attribution requirements, methodology and independent reconciliation against Solana RPC. Until then SDA is a candidate source with unverified provenance, not a canonical source.

## 2. CAKE: supply reconciliation contract

### Official methodology reference

PancakeSwap, “PancakeSwap CAKE Burn Mechanics: A Comprehensive Guide” (2025-03-26):  
https://blog.pancakeswap.finance/articles/pancake-swap-cake-burn-mechanics-a-comprehensive-guide

PancakeSwap states that, beginning with the reporting format introduced on 2025-03-24, its headline burn reporting focuses on net deflation rather than gross burns alone. The article describes product emissions/mints and product burns, and notes that the Ecosystem Growth Fund is excluded from that particular calculation until tokens enter the market. Monthly-accounted products can cause timing spikes in weekly reports.

PancakeSwap, “Implementation of CAKE Tokenomics 3.0”:
https://blog.pancakeswap.finance/articles/implementation-of-cake-tokenomics-3-0-what-you-need-to-know

The official material also discusses historical CAKE Pool/veCAKE lockers and delegated amounts. Those historical arrangements must be reconciled against current contract balances and redemption status, not assumed to remain locked indefinitely.

### Separate supply concepts

Do not treat the following as interchangeable:

1. **Total supply:** token contract supply at a specific block/time, with chain and contract address stated.
2. **Burned supply:** tokens provably removed under the applicable contract mechanics; distinguish irrecoverable burns from transfers to addresses merely labelled “burn”.
3. **Locked supply:** balances in verified contracts with a documented lock/unlock/redeem rule and as-of block. A wallet label alone is not evidence of irrecoverability.
4. **Circulating supply:** a methodology-defined estimate; must state which locked/treasury/team/ecosystem balances are excluded and why.
5. **Gross emissions and gross burns:** separate period totals with source transactions and period boundaries.
6. **Net supply change:** reconcile on-chain total-supply deltas to mint/burn events over exactly the same interval. Keep the official dashboard's reporting convention as a separate field if its sign convention differs from `end_supply - start_supply`.

### Required reconciliation

For each chain where CAKE is deployed, record the canonical token contract and block-pinned `totalSupply`, mint/burn events, decimals and chain ID. For each claimed locker, record contract address, balance at the same block, contract behavior, unlock/redemption state and source of classification. Avoid double-counting tokens represented through delegation or migration between lockers.

Compare the on-chain reconciliation with PancakeSwap's official tokenomics/burn reporting and at least one independent analytics dataset over matching intervals. Differences must be explained by chain coverage, timing, accounting scope, locked-supply methodology or an identified data defect; otherwise circulating supply remains unresolved.

## 3. Source quality and acceptance rules

Each observation must preserve: metric ID, asset/network/contract or program scope, source and exact URL, provider/product identity, retrieved-at timestamp, period/slot/block bounds, unit, methodology version, raw artifact/hash, transformation version, and validation outcome.

Source hierarchy:
- Protocol RPC / canonical contracts for raw chain state and transaction facts.
- Official project documentation and dashboards for the project's own accounting methodology and classification.
- Independent analytics providers for cross-checking, not silently substituted for primary facts.
- Market aggregators for context only where their definitions and timestamp alignment are explicit.

A metric is **usable** only if it is reproducible, temporally aligned, unit-normalized, has adequate coverage, and has an understood definition. If independent sources disagree materially, retain the discrepancy and mark the metric provisional; do not average incompatible definitions.

## 4. Publication gate for SOL and CAKE

Do not publish snapshots, numeric scores, scenarios, monitoring signals or lifecycle status changes until:
- SOL historical coverage and success/failure/fee calculations are sampled and independently checked;
- fee payer and program attribution rules are tested on legacy and versioned transactions;
- SDA identity, terms, retention and provenance are documented if SDA is used;
- CAKE circulating supply is reconciled to a stated methodology and block-pinned contract balances;
- gross emissions, gross burns and net supply changes reconcile over comparable periods;
- at least one independent cross-check is completed and all remaining differences are explicitly classified;
- evidence is reviewed before any authorized database write.

## Current status

- **SOL:** primary RPC feasibility confirmed from official documentation; historical capture, provider-specific retention test, empirical calculations and independent reconciliation are pending.
- **SDA:** identity and terms not verified; do not treat as canonical.
- **CAKE:** official methodology change and key accounting caveats identified; block-pinned supply/locker/emission reconciliation is pending.
- **Product Contour v1:** keep SOL and CAKE unpublished and `not_started` until evidence closure is complete.

## References

- Solana `getTransaction`: https://solana.com/docs/rpc/http/getTransaction
- Solana `getBlock`: https://solana.com/docs/rpc/http/getBlock
- Solana RPC JSON structures: https://solana.com/docs/rpc/json-structures
- PancakeSwap CAKE burn mechanics (2025-03-26): https://blog.pancakeswap.finance/articles/pancake-swap-cake-burn-mechanics-a-comprehensive-guide
- PancakeSwap CAKE Tokenomics 3.0: https://blog.pancakeswap.finance/articles/implementation-of-cake-tokenomics-3-0-what-you-need-to-know
