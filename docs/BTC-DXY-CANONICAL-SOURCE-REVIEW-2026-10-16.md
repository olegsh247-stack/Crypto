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


## Additional candidate review — public pages, unofficial access and historical-data providers (2026-10-16)

The user supplied a shortlist of Yahoo Finance `DX-Y.NYB`, TradingView `TVC:DXY` / `INDEX:DXY`, Dukascopy `dollaridxusd`, FRED `DTWEXBGS`, and paid historical providers. These are candidate leads, not approved ingestion sources.

### Findings from current public documentation

- **Yahoo Finance `DX-Y.NYB`:** Yahoo's page identifies the instrument as “US Dollar Index” and labels ICE Futures as the market. However, Yahoo's terms prohibit automated collection without express prior permission and prohibit redistribution of Yahoo Finance data. The `yfinance` package is unofficial and does not grant permission from Yahoo. Therefore do not use it as the project's unattended collector absent explicit authorization or a separate authorized feed. References: https://finance.yahoo.com/quote/DX-Y.NYB/ ; https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html ; https://help.yahoo.com/kb/SLN2352.html
- **Dukascopy `dollaridxusd`:** a third-party tool documents downloadable tick/minute/hour/day history from 2017-12-01. Dukascopy's published XML-data license, however, describes the relevant derivative index quotes as one-minute statistical averages, not actual exchange index values; requires prior registration/approval for the declared use, non-commercial temporary use under that agreement, and restrictions including a visible Dukascopy attribution/banner for derivative products. This does not establish that the tool's downloadable bars have the same terms or that the series equals the official ICE cash DXY. Do not promote it without instrument-identity and applicable-license confirmation. References: https://www.dukascopy-node.app/instrument/dollaridxusd ; https://www.dukascopy.com/plugins/cont.php?ref_id=1273
- **TradingView `TVC:DXY` / `INDEX:DXY`:** TradingView's terms describe its market data as licensed for display-only use and restrict non-display processing. A public chart is not an authorized ingestion API for the BTC research pipeline. Reference: https://www.tradingview.com/policies/
- **FRED `DTWEXBGS`:** daily Federal Reserve Nominal Broad U.S. Dollar Index, index Jan 2006=100, with data subject to revision. It is technically attractive for a separate broad-dollar macro metric but is not ICE DXY. References: https://fred.stlouisfed.org/series/DTWEXBGS ; https://alfred.stlouisfed.org/series?seid=DTWEXBGS
- **Portara/CQG:** Portara lists ICE Futures US dollar-index futures data with daily history from 1985-11-20 and intraday data from 1987-09-01. This is a credible paid historical-futures lead, but futures/settlement data must not be relabelled as the cash DXY index level; price, delivery, continuity/roll semantics, and reuse rights need confirmation. References: https://portaracqg.com/futures/bats/dxa ; https://portaracqg.com/historical-daily-futures-data/
- **FirstRate Data:** its public catalog advertises historical futures/index datasets, but the reviewed evidence did not establish a specific authorized ICE cash-DXY endpoint at the quoted price. Treat the price and availability as unverified for this exact metric until a product page/quote confirms it.

### Current decision

No free/public candidate has yet passed all four gates: (1) exact instrument identity, (2) permitted automated collection and durable storage, (3) a stable endpoint and timestamps/date convention, and (4) publication/revision semantics suitable for a reproducible research observation.

The best next *technical investigation* is to request/inspect the exact product and data terms for a licensed ICE DXY feed, while treating Yahoo as a visible reference only unless written automated-use permission exists. If a free data source is required, the clean alternative is to propose a **new, explicitly named broad-dollar metric** based on FRED DTWEXBGS and assess its research value; do not call it DXY. The Dukascopy symbol remains a secondary lead only, pending its exact instrument specification and applicable license.

At the time of this initial review, no source priority or metric registry was changed. This DXY-blocker decision was superseded on 2026-10-16 by the optional-context decision below; the ETF gate remains separate.


## Decision update — DXY is optional context, not a BTC readiness gate (2026-10-16)

The source search is closed for the first BTC scenario. DXY is useful macro context, but not important enough to keep the entire BTC workflow blocked.

- **Primary reference for the actual ICE DXY series:** Yahoo Finance [DX-Y.NYB](https://finance.yahoo.com/quote/DX-Y.NYB/), which publicly labels the quote as US Dollar Index / ICE Futures. Treat it as a manual research/display reference only; do not automate collection through Yahoo or redistribute its data without the required permission.
- **Fallback macro context:** Federal Reserve / FRED [DTWEXBGS](https://fred.stlouisfed.org/series/DTWEXBGS), an official daily broad-dollar index. It is not DXY, uses a different basket/methodology, and is updated with a release lag; only use it under its own explicit name and date/freshness rules. Never write it into `macro.dxy` or splice it into a DXY time series.
- **Readiness behavior:** `macro.dxy` is now optional and non-blocking. If the primary reference is unavailable, use the clearly labelled broad-dollar proxy only when useful; if neither is available, omit DXY context and continue. No more DXY source investigation is required for the first BTC scenario.
- **Scope:** this does not approve Yahoo automated ingestion, does not add a new metric/source priority, and does not claim FRED and ICE DXY are interchangeable. ETF flow publication/revision/finality remains a separate readiness gate.

The implementation changes only the read-only readiness requirement and its tests/documentation. No observation, scenario state, score, probability, production database, ingestion job, or deployment is changed.
