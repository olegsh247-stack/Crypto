# BTC ETF observation contract — 2026-10-15

**Decision: HOLD / review-only for persistence; dual-source mean accepted for the offline research dataset.** This contract defines how to derive a reproducible research value when both Farside and TFTC publish a value for the same session. It does not imply that either provider exposes publication-time or finality metadata sufficient for production persistence.

## Canonical metric and current candidates

- Metric: `institutional.etf_net_flow`
- Primary source: Farside Bitcoin ETF table, `https://farside.co.uk/bitcoin-etf-flow-all-data/`.
- Secondary comparison source: TFTC Bitcoin ETF flows, `https://www.tftc.io/bitcoin-etf-flows`.
- Unit: `USD million/day`.
- For the offline research dataset, when both sources provide a valid numeric aggregate for the same session, the derived value is their arithmetic mean. Keep the two raw source values and source metadata unchanged.
- If only one source has a valid numeric aggregate, do not silently label it a two-source mean. Mark the derived value `single_source_fallback` and preserve the missing-source reason; use it only under an explicit research review, not as an automatically accepted production observation.
- The mean reconciles the two reported values for research analysis; it does not prove either provider is authoritative, establish publication time, or establish finality.
- The metric's latest-row freshness budget remains 36 hours. This is measured from a defensible `observed_at`, not from the reporting date, response retrieval time, or HTTP Date header.

## Dual-source mean rule

For a session where both providers have valid numeric aggregates:

`research_mean_usd_m = (farside_total_usd_m + tftc_total_usd_m) / 2`

Use full available precision for the calculation and preserve the unrounded result in the research record. Display rounding is a presentation-only operation. Do not modify either source value to make it match the other.

Example — 2026-10-07:
- Farside: `-484.9 USDm`
- TFTC: `-487.1 USDm`
- Derived arithmetic mean: `-486.0 USDm`
- Method: `arithmetic_mean_2_sources`
- Status: `RESEARCH_DERIVED`; both raw source records remain available for audit.

## Field semantics

| Field | Contract |
|---|---|
| `period_start` / `period_end` | Provider's logical reporting/session date, represented as date-only. It is not a publication timestamp. |
| `observed_at` | Actual provider publication/observation timestamp only when the provider exposes it or a separately reviewed source-specific convention establishes it. Current public evidence does not establish this field; leave it `null`. |
| `retrieved_at` | When the capture runner received the HTTP response. Collection time only; never copy into `observed_at`. |
| `http_date` | HTTP response metadata from the serving/cache layer. Not proof the ETF row was published or finalized then. |
| `source_updated_at` / `provider_last_modified` / `etag` | Preserve when supplied. ETag identifies a response representation, not an ETF row revision. |
| `source_row_key` | Candidate logical key `provider-btc-etf-flow:YYYY-MM-DD`. It groups a session but is not a provider-assigned ID and cannot distinguish corrections. |
| `source_payload_sha256` | SHA-256 of the full captured response body. Identifies the reviewed capture, not an individual row version. |
| `provider_revision` / `revision` | Keep `null` until a defensible provider revision identifier or reviewed immutable-snapshot policy is approved. Do not mislabel a local counter as provider revision. |
| `finalization_status` | `unknown` until a defensible finality/correction policy is established. |
| Dashes / placeholder rows | All-fund-missing placeholder with displayed zero is `UNREPORTED_PLACEHOLDER`; normalized value is `null`, not numeric zero. |

## Revision, duplicates, and corrections

1. Do not overwrite historical raw source records when a later response changes a reporting date.
2. Same reporting-date key plus identical response hash is a repeat capture, not proof of a new row revision.
3. Same reporting-date key plus a different response hash signals a changed source snapshot. Retain both immutable capture artifacts and flag the change for reconciliation.
4. For the derived research value, recalculate the arithmetic mean from the currently selected reviewed captures and record the exact capture hashes used. Keep previous derived versions for reproducibility; never rewrite history without versioning.
5. The mean is computed only when both source values are numeric and pass structural checks. Missing, dash, placeholder, or structurally invalid values are not converted to zero and are not included as numeric observations.
6. Five distinct completed trading dates are a minimum history check, not proof of currentness or production source acceptance.

## Production acceptance gate — still blocked

Before accepting ETF observations for production persistence, a later reviewed change must establish:
- a valid source publication/observation-time convention independent of retrieval time;
- provider revision/finality semantics or an explicitly approved immutable-snapshot reconciliation policy;
- stable row identity and correction handling;
- rules for incomplete sessions, holidays, dashes and confirmed zeros;
- capture provenance for both source inputs and the exact mean method/version;
- five distinct completed sessions with provenance, plus a latest row within the registered 36-hour freshness budget.

The offline research mean does not remove these production acceptance requirements. Current captures still have unresolved `observed_at`, revision and finality; rows remain non-persistable until those requirements are reviewed and implemented.

## Public-source spot check — 2026-10-15

| Session date | Farside displayed total | TFTC displayed total | Research mean | Notes |
|---|---:|---:|---:|---|
| 2026-10-07 | -484.9 USDm | -487.1 USDm | **-486.0 USDm** | Two-source arithmetic mean |
| 2026-10-13 | +175.7 USDm | +175.6 USDm | +175.65 USDm | Full precision retained; presentation may round |
| 2026-10-14 | -261.4 USDm | -261.4622 USDm | -261.4311 USDm | TFTC raw precision retained |

TFTC methodology notes that recent daily aggregates may revise and that older days may be corrected automatically. This supports retaining source captures and versioning derived means; it does not make either source an unquestionable authority.

## Runtime gate alignment

The production readiness gate remains fail-closed until the publication-time and revision/finality requirements are satisfied. For latest and historical rows counted toward the five-session minimum, it requires complete fund reporting, a full-response SHA-256, a defensible observation timestamp, and explicit revision/finality acceptance. Retrieval time, HTTP Date, ETag, and date-derived keys do not satisfy those requirements.

**Safety:** this contract change defines an offline research derivation only. No live ingestion, database writes, historical-row edits, scenario evaluation, scenario-state/probability/monitoring changes, or deployment were performed.
