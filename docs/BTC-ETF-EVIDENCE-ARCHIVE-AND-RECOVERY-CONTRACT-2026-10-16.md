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
