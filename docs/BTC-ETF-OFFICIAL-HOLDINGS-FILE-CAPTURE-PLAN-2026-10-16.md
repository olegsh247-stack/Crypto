# BTC ETF official holdings files and daily capture feasibility — 2026-10-16

**Status:** research-only working inventory. No issuer file was downloaded by this review, no scheduled workflow was run, and no registry, database, scenario, production ingestion, deployment, or merge was changed. A link to a holdings page is not evidence that its underlying file is retrievable, dated, historically versioned, or licensed for indefinite retention.

## Acceptance contract for a per-fund file

A fund is eligible for daily source capture only when the actual issuer response demonstrates:
1. a numeric BTC quantity (not AUM, NAV, weight, shares, or a quantity rounded beyond the intended precision);
2. an issuer-provided observation/as-of date parsed from the same response, not a scraper-generated weekday;
3. the exact URL, retrieval timestamp, response status/content type, SHA-256 payload hash, parser version, and raw-to-normalized lineage;
4. a repeatable retrieval path and documented applicable terms for retention/backup;
5. explicit handling of corrections, missing rows, stale responses, and unchanged values.

A daily scheduled job can start accumulating prospective observations only after these checks. It cannot reconstruct history before its first successful capture. Historical backfill requires separately verified dated issuer snapshots or SEC filing controls. Do not infer holdings from AUM / BTC price or from USD flow, forward-fill missing dates, or treat a missing fund/date as zero.

## Fund-by-fund official-file inventory

| Ticker | Official route / actual file evidence | BTC quantity and observation date | Historical archive status | Prospective capture status |
|---|---|---|---|---|
| IBIT | [iShares product page](https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf) exposes “Download Holdings CSV” and defines quantity as total bitcoins held. | Quantity semantics documented; the page's displayed holdings date can lag and the live CSV URL/payload has not been independently captured in this review. | No issuer-provided public historical CSV archive verified. SEC filings provide periodic controls. | Strong candidate; exact response URL, date field, and retention terms still need a controlled file-level test. |
| FBTC | [Fidelity](https://www.fidelity.com/) product route and Trust SEC filings; prospectus describes daily holdings dissemination on the Trust website. | A directly retrievable dated BTC-quantity file has not been verified in this review. | SEC periodic filings are control points; full issuer daily archive not verified. | Candidate only; identify and test the actual download/API route. |
| GBTC | [Grayscale ETF site](https://etfs.grayscale.com/) and [SEC filing index](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/0001588489-26-000005-index.html). | Current downloadable issuer file and date field not verified. | SEC quarterly history available; no complete daily issuer archive verified. | Not ready until actual file and terms are identified. |
| BTC (Grayscale Bitcoin Mini Trust) | [Grayscale ETF site](https://etfs.grayscale.com/) and SEC reports. | Current downloadable issuer file and date field not verified. | SEC quarterly history available; no complete daily issuer archive verified. | Not ready until actual file and terms are identified. |
| ARKB | [ARKB product page](https://www.ark-funds.com/funds/arkb); official document table exposes a “Fund Holdings CSV” and “Fund Holdings PDF”. | Search-indexed official PDF example includes an explicit “As of” date and a Bitcoin row, but the shown “Shares” quantity is whole-BTC rounded; current CSV payload and its exact precision/date fields need direct validation. | Publicly discoverable dated PDFs may be useful snapshots, but a complete issuer historical archive has not been established. | Candidate; prefer CSV if it carries precise BTC amount and an issuer date. Do not use rounded PDF quantity as precise balance. |
| BITB | [Bitwise product site](https://bitbetf.com/). | Actual issuer file/date/precision not verified. Public third-party parser stamps a calculated weekday rather than parsing the issuer date; its dates are not accepted as observed dates. | No issuer archive verified. | Blocked pending direct file discovery and provenance. |
| HODL | [VanEck HODL page](https://www.vaneck.com/us/en/investments/bitcoin-etf-hodl/overview/). Official page displays “Bitcoin in Trust” with a date and separately provides holdings XLS. | Page statistic reports a more precise “Bitcoin in Trust” figure, while holdings XLS/table “Quantity” is rounded to whole BTC. These are different fields; only the precise statistic or an equally precise issuer file can meet the exact-quantity contract. | Query-string/page pagination can expose dated snapshots, but a complete, stable historical export has not been verified. | Candidate only after choosing the correct precise field and validating stable URL/date semantics. |
| BTCO | [Invesco product route](https://www.invesco.com/) and SEC 10-Q. | No directly verified daily BTC-quantity file; SEC schedule gives periodic BTC holdings. Do not estimate holdings as AUM / price. | SEC periodic controls only in the verified evidence. | Blocked pending an issuer-published exact quantity source. |
| EZBC | [Franklin Templeton EZBC page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS/franklin-bitcoin-etf/EZBC). Page explicitly shows an XLS holdings link and labels holdings “Updated Daily”. | A dated holdings snapshot is displayed, but actual XLS payload URL, BTC quantity precision, and embedded observation-date field have not been directly verified. | No versioned historical XLS archive verified. | Strong candidate for file-level test. |
| BRRR | [CoinShares BRRR page](https://coinshares.com/us/etf/brrr/). Official page presents a holdings table and an explicit “As of date”. | Current displayed Bitcoin row uses “Shares” and a dated value (for example 5,705.29 BTC-equivalent units as of 2026-09-07); the exact downloadable response and quantity semantics still need verification. | Dated current page confirmed; complete historical export not verified. | Candidate for controlled page/file capture; distinguish actual BTC held from a field merely labelled Shares. |
| BTCW | [WisdomTree BTCW page](https://www.wisdomtree.com/us/products/crypto/btcw). | Public holdings table reports Bitcoin at 100% weight, not a numeric BTC quantity. | SEC quarterly reports provide periodic control quantities; no daily exact-quantity file verified. | Blocked unless an official exact BTC quantity route is found. |
| MSBT | [Morgan Stanley product page](https://www.morganstanley.com/im/en-us/financial-advisor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html) and SEC filings. | Product page has a holdings section but the reviewed page output did not expose a dated numeric BTC quantity or download link. | SEC quarterly controls available; daily history not verified. | Candidate for browser/network-level file discovery, not yet eligible. |
| OBTC | [Osprey product route](https://ospreyfunds.io/) and SEC filings. | Actual current issuer file and date field not verified in this review. | Two quarterly controls in the inspected candidate extraction; no complete daily issuer archive verified. | Blocked pending direct issuer-file discovery. |

## Evidence already established for historical controls

The project has a separate same-date SEC control table for all 13 active tickers at **2026-06-30** in `BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md`. Those controls are suitable for filing-level validation and for checking extractor completeness; they are not daily observations and must not be interpolated or forward-filled.

The inspected third-party daily candidate has 162 rows across only five tickers and a short late-August/September–October 2026 window. It has material provenance/precision issues: BITB dates are asserted by the scraper rather than parsed from issuer evidence; HODL candidate quantities are rounded; repeated values need source-level verification; OBTC has a long unchanged integer series. None of these rows is accepted solely because the JSON is structurally valid.

## Daily capture design — proposed, not implemented

- Run once per business day on the project-controlled host after issuer publication windows; keep manual trigger for safe tests.
- For each fund, fetch only its documented official endpoint/page/file at conservative rates. Save immutable per-capture metadata and payload hash; raw payload retention is gated by the specific source's terms.
- Parse `observed_date` only from the issuer response. Record `retrieved_at_utc` separately. If the issuer date is absent or ambiguous, store a failed/unverified attempt, not a guessed date.
- Use a stable key such as `(ticker, source_id, observed_date, payload_hash)`; keep multiple versions for the same observation date and record correction/supersession rather than overwriting history.
- Store normalized values with units, precision, parser version, source URL, response hash, and status. Preserve raw bytes only when retention and backup rights are confirmed; otherwise retain permitted citation metadata and the hash.
- Alert on missing fund, stale as-of date, parser/schema change, HTTP failure, empty/placeholder response, impossible value, unexpected precision change, and suspicious long unchanged runs. An unchanged value is a review signal, not automatically an error.
- Maintain a separate historical-backfill queue. Accept a past date only when an issuer archive or an exact-date filing provides direct evidence; quarterly SEC controls stay in a separate frequency class.
- Keep daily capture read-only with respect to production scenario state. Do not update scores/probabilities or make BTC evaluable from capture success alone.

## Immediate next actions

1. Test the actual official CSV/XLS/PDF response for the strongest candidates: IBIT, ARKB, HODL, EZBC, and BRRR; record the resolved URL, response metadata, exact quantity field, observation-date field, and hash in a controlled research artifact.
2. Locate official exact-quantity routes for FBTC, GBTC, Mini BTC, BITB, BTCO, BTCW, MSBT, and OBTC. Do not substitute third-party series without rights and provenance review.
3. Verify source-specific retention/backup terms before enabling durable raw-payload storage.
4. Only after the file tests pass, implement a manual-first daily capture rehearsal and verify that the second run appends a new immutable observation, identical payloads become no-ops, and corrections create a new version.
5. Keep PR #83 Draft and unmerged. No runtime/DB/production action is authorized by this document.
