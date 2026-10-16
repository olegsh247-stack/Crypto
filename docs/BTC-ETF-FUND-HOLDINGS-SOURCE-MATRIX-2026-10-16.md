# BTC ETF fund holdings source matrix — 2026-10-16

**Scope:** historical holdings coverage for the 13 current US-listed direct-BTC spot trust products in the expanded research universe: IBIT, FBTC, GBTC, BTC, ARKB, BITB, HODL, BTCO, EZBC, BRRR, BTCW, MSBT, and OBTC. The prior 12-ticker working list omitted OBTC, whose SEC-listed trust status is documented from December 2025; include it in this research matrix. DEFI is historical-only (delisting Form 25-NSE filed 2026-08-24). BITA is excluded from this pure-spot-trust set because it also holds IBIT shares and writes options; BTCK is excluded because its mandate combines spot bitcoin with carbon-credit futures.
**Status:** research-only. No live capture, API call, raw-data download, database write, registry change, scenario evaluation, or production acceptance was performed.
**Decision:** no provider is approved by this review for production ingestion or permanent raw-payload archiving.

## Decision summary

- Public issuer pages establish that some funds publish a current holdings view or downloadable file, but a current file/table is not proof of a complete daily historical series.
- Quarterly SEC filings are reliable periodic control points, not substitutes for daily holdings.
- Public display dates are not synchronized across issuers. Keep observed_date, published_at (if actually supplied), and retrieved_at distinct.
- Rights to view, quote, download, retain, back up, or redistribute raw data must be evaluated separately for each issuer file/provider. Public accessibility alone is not archival permission.
- Do not infer zero from a missing row, sum holdings from different dates, or call a partial-fund sum full-market coverage.

## Fund-by-fund matrix

| Ticker | Primary issuer/SEC route found | Evidence available in this review | Daily historical BTC series | Research decision |
|---|---|---|---|---|
| IBIT | [iShares product page / Holdings CSV](https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf) | Official page explicitly says quantity is total BTC held and provides a Holdings CSV link. Search-indexed page showed a September 2026 as-of date; the date can lag. | Current/download route confirmed; complete historical depth not confirmed. | Best direct-source candidate; manual review only |
| FBTC | [Fidelity fund site](https://www.fidelity.com/) and [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm) | SEC 10-Q for quarter ended 2026-06-30 exists. The prospectus says daily holdings are disseminated on the Trust website. | Daily issuer disclosure route indicated; downloadable history and depth not confirmed here. | Candidate; no archive approval |
| GBTC | [Grayscale product site](https://etfs.grayscale.com/) and [SEC Q2 2026 filing index](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/0001588489-26-000005-index.html) | Official quarterly report exists. | Aggregator rows exist; complete issuer daily history not confirmed. | Partial; quarterly control |
| ARKB | [ARK Funds](https://www.ark-funds.com/) and [21shares](https://www.21shares.com/) | Official product routes exist; this review did not establish a complete daily BTC holdings export. | Not confirmed. | Partial; quarterly/public disclosures only until verified |
| BITB | [Bitwise Bitcoin ETF](https://bitbetf.com/) | Official product route exists; a complete daily BTC holdings history was not verified in this review. | Not confirmed. | Partial |
| HODL | [VanEck](https://www.vaneck.com/) | Public holdings information has been identified in prior review; full daily historical export/depth remains unverified. | Partial/unknown. | Candidate only |
| BTCO | [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1855781/000119312526338719/btco-20260630.htm) | SEC schedule reports 5,345 BTC on 2026-06-30 and 6,218 BTC on 2025-12-31. | SEC evidence is quarterly, not daily. No full daily issuer series verified. | Quarterly control |
| BRRR | [CoinShares holdings page](https://coinshares.com/us/etf/brrr/) | Public holdings table reports 5,705.29 BTC-equivalent units in its Shares field with holdings as-of 2026-09-07; page states holdings are subject to change. | Current dated table confirmed; complete daily history/export not confirmed. | Partial; do not infer archive rights |
| EZBC | [Franklin Templeton EZBC page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS/franklin-bitcoin-etf/EZBC) | Official page exposes an XLS holdings link and labels holdings “Updated Daily”; indexed holdings were as of 2026-08-17 and the page's daily pricing was as of 2026-09-04. | Daily current file route indicated; historical XLS depth/versioning not confirmed. | Strong candidate for manual validation |
| BTCW | [WisdomTree BTCW page](https://www.wisdomtree.com/us/products/crypto/btcw) and [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1850391/000121465926009996/wtb8626110q.htm) | Issuer page displays Bitcoin as 100% weight with an as-of date; SEC schedule reports 2,310 BTC on 2026-06-30. | Public page weight is not a quantitative BTC amount; SEC evidence is quarterly. | Daily quantitative series not confirmed |
| BTC (Grayscale Bitcoin Mini Trust) | [Grayscale product site](https://etfs.grayscale.com/) and official SEC filing | A quarterly SEC filing and aggregator row have been identified in prior review. | Complete issuer daily history not confirmed. | Partial; quarterly control |
| MSBT | [Morgan Stanley product page](https://www.morganstanley.com/im/en-us/financial-advisor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html) and [SEC Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm) | SEC schedule reports 5,059.30771216 BTC on 2026-06-30. | Quarterly point confirmed; daily issuer history not confirmed. | Quarterly control |

### Historical-only product

| Ticker | Evidence | Decision |
|---|---|---|
| DEFI | Hashdex Bitcoin ETF was liquidated in August 2026; historical SEC filings remain useful for backtesting/control points. | Exclude from current active-fund coverage, retain in historical universe with an effective end date. |

## Historical coverage inventory — checked 2026-10-16

The following counts are from a public daily issuer-disclosure dataset and a separately maintained SEC-quarterly reconciliation dataset. They describe what is actually present in those datasets; they do not imply uninterrupted daily coverage from inception.

Daily source inspected: [akpasz/btc-data — etf_holdings.json](https://github.com/akpasz/btc-data/blob/main/data/etf_holdings.json). Its README says values are parsed from issuer disclosures, and the source repository explicitly warns that data files remain subject to upstream terms. Current file has only a short recent observation window, not inception-to-date history.

Quarterly source inspected: [akpasz/btc-data — etf_quarterly.json](https://github.com/akpasz/btc-data/blob/main/data/etf_quarterly.json), fetched at 2026-10-16T11:21:47Z. This is an SEC XBRL extraction/reconciliation layer and the README warns that each extracted concept must be checked against filings before quotation. Independently, [Satoshi Gazette Data Desk's quarterly ETF-trust dataset](https://satoshigazette.org/data/downloads/sg-etf-trusts.json) provides filing-linked quarter-end quantities under CC BY 4.0 for its compilation/annotations; it says rows are available for 14 of 16 trusts, through 2026-06-30, with missing quarters/trusts left absent rather than treated as zero.

| Ticker | Daily observations in inspected issuer-derived file | Daily date span in that file | SEC/XBRL quarterly extraction | Verified historical interpretation |
|---|---:|---|---|---|
| IBIT | 31 | 2026-08-31–2026-10-14 | 6 rows, 2024-12-31–2026-06-30 | Daily source exists but only recent partial window; quarterly controls available |
| FBTC | 0 | — | 2 rows, 2024-12-31–2025-12-31 | Daily history absent from inspected file; SEC filings exist beyond extractor's current coverage, so extraction is incomplete |
| GBTC | 0 | — | 22 rows, 2017-12-31–2026-06-30 | Long quarterly history available; no daily series in inspected file |
| BTC (Grayscale Mini) | 0 | — | 8 rows, 2024-09-30–2026-06-30 | Quarterly history available; no daily series in inspected file |
| ARKB | 33 | 2026-09-01–2026-10-16 | 10 rows, 2024-03-31–2026-06-30 | Recent partial daily window plus quarterly controls |
| BITB | 34 | 2026-09-01–2026-10-16 | Extractor error: no recognised BTC-quantity XBRL concept | Recent partial daily window; quarterly quantity needs manual filing-level extraction |
| HODL | 33 | 2026-08-31–2026-10-15 | Extractor error: no recognised BTC-quantity XBRL concept | Recent partial daily window; quarterly quantity needs manual filing-level extraction |
| BTCO | 0 | — | Extractor error: no recognised BTC-quantity XBRL concept | No daily series in inspected file; SEC quarter-end control values have been manually identified in prior review, but the automated extractor is incomplete |
| BRRR | 0 | — | Extractor error: no recognised BTC-quantity XBRL concept | No daily series in inspected file; issuer has dated holdings display, but a daily history is not present here |
| EZBC | 0 | — | 2 rows, 2026-03-31–2026-06-30 | Quarterly controls available; issuer XLS route exists, but daily historical snapshots are not present here |
| BTCW | 0 | — | Extractor error: no recognised BTC-quantity XBRL concept | No daily series in inspected file; manual SEC quarter-end control identified in prior review |
| MSBT | 0 | — | Extractor error: no recognised BTC-quantity XBRL concept | No daily series in inspected file; manual SEC quarter-end control identified in prior review |
| OBTC | 31 | 2026-09-01–2026-10-14 | 2 rows, 2025-12-31–2026-06-30 | Active listed trust omitted from prior 12-ticker scope; only recent daily window plus two quarterly points in inspected files |
| DEFI (historical-only) | 0 | — | Not read: report quantity units are ambiguous in the extractor | Delisting filed 2026-08-24; keep historical identity and delisting date, do not count as current coverage |

**What this establishes:** the available issuer-derived daily file has 162 observations across five tickers, but covers only late August/September through 16 October 2026; it is not a complete historical panel. The automated SEC XBRL extractor returns usable quarterly rows for seven tickers (IBIT, FBTC, GBTC, BTC, ARKB, EZBC, OBTC) and fails to recognise BTC quantity concepts for six tickers (BITB, HODL, BTCO, BRRR, BTCW, MSBT; FBTC's extracted series is also incomplete relative to available filings). Therefore it cannot be the only quarterly control mechanism. The Satoshi Gazette dataset is the more auditable ready-to-reference quarterly table because each row carries the filing accession, document URL and locator; cite/attribute it under CC BY 4.0 when reusing its compilation.

**Daily source decision:** no reviewed, reusable, permitted source presently supplies a complete daily history for all 13 products from each fund's inception to the current date. The matrix now distinguishes (a) actual recent daily rows, (b) SEC quarter-end controls, (c) issuer current snapshots, and (d) missing coverage. No missing value is imputed as zero. Glassnode's public chart advertises a daily US Spot ETF Balances series and CSV/JSON/API controls ([chart](https://studio.glassnode.com/charts/institutions.UsSpotEtfBalancesAll?a=BTC&zoom=all)), sourced from issuer disclosures. Its API documentation requires an API key and labels US Spot ETF Balances as T1 access ([API documentation](https://docs.glassnode.com/basic-api/endpoints/institutions)); no API key was available in this review, and the public chart did not expose a verified downloadable historical payload through the reviewed page. Therefore it is the strongest follow-up candidate for a complete daily panel, but not an available loaded dataset or a cleared archive license.

## Cross-source comparison rules

1. Compare holdings only when the reporting/as-of date is identical. Do not use page update time as a substitute for holdings date.
2. Keep source metrics distinct:
   - btc_holdings: issuer/aggregator reported BTC quantity;
   - reported_flow_usd: published provider flow estimate;
   - derived_holdings_change_usd: calculated proxy, not a provider-reported flow.
3. Derived proxy, if later approved: (H[t] - H[t-1]) * P[t], where the USD price source and valuation instant are specified separately.
4. Missing, placeholder, stale, failed, or date-mismatched rows remain missing/non-comparable, never zero.
5. A quarterly SEC holdings value can validate a nearby daily series at the same date only after accounting for the filing's exact measurement date and any reported rounding.

## Storage, rights, and recovery gate

- SEC EDGAR is a primary public-document route and provides periodic controls. Respect SEC Fair Access rules. Public access is not a blanket grant to redistribute every embedded item.
- Issuer CSV/XLS pages are promising source routes, but this review did not establish a uniform permission for permanent retention, backups, or redistribution of each file.
- Do not bulk archive CoinClass, Glassnode, Bitcoin ETF Data, or other aggregator payloads until the applicable data-use terms and rights are confirmed for the specific data product.
- Before accepting any raw file for project archive, document source URL, terms URL/version/date reviewed, permitted purpose, retention rights, backup rights, redistribution restrictions, retrieval timestamp, payload hash, and any required attribution.
- Until then, keep only permitted bibliographic metadata/links and reviewed numerical facts needed for the research report.
- Project-controlled durable storage, independent encrypted backup, checksum verification, and restore rehearsal are not yet demonstrated. GitHub Actions' temporary artifact retention is not a durable archive.

## Data-use, retention, and access-terms review (2026-10-16)

This was a public-documentation review only. No files were downloaded and no APIs were called.

- **SEC EDGAR:** the SEC states that filings are freely accessible, and requests users to download only what is needed, moderate request rates, and observe its fair-access rules (currently up to 10 requests/second). This supports a carefully rate-limited research retrieval plan, but the cited access guidance is not an explicit blanket license for unrestricted mirroring, redistribution, or permanent retention of every embedded third-party asset. Reference: https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data and https://www.sec.gov/about/developer-resources.
- **BlackRock / iShares:** official product pages expose a Holdings CSV. Public holdings pages include a disclaimer that holdings data may be unaudited and that users rely on the data at their own risk; the general legal-documents page lists “Terms of Use,” but this review did not establish a specific permission to retain, back up, or redistribute IBIT CSV snapshots indefinitely. References: https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf and https://www.ishares.com/us/library/financial-legal-tax.
- **Franklin Templeton / EZBC:** the official product route exposes an XLS holdings file and describes holdings as updated daily. A general Franklin site page contains terms about confidential/non-public holdings, but it is not demonstrated to govern the public EZBC file; do not apply it to EZBC as a definitive restriction or permission. The specific EZBC file's retention, backup, and redistribution terms remain unverified. Reference: https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS/franklin-bitcoin-etf/EZBC.
- **CoinShares / BRRR:** the official product page publishes dated holdings and links to prospectus and SEC filings. The reviewed privacy policy concerns personal information and website usage; it is not a data license for holdings values. No explicit permission for indefinite raw snapshot storage, backup, or redistribution was confirmed. References: https://coinshares.com/us/etf/brrr/ and https://coinshares.com/us/privacy-policy/.

### Decision from terms review

1. Classify **SEC filing URLs and filing identifiers** as the preferred auditable reference trail; retrieve only what is needed, use conservative request pacing, and retain citation metadata. Do not claim unrestricted redistribution rights for embedded third-party content based only on EDGAR accessibility.
2. For issuer CSV/XLS/HTML holdings, allow **link-and-metadata tracking only** at this stage. Do not assume permanent raw-file retention, external redistribution, or independent backup rights until the exact terms applicable to each data product are established.
3. A terms page for a different product/fund, a privacy policy, a prospectus, or a disclaimer is not a substitute for explicit data-retention terms. Where no clear permission is found, mark rights **unverified**, not “prohibited” and not “permitted.”
4. This review does not change source acceptance, registry state, scenario state, scores, probabilities, or readiness. BTC remains **not_evaluable**.

## Resolution of the historical-series source question (2026-10-16)

This section resolves source selection at the documentation/policy level. It does not claim that any historical payload was downloaded, sampled, or independently reconciled.

### Provider capability and license decision

| Candidate | Documented technical capability | Documented use constraints | Matrix decision |
|---|---|---|---|
| Bitbo API — `etf-holdings` | Date-range daily BTC holdings endpoint documents all 12 current-universe tickers plus historical-only DEFI. Fields include date, BTC holdings, YoY change, monthly change. | Bitbo's API page says the API is for internal/private use only and not for public websites or reproducing its charts. Subscription required. The reviewed pages do not grant an explicit right to publish raw snapshots or build a public dataset. | **Do not use as a source for public-repository snapshots or public product output under the currently documented terms.** Could be reconsidered only for private internal research within the stated scope, after account terms are reviewed; not approved for durable/public archive. |
| CoinGlass API — ETF history | Historical ETF endpoint documents `btc_holdings`, net assets, NAV, market price and other fields by ticker. | API terms prohibit bulk collection/storage to create independent databases and redistribution of API data or derived data without prior written consent. Attribution is required. | **Not approved for bulk historical archive or public redistribution without written permission.** Possible licensed service candidate only if written terms expressly cover the intended use. |
| Bitcoin ETF Data | Public current-data JSON documents issuer as-of date, holdings, change, update timestamp and stale/error fallback. | Reviewed documentation confirms current values, not a full historical date-range export or explicit archive/redistribution license. | **Secondary current-value cross-check only; not the historical archive solution.** Do not treat a zero change or an old as-of date as a new observation. |
| Issuer pages and SEC EDGAR | Issuer pages provide current/date-stamped holdings for some funds; SEC filings provide auditable periodic quantity controls. | Exact retention/backup/redistribution terms vary and were not established uniformly for every issuer file. SEC access rules must be respected; public availability is not a blanket license for all embedded third-party content. | **Preferred provenance trail without raw bulk archiving:** issuer/SEC URLs, filing identifiers, observation dates and individually reviewed facts. This does not, by itself, provide a complete daily history for all funds. |

### Final operating decision

1. The matrix is resolved as **no-go for bulk historical ingestion/archive using the reviewed third-party APIs under the currently documented terms**. Do not add Bitbo or CoinGlass payloads to the public GitHub repository, a public API, or a public dataset without appropriate written permission.
2. The permitted baseline for current work is issuer-first provenance: retain source URLs, ticker, source-reported as-of date, retrieval timestamp for future approved retrievals, units/field definition, and SEC filing identifiers; cite and compare only facts whose use is permitted. This is a source register/research trail, not a substitute for raw historical snapshots.
3. To unlock a complete daily history, choose one of two explicit paths: (A) obtain written terms from a vendor that permit the intended internal storage, independent backup, derived research, and any public display/distribution; or (B) review the exact terms for each issuer-provided file and build an issuer-first archive only where retention and backup rights are sufficiently clear. If neither path is cleared, keep the daily-history gate blocked rather than fabricating coverage.
4. Before any provider is accepted, an approved data-access run must separately test date coverage and same-date numeric reconciliation for all active tickers, plus quarterly SEC controls where available. Documentation of an endpoint alone is not evidence that its full history is complete or numerically correct.
5. This decision is independent of scenario scoring: no DB writes, registry changes, scenario changes, probabilities, production ingestion, deployment, or PR merge. BTC remains `not_evaluable`.

## Final status

- Issuer routes/current holdings views: confirmed for some funds, incomplete across the full universe.
- Full daily historical holdings for all 13 current direct-BTC trust products: **not available as one complete verified panel**. The inspected issuer-derived daily file contains only a recent partial window for five tickers (including OBTC), while SEC quarterly controls cover a subset and have extraction gaps.
- Same-date numeric reconciliation across all 13 funds and all candidate providers: **not completed**; the inspected daily and quarterly datasets have no overlapping same-date rows for the daily window, and source-level values still require controlled reconciliation.
- Permanent raw-data archive permission: **not established as a complete set**; Bitbo is restricted to internal/private use under its published API guidance, and CoinGlass requires written consent for bulk database/redistribution use.
- Production ingestion and registry acceptance: **not approved**.
- BTC readiness remains **not_evaluable**.

This document records public documentation review only. No live capture, API request, bulk download, database write, source registry update, scenario change, or deployment was performed.


## Recheck: alternatives for completing the full daily panel — 2026-10-16

This recheck was triggered because the earlier source-coverage matrix had been described too broadly as a completed stage. It is not complete until a daily historical holdings panel exists for all 13 active trusts.

### Additional alternatives checked

| Candidate | What the public documentation/data establishes | Why it does not close the 13-fund daily holdings panel |
|---|---|---|
| [CoinLaw ETF Holdings & Fees Tracker](https://coinlaw.io/crypto-etf-holdings-tracker/) | Reuses compiled issuer-reported data under CC BY 4.0 with attribution. Its stated cadence is a verified weekly snapshot, re-checked every 30 days; latest snapshot covers 12 BTC funds. | Reuse rights are clearer, but the published tracker is not an inception-to-date daily holdings archive. |
| [Newhedge Spot Bitcoin ETF API](https://docs.newhedge.io/api) | Historical API; every data endpoint requires an API token. API terms restrict use to personal, non-commercial research and prohibit public presentation/mirroring without authorization. The reviewed holdings/flows chart families are separate; flow history is not equivalent to issuer-reported holdings. | Requires paid/account access and exact metric coverage/terms review; no token or payload was available. It is not approved as a 13-fund holdings source on documentation alone. |
| [Glassnode US Spot ETF Balances](https://docs.glassnode.com/basic-api/endpoints/institutions) | Daily historical API supports date-range queries and CSV/JSON, but requires an API key and T1 metric access. The documented fund list does not establish complete coverage of the current 13-fund universe; public chart labels alone are not a downloadable verified payload. | No API credential/payload; coverage of OBTC and complete per-fund daily history has not been demonstrated. |
| [Bitcoin ETF Data](https://www.btcetfdata.com/) | Current JSON exposes issuer as-of date, BTC holdings, daily change, update timestamp and error/stale fallback fields. | Current-state endpoint is not a historical export. |
| [BitcoinETFdb](https://bitcoinetfdb.com/) | Public tracker displays daily flow columns and holdings for 11 tickers in the page snapshot. | It is not a verified complete 13-fund raw holdings archive; daily flow estimates cannot be relabelled as actual holdings, and redistribution/retention rights for a historical payload were not established. |
| [Newhedge Onchain Holdings chart](https://newhedge.io/bitcoin/spot-bitcoin-etf-holdings) | Public chart advertises daily historical on-chain holdings and CSV/XLS/JSON controls; API documentation requires a token and describes an on-chain-observed series. | On-chain-labelled holdings are not automatically identical to issuer-reported holdings; exact ticker-level coverage, downloadable payload, methodology and permitted retention/reuse were not established for all 13. |

### Corrected stage decision

- **The historical holdings data stage is NOT DONE.** The source-research/documentation subtask is complete, but no full daily panel has been assembled.
- No open, verified, rights-cleared dataset located in this review provides daily issuer-reported BTC holdings from inception through the latest available date for all 13 current tickers.
- The only inspected CC BY 4.0 compiled source is quarter-end, not daily. The available daily file remains 162 recent observations across five tickers. SEC/XBRL rows remain quarterly controls, not a daily substitute.
- Do not fabricate daily holdings by forward-filling quarterly points, treating absent values as zero, or cumulatively converting USD flows into exact holdings.
- To finish the data deliverable, a provider must supply actual per-fund historical daily holdings for all 13 tickers, with dates/units/revision semantics and permission for the intended storage and research use. If data are to be committed to this public repository or shown publicly, redistribution/public-display rights must explicitly cover that use. Otherwise the raw panel must remain in approved private storage and only non-sensitive provenance/quality summaries can be committed here.
- No database write, registry acceptance, scenario change, production ingestion, deployment, or PR merge was performed during this recheck.


## SEC quarter-end control snapshot completed — 2026-10-16

A separate source-linked control table was assembled from the trusts' own SEC Form 10-Q filings for the common observation date **2026-06-30**: [BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md](BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md).

- Coverage: **13/13 active tickers**, all at the same quarter-end date, with a direct SEC filing URL for every value.
- This closes the narrow task of assembling a same-date quarterly SEC control snapshot and provides direct filing references to check the SEC XBRL extractor's missing concepts.
- It does **not** close the daily-history requirement. These are quarter-end controls only; no forward-fill, daily interpolation, or holdings reconstruction from USD flows is permitted.
- The values retain each filing's reported precision. In particular, whole-BTC figures in a filing must not be upgraded to artificial decimal precision.
- The daily panel remains **NOT DONE**; same-date daily-vs-quarterly reconciliation remains pending because the inspected daily file starts in late August/September 2026 and does not contain 2026-06-30 rows.
- No raw bulk dataset was copied from the third-party daily repo; no database, source registry, scenario, score/probability, production ingestion, deployment, or merge was changed.


## SEC XBRL candidate reconciliation against filing-verified controls — 2026-10-16

**Purpose:** test whether the public candidate file `akpasz/btc-data/data/etf_quarterly.json` reproduces the 13 directly checked SEC schedule quantities in [BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md](BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md). Candidate JSON reports `fetched_at=2026-10-16T11:21:47Z`; upstream files were read-only fetched for this comparison.

| Ticker | Filing-verified control (BTC) | Candidate 2026-06-30 (BTC) | Result |
|---|---:|---:|---|
| IBIT | 734261 | 734261 | Match |
| FBTC | 174383 | Missing | Extractor has no row for this quarter; do not treat as zero |
| GBTC | 138505.75680424 | 138505.756804 | Matches at candidate's 6-decimal precision; candidate truncates precision |
| BTC (Grayscale Mini) | 54280.40050138 | 54280.400501 | Matches at candidate's 6-decimal precision; candidate truncates precision |
| ARKB | 32178.2280 | 32178.228 | Match at reported precision |
| BITB | 36207.6919 | Missing | Extractor status is `error`; manual filing-level extraction needed |
| HODL | 16241.00 | Missing | Extractor status is `error`; manual filing-level extraction needed |
| BTCO | 5345 | Missing | Extractor status is `error`; manual filing-level extraction needed |
| EZBC | 5664.0163 | 5664.0163 | Match |
| BRRR | 5864 | Missing | Extractor status is `error`; manual filing-level extraction needed |
| BTCW | 2310 schedule quantity | Missing | Extractor status is `error`; schedule quantity is the selected control convention |
| MSBT | 5059.30771216 | Missing | Extractor status is `error`; manual filing-level extraction needed |
| OBTC | 945.07 | 945.07 | Match |

**Result:** 6/13 candidate rows match the filing-verified controls (allowing for the candidate's 6-decimal precision on GBTC and Mini BTC); 7/13 are missing. The extractor marks six of those missing tickers as errors and FBTC as `ok` despite having no 2026-06-30 row. This demonstrates that a top-level `status=ok` is not sufficient evidence of quarter-end coverage. Do not describe the extractor as complete or use its absence of a row as a zero.

### Daily candidate file — coverage and quality boundary

The read-only `etf_holdings.json` candidate contains 162 rows across only five tickers:
- IBIT: 31 observations, 2026-08-31–2026-10-14
- ARKB: 33 observations, 2026-09-01–2026-10-16
- BITB: 34 observations, 2026-09-01–2026-10-16
- HODL: 33 observations, 2026-08-31–2026-10-15
- OBTC: 31 observations, 2026-09-01–2026-10-14

It has no 2026-06-30 rows, so it cannot be reconciled directly against the common-date SEC controls. The data schema stores date/value pairs but does not, in the inspected payload, provide per-row source URL, source publication time, retrieval time, revision/correction semantics, or evidence that repeated values on successive dates are independently observed rather than carried forward. These rows remain an unapproved research candidate, not a verified complete daily history.

**Next work:** continue finding publicly accessible dated issuer holdings snapshots/archives for the missing eight tickers in the daily panel, and inspect source provenance for the five covered tickers. Do not use quarterly values as daily values, derive holdings from USD flows/AUM, or copy the third-party payload into production data. Daily history for all 13 remains **NOT DONE**; production ingestion/registry acceptance remains **not approved**.
