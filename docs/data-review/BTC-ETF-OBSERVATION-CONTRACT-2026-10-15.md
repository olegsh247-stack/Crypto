# BTC ETF observation contract — 2026-10-15

**Decision: HOLD / review-only.** This contract fixes the meaning and handling of ETF source fields; it does not approve Farside or TFTC rows for persistence and does not make BTC evaluable.

## Canonical metric and current candidate

- Metric: `institutional.etf_net_flow`
- Canonical candidate identity: `institutional.primary` (Farside official all-data page, `https://farside.co.uk/bitcoin-etf-flow-all-data/`).
- Unit: `USD million/day`, as displayed by Farside.
- TFTC remains a diagnostic-only secondary candidate. It is not in the metric's approved source priority.
- The metric's latest-row freshness budget is 36 hours. This is measured from a defensible `observed_at`, not from the reporting date, response retrieval time, or HTTP Date header.

## Field semantics

| Field | Contract |
|---|---|
| `period_start` / `period_end` | The provider's logical reporting/session date, represented as a date-only value. It is not a timestamp of publication. |
| `observed_at` | The actual provider publication/observation timestamp for the reported value, only when the provider exposes it or a separately reviewed source-specific convention can establish it. Current Farside/TFTC evidence does not establish this field; leave it `null`. |
| `retrieved_at` | When the capture runner received the HTTP response. It records collection time only and must never be copied into `observed_at`. |
| `http_date` | HTTP response metadata from the serving/cache layer. It is not evidence that the ETF row was published or finalized at that time. Do not use it as `observed_at`. |
| `source_updated_at` / `provider_last_modified` / `etag` | Preserve when supplied. Current captures have no reliable provider row revision/finality guarantee; absent metadata stays `null`. ETag identifies a response representation, not an ETF row revision. |
| `source_row_key` | Candidate logical key `farside-btc-etf-flow:YYYY-MM-DD`, derived from the reporting date. It identifies the logical session only; it is not a provider-assigned ID and cannot distinguish corrections to that session. |
| `source_payload_sha256` | SHA-256 of the full captured response body. This proves which capture was reviewed, not the identity/version of an individual row. |
| `provider_revision` / `revision` | Keep `null` until the provider exposes a defensible revision identifier or a reviewed snapshot-diff policy is adopted. A local revision counter must not be mislabeled as a provider revision. |
| `finalization_status` | `unknown` until the source documents or exposes a defensible finality/correction policy. |
| Flow value | Use Farside's displayed aggregate only for a reported row that passes the parser's structural checks. Keep per-fund reconciliation as diagnostic evidence; material mismatch is not silently normalized. |
| Dashes / placeholder rows | A row with all fund values missing and displayed total zero is `UNREPORTED_PLACEHOLDER`; its normalized value is `null`, never numeric zero. |

## Revision and duplicate handling

1. Do not overwrite historical observations just because the same reporting date appears in a later response.
2. Same reporting-date key plus identical response hash is a repeat capture, not proof of a new row revision.
3. Same reporting-date key plus a different response hash signals a changed source snapshot. Retain both immutable capture artifacts and mark the row as requiring reconciliation; do not auto-increment a provider revision or auto-select the newer value.
4. The date-derived key is suitable for candidate grouping and idempotency diagnostics only. It is insufficient by itself for accepted persistence until revision/finality behavior is defined.
5. Five distinct completed trading dates are a minimum history check, not proof of currentness or source acceptance.

## Acceptance gate — still blocked

Before accepting ETF observations, a later reviewed change must establish all of the following:

- a valid source publication/observation-time convention that is independent of retrieval time;
- provider revision/finality semantics or an explicitly approved immutable-snapshot reconciliation policy;
- stable row identity and correction handling;
- a rule for incomplete sessions, holidays, dashes and confirmed zeros;
- reconciliation policy for material Farside/TFTC differences and any change to canonical source priority;
- five distinct completed sessions with provenance, plus a latest row within the registered 36-hour freshness budget.

The present code emits ETF rows as `REVIEW_ONLY_BLOCKED`, with `observed_at: null`, `provider_revision: null`, `revision: null`, `finalization_status: "unknown"`, and `persistable: false`. HTTP Date and retrieval time are retained separately but never promoted to observation time.

**Safety:** no live ingestion, database writes, historical-row edits, scenario evaluation, scenario-state/probability/monitoring changes, or deployment were performed for this contract.

## Public-source spot check — 2026-10-15

Read-only review of the public pages on 2026-10-15 found concrete examples of why the secondary source must remain diagnostic-only:

| Session date | Farside displayed total | TFTC displayed total | Difference (TFTC − Farside) | Review result |
|---|---:|---:|---:|---|
| 2026-10-07 | -484.9 USDm | -487.1 USDm | -2.2 USDm | Material discrepancy; not reconciled |
| 2026-10-13 | +175.7 USDm | +175.6 USDm | -0.1 USDm | Small difference consistent with displayed rounding/aggregation, but not proof of identical lineage |
| 2026-10-14 | -261.4 USDm | -261.4622 USDm (TFTC raw value, displayed total about -261.5) | about -0.0622 USDm | The captured Farside row has numeric values for all 12 funds, including explicit 0.0 cells; this is complete at the visible-table level, but publication/finality remains unverified |

For 2026-10-07, the visible fund-level difference includes BRRR: Farside displays 0.0 while TFTC displays about -2.1 USDm; the remaining displayed-total delta is affected by the sources' aggregation/rounding. The exact root cause is not established by the public pages alone. Do not “fix” one source to match the other. The read-only staging artifact captured on 2026-10-15 also contains TFTC data through 2026-10-14, so the earlier statement that TFTC had not yet published that session is superseded by this capture.

TFTC's methodology note says current daily aggregates and ongoing per-fund flows are sourced from SoSoValue, while its earlier per-fund history through mid-2026 is compiled from issuer disclosures as tabulated by Farside. TFTC also explicitly warns that the latest day may revise and that older days are corrected automatically. This is useful independent diagnostic evidence, but does not make it an independent authoritative truth for every date or remove the need to preserve capture-level provenance.

**Implementation added in this review branch:** the Farside parser now emits `fund_completeness_status`, `funds_reported_count`, `funds_expected_count`, and `missing_funds`. Explicit `0.0` is a reported numeric value; a dash remains `null`. The candidate mapper adds `fund_reporting_incomplete` (or `fund_completeness_status_missing_or_unverified`) when a reported aggregate lacks a verified complete set of fund values. Tests cover a partial 2026-10-14-like row and ensure its displayed aggregate is retained for review but cannot pass reconciliation or persistence.

**Operational consequence:** a row's aggregate total alone is not enough to mark a session complete. For the 2026-10-07 mismatch, retain `DELTA_EXCEEDS_SCREENING_BAND` and the differing fund values in the review artifact; acceptance remains blocked pending a documented reconciliation decision.

Public references reviewed:
- Farside Bitcoin ETF table: https://farside.co.uk/btc/
- TFTC Bitcoin ETF flows and methodology: https://www.tftc.io/bitcoin-etf-flows

This spot check does not change source priority, approve ingestion, or establish publication time, provider revision, or finalization semantics.


## Runtime gate alignment — 2026-10-15

The shared BTC readiness gate now enforces this contract instead of treating the aggregate row and five-date count as sufficient. For both the latest row and historical rows counted toward the five-session minimum, it requires complete reporting across all 12 fund columns, an empty missing-fund list, a full-response SHA-256, a defensible observation timestamp, and explicit revision/finality acceptance. A provider revision identifier is accepted only when present; alternatively, the project must explicitly approve an immutable-snapshot reconciliation policy. Finality must be `final` or `reconciled_snapshot`. `retrieved_at`, HTTP Date, ETag, and the date-derived row key do not satisfy these requirements.

The current public-source capture does not meet the gate because `observed_at` is unresolved and provider revision/finality are unknown. This is intentional fail-closed behavior, not a claim that Farside publishes metadata it does not expose. Readiness tests now cover missing observation time, incomplete fund reporting, and unknown revision/finality. BTC remains `not_evaluable` until the source contract is resolved; no live ingestion or production change was made.
