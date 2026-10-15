# BTC ETF immutable snapshot policy — implementation gap review — 2026-10-16

**Purpose:** establish whether the current read-only staging workflow already satisfies the immutable project-snapshot path discussed in the ETF source lifecycle review.
**Mode:** static repository inspection only. No workflow dispatch, source capture, database access, ingestion or production changes.
**Decision:** the current workflow preserves evidence for review, but does **not yet implement a durable project-owned snapshot/revision policy**. Do not treat the snapshot path as approved or complete.

## What already exists

1. `.github/workflows/btc-public-source-staging.yml` runs parser/candidate tests on relevant pushes. Live capture and artifact creation require manual `workflow_dispatch`.
2. A capture writes raw response bodies, `manifest.json`, and normalized review-only candidates under `tmp/btc-source-review/`.
3. The manifest records source IDs, URLs, retrieval times, HTTP status/metadata and full-response SHA-256 hashes. The ETF candidate retains the reporting date as its logical key and explicitly leaves `observed_at`, provider revision and finalization unknown.
4. The normalized output labels ETF rows `REVIEW_ONLY_BLOCKED`; the Farside/TFTC mean is `RESEARCH_DERIVED`, `OFFLINE_RESEARCH_ONLY`, and `persistable: false`.
5. The workflow uploads the capture folder as a GitHub Actions artifact with `retention-days: 7`. This is temporary review evidence, not a durable historical archive.

## Gaps against an immutable snapshot policy

| Requirement | Current evidence | Gap |
|---|---|---|
| Stable snapshot identity | Full-response SHA-256 and workflow artifact exist | No explicit snapshot ID tying source responses, parser version, candidate output and workflow run together as a versioned research input set |
| Immutable raw evidence | Raw response files and hashes are emitted in one artifact | Artifact is retained for 7 days only; durable long-term retention is not established |
| Deterministic row-level revision diff | Cross-source comparisons compare Farside and TFTC for matching dates in one capture | No persisted comparison of a new capture against the prior snapshot to classify unchanged rows, changed values, new rows, missing rows and unresolved rows |
| Project revision semantics | ETF candidate uses a date logical key; provider revision is unknown | No project-owned revision number / supersession link for changed representations of the same reporting date |
| Eligibility/finality rule | Candidate remains blocked and finalization unknown | No approved rule defining when a reporting date may be used in offline scenario evaluation and how a later correction invalidates/replaces that research input set |
| Long-term provenance | Current run artifact can be inspected while retained | No verified archive/retention and retrieval procedure for old source payloads |
| Source licensing/attribution | TFTC page states CC BY 4.0; Farside reuse permission remains unverified in the current review | Must preserve attribution and resolve Farside terms before relying on an automated archived series |

## Required design before implementation

A proposed project-owned snapshot policy should specify:

- a deterministic `snapshot_id` derived from the exact manifest/artifact set, capture time, source IDs/URLs, parser version and candidate-normalizer version;
- immutable retention of raw response bytes, manifest, normalized candidate output and hashes for each explicitly initiated capture;
- deterministic row-level diff keyed by source identity + reporting date, with statuses such as `UNCHANGED`, `NEW`, `VALUE_CHANGED`, `ROW_MISSING`, `INCOMPLETE`, and `NOT_COMPARABLE`;
- a project revision/supersession relation for a changed representation of the same date, without overwriting the earlier evidence;
- a clear eligibility rule for offline research/evaluation that does not falsely claim provider-declared finality;
- an approved retention location and recovery procedure, plus source-specific attribution/licensing handling;
- tests for repeatability, same-payload no-op, changed-row detection, missing rows, placeholder/dash handling, source disagreement, and preserving the earlier snapshot.

These are design requirements, not completed implementation. Storage destination, retention period and the point at which a captured date becomes eligible are still open policy decisions. No live workflow was dispatched for this review.

## Result for Plan 100

- Current capture pipeline is suitable for temporary, manually initiated review evidence; it is not sufficient to claim durable immutable snapshots or historical revision reconciliation.
- Keep ETF production acceptance blocked and BTC `not_evaluable`.
- Do not implement a storage/archive target or change retention silently. First review the proposed policy and required operational boundaries; then implement the deterministic offline diff and tests without production writes.

## Follow-up — offline diff and manifest implementation on PR branch (2026-10-16)

Since this static review, the PR branch has added `scripts/diff-btc-etf-snapshots.mjs` and focused tests. It can classify row changes offline and export a portable versioned JSON snapshot manifest with source coverage and SHA-256 evidence; comparison can consume a prior exported manifest or an existing capture directory. This closes the code-level gap for deterministic row diff and explicit snapshot identity in the review workflow, subject to the latest CI result.

**Still not solved:** the GitHub Actions artifact remains a temporary 7-day delivery mechanism unless the user explicitly chooses another storage/retention policy. No durable archive, restore guarantee, project revision/supersession policy, production eligibility/finality rule, or Farside reuse approval is implied. No live capture was dispatched. ETF production acceptance remains blocked; BTC remains `not_evaluable`.

See also [BTC ETF snapshot revision and research eligibility proposal](BTC-ETF-SNAPSHOT-REVISION-ELIGIBILITY-PROPOSAL-2026-10-16.md) for the separate policy decisions that remain after the offline tooling is implemented. The proposal does not authorize a storage destination, retention change, scenario eligibility rule, or production ingestion.
