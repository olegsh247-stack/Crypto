# BTC ETF snapshot revision and research eligibility — proposal — 2026-10-16

**Status:** proposal only; not approved or implemented as an eligibility policy.  
**Scope:** BTC ETF net-flow research input only. No production ingestion, database changes, scenario-state changes, or source-priority changes.

## Why a decision is still needed

Farside and TFTC do not provide sufficient evidence in the reviewed public material to establish a provider-declared finality point for each reporting date. TFTC also documents that recent and older rows can be corrected. A raw-response hash proves which bytes were captured; it does not prove that a provider will never revise them.

The PR branch now provides an offline snapshot builder/diff, a versioned JSON manifest, source hashes/coverage, canonical content integrity validation, and tests. Review found that earlier snapshots did not bind the exact capture/parser/normalizer/metric-registry artifacts; version 2 now records these file hashes in the snapshot identity. It does not choose durable storage, a project revision policy, or the point at which a row becomes eligible for an offline research scenario.

## Proposed immutable evidence model

1. Each explicitly initiated capture is a distinct snapshot. Preserve the original raw response files, `manifest.json`, `observation-candidates.json`, and exported snapshot manifest as one evidence set.
2. Never overwrite an earlier capture or normalized snapshot. A changed provider response creates a new snapshot.
3. Compare rows by exact source identity (source ID + URL) and reporting date. Keep the prior and current values and classify `UNCHANGED`, `NEW`, `VALUE_CHANGED`, `ROW_MISSING`, `INCOMPLETE`, or `NOT_COMPARABLE`.
4. Treat a changed row as a **revision candidate requiring review**, not an automatic supersession. A missing row or failed source is not a zero and must not delete earlier evidence.
5. Preserve per-source ID, URL, retrieval time, response SHA-256, status, parser/normalizer/metric-registry artifact hashes, reporting date, units, and the exact normalized row. The version-2 snapshot manifest binds capture-script, Farside-parser, candidate-normalizer, and metric-registry hashes into the snapshot identity.
6. The snapshot content hash detects unintentional or unaccompanied edits; it is not a digital signature and does not prove provider authenticity or finality.

## Research eligibility options

| Option | Rule | Benefit | Limitation |
|---|---|---|---|
| A. Provider-declared finality | Admit a reporting date only after an explicit provider publication/revision/finality signal is available | Strongest provider-backed semantics | Current evidence does not establish such a signal for both sources; ETF remains blocked |
| B. Project-stabilized research snapshot | Require a review-approved snapshot set and a defined stability window; label it project-stabilized, never provider-final | Makes historical offline research reproducible while acknowledging revisions | Requires an explicit stability-window and correction/re-run rule; still cannot claim provider finality |
| C. Research-only, no eligibility promotion | Preserve and compare snapshots, but do not feed ETF into a BTC scenario until option A or B is approved | Avoids silently changing scenario inputs | BTC scenario remains blocked by ETF input |

**Recommended next decision:** keep production ETF acceptance blocked. If the project needs an offline research scenario before provider finality is available, consider Option B as a separate *research-only* rule, with an explicit stability window and a mandatory rerun of affected historical scenarios when a later snapshot changes a row. Do not activate this recommendation automatically.

## Decisions required before implementing policy

- **Retention:** choose an approved archive location and retention/recovery target. The current GitHub Actions artifact is retained for 7 days and is not a durable archive.
- **Stability window:** if Option B is selected, choose the minimum interval and number of matching captures; neither is set by this proposal.
- **Revision handling:** confirm whether a changed row creates a project revision linked to the prior snapshot, and whether scenario evidence is recomputed for research only.
- **Scenario eligibility:** decide whether ETF research-derived means can be used as a clearly labeled research input under Option B, while remaining non-persistable and separate from canonical production observations.
- **Licensing/attribution:** confirm Farside reuse terms before committing to long-term automated archiving; preserve TFTC attribution where applicable.

## Current disposition

- The exported snapshot manifest and offline diff are code-level tools, not a storage or finality policy.
- Farside and TFTC source values remain separately preserved; `arithmetic_mean_2_sources` remains a research-derived value only.
- No canonical source priority, registry, production data, scenario state, score, probability, monitoring event, or deployment is changed.
- BTC remains `not_evaluable` until required source contracts and the scenario input gates pass.


## Decision update — project-stabilized research policy approved (2026-10-16)

The project has approved Option B for **offline research only**. The implementation is fail-closed and emits `ELIGIBLE_FOR_REVIEW`, never an automatic approval:

- Two valid, distinct snapshots at least 24 hours apart.
- Both configured sources (Farside and TFTC) captured successfully in both snapshots.
- Exactly one complete, reconciled row per source for the target reporting date.
- Each source's normalized row fingerprint is unchanged across both captures.
- Explicit human review remains required before using the named date/snapshot IDs in a research scenario.
- A later change creates a revision candidate; preserve earlier evidence and re-evaluate affected offline research. No provider-finality claim is made.
- If official sources are unavailable, non-official sources may be investigated as separately labelled corroboration. They cannot silently replace canonical sources; exact identity, metric semantics, coverage, terms and provenance require review before approval.

Policy: [BTC ETF project-stabilized research snapshots](BTC-ETF-PROJECT-STABILIZED-RESEARCH-POLICY-2026-10-16.md). Implementation: `scripts/evaluate-btc-etf-research-eligibility.mjs` with dedicated fail-closed tests wired into the read-only staging workflow.

The seven-day GitHub Actions artifact is still not a durable archive. If the evidence set cannot be retained in the project-controlled review record, the date remains blocked. This policy does not unblock production persistence or automatically make BTC evaluable.
