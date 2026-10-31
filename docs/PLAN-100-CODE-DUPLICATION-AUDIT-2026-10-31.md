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
