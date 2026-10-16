# BTC ETF alternative-source review — 2026-10-16

**Scope:** identify a technically accessible alternative/corroborating source for daily US spot BTC ETF net flows while Farside retrieval is unreliable.  
**Mode:** public documentation review only; no API key, live API capture, ingestion, registry promotion, database access, or scenario evaluation.  
**Decision:** SoSoValue is a viable *candidate for a separately labelled source capture*, subject to access, terms, exact metric semantics, and row-level comparison. It is not approved as a canonical replacement by this review.

## Findings

### 1. SoSoValue Market Data API — strongest next candidate to test

- API documentation exposes ETF summary history and per-ETF history:
  - API base: `https://openapi.sosovalue.com/openapi/v1`
  - Summary history: `GET /etfs/summary-history`
  - Per-fund history: `GET /etfs/{ticker}/history`
- Access requires an API key issued through the SoSoValue developer dashboard and sent in the `x-soso-api-key` header. Never put the key in Git, workflow logs, public artifacts, or a client-side bundle.
- The currently published per-ETF history docs limit queries to the most recent month. That is sufficient in principle to test the recent BTC reporting date under review, but not to independently rebuild the full series from launch through 2026.
- The documented fields include date, ticker, daily net inflow in USD, cumulative inflow and net assets. The summary endpoint is the appropriate candidate for daily aggregate comparison; per-fund rows can help reconcile totals.
- **Still unverified:** whether the project can obtain a key; exact summary endpoint parameters and aggregate semantics for the selected US BTC ETF universe; API-specific storage/redistribution rights (the public website Terms of Use are not, by themselves, proof of the separate API license); whether the requested reporting date is returned; response timestamp/finality/revision behavior; exact reconciliation against Farside and TFTC.

References:
- API overview: https://sodex.com/documentation/for-developers/api-reference/market-data-api
- Getting started / API-key authentication: https://sodex.com/documentation/for-developers/developers/data-api/getting-started
- ETF history endpoint and one-month limit: https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/history
- ETF API modules: https://sodex.com/documentation/for-developers/api-reference/market-data-api

### 2. Important lineage caveat: TFTC is not an independent second estimator

TFTC states that its daily aggregates and ongoing per-fund flows come from SoSoValue's ETF data service; its historical per-fund series from launch through mid-2026 is compiled from issuer disclosures as tabulated by Farside.

Source: https://www.tftc.io/bitcoin-etf-flows

**Rights finding (public page reviewed 2026-10-16):** TFTC explicitly says its full ETF-flow series is available as open JSON and licensed under **CC BY 4.0**, with attribution/link back to TFTC. The page also identifies current daily aggregates and ongoing per-fund flows as sourced from SoSoValue, and historical per-fund data through mid-2026 as compiled from issuer disclosures tabulated by Farside. This supports use of TFTC's published dataset subject to CC BY 4.0 attribution, but does not make its current daily figures independent of SoSoValue or Farside lineage. Preserve attribution and the license notice with any retained or derived dataset.

Therefore:
- Farside and TFTC are distinct publishers, but their current daily data lineage overlaps; TFTC's current aggregate is sourced from SoSoValue.
- The arithmetic mean of Farside and TFTC remains the previously approved *project research-derived comparison metric*, not a statistically independent two-source consensus. Its provenance must state the lineage overlap.
- Capturing SoSoValue directly would verify the lineage path and make discrepancies easier to diagnose, but **must not be treated as a third independent vote alongside TFTC**.
- This review does not change the already approved mean rule or canonical priority. Changing the derived metric to prefer one source, use a median, or require a different pair is a separate project decision.

### 3. Other surfaced non-official options

- SatoshiMacro publishes a public daily aggregate chart and says its inputs use Farside plus SoSoValue with a last-known-good fallback. Because those are already in the known lineage, it is useful as a display-level cross-check but not an independent source; the fallback mechanism may obscure which provider supplied a particular date unless the exact per-row lineage is exposed.
- CryptoETF.today documents an API for daily flow history, but its history endpoint requires an API key and the source/terms details have not been established in this review.
- Newhedge provides a documented flow series in BTC units with a seven-day revision window, but its cited metric is expressed in BTC rather than USD millions and requires a token. It is not directly interchangeable with the project's USD/day metric without an approved conversion methodology and timestamp contract.

References:
- SatoshiMacro: https://satoshimacro.com/tools/crypto/etf-flows/daily-spot-etf-flows/
- CryptoETF API docs: https://docs.cryptoetf.today/
- Newhedge ETF-flow API docs: https://docs.newhedge.io/api/spot-bitcoin-etf-flows-btc

## Next safe action

1. Obtain or confirm access to a SoSoValue API key outside the repository (user action if required); do not ask the user to paste the secret into chat.
2. Review the full API endpoint contract and terms before any capture.
3. Implement a **manual-only, offline** candidate adapter that records the exact URL/parameters (excluding credentials), retrieval timestamp, HTTP status, response hash, raw units, metric definition and date coverage.
4. Compare the same date and fund universe against Farside and TFTC; report discrepancies without silently replacing nulls or failed values with zero.
5. Preserve the existing fail-closed review policy. A third publisher with overlapping lineage does not remove the need for two stable captures and explicit human review.
6. Do not promote the source in `source-registry.json`, change metric priority, change the approved arithmetic-mean metric, or write database observations without a separate reviewed decision.

## Source-specific rights disposition

| Source | Publicly verified position | Project decision |
|---|---|---|
| TFTC published ETF-flow series / open JSON | Page explicitly states CC BY 4.0 and requests attribution/link to TFTC. | Reuse is a viable candidate with attribution and preserved license metadata. Keep SoSoValue/Farside upstream lineage labels; not an independent third vote. |
| Farside ETF-flow page/table | Page labels units and disclaimer; the reviewed page does not establish a clear license granting long-term raw-response storage or redistribution. | Rights remain unconfirmed. Do not publish raw page payloads or treat public visibility as permission to redistribute. Seek written clarification or limit use to a permitted, attributed research workflow after terms review. |
| SoSoValue Market Data API | API docs describe endpoints and API-key access; reviewed public docs do not establish storage/redistribution license terms. Website Terms of Use include restrictions on copying Website material, but those terms alone do not resolve the separate API contract. | API raw-payload retention/reuse remains blocked pending the API-specific terms or written permission. No key request or API call was made. |

This is a source-policy review, not legal advice. It distinguishes permission to quote/reuse a published dataset from permission to retain or redistribute a provider's raw API response.

## Archive constraint

TFTC's published dataset has an explicit CC BY 4.0 statement, but that does not automatically license Farside or SoSoValue raw payloads copied independently. A seven-day Actions artifact is temporary; a project-controlled durable archive and restore procedure are still required before an ETF row can be approved. Do not commit raw provider payloads to the public repository. Keep any retained TFTC-derived artifact with attribution, license metadata, source URL, retrieval time and hash.


## Supplementary check — CryptoETF API documentation (2026-10-16)

A fresh documentation check confirms the public CryptoETF API requires an API key and its free tier returns the latest 30 days; deeper history requires a different plan/contact. The documented BTC daily-flow method is based on issuer filings (shares outstanding × NAV), with Fidelity sourced from Farside. This makes it a potentially useful separately labelled recent-period comparison, but not an independent replacement for the current Farside/TFTC pair: at least one fund lineage explicitly overlaps with Farside, and the reviewed API docs do not by themselves establish long-term raw-response retention/redistribution rights. No API key was requested, no endpoint was called, and no data was captured.

Reference: https://docs.cryptoetf.today/

**Disposition:** keep as an unapproved candidate. Before any use, verify API-specific storage/reuse terms, the full fund universe and metric semantics, reporting-date coverage, revision behavior and exact reconciliation. Do not alter canonical source priority or `arithmetic_mean_2_sources` based on this review.


## Rights review refresh — official terms checked (2026-10-16)

- **TFTC ETF-flow dataset:** the live publisher page explicitly says the data may be quoted, charted and republished under CC BY 4.0 with attribution and a link. This remains the clearest route for a durable, attributed research artifact. The page also identifies upstream lineage: SoSoValue daily aggregates/ongoing per-fund flows and issuer disclosures tabulated by Farside for historical per-fund data. It is therefore not an independent confirmation of those providers.
- **SoSoValue website terms:** the official Terms of Use page says automated monitoring/copying and manual monitoring/copying are prohibited absent express authorization, and restricts reproduction/redistribution of website data/content. The separately documented API contract is still not established by these website terms alone. Decision: do not retain raw SoSoValue website/API responses until API-specific permission/terms or written permission are obtained.
- **Farside:** the reviewed official ETF-flow page describes the data but does not state a clear license for durable raw-response storage or redistribution. Decision remains unresolved; public accessibility is not treated as permission.

This is a project risk-control review, not legal advice. No API calls, credentials, or live source captures were used. References: https://www.tftc.io/bitcoin-etf-flows ; https://sosovalue.gitbook.io/helpdocument/resources/terms-of-use ; https://farside.co.uk/.


## Additional alternatives: CoinGlass and The Block (2026-10-16)

### CoinGlass — ETF flow history API

Official API documentation exposes `GET https://open-api-v4.coinglass.com/api/etf/bitcoin/flow-history`, with daily total flow in USD and per-ETF ticker breakdowns. The endpoint requires an API key and is listed across paid API plans. The API Terms of Use permit access under a limited license but prohibit, without prior written consent, bulk collection/storage to create an independent database and distribution, sublicensing or sharing of API data or derived data with third parties. They also require attribution when displaying or using the data.

**Disposition:** useful as a possible short-window diagnostic comparison if access is available, but **not cleared for durable raw archive, public evidence bundle, or independent database** without written permission. The public website Terms are also restrictive on copying/redistribution and bulk extraction. No key requested, endpoint called, or data captured.

Metric caution: the documented response provides daily flow in USD and per-fund values, but the exact ETF universe, reporting-date convention, publication/finality/revision policy, and underlying source lineage must still be established before row-level comparison. The existence of a second API vendor does not prove independent lineage.

References:
- API endpoint: https://docs.coinglass.com/reference/etf-flows-history
- API terms: https://www.coinglass.com/api-terms
- Website terms: https://www.coinglass.com/terms

### The Block — published flow chart / data dashboard

The Block publishes a daily USD flow chart for named US spot BTC ETFs. Its Terms of Service, effective 2026-04-08, state that the publisher owns or controls the data/analytics, restrict systematic or automated collection (including scraping/data extraction), and generally prohibit republishing or redistributing content except limited sharing/excerpts. The reviewed terms do not grant a general license to archive the full daily series or automate extraction.

**Disposition:** suitable for manual, attributed visual comparison where permitted, but **not cleared as a machine-captured archival source** absent a specific data license or written permission. No scraping or data capture performed.

Metric caution: the chart describes daily USD flows for a defined set of funds, but the reviewed public page/terms do not establish a machine-readable retention license, complete raw provenance, revision identifiers, or finality policy.

References:
- BTC ETF flow chart: https://www.theblock.co/data/etfs/bitcoin-etf/spot-bitcoin-etf-flows
- Terms of Service (effective 2026-04-08): https://www.theblock.co/terms-service

### Updated alternative-source disposition

| Candidate | Rights status from reviewed public terms | Technical/metric status | Decision |
|---|---|---|---|
| TFTC | Explicit CC BY 4.0 for its published ETF-flow dataset with attribution/link | Open JSON; upstream lineage overlaps SoSoValue and Farside | Best currently documented candidate for an attributed research artifact; not independent of upstream lineage |
| CoinGlass API | Bulk durable storage/database and redistribution restricted absent prior written consent | API key; USD daily flow and per-fund breakdown documented; lineage/finality still to verify | Not cleared for durable archive; permission required |
| The Block | Automated collection restricted; redistribution limited; no general full-series archive license identified | Published daily USD chart; raw provenance/revision contract not established | Manual visual cross-check only, within terms; no automated capture |
| CryptoETF.today | API key; public docs do not establish raw-retention/redistribution rights | Recent daily flows; documented issuer-filings method; Fidelity lineage overlaps Farside | Candidate only; rights and exact coverage need clarification |
| Newhedge | Retention/redistribution rights not established in reviewed API docs | BTC-denominated series, token required, seven-day revision window | Not directly comparable to USDm without approved conversion/timestamp methodology |
| SatoshiMacro | No independent licensing clearance established here | Public aggregate appears to use Farside + SoSoValue with fallback | Display-level cross-check only; lineage overlaps |

**Conclusion:** this additional review did not find a new alternative that is both demonstrably independent and clearly licensed for automated durable raw-data retention. TFTC remains the clearest licensed route for a retained attributed dataset. CoinGlass and The Block are useful research leads, not currently archive-cleared sources. Do not alter canonical priority, source registry, the `arithmetic_mean_2_sources` rule, or BTC readiness from this review alone.

No provider API calls, scraping, credentials, live captures, database writes, ingestion, scenario evaluation, deployment, or merge were performed. BTC remains `not_evaluable`.


## Additional alternative — ByKaranteli ETF flows (2026-10-16)

The current dataset page describes daily aggregate and per-fund US spot ETF flows, recorded by ByKaranteli, with finalized US trading days only and a provisional current day until all funds report. It also exposes an issuer-primary-source comparison for IBIT and XRPC using shares outstanding/NAV and an issuer-implied flow. These are useful methodological leads, especially the issuer-page comparison, but do not by themselves establish a full-universe independent daily aggregate.

**Rights review:** the current Terms of Service (last updated 2026-10-15) license site datasets/API responses for personal and research use with attribution, but explicitly prohibit using the API/MCP/x402 catalog to copy the archive systematically into a substitute database, archive or service. The terms also state that third-party provider records remain subject to their own terms and that the service grants no rights in those records. The public page does not fully resolve the upstream lineage for each aggregate ETF-flow row. Therefore this is **not cleared for our proposed repeated, durable raw-response archive** without written clarification; research-use permission alone does not override the systematic-archive restriction or third-party rights.

**Disposition:** keep as an unapproved comparison/methodology candidate, not as a replacement for Farside/TFTC and not as evidence of independent lineage. No API key was requested, no endpoint was called, and no data was captured. References: https://bykaranteli.com/data ; https://bykaranteli.com/terms (terms last updated 2026-10-15).


## Follow-up: ByKaranteli licence scope and issuer-primary route (2026-10-16)

### ByKaranteli terms interpreted for this project's retention model

The current Terms of Service distinguish ByKaranteli's own computations from public-source and third-party records. The live dataset/API licence allows personal and research use with visible attribution, but the same terms prohibit using the API/MCP/x402 catalogue to copy the archive systematically into a substitute database, archive or service. Third-party provider records are supplied for the user's own use only and remain subject to their originating provider's terms; the site's licence does not grant rights in those records. The historical GitHub/Kaggle/Hugging Face/Zenodo CC0 dedication applies to ByKaranteli's own computations in qualifying pre-2026-09-10 mirror files, not to third-party records; those mirrors are frozen and the ETF files were among the records withdrawn on 2026-10-11.

**Project decision:** a repeated capture pair intended to become part of our durable evidence archive falls too close to the expressly restricted systematic archive-copying use. Do not use the live ByKaranteli API as the retained two-snapshot evidence source without written permission clarifying this exact use and upstream rights. It may remain a manually consulted research/display cross-check within the terms; do not treat it as a cleared durable-source path.

### Direct issuer-primary data — promising for checks, not yet a complete aggregate source

The reviewed BlackRock iShares IBIT official product page publishes dated NAV, net assets, and shares outstanding and exposes a holdings download. The official Fidelity quote page publishes FBTC NAV and shares outstanding; SEC reports provide point-in-time outstanding-share figures and financial statements. This supports an issuer/filing-based cross-check for specific funds without copying a third-party ETF-flow aggregator.

However, the sources reviewed do **not yet demonstrate** a complete, consistent, daily historical feed for every US spot BTC ETF in the project universe, with stable dates, row-level correction history and a reproducible aggregate. Periodic SEC reports alone are not a daily flow series. Do not extrapolate one issuer's data availability to the entire fund universe, and do not assume that the change in fund net assets is equivalent to net flow (it includes BTC price movements). A candidate formula based on share creation/redemption and the applicable NAV would need a documented date convention, per-fund coverage, split/fee/share-class handling, and reconciliation against an established series before acceptance.

**Next offline research step:** build a fund-by-fund coverage matrix of official issuer/SEC sources for the exact current US spot BTC ETF universe, recording the available fields, cadence, history depth, terms, and any machine-readable endpoint. This is a source discovery task only; no live capture, source promotion, or metric-rule change is authorised by this review.

References:
- ByKaranteli Terms (updated 2026-10-15): https://bykaranteli.com/terms
- ByKaranteli API documentation: https://bykaranteli.com/developers
- BlackRock IBIT official product page: https://www.blackrock.com/us/individual/products/333011/fund
- Fidelity FBTC quote page: https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=FBTC
- SEC Fidelity Wise Origin Bitcoin Fund quarterly report: https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm
