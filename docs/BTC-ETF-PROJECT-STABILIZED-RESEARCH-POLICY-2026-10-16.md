# BTC ETF project-stabilized research snapshots — policy v1 — 2026-10-16

**Status:** approved for offline research workflow only by project decision on 2026-10-16.  
**Scope:** BTC ETF net-flow rows used as research inputs. This policy does not claim provider-declared finality and does not authorize production persistence, automated ingestion, or changes to canonical source priority.

## Eligibility rule

A reporting date may be proposed for offline BTC research only when **all** checks below pass:

1. Two independently initiated source captures exist, with valid versioned snapshot manifests and preserved raw source payloads, candidate output, manifests, and SHA-256 hashes.
2. Capture times are valid UTC timestamps and the second capture is at least **24 hours** after the first. The same snapshot cannot be used twice.
3. Both configured sources are captured in both snapshots: Farside (`institutional.primary`) and TFTC (`institutional.tftc`). A failed, missing, or truncated source is not a zero and fails closed.
4. For the target reporting date, each source has exactly one complete row in both snapshots. Farside must have all funds reported and its calculated fund sum must reconcile to the displayed total under the existing `MATCHES_DISPLAY_ROUNDING` contract. Nulls, placeholders, duplicates, missing rows, and incomplete rows fail closed.
5. Each source's normalized row fingerprint for the target date is identical across the two captures. A value change, missing row, changed completeness/reconciliation state, or non-comparable source makes that date ineligible until reviewed and a new stable pair is captured.
6. A reviewer explicitly approves the generated eligibility report for the named date and snapshot IDs. The tool can report only `ELIGIBLE_FOR_REVIEW`; it never self-approves a scenario input.
7. Preserve both source values and provenance. If the agreed research metric uses `arithmetic_mean_2_sources`, calculate the mean from the two retained source values at full precision; label it research-derived, never provider-reported. Keep units as USD million per reporting day.
8. If a later capture changes either source row, mark the earlier eligibility as superseded for new research runs. Preserve the earlier evidence and link the new revision to it. Re-run any affected offline scenario and record which snapshot IDs were used. Do not silently rewrite prior evidence or claim the provider itself declared a revision/finality.
9. Do not treat the 24-hour project stability window as provider finality. State explicitly that the rule is project-stabilized, not provider-final.

## Evidence retention and fallback sources

- A GitHub Actions artifact with seven-day retention is temporary transport, **not** the durable evidence archive. Until a durable project-owned archive and restore procedure are approved, each capture evidence set and exported snapshot manifest must be retained in the project-controlled review record before it can be considered for approval. If that cannot be demonstrated, the date remains blocked.
- Official sources are preferred. If an official source is unavailable, inaccessible, incomplete, or lacks the required fields, non-official sources may be investigated as **separate, explicitly labelled corroborating evidence**. Record publisher, exact URL, capture time, licensing/terms where known, metric definition, units, and lineage. Never silently substitute a non-official source for Farside/TFTC, merge unlike metrics, or promote a fallback into canonical priority. A fallback can satisfy the source gate only after its identity, semantics, completeness, reuse terms, and role are explicitly reviewed and approved; otherwise the date remains blocked.
- A retrieval failure is not a zero. Do not bypass licensing or access controls.

## Fail-closed outcomes

| Condition | Outcome |
|---|---|
| One capture only or less than 24 hours between captures | `BLOCKED_STABILITY_WINDOW` |
| Source failed, missing, truncated, or not comparable | `BLOCKED_SOURCE_COVERAGE` |
| Row absent, duplicate, placeholder, or incomplete | `BLOCKED_INCOMPLETE_ROW` |
| Row fingerprint changed between captures | `BLOCKED_REVISION_CANDIDATE` |
| All checks pass | `ELIGIBLE_FOR_REVIEW` — still requires explicit reviewer approval |

## Boundaries

This policy is for reproducible, offline research only. It does not set `observed_at` to the reporting date, infer provider finality from HTTP headers or hashes, write database observations, run ingestion, change the scenario state, alter scores/probabilities/monitoring, deploy, or merge PR #83. BTC remains `not_evaluable` until all required scenario gates are independently satisfied.


## Offline report command

After two exported, integrity-valid snapshot manifests exist, run:

```sh
node scripts/evaluate-btc-etf-research-eligibility.mjs \
  --previous previous-snapshot.json \
  --current current-snapshot.json \
  --reporting-date YYYY-MM-DD \
  --out eligibility-report.json
```

Omitting `--controls` intentionally returns a blocked result. A reviewed controls JSON may be supplied with `--controls review-controls.json`, containing `archive_restore_verified: true` and a per-source `source_rights` record with `status: "CLEARED"` and a non-empty `evidence_ref`. The report hashes that exact controls file and both snapshot manifests for reproducibility. These fields are attestations, not cryptographic proof that a restore was performed or rights were granted: each reference must resolve to independent evidence, and no source may be marked cleared on assumption alone.

The command never downloads sources, accesses the database, runs the scenario, or writes production state. `ELIGIBLE_FOR_REVIEW` means only that a candidate can be sent for explicit human review; it is not an automatic approval or production acceptance.
