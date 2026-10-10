# SOL / CAKE — Evidence closure pass 05: CAKE reported net-supply series and limits

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Purpose:** Establish a comparable issuer-reported CAKE net-supply series while the provider access needed for historical SOL activity remains unconfirmed. This is research evidence, not publication approval.

## 1. CAKE — official monthly reported series

PancakeSwap's issuer-published monthly reports provide a consistent *reported net mint / supply-reduction* series for the following months:

| Month | Reported net mint (CAKE) | Reported context |
|---|---:|---|
| June 2026 | -1,749,587 | Monthly report states -0.521% of total supply; report's stated measurement date is 6 July 2026 |
| July 2026 | -1,270,125 | Kitchen report reports net mint of -1,270,125 |
| August 2026 | -2,072,018 | Kitchen report reports 674,316 minted and 2,746,334 burned |
| September 2026 | -2,311,003 | Burn report reports 652,564 minted and 2,963,567 burned; -0.700% of total supply as measured on 5 October 2026 |

Issuer sources:
- June: https://blog.pancakeswap.finance/articles/cake-burn-june-2026
- July: https://blog.pancakeswap.finance/articles/kitchen-report-july-2026
- August: https://blog.pancakeswap.finance/articles/kitchen-report-august-2026
- September: https://blog.pancakeswap.finance/articles/september-cake-burn-report
- September context: https://blog.pancakeswap.finance/articles/kitchen-report-september-2026

### Derived four-month total

The sum of the four issuer-reported monthly net-mint figures is **-7,402,733 CAKE** for June–September 2026.

This is an arithmetic sum of the published monthly figures, not a direct measurement of the ERC-20 contract's `totalSupply()` delta between two pinned blocks. It must not be presented as the contract-level change until the block-pinned on-chain endpoints are captured and reconciled.

## 2. Important methodology caveats

1. **Issuer accounting is a distinct evidence class.** The reports describe how PancakeSwap categorizes product emissions and burns. They do not by themselves establish the exact circulating supply at a block.
2. **Monthly burn timing is adjusted.** The September report says weekly burns are prorated across months. Therefore monthly accounting periods need not align exactly with transaction timestamps.
3. **Some emissions are excluded from the mint calculation.** The September report says mints that directly contribute to burning are excluded from its raw CAKE/block-emission estimate. Do not assume the reported mint figure is the same as every on-chain mint event counted by contract logs.
4. **The burn-address method has a separate contract-level definition.** Current PancakeSwap tokenomics documentation instructs readers to subtract the burn-address balance from contract total supply and also count CAKE locked forever in the legacy CAKE pool as burned. Candidate addresses must be verified against current contract behavior and pool migration history; do not blindly subtract generic addresses.
5. **Historical consistency needs a pinned comparison.** A valid on-chain check should read `totalSupply()` and burn/legacy-pool balances at both start and end blocks, inspect relevant `Transfer` mint/burn/transfer events, and account for known locked balances without double-counting.

Primary methodology: https://docs.pancakeswap.finance/protocol/cake-tokenomics

## 3. Current assessment

- Issuer-reported net-supply reduction for June–September is consistently negative across the four reports.
- September is the strongest of these four months by absolute reported reduction (2,311,003 CAKE), followed by August (2,072,018 CAKE).
- This supports the narrower claim that PancakeSwap **reported** net CAKE supply reduction in each of these months. It does not yet independently verify realized contract-level supply changes, canonical circulating supply, or economic value accrual to CAKE holders.
- Do not extrapolate four monthly observations into a forecast or assign a Product Contour score from them alone.

## 4. SOL — blocked collection step

The SDA source has been identified, but no provider credentials or provider-specific terms are configured in Crypto. The public portal's displayed metrics should not be scraped as a substitute for an approved API/data path. The next SOL step is to choose a provider adapter, verify access and terms, and capture a dated 30-day daily series with raw output and independent reconciliation. If the selected SDA path cannot be used without credentials that are not available, record the blocker and proceed with an independently accessible source only after its terms and definitions are reviewed.

## 5. Publication / implementation guardrails

No Neon writes, migrations, deployments, PR merges, Product Contour lifecycle changes, scores, scenarios, or monitoring events were performed. SOL and CAKE remain unpublished drafts.
