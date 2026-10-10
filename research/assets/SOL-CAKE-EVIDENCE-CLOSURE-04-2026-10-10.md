# SOL / CAKE — Evidence closure pass 04: SDA feasibility and next collection step

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Read-only source and licensing review. No provider credentials, database writes, or publication.

## Decision

The SOL Data Aggregator (SDA) is now identified as the open-source project at https://github.com/solana-foundation/solana-data-aggregator, powering https://solana.com/data. The project repository states that it is MIT-licensed, supports typed metrics from multiple providers, requires provider API keys for the providers selected, writes outputs to local JSON, and processes backfill requests on the first day of each month. This is sufficient to identify SDA and understand its collection model, but not sufficient to authorize production ingestion of every upstream dataset.

## What the official portal exposes

The Solana Data portal lists:
- total transactions;
- successful non-vote transactions;
- failed non-vote transactions;
- vote transactions;
- fees, explicitly defined as base plus priority fees;
- fee payers;
- slots and compute units;
- application revenue.

The portal says its data refreshes twice daily after 10 AM and 10 PM Eastern Time and lags by one day. Backfill requests are supported monthly on the first day. Therefore SDA should be treated as a delayed historical/analytical source, not a real-time zero-lag feed.

References:
- Portal: https://solana.com/data?tab=rpc
- SDA repository / README: https://github.com/solana-foundation/solana-data-aggregator
- SDA LICENSE: https://github.com/solana-foundation/solana-data-aggregator/blob/main/LICENSE

## Licensing and access conclusion

The SDA source code is MIT-licensed according to the public repository. This does **not** by itself establish redistribution or commercial-use rights for data returned by every configured provider. Provider terms, credentials, rate limits, retention and historical coverage remain provider-specific. The Solana Foundation website terms also contain restrictions on systematic extraction from the website; therefore do not scrape dashboard pages as a substitute for an approved API or repository-supported provider output.

No SDA adapter is enabled in Crypto, no provider API key was found or assumed, and no dashboard scraping was implemented.

## SOL collection plan

1. Use SDA's provider adapters only after each selected provider's terms and access requirements are reviewed.
2. For a 30-day daily series, request successful non-vote transactions, failed non-vote transactions, vote transactions, fee payers and fees. Preserve the SDA metric ID, provider identity, exact UTC day, retrieval timestamp, unit and methodology.
3. Fees must remain defined as base + priority fees unless the selected metric explicitly documents a different scope. Do not silently add tips, validator revenue or application revenue.
4. Reconcile a sample of dates against a separate provider or a reproducible block/transaction sample. Treat differences in transaction classification and data coverage as explicit findings.
5. Fee payers are addresses/accounts, not unique people or retained users. Do not infer user retention without cohort analysis.
6. SDA backfill is documented as monthly on the first day. The next stated backfill opportunity after this report is 2026-11-01. Before then, check whether the portal's selectable historical windows already cover the target period; do not promise an unverified backfill.

## CAKE collection plan

CAKE's supply problem remains separate from SOL's SDA collection. Use the BNB Chain CAKE contract at `0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82`, pin all reads to a single block, and compare:
- contract `totalSupply()`;
- dead-address balance and event history;
- the legacy CAKE pool and documented delegation/redemption rules;
- official gross mint and gross burn reports;
- independent analytics over matching periods.

PancakeSwap's March 2025 methodology says its net-deflation reporting excludes Ecosystem Growth Fund tokens until they enter the market, and weekly/monthly timing can shift reported values. Do not mix the project's net-deflation accounting measure with raw `totalSupply` change without an explicit reconciliation.

References:
- Official burn methodology: https://blog.pancakeswap.finance/articles/pancake-swap-cake-burn-mechanics-a-comprehensive-guide
- Tokenomics 3.0 and legacy CAKE Pool notes: https://blog.pancakeswap.finance/articles/implementation-of-cake-tokenomics-3-0-what-you-need-to-know
- Tokenomics docs: https://docs.pancakeswap.finance/protocol/cake-tokenomics

## Acceptance gates

- [ ] Selected SDA provider(s) and provider-specific terms documented.
- [ ] Historical 30-day SOL series captured with raw artifact and complete metric metadata.
- [ ] Sampling/coverage and independent reconciliation report completed.
- [ ] CAKE supply reconciled at a pinned block, with no double-counting of locked/delegated balances.
- [ ] Official emissions/burn reports aligned to on-chain events over identical periods.
- [ ] Material discrepancies explained or explicitly left provisional.
- [ ] Research reviewed before any authorized Neon publication.

## Current result

**SDA identity:** confirmed.  
**SDA source-code license:** MIT per repository.  
**Upstream data rights/credentials:** not yet verified; provider-specific.  
**Historical SOL metrics:** not yet captured into Crypto; no numbers are inferred from the dashboard page.  
**CAKE circulating supply:** remains provisional; earlier block-pinned calculation is not a canonical circulating-supply decision.  
**Publication:** SOL and CAKE remain unpublished.

No database writes, migrations, deployments, PR merges, or lifecycle changes were performed.
