# TFTC BTC ETF dataset archive contract

**Status:** design contract only; not approval to capture or promote the metric.  
**Reviewed:** 2026-10-16  
**Dataset page:** https://www.tftc.io/bitcoin-etf-flows  
**Published JSON endpoint:** https://www.tftc.io/bitcoin-etf-flows/data.json

## 1. Scope and decision

TFTC's publisher page explicitly says its ETF-flow dataset may be quoted, charted, and republished under Creative Commons Attribution 4.0 International (CC BY 4.0), provided the dataset is credited with a link back to TFTC. This is the clearest currently documented option for a durable, attributed research artifact among the reviewed providers.

This contract covers only the TFTC-published dataset and artifacts derived from that dataset. It does not grant rights over separately downloaded Farside or SoSoValue raw responses, does not establish independent source lineage, and does not approve TFTC as the canonical production source.

No live request or capture was performed while preparing this contract.

## 2. Required attribution and license metadata

Every retained copy or derived research artifact must preserve, in a human-readable record and machine-readable manifest:

- publisher: TFTC;
- dataset name: US spot Bitcoin ETF flows;
- canonical dataset page: https://www.tftc.io/bitcoin-etf-flows;
- capture URL: the exact URL actually requested, expected to be https://www.tftc.io/bitcoin-etf-flows/data.json if that endpoint is used;
- license: Creative Commons Attribution 4.0 International (CC BY 4.0);
- license URL: https://creativecommons.org/licenses/by/4.0/;
- required credit: Source: TFTC, US spot Bitcoin ETF flows (https://www.tftc.io/bitcoin-etf-flows);
- retrieval timestamp in UTC;
- response HTTP status, content type if supplied, byte length, and SHA-256 of exact response bytes;
- reporting dates represented, source-reported units, parser/normalizer version, and schema fingerprint/version if explicitly available;
- any modifications, filtering, normalization, or derived calculations applied after capture.

Attribution must remain with the dataset and all derived files when redistributed. A hash proves byte identity, not licensing or source accuracy.

## 3. Upstream lineage and independence

TFTC's page describes mixed upstream lineage:
- current daily aggregates and ongoing per-fund flows are sourced from SoSoValue;
- historical per-fund history through approximately mid-2026 is compiled from issuer disclosures tabulated by Farside.

Therefore:
- TFTC is a distinct publisher, but its current daily figures are not an independent estimator of SoSoValue;
- historical TFTC rows may overlap Farside's issuer-disclosure compilation;
- never count TFTC, SoSoValue, and Farside as three independent votes;
- preserve both source-publisher identity and known upstream lineage on every comparison;
- do not describe the arithmetic mean of Farside and TFTC as independent consensus. It remains a project-defined arithmetic_mean_2_sources research-derived value and retains both original values.

Lineage may change. Record what the publisher states at the time of review; do not infer an upstream source when it is not disclosed.

## 4. Snapshot and revision contract

Each capture must create a new immutable snapshot. Never overwrite a prior snapshot.

Required fields include:
- unique snapshot ID;
- requested URL and final URL if redirects occurred;
- retrieval timestamp UTC;
- HTTP status and response headers needed to interpret the body, excluding cookies and credentials;
- raw-body SHA-256 and byte length;
- reporting date/date range represented by each row;
- provider observation/publication timestamp, revision ID, and finality state only if explicitly provided; otherwise unknown/null;
- schema fingerprint and normalizer version;
- license/attribution metadata and source-lineage statement;
- parser diagnostics, duplicate rows, missing dates, and comparison results.

Do not confuse reporting date, retrieval time, or publisher update cadence with a provider-confirmed publication time or finality guarantee. TFTC's stated update cadence and correction behavior do not alone establish that an individual row is final. If a later snapshot differs, retain both versions and record a diff; do not silently rewrite historical evidence.

## 5. Data handling boundary

- Do not commit raw payloads to this public repository.
- Store any durable snapshot only in private, project-controlled storage after its access controls and backup/recovery procedure have been verified.
- GitHub Actions artifacts are temporary transport/test artifacts, not the durable evidence archive.
- Do not copy raw Farside or SoSoValue responses into a TFTC-labelled archive. Their own rights remain separately unresolved unless their terms or written permission establish otherwise.
- Do not store API keys, cookies, authorization headers, or credentials in the manifest, payload metadata, logs, or archive.
- Do not run live capture, ingestion, database writes, source-registry changes, scenario evaluation, or production state changes under this design-only contract.

## 6. Acceptance gates before real capture

A future capture is eligible for review only after all gates below are met:

1. Re-check TFTC's current published license statement and attribution requirement at capture time.
2. Use the public JSON endpoint only within applicable access terms; do not bypass rate limits or access controls.
3. Save exact bytes and provenance fields; verify SHA-256 and byte length.
4. Validate schema, date coverage, units, duplicates, missing values, and row-level semantics offline.
5. Compare against other sources only with explicit upstream lineage labels and no assumption of independence.
6. Preserve changes across repeated captures; do not infer finality from unchanged values alone.
7. Restore the snapshot from a backup in a separate failure domain and verify checksums before calling the archive durable.
8. Obtain explicit human review before considering any source-priority, metric-registry, or production-readiness change.

## 7. Current disposition

TFTC is the best-documented licensing candidate for an attributed research archive, but no live payload has been captured, the durable private archive and independent backup are not operational, and the daily metric's publication/finality/revision semantics still need to pass the project acceptance contract. This document does not change canonical source priority or unblock BTC.

BTC remains not_evaluable. This is project risk control, not legal advice.

## References

- TFTC dataset and license statement: https://www.tftc.io/bitcoin-etf-flows
- CC BY 4.0 legal code: https://creativecommons.org/licenses/by/4.0/
- Related source-rights review: [BTC ETF alternative-source review](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md)
- General archive/recovery contract: [BTC ETF evidence archive and recovery contract](BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md)
