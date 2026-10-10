# Product Contour v1 — API/UI Contract Audit

**Status:** Static repository audit  
**Date:** 2026-10-09  
**Scope:** Read-only comparison of the current Web types/components, API handler and documented Dynamic Asset Engine contracts.  
**Not performed:** Live API calls, Neon queries, build/runtime tests, database migrations, visual changes.

## Executive summary

The main product route and the major data sections already exist. The Asset Dashboard calls the Dynamic Asset Engine and the Deep Research route uses the canonical 15-block structure. The primary risk is not missing pages; it is consistency between the latest published research snapshot, current API collections and client-derived status/progress.

No production data or schema was changed during this audit.

## Findings

### P1 — Research progress can disagree between API and Web

**Evidence**
- `workers/crypto-api/src/research-status.ts` calculates `resolved` as complete + N/A blocks and uses `resolved / 15` for its percentage.
- `shared/research-status-contract.ts` defines `isResolvedBlock` as complete or N/A.
- `web/lib/research-status.ts` calculates progress with `isCompletedBlock` only, and derives the percentage from completed blocks / 15.
- The Asset Dashboard and Deep Research use this Web-side calculation rather than the server's `research_progress` payload.

**Impact**
A block correctly marked N/A is resolved for the lifecycle engine but does not contribute to the UI's progress percentage. Dashboard, Deep Research and server lifecycle can show different progress for the same asset.

**Recommended correction**
Use one shared definition of progress. Prefer exposing both `completed` and `resolved` counts clearly: “completed” counts complete blocks; “progress/resolved” counts complete + N/A blocks. Do not silently change the meaning of the existing label.

### P1 — Asset-scoped factor and score queries are not limited to the latest published snapshot

**Evidence**
- In `workers/crypto-api/src/index.ts`, critical factors are selected by `asset_id` and ordered by priority/name, without restricting them to the latest published snapshot.
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
5. Implement fixes as one coherent patch, then run local/static checks. Do not run the Release Gate while the GitHub Actions billing blocker remains unresolved; the workflow applies migrations to live Neon before its clean-database rehearsal.

## Change control

This audit is documentation-only. It does not authorize:
- Neon schema migrations;
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

### Follow-up fixes staged in draft PR #6

The following contract fixes are now staged on branch `fix/asset-dashboard-confidence-score-build`:

- Critical factors and research scores are restricted to the latest published snapshot for the requested asset.
- Scenario states are restricted to that same published snapshot. The Dashboard only combines a state with a current scenario definition when the stable scenario identifier matches; unmatched state is not presented as if it belonged to the current definition.
- The top-level source registry includes sources referenced either by observations for the asset or by evidence in the latest published snapshot, deduplicated by source ID.
- List and detail freshness payloads preserve `last_research_at`, `last_major_update_at`, and `next_review_at`; Web uses the shared freshness status union.
- The Web `research_progress` type now matches the server response fields `completed`, `resolved`, `total`, and `percentage`.
- The Dashboard's Confidence card now references the existing `confidenceScore` variable rather than an undefined identifier.

No database schema or research content was changed.

### Remaining audit items

The SELECT-only database audit was executed directly against the connected Neon production branch on 2026-10-10 using read-only queries (no writes, migrations or deployments). It verified snapshot IDs, section row counts, null/link gaps and source coverage for BTC, ETH, SOL and CAKE. See the live results and scenario reconciliation below. This is a direct database audit, not a live HTTP/API E2E test. Do not use the main Release Gate to repeat it: that workflow applies migrations and can deploy the Worker before its later verification steps.

### Verification status

- The build after the Confidence-card fix passed: [Build Crypto Web #111](https://github.com/olegsh247-stack/Crypto/actions/runs/38054871738).
- The combined snapshot/source/freshness/type patch passed: [Build Crypto Web #114](https://github.com/olegsh247-stack/Crypto/actions/runs/38055061759).
- Main-branch Release Gate #121 failed in the Web build because of the undefined `confidence` identifier. Its earlier database job succeeded, including a successful clean-database bootstrap rehearsal; the migration log also records `2026-09-28-engine-items` as applied on Neon. Therefore the database must not be described as untouched.
- No deployment, new schema migration, billing change, or visual redesign was performed.


### Live Neon read-only audit — 2026-10-10

Queries were executed against the connected production branch using SELECT statements only. No database writes, schema changes, migrations, or deployments were performed.

| Asset | Latest published snapshot | Research blocks | Factors | Scores | Research scenario definitions | Evidence | Scenario-state observations |
|---|---|---:|---:|---:|---:|---:|---:|
| BTC | `BTC-2026-10-07-v1` | 15/15 complete | 6 | 5 | 3 | 15 | 0 |
| ETH | `ETH-2026-10-04-v1` | 15/15 complete | 6 | 5 | 3 | 15 | 0 |
| SOL | none | — | 0 | 0 | 0 | 0 | 0 |
| CAKE | none | — | 0 | 0 | 0 | 0 | 0 |

For BTC and ETH, the 15 Evidence rows each have a non-null observation link, source link and claim; no orphaned observation links or observation records missing `source_url` were found. BTC has 5 distinct sources referenced directly by Evidence and 9 distinct source IDs across observations plus Evidence; ETH has 3 and 3 respectively. Monitoring has 7 enabled BTC signals and 6 enabled ETH signals, with statuses `active` and `watch`.

#### Scenario reconciliation

The live schema and seed migrations confirm two distinct concepts:

- `research_scenarios` contains the Bull/Base/Bear **research definitions**, linked to an immutable published `snapshot_id`. BTC and ETH each have all three definitions; their stored probabilities are 50% Base, 30% Bull, 20% Bear.
- `scenario_states` is a separate legacy/current-observation table. It contains zero rows for BTC and ETH, not merely zero rows linked to the latest snapshot. The published snapshot JSON already records a textual `current_scenario` for both assets.

Therefore the empty `scenario_states` result is not evidence that the research scenario definitions are missing. The UI must label and render the published scenario definitions separately from live state observations, and must use the snapshot's recorded current-scenario text when no compatible live state exists. Do not create synthetic `scenario_states` rows or change the schema to make the dashboard look populated.

#### Follow-up UI correction staged in PR #6

- The current-scenario card now falls back to the current scenario stated in the published snapshot when no matching live state exists, and explicitly labels this as published-research context rather than a live observation.
- The Scenarios section is titled **Research Scenarios**, shows supporting evidence, probabilities and confidence where present, and explains when separate live scenario-state observations are absent.
- No scenario probabilities or state rows were written to Neon. No design-system or schema change was made.

#### Scope limitation and remaining product work

- SOL and CAKE are enabled assets but have no published research snapshot. Confirm intended Product Contour v1 scope before generating/publishing new research; do not seed placeholder research just to fill cards.
- This audit verifies database content, not the deployed Worker HTTP payload or browser runtime. The PR Web build is the current code-level validation; a safe live API E2E check remains separate from this read-only database audit.


### Empty-state consistency check — 2026-10-10

The read-only Neon audit found no published snapshot for SOL or CAKE. The current Dashboard and Deep Research sections already render empty arrays as unavailable/not populated for factors, scores, scenarios, monitoring, and evidence; they do not create synthetic rows.

A follow-up static review found one misleading derived state: when an asset had no thesis score and no critical factors, the Dashboard's fallback classified the thesis as `Mixed`; when it had no monitoring signals, research direction could appear as `Stable`. Those labels implied an assessment despite the absence of evidence.

The PR now:
- uses `Not assessed` for thesis state when neither a thesis score nor factors exist;
- uses `Unavailable` for research direction when no monitoring signals or mixed factor state exist;
- gives the decision headline an explicit no-published-snapshot message;
- shows a Dashboard notice when no published research snapshot exists;
- shows the same distinction on Deep Research, clarifying that the 15 chapters are the canonical structure, not completed analysis.

This is a UI-only correction. No Neon writes, schema changes, migrations, deployment, or asset-specific hardcoding were introduced. Build verification is required on the resulting PR head.


### Follow-up API/UI consistency review — 2026-10-10

The Web build after the no-snapshot Dashboard/Deep Research correction completed successfully: [Build Crypto Web #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38058753813).

A second SELECT-only Neon query re-confirmed the latest published baseline and snapshot-bound section counts:

| Asset | Published snapshot | Blocks / complete | Factors | Scores | Scenarios | Evidence | Scenario states |
|---|---|---:|---:|---:|---:|---:|---:|
| BTC | `BTC-2026-10-07-v1` | 15 / 15 | 6 | 5 | 3 | 15 | 0 |
| ETH | `ETH-2026-10-04-v1` | 15 / 15 | 6 | 5 | 3 | 15 | 0 |
| SOL | none | 0 / 0 | 0 | 0 | 0 | 0 | 0 |
| CAKE | none | 0 / 0 | 0 | 0 | 0 | 0 | 0 |

The API handler statically reviewed on the PR head:
- returns a nullable published snapshot and filters blocks, factors, scores, scenarios and evidence against the published snapshot ID;
- returns scenario states only when their `snapshot_id` matches the published snapshot;
- keeps monitoring signals/events as separate asset-level current/history collections;
- returns an empty published-snapshot-bound collection for SOL/CAKE rather than synthesizing analytical rows.

One more UI ambiguity was found: the global research-domain registry could render six domain cards for an asset with no snapshot, each appearing to have zero mapped blocks. The Dashboard now explains that domain views cannot be populated until the asset has a published snapshot, and that the shared registry is not evidence of missing mappings. This is a presentation-only correction.

Validation boundaries:
- Web Build #121 passed on the prior UI head; the domain empty-state adjustment above is a newer commit and requires its own build.
- Database checks are SELECT-only; no writes, migrations, or deployment were performed.
- The API handler was statically reviewed, but a live HTTP GET/E2E against the deployed Worker has not been performed in this step. The API endpoint is not hardcoded in the repository and is supplied through deployment configuration; do not treat the database audit or Web build as a substitute for HTTP E2E.
