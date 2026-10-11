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

## Implementation status — Product Contour v1 contract PR

**Branch:** `fix/product-contour-v1-contracts`  
**PR:** https://github.com/olegsh247-stack/Crypto/pull/3  
**Scope:** Static/read-only corrections only; no database migration or Neon write.

| Finding | Static correction in PR | Remaining verification |
|---|---|---|
| Progress counts differ between Web and server | Web now exposes separate completed/resolved counts and calculates progress from resolved blocks (complete + N/A). | Compare against live API payloads and representative asset records. |
| Factors/scores may mix snapshots | Queries are restricted to the latest published snapshot. | Confirm live row counts and snapshot IDs for BTC, ETH, SOL and CAKE. |
| Scenario state may belong to another baseline | Scenario states are filtered to the latest published snapshot and include `snapshot_id` in the response. Dashboard no longer joins legacy `scenario_id` to `research_scenario_id`; published scenario definitions and observed state are displayed separately. | Live scenario-state rows remain empty for BTC/ETH; no database rows were changed or synthesized. |
| Evidence-linked sources omitted from source registry | Source query includes sources referenced by observations or evidence and deduplicates them. | Confirm live payload completeness and source URL availability. |
| Freshness contract differs between list/detail | Web freshness types now preserve optional `last_research_at`, `last_major_update_at`, and `next_review_at` fields returned by the API. | Confirm list/detail semantics and UI labels with live payloads; no freshness policy or server behavior changed. |

### Follow-up implementation — 2026-10-09

- Dashboard and Deep Research now render `research_scenarios` as published Bull/Base/Bear definitions, not as a fallback list of `scenario_states`.
- Dashboard no longer treats the legacy text `scenario_states.scenario_id` as a guaranteed foreign key to `research_scenarios.research_scenario_id`.
- Web API freshness types preserve optional review-timestamp fields. The API now selects and returns `last_major_update_at` and `next_review_at` in both list and detail freshness payloads; the detail freshness payload also preserves `last_research_at`.
- No database schema, Neon data, production deployment, VPS, or visual design was changed.
- Static file-content checks confirmed the unsafe scenario join was removed and the freshness fields are present. A new GitHub Actions run has not yet been observed for these latest commits; a successful Web build is not claimed.
- Follow-up static review found additional Dashboard issues: `currentScenario.invalidation_conditions` referenced a field not present on the local state object, an undeclared `confidence` variable, and the Confidence card displayed the score record's `confidence` metadata instead of its `value`. The invalidation condition now comes from the published Base scenario, and the Confidence card now displays `confidenceScore.value` with confidence metadata/explanation as supporting text. These are source-level fixes only; no Web build is claimed.
- Follow-up API audit found the `/api/assets` list route used a different lifecycle rule from the detail route: it counted only `complete` blocks, could mark an asset `monitoring` before all 15 blocks were resolved, and derived progress from `research_status.snapshot_id` instead of explicitly selecting the latest published snapshot. The list query now uses the same latest-published snapshot selection as the detail route, counts distinct resolved block numbers (`complete` + `n_a`), and applies `monitoring` only when all 15 are resolved and block 15 is complete. Static source correction only; runtime/build verification remains outstanding.
- Evidence source URL resolution now falls back to `observations.source_url` when the registered `sources.base_url` is absent, so a direct source URL attached to the observation is not discarded. The freshness payload now exposes optional `last_major_update_at` and `next_review_at` on list and detail responses. Both are additive API-contract fixes; runtime/build verification remains outstanding.

### Validation status

- Static contract assertions on the PR branch: 10/10 passed.
- Latest post-change source assertions: 8/8 passed for list/detail snapshot alignment, resolved-block lifecycle rules, scenario invalidation source, Confidence card value binding, and corresponding audit-document entries. These are text/source assertions, not a TypeScript build or runtime test.
- Latest Evidence/Monitoring follow-up assertions: 10/10 passed for list/detail freshness timestamps, observation URL fallback for evidence, evidence/source snapshot scoping, factor/score snapshot scoping, API documentation, and audit notes. These are text/source assertions, not a TypeScript build or runtime test.
- Cloudflare Worker branch build: passed; this is a preview build, not a production deployment.
- GitHub Web build job did not execute any steps; its job record contains no steps and the known account billing/spending-limit blocker remains unresolved. This is not evidence of a TypeScript build failure.
- Live API, Neon data, and runtime E2E validation remain outstanding. Do not merge or run migration workflows until those checks are available and safe.


## Final Product Contour v1 acceptance review — 2026-10-09

**Review type:** source-level acceptance only. No GitHub Actions run, TypeScript/Web build, live API request, Neon query, migration, or deployment was performed.

### Acceptance matrix

| Product block | Source-level result | Acceptance note |
|---|---|---|
| Home | Present | Loads assets from the API and presents the product overview plus lifecycle counts. |
| Assets | Present as Home section | The navigation points to `/#assets`; there is no separate `/assets` listing route. This works as an in-page listing, but remains a product/navigation decision if a dedicated Assets screen is required. |
| Asset Dashboard | Present | Asset detail route consumes the Engine response and exposes market context plus the decision view. |
| Deep Research | Present | Both the research index and per-asset research route exist; per-asset research normalizes to the canonical 15-block structure. |
| Domains | Present | Dashboard renders domain records and mapped Structure 1 blocks; real data coverage is not runtime-verified. |
| Factors | Present | Dashboard and Deep Research render critical factors; current-snapshot scoping is implemented in the API source, pending runtime verification. |
| Scores | Present | Dashboard renders scores and decision-score cards; current-snapshot scoping is implemented in the API source, pending runtime verification. |
| Scenarios | Present with safe separation | Published definitions and observed state are kept separate where lineage cannot be proven; runtime data semantics remain unverified. |
| Monitoring | Present | Signals, event history, direction counts and research baseline are rendered; freshness and data quality are not runtime-verified. |
| Evidence | Present | Evidence rows and source links are rendered; source URL fallback and evidence-linked source collection are implemented in API source, pending runtime verification. |

### Final static checks

A fresh read of the current PR branch confirmed **10/10 source-level acceptance assertions**:
1. Home loads the asset registry.
2. Assets navigation resolves to the Home `#assets` section.
3. Dashboard links to per-asset Deep Research.
4. Dashboard contains Domains, Factors, Scores, Scenarios, Monitoring and Evidence sections.
5. Per-asset Deep Research normalizes its content against the canonical 15-block structure.
6. Web progress counts N/A blocks as resolved.
7. Shared lifecycle contract defines resolved as complete + N/A.
8. API lifecycle logic checks resolved blocks and requires completed block 15 for Monitoring.
9. The Dashboard no longer references the invalid local `currentScenario.invalidation_conditions` field.
10. Evidence rendering supports source URLs.

These checks establish that the expected source patterns exist; they do **not** establish compilation, API compatibility at runtime, correctness of live records, or end-to-end product readiness.

### Acceptance decision

- **Source structure:** provisionally accepted for the defined v1 contour.
- **Known scope clarification:** Assets is currently a Home section, not a standalone route.
- **Build/runtime acceptance:** blocked pending a permitted Web build and read-only live API/data checks.
- **Release acceptance:** not granted. PR remains unmerged; no production deployment or database changes are authorized by this review.
- **Operational constraint:** GitHub Actions spending/billing limit remains the known blocker. Do not repeatedly retry Actions or use a migration workflow as a substitute for safe read-only validation.
- **Next validation batch when available:** run Web typecheck/build, then read-only contract checks for BTC, ETH, SOL and CAKE covering list/detail lifecycle parity, latest snapshot IDs, block counts, factor/score counts, scenario lineage, monitoring signals/events, evidence counts and source URLs. Record actual outputs in this audit before changing the acceptance decision.


### Follow-up validation attempt — 2026-10-09

- Read-only GitHub status lookup for audit commit `b96a602c86732def05e9d2bad62d13cb5afaad7f` returned no combined commit statuses.
- GitHub reports a `Build Crypto Web` workflow run (`37916647478`) as failed, but its only job has no step summaries and the log endpoint returns `BlobNotFound`. Therefore the failure does not identify a source/build error and cannot be treated as a completed build attempt.
- Read-only Vercel project search for repository `olegsh247-stack/Crypto` returned no linked project. No project was created and no deployment was triggered.
- As a result, there is currently no trustworthy Web build result or safe, known preview environment for live API checks. No Actions retry, Vercel deployment, database request, migration, or production operation was performed.

**Current gate:** source-level contour checks passed; build/runtime gate remains blocked by unavailable CI evidence and no linked Vercel project. The next valid path is to restore/enable an authorized build runner or provide an existing non-production preview with a confirmed read-only database binding, then execute the acceptance batch. Do not merge until that gate is green.


### UI E2E contract alignment — 2026-10-09

- Read the current Dashboard source alongside `.github/workflows/ui-runtime-e2e.yml` and found five stale text expectations: `Scenario States`, title-cased `Monitoring Dashboard`, `Current Signals`, `Recent Events`, and `Trace the research claim` did not match the current rendered copy.
- Updated only the UI E2E assertions to check the current source-backed labels: `Scenarios`, `MONITORING DASHBOARD`, `CURRENT SIGNALS`, `RECENT EVENTS`, and `provenance layer`. No product UI, design, API, or database code was changed.
- Re-fetched the workflow file from the PR branch and confirmed the five updated assertions are present.
- The workflow was **not run** because the GitHub Actions billing/spending blocker remains. This is a test-contract correction, not evidence that build/runtime validation now passes. Release gate remains blocked; do not merge until an authorized build and safe runtime checks succeed.


### Superseding live validation — 2026-10-09

This section supersedes earlier statements in this audit that the Web build/runtime checks were unavailable due to a GitHub Actions billing/spending blocker.

- Web build passed on commit `53004ef154d1fd239a48a5552d5d3deba6884e62`: [Build Crypto Web run #104](https://github.com/olegsh247-stack/Crypto/actions/runs/37972878788).
- UI Runtime Contract E2E passed on the same commit: [run #5](https://github.com/olegsh247-stack/Crypto/actions/runs/37972879565).
- The runtime workflow checks Home and dashboard/Deep Research routes for BTC, ETH, SOL and CAKE, then makes GET-only requests to the public API to compare list/detail lifecycle, resolved-block counts, payload arrays and snapshot lineage.
- BTC: published snapshot `BTC-2026-10-07-v1`; 15/15 blocks resolved; 6 factors; 5 scores; 3 scenarios; 0 scenario states; 7 signals; 0 events; 15 evidence rows with 15 source URLs; 9 sources.
- ETH: published snapshot `ETH-2026-10-04-v1`; 15/15 blocks resolved; 6 factors; 5 scores; 3 scenarios; 0 scenario states; 6 signals; 0 events; 15 evidence rows with 15 source URLs; 3 sources.
- SOL: API contract passed, but lifecycle is `not_started`; no published snapshot, blocks, factors, scores, scenarios, scenario states, signals, events, evidence or sources were returned.
- CAKE: API contract passed, but lifecycle is `not_started`; no published snapshot, blocks, factors, scores, scenarios, scenario states, signals, events, evidence or sources were returned.
- The SOL/CAKE result is a data-coverage gap, not an API-shape failure. The validation did not write or synthesize data.
- The branch-divergence conflict was resolved by merge commit `88ddf3ff45a6af8315bc827ad664ccb20cbcf8a4`; the merged `.gitignore` preserves the rules from both branches. GitHub now reports the PR as mergeable.

**Updated gate:** Web build PASS; UI/runtime API contract PASS; live data parity checks PASS; research coverage PARTIAL (published research exists for BTC/ETH but not SOL/CAKE); scenario-state and monitoring-event tables are empty for BTC/ETH and need confirmation as expected product behavior or separate follow-up. No production deployment, Neon write, migration, VPS operation, or design change was performed. The detailed current results are in [PRODUCT-CONTOUR-V1-STATUS-2026-10-09.md](./PRODUCT-CONTOUR-V1-STATUS-2026-10-09.md).


### Follow-up validation — 2026-10-11: current-head release and contour checks

**Reviewed code commit:** `7a9d09246f653614fd25a6467e803425d7bd0319`
**Latest completed gates for that commit:**
- [VPS API Build Rehearsal #268](https://github.com/olegsh247-stack/Crypto/actions/runs/38114733998) — PASS.
- [Product Contour Gate #242](https://github.com/olegsh247-stack/Crypto/actions/runs/38114734111) — PASS.

These gates validate builds, disposable-PostgreSQL migrations/rehearsals, UI/API runtime contracts, Worker bundle dry run, VPS API E2E, and read-only comparison against the live Worker. They do not constitute production deployment or a full live Product Contour acceptance run.

**Read-only parity evidence from VPS API Build Rehearsal #268**
- Live Worker and VPS Node API matched on seven checked routes, including `/api/assets/btc` and `/api/assets/eth`.
- The parity check compared published snapshot IDs, factor/score snapshot scoping, scenario definitions and states, and the selected history response. It completed with `VPS_API_PARITY_OK`; no mismatch was reported for the compared fields.
- This is useful parity evidence, but the parity helper does not check the complete Dashboard contract for BTC and does not cover SOL/CAKE in that run.

**Read-only ETH scenario preflight**
- Both implementations reported published snapshot `ETH-2026-10-04-v1`, with matching counts: 15 blocks, 6 domains, 6 factors, 5 scores, 15 evidence rows, 6 monitoring signals, 0 monitoring events, 3 scenario definitions and 0 scenario-state rows.
- The live Worker did not expose `snapshot_id` on its scenario-definition rows, so definition lineage is **not independently verifiable from the live payload**. The VPS payload did expose and verify the lineage.
- Zero `scenario_states` rows mean there is no observed state to validate; this must not be reported as verified lineage. The preflight helper's empty-array branch incorrectly returned `verified` because `[].every(...)` is true. Fixed in commit `d7267c2a44fad27ed24af40dcb2c47c50762dbba` to report `no_state_rows` when the array is empty. CI for this helper correction must pass before it is treated as validated.

**Acceptance decision**
- Hosting workflow safety and repository-level rehearsal: current code commit passed the two gates above; no production workflow, migration, deployment, or VPS provisioning was run.
- Product Contour v1: **not yet fully accepted**. The available run provides BTC/ETH parity and detailed ETH counts, but does not establish the full live payload/data quality for all contour sections on BTC.
- The next product-data step remains a read-only, single-asset BTC acceptance pass: latest published snapshot; 15-block lifecycle and progress; domains; factors and scores scoped to that snapshot; Bull/Base/Bear definitions and scenario-state lineage; monitoring signals/events; evidence-to-observation/source traceability; metric/history freshness. Do not expand to SOL/CAKE or add research scope before BTC passes this end-to-end scenario.
- No production data, schema, deployment, design, or account settings were changed by this follow-up.


### Superseding BTC row-level API audit — 2026-10-11

**Validated current branch commit before this follow-up:** `ca000bcc929ebe1973f482fc007114cc138056ec`.
- [VPS API Build Rehearsal #273](https://github.com/olegsh247-stack/Crypto/actions/runs/38119698027) — PASS.
- [Product Contour Gate #275](https://github.com/olegsh247-stack/Crypto/actions/runs/38119698142) — PASS.
- The new read-only BTC preflight confirmed snapshot `BTC-2026-10-07-v1`, status `PUBLISHED`, 15 numbered research blocks, 6 domains, 6 factors, 5 scores, 15 Evidence rows, 7 qualitative monitoring signals, 3 scenario definitions and no scenario-state rows.
- All 15 Evidence rows in both API projections have an evidence ID, observation ID that resolves to a metric in the joined API projection, metric ID, source ID, source URL and `as_of`. This validates presence of the exposed evidence chain, not independent verification of each claim's truth.
- Monitoring is a **qualitative research baseline**, as specified in `research/MONITORING-CONTRACT-V1.md`; current signal values are descriptions, not measured numeric values. All 7 signals have no metric/factor link and no thresholds in the exposed payload. Do not present these as fully live quantitative monitoring.
- Scenario definitions are Base 50%, Bull 30%, Bear 20%. VPS API exposes snapshot lineage for all three; live Worker payload does not expose it, so lineage cannot be independently checked from that deployed response. No persisted scenario-state rows exist; do not claim a current scenario state has been recorded.
- **Portability gap found:** live Worker returns 21 metrics and 9 referenced sources, while the clean VPS rehearsal database returned 15 metrics and 5 sources. The six missing rows are the initial BTC market observations: ETF net flow, spot price, block subsidy, circulating supply, max supply and hashrate. This is a clean-database seed gap, not proof of production data loss.
- The initial values are dated 2026-09-18/19 and stale. They must be labeled as historical baseline values and must not be treated as current market readings.
- Follow-up adds an idempotent migration to preserve these six explicitly stale baseline observations in clean/VPS bootstraps and tightens the preflight to compare all six market metric values/provenance and source IDs. Existing observations are not overwritten. Production migration/deployment remains manual and separately confirmed.

**Acceptance decision:** Product Contour v1 is **not yet fully accepted**. The next gates must prove market-metric/source parity on the branch, then continue the single-asset BTC scenario review. No scenario state is written to production by this work.


### Follow-up — BTC preflight harness correction, 2026-10-11

The first run after adding market metric/source parity checks reached the read-only BTC preflight but failed before evaluating data parity: `marketMetricIds` was declared inside the inspection function and referenced outside its scope. The VPS API build, database bootstrap, ingestion E2E, API parity and ETH scenario preflight all passed in that run; only the BTC preflight step failed with a JavaScript `ReferenceError`.

Fixed in commit `b2903575690e9249c520dbfc31f1995c1927b4ef` by moving the immutable six-metric ID list to module scope. This is a test-harness correction, not a change to product data or runtime API behavior. The Product Contour Gate and VPS API Build Rehearsal must be rerun on the corrected head; BTC metric/source parity remains **unverified until that rerun passes**. No production migration, deployment, database write or scenario-state write was performed.


### Follow-up — BTC row-level parity confirmed, scenario acceptance still blocked (2026-10-11)

**Validated head:** `18536ba238e791d847b68e0923062b53965c02aa`
- [VPS API Build Rehearsal #38122242540](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242540) — **PASS**.
- [Product Contour Gate #38122242606](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242606) — **PASS**.
- The earlier `marketMetricIds` scope error is fixed. The read-only BTC preflight completed and emitted both `BTC_SCENARIO_PREFLIGHT_OK` and `BTC_SCENARIO_ROW_AUDIT`.

**Verified on the disposable VPS database versus the live Worker**
- Same published snapshot: `BTC-2026-10-07-v1`; both report lifecycle `monitoring`.
- 15/15 research blocks, 6 domains, 6 factors, 5 scores, 15 Evidence rows, 7 monitoring signals, 0 monitoring events, 3 scenario definitions and 0 scenario-state rows.
- Metric projection: 21/21 rows; registered sources: 9/9. Every checked structural count matches.
- All six historical market metric rows match exactly on value, unit, observation time, source ID, URL, status and freshness: ETF net flow, spot price, block subsidy, circulating supply, max supply and hashrate. Their observations are dated 2026-09-18/19 and remain stale; parity does not make them current.
- All 15 Evidence rows in both projections expose evidence ID, source ID/URL, observation ID, metric ID and `as_of`. This confirms join-chain presence, not independent truth/quality of every claim.
- Factor and score rows are scoped to `BTC-2026-10-07-v1`. VPS scenario definitions carry that snapshot ID. The live Worker does not expose scenario `snapshot_id`, so its definition lineage remains not independently verifiable.
- Build, migration bootstrap/idempotency, VPS worker ingestion, API parity and ETH preflight all passed on this run.

**BTC scenario review — still not accepted**
1. There are no persisted scenario-state rows. The repository must not imply that Base is an observed/current scenario state.
2. All seven monitoring signals have descriptive current values but no metric link, factor link or threshold. This is a qualitative research baseline, not functioning quantitative/threshold-based monitoring.
3. Scenario definitions sum to 100% (Base 50%, Bull 30%, Bear 20%), but their `supporting_evidence` fields are generic summaries rather than explicit evidence IDs/row links. Probabilities and confidence values are therefore not reproducibly derivable from the exposed scenario payload alone.
4. The six market observations are stale historical baseline rows. Their parity is a portability success, not freshness validation.
5. The research-text metrics are timestamped 2026-10-08 and marked fresh in the API; source/claim verification and freshness semantics still need a separate review. Do not infer that all cited claims have been independently fact-checked.

**Decision:** hosting/build gates and clean-bootstrap data parity pass. Product Contour v1 and the end-to-end BTC scenario remain **PARTIAL / NOT ACCEPTED** until evidence-backed scenario reasoning, explicit scenario-state behavior, and the monitoring contract are resolved. Next step stays on BTC only: validate source/claim quality and define the read-only acceptance criteria for a scenario state; do not add SOL/CAKE research or write scenario state to production. No production migration, deployment, production DB write or scenario-state write occurred.


### Follow-up — external source/claim spot-check for BTC (2026-10-11)

A public-source spot-check was performed after the row-level parity pass. It is a relevance check, not a complete independent fact audit of all 15 Evidence claims.

- The SEC custody-proposal URL resolves to an official SEC release dated **2026-10-01**, release 2026-100. It describes a **proposal** that would change custody rules for registered investment advisers and regulated funds. It supports the existence of a regulatory catalyst, but does not establish that access has already broadened or that institutional demand has increased. Claims and signals must preserve the distinction between a proposal and an implemented rule or measured capital flow.
- The SEC S7-2026-09 URL resolves to an official interpretive release dated March 17, 2026, effective March 23, 2026. It is relevant to the regulatory framework, but a generic reference to it does not by itself establish the direction or magnitude of BTC price sensitivity to liquidity, real yields or risk appetite.
- Bitcoin.org's Version History page lists Bitcoin Core releases through 2026 and supports the narrow claim that releases continue. Bitcoin.org's Development page explains open-source contribution and review; it is useful background but is not direct evidence for market demand, hashrate, miner economics or institutional allocation.
- Several research metrics reuse general Bitcoin pages as provenance for broad claims (monetary role, ecosystem depth, competition, scarcity, security). The URL chain is present, but the claim-to-source specificity is weak and needs tightening with claim-specific primary sources or explicit rationale.
- The SEC custody-proposal evidence should be described as a **proposed regulatory catalyst**, not as realized adoption. Current institutional demand must be supported by observed flow/adoption data separately.

**Decision:** no source URL was found invalid in this spot-check; however, source presence is not sufficient for Evidence acceptance. The BTC scenario cannot yet be accepted as reproducible because scenario definitions do not expose evidence-row references, their supporting-evidence fields are generic, monitoring signals are qualitative/unlinked, and no scenario-state row exists. Next step is to strengthen the BTC evidence-to-scenario mapping and source specificity in the research artifact/contract before any production write or scenario-state creation.


### Follow-up — correct false freshness on qualitative BTC baseline (2026-10-11)

The row audit showed a timestamp discrepancy not covered by the earlier count/market-only parity check: the live Worker’s newest BTC metric was `2026-10-08T06:56:27.043Z`, while the clean VPS rehearsal’s newest metric was `2026-10-11T07:42:30.364Z`. The 15 qualitative research metric values were seed-generated from static text, but the original BTC Asset Card migration assigned `observed_at = now()`. This made clean bootstrap time look like observation time and could incorrectly refresh the baseline.

Added an **additive corrective migration artifact**:
`infrastructure/neon/migrations/2026-10-11-btc-research-baseline-timestamps.sql`.
It normalizes only the seeded BTC qualitative observations with the exact baseline methodology to the existing published research as-of `2026-10-08T06:56:27.043Z`, aligns linked Evidence `as_of`, and normalizes score/snapshot/research-status timestamps only when they match the original seed timestamp. It does not refresh claims, fabricate measurements or overwrite a score with a different timestamp. It has not been run against production.

Strengthened `scripts/btc-scenario-preflight.mjs` to compare every BTC metric row across Worker and VPS by value, unit, observation time, source ID/URL, status and freshness—not only the six market metrics. It explicitly requires 15 qualitative research metrics and all six market metrics. This closes the previous blind spot where metric counts matched despite observation-time drift.

**Validation status:** migration and preflight changes are code artifacts only until the new clean-PostgreSQL VPS rehearsal and Product Contour Gate pass on the resulting branch head. If they pass, full metric/provenance parity is verified for the tested projections; production remains unchanged. If they fail, inspect the specific timestamp or metadata mismatch before any further data work.


### BTC row-level parity rerun — 2026-10-11

**Corrected head:** `18536ba238e791d847b68e0923062b53965c02aa`
- [VPS API Build Rehearsal #38122242540](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242540) — **PASS**.
- [Product Contour Gate #38122242606](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242606) — **PASS**.

The corrected read-only BTC preflight completed. Live Worker and clean disposable VPS PostgreSQL/API match on:
- 15/15 numbered research blocks; 6 domains; 6 factors; 5 scores.
- 15 Evidence rows; 7 monitoring signal rows; 0 monitoring events.
- 3 scenario definitions; 0 persisted scenario-state rows.
- 21 metrics and 9 registered sources.
- All six historical market metric values and provenance fields: ETF net flow, spot price, block subsidy, circulating supply, maximum supply and hashrate.
- Identical nine-source ID set and published snapshot `BTC-2026-10-07-v1`.

The VPS API exposes matching snapshot lineage for all three scenario definitions. The live Worker response still does not expose `snapshot_id` on scenario definitions, so lineage cannot be independently checked from that projection. All 15 Evidence rows expose evidence ID, observation ID, metric ID, source ID, URL and `as_of`; this confirms field-level chain presence, not independent truth validation of every claim.

**Product acceptance remains partial, not complete:**
1. Six market observations are dated 2026-09-18/19 and explicitly marked stale. They are historical baseline only, not current market data.
2. All seven monitoring signals remain qualitative descriptions: none exposes a metric link, factor link or threshold. They are not quantitative live monitoring.
3. There are no persisted scenario-state rows and no monitoring events. The scenario definitions (Base 50%, Bull 30%, Bear 20%) exist, but no observed/current state is recorded.
4. Research metrics dated 2026-10-08 are labeled fresh in the API; freshness semantics should be checked against the project's actual freshness policy rather than accepted by label alone.

**Decision:** the clean-bootstrap portability/parity defect is resolved for the tested branch and both CI gates pass. Do not expand to SOL/CAKE. Continue the single-asset BTC scenario review, with the remaining emphasis on source/evidence quality, freshness semantics, monitoring contract, and the missing scenario-state lifecycle. No production DB mutation, production migration, deployment, VPS provisioning, or scenario-state write occurred.


### BTC scenario-evidence rollout preflight — latest tested head 2026-10-11

**Current tested head:** `ab63291c33211bbdbfcf57bb750e4c97002f1770`
- [VPS API Build Rehearsal #38155136613](https://github.com/olegsh247-stack/Crypto/actions/runs/38155136613) — **PASS**.
- [Product Contour Gate #38155136848](https://github.com/olegsh247-stack/Crypto/actions/runs/38155136848) — **PASS**.
- The earlier `marketMetricIds` scope error is resolved; the read-only BTC preflight now completes.

**Parity result on the tested disposable database**
- Same published snapshot: `BTC-2026-10-07-v1`; 15/15 blocks, 6 domains, 6 factors, 5 scores, 15 Evidence rows, 7 monitoring signals, 0 monitoring events, 3 scenario definitions, 0 scenario-state rows and 21 metrics on both APIs.
- All six historical market metric values and fields exposed by the API (unit, observation time, source ID/URL, status and freshness) match. They are all marked `stale`, with observations dated 2026-09-18/19; this proves reproducible historical baseline parity, not current market data.
- Evidence rows have all expected exposed links (evidence ID, observation ID, metric ID, source ID, URL and `as_of`) in both projections. This is referential-field presence, not independent validation of every claim.
- The VPS response exposes the scenario-evidence relation for two reviewed links: one `supports` link for Bull and one `context` link for Bear, both tied to the SEC custody proposal and the published snapshot. Base remains unlinked because its generic supporting-evidence text is not yet claim-specific. The live Worker response does not expose `evidence_links` or scenario `snapshot_id`, so scenario-evidence/lineage parity across the two API projections is **not yet established**.
- The VPS rehearsal now has four additional reviewed source-registry IDs staged beyond the nine IDs exposed by the live Worker. The preflight allows this exact documented rollout delta; it does not treat the raw source counts (13 vs 9) as identical. This is test-database staging, not a production source-registry change.

**Source-quality blockers found during row review**
1. `monetary.circulating_supply` has `source_id=network.primary` but its observation `source_url` is null. Do not fill this with a guessed URL; identify the actual source/derivation first.
2. `market.primary` still has no registry `base_url` and is marked `trust_level=to_validate`; its spot-price observation uses a third-party article and is stale. This is not an approved live market-data feed.
3. The hashrate observation points to a secondary article, not a clearly documented first-party network endpoint. Treat the 1001 EH/s value as historical baseline only until provenance is independently checked.
4. The 15 qualitative research metrics now retain the intended 2026-10-08 baseline timestamp in the clean rehearsal. Their `fresh` label means the API freshness policy still needs explicit review; a recent seed/refresh timestamp must not be mistaken for new factual evidence.
5. All seven monitoring signals remain qualitative descriptions without metric/factor links or thresholds. They are not quantitative live monitoring.
6. There are no persisted scenario-state rows or monitoring events. The 50% Base / 30% Bull / 20% Bear probabilities sum to 100%, but the probabilities and definitions alone do not establish a currently observed scenario state.

**Decision:** hosting/build/migration rehearsals and the corrected BTC preflight pass, but Product Contour v1 and the complete BTC scenario are **not accepted yet**. Next, keep the scope on BTC: resolve source provenance without inventing URLs, validate the SEC proposal and other claim-specific sources, and establish how the live Worker will expose scenario-evidence links and lineage. Then review the Base scenario's actual supporting evidence and the scenario-state lifecycle. Do not expand to SOL/CAKE. No production migration, deployment, live DB write, or scenario-state write was performed by this audit.


### Source-provenance follow-up — circulating supply, 2026-10-11

A targeted source check found official Bitcoin Core documentation for `gettxoutsetinfo`:
- `https://bitcoincore.org/en/doc/27.0.0/rpc/blockchain/gettxoutsetinfo/`
- `https://developer.bitcoin.org/reference/rpc/`

The RPC returns a UTXO-set `total_amount`, height and best-block reference. That is useful for reproducing an on-chain UTXO amount at a specific block, but it is **not automatically interchangeable with circulating supply**. The current BTC observation says it is a `gettxoutsetinfo`-derived estimate, but lacks a source URL and does not expose the source block height/hash or calculation that produced `20086198.00419505 BTC`. Do not simply attach the documentation URL and treat the numeric observation as independently verified.

**Next source task:** establish whether this field is intended to mean total UTXO amount, issued supply, or circulating-supply estimate; recover its historical block height/hash and derivation if available; then record a source URL that supports the actual observation. If that lineage cannot be recovered, retain the row as stale/unverified baseline or replace it only through an approved, separately reviewed data/migration change. Do not fabricate a source URL or silently relabel the metric.
