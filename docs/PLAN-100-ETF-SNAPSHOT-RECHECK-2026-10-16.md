# Plan 100 — BTC ETF snapshot recheck — 2026-10-16

**Scope:** complete the four requested follow-ups in research-only mode. No live source capture, production database access/write, ingestion, scenario evaluation, deployment, or merge.

## 1. CI completion

The completed BTC Public Source Staging run [#38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) passed:
- Farside parser tests: 6/6;
- observation-candidate normalization: 16/16;
- offline snapshot diff: 16/16;
- ETF research-eligibility policy: 6/6.

The capture job was skipped. VPS API build/E2E rehearsal [#38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) passed. These results establish CI/test-environment success for that run, not live-source validity or durable retention.

Workflow safety was tightened in commit `bded4a270b526f9007480f5a7cc6670a0771a59a`: a manual dispatch must explicitly set `capture_sources=true` before live capture and artifact upload. Default manual dispatch runs validation only. Confirmed after the change: [BTC Public Source Staging #38857256853](https://github.com/olegsh247-stack/Crypto/actions/runs/38857256853) — success; all five validation groups passed and capture was skipped. [VPS API Build Rehearsal #38857256836](https://github.com/olegsh247-stack/Crypto/actions/runs/38857256836) — success.

## 2. Snapshot reproducibility

The offline suite's 16/16 passing tests cover:
- same provider payload hashes with different retrieval times -> no-op;
- input row-order independence;
- changed numeric row detection while retaining prior evidence;
- new, missing, incomplete, and non-comparable rows;
- no zero imputation for placeholders or absent source coverage;
- duplicate source/date rejection;
- invalid dates and tampered exported manifests;
- snapshot export and offline comparison of saved manifests.

**Conclusion:** deterministic comparison is verified against fixtures. Repeated real-provider captures and persistent archive restoration are not verified.

## 3. Durable archive and recovery

The detailed design remains in [BTC ETF evidence archive and recovery contract](BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md). Intended private VPS path after provisioning: `/srv/crypto-evidence/btc-etf/<reporting-date>/<snapshot-id>/`. Each capture must be immutable, carry raw-body and normalized-output SHA-256 hashes, manifest/provenance and row diff, and have an independent encrypted backup with checksum verification and restore rehearsal.

The VPS and backup target are not provisioned; no durable archive is currently certified. GitHub Actions artifact retention is seven days only (the checked artifact expires 2026-10-22) and is temporary transport, not an archive. Do not put raw provider payloads or secrets in the public repository. Retention/deletion policy remains unresolved. Source-rights review found that TFTC explicitly licenses its published open JSON series under CC BY 4.0 with attribution; Farside page/table rights for long-term raw-response retention are not clear from the reviewed page; SoSoValue API-specific storage/reuse terms are not established by the public API docs. See [alternative-source review](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md). No raw provider payload was captured or published.

## 4. BTC ETF acceptance gate

ETF rows remain blocked until source-specific publication/revision/finality semantics or the approved project-stabilized research-only policy are satisfied, durable evidence retention is operational, and source-specific storage/reuse rights are cleared for the actual retained artifacts. TFTC's CC BY 4.0 dataset is a permitted candidate with attribution, but its upstream lineage overlaps and it does not resolve Farside/SoSoValue raw-payload rights.

**Code enforcement added:** `scripts/evaluate-btc-etf-research-eligibility.mjs` now fails closed unless the caller explicitly supplies `archive_restore_verified: true` plus a non-empty `archive_restore_evidence_ref`, and a `CLEARED` rights status plus non-empty evidence reference for each configured source. It also rejects impossible calendar dates (not just malformed date strings). New tests cover the archive block, unresolved rights block, and invalid dates. This is a policy-code gate, not a claim that the current VPS archive or Farside rights are cleared; therefore the real project state remains blocked. Preserve Farside and TFTC raw values separately. `arithmetic_mean_2_sources` remains a project-derived research comparison and must not be represented as either provider's reported value or independent-source consensus; current TFTC lineage overlaps with SoSoValue.

**Disposition:** BTC remains `not_evaluable`. No production inputs, scenario state, score, probability, or monitoring state changed.


## 5. Offline eligibility report CLI — staging verified; VPS rehearsal pending

The policy evaluator now has a CLI for two exported, integrity-validated snapshot manifests:
`node scripts/evaluate-btc-etf-research-eligibility.mjs --previous <snapshot.json> --current <snapshot.json> --reporting-date YYYY-MM-DD [--controls <review-controls.json>] --out <report.json>`

The report records both snapshot IDs, SHA-256 of the exact input manifest bytes, and (when supplied) the review-controls file SHA-256. Without controls, it fails closed at `BLOCKED_DURABLE_ARCHIVE`; a complete and stable pair is not enough on its own. Even `ELIGIBLE_FOR_REVIEW` remains a review candidate and never evaluates/persists the BTC scenario.

**Important limitation:** the controls JSON is a human-supplied assertion record, not self-verifying proof that a backup restore or data rights clearance actually occurred. Each evidence reference must point to independently reviewable evidence; reviewers must not mark archive restore or rights `CLEARED` without that evidence. The evaluator returns the references in the report so the reviewed claims remain visible alongside the controls-file hash. The CLI is offline-only and reads files supplied by the operator; it does not fetch providers, access PostgreSQL, ingest observations, or alter scenario state.

An integration test exercises the CLI with fixture manifests, confirms fail-closed behavior when controls are omitted, and verifies report hashes. Confirmed: [BTC Public Source Staging #38867336990](https://github.com/olegsh247-stack/Crypto/actions/runs/38867336990) passed all validation steps for code commit `f1f2aa70fcbbaaf4f835cef6dcc96a80c9e161a1`; capture was skipped. An earlier staging attempt exposed a newline-escaping defect in CLI output; that defect was corrected before the passing run. The VPS Build & E2E rehearsal for the current code is still running and must be checked before this verification item is complete. No live capture was run.
