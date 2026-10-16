# BTC ETF issuer-primary source coverage matrix — 2026-10-16

**Status:** initial public-documentation inventory; not an approved ingestion contract.  
**Purpose:** assess whether official issuer/SEC material can support an auditable daily US spot BTC ETF net-flow series without relying on an aggregator's retained raw responses.  
**Mode:** public documentation/search-result review only. No issuer endpoints were queried, no data captured, and no source registry changed.

## Decision so far

Official issuer pages do expose dated NAV, assets and/or shares-outstanding information for several products. This is promising for per-fund cross-checks. The review has **not** established a single complete, machine-readable, daily historical feed for every active fund with uniform date semantics, correction history, stable endpoints and acceptable retention terms. Therefore this is not yet a replacement for Farside/TFTC and does not unblock the ETF gate.

A change in net assets is **not** equivalent to daily net flow because BTC price movement changes assets. Any issuer-derived calculation must be based on an explicitly approved per-share/creation-redemption method, valuation date convention and full fund-universe reconciliation.

## Current-universe caution

The initial US spot BTC ETF cohort included IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC, Grayscale Mini BTC, and Hashdex DEFI. Morgan Stanley Bitcoin Trust (MSBT) began trading on NYSE Arca on 2026-04-08 and must also be included from launch. Hashdex DEFI was delisted effective **2026-09-03**; exclude it from the active aggregate after that date but preserve its historical applicability. Reconfirm the active universe before any future capture.

## Initial coverage matrix

| Ticker | Official source located | Publicly visible fields in reviewed material | History / automation evidence | Status |
|---|---|---|---|---|
| IBIT | [BlackRock iShares product page](https://www.blackrock.com/us/individual/products/333011/fund); [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1980994/000143774926026004/bit20260630c_10q.htm) | SEC reports at 2026-06-30: 1,296,040,000 shares, NAV/share $33.48, net assets $43.386bn, 734,261 BTC; 187,360,000 shares redeemed during Q2, disclosed monthly | Official SEC filing has monthly redemption totals and quarter-end holdings, not a complete daily creation/redemption series; product page has dated daily facts but full history/API and archival terms not verified | Strong periodic primary cross-check; not accepted as daily flow source |
| FBTC | [Fidelity quote page](https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=FBTC); [SEC quarterly report](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm) | NAV, shares outstanding on quote page; SEC reports give point-in-time share counts and statements | Daily historical share-count endpoint and correction semantics not verified; SEC reports are periodic, not daily flow history | Candidate for cross-check; not accepted |
| ARKB | [21shares US product overview](https://www.21shares.com/en-us/products-us); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1869699/000121390026086191/ea0299118-10q_ark21shares.htm) | Product overview exposes dated NAV, market price, AUM; SEC 10-Q gives shares outstanding 97,015,000, NAV/share $19.47 and net assets $1.889bn at 2026-06-30 | Filing is periodic and gives quarter-end holdings/financial data; complete daily historical shares/creation-redemption series and retention terms not verified | Periodic primary cross-check candidate; not accepted as daily flow source |
| BITB | [Bitwise official product page](https://bitbetf.com/); [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm) | SEC reports at 2026-06-30: 66,690,000 shares, NAV/share $31.87, net assets $2.125612bn and 36,207.6919 BTC. Current page separately shows 68,780,000 shares and AUM $3,047,421,621 as of 2026-10-13; NAV $45.11 as of 2026-10-12; holdings 37,317.87 BTC as of 2026-10-13 | SEC is a quarter-end cross-check; current product page exposes a NAV/market-price chart spanning 2024-01-10 to 2026-10-13, but complete daily share/creation-redemption history and systematic archive rights are unverified | Stronger dated primary cross-check; not accepted as daily flow source |
| BTCO | [Invesco product page](https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Advisor&ticker=BTCO); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1855781/000119312526338719/btco-20260630.htm) | SEC Q2 filing gives 5,370,000 shares, NAV/share $58.81, net assets $315.789m and BTC holdings of 5,345 BTC at 2026-06-30; it reports quarterly purchases of 140,000 shares and redemptions of 1,510,000 shares | Filing provides explicit quarterly share transactions, but not a complete daily flow series; official page states daily NAV, not daily share creation/redemption history; archive terms/API contract not verified | Strong periodic primary cross-check candidate; not accepted as daily flow source |
| HODL | [VanEck official product page](https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/) | Dated daily NAV, net assets, shares outstanding, BTC in trust; NAV history controls | Dated historical pages are discoverable; exact bulk/API endpoint, full history completeness, and archive terms not verified | Strong candidate for cross-check; not accepted |
| BRRR | [CoinShares official product page](https://coinshares.com/us/etf/brrr/) | Dated NAV/AUM and holdings; SEC filing links | Some date-specific records and filings located; complete daily share-count series and machine-readable contract not verified | Partial evidence; investigate |
| EZBC | [Franklin Templeton official product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS) | Daily prices, dated NAV, shares outstanding and fund details | Page labels information updated daily; exact machine-readable history/retention contract not verified | Strong candidate for cross-check; not accepted |
| BTCW | [WisdomTree US product page](https://www.wisdomtree.com/us/products/crypto/btcw) | Dated NAV, total assets, shares outstanding; NAV/market-price history controls | Historical chart is exposed; daily series endpoint and durable archive terms not verified | Strong candidate for cross-check; not accepted |
| GBTC | [Grayscale product site](https://etfs.grayscale.com/gbtc); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm); [SEC 10-Q for 2026-03-31](https://www.sec.gov/Archives/edgar/data/1588489/000119312526206329/gbtc-20260331.htm) | Official 2026 Q2 filing gives dated NAV/share, net assets, BTC holdings and shares outstanding at 2026-06-30; Q1 filing discloses shares issued/redeemed and net share change for the quarter | Official SEC history is authoritative but periodic, not a complete daily flow series; the product site returned HTTP 403 in this review, so no page/API history or systematic-retention terms were verified | SEC filings usable for periodic cross-checks; daily flow source not accepted |
| BTC (Grayscale Bitcoin Mini Trust) | [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm) | At 2026-06-30: 122,749,963 shares, principal-market NAV/share $25.98, net assets $3.189bn and 54,280.40050138 BTC; filing cover also reports 133,199,963 shares outstanding as of 2026-07-30 (a later date than the statement date) | SEC filing provides quarter-end financials/holdings and separate cover-page later share count; not a complete daily flow feed; systematic archive rights not assessed | Periodic primary cross-check candidate; not accepted as daily flow source |
| DEFI | [Hashdex official page](https://www.hashdex-etfs.com/defi) | NAV/closing price and shares outstanding shown for dates around closure | Official page states delisted from NYSE Arca effective 2026-09-03 | Exclude from active aggregate after delisting; retain historical-universe metadata |
| MSBT | [Morgan Stanley Bitcoin Trust product page](https://www.morganstanley.com/im/en-us/institutional-investor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html); [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm) | Listed 2026-04-08. At 2026-06-30: 17,650,000 shares, Principal Market NAV/share $16.94, net assets $298,979,473 and 5,059.30771216 BTC; filing cover separately reports 21,740,000 shares as of 2026-07-31. Q2 report shows 17,900,000 shares issued and 250,000 redeemed from launch through quarter end | Historical price/performance UI exists, but a complete daily historical share/creation-redemption feed, correction history, machine-readable contract and systematic retention rights remain unverified | Active fund from 2026-04-08; periodic primary cross-check candidate, not accepted as daily flow source |

## Research update — Grayscale Bitcoin Mini Trust (2026-10-16)

The official SEC 2026-Q2 10-Q reports, as of 2026-06-30, 122,749,963 shares, principal-market NAV/share $25.98, net assets $3.189bn and 54,280.40050138 BTC held. The filing cover separately reports 133,199,963 shares outstanding as of 2026-07-30; the dates differ and must not be treated as same-day observations. This is a useful primary-source periodic cross-check, not a complete daily flow series. Source: [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm). No data capture or source promotion was performed.

## Research update — Grayscale GBTC (2026-10-16)

The official SEC 10-Q for the quarter ended 2026-06-30 provides point-in-time data: 178,580,100 shares outstanding at quarter-end, NAV/share $45.56, net assets $8.136546 billion, and 138,505.75680424 BTC held. The same filing distinguishes investment performance from capital-share transactions and reports shares issued/redeemed for the quarter; the Q1 filing also provides quarterly share creations/redemptions. This supports periodic reconciliation, but does not establish a complete daily series for all reporting dates. The Grayscale product page was not retrievable in this review (HTTP 403), so no assumptions are made about undocumented endpoints. Sources: [2026 Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm), [2026 Q1 10-Q](https://www.sec.gov/Archives/edgar/data/1588489/000119312526206329/gbtc-20260331.htm).

**Decision:** GBTC remains a primary-source periodic cross-check candidate, not a daily flow source. No capture or retention of raw data was performed.

## Research update — ARKB and BTCO (2026-10-16)

- **ARKB:** the official 2026-Q2 SEC 10-Q gives 97,015,000 shares outstanding, NAV/share $19.47 and net assets $1.889bn at 2026-06-30. This supersedes the earlier Q1-period note as the latest point-in-time observation; it still does not prove daily historical shares/creation-redemption coverage.
- **BTCO:** the 2026-Q2 SEC 10-Q gives 5,370,000 shares, NAV/share $58.81, net assets $315.789m and holdings of 5,345 BTC at 2026-06-30. It also reports 140,000 shares purchased and 1,510,000 redeemed during Q2 (net -1,370,000 shares). These are useful quarterly transactions, not a daily flow series; a daily NAV publication statement alone does not establish daily share creations/redemptions.
- **Decision:** both remain primary-source periodic cross-check candidates, not replacements for daily ETF flow sources. No issuer endpoint was queried, no data captured, and no code/source priority changed.

## Research update — universe correction and BITB/MSBT evidence (2026-10-16)

A review of official issuer and SEC materials surfaced an omitted active fund: **Morgan Stanley Bitcoin Trust (MSBT)** began trading on NYSE Arca on 2026-04-08 and must be included from launch. Its SEC Q2 2026 report states at 2026-06-30: 17,650,000 shares, Principal Market NAV/share $16.94, net assets $298,979,473 and 5,059.30771216 BTC; the cover separately reports 21,740,000 shares as of 2026-07-31. From launch through quarter end, it reports 17,900,000 shares issued and 250,000 redeemed. These are period-level transactions, not a complete daily series. Sources: [Morgan Stanley product page](https://www.morganstanley.com/im/en-us/institutional-investor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html), [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm), [launch announcement](https://www.morganstanley.com/press-releases/msim-enters-with-launch-of-morgan-stanley-bitcoin-trust).

BITB's official page provides shares outstanding 68,780,000 and AUM $3,047,421,621 as of 2026-10-13; NAV $45.11 as of 2026-10-12; and holdings of 37,317.87 BTC as of 2026-10-13. Its NAV/market-price chart spans 2024-01-10 to 2026-10-13, but a complete downloadable daily share-count/creation-redemption series and systematic archival rights were not established. Source: [Bitwise BITB](https://bitbetf.com/).

**Decision:** include MSBT from launch, exclude DEFI after 2026-09-03, and do not treat quarterly filings or daily NAV display as a complete daily flow series. No API capture, source promotion, registry/formula change, or scenario evaluation was performed.

## Research update — Q2 SEC cross-check for IBIT, FBTC and BITB (2026-10-16)

The latest located issuer SEC 10-Qs for the quarter ended 2026-06-30 improve point-in-time reconciliation but do not establish a full daily net-flow feed:

- **IBIT:** 1,296,040,000 shares outstanding, NAV/share $33.48, net assets $43.386012125bn and 734,261 BTC at 2026-06-30. The report lists 187,360,000 shares redeemed during Q2, broken out by month. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1980994/000143774926026004/bit20260630c_10q.htm)
- **FBTC:** 200,328,476 shares outstanding, NAV/share $51.44, net assets $10.304103bn and 174,383 BTC at 2026-06-30; the filing cover separately reports 197,403,476 shares as of 2026-07-31. These dates must remain separate. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm)
- **BITB:** 66,690,000 shares outstanding, NAV/share $31.87, net assets $2.125612bn and 36,207.6919 BTC at 2026-06-30. The official product page separately shows 68,780,000 shares and 37,317.87 BTC as of 2026-10-13, with NAV $45.11 as of 2026-10-12. These are different observation dates, not one row. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm); [Bitwise page](https://bitbetf.com/).

**Decision:** SEC quarterly reports and dated issuer pages are useful primary checks for holdings, shares and NAV, and IBIT discloses monthly redemptions. None of this proves complete daily creations/redemptions for the whole active universe. Do not derive flow from change in AUM, do not promote a source or change formula/registry, and do not capture data or evaluate the scenario on this basis alone.

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
- Morgan Stanley MSBT: https://www.morganstanley.com/im/en-us/institutional-investor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html
- Invesco Galaxy BTCO SEC filing: https://www.sec.gov/Archives/edgar/data/1855781/000119312526083572/btco-20251231.htm
- VanEck HODL: https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/
- CoinShares BRRR: https://coinshares.com/us/etf/brrr/
- Franklin EZBC: https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS
- WisdomTree BTCW: https://www.wisdomtree.com/us/products/crypto/btcw
- Grayscale GBTC: https://etfs.grayscale.com/gbtc
- Grayscale Mini BTC SEC filing: https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm
- Hashdex DEFI closure notice/product page: https://www.hashdex-etfs.com/defi

This is a research inventory, not legal advice and not evidence that any page permits systematic automated retention.


## Additional SEC cross-check note

Further Q2 2026 SEC findings for HODL, BRRR and BTCW are recorded in [Plan 100 ETF SEC cross-check — HODL/BRRR/BTCW](PLAN-100-ETF-SEC-CROSSCHECK-HODL-BRRR-BTCW-2026-10-16.md). The main matrix rows above remain the initial inventory until these findings are reconciled into the table. Do not treat this linked note as approval for daily ingestion or source promotion.
