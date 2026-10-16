# BTC ETF fund holdings source matrix — 2026-10-16

**Scope:** public-source research for daily BTC holdings across the 12 potentially active US spot Bitcoin ETF products in the working universe. DEFI is retained as historical-only because the fund was liquidated in August 2026.
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
- Full daily historical holdings for all 12 active funds: a third-party endpoint is documented, but complete date coverage and numerical correctness were not independently verified; no approved bulk archive source is cleared under current reviewed terms.
- Same-date numeric reconciliation across all funds and all candidate providers: **not completed**; no data capture was performed.
- Permanent raw-data archive permission: **not established as a complete set**; Bitbo is restricted to internal/private use under its published API guidance, and CoinGlass requires written consent for bulk database/redistribution use.
- Production ingestion and registry acceptance: **not approved**.
- BTC readiness remains **not_evaluable**.

This document records public documentation review only. No live capture, API request, bulk download, database write, source registry update, scenario change, or deployment was performed.
