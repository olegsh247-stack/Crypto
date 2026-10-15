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
