# BTC ETF archive retention and recovery decisions — 2026-10-16

**Status: proposal for review; none of the operational decisions below is approved or active.**  
**Scope:** resolve the outstanding governance decisions needed before any real BTC ETF evidence is treated as durably archived. This is not permission to capture provider data, provision a VPS, buy storage, or change production.

## 1. Decisions still required

| Decision | Proposed default for explicit review | Why it matters | Current status |
|---|---|---|---|
| Archive owner | A named project maintainer is accountable for access, retention, restore evidence, and review records. Keep the operational contact outside public raw-data manifests. | Someone must own the archive lifecycle and respond to restore failures. | Awaiting approval |
| Minimum retention | Retain a snapshot for at least 365 days after its last use by a retained research scenario/report/revision; retain longer while any retained artifact references it. | Supports reproducibility across research review cycles. | Awaiting approval |
| Deletion | No automatic pruning initially. A snapshot is eligible for deletion only after its minimum period has elapsed, no retained scenario/report/revision references it, and source-specific license/contract terms permit deletion or retention as applicable. Require a recorded human decision. | Prevents accidental loss of evidence needed to reproduce a prior result. | Awaiting approval |
| Primary storage | Private project-controlled storage on the future self-hosted VPS, with least-privilege access and encrypted transport; do not treat it as operational before provisioning and access tests. | Aligns with the project's self-hosted architecture. | Not provisioned |
| Independent backup | Encrypted backup in a separate failure domain from the VPS (not another directory or disk on the same host). Destination/provider and access method must be selected before implementation. | A host loss must not destroy both primary evidence and its backup. | Not selected or configured |
| Restore verification | Quarterly restore test, plus after storage/layout/schema changes or backup configuration changes; restore to an isolated non-production location and verify all checksums. | Confirms the backup contains usable bytes, not merely a successful copy job. | Awaiting approval |
| Rights evidence | Each provider/source has a dated evidence reference and explicit retention/reuse status before its raw body can be archived. Recheck terms at capture time. | Permission to view/use a source is not automatically permission to retain or redistribute raw responses. | Source-specific blockers remain |

## 2. Source-specific gate

- **TFTC:** currently the best-documented candidate for an attributed research copy under CC BY 4.0. Preserve required attribution and known upstream lineage. This does not make TFTC independent of SoSoValue for current daily flows or Farside-derived historical rows.
- **Farside:** do not retain raw response bodies until long-term retention/reuse permission is documented.
- **SoSoValue:** do not retain raw API response bodies until API-specific storage/reuse rights are documented; API access/key availability alone is insufficient.
- A rights-cleared source still must pass schema, date coverage, units, duplicate, freshness, revision/finality, and lineage review. Rights clearance alone does not qualify an input for the BTC scenario.

## 3. Required evidence before calling the archive durable

1. Record approval of owner, retention/deletion, backup destination class, and restore cadence.
2. Provision private storage only after the user separately authorizes the VPS/storage action.
3. Confirm permissions and encryption settings; never place API keys, cookies, or credentials in evidence files.
4. Archive only a real, explicitly authorized, rights-cleared capture using the existing offline writer.
5. Verify the snapshot with the offline verifier.
6. Copy it to the independent encrypted backup; verify the checksum manifest at the destination.
7. Restore into an isolated location from that backup and verify checksums; record timestamp, destination class, outcome, and reviewer.
8. Repeat the capture at least 24 hours later, without overwriting the first snapshot, only after the source/handling and storage gates are approved.
9. Run the existing offline snapshot diff only after two qualifying real snapshots exist. Human review remains required; unchanged data does not prove provider finality.

## 4. Explicit non-actions

This proposal does not approve or perform live HTTP capture, API access, storage provisioning, archive writes, PostgreSQL writes, ingestion, metric/source-registry changes, scenario evaluation, probability/score changes, monitoring changes, deployment, PR merge, or automatic deletion.

Until approvals and evidence above exist, do not compare snapshots or promote ETF data. BTC remains `not_evaluable`.

## Related contracts

- [BTC ETF evidence archive and recovery contract](BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md)
- [TFTC dataset archive contract](BTC-TFTC-ETF-DATASET-ARCHIVE-CONTRACT-2026-10-16.md)
- [Plan 100](PLAN-100.md)
- [ETF snapshot evidence recheck](PLAN-100-ETF-SNAPSHOT-EVIDENCE-RECHECK-2026-10-16.md)
