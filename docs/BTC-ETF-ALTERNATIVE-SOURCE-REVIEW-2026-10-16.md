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
