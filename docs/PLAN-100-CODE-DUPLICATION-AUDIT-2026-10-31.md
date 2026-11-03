# Plan 100 / Prompt 100 / code duplication audit — 2026-10-31

## Scope and evidence

- Repository: `olegsh247-stack/Crypto`
- Audited baseline: `main` SHA `48295ca82fc2d76099f39f19cfbd840c1a1bf7b4` (2026-10-29).
- Exact-main CI evidence: [VPS API Build Rehearsal #41179541901](https://github.com/olegsh247-stack/Crypto/actions/runs/41179541901) — success on the audited SHA.
- Additional current-branch evidence: [Web Build #41140681997](https://github.com/olegsh247-stack/Crypto/actions/runs/41140681997) and [VPS API Build Rehearsal #41140681660](https://github.com/olegsh247-stack/Crypto/actions/runs/41140681660) — success on PR #103 head `cacb5fc2eb65565deb62123b5b7125f81d95aa00`; [VPS API Build Rehearsal #41179558082](https://github.com/olegsh247-stack/Crypto/actions/runs/41179558082) — success on PR #105 head `1b6857b96d92736ce61fbb9337f23691635b477f`.
- This is repository/CI inspection. No VPS, staging DB, live API, production DB or live ingestion was used.

## Documentation reconciliation

### Fixed in this branch

1. `docs/PLAN-100.md` contained two full copies of sections 0–7. The second copy repeated the plan's overview, criteria, stage definitions, master prompt and early history, but retained the older hosting wording that asked to inspect Cloudflare/GitHub App/DNS. The duplicate block was removed; the later dated history entries (14–28 October) were preserved.
2. The current-status table had remained dated 13 October and described BTC as blocked, DXY as a blocker, and external endpoint inspection as a prerequisite. It is now explicitly marked historical and superseded by a 31 October control point.
3. The embedded master prompt contradicted the agreed decisions: it required legacy-provider checks, fresh BTC inputs during development, and treating BTC source readiness as a prerequisite to the already completed research calculation. It is now aligned with the current scope.
4. `PROMPT-100-JOURNAL.md` ended on 20 October while Plan 100 had updates through 28 October. A concise 31 October reconciliation entry was appended; earlier entries remain as historical records.

### Canonical current interpretation

- BTC Rule v1 research is complete on the captured historical/offline evidence: Base scenario, directional score 0, low confidence, deterministic same-input replay.
- This does **not** mean live BTC readiness is approved, production ingestion is enabled, or scenario state/probabilities may be persisted.
- DXY, hashrate and fee/subsidy are optional supporting context for Rule v1, not blocking research inputs.
- Mempool is the preferred basis for protocol-scheduled issuance only; it is not interchangeable with economic circulating supply.
- Historical data is expected in test mode. Do not repeatedly recapture spot/ETF data to make a deterministic test look current.
- Product Contour v1 remains active. PR #103 is draft/open; its source-level UI/API work is not a substitute for representative non-production database payload validation.
- VPS is not available yet. PR #105 is a preparation runbook only; no staging API, database, host backup/restore or GET acceptance has been executed.

## Code and test findings

### Confirmed duplicate / redundancy

1. **Workflow trigger paths:** `.github/workflows/btc-scenario-readiness.yml` repeated the same two push-path entries (`scripts/run-btc-offline-scenario.mjs` and `fixtures/btc-offline-scenario-v1.json`). The duplicate entries were removed in this branch. They did not change workflow behavior.
2. **ETH migration history:** `2026-10-04-eth-asset-card.sql` creates the original ETH card; `2026-10-05-eth-asset-card.sql` and `2026-10-05-eth-asset-type.sql` both repeat parts of the ETH classification/finalization update. These are historical, idempotent migrations with separate migration markers. Do not delete or rewrite them: doing so can break already-migrated databases. If migration squashing is ever needed, do it only before the first external database is created and as a separately reviewed baseline change.

### Parallel implementations — not safe to delete blindly

1. **BTC source definitions:** `vps/worker/src/btc-source-catalog.ts` is the central catalog used by the runtime collector. `scripts/prepare-btc-observation-candidates.mjs` still has its own Kraken endpoint constant. The standalone candidate-preparation path and the Worker runtime path are separate execution layers, but this is duplicated configuration that can drift. The collector contract test validates runtime candidates against the catalog; add an explicit assertion tying the preparation script's accepted endpoint to the same canonical contract before changing either path.
2. **Market data adapters:** `vps/api/src/app.ts` contains request-time ticker/history adapters; `vps/worker/src/scheduler.ts` contains scheduled daily-candle adapters. Both use Binance/Kraken, but one serves read-time API responses and the other persists closed daily candles. They are not interchangeable duplicates. A future shared transport/parser module could reduce drift, but only with separate tests for ticker, OHLC, fallback priority, and persistence behavior.
3. **BTC source staging vs runtime ingestion:** `scripts/capture-btc-public-sources.mjs` and `vps/worker/src/btc-observations.ts` both interact with BTC providers, but serve different purposes: review-only capture/artifact generation versus opt-in normalized persistence. Keep the boundary explicit; do not merge them into a single live-write path.
4. **Test entry points:** `vps/worker/package.json` runs `scheduler.test.js`; BTC collector/parser tests are invoked separately by `vps-api-build.yml`. CI currently covers both, but a developer running only `npm test` in the Worker package does not run the collector suite. This is a discoverability/consistency gap, not evidence that the collector tests are missing.

### Runtime safety finding

`vps/worker/src/scheduler.ts` performs daily-candle upserts and updates expired `research_status` rows regardless of `BTC_OBSERVATION_INGESTION_ENABLED`. The flag controls only the BTC observation collector. The empty catch around `refreshResearchReviewStatus` was a real observability defect. **Fixed in this branch:** refresh failures are now returned as `research_status_refresh.status=failed`, the Worker reports a partial result, and a regression test verifies that database errors propagate to the scheduler's handler. Keep Worker stopped during initial read-only staging acceptance regardless of this fix.

## Open PR / branch overlap inventory

| PR | Current observation | Disposition |
|---|---|---|
| #105 | Draft/open staging runbook; based on current main; VPS Build Rehearsal passed. | Keep as documentation candidate; no VPS is provisioned. |
| #104 | Draft/open admin session/CSRF hardening; based on #102; current head is mergeable relative to its declared base. | Integrate only after #102, then run the combined Web/admin security checks. It supersedes the older admin-proxy/session implementation in #86. |
| #103 | Draft/open Product Contour UI/API contract work; current-main base; Web and VPS CI passed on its head. | Active product-contour candidate; still needs full diff review and later non-production payload validation. |
| #102 | Draft/open self-hosted Web container/edge routing; current-main base and mergeable. | Select as canonical self-hosted Web/edge implementation. #104 is explicitly based on it. |
| #101 | Draft/open Product Contour audit documentation. | Reconcile with the current audit doc and #103; do not keep parallel status narratives. |
| #100 | Draft/open Plan 100 documentation reconciliation. | Superseded in scope by this Plan 100 update; compare before disposition. |
| #99 / #89 | Same title and same two changed files. The changed-line patches are identical in both files; blob SHAs differ because their bases differ. #99 is based on current main; #89 has an older main base. | Treat #99 as the single canonical candidate; #89 is duplicate work and must not also be merged. |
| #86 | Draft/open broad Web admin + VPS runtime patch; based on old main SHA `03f4a08...`, GitHub currently reports `mergeable=false`. Four files overlap #102; five overlap #104. | Do not merge as-is. #102 + #104 are the newer canonical runtime/admin path. Audit its remaining unique API/server/db and UI changes individually; port only a still-needed behavior with tests. |
| #84 | Draft/open BTC reconciliation branch with 263 commits and a very large diff; GitHub reports non-mergeable. | Do not merge wholesale. Extract only a specifically missing, tested change if one remains absent from main. |
| #82 / #81 / #80 | Older BTC block-window, fee-window and freshness proposals on older bases. | Historical candidates; compare against main and #84 before considering any port. |
| #69 | Older opt-in BTC collector PR on a stale base; current main already contains a BTC collector/catalog/persistence path. | Do not merge as a second collector path. Compare only for a missing, independently tested behavior. |

### Recommended integration order (subject to full review and CI)

1. **#102** — canonical self-hosted Web container, Compose healthchecks and Caddy routing.
2. **#104** — admin session/CSRF hardening on top of #102; validate the combined security flow before any deploy.
3. **#99** — market input correctness; #89 is a duplicate and should not be integrated separately.
4. **#103** — Product Contour v1; rebase/reconcile after #99 and #104 because it touches the same API asset-detail and Web API helper files. Keep Plan 100 Product Contour as the active workstream.
5. **#86** — do not merge wholesale; inspect only its unique changes not covered by #102/#104 and not already present in main.

#105 and #106 are documentation-only candidates and can be reviewed independently. #106 CI passed on head `cffb0859c1ea240385918aa8c9bb94604e4f0bb5`; this does not itself merge or publish the Plan 100 updates. No PR was merged or closed by this audit.

## Recommended next actions

1. Run the checks triggered by this documentation/workflow cleanup and verify the exact branch head.
2. Review the full diffs of #102/#104/#86 and #99/#89, then choose canonical PRs; do not merge overlapping branches together.
3. Add a test that prevents the standalone BTC candidate-preparation endpoint from drifting from the runtime source catalog.
4. Consolidate repeated API/Worker market transport logic only if tests prove behavior remains equivalent.
5. After repository/CI work is complete, provision the isolated VPS staging environment; only then run real staging DB/API/backup/restore acceptance.

## Safety

No production database access or writes, live ingestion, Worker execution, runtime registry changes, scenario-state/probability changes, deployment, DNS change, cutover, merge or PR closure was performed.


## Current reconciliation — 2026-11-03 (verified against main d49582d)

### Mainline and merged work

- Current `main`: `d49582d6180406728cd911d7dba6b4fda7b2dc5c`.
- Merged PRs: #102 (`aece8a02`), #104 (`41491978`), #99 (`83dc2e97`), #103 (`716f5b5d`), #108 (`499a0dcc`) and #109 (`d49582d`). The corresponding post-merge CI on the final main SHA passed: Release Gate #41624191227, Docker image build #41624191232, BTC Scenario Readiness #41624191177, VPS API Build Rehearsal #41624191084 and Validate VPS Release Workflow #41624191061.
- The older 2026-10-31 and 2026-11-02 inventories above are historical snapshots. Their open/draft labels and dependency order must not be reused as current status.

### Open PR reconciliation against current main

| PR | Current branch delta vs main | Verified disposition |
|---|---:|---|
| #105 | 3 ahead / 6 behind; one new runbook file | Stale source branch. Its useful content was ported and expanded onto current main in #113, including explicit Stage 3 acceptance criteria. Do not merge #105. |
| #106 | 46 ahead / 6 behind; 10 changed files | Historical combined branch. Worker error-reporting work was isolated and merged as #108; useful Plan/journal/audit/endpoint-test work was transferred and merged as #109. Do not merge this branch. |
| #107 | 105 ahead / 6 behind; 30 changed files | Temporary combined integration-validation artifact. Not a source PR and not a merge candidate; its historical CI does not replace post-merge main CI. |
| #101 | 1 ahead / 6 behind; Product Contour audit doc only | Stale docs-only branch. Reconcile any unique content against the current audit and #109 before disposition; do not merge wholesale. |
| #100 | 2 ahead / 6 behind; Plan/journal only | Superseded by #109's Plan/journal update. Do not merge. |
| #86 | 29 ahead / 8 behind; 15 changed files | Do not merge wholesale. #102/#104 supersede its Web edge/admin-session implementation. Its unique server hardening, Add Asset flow and API 404 fallback have now been isolated into #111, #112 and #115 respectively. |
| #89 | 2 ahead / 8 behind; API + dashboard files | Duplicate of #99's market-input/dashboard correctness changes; #99 is already merged. Do not merge again. |
| #88 | 6 ahead / 8 behind; Worker scheduler + tests | Its UTC daily-candle behavior is superseded by the current Worker scheduler: UTC boundaries, completed-candle filtering, Binance-first/Kraken gap-fill selection, validation, and fetch-failure reporting. Do not port the old patch wholesale. |
| #69 | 23 ahead / 406 behind; old BTC collector path | Canonical opt-in BTC observation pipeline is already in main. Do not add a second collector path; inspect only a specifically missing behavior if evidence appears. |
| #84 | 263 ahead / 8 behind; 44 files | Very large historical BTC reconciliation branch. BTC Rule v1 research is complete; do not merge wholesale or repeat source captures. |
| #82 | 148 ahead / 344 behind; 30 files | Historical block-window/source-capture proposal; do not merge wholesale. |
| #81 | 5 ahead / 344 behind; one documentation file | Historical fee/subsidy window proposal; not a current blocker for BTC Rule v1 research. |
| #80 | 152 ahead / 345 behind; 30 files | Historical freshness/source-capture proposal; do not merge wholesale or reinstate freshness as a test-mode blocker. |

### Unique #86 work now isolated

1. **PR #111 — HTTP server boundary:** 1 MiB declared/streamed body cap, 413 response, bounded request/header/keep-alive/socket timeouts, safe structured request/error logs. Exact branch CI: Docker build #41638246661 SUCCESS and full VPS API rehearsal #41638246690 SUCCESS. No production server was changed.
2. **PR #112 — Add Asset flow:** active asset-type catalog endpoint, required type/category/research tier selection, redirect to asset detail, strict boolean validation, and duplicate insert protection returning 409 rather than updating an existing row. The workflow explicitly tests asset-type retrieval, typed creation, duplicate rejection, and invalid boolean input. Exact-head CI passed: Web build #41642776499, release workflow validation #41642776487, Docker #41642776484, and full VPS API rehearsal #41642776670.
3. **Already superseded:** #86's in-memory admin throttle/timing-safe bearer implementation is not the canonical session path after #104; its DB pool idle-error handler already exists in main; its Caddy/Web edge, session proxy and most API auth changes are superseded by #102/#104. Do not reintroduce parallel auth logic.

### Staging runbook source

PR #105's runbook was reviewed against the current Compose file and Worker behavior. It has been ported to current main in #113, with explicit Stage 3 payload acceptance evidence requirements. #113 exact-head VPS API Build Rehearsal #41642632762 passed. Do not merge the stale #105 branch.

### Focused follow-up PRs on current main (2026-11-03)

| PR | Purpose | Exact-head validation / disposition |
|---|---|---|
| #110 | Plan 100, Product Contour audit, journal + open-PR reconciliation | Documentation-only. Earlier VPS API Build Rehearsal #41638043930 passed; later commits only refreshed the Plan/audit docs. Draft/open; not merged. |
| #111 | HTTP request boundary hardening | Docker #41638246661 and full VPS API rehearsal #41638246690 passed. Draft/open. |
| #112 | Add Asset classification and duplicate safety | Web #41642776499, release workflow validation #41642776487, Docker #41642776484 and full VPS API rehearsal #41642776670 passed. Mutation E2E now covers active type lookup, typed asset creation, duplicate rejection and invalid boolean input. Draft/open. |
| #113 | Current isolated staging VPS runbook | Full VPS API rehearsal #41642632762 passed. Draft/open; documentation only. |
| #114 | GET-only Product Contour Stage 3 payload audit script + unit tests | Full VPS API rehearsal #41644183647 and release workflow validation #41644183649 passed. Draft/open. Unit tests validate report logic only; they do not constitute actual Stage 3 acceptance. |
| #115 | Unknown API route returns explicit 404 | Docker #41644499158 and full VPS API rehearsal #41644499113 passed. Draft/open. |

All six PRs are based on main `d49582d6180406728cd911d7dba6b4fda7b2dc5c`. None has been merged. No production database, Worker, ingestion, runtime registry, scenario state, deployment, DNS or cutover action was performed.

### Remaining project gates

- Product Contour Stage 3 still requires read-only representative payload validation for BTC/ETH/SOL/CAKE against a separately approved non-production DB/API. Capture snapshot IDs, section row counts, null rates, source lineage, freshness display and cross-snapshot scenario-state checks. CI fixtures are not a substitute.
- PR #105 is only a runbook. VPS provisioning, staging DB/API, independent off-host backup/restore and live GET acceptance remain unperformed.
- Worker must remain stopped during initial staging read-only acceptance: it writes daily candles and may update research review status even when BTC observation ingestion is disabled.
- No production database access/writes, live ingestion, Worker execution, runtime registry/scenario/probability changes, migration, deployment, DNS, cutover, merge or PR closure was performed by this reconciliation.

### Next review order

1. Inspect the exact #115 API handler test and complete changed-file diffs for #110–#115.
2. Review the focused open PRs (#110–#115) for consistency, then prepare a safe merge sequence only after the user approves.
3. Keep #105/#106/#107/#100/#101 and stale BTC branches out of main unless a new, independently verified unique requirement is identified.
4. Run the #114 audit script only when a separately approved isolated non-production staging API is actually available; review the real BTC/ETH/SOL/CAKE report before marking Stage 3 accepted.
