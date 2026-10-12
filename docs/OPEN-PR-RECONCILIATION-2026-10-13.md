# Open PR reconciliation — 2026-10-13

Repository: `olegsh247-stack/Crypto`
Base branch reviewed: `main`
Scope: the eight PRs currently open at the time of review. This is a source/diff reconciliation, not a live production check. No PR was merged or closed by this review.

## Decision summary

| PR | Current decision | Evidence in current `main` | Safe next action |
|---|---|---|---|
| [#78](https://github.com/olegsh247-stack/Crypto/pull/78) — stale deployment-gate references | **Likely superseded; verify exact document lines before closure** | Current hosting and audit documentation already distinguishes build/rehearsal from production deployment; the patch only edits two rows in `docs/FULL-AUDIT-MATRIX.md`. | Compare those two rows with current main. If identical in meaning, mark duplicate and close only after explicit approval. |
| [#77](https://github.com/olegsh247-stack/Crypto/pull/77) — broaden repository hygiene checks | **Duplicate / superseded** | Current `.github/workflows/vps-api-build.yml` has unrestricted `pull_request` and `push` triggers; no path filters remain. | No code port needed. Keep open until closure is approved. |
| [#76](https://github.com/olegsh247-stack/Crypto/pull/76) — scanner false positives | **Duplicate / superseded** | Current `scripts/check-vps-only-repository.mjs` already excludes Markdown contents from the retired-provider token scan while still checking paths. | No code port needed. Keep open until closure is approved. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) — API/Web response contract | **Partially superseded; remaining contract coverage is needed** | Current Web type already uses `resolved` and `percentage`, so the primary progress-name mismatch is fixed. Current `vps/api/src/app.ts` returns BTC `scenario_readiness`, and scenario rows include `snapshot_id`; current `web/lib/api.ts` still does not declare these two fields. | Port only the missing Web types and focused API/Web contract tests/workflow after checking the branch diff against current main. Do not merge the stale branch wholesale. |
| [#72](https://github.com/olegsh247-stack/Crypto/pull/72) — Product Contour audit reconciliation | **Documentation superseded / needs selective comparison** | The current Product Contour audit and Plan 100 contain later reconciliation and BTC source findings. This PR is a documentation-only snapshot from Oct 12 and can reintroduce outdated statuses if merged wholesale. | Retain only statements not already represented in current audit docs; no wholesale merge. |
| [#71](https://github.com/olegsh247-stack/Crypto/pull/71) — London daily boundary/DST | **Core change superseded by main** | Current Worker scheduler contains the numeric GMT offset parser fix, midnight offset sampling, explicit failure on unexpected formats, and six regression tests; Build Rehearsal runs `npm test`. | No core-code port needed. Compare any branch-only documentation or workflow changes before proposing closure. |
| [#69](https://github.com/olegsh247-stack/Crypto/pull/69) — opt-in BTC observation collectors | **Defer / blocked by source acceptance** | Collectors are broader than the accepted BTC source contract. The latest source capture saw Farside HTTP 403, hashrate endpoint values with distinct rolling/current semantics, and ETF mirror data updated through Oct 9; DXY remains unresolved. | Do not merge or enable scheduled persistence. Reconcile each collector with the reviewed source/metric registry and current source capture first. |
| [#39](https://github.com/olegsh247-stack/Crypto/pull/39) — finalized daily candles | **Implementation appears superseded on target API; branch path is stale** | Current target API under `vps/api/src/app.ts` exposes `is_finalized` for stored daily candles. PR #39 modifies legacy `workers/crypto-api/src/index.ts`, not the target VPS API path. | Do not merge as-is. Check whether any unique tests/docs are missing from the target path; otherwise classify as duplicate. |

## Evidence limits

- The review compared PR metadata and patches with files on current `main`; this does not constitute a production endpoint test.
- The commit-status endpoint returned no status objects for these PR head SHAs, so this report does not claim that the current PR heads have passing checks.
- No merge, close, rebase, force-push, deployment, database write, migration, source ingestion, or service configuration change was performed.
- PRs remain open pending the targeted follow-up and explicit approval for closure/merge actions.

## Execution order

1. Finish the narrow PR #73 contract port and run Web/API checks on current main.
2. Verify PR #78's two document rows and compare branch-only changes in #71/#72.
3. Mark #77/#76 as redundant, #39 as stale/duplicate, and #69 as source-contract-blocked; close PRs only after explicit approval.
4. Update Plan 100 with the final PR disposition and the actual check results.
