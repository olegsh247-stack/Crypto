# Open PR integration order — 2026-10-12

**Purpose:** Prevent stale or stacked pull requests from reintroducing retired runtime dependencies or mixing hosting, product-contract, and BTC-scenario work.
**Scope:** Read-only metadata/diff review of currently open PRs and latest visible GitHub Actions runs. No PR was merged, closed, rebased, or force-pushed.

## Current CI evidence

- Latest visible successful `Crypto VPS Release Gate` on `main`: [run #38290593113](https://github.com/olegsh247-stack/Crypto/actions/runs/38290593113), created 2026-10-12 18:23 UTC. The VPS API/Worker/PostgreSQL/backup/E2E job and Web build both passed.
- Latest visible successful VPS API Build Rehearsal for PR #69: [run #38290784159](https://github.com/olegsh247-stack/Crypto/actions/runs/38290784159), created 2026-10-12 18:25 UTC. The isolated build/E2E job passed.
- These are repository build/test results, **not** proof that a VPS is provisioned, that public traffic has been cut over, or that any production data was migrated.
- Release Gate #38290593113 was a `push` run on `main`; its workflow currently runs the target-stack build/test and Web build. It did not show a deployment job.

## PR triage

| PR | Scope and branch shape | Decision for current sequence |
|---|---|---|
| [#71 Worker London boundary fix](https://github.com/olegsh247-stack/Crypto/pull/71) | Five files on a dedicated branch based on current `main`; narrow Worker correction, six regression tests, Build Rehearsal integration and result documentation. Both VPS API Build Rehearsal and release-workflow static validation passed. | Focused fix for the confirmed scheduler defect. Review source/test diff; do not merge until review is complete. No deployment is authorized. |
| [#70 Hosting dependency audit](https://github.com/olegsh247-stack/Crypto/pull/70) | Two documentation files, target `main`, draft; current base SHA is recorded on the PR and the latest head includes the additional Worker London-boundary finding. | Keep as the current hosting audit/runbook PR. Review and merge only after checking current-base diff and docs scan; no runtime fix is included. |
| [#14 Hosted database retirement plan](https://github.com/olegsh247-stack/Crypto/pull/14) | Documentation-only, draft, mergeable reported true. Overlaps the safe-cutover guidance now captured in #70. | Do not merge both wholesale. Compare content and consolidate only non-duplicative decisions into one accepted runbook. |
| [#11 Canonical project sequence](https://github.com/olegsh247-stack/Crypto/pull/11) | Documentation-only but touches README plus six planning/audit docs; reported not mergeable. | Use as a source of prior decisions, not as a bulk merge. #70 records the current hosting step; update README only after the canonical docs are reconciled. |
| [#3 Product Contour v1 contracts](https://github.com/olegsh247-stack/Crypto/pull/3) | Very broad: 74 files, about 8,349 additions; includes former runtime source under `workers/crypto-api`, legacy platform workflows, old database migration paths, multiple assets and VPS work; reported not mergeable. | **Do not merge as a unit.** It mixes useful historical fixes with the retired runtime/deployment model and out-of-sequence research expansion. Extract only narrowly needed changes after current-main tests prove a gap. |
| [#6 Snapshot lineage and Web build](https://github.com/olegsh247-stack/Crypto/pull/6) | Six files; includes `workers/crypto-api/src/index.ts` and an old runtime path; reported not mergeable. | Do not merge unchanged. Verify the equivalent contract against current `vps/api` and Web; current target API already has published-snapshot scoping in the inspected paths. |
| [#9 London-midnight schedule](https://github.com/olegsh247-stack/Crypto/pull/9) | 47 files and based on `fix/product-contour-v1-contracts` (stacked on #3); touches old platform workflows and target Worker scheduler; draft. | Do not merge the stack. The specific London-boundary defect is now addressed separately in #71; inspect #71 rather than porting the stale stacked branch. Any other #9 changes remain out of scope until individually justified. |
| [#10 Observation provenance/revision audit](https://github.com/olegsh247-stack/Crypto/pull/10) | One documentation file; based on `fix/product-contour-v1-contracts`, not directly on `main`. | Preserve as evidence. Rebase/reapply as a standalone audit only after verifying the file does not contradict current migration/retirement policy. Do not run its discussed migrations. |
| [#13 Monitoring timestamp fix](https://github.com/olegsh247-stack/Crypto/pull/13) | Three target VPS files; draft, reported not mergeable. Includes Worker parity tests and scheduler-related changes. | High-priority defect candidate, but do not merge stale branch as-is. Compare current `vps/worker` and regression test on `main`; if still needed, make a minimal current-base patch and prove ingestion alone cannot update monitoring evaluation timestamps. |
| [#39 Finalized daily candles](https://github.com/olegsh247-stack/Crypto/pull/39) | Two files, but modifies `workers/crypto-api/src/index.ts`, not the target `vps/api`; reported not mergeable. | Do not merge unchanged. Audit all current VPS API and Worker candle consumers; port only a missing target-stack assertion if one is found. |
| [#63 Live BTC input blockers](https://github.com/olegsh247-stack/Crypto/pull/63) | Four documentation files; reported not mergeable. Records read-only source/input findings. | Reconcile findings with current `docs/BTC-MONITORING-READINESS-MATRIX.md`; preserve blockers only when still evidenced. No production writes. |
| [#69 Opt-in BTC observation collectors](https://github.com/olegsh247-stack/Crypto/pull/69) | 13 files, target VPS Worker, successful isolated CI. Includes candidate collectors and opt-in persistence path. | Do not enable scheduled persistence or merge merely because CI passed. First finish source definitions, freshness/provenance/unit/window/revision contract and duplicate policy; then verify collector behavior with fixtures and confirm no scenario/monitoring-state writes. It must support the one BTC scenario, not become broad research expansion. |

## Recommended integration sequence

### A. Hosting/documentation first

1. Review PR #70's exact diff and mergeability against current `main`.
2. Compare PR #14 and #11 documents; choose one canonical hosting/cutover runbook and avoid duplicate competing plans.
3. Run the repository's VPS-only/static workflow checks on the accepted documentation changes. Keep any mention of retired platforms limited to the minimum historical/cutover context allowed by the scanner and architecture policy.
4. Do not enable deployment or remove the old data copy. VPS provisioning and explicit cutover approval remain prerequisites.

### B. Product Contour v1 contracts

5. Compare #3 and #6 changes to the current `vps/api`, Web, and disposable-PostgreSQL tests. Do not bring back the old runtime path or old deployment workflows.
6. Reconcile #13 and #39 against current target files. Extract minimal patches only where current main lacks the behavior; preserve regression tests and run the full VPS Release Gate.
7. Reconcile #63's read-only findings against the current BTC readiness matrix. Do not use a workflow that writes production data as an audit mechanism.

### C. One BTC scenario

8. Complete #10's observation contract review: source identity, metric definition, unit, reporting window, observation timestamp, retrieval/publication metadata, freshness, duplicate natural key and correction/revision semantics.
9. Review #69 collectors only against that approved contract. Keep collection opt-in until explicit acceptance; no automatic scenario-state or monitoring-event persistence.
10. Evaluate one BTC scenario reproducibly from a fixed, reviewed input fixture and active published snapshot. Record the inputs, method/version, output and invalidation conditions; only then consider broader coverage.

## Merge-control rules

- Never merge by PR number, title, green check alone, or a stale description. Check the current diff against current `main`, changed files, branch base, CI run tied to the exact head SHA, and any migration/workflow effects.
- A PR reported `mergeable=false` is not a candidate for merge until its conflicts are resolved on a reviewed branch.
- A stacked PR targeting another open feature branch is not an independent main-ready change.
- Any PR that reintroduces `workers/crypto-api`, legacy deployment workflows, or live database migration side effects must be split/reworked before acceptance.
- Green CI validates only the tested commit and test environment; it is not deployment or production-data evidence.
- Do not delete old branches in bulk: first map open PR dependencies and preserve audit evidence.

## Actions taken

Documentation-only audit. No code, production database, secret, DNS, hosted service, workflow run, PR state, or branch history was changed. This document proposes an integration order; it does not authorize merges or production operations.
