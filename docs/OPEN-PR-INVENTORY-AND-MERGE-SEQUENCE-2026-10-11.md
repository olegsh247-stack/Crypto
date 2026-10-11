# Open PR inventory and merge sequencing — 2026-10-11

**Purpose:** decide what to do with current open pull requests without drifting from the canonical project sequence:

1. Hosting architecture and dependency inventory.
2. Full Product Contour v1 audit.
3. One complete product scenario on BTC.
4. Expand data and research only after the BTC scenario is demonstrated.

**This is a static GitHub PR review.** It does not prove live database/API state, current production migration compatibility, or production readiness. No PR is merged by this document.

## Decision matrix

| PR | Scope observed | Current relationship/state | Decision now | Why / required next gate |
|---|---|---|---|---|
| [#3 Product Contour v1 research data contracts](https://github.com/olegsh247-stack/Crypto/pull/3) | 74 files; +8349/-114. Mixes Web/API contracts, workflow/release-gate changes, hosting groundwork, BTC domain mapping and migrations, ETH observation pipeline, SOL/CAKE capture and research drafts. | Draft; targets `main`; reported `mergeable: false`. | **HOLD — do not merge wholesale.** | Scope is too broad to treat one green workflow as approval of the entire change set. Review each migration and workflow safety change separately; split or cherry-pick minimal accepted pieces. Keep SOL/CAKE publication out of current scope. Verify which checks belong to the exact current head before citing them as current validation. |
| [#6 Product Contour snapshot lineage and web build](https://github.com/olegsh247-stack/Crypto/pull/6) | 6 files; +214/-16. UI/API snapshot lineage and freshness contracts plus SELECT-only audit SQL. | Draft; targets `main`; mergeable reported true. | **FIRST CODE CANDIDATE, but not yet merge-ready.** | Review the overlapping API/UI changes against #3 and run the read-only audit through a genuinely read-only connection. Confirm latest-head checks and that the patch does not rely on unmerged changes from #3. Do not infer live data correctness from build success. |
| [#9 VPS worker schedule parity](https://github.com/olegsh247-stack/Crypto/pull/9) | 47 files; +2248/-82. Besides schedule/parity changes, the actual changed-file list includes multiple migrations, release/deploy workflows, BTC evidence/acceptance docs, VPS scripts and runtime files. | Draft; targets `fix/product-contour-v1-contracts`, not `main`; mergeable reported true. | **HOLD — audit and split before any merge.** | PR description says no schema/migration changes, but its diff includes migration files. Correct the description and review every migration as executable SQL; future dates in filenames do not defer execution. Isolate schedule/parity code from schema/seed/deployment changes. |
| [#10 BTC observation provenance and revision contract audit](https://github.com/olegsh247-stack/Crypto/pull/10) | One documentation file; +159/-0. BTC-specific source, reporting-window, revision and provenance audit. | Draft; targets `fix/product-contour-v1-contracts`, not `main`; mergeable reported true. | **KEEP as BTC audit input; do not merge through its current base dependency.** | Content is aligned with BTC-first scope and recommends not correcting stored values until semantics are resolved. Move/cherry-pick the documentation-only commit onto a branch based on `main`, or merge only after its base is independently accepted. It does not itself implement or validate ingestion. |
| [#11 Canonical project sequence](https://github.com/olegsh247-stack/Crypto/pull/11) | Documentation only: README, master audit plan and infrastructure plan. | Draft; targets `main`; current branch files were fetched after writing. | **Review this plan-alignment PR first.** | It records the intended order and scope boundaries; it is not a product-readiness claim. |

## Migration and release safety findings

- PRs #3 and #9 contain migration-bearing changes. A disposable PostgreSQL rehearsal is useful but is not proof of compatibility with the live Neon database.
- The migration runner applies unmarked migration files in lexical order. A future date in a filename is not a schedule or safety lock.
- Any workflow that can mutate production Neon or deploy the API must be reviewed for explicit confirmation, permissions, branch/ref provenance, and visible failure behavior before running it.
- Do not run a production Release Gate just to see whether it is green. First inspect its exact workflow and confirm whether it can migrate or deploy.
- No merge, migration, deployment, VPS operation, live-data correction, or scenario-state publication is authorized by this inventory.

## Ordered next actions

1. Finish hosting architecture/dependency inventory using repository evidence and clearly mark account-level items that still require confirmation.
2. Run the Product Contour v1 read-only checks safely and record actual outputs; separate static checks from live checks.
3. Choose and isolate the smallest safe contract-fix patch(es); rerun checks on their exact final heads.
4. Complete the BTC scenario acceptance review: source/provenance, Evidence linkage, Domains, Factors, Scores, Bull/Base/Bear definitions and state, Monitoring, API, UI, and explicit limitations.
5. Only after the BTC path is demonstrated, revisit expansion drafts for other assets.

## Scope rules

- Do not expand SOL/CAKE research or publish new snapshots during steps 1–3.
- Do not change stored BTC observations merely to make them agree; settle metric semantics and source/reporting-window provenance first.
- Existing ETH code and data remain. ETH may be used for compatibility/regression checks but does not displace BTC as the first complete scenario.
- Document every actual GitHub change and push it on a reviewable branch; keep production-affecting work separate from documentation and read-only audit work.
