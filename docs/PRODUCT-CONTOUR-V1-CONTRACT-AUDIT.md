# Product Contour v1 — API/UI Contract Audit

**Status:** Static repository audit  
**Date:** 2026-10-09  
**Scope:** Read-only comparison of the current Web types/components, API handler and documented Dynamic Asset Engine contracts.  
**Not performed:** Live API calls, PostgreSQL database queries, build/runtime tests, database migrations, visual changes.

## Executive summary

The main product route and the major data sections already exist. The Asset Dashboard calls the Dynamic Asset Engine and the Deep Research route uses the canonical 15-block structure. The primary risk is not missing pages; it is consistency between the latest published research snapshot, current API collections and client-derived status/progress.

No production data or schema was changed during this audit.

## Findings

### P1 — Research progress can disagree between API and Web

**Evidence**
- `vps/api/src/research-status.ts` calculates `resolved` as complete + N/A blocks and uses `resolved / 15` for its percentage.
- `shared/research-status-contract.ts` defines `isResolvedBlock` as complete or N/A.
- `web/lib/research-status.ts` calculates progress with `isCompletedBlock` only, and derives the percentage from completed blocks / 15.
- The Asset Dashboard and Deep Research use this Web-side calculation rather than the server's `research_progress` payload.

**Impact**
A block correctly marked N/A is resolved for the lifecycle engine but does not contribute to the UI's progress percentage. Dashboard, Deep Research and server lifecycle can show different progress for the same asset.

**Recommended correction**
Use one shared definition of progress. Prefer exposing both `completed` and `resolved` counts clearly: “completed” counts complete blocks; “progress/resolved” counts complete + N/A blocks. Do not silently change the meaning of the existing label.

### P1 — Asset-scoped factor and score queries are not limited to the latest published snapshot

**Evidence**
- In `vps/api/src/index.ts`, critical factors are selected by `asset_id` and ordered by priority/name, without restricting them to the latest published snapshot.
- Scores are selected by `asset_id` and ordered by calculation time/type, without restricting them to the latest published snapshot.
- The v2 model defines factors and scores as snapshot-related analytical records, and the dashboard is intended to present the current research baseline.

**Impact**
If an asset has multiple research snapshots, old and new factors/scores can be mixed. The Dashboard may show duplicates or stale assessments as if they all belonged to the current thesis.

**Recommended correction**
Confirm the intended legacy/v1 data semantics, then scope snapshot-bound records to the latest published snapshot. If historical comparisons are required, expose history explicitly instead of mixing it into the current view.

### P1 — Current scenario state can be joined to a different research baseline

**Evidence**
- The API returns research scenarios for the latest published snapshot.
- It separately returns the latest 20 scenario states for the asset, ordered by `observed_at`.
- The Dashboard selects the newest scenario state and merges it with a scenario definition matched by `scenario_id`, without first proving that both belong to the same snapshot.

**Impact**
A recent state can refer to an older scenario definition while the UI merges it with the current published scenario. This can make the current scenario view internally inconsistent.

**Recommended correction**
Define the canonical relationship between `scenario_states` and `research_scenarios`. Join by a stable scenario identifier and verify snapshot lineage. Until reconciliation is complete, avoid merging incompatible generations and show the state/definition separately when their lineage cannot be proven.

### P2 — Evidence-linked sources can be omitted from the source registry payload

**Evidence**
- The API's top-level `sources` collection is selected by joining `sources` to `observations`.
- The `evidence` query independently joins each evidence row to `sources` using `evidence.source_id`.
- The Web response type supports source metadata on evidence, including `source_url`.

**Impact**
A source referenced directly by evidence but not by any observation may appear on the evidence row but be absent from the top-level source list. UI sections that rely only on `data.sources` can under-report the provenance registry.

**Recommended correction**
Build the top-level source collection from both observation-linked and evidence-linked sources, deduplicated by `source_id`, or explicitly define the top-level list as observation sources only and label it accordingly.

### P2 — Web and server freshness shapes need a single documented contract

**Evidence**
- `web/lib/api.ts` describes freshness as `current | update_recommended | outdated`.
- The API handler builds a freshness payload with status, reason and additional timestamps.
- The list API and detail API use different shapes/aliases for research status and freshness metadata.

**Impact**
Optional timestamps/reasons can be silently dropped by narrower types, and list/detail screens may not display identical context.

**Recommended correction**
Define a shared TypeScript response type for list and detail freshness fields. Keep server-derived status authoritative and preserve optional timestamps in the type.

### P2 — API source completeness differs from the documented Engine payload

**Evidence**
The Dynamic Asset Engine document says the detail payload contains metrics/history, snapshot, blocks, domains, factors, scores, signals, scenario states, events, sources and evidence. The handler returns these categories, but completeness depends on published snapshot presence and the joins described above.

**Impact**
A field can exist structurally while carrying incomplete or cross-snapshot data. Type-level presence is not proof of data completeness.

**Recommended correction**
Add a read-only data contract check for representative assets (BTC, ETH, SOL, CAKE) that records row counts, snapshot IDs, null rates and lineage for each section.

## Contract map

| Product section | Current implementation | Static audit result |
|---|---|---|
| Home | `web/app/page.tsx` | Exists; combines product overview and Assets entry list |
| Assets | Home section `#assets`; canonical detail route under `/assets/{assetId}` | Dynamic list; separate `/assets` route does not exist |
| Asset Dashboard | `web/app/assets/[assetId]/page.tsx` | Exists; consumes the Engine payload |
| Deep Research | `web/app/research/page.tsx` and `/assets/{assetId}/research` | Exists; canonical 15-block structure |
| Domains | Engine response and Dashboard section | Data-driven, needs snapshot/payload completeness verification |
| Factors | Engine response and Dashboard/Deep Research sections | Snapshot scoping concern |
| Scores | Engine response and Dashboard | Snapshot scoping concern |
| Scenarios | `research_scenarios` + `scenario_states` | Lineage reconciliation required |
| Monitoring | Signals and monitoring events | Categories exist; live completeness not verified |
| Evidence | Evidence rows plus source/observation joins | Evidence-linked source completeness concern |

## Verification required before implementation

1. Read the current migrations/schema definitions for factor, score, scenario and evidence foreign keys.
2. Confirm whether v1 factor/score rows are snapshot-scoped or intended as asset-current records.
3. Check the actual live payload for BTC, ETH, SOL and CAKE without mutating data.
4. Reconcile `scenario_states` with `research_scenarios` and record the chosen compatibility rule.
5. Implement fixes as one coherent patch, then run local/static checks. Do not run the Release Gate while the GitHub Actions billing blocker remains unresolved; the workflow applies migrations to live PostgreSQL database before its clean-database rehearsal.

## Change control

This audit is documentation-only. It does not authorize:
- PostgreSQL database schema migrations;
- changes to billing or GitHub Actions settings;
- changes to visual design;
- production deployment.


## Follow-up implementation — 2026-10-10

### Completed: research progress semantics

The P1 progress mismatch identified above has been corrected in the Web layer:

- `web/lib/research-status.ts` now calculates both `completed` (blocks with status `complete`) and `resolved` (blocks with status `complete` or `n_a`).
- The percentage now uses `resolved / 15`, matching the server lifecycle contract.
- Asset Dashboard and Deep Research explicitly distinguish completed blocks from resolved blocks, so N/A blocks count toward resolution without being mislabeled as completed.

This change does not alter the canonical 15-block structure, database schema, research content, or lifecycle rules.

### Verification update — 2026-10-13

The Web/API `research_progress` declaration mismatch is corrected on current `main` in commit [`ee9614a`](https://github.com/olegsh247-stack/Crypto/commit/ee9614ab0f68ebde80fb9198f9c3b190fe63d5a7). The Web build passed in [Build Crypto Web #137](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894055), and the VPS target-stack rehearsal passed in [#468](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894021). This verifies the current Web build and target-stack CI, not the live public endpoint.

The following areas remain open for the full contour audit: metric-level freshness parity; read-only validation of the live payload when an approved endpoint is available; confirmation that displayed current data are fresh and source-traceable; and final end-to-end BTC UI/API acceptance. Snapshot scoping, scenario lineage and evidence/source joins remain covered by disposable-PostgreSQL E2E, not by live-data acceptance.

### Remaining audit items

The other findings remain open: snapshot scoping for factors/scores, scenario-state lineage, evidence-linked source completeness, freshness contract consistency, and representative live-payload checks. They require a read-only contract/data audit before any further code changes.

### Verification status

The change was committed through GitHub's contents API. A full Web build and runtime check have **not** been run in this environment; verify the GitHub Actions result before treating this fix as build-validated. No migration, deployment, billing change, or visual redesign was performed.


## Follow-up implementation — 2026-10-12

### BTC first-scenario pass

Added `docs/BTC-SCENARIO-V1.md` as the first explicit product scenario artifact. It documents the published snapshot `BTC-2026-10-07-v1`, the Bull/Base/Bear probability set (30% / 50% / 20%), Base assumptions, invalidation conditions, supporting research and confidence boundaries.

The current schema/API distinguishes `research_scenarios` (definitions) from `scenario_states` (evaluated state). The previous read-only live audit found no BTC `scenario_states` or `monitoring_events` rows. Therefore this pass does not invent an evaluated state or a monitoring event. It instead makes the dashboard display the published Base definition as a clearly labeled research baseline when no state is linked to the active snapshot, and filters candidate state selection to the active snapshot.

### Additional Web build defect corrected

The Asset Dashboard referenced an undefined `confidence` variable although the score lookup is `confidenceScore`. The display now reads the confidence score object already returned by the API. This is included in the same small Web patch and must be confirmed by CI.

### What this does and does not establish

- Establishes a readable, evidence-linked **published BTC scenario baseline** in the product.
- Does not establish live scenario evaluation, current probabilities, or automatic Bull/Base/Bear transitions.
- Does not create `scenario_states` or `monitoring_events` rows and does not modify production data.
- The qualitative BTC evidence chain must not be presented as fresh quantitative monitoring.
- Remaining P1/P2 findings—factor/score snapshot scoping, broader source registry completeness, freshness contract consistency and live payload audit—remain open for the full contour audit.


## Follow-up implementation — 2026-10-12: snapshot lineage and monitoring semantics

The static API audit confirmed these contract gaps in the main branch:

- Critical factors and scores were queried by asset only, allowing records from older published snapshots to be mixed with the current snapshot.
- Scenario states were queried by asset and observation time only, allowing a state from an older snapshot to appear current.
- The top-level source registry included observation-linked sources only, although Evidence can reference sources directly.
- Scheduled market ingestion advanced every active monitoring signal's `last_updated_at` even though it did not evaluate those signals. That falsely represented ingestion as monitoring evaluation.

The audit-fix branch changes the queries to scope factors, scores and scenario states to the latest published snapshot; includes sources referenced by either observations or evidence; and stops advancing monitoring timestamps during ingestion. Research freshness can still move to `outdated` when a persisted review deadline has actually passed.

A dedicated `vps-api-build.yml` workflow performs a deployment CLI dry-run build for pull requests without deploying. Production release is manual-dispatch only after safety PR #17.

### Release-gate incident record

On 2026-10-12, merging Web code triggered the former automatic Release Gate. The production migration runner reported the latest migration markers as already applied and skipped them. The subsequent live scheduled-ingestion E2E nevertheless ran with the production database URL after the deployment-secret step failed. Logs show fresh market candles for the nine enabled non-quote assets and `monitoring_refresh=1`; this means candle upserts and monitoring timestamps were changed. The Worker deployment itself did not occur because secret configuration failed. No blind rollback was attempted.

Safety PR #17 removed the automatic push trigger and removed live-database scheduled ingestion from the release workflow. Scheduled-ingestion/idempotency tests belong to the disposable-PostgreSQL rehearsal. No further production release run should be started without explicit approval.

### Remaining audit scope

- Validate the API query changes and Worker bundle in CI.
- Confirm the live BTC/ETH/SOL/CAKE payload contract through an approved read-only route; this environment cannot directly reach the public API endpoint.
- Verify the freshness response types and UI parity.
- Keep the BTC Base scenario labeled as a published research baseline until a snapshot-linked evaluated state and deterministic input rule exist.


## Read-only BTC live-data audit — 2026-10-12

The current BTC database contract was checked with SELECT-only queries. No data was modified by this audit.

### Published research structure

| Check | Result | Interpretation |
|---|---:|---|
| Published snapshot | `BTC-2026-10-07-v1` | One current published BTC research baseline |
| Research blocks | 15/15 complete, 15 distinct block numbers | Structure 1 block coverage is complete |
| Block-to-domain links | 15 | All blocks have a domain link |
| Research domains | 6 | Expected domain universe present |
| Critical factors | 6 on the active snapshot | Snapshot-linked |
| Scores | 5 on the active snapshot | Snapshot-linked |
| Scenario definitions | 3 | Bull / Base / Bear exist |
| Scenario probabilities | 30% / 50% / 20% | Sum to 100% |
| Evidence | 15 rows covering 15 blocks | Required observation/source/claim links present; no orphan observation links |
| Monitoring signals | 7 | Qualitative baseline descriptions |
| Scenario states | 0 | No evaluated scenario state exists |
| Monitoring events | 0 | No event history exists |

### Market observation quality

- 33 observation rows across 21 distinct metric IDs.
- 18 rows are marked `STALE`.
- 2 rows have no `source_url`; both are duplicate circulating-supply observations.
- 9 duplicate natural-key groups were found. Each group has two rows with identical payload/provenance and different row IDs. The groups cover four ETF-flow dates plus spot price, block subsidy, circulating supply, maximum supply and hash rate.
- The newest observations are the qualitative research baseline at `2026-10-08T06:56:27Z`; key numeric market/network observations are from 2026-09-18/19 and marked stale.
- Market candles were refreshed through 2026-10-12 during the release-workflow incident, but that does not refresh the separate `observations` records or prove monitoring evaluation.

The persisted `research_status` is `current` with a next review date of 2026-11-07. This is a review-schedule state; it must not be read as proof that every metric is fresh.

### Scenario readiness conclusion

The published Base scenario is well-formed as a **research definition**: assumptions, invalidation conditions, probability and confidence exist. It is not yet an evaluated live scenario because:
- there is no `scenario_states` row linked to `BTC-2026-10-07-v1`;
- the scenario's `supporting_evidence` text is generic, while linked Evidence is qualitative baseline material;
- market observations required to evaluate current macro/institutional/security conditions are stale;
- no `monitoring_events` history exists.

The dashboard therefore presents Base as a clearly labeled published research baseline. Do not synthesize a scenario-state row, a probability update, or an event from the available baseline.

### Monitoring timestamp integrity after release-workflow incident

The old release workflow's live scheduled-ingestion test updated BTC's monitoring signal `last_updated_at` values to approximately `2026-10-12T12:57:52Z` without evaluating signal conditions. These timestamps are not trustworthy as evidence of monitoring evaluation. No manual timestamp rollback was performed because it would not restore the prior state reliably. The code path was corrected to stop future ingestion runs from changing monitoring freshness; that change is in main but is not deployed to the live Worker.

### Remaining BTC-only work

1. Preserve and document the nine duplicate observation groups; do not delete them without a separate reviewed data-cleanup plan.
2. Keep stale metric freshness visible; do not refresh values from guesses or unverified sources.
3. Define a deterministic Base/Bull/Bear evaluation rule using only validated inputs and explicit freshness requirements.
4. Only then create a snapshot-linked scenario-state record and evidence-backed event in a controlled, approved migration/release.
5. Defer SOL/CAKE and broader research expansion until this BTC path is complete.


### Follow-up: seed idempotency

PR #22 was merged after both the disposable PostgreSQL seed-idempotency rehearsal and the VPS API rehearsal passed. The seed now checks the logical key before inserting the targeted BTC numeric observations. It preserves existing records and revisions and does not clean up the nine existing duplicate groups. The production seed workflow is manual-only, so merging the seed change did not execute it against the live database.


## VPS API follow-up verification — 2026-10-12

### Resolved in the target API (verified in disposable PostgreSQL)

- **Snapshot scope for critical factors and scores:** both collections are queried only for the latest published snapshot.
- **Scenario-state lineage:** scenario states returned to the current dashboard are restricted to the active published snapshot. The clean BTC seed has no state row, so the UI continues to label Base as a published baseline.
- **Evidence payload and source registry:** the API returns evidence rows for the active snapshot with source, observation, metric, block, claim, observed value/unit, assessment, confidence and thesis impact. The source registry includes sources linked directly from Evidence as well as observations.
- **Scenario definitions:** each definition exposes `snapshot_id`; E2E verifies the Bull/Base/Bear set, probability sum and snapshot lineage.
- **No fabricated monitoring result:** E2E asserts that the clean BTC baseline has no scenario-state or monitoring-event rows and that its seven monitoring signals remain descriptive, not numeric live measurements.

Evidence: [VPS Build Rehearsal #38286251489](https://github.com/olegsh247-stack/Crypto/actions/runs/38286251489) and the subsequent green release-gate run after these checks were added. These tests run against disposable PostgreSQL; they do not validate the current public endpoint or repair production observations.

### Still open

- Live read-only payload verification against the actual VPS endpoint, after the host is provisioned and the controlled data migration is complete.
- Canonical freshness contract parity between API and Web types, including metric-level freshness rather than only research review schedule.
- Reconciliation of the nine historical duplicate observation-key groups and two rows missing source URLs; do not delete or rewrite them without a reviewed cleanup plan.
- Source-backed refresh of BTC spot price, hashrate, ETF flow, fee/subsidy economics and DXY, with fixed UTC windows and provenance.
- Confirmation/invalidation rules and monitoring event contract; no live scenario-state or event persistence until reviewed gates pass.

The detailed BTC factor-to-input mapping and acceptance gates are in [BTC-MONITORING-READINESS-MATRIX.md](./BTC-MONITORING-READINESS-MATRIX.md). No production data, schema or public routing was changed by this follow-up.


## Current-main verification update — 2026-10-13

**Evidence baseline:** current target-stack Build Rehearsal [#458](https://github.com/olegsh247-stack/Crypto/actions/runs/38309007906) passed against commit `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`. The test database was disposable PostgreSQL; no production observations were refreshed.

### Verified by the current-main rehearsal

- Clean PostgreSQL bootstrap and safe migration rerun completed; the canonical BTC input registry contract passed.
- Read-only BTC provenance audit and duplicate/idempotency rehearsal completed.
- Backup/restore rehearsal completed.
- API contract, mutation boundary, Worker ingestion, offline contract invariants, BTC research evidence/snapshot lineage, persisted history/candle finalization, and admin boundary E2E all passed.
- These results validate the repository target implementation in CI, not the currently serving public endpoint or a deployed VPS.

### Current disposition by contour area

| Area | Current evidence | Status |
|---|---|---|
| API / database / migration contract | Current-main rehearsal passed clean bootstrap, API contract and boundary E2E. | CI verified; live endpoint not verified. |
| Worker / ingestion | Current-main Worker ingestion E2E and migration/rehearsal checks passed. | CI verified; deployed runtime not verified because VPS is not provisioned. |
| Domains / factors / scores | Disposable-PostgreSQL API E2E checks active published snapshot scope. | CI verified; live data payload still unverified. |
| Scenarios / snapshot lineage | E2E checks scenario definitions and active snapshot lineage; clean BTC rehearsal has no evaluated scenario state. | CI verified; no scenario state is fabricated. |
| Monitoring / events | API and offline invariants passed; scenario/monitoring-event persistence is not used to make the clean baseline appear current. | CI verified; production freshness and live event semantics remain unverified. |
| Evidence / source registry | E2E checks evidence lineage and source registry coverage. | CI verified; underlying production observations still require provenance/freshness review. |
| Web / API response typing | The current Web type for `research_progress` still differs from the API's `status, completed, resolved, total, percentage` shape. PR #73 contains a focused fix and passed its recorded checks, but its branch is stale relative to current main. | OPEN; compare/rebase and validate before merge. A current-main Web build is not covered by Build Rehearsal #458. |

### Blocking live-data findings — not accepted

The read-only source-data audit dated 2026-10-12 recorded spot price, hashrate and ETF net flow as stale; fee/subsidy ratio and DXY as missing; and nine duplicate logical-key groups / eighteen rows. These are historical audit results and must be refreshed before any input acceptance. They are not repaired by a green CI run.

The actual public endpoint has not been verified through this audit path, and the target VPS does not yet exist. Stage 3 therefore remains **IN PROGRESS**. Do not proceed to visual redesign, scenario persistence, production ingestion or asset expansion on the strength of CI alone.

## API/Web response type follow-up — 2026-10-13

The remaining source-level Web response type gaps from the previous section have now been addressed on current `main` without merging the stale PR #73 branch wholesale:

- `ResearchScenario.snapshot_id` is declared in the Web contract.
- Optional BTC `scenario_readiness` is declared with `can_persist_scenario_state: false`.
- A compile-time Web fixture exercises both fields and the canonical `research_progress` shape.
- The API response-shape test asserts `status, completed, resolved, total, percentage`.
- VPS Build Rehearsal #491 passed, and Web Build #139 passed. Release Gate #203 was still running at the time of the audit update.

This closes the identified type-declaration gap, not the wider metric-freshness parity question or live-endpoint verification. CI used the repository's isolated target stack; no production data or runtime was changed.
