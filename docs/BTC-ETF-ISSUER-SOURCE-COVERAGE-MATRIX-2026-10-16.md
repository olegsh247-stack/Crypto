# BTC ETF issuer-primary source coverage matrix — 2026-10-16

**Status:** initial public-documentation inventory; not an approved ingestion contract.  
**Purpose:** assess whether official issuer/SEC material can support an auditable daily US spot BTC ETF net-flow series without relying on an aggregator's retained raw responses.  
**Mode:** public documentation/search-result review only. No issuer endpoints were queried, no data captured, and no source registry changed.

## Decision so far

Official issuer pages do expose dated NAV, assets and/or shares-outstanding information for several products. This is promising for per-fund cross-checks. The review has **not** established a single complete, machine-readable, daily historical feed for every active fund with uniform date semantics, correction history, stable endpoints and acceptable retention terms. Therefore this is not yet a replacement for Farside/TFTC and does not unblock the ETF gate.

A change in net assets is **not** equivalent to daily net flow because BTC price movement changes assets. Any issuer-derived calculation must be based on an explicitly approved per-share/creation-redemption method, valuation date convention and full fund-universe reconciliation.

## Current-universe caution

The initial US spot BTC ETF cohort included IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC, Grayscale Mini BTC, and Hashdex DEFI. Morgan Stanley Bitcoin Trust (MSBT) began trading on NYSE Arca on 2026-04-08 and must also be included from launch. Osprey Bitcoin Trust (OBTC) must be included from its conversion to a Nasdaq-listed ETF on **2025-12-19**; its earlier OTCQX-traded trust history is a different applicability period. Hashdex DEFI's last trading day was **2026-08-17**; exclude it from the active trading cohort after that date but preserve its historical applicability. The later 2026-09-03 Form 15 is not the last-trading date. The active review universe therefore includes OBTC and MSBT and excludes delisted Hashdex DEFI after its delisting date. Reconfirm the full universe before any future capture.

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
| EZBC | [Franklin Templeton official product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS); [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm) | At 2026-06-30: 9,800,000 shares, NAV/share $34.15, net assets $334,694,929 and 5,664.0163 BTC. Q2: 150,000 shares issued and 1,250,000 redeemed. Official product page shows dated facts marked updated daily | SEC gives quarter-end balance and quarterly share transactions, not a complete daily flow series; product page history/API, correction semantics and durable archive rights not verified | Strong periodic primary cross-check candidate; not accepted as daily flow source |
| BTCW | [WisdomTree US product page](https://www.wisdomtree.com/us/products/crypto/btcw) | Dated NAV, total assets, shares outstanding; NAV/market-price history controls | Historical chart is exposed; daily series endpoint and durable archive terms not verified | Strong candidate for cross-check; not accepted |
| GBTC | [Grayscale product site](https://etfs.grayscale.com/gbtc); [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm); [SEC 10-Q for 2026-03-31](https://www.sec.gov/Archives/edgar/data/1588489/000119312526206329/gbtc-20260331.htm) | Official 2026 Q2 filing gives dated NAV/share, net assets, BTC holdings and shares outstanding at 2026-06-30; Q1 filing discloses shares issued/redeemed and net share change for the quarter | Official SEC history is authoritative but periodic, not a complete daily flow series; the product site returned HTTP 403 in this review, so no page/API history or systematic-retention terms were verified | SEC filings usable for periodic cross-checks; daily flow source not accepted |
| BTC (Grayscale Bitcoin Mini Trust) | [SEC 10-Q for 2026-06-30](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm) | At 2026-06-30: 122,749,963 shares, principal-market NAV/share $25.98, net assets $3.189bn and 54,280.40050138 BTC; filing cover also reports 133,199,963 shares outstanding as of 2026-07-30 (a later date than the statement date) | SEC filing provides quarter-end financials/holdings and separate cover-page later share count; not a complete daily flow feed; systematic archive rights not assessed | Periodic primary cross-check candidate; not accepted as daily flow source |
| DEFI | [Hashdex official page](https://www.hashdex-etfs.com/defi) | NAV/closing price and shares outstanding shown for dates around closure | SEC filing states trading was suspended after close on 2026-08-17; 2026-09-03 Form 15 concerns later reporting termination | Exclude from active aggregate after delisting; retain historical-universe metadata |
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

**Decision:** include MSBT from launch, exclude DEFI after 2026-08-17, and do not treat quarterly filings or daily NAV display as a complete daily flow series. No API capture, source promotion, registry/formula change, or scenario evaluation was performed.

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


## Research update — EZBC / Franklin Bitcoin ETF (2026-10-16)

The SEC Q2 2026 Form 10-Q for Franklin Bitcoin ETF reports, as of 2026-06-30, 9,800,000 shares outstanding, NAV/share $34.15, net assets $334,694,929 and 5,664.0163 BTC. For Q2 it reports 150,000 shares issued and 1,250,000 redeemed. These quarter-level share transactions are useful for reconciliation, but do not establish a complete daily creations/redemptions series. The Franklin product page presents dated fund facts marked “Updated Daily”; this alone does not prove a complete machine-readable daily share-count history, correction semantics, or permission for systematic durable retention. Sources: [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm), [Franklin official product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS).

**Decision:** EZBC remains a primary-source periodic cross-check candidate, not a daily flow source. Do not infer net flows from AUM changes, promote the source, or change registry/formula/evaluator. No issuer endpoint was queried and no data was captured.


## Additional issuer-page review — BITB / Bitwise (2026-10-16)

The public Bitwise BITB page exposes dated fund facts such as shares outstanding, NAV, net assets and holdings; current web results show these fields with an explicit “Data as of” date. Its materials page links prospectus and periodic SEC filings, including Q2 2026 10-Q. This is useful as a dated primary-source snapshot for reconciliation.

The page review did not establish a complete, reproducible daily historical series of shares outstanding or daily creations/redemptions, per-row correction/revision semantics, or permission for automated long-term raw-page retention. A daily-updated current fact block is not equivalent to a downloadable historical time series. Quarterly share issuance/redemption totals are not daily flows, and AUM deltas must not be used as a substitute.

**Decision:** BITB remains a primary-source periodic cross-check candidate, not an accepted daily net-flow source. Do not promote it in the canonical registry or change the calculation. No page payload was captured. References: https://bitbetf.com/ and https://bitbetf.com/materials


## Reconciled SEC Q2 2026 cross-check — HODL, BRRR and BTCW (2026-10-16)

The linked SEC cross-check has now been brought into this matrix as a separate dated evidence section. These are point-in-time/quarterly primary records, not a daily flow feed:

- **HODL (VanEck):** at 2026-06-30, 57,425,000 shares, NAV/share $16.70, net assets $958,827,545 and 16,241 BTC. Q2 reported 3,200,000 shares created and 5,900,000 redeemed. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1838028/000093041326002505/c117299_10q-ixbrl.htm).
- **BRRR (CoinShares Bitcoin ETF):** at 2026-06-30, 20,795,000 shares, NAV/share $16.46, net assets $342,354,115 and 5,864 BTC on the investment schedule. Filing cover separately reports 20,895,000 shares as of 2026-07-30; keep the two dates distinct. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1841175/000199937126017701/brrr-10q_063026.htm).
- **BTCW (WisdomTree):** at 2026-06-30, 2,185,000 shares, NAV/share $62.46 and net assets $136,476,680. The investment schedule rounds holdings to 2,310 BTC; a note separately describes 2,309.689 BTC under a reference-rate valuation versus principal-market value. Preserve the valuation-method distinction. [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1850391/000121465926009996/wtb8626110q.htm).

**Interpretation and limits:** HODL's quarterly share creations/redemptions help reconcile quarter-level activity but are not daily records. BRRR's later cover-page share count is a different observation date from quarter-end. BTCW's principal-market and reference-rate holdings figures are not interchangeable. These filings do not establish complete daily creations/redemptions, row-level publication/finality/revision behavior, or rights to systematic raw-response retention and independent archive/restore.

**Decision:** retain these as primary-source periodic cross-checks only. Do not infer flows from AUM changes, do not promote any of these records to the canonical daily source, and do not change registry, formula, evaluator, production observations, or scenario state. No live capture was performed.


## Three-gate review for the full active universe (2026-10-16)

This section applies the same three checks to every fund in the current active cohort. “Primary evidence found” means a public issuer/SEC source was identified; it does **not** mean a complete daily flow feed or archival permission exists. “Not established” means the reviewed material did not prove the condition; it is not a claim that the provider forbids all use.

| Fund | Gate 1 — primary source for dated evidence | Gate 2 — reproducible daily shares/creation-redemption history | Gate 3 — automated capture + durable private archive/backup/restore rights | Current conclusion |
|---|---|---|---|---|
| IBIT | **Found:** BlackRock page and SEC Q2 10-Q; SEC also reports Q2 redemptions with monthly breakdown | **Not established:** SEC is periodic; current product facts do not prove complete downloadable daily shares/creation-redemption history | **Unresolved:** no reviewed source-specific permission for systematic raw retention and independent restore | Periodic cross-check only |
| FBTC | **Found:** Fidelity quote page and SEC Q2 10-Q | **Not established:** dated shares and quarter-end report, but no verified complete daily historical share/creation-redemption endpoint | **Unresolved:** API/archive rights and retention terms not established | Periodic cross-check only |
| ARKB | **Found:** 21shares product overview and SEC Q2 10-Q | **Not established:** NAV/AUM history and quarter-end shares do not prove daily shares/creation-redemption history | **Unresolved:** systematic capture and durable raw archive rights not established | Periodic cross-check only |
| BITB | **Found:** Bitwise page, materials page and SEC Q2 10-Q; current dated facts and NAV/market-price chart located | **Partial only:** NAV/market-price chart spans 2024-01-10 onward; complete daily shares/creation-redemption series not established | **Unresolved:** public page/chart does not grant systematic raw-page retention rights | Periodic cross-check only |
| BTCO | **Found:** Invesco product page and SEC reports; Q2 report gives quarterly share purchases/redemptions | **Not established:** quarterly transactions and daily NAV publication do not equal a complete daily flow series | **Unresolved:** archive/automation terms not verified | Periodic cross-check only |
| HODL | **Found:** VanEck product page and SEC Q2 10-Q | **Partial/unclear:** dated daily fund facts are visible, but complete reproducible daily history, endpoint stability and revision behavior not verified | **Unresolved:** no verified permission for systematic capture and independent durable restore | Periodic cross-check only |
| BRRR | **Found:** CoinShares product page and SEC Q2 10-Q | **Not established:** dated values and quarter-level report, no complete daily share/creation-redemption series verified | **Unresolved:** machine-readable contract and archive rights not verified | Periodic cross-check only |
| EZBC | **Found:** Franklin product page and SEC Q2 10-Q; quarter-level issued/redeemed share counts | **Not established:** daily-updated fact block and quarterly transactions do not prove a complete daily history | **Unresolved:** correction semantics and durable retention rights not verified | Periodic cross-check only |
| BTCW | **Found:** WisdomTree product page and SEC Q2 10-Q | **Partial/unclear:** historical NAV/market-price chart exists, but daily shares/creation-redemption endpoint and complete series not verified | **Unresolved:** durable archive terms not verified | Periodic cross-check only |
| GBTC | **Found:** SEC Q1/Q2 10-Qs; Grayscale product page returned HTTP 403 during review | **Not established:** SEC disclosures are periodic; inaccessible product page does not justify assuming an undocumented endpoint | **Unresolved:** systematic access/retention rights not verified | SEC periodic cross-check only |
| BTC (Grayscale Mini Trust) | **Found:** SEC Q2 10-Q and SEC periodic reports | **Not established:** point-in-time quarter-end and later cover-page share counts are not a complete daily series | **Unresolved:** systematic archive/restore rights not assessed/verified | SEC periodic cross-check only |
| MSBT | **Found:** Morgan Stanley product page, launch announcement and SEC Q2 10-Q | **Not established:** quarterly launch-to-quarter-end transactions and later cover-page count do not prove daily history | **Unresolved:** complete machine-readable contract, correction history and retention rights not verified | Periodic cross-check only |

### Gate results

1. **Primary dated evidence:** identified for all 12 active funds through issuer pages and/or SEC filings. Evidence quality varies; SEC/issuer snapshots remain tied to their exact observation dates.
2. **Complete daily history:** no fund has yet passed the strict gate for a verified, reproducible, complete per-fund daily shares/creation-redemption series with documented date semantics and revision/correction behavior. BITB, HODL and BTCW expose some historical chart/daily fact capability, but the required flow history is still not proven.
3. **Rights to automate and archive:** unresolved for every fund in this review. A public page, a “daily updated” label or a SEC filing does not by itself establish permission for automated extraction, long-term raw retention, private backup/restore, or downstream publication. Applicable issuer, provider and third-party terms must be checked per route.

### Operational decision

- The issuer-primary route currently **fails the combined acceptance gate**: Gate 1 is met at a dated-evidence level; Gate 2 is not met for the complete universe; Gate 3 remains unresolved.
- Do not calculate daily flows from AUM changes. Do not infer a zero flow from a missing date. Keep quarterly creations/redemptions, dated snapshots, holdings-based estimates and reported/compiled USD flows as distinct metric types.
- No source registry or source priority change; no automated capture, API call, key request, production write, scenario evaluation, or scenario-state/probability change. BTC remains `not_evaluable`.
- This is a documentation review of public pages/filings. It is not legal advice and is not a provider authorization.


## Follow-up — SEC EDGAR access versus daily-series capability (2026-10-16)

The SEC's official developer documentation confirms that public submissions history and extracted XBRL data are available through unauthenticated REST APIs at `data.sec.gov`; SEC permits scripted access subject to its Privacy and Security Policy, declared User-Agent, efficient requests, and a maximum of 10 requests per second. EDGAR filings are publicly downloadable. Sources: [SEC Developer Resources](https://www.sec.gov/about/developer-resources), [Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces).

**Important boundary:** this establishes a documented route for compliant programmatic access to SEC filings/API data. It does not make quarterly 10-Q reports into daily observations, does not itself establish a complete daily ETF creations/redemptions series, and is not treated here as blanket legal advice for downstream redistribution. For the current source contract, SEC remains a periodic primary-source reconciliation route. Its publication timing, filing amendments and exact reported-period dates must be retained as provenance if a future approved workflow uses it.

**Operational decision:** SEC filing retrieval is a better-documented access route than undocumented issuer-page scraping, but it cannot satisfy the daily ETF flow gate on its own. Do not start automated retrieval or archive writes in this step; no API was called and no data was captured. Existing rights gates for third-party/provider sources remain separate.


## Follow-up — source-specific review of BITB / HODL / BTCW (2026-10-16)

This review checked whether the issuer-visible historical features for these three funds actually satisfy the daily flow contract. It used public issuer pages and an SEC filing; no endpoint/API was called and no dataset was captured.

- **BITB / Bitwise:** the official product page exposes dated fund facts and a NAV/market-price history chart; the SEC Q2 2026 report separately documents quarterly share issuance/redemptions. The SEC report includes 4,450,000 shares issued and 6,980,000 redeemed for Q2 2026, while the issuer page reports a dated snapshot (the source matrix records the 2026-10-13 facts). Neither a price chart nor quarterly transactions establishes a complete daily per-fund flow series. [Bitwise official page](https://bitbetf.com/) · [SEC Q2 2026 filing](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm).
- **HODL / VanEck:** the official page displays dated daily fund facts, including shares outstanding and Bitcoin in trust (search-visible snapshot dated 2026-10-08); an earlier page snapshot is also dated 2026-09-23. This confirms point-in-time facts are available, not that a complete, stable, revision-aware historical creations/redemptions series can be reproduced. [VanEck official HODL page](https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/).
- **BTCW / WisdomTree:** the official US product page exposes fund facts such as shares outstanding and NAV, while the SEC Q2 2026 filing provides quarter-end figures and quarterly capital activity. The public page snapshot reviewed here is dated 2026-09-09; a complete daily historical shares/creation-redemption feed, publication-time contract and correction semantics were not established. [WisdomTree official BTCW page](https://www.wisdomtree.com/us/products/crypto/btcw).

**Gate result:** the three routes strengthen dated primary-source cross-check coverage but do not pass the daily-series gate. Preserve the observation date, source URL, reported period and filing/publication date as separate fields if these are used in a future approved workflow. Do not derive daily flows from AUM/NAV changes, infer zero from missing observations, or merge these quarterly/share-count facts with reported/compiled daily USD flows. Automated collection, durable raw archiving and restore rights remain unresolved per route.

**Decision unchanged:** issuer pages/SEC remain periodic cross-checks only; no source promotion, source-priority/registry/formula/evaluator changes, API calls, data capture, production writes or scenario evaluation. BTC remains `not_evaluable`.


## Follow-up — IBIT / ARKB historical data contract check (2026-10-16)

Public issuer pages and SEC filings were reviewed to test whether the largest remaining issuer routes expose a reproducible daily flow series. This was a documentation-only review: no API calls, downloads, capture, or archive writes were performed.

- **IBIT / iShares:** the official page exposes dated key facts including shares outstanding (for example, 1,387,360,000 as of 2026-09-10) and a downloadable holdings CSV for the current holdings view. These are point-in-time facts/current holdings, not evidence of a complete historical daily shares or creations/redemptions series. [Official iShares page](https://www.ishares.com/us/products/333011/ishares).
- **ARKB / ARK 21Shares:** the official ARK page provides current holdings snapshots and historical premium/discount charting; the SEC 10-K/10-Q provide period-end shares and period-level issuance/redemption totals. For example, the 2025 10-K reports 172,675,000 shares issued and 198,990,000 redeemed during 2025. Those annual figures are not daily observations. [ARKB issuer page](https://www.ark-funds.com/funds/arkb) · [SEC 2025 10-K](https://www.sec.gov/Archives/edgar/data/1869699/000121390026021831/ea0276464-10k_ark21share.htm).

**Gate result:** both routes add useful dated/periodic primary evidence but do not establish a complete per-fund daily creations/redemptions history with publication timestamps and revision/correction semantics. A current holdings CSV is not a historical archive; premium/discount and NAV charts are not flow data. Automated access, raw retention, backup/restore and downstream-use rights remain separately unresolved for any future systematic collection.

**Decision unchanged:** keep IBIT and ARKB as periodic primary-source cross-checks only. Do not infer flow from AUM/NAV or holdings deltas, do not treat missing dates as zero, and do not mix annual/quarterly capital activity with daily reported/compiled USD flow. No source promotion, registry/source-priority/formula/evaluator changes, live capture, production writes or scenario evaluation. BTC remains `not_evaluable`.


## Follow-up — FBTC / BTCO historical flow evidence (2026-10-16)

Public issuer documentation and SEC filings were reviewed for FBTC and BTCO. This was a documentation-only review; no API was called, no file downloaded, and no data captured or archived.

- **FBTC / Fidelity:** the prospectus says the fund disseminates its holdings daily and publishes prior-business-day NAV/closing price. The SEC Q2 2026 report provides quarter-end shares/holdings and the cover page reports 197,403,476 shares outstanding on 2026-07-31. Daily holdings availability is not the same as a complete historical creations/redemptions feed; a daily holdings snapshot alone cannot isolate capital flows without a documented reconciliation method. [Fidelity prospectus](https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/mutual-funds/Fidelity-Wise-Origin-Bitcoin-Fund.pdf) · [SEC Q2 2026 report](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm).
- **BTCO / Invesco Galaxy:** SEC 2025 10-K records annual purchases of 2,605,000 shares and redemptions of 4,165,000 shares; SEC Q1 2026 records purchases of 705,000 and redemptions of 205,000. These are period totals, not a daily flow series. The official product page confirms cash creation/redemption structure but does not establish a complete machine-readable daily history or revision contract. [Invesco official page](https://www.invesco.com/us-rest/contentdetail?contentId=20fb58c6-0420-4fd3-9894-2d95d1aef2bb&dnsName=us) · [SEC 2025 10-K](https://www.sec.gov/Archives/edgar/data/1855781/000119312526083572/btco-20251231.htm) · [SEC Q1 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1855781/000119312526209710/btco-20260331.htm).

**Gate result:** neither route currently satisfies the full daily-series gate. For FBTC, daily holdings disclosure is a useful lead for a future separately authorized methodology review, not permission to infer flows from holdings changes. For BTCO, SEC reports establish period-level capital activity only. Complete date coverage, row-level publication timestamps, corrections/revisions and rights for systematic capture/raw retention/private restore remain unverified.

**Decision unchanged:** periodic primary-source cross-check only. Do not infer flow from AUM/NAV/holdings deltas, do not treat missing dates as zero, and do not mix quarterly/annual capital activity with daily reported/compiled USD flows. No source promotion, registry/source-priority/formula/evaluator changes, live capture, production writes or scenario evaluation. BTC remains `not_evaluable`.


## Follow-up — EZBC / Grayscale Bitcoin Mini Trust / MSBT (2026-10-16)

This was a public-document review only. No API calls, downloads, source captures, archive writes, or runtime changes were performed.

- **EZBC / Franklin Bitcoin ETF:** SEC Q2 2026 reports 150,000 shares created and 1,250,000 redeemed for the quarter, with reported transaction-date fair values of $5,799,402 and $53,852,604. This is quarterly aggregate activity, not a dated daily flow series. [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm).
- **Grayscale Bitcoin Mini Trust (BTC):** SEC Q2 2026 reports 9,410,000 shares issued and 3,470,000 redeemed during Q2 2026; for the first six months, 22,950,000 issued and 9,740,000 redeemed. The filing describes creations/redemptions in baskets and reports periodic aggregates, not the complete daily event history with row-level publication timestamps and correction semantics. [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm).
- **MSBT / Morgan Stanley Bitcoin Trust:** the fund began operations on 2026-04-07. SEC Q2 2026 reports 17,900,000 shares issued and 250,000 redeemed through 2026-06-30; dollar capital transactions are period totals. The filing does not establish a complete historical daily USD-flow feed, row-level publication time, or revision/finality contract. [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm).

**Gate result:** all three SEC routes are useful as dated/periodic primary cross-checks but do not satisfy the canonical daily ETF-flow source gate. These period totals must not be distributed across individual days or converted into daily flows. Missing daily observations remain unknown, not zero. Automated collection, raw-response retention, private backup/restore, and downstream publication rights remain separately unverified.

**Decision unchanged:** no source promotion or changes to source/metric registries, formula, evaluator, production data, or scenario state. BTC remains `not_evaluable`; PR #83 remains Draft/open/unmerged.


## Follow-up — Osprey Bitcoin Trust / OBTC universe correction (2026-10-16)

**Universe correction:** add Osprey Bitcoin Trust (ticker **OBTC**) to the active US spot-Bitcoin ETP review universe from its conversion to an exchange-traded ETF on 2025-12-19. Its current sponsor page identifies OBTC as a Nasdaq-listed product holding Bitcoin directly; the trust existed earlier as an OTCQX-quoted product, so its applicability start date must not be backdated to the original trust inception. This corrects the earlier active-universe caution, which omitted OBTC. [Sponsor product page](https://www.rexshares.com/OBTC/).

**Primary-source evidence:** the SEC Q2 2026 10-Q reports 2,940,535 shares outstanding at 2026-06-30 and shows 1,920,000 shares redeemed during the six months ended 2026-06-30; the quarter itself reports zero creations and zero redemptions. It also explains that baskets are created/redeemed based on bitcoin attributable per share and that the trust uses an index-based NAV for these transactions. [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1767057/000149315226037040/form10-q.htm).

**Gate result:** this is a useful period-level primary cross-check, not a daily flow series. Sponsor page daily snapshots (NAV, shares outstanding and holdings as-of date) do not by themselves establish complete historical daily creation/redemption events or a defensible daily USD-flow calculation. Do not infer daily flows from changes in holdings, NAV or AUM; do not spread six-month redemption totals across dates. Publication timestamps, corrections/revisions, systematic-capture permission, raw retention and independent restore rights remain unverified.

**Decision:** include OBTC in the fund-universe audit from 2025-12-19, but keep it periodic-primary-cross-check only. No registry/source-priority/formula/evaluator/production/scenario-state changes; no API calls, downloads, capture or archive writes. BTC remains `not_evaluable`; PR #83 remains Draft/open/unmerged.


## Follow-up — independent universe cross-check and adjacent-product boundary (2026-10-16)

**Secondary cross-check:** the DACFP Spot Bitcoin ETF Investor Guide, shown as updated 2026-09-17, lists 12 distinct products, including MSBT but omitting OBTC. Its Morgan Stanley row incorrectly repeats ticker BTCW (already used by WisdomTree) while naming Morgan Stanley Bitcoin Trust. Therefore it is a useful cross-check, not an exhaustive or authoritative universe registry. [DACFP guide](https://dacfp.com/spot-bitcoin-investor-guide/).

**Boundary case — BITA:** SEC Q2 2026 filing identifies iShares Bitcoin Premium Income ETF (BITA) as a distinct strategy that holds both bitcoin and IBIT shares and writes covered-call options primarily on IBIT. It is not treated as a plain spot-Bitcoin ETF in the core flow cohort because its capital/asset exposure includes a premium-income/options strategy and underlying IBIT shares; including it in a broader BTC-linked ETP aggregate would require a separately defined cohort and double-counting analysis. [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2089969/000143774926027004/bitp20260630_10q.htm).

**Working conclusion:** 13 products remain in the provisional active core cohort as of 2026-10-16 after excluding Hashdex DEFI from the active set effective 2026-08-17, including MSBT from 2026-04-08, and including OBTC from its ETF conversion/listing date 2025-12-19. The DACFP guide's 12-product list is consistent with the same set except for OBTC, but its ticker error and omission mean this is not sufficient to freeze the universe. The full effective-date ledger still requires final cross-check against official sponsor/exchange/SEC records for each fund and any closure, delisting, or conversion dates.

**Decision unchanged:** no source promotion, API access, downloads, live capture, archive writes, registry/formula/evaluator changes, production writes, or scenario-state changes. BTC remains `not_evaluable`; PR #83 remains Draft/open/unmerged.


## Correction — Hashdex DEFI final trading date (2026-10-16)

The prior date of 2026-09-03 was incorrect for the active trading universe. Hashdex's SEC Form 8-K/A states that trading was suspended after close on **2026-08-17** and creation orders stopped after that date; the SEC Form 8-K dated 2026-08-24 states the fund completed disposition of all assets on 2026-08-24. The Form 15 dated 2026-09-03 is a later termination-of-reporting filing, not the final trading date. Use 2026-08-17 as the final trading date for the active spot-Bitcoin ETF cohort; retain liquidation-period evidence separately and do not treat the post-trading liquidation as normal ETF flow observations. [SEC Form 8-K/A](https://www.sec.gov/Archives/edgar/data/1985840/000121390026087992/ea0301660-8ka1_hashdex.htm) · [SEC completion of liquidation](https://www.sec.gov/Archives/edgar/data/1985840/000121390026093020/ea0303094-8k_hashdex.htm) · [SEC Form 15](https://www.sec.gov/Archives/edgar/data/1985840/000121390026096933/ea0304221-1512g_hashdex.htm).


## Provisional effective-date ledger — core US spot-Bitcoin cohort (2026-10-16)

This ledger defines when a product first enters the *spot-Bitcoin trading cohort* for research aggregation. It is not a source-acceptance decision and does not imply a usable daily flow feed.

| First applicable date | Product(s) | Inclusion / exit rule | Primary reference |
|---|---|---|---|
| 2024-01-11 | IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC | First-wave US spot-Bitcoin ETP trading; GBTC's existing trust uplisted as an ETF | [SEC filing on first-wave trading](https://www.sec.gov/Archives/edgar/data/1050446/000119312525230977/d49048d8k.htm); [GBTC uplisting](https://www.sec.gov/Archives/edgar/data/1588489/000095017024003852/fact_sheet_fwp.htm); [EZBC launch](https://www.sec.gov/Archives/edgar/data/1992870/000113743924000184/ftdhtfwp7.htm) |
| 2024-03-27 | DEFI (Hashdex Bitcoin ETF) | Enters only from conversion of futures strategy to spot-Bitcoin strategy; not from its earlier futures-fund launch | [SEC-filed announcement](https://www.sec.gov/Archives/edgar/data/1985840/000199937124003989/defi_fwp-032624.htm) |
| 2024-07-31 | BTC (Grayscale Bitcoin Mini Trust) | Begins trading; do not backdate to trust formation | [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm) |
| 2025-12-19 | OBTC (Osprey Bitcoin Trust) | Enters on ETF conversion/listing; earlier OTCQX history is not ETF trading history | [SEC 2025 10-K](https://www.sec.gov/Archives/edgar/data/1767057/000149315226014439/form10-k.htm) |
| 2026-04-08 | MSBT (Morgan Stanley Bitcoin Trust) | Enters from first NYSE Arca trading date | [SEC Q2 2026 10-Q XBRL](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/R8.htm) |
| 2026-08-17 | DEFI (Hashdex Bitcoin ETF) | Last trading day; exclude from active trading cohort after close; liquidation completed 2026-08-24 and is not normal trading flow | [SEC Form 8-K/A](https://www.sec.gov/Archives/edgar/data/1985840/000121390026087992/ea0301660-8ka1_hashdex.htm); [SEC liquidation completion](https://www.sec.gov/Archives/edgar/data/1985840/000121390026093020/ea0303094-8k_hashdex.htm) |

**Count reconciliation:** 10 products at the 2024-01-11 first wave; 11 after DEFI's 2024-03-27 spot conversion; 12 after BTC Mini's 2024-07-31 launch; 13 after OBTC's 2025-12-19 ETF conversion; 14 after MSBT's 2026-04-08 launch; 13 active trading products after DEFI's last trading day 2026-08-17. This is a **provisional but source-backed cohort ledger**; final freeze still requires a final search for any other direct-holding US spot BTC product, listing-status changes, and official issuer/exchange evidence for each row. BITA remains outside this core cohort because it is a premium-income/options strategy holding both BTC and IBIT; broader BTC-linked ETP aggregation would need separate rules.

No ETF source is promoted by this ledger. It only defines cohort membership dates; source rights, daily completeness, publication time, revisions/finality, retention and restore gates remain open.
