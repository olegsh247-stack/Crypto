# BTC DXY canonical-source review — 2026-10-16

**Scope:** identify whether the current evidence supports selecting a canonical source for the required BTC macro input `macro.dxy`.
**Mode:** read-only source and licensing review. No registry changes, ingestion, database access, scenario evaluation, or monitoring writes.
**Decision:** **DXY remains blocked. Do not change the canonical metric/source registry.**

## Findings

1. **ICE is the index administrator.** ICE's official product page describes the ICE U.S. Dollar Index (DXY/USDX) as its proprietary index, calculated from a fixed-weight basket of six currencies. The index is distinct from broad trade-weighted dollar indices published by the Federal Reserve.
   - Product description: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices
   - ICE USDX futures/product page: https://www.ice.com/products/194/US-Dollar-Index-USDX-Futures?cat=204

2. **A public page is not a permission to automate or store the series.** ICE Index Platform terms state that index data is proprietary and restrict scraping, storing, redistribution, and other uses absent a relevant agreement or permission: https://indices.ice.com/termsAndDisclaimers. ICE's data terms describe delivery through ICE or licensed third-party platforms and agreements/schedules. The review did not establish a free, stable, unauthenticated API endpoint with terms permitting this project's intended automated retrieval and storage.

3. **The Federal Reserve series is a different metric.** FRED/ALFRED identifies `DTWEXBGS` as the Nominal Broad U.S. Dollar Index, sourced from the Federal Reserve's H.10 release, daily, indexed to January 2006=100. Its series notes say data are subject to revision:
   - FRED: https://fred.stlouisfed.org/series/DTWEXBGS
   - ALFRED revision history: https://alfred.stlouisfed.org/series?seid=DTWEXBGS
   This is a legitimate possible *alternative metric* if the product definition is deliberately changed, but it is **not** a drop-in replacement for ICE DXY and must not be silently registered as `macro.dxy`.

## Acceptance gate

Before enabling `macro.dxy`, one of these paths must be explicitly chosen:

- **Path A — actual ICE DXY:** confirm an authorized provider/endpoint, stable symbol and value semantics, daily observation/close convention and timezone, publication/revision behavior, payload provenance, and permitted use for automated collection and storage. Record any licensing/attribution obligations.
- **Path B — change the metric definition:** explicitly approve a different macro indicator (for example, Federal Reserve Nominal Broad U.S. Dollar Index `DTWEXBGS`), update the product/metric contract and user-facing description so it no longer claims to be ICE DXY, then review units, release lag, revisions, and freshness before changing the registry.

No choice between A and B is made by this review. Do not scrape ICE pages, reverse-engineer private endpoints, infer licensing permission from public visibility, or substitute `DTWEXBGS` automatically.

## Result for Plan 100

- `macro.dxy` remains **blocked / source not approved**.
- No metric registry, source registry, observation, scenario, score, probability, or monitoring state changed.
- BTC remains `not_evaluable` while this required input and the separate ETF publication/revision/finality contract remain unresolved.
