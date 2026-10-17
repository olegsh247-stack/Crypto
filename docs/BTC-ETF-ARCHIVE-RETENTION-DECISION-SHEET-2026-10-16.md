# BTC ETF evidence archive — retention and recovery decision sheet

**Date:** 2026-10-16  
**Status:** decision proposal; not approved operational policy  
**Related contract:** [BTC ETF evidence archive and recovery contract](BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md)

## 1. Current verified state

- The archive writer and verifier have passed fixture-based CI tests.
- The fixture restore is within the same CI runner; it is not an independent backup/restore.
- GitHub Actions artifacts have seven-day retention and are temporary transport, not a durable archive.
- No VPS evidence archive is operational. No independent backup destination is provisioned or verified.
- TFTC has a documented CC BY 4.0 attribution path for its own dataset. This does not clear raw SoSoValue or Farside payload retention.
- The user's SSD is not connected; no step here assumes it is available.

## 2. Decisions required before durable capture

| Decision | Current status | Safe interim rule |
|---|---|---|
| Named archive owner and operational backup owner | **Not assigned in the contract** | Do not claim operational ownership or durable status |
| Minimum retention period | **Not approved** | Do not prune; preserve existing approved evidence and record this as a temporary hold, not a final retention period |
| When deletion is allowed | **Not approved** | No automated deletion; any future deletion must check scenario/report/revision references and source terms |
| Restore-check cadence | **Not approved** | No archive can be certified until a restore is tested; cadence must be explicitly decided before operational acceptance |
| Independent failure domain and encryption/key custody | **Not provisioned/verified** | Do not count a second directory, same VPS disk, or CI artifact as independent backup |
| Raw-payload rights per source | **Mixed/unresolved** | TFTC only under its documented attribution conditions; raw SoSoValue/Farside excluded until separately cleared |

## 3. Proposed operational controls — pending approval

These are proposals, not accepted decisions:

1. Assign a named human owner for archive integrity and a named backup/recovery owner before first durable capture.
2. Use immutable, date-scoped snapshots; never overwrite a prior snapshot.
3. Keep automatic pruning disabled until a minimum retention period and reference-aware deletion rule are approved.
4. Require checksum verification immediately after backup and after every restore.
5. Require a successful restore from a separately administered/encrypted failure domain before any snapshot can support source acceptance.
6. Set a recurring restore test cadence and record owner, date, scope, checksum result, and outcome. The cadence itself remains a decision, not an assumed value.
7. Review rights separately for every publisher and artifact type. A license for TFTC-derived data does not authorize storing raw upstream payloads.

## 4. Acceptance checklist

A durable archive is **not ready** until all are true:

- [ ] Named archive owner and recovery owner recorded.
- [ ] Minimum retention and deletion/reference policy explicitly approved.
- [ ] Source-specific retention rights recorded for every raw body to be retained.
- [ ] Private storage permissions and encryption/key custody verified.
- [ ] Independent backup destination exists outside the primary failure domain.
- [ ] Backup checksum verification passes.
- [ ] Restore test from that independent destination passes and hashes match.
- [ ] Restore-check cadence and incident/recovery record location approved.
- [ ] A human review explicitly accepts the snapshot for offline research.

## 5. Boundaries

This sheet does not authorize live capture, ingestion, database writes, source registry changes, source promotion, scenario evaluation/state/probability changes, deployment, or PR merge. It does not set a retention duration or pretend that the archive is operational.

**Current disposition:** design work may continue; real archive durability remains unproven; BTC remains `not_evaluable`.
