# BTC ETF issuer-primary source coverage matrix — 2026-10-16

**Status:** initial public-documentation inventory; not an approved ingestion contract.  
**Purpose:** assess whether official issuer/SEC material can support an auditable daily US spot BTC ETF net-flow series without relying on an aggregator's retained raw responses.  
**Mode:** public documentation/search-result review only. No issuer endpoints were queried, no data captured, and no source registry changed.

## Decision so far

Official issuer pages do expose dated NAV, assets and/or shares-outstanding information for several products. This is promising for per-fund cross-checks. The review has **not** established a single complete, machine-readable, daily historical feed for every active fund with uniform date semantics, correction history, stable endpoints and acceptable retention terms. Therefore this is not yet a replacement for Farside/TFTC and does not unblock the ETF gate.

A change in net assets is **not** equivalent to daily net flow because BTC price movement changes assets. Any issuer-derived calculation must be based on an explicitly approved per-share/creation-redemption method, valuation date convention and full fund-universe reconciliation.

## Current-universe caution

The initial US spot BTC ETF cohort included IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC, Grayscale Mini BTC, and Hashdex DEFI. Hashdex's official page currently says DEFI was delisted from NYSE Arca effective **2026-09-03**. Do not include it in the current active-fund aggregate after that date; its historical rows may still matter for dates when it was active. Reconfirm the active universe before any future source capture.

## Initial coverage matrix

| Ticker | Official source located | Publicly visible fields in reviewed material | History / automation evidence | Status |
|---|---|---|---|---|
| IBIT | [BlackRock iShares product page](https://www.blackrock.com/us/individual/products/333011/fund) | Dated NAV, net assets, shares outstanding; holdings CSV link | Page shows date-stamped daily facts; downloadable/history endpoint contract and complete daily share-count history not verified | Candidate for issuer cross-check; not accepted |
| FBTC | [Fidelity quote page](https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=FBTC); [SEC quarterly report](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm) | NAV, shares outstanding on quote page; SEC reports give point-in-time share counts and statements | Daily historical share-count endpoint and correction semantics not verified; SEC reports are periodic, not daily flow history | Candidate for cross-check; not accepted |
| ARKB | [21shares US product overview](https://www.21shares.com/en-us/products-us); [ARKB SEC 10-Q for 2026-03-31](https://cdn.21shares.com/uploads/product_documents/10-Q/ARKB_10-Q_Mar26.pdf) | Product overview exposes dated NAV, market price, AUM and returns; SEC 10-Q provides shares outstanding as of a filing date | SEC filing is periodic (114,980,000 shares outstanding as of 2026-05-04); complete daily historical shares/creation-redemption series and retention terms not verified | Periodic primary cross-check candidate; not accepted as daily flow source |
| BITB | [Bitwise official product page](https://bitbetf.com/) | Dated NAV/AUM, Bitcoin held, holdings; history controls shown from Jan 2024 | Historical NAV/market-price chart shown; complete daily shares-outstanding history and terms for systematic archival not verified | Partial evidence; investigate |
| BTCO | [Invesco product page](https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Advisor&ticker=BTCO); [SEC 10-Q for 2026-03-31](https://www.sec.gov/Archives/edgar/data/1855781/000119312526209710/btco-20260331.htm); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1855781/000119312526338719/btco-20260630.htm) | Invesco states NAV is calculated/published each business day; SEC Q1 filing gives shares outstanding at 2026-03-31 (6,740,000) and Q2 filing exists for 2026-06-30 | Daily NAV statement is not proof of a complete historical daily share-count/creation-redemption feed; filings provide periodic share and capital-transaction evidence, not a daily flow series; archive terms/API contract not verified | Primary periodic cross-check candidate; not accepted as daily flow source |
| HODL | [VanEck official product page](https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/) | Dated daily NAV, net assets, shares outstanding, BTC in trust; NAV history controls | Dated historical pages are discoverable; exact bulk/API endpoint, full history completeness, and archive terms not verified | Strong candidate for cross-check; not accepted |
| BRRR | [CoinShares official product page](https://coinshares.com/us/etf/brrr/) | Dated NAV/AUM and holdings; SEC filing links | Some date-specific records and filings located; complete daily share-count series and machine-readable contract not verified | Partial evidence; investigate |
| EZBC | [Franklin Templeton official product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS) | Daily prices, dated NAV, shares outstanding and fund details | Page labels information updated daily; exact machine-readable history/retention contract not verified | Strong candidate for cross-check; not accepted |
| BTCW | [WisdomTree US product page](https://www.wisdomtree.com/us/products/crypto/btcw) | Dated NAV, total assets, shares outstanding; NAV/market-price history controls | Historical chart is exposed; daily series endpoint and durable archive terms not verified | Strong candidate for cross-check; not accepted |
| GBTC | [Grayscale product site](https://etfs.grayscale.com/gbtc); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm); [SEC 10-Q for 2026-03-31](https://www.sec.gov/Archives/edgar/data/1588489/000119312526206329/gbtc-20260331.htm) | Official 2026 Q2 filing gives dated NAV/share, net assets, BTC holdings and shares outstanding at 2026-06-30; Q1 filing discloses shares issued/redeemed and net share change for the quarter | Official SEC history is authoritative but periodic, not a complete daily flow series; the product site returned HTTP 403 in this review, so no page/API history or systematic-retention terms were verified | SEC filings usable for periodic cross-checks; daily flow source not accepted |
| BTC (Grayscale Bitcoin Mini Trust) | [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm) | Periodic shares outstanding, NAV/share and net assets | SEC report gives quarterly/date-specific values, not a daily flow series; official daily history not verified | Partial evidence; investigate |
| DEFI | [Hashdex official page](https://www.hashdex-etfs.com/defi) | NAV/closing price and shares outstanding shown for dates around closure | Official page states delisted from NYSE Arca effective 2026-09-03 | Exclude from active aggregate after delisting; retain historical-universe metadata |

## Research update — Grayscale GBTC (2026-10-16)

The official SEC 10-Q for the quarter ended 2026-06-30 provides point-in-time data: 178,580,100 shares outstanding at quarter-end, NAV/share $45.56, net assets $8.136546 billion, and 138,505.75680424 BTC held. The same filing distinguishes investment performance from capital-share transactions and reports shares issued/redeemed for the quarter; the Q1 filing also provides quarterly share creations/redemptions. This supports periodic reconciliation, but does not establish a complete daily series for all reporting dates. The Grayscale product page was not retrievable in this review (HTTP 403), so no assumptions are made about undocumented endpoints. Sources: [2026 Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm), [2026 Q1 10-Q](https://www.sec.gov/Archives/edgar/data/1588489/000119312526206329/gbtc-20260331.htm).

**Decision:** GBTC remains a primary-source periodic cross-check candidate, not a daily flow source. No capture or retention of raw data was performed.

## Research update — ARKB and BTCO (2026-10-16)

- **ARKB:** the official 21shares product overview provides date-stamped NAV, market price and AUM, while the 2026-Q1 SEC report states 114,980,000 shares outstanding as of 2026-05-04. This does not prove daily historical shares or creations/redemptions. The SEC report is periodic and does not independently supply a daily flow feed.
- **BTCO:** Invesco states that NAV is calculated and published each business day. SEC reports for 2026-Q1 and 2026-Q2 provide periodic financial/share data; the Q1 filing states 6,740,000 shares outstanding at 2026-03-31. The reviewed evidence does not establish a complete daily historical shares/creation-redemption endpoint or systematic-retention terms.
- **Decision:** both are useful primary-source cross-check candidates but neither replaces the current ETF flow sources or clears the source-rights/archive gate. No endpoints were queried, no data captured, and no code/source priority changed.

## Required next checks before this becomes an accepted source contract

1. Confirm the complete current active fund universe from primary exchange/issuer records, including launch, ticker changes, mergers, liquidation and delisting dates.
2. For each active fund, identify the exact official page/API/file that publishes **shares outstanding or creation/redemption units** and NAV for each reporting date; record date semantics and source timezone.
3. Establish whether history can be downloaded reproducibly without scraping prohibited content or violating issuer/provider terms. Public visibility alone is not archival permission.
4. Verify historical depth and missing-date behaviour. Distinguish current snapshots from actual historical series.
5. Define and test an approved per-fund calculation with units, NAV valuation timestamp, share-count effective date, basket size, split/corporate-action handling and rounding. Do not use change in net assets as a proxy for flows.
6. Reconcile all active funds and compare the aggregate to existing candidate series for several identical dates; retain disagreements rather than replacing them with zero or silently selecting one provider.
7. Only after the source contract is complete, update the metric registry and evaluator through a reviewed code change. No source promotion or formula change is implied by this matrix.

## Sources

- BlackRock IBIT: https://www.blackrock.com/us/individual/products/333011/fund
- Fidelity FBTC: https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=FBTC
- 21shares ARKB: https://www.21shares.com/en-us/products-us
- Bitwise BITB: https://bitbetf.com/
- Invesco Galaxy BTCO SEC filing: https://www.sec.gov/Archives/edgar/data/1855781/000119312526083572/btco-20251231.htm
- VanEck HODL: https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/
- CoinShares BRRR: https://coinshares.com/us/etf/brrr/
- Franklin EZBC: https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS
- WisdomTree BTCW: https://www.wisdomtree.com/us/products/crypto/btcw
- Grayscale GBTC: https://etfs.grayscale.com/gbtc
- Grayscale Mini BTC SEC filing: https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm
- Hashdex DEFI closure notice/product page: https://www.hashdex-etfs.com/defi

This is a research inventory, not legal advice and not evidence that any page permits systematic automated retention.
