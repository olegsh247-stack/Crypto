# BTC ETF research evidence archive and recovery contract

**Status:** design contract only; not deployed.  
**Last reviewed:** 2026-10-16  
**Purpose:** preserve the exact evidence required to reproduce a BTC ETF research input and prove whether a later capture revised it. This is separate from PostgreSQL backups.

## 1. Storage boundary

- Store source payloads and review evidence only in a private, project-controlled location. Do not commit raw provider payloads or credentials to this public repository.
- The planned VPS path is `/srv/crypto-evidence/btc-etf/`; it must not be created or treated as operational until the VPS is provisioned, access controls are tested, and backup/restore is rehearsed.
- GitHub Actions artifacts with seven-day retention are temporary transport only. They are not an archive and cannot alone satisfy the evidence-retention gate.
- No provider API keys, cookies, authorization headers, or secrets may be written to manifests, logs, hashes metadata, or snapshots.

## 2. Immutable snapshot layout

Each capture set receives a unique snapshot ID and a new directory; never overwrite a prior capture:

```text
/srv/crypto-evidence/btc-etf/
  <reporting-date>/
    <snapshot-id>/
      manifest.json
      source/
        farside.response.body
        tftc.response.body
        sosovalue.response.body       # optional, separately labelled candidate
      normalized/
        farside.rows.json
        tftc.rows.json
        sosovalue.candidates.json     # optional, never canonical by default
      comparison/
        row-diff.json
        review.txt
      checksums.sha256
      reviewer-decision.json          # created only after explicit review
```

Only files that were actually captured are present. A missing source is recorded as missing in the manifest; it is never represented by an empty body or zero value. SoSoValue is optional corroboration and must not be described as an independent vote when lineage overlaps with TFTC.

## 3. Required manifest fields

Every source entry must record:

- publisher/source ID and role (canonical source vs corroborating candidate);
- exact request URL and non-secret parameters; redact all credentials;
- HTTP status and retrieval timestamp in UTC;
- raw response-body SHA-256 and byte length;
- reporting date(s), source-reported metric name, units, and normalization version;
- provider observation timestamp, revision identifier, and finality state only when explicitly supplied; otherwise use `unknown`/null;
- source lineage and terms/licensing review status;
- parser/normalizer version and resulting normalized-row fingerprint;
- missing, duplicate, incomplete, or non-comparable row findings.

The manifest must distinguish **reporting date**, **retrieval time**, and **provider observation time**. Never infer one from another.

## 4. Integrity and revision rules

1. Create a new snapshot directory for every capture; do not mutate previous snapshots.
2. Calculate SHA-256 over the exact raw body bytes and all normalized artifacts. Record hashes in the manifest/checksum file.
3. Re-run the snapshot diff against the previous retained snapshot for the same reporting date.
4. Any changed, missing, duplicate, incomplete, or non-comparable row becomes a revision/blocker candidate; preserve both versions and the diff.
5. A later unchanged capture at least 24 hours after the earlier capture can qualify only for `ELIGIBLE_FOR_REVIEW`. It does not imply provider finality or grant approval automatically.
6. The explicit human reviewer records the snapshot IDs, reviewed metric and date, source lineage, discrepancy disposition, and decision timestamp. Do not alter source priority or production data through this review file.

## 5. Access, backups, and recovery

- Private directory permissions must prevent access by unrelated system users; secrets are never stored alongside evidence.
- Maintain at least one encrypted backup on an independent failure domain in addition to the primary evidence store. The backup must not be merely another directory or disk on the same VPS.
- Verify the copied checksum manifest after backup and periodically test restoration into a separate, non-production directory.
- Record backup time, destination class (not credentials or sensitive destination details), checksum verification result, restore-test date, and outcome.
- A backup is not considered verified until the bytes restore and their checksums match. Do not use a database backup as a substitute for source evidence.
- The actual VPS and independent backup destination are not yet provisioned/configured; no evidence archive is currently certified as durable.

## 6. Retention decision still required

Do not invent a retention period or automatically prune research evidence. Before enabling pruning, approve:
- minimum retention period;
- deletion eligibility (including whether any retained scenario, report, or revision still references the snapshot);
- legal/licensing restrictions for each provider's raw payload;
- archive owner and restore-check cadence.

Until these are decided and the archive plus independent backup/restore are operationally verified, ETF rows remain blocked from approval even if the two-capture stability check passes.

## 7. Safe implementation sequence

1. Keep the durable archive **not operational** until source-specific rights, private storage permissions, independent backup, and restore checks are satisfied; a VPS is not required to develop or test the offline writer.
2. Confirm source terms before retaining raw bodies. The writer must refuse raw-body retention unless every source with a body file has `source_rights[source_id].status = CLEARED` and a non-empty evidence reference in the supplied rights file.
3. The offline writer is implemented at `scripts/archive-btc-etf-evidence.mjs`. It consumes an existing local capture directory; it does not fetch providers, access credentials, connect to PostgreSQL, or evaluate a scenario. It requires an explicit reporting date and snapshot ID, validates manifest completeness and source-body SHA-256, writes a new snapshot directory, and refuses to overwrite an existing snapshot ID.
4. The writer emits the original manifest, source bodies, optional normalized candidates, an archive record and a SHA-256 checksum manifest. Rights evidence references and hashes are recorded; the supplied rights file itself is not copied into the archive.
5. Offline tests were added for successful fixture archiving, unresolved rights, missing body, body-hash mismatch, overwrite attempt, incomplete manifest, credential-like URL parameters, invalid dates and unsafe IDs. **CI result is pending until a run is observed and verified.**
6. After source rights are cleared, test the writer with approved artifacts in a private local directory. After the VPS exists, configure least-privilege storage and an independent encrypted backup, then test restore in an isolated location and compare checksums.
7. Only after the archive, backup/restore, source-rights and ETF review gates are satisfied may a human reviewer consider an ETF date for offline research. The writer's success alone does not prove backup/restore, provider finality, or scenario eligibility.

**Explicitly out of scope:** live ingestion, database writes, automatic source promotion, scenario evaluation/state/probability/monitoring changes, deployment, and PR merge.


## 8. Offline integrity verifier (2026-10-16)

The verifier is implemented at `scripts/verify-btc-etf-evidence-archive.mjs`. Run it against a snapshot directory with `node scripts/verify-btc-etf-evidence-archive.mjs --snapshot-dir <snapshot-directory>`. It checks the archive record, checksum manifest, SHA-256 hashes and byte lengths, required file metadata, path traversal, symlinks and unmanifested files. Its fixture tests cover an intact archive, modified or missing source bodies, and checksum path traversal. The verifier is wired into `BTC Public Source Staging (Read Only)`.

This verifies one local snapshot only. It does not create a backup or prove restoration from an independent failure domain. Real archive/backup verification remains blocked until source-specific raw-retention rights are cleared and private storage plus an independent encrypted backup are configured.


### CI finding and correction (2026-10-16)

The first verifier staging run failed because the tree walker treated `checksums.sha256` itself as an unmanifested file. This was corrected in commit `a51ae5b700c572fe076d8641b860f7022cee8d5a`: the checksum manifest is now allowed as the verifier's required control file, while arbitrary extra files remain rejected. Repeat staging run #38876188724 was still in progress at the time of this note. The verifier must not be considered validated until that run succeeds.


A subsequent staging run found that the writer creates an empty `normalized/` directory when no normalized candidate is archived. The verifier now allows the two expected archive directories (`source/`, `normalized/`) but still checks all contained files against the checksum manifest. Fix commit `9d8dd88a2e6e41965d05302e263a4fc3a46e396b`; revalidation is pending.


The verifier test suite now also rehearses copying a generated fixture snapshot to a separate restore directory and verifying the restored copy. This is a same-CI-runner fixture test only, not independent backup/restore. Staging result for this test is pending.


CI confirmation: [BTC Public Source Staging #38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752) passed the archive writer and verifier tests, including a fixture copy/restore rehearsal. Live capture was skipped. This does not certify an independent backup/restore.


### Source rights gate — refreshed 2026-10-16

The source review now records that TFTC explicitly publishes its ETF-flow dataset under CC BY 4.0 with attribution/link; SoSoValue website terms restrict automated/manual copying and redistribution absent authorization, while separate API-specific rights remain unverified; and Farside's official ETF-flow page does not establish clear long-term raw-response retention/redistribution permission. Do not archive raw SoSoValue or Farside responses until source-specific permission is documented. TFTC-derived artifacts may be considered with attribution and upstream lineage recorded. No live capture or API call was made.


## 9. Source-rights decision and approved storage boundary (reviewed 2026-10-20)

This is a project engineering assessment of the publicly available terms, not a legal opinion. Preserve the exact terms URL, review date, relevant clause/quote excerpt, and reviewer in the private rights evidence record. Recheck terms before changing the use case or publishing raw payloads.

| Source | Public terms/evidence found | Raw long-term archive decision | Attribution / use boundary |
|---|---|---|---|
| **TFTC / The Commoner Bitcoin ETF Tracker** | The ETF tracker explicitly says its figures may be quoted, charted and republished under **CC BY 4.0** and links an open JSON full series. The page identifies data lineage: SoSoValue for daily aggregates/ongoing per-fund flows and issuer disclosures tabulated by Farside for older history. | **CLEARED for retained ETF dataset and captured response for internal reproducibility, subject to preserving the terms evidence and respecting upstream rights/lineage.** This does not mean TFTC independently originated all underlying observations. | Attribute “The Commoner Bitcoin ETF Tracker by TFTC”, link to https://www.tftc.io/bitcoin-etf-flows and CC BY 4.0; record retrieval date and modifications/normalization. CC BY 4.0 permits reproduction/reuse, including commercial reuse, subject to attribution and other license conditions. Do not imply endorsement. |
| **Farside Investors** | Its official page describes the ETF flow table as updated in real time and its site shows “All rights reserved”. No clear explicit public grant permitting automated long-term raw-response retention, republication, or redistribution was located in the reviewed official pages. | **UNRESOLVED — do not retain raw response bodies in the durable archive until written permission or a clear applicable license is recorded.** Public visibility and the ability to read/cite a value are not treated as permission for bulk archival or redistribution. | Keep the source as the priority research/reference source, but until permission is established store no raw body. The rights gate must not be bypassed by a “CLEARED” label without a reviewable evidence reference. Contact the publisher for explicit permission covering automated retrieval, long-term internal retention, backups, normalization, and any user-facing republication. |
| **SoSoValue** | The reviewed website Terms of Use (last modified 2025-01-23) limit website content to personal, non-commercial use and prohibit reproducing, distributing, republishing, downloading/storing/transmitting content beyond stated exceptions; automated and manual monitoring/copying are also prohibited without prior written consent. A separate API exists, but the reviewed website terms do not establish a clear API-specific archival/reuse grant. | **UNRESOLVED — do not archive raw website/API payloads or automate capture for durable use until the applicable API agreement/terms and written storage/reuse permissions are verified.** An API key alone is not a data license. | Require written/API-specific confirmation of automated access, retention duration, backups, derived data, internal analysis, and external display/redistribution. Treat TFTC's explicit CC BY 4.0 publication as the currently usable archival route, while retaining the source lineage caveat. |

Evidence pages reviewed:
- TFTC data/license and lineage: https://www.tftc.io/bitcoin-etf-flows
- CC BY 4.0 legal code: https://creativecommons.org/licenses/by/4.0/legalcode
- Farside official ETF data page: https://farside.co.uk/
- SoSoValue Terms of Use: https://sosovalue.gitbook.io/helpdocument/resources/terms-of-use

**Operational rule:** a source-rights record must be source-specific and use-case-specific. CLEARED means the reviewed evidence expressly covers the proposed storage and use; it is not a generic claim that the website is public. For the current research archive, TFTC is the only source in this review with an explicit public reuse license. Farside remains the preferred research reference but its raw-response archive is blocked; SoSoValue raw-response archival is blocked pending API-specific clearance. Do not silently replace missing Farside rows with TFTC/SoSoValue values or call the TFTC copy independent confirmation.

## 10. Independent archive restore — implemented offline verifier, real infrastructure still pending

Independent recovery is a restore from a separate failure domain, not a second folder on the same VPS and not a temporary GitHub Actions artifact. Required sequence:

1. Write an immutable snapshot to the private primary evidence store. Never put raw payloads, rights files, credentials, or captured responses in this public repository.
2. Copy the approved snapshot to an encrypted backup destination outside the primary VPS/account/failure domain. Keep encryption and access credentials separate from the evidence directory.
3. Capture a restore receipt containing schema_version 1, backup_completed_at, restore_tested_at, destination_class, independent_failure_domain true, restore_result PASS, and evidence_ref. The evidence reference must point to independently reviewable backup-provider logs/audit records and the restore report; a self-written JSON assertion alone is not proof.
4. Restore the snapshot to a new isolated directory, not over the primary. Run the verifier against both copies. It checks each copy's full checksum manifest and requires identical snapshot ID, reporting date, file count and archive-record SHA-256. Any missing/changed file fails closed.
5. Run the independent-restore mode:
   node scripts/verify-btc-etf-evidence-archive.mjs --primary-dir <primary-snapshot> --restored-dir <restored-snapshot> --receipt <restore-receipt.json>
   A passing result proves local byte integrity and validates the required receipt fields. It cannot independently prove the backup provider/account/failure-domain claim; that requires checking the referenced provider evidence.
6. Record the report, receipt, timestamps, destination class and verification result in the private operations evidence. Repeat on a scheduled cadence and after backup configuration changes. Do not prune versions until retention policy and reference checks are approved.

The code path and regression tests for independent-restore comparison are now added to the PR branch. **No real independent backup has been created or restored:** there is no provisioned VPS/independent backup target yet, and source rights for raw Farside/SoSoValue responses remain unresolved. A same-runner fixture test is only a software test, not an operational restore certification. BTC therefore remains not_evaluable.
