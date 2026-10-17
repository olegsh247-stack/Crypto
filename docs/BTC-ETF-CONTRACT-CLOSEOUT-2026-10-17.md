# BTC ETF contract closeout — 2026-10-17

**Status: repository-side contract stage CLOSED.** This closes the repeated source-search/design loop for Plan 100. It does not falsely certify the operational data gate or make BTC evaluable.

## Final decisions

1. **No more provider hunting in this stage.** Keep the already configured comparison pair: Farside (institutional.primary) and TFTC (institutional.tftc). Do not change canonical source priority in this closeout.
2. **SoSoValue is an API-verified cross-check only.** The authenticated summary-history endpoint returned HTTP 200 and 21 unique daily rows for 2026-09-18 through 2026-10-16. It is not a third independent vote: TFTC states that its current daily flow data uses SoSoValue lineage. Do not count it again in arithmetic_mean_2_sources.
3. **Research revision policy is settled.** Use the approved [project-stabilized research policy](BTC-ETF-PROJECT-STABILIZED-RESEARCH-POLICY-2026-10-16.md): two distinct captures at least 24 hours apart, both sources present, exactly one complete/reconciled row per source/date, unchanged row fingerprints, preserved values/provenance, and explicit human review. This is project stability, not provider-declared finality.
4. **Fail closed on missing evidence.** A missing/failed response, dash, placeholder, duplicate, incomplete fund row, changed row, or non-comparable source is not zero and cannot silently replace the prior snapshot.
5. **No raw-response archive without source-specific rights clearance.** TFTC's CC BY 4.0 attribution requirements are documented. Farside long-term raw-body retention permission and SoSoValue API retention/reuse rights are not established in the reviewed evidence. A public URL or working API key is not a rights grant.
6. **Durable archive is not yet operational.** The VPS does not exist in the project workflow; independent encrypted backup and real restore evidence have not been supplied. CI rehearsal of PostgreSQL backup/restore is not evidence that an ETF evidence archive is backed up. Do not fabricate controls attestations to make eligibility pass.
7. **No more full-history holdings search in this stage.** The available holdings calculation is already closed as partial: 162 rows for 5/13 tickers, 29 common dates; separate SEC quarterly control is 13/13 for 2026-06-30. These holdings are not daily net flows and must not be substituted for them.

## Implemented software gate

The repository already contains the offline snapshot builder/diff, row-level revision classification, immutable snapshot integrity checks, evidence archive writer/verifier, and evaluate-btc-etf-research-eligibility.mjs. Its tests cover the 24-hour window, failed/missing sources, incomplete rows, revisions, archive restore and source-rights blockers. The gate returns only ELIGIBLE_FOR_REVIEW, never automatic scenario approval, and keeps provider finality unclaimed.

## Exact end state

| Item | Final status |
|---|---|
| Source discovery for this stage | **CLOSED — no further provider search** |
| SoSoValue access/schema smoke test | **PASSED** (HTTP 200; 21 unique dates) |
| Farside/TFTC source lineage and discrepancy policy | **DOCUMENTED**; keep raw source values separate |
| Snapshot diff and eligibility evaluator | **IMPLEMENTED; CI-tested** |
| Real pair of qualifying captures ≥24h apart for a target date | **NOT YET EVIDENCED** |
| Source-specific durable retention rights for both required sources | **BLOCKED** |
| Private ETF archive + independent backup/restore | **NOT OPERATIONAL** |
| ETF date eligible for offline review | **NONE certified by this closeout** |
| Canonical registry/source-priority change | **NONE** |
| BTC scenario | **not_evaluable** until all required input gates pass |

## What is required to clear the remaining operational gate

These are evidence prerequisites, not a reason to restart source discovery: (a) a real second capture at least 24 hours after the first, after authorized handling; (b) documented Farside and TFTC storage/reuse basis for the exact retained artifacts; (c) actual private archive and independent-backup restore evidence; (d) row-level diff and human approval for the named date and snapshot IDs. If the Farside rights gate cannot be cleared, the existing source pair cannot be certified under this policy; a source-priority change would require a separate explicit decision, not an automatic fallback.

## Safety boundary

This closeout performed no live provider capture, API request, raw payload retention, production database write, ingestion, source-priority/registry change, scenario evaluation/state/probability change, deployment, or merge. Existing SoSoValue evidence refers to the previously completed check, not a new request in this closeout.
