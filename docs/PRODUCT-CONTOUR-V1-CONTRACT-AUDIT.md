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

### Remaining audit items

The other findings remain open: snapshot scoping for factors/scores, scenario-state lineage, evidence-linked source completeness, freshness contract consistency, and representative live-payload checks. They require a read-only contract/data audit before any further code changes.

### Verification status

The change was committed through GitHub's contents API. A full Web build and runtime check have **not** been run in this environment; verify the GitHub Actions result before treating this fix as build-validated. No migration, deployment, billing change, or visual redesign was performed.
