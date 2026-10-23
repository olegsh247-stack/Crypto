# BTC ETF Session-Aware Freshness Contract — 2026-10-23

**Status:** acceptance contract proposal; ETF input remains review-only and BTC remains `not_evaluable`.  
**Scope:** daily US spot-Bitcoin ETF net-flow rows from Farside's all-data endpoint. No registry/runtime admission or production ingestion is authorized.

## Decision

Do not treat a daily ETF trading-session date as an exact observation/publication timestamp. Farside's table identifies the reporting session and exposes a page date, but the reviewed response does not provide a reliable exact publication timestamp for each row. Therefore:

- `period_start` / `source_session_date` identifies the ETF reporting session, not the instant at which the value became observable.
- `retrieved_at` records when our capture obtained the page; it is not a substitute for `observed_at`.
- Keep `observed_at = null` when the provider does not supply it. Do not synthesize it from midnight UTC, page date, HTTP Date, or retrieval time.
- Farside remains the priority research source. SoSoValue is a comparison source, not a silent fallback; TFTC is not independent where its lineage overlaps.
- Missing, placeholder, partial, or unreconciled latest rows fail closed. Preserve raw source values and snapshot hashes; do not average conflicting sources.

## Required identity and provenance

Every candidate row/snapshot must preserve:

1. `metric_id` for the registered ETF-flow metric only when the row passes its contract; otherwise keep it as a review candidate.
2. `source_id = institutional.primary`, exact endpoint URL, HTTP result, source page date, and provider reporting/session date.
3. `period_start` as the session date using a documented date-only convention; do not reinterpret it as `observed_at`.
4. `observed_at` only when supplied by the provider with documented semantics; otherwise null.
5. `retrieved_at` in UTC, raw response/artifact SHA-256, parser and methodology version, source row key, and all 12 fund fields plus displayed total.
6. Completeness status distinguishing a reported numeric zero from blank, dash, placeholder, or not-yet-reported row.
7. Revision comparison against prior snapshots, including old value/status, new value/status, retrieval times, and the source payload hashes.
8. Units fixed to `USD million/day`; verify all fund fields reconcile to the displayed total within the provider's rounding precision.

## Freshness rule — deliberately not yet implementable

A session-aware freshness decision must use the **latest completed US ETF trading session**, not simply `now - period_start` and not `now - retrieved_at`.

Before implementing or approving this rule, the repository must identify a versioned, auditable US market-session calendar (including holidays and exceptional closures) and define the provider's expected publication window. The gate must then verify:

- the latest complete Farside row corresponds to the latest session expected to be published under that calendar/publication window;
- the page date and capture time are consistent with that expected publication window;
- no newer expected session is missing, partial, or a placeholder;
- any allowed delay/grace period is explicit and tested, rather than hidden in a generic 36-hour timestamp limit.

Until those semantics and tests exist, the current timestamp-based readiness gate is intentionally unchanged and the ETF metric remains blocked. Do not loosen it merely to make a row with `observed_at = null` pass.

## Revision, retention, and recovery gates

- Retain at least two independently timestamped snapshots separated by 24 hours or more; compare overlapping rows and report additions, removals, placeholder-to-reported transitions, and value changes.
- A displayed placeholder zero is not a confirmed zero. A changed row creates revision evidence; it must not silently overwrite the previous snapshot.
- Keep the source-priority value and all cross-source discrepancies. For 2026-10-21, Farside is +524.8 USDm and SoSoValue +528.40023714 USDm; preserve the ~3.60023714 USDm difference and use Farside only as the priority research value. For 2026-10-22, Farside is -635.6 USDm and SoSoValue -635.492639395 USDm; preserve the ~0.107361 USDm difference.
- Prove durable retention, independent retrieval, and restore of raw snapshots plus parser/version metadata before production ingestion. Temporary CI artifact retention alone does not meet this gate.
- If the priority endpoint is unavailable or incomplete, keep the metric blocked; do not substitute SoSoValue/TFTC without a separately reviewed source-contract change.

## Current evidence (2026-10-23)

Read-only BTC Public Source Staging run [#39921752769](https://github.com/olegsh247-stack/Crypto/actions/runs/39921752769), artifact 12486659972, confirms:

- Farside all-data endpoint returned HTTP 200; latest complete session is 2026-10-22, total -635.6 USDm, with all 12 fund fields present and reconciled.
- The separate Farside landing page returned HTTP 403; the successful capture used the all-data endpoint.
- Baseline and latest snapshots were 58.62 hours apart. The 2026-10-20 placeholder row became a complete +23.2 USDm row; 2026-10-21 (+524.8 USDm) and 2026-10-22 (-635.6 USDm) were added; no overlapping rows were removed.
- The source does not provide an exact row publication timestamp. The evidence supports revision comparison and source-priority selection, but not final session-aware freshness acceptance or durable archive/restore.

## Acceptance checklist

- [x] Priority source selected and fallback behavior defined.
- [x] Two snapshots separated by more than 24 hours compared; row revisions and additions recorded.
- [x] Complete latest captured row and arithmetic reconciliation verified.
- [ ] Select/version an auditable US ETF session calendar and publication-window convention.
- [ ] Implement and test session-aware freshness without fabricating `observed_at`.
- [ ] Define and test revision/finality treatment for revised provider rows.
- [ ] Prove durable snapshot retention, independent retrieval, and restore.
- [ ] Run readiness tests and offline scenario after contract implementation; keep current BTC readiness blocked until all mandatory gates pass.

## Safety boundary

This contract does not authorize production database access/writes, ingestion, registry/source-priority changes, runtime changes, scenario evaluation/state writes, monitoring writes, or deployment.
