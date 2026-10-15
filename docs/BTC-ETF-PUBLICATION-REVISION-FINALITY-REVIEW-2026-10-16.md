# BTC ETF publication, revision and finality review — 2026-10-16

**Scope:** determine what can be documented from the public Farside and TFTC descriptions about timing, lineage, revisions and permitted reuse, and what remains an acceptance decision.
**Mode:** public-source/documentation review only. No live capture, registry changes, database access, ingestion, scenario evaluation or monitoring writes.
**Decision:** document the provider claims below, but keep the production ETF input blocked. Neither source's public description establishes a complete immutable publication/revision/finality contract for the project's current canonical metric.

## 1. Farside — current canonical priority, incomplete lifecycle contract

- Farside's official site says its Bitcoin ETF flow table provides daily US spot Bitcoin ETF flows in USD millions and updates in real time, typically during the evening and night US time: https://farside.co.uk/
- Farside has also described a process that polls multiple sources, calculates implied USD flows from share-count data and updates the HTML table in real time: https://www.linkedin.com/posts/farsideinvestors_farside-investors-has-produced-a-bitcoin-activity-7159188203738906624-iOG1
- These descriptions establish that values can arrive/update over time; they do **not** define a stable machine-readable provider revision ID, a guaranteed publication timestamp per date, a finalization event, a correction-history API, or a guaranteed time after which a row never changes.
- The current capture workflow's HTTP `Date`, `Last-Modified`, `ETag`, cache headers and response SHA-256 are useful retrieval evidence, but none alone proves the underlying observation's publication time or provider finality. A response hash identifies the captured response body, not an individual row or provider revision.
- Farside remains the configured canonical-priority source in the repository contract. A 403 from a capture runner is a retrieval failure, not zero flow and not permission to promote a fallback.

## 2. TFTC — better documented lifecycle, distinct lineage

TFTC's public tracker states:
- issuers report after the US market close; the latest session generally settles in the evening, and some smaller funds report a day later;
- the tracker updates twice daily and picks up late revisions on the following morning;
- older dates are automatically corrected when a source revises them;
- daily aggregates/current per-fund flows are sourced from SoSoValue, while historical per-fund history from launch through mid-2026 is compiled from issuer disclosures as tabulated by Farside;
- the open JSON series is available at `/bitcoin-etf-flows/data.json`, and the page permits quoting/charting/republishing under CC BY 4.0 with attribution.

Source: https://www.tftc.io/bitcoin-etf-flows

These statements make TFTC's refresh cadence, known revision behavior, high-level lineage and reuse/attribution terms more explicit than the evidence currently documented for Farside. They still do not expose a per-row immutable revision ID, a guaranteed finalization point, or an authoritative correction log. The live JSON is a mutable current representation; a captured SHA-256 is needed to identify the exact payload used in a particular research run.

## 3. What is established vs. what remains a decision

| Contract element | Evidence-based conclusion | Status |
|---|---|---|
| Metric meaning | Daily net flow for US spot BTC ETFs; USD millions/day | Documentable |
| Reporting calendar | US trading sessions; values arrive after the close and may lag | Documentable |
| Farside publication behavior | Real-time updates, usually evening/night US time | Documentable, not a per-row timestamp guarantee |
| TFTC refresh/revisions | Twice-daily sync; late/latest and older rows can be revised | Documentable, not finality |
| TFTC lineage | SoSoValue for current daily aggregates/per-fund flows; Farside-derived historical per-fund series through mid-2026 | Documentable, lineage varies by period |
| Exact source observation/publication time per row | Not established by the public descriptions reviewed | Blocked |
| Provider revision identifier / complete correction history | Not established | Blocked |
| Provider-declared finality / immutable-after time | Not established | Blocked |
| Automated collection/storage permission for TFTC | CC BY 4.0 with attribution is stated on the tracker | Documentable; comply with attribution/license |
| Equivalent automated-use permission for Farside | Not established by the pages reviewed here | Requires separate terms/permission review |
| Canonical priority change from Farside to TFTC | Not approved by this review | Explicit decision required |
| Research mean from both raw sources | Existing method remains research-only; preserve both raw values and capture provenance | Allowed only in offline research contract |

## 4. Safe contract while unresolved

1. Preserve source-reported date as the logical reporting period, separately from retrieval time. Do not mislabel the date as a precise observation or publication timestamp.
2. Preserve each raw source value independently, along with source ID, URL, retrieval timestamp, HTTP metadata where present, response SHA-256, parser/method version and the exact artifact used.
3. Keep `observed_at` unknown when no defensible provider observation/publication time is supplied. Keep `finalization_status: unknown` and provider revision unknown.
4. Treat subsequent payload differences as a newly captured representation requiring a deterministic row-level diff. Do not silently overwrite prior evidence or treat a response hash as a provider revision ID.
5. Missing cells, dashes and incomplete fund rows are not zero. Require all configured fund reporting and the existing total reconciliation checks before emitting a research-derived mean.
6. Continue to label `arithmetic_mean_2_sources` as a research-derived consensus value, never as a provider-reported total. Keep it non-persistable and offline-only.
7. Do not promote TFTC to canonical priority, loosen freshness, change the metric registry, or write production rows based only on this review.

## 5. Decision gate to remove the production blocker

A future production contract must choose and document one of these policies:

- **Provider-lifecycle path:** obtain a defensible per-row publication/observation timestamp and revision/finality semantics from the canonical provider, or a supported provider correction-history/version mechanism.
- **Immutable project-snapshot path:** explicitly approve a project-owned snapshot policy defining capture time, artifact immutability, row reconciliation, when a date becomes eligible for research/evaluation, and how a later provider correction creates a new version without silently rewriting history. This is a project policy, not a claim that the provider declared the row final.

Separately, any canonical-source change requires an explicit decision about lineage, attribution/license, discrepancy handling, freshness and source priority. This review makes no such change.

## Result for Plan 100

- ETF production acceptance remains **blocked**; BTC remains `not_evaluable`.
- Existing Farside/TFTC arithmetic-mean output remains `RESEARCH_DERIVED`, `OFFLINE_RESEARCH_ONLY`, `persistable: false`, with unknown observation time and finality.
- No metric/source registry, production observation, scenario state, score, probability or monitoring event changed.
