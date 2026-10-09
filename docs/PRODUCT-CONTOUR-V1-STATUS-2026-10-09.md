# Product Contour v1 — current validation status

Date: 2026-10-09
Branch: `fix/product-contour-v1-contracts`
PR: https://github.com/olegsh247-stack/Crypto/pull/3
Latest fully verified Product Contour Gate commit: `66d0593794b4388e8ddfc4ae86cd8b48c206588a`; subsequent research commits are awaiting their own Gate result.

## Verified runtime baseline

- Web build passed on commit `53004ef154d1fd239a48a5552d5d3deba6884e62`: [Build Crypto Web run #104](https://github.com/olegsh247-stack/Crypto/actions/runs/37972878788).
- UI Runtime Contract E2E passed on the same commit: [run #5](https://github.com/olegsh247-stack/Crypto/actions/runs/37972879565).
- A later runtime E2E passed on commit `d98b3017384ba6d2b315befbc573deac444a8278`: [UI Runtime E2E](https://github.com/olegsh247-stack/Crypto/actions/runs/37973984413).
- The runtime workflow exercises Home, BTC/ETH/SOL/CAKE dashboards and Deep Research routes, validates the canonical 15 ETH chapter headings, and uses GET-only API requests for list/detail lifecycle parity, resolved-block counts, response-array shape and snapshot lineage.
- The Product Contour Gate workflow orchestrates the Web build + read-only UI/API runtime check and a disposable-PostgreSQL migration rehearsal. Run #37976597901 on commit `66d0593794b4388e8ddfc4ae86cd8b48c206588a` is **PASS**: both jobs completed successfully, including build/runtime E2E and two migration passes on disposable PostgreSQL 16. [Run #37976597901](https://github.com/olegsh247-stack/Crypto/actions/runs/37976597901).
- The disposable migration rehearsal has completed successfully in an earlier attempt: all migrations ran twice against a fresh PostgreSQL 16 database, and the schema-migration marker table had no duplicate versions. The overall workflow was then cancelled by a newer commit before runtime E2E completed, so this is migration-rehearsal evidence, not a green overall Gate.
- The `.gitignore` conflict was resolved with merge commit `88ddf3ff45a6af8315bc827ad664ccb20cbcf8a4`; current branch is ahead of `main` and no longer behind it. GitHub reports PR #3 as mergeable, but it remains a draft.

## Live API findings

| Asset | Lifecycle | Published snapshot | Blocks / resolved | Factors | Scores | Scenarios | Scenario states | Signals | Events | Evidence | Evidence rows with source URL | Sources |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| BTC | monitoring | `BTC-2026-10-07-v1` | 15 / 15 | 6 | 5 | 3 | 0 | 7 | 0 | 15 | 15 | 9 |
| ETH | monitoring | `ETH-2026-10-04-v1` | 15 / 15 | 6 | 5 | 3 | 0 | 6 | 0 | 15 | 15 | 3 |
| SOL | not_started | none | 0 / 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CAKE | not_started | none | 0 / 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The SOL and CAKE endpoints are healthy and structurally compatible, but neither has a published research snapshot or research/monitoring/evidence records. This is a **data coverage gap**, not an API-shape failure.

## Research artifacts prepared

Draft Structure 1 research artifacts have been added:
- [SOL Deep Research 01–15](../research/assets/SOL/SOL-RESEARCH-01-15.md)
- [CAKE Deep Research 01–15](../research/assets/CAKE/CAKE-RESEARCH-01-15.md)

They contain no fabricated numeric scores and are **not published database snapshots**. The 9 October source refresh records a secondary DefiLlama cross-check for CAKE protocol fees, revenue, volume, TVL, chain concentration and supply, plus an official Solana Explorer operational snapshot with dated slot, block, slot-time and TPS counters. The SOL and CAKE draft files now contain these dated observations with explicit limits. These additions do not close SOL supply/validator/adoption gaps or CAKE on-chain supply, incentives, liquidity and retention gaps. See [SOL/CAKE source refresh](../research/assets/SOL-CAKE-SOURCE-REFRESH-2026-10-09.md).

Tracking task: [Issue #4 — publish SOL/CAKE snapshots and define scenario baseline](https://github.com/olegsh247-stack/Crypto/issues/4).

## Scenario-state and monitoring-event semantics

- BTC and ETH each have three published scenario definitions but zero rows in `scenario_states`.
- Both have monitoring signals but zero `monitoring_events`.
- An empty event history is valid until a configured trigger actually occurs; do not manufacture monitoring events to populate the interface.
- Scenario states are a separate runtime assessment from scenario definitions. Issue #4 records the chosen policy: publishing a snapshot does not create a scenario state. A state is a separate, dated, evidence-backed evaluation against a specific snapshot. The deployed schema supports `scenario_states.snapshot_id`; `monitoring_events` remains empty until a real configured trigger occurs.

## Actions and Gate status

- **Build/runtime Actions:** verified passing on the validated commits linked above. Earlier UI E2E failures from brittle text assertions were corrected. The Actions spending/billing blocker is superseded by successful runs.
- **Product Contour Gate:** run #37976597901 passed on commit `66d0593794b4388e8ddfc4ae86cd8b48c206588a`. Build, read-only UI/API runtime E2E and disposable PostgreSQL 16 migration rehearsal all passed. Later research-document changes trigger a new run and must pass independently.
- **Production Release Gate:** its previous runs include failures at the first database migration/contract job, which caused downstream build/deploy jobs to be skipped. One earlier complete run succeeded. The available failed-run log endpoint now returns 404, so the precise cause of the latest migration-stage failure is **not yet proven fixed**.
- The Release Gate was changed on this branch from automatic main-push execution to manual dispatch with an explicit boolean confirmation before Neon migrations and API deployment. The reusable migration workflow now runs the clean-DB rehearsal before any live migration and independently requires explicit production-migration confirmation. This prevents ordinary pushes or an unconfirmed direct workflow dispatch from writing to production. It does **not** prove the historical live-Neon migration failure itself is resolved.

## Safety boundary

No production deployment, Neon write, schema migration, VPS operation, or visual-design change was performed in this work. The live API audit was read-only. Do not run the production Release Gate merely to test it; its first stage applies migrations to live Neon. Diagnose and rehearse migration behavior on a disposable database before any explicitly approved production release.
