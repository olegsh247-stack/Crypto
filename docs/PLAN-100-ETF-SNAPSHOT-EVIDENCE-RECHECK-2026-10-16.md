# BTC ETF snapshot evidence recheck — 2026-10-16

**Mode:** read-only GitHub metadata inspection. No live provider capture, archive write, database access/write, ingestion, scenario evaluation, deployment, or merge.

## 1. CI and artifact inspection

Latest repository HEAD inspected: `edd08725e7f94a8666d671b9c375943066f70153`.

- VPS API Build Rehearsal [#38911983399](https://github.com/olegsh247-stack/Crypto/actions/runs/38911983399) completed successfully on that exact SHA. The build/E2E job passed, including PostgreSQL backup/restore rehearsal and BTC research evidence/snapshot-lineage E2E. These are CI-local rehearsal results, not proof of independent source-archive recovery.
- BTC Public Source Staging [#38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752) completed validation successfully. Its `capture` job was skipped.
- The same is true of reviewed staging runs [#38876268169](https://github.com/olegsh247-stack/Crypto/actions/runs/38876268169), [#38867336990](https://github.com/olegsh247-stack/Crypto/actions/runs/38867336990), [#38857256853](https://github.com/olegsh247-stack/Crypto/actions/runs/38857256853), and [#38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856): validation ran, capture was skipped.
- GitHub Actions artifact listings for these reviewed runs returned no artifacts. Therefore no retained artifact in these runs can currently be used as the missing second real snapshot.

## 2. Existing repository dataset

`docs/data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json` is a staging review candidate, not a pair of immutable raw-response snapshots. It records five completed Farside sessions for 2026-10-05 through 2026-10-09, with `observed_at: null`, date-only retrieval precision, and `HOLD_NOT_READY_FOR_INGESTION`. Its summed candidate value is not evidence of provider finality or a second independent capture. The 2026-10-12 placeholder row is explicitly excluded rather than interpreted as zero.

## 3. Rights and durable-recovery gate

- TFTC's published dataset has a documented CC BY 4.0 attribution path, but its current flow lineage overlaps SoSoValue and historical data overlaps Farside.
- Farside raw-response long-term retention rights remain unresolved in the reviewed evidence.
- SoSoValue API-specific storage/reuse rights remain unresolved; API access and data-retention permission are separate questions.
- The archive contract and retention decision sheet state that the VPS archive and independent backup target are not provisioned/verified; owner, retention period, deletion policy, and restore-check cadence are not approved.
- Same-runner fixture copy/restore tests prove local test behavior only, not independent failure-domain recovery.

## 4. Decision and next action

**Decision: do not compare snapshots and do not evaluate the ETF input for the BTC scenario yet.** No pair of two distinct real snapshots with reviewable provenance, source-specific rights, and independent restore evidence was found in the inspected repository metadata and run artifacts.

Continue with the lowest-risk next step: prepare a rights-cleared TFTC-only capture path as a separately labelled research candidate, without fetching/capturing data until its handling is explicitly approved; in parallel, resolve the archive owner/retention decisions and design the private primary + independent backup setup for the future VPS. Do not represent TFTC as an independent vote against SoSoValue/Farside. Once a lawful real capture is approved and durable storage/restore is operational, take two immutable captures at least 24 hours apart and run the existing offline diff/eligibility checks.

No production data, source priority, scenario state, score, probability, or monitoring state changed. BTC remains `not_evaluable`.
