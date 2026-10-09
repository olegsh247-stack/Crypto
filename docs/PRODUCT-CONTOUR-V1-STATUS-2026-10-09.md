# Product Contour v1 — current validation status

Date: 2026-10-09
Branch: `fix/product-contour-v1-contracts`
PR: https://github.com/olegsh247-stack/Crypto/pull/3
Validated head: `53004ef154d1fd239a48a5552d5d3deba6884e62`

## Verified

- Web build passed on the validated head: [Build Crypto Web run #104](https://github.com/olegsh247-stack/Crypto/actions/runs/37972878788). Dependency installation, `npm run build`, TypeScript/type validation and static generation completed successfully.
- UI Runtime Contract E2E passed on the same head: [UI Runtime E2E run #5](https://github.com/olegsh247-stack/Crypto/actions/runs/37972879565).
- UI E2E exercised Home, ETH/BTC/SOL/CAKE dashboards and their Deep Research routes. The canonical 15 chapter checks passed for ETH.
- Read-only GET-only API contract checks passed for BTC, ETH, SOL and CAKE: all four are listed, each detail payload has the expected response arrays, list/detail lifecycle agrees, resolved-block counts agree, and snapshot-bound factor/score/scenario records do not cross snapshot lineage.
- The `.gitignore` conflict was resolved with merge commit `88ddf3ff45a6af8315bc827ad664ccb20cbcf8a4`; rules from both sides were preserved. Current branch is ahead of `main` and no longer behind it.
- PR #3 is currently reported by GitHub as mergeable, but remains a draft.

## Live API findings

| Asset | Lifecycle | Published snapshot | Blocks / resolved | Factors | Scores | Scenarios | Scenario states | Signals | Events | Evidence | Evidence rows with source URL | Sources |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| BTC | monitoring | `BTC-2026-10-07-v1` | 15 / 15 | 6 | 5 | 3 | 0 | 7 | 0 | 15 | 15 | 9 |
| ETH | monitoring | `ETH-2026-10-04-v1` | 15 / 15 | 6 | 5 | 3 | 0 | 6 | 0 | 15 | 15 | 3 |
| SOL | not_started | none | 0 / 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CAKE | not_started | none | 0 / 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The SOL and CAKE endpoints are healthy and structurally compatible, but neither currently has a published research snapshot or research/monitoring/evidence records. The API checks deliberately did not create or synthesize data. This is a **product-data coverage gap**, not a failed API contract.

BTC and ETH have complete 15-block published research snapshots and consistent snapshot-bound factors, scores and scenarios. Both currently return zero scenario-state rows and zero monitoring-event rows; that is reported as observed data, not filled in artificially.

## Remaining decisions / gates

- Code/runtime contract: **PASS** for the checks in this workflow.
- Research coverage: **PARTIAL** — BTC and ETH have published snapshots; SOL and CAKE still need a product decision and research data if they are intended to be first-class researched assets in v1.
- Full data semantics: scenario-state/event emptiness for BTC/ETH should be confirmed as expected or tracked as a separate ingestion/product task.
- PR merge: no longer blocked by branch divergence; keep draft until the product-data coverage decision and remaining acceptance review are recorded.

## Safety boundary

The validation workflow used only HTTP GET requests against the public Crypto API and local Web routes. No Neon writes, schema migrations, production deployment, VPS operation, or visual-design changes were performed. Do not run the Release Gate as a substitute for read-only validation because it may apply migrations to live Neon.
