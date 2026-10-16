# Plan 100 — BTC ETF snapshot recheck — 2026-10-16

**Scope:** complete the four requested follow-ups in research-only mode. No live source capture, production database access/write, ingestion, scenario evaluation, deployment, or merge.

## 1. CI completion

The completed BTC Public Source Staging run [#38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) passed:
- Farside parser tests: 6/6;
- observation-candidate normalization: 16/16;
- offline snapshot diff: 16/16;
- ETF research-eligibility policy: 6/6.

The capture job was skipped. VPS API build/E2E rehearsal [#38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) passed. These results establish CI/test-environment success for that run, not live-source validity or durable retention.

Workflow safety was tightened in commit `bded4a270b526f9007480f5a7cc6670a0771a59a`: a manual dispatch must explicitly set `capture_sources=true` before live capture and artifact upload. Default manual dispatch is intended to run validation only. A new CI result for this safety-change commit remains to be confirmed.

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

The VPS and backup target are not provisioned; no durable archive is currently certified. GitHub Actions artifact retention is seven days only (the checked artifact expires 2026-10-22) and is temporary transport, not an archive. Do not put raw provider payloads or secrets in the public repository. Retention/deletion policy and source-specific rights to store/reuse raw payloads remain unresolved.

## 4. BTC ETF acceptance gate

ETF rows remain blocked until source-specific publication/revision/finality semantics or an explicitly approved project-stabilized research-only policy are defined, durable evidence retention is operational, and storage/reuse rights are cleared. Preserve Farside and TFTC raw values separately. `arithmetic_mean_2_sources` remains a project-derived research comparison and must not be represented as either provider's reported value or independent-source consensus; current TFTC lineage overlaps with SoSoValue.

**Disposition:** BTC remains `not_evaluable`. No production inputs, scenario state, score, probability, or monitoring state changed.
