# Open PR reconciliation — 2026-10-13

Repository: `olegsh247-stack/Crypto`
Base branch reviewed: `main`
Scope: the eight PRs currently open at the time of review. This is a source/diff reconciliation, not a live production check. No PR was merged or closed by this review.

## Decision summary

| PR | Current decision | Evidence in current `main` | Safe next action |
|---|---|---|---|
| [#78](https://github.com/olegsh247-stack/Crypto/pull/78) — stale deployment-gate references | **Duplicate / superseded** | The two target rows in current `docs/FULL-AUDIT-MATRIX.md` already match the patch's updated VPS build/rehearsal versus production-deployment wording. | No code/doc port needed. Keep open until closure is approved. |
| [#77](https://github.com/olegsh247-stack/Crypto/pull/77) — broaden repository hygiene checks | **Duplicate / superseded** | Current `.github/workflows/vps-api-build.yml` has unrestricted `pull_request` and `push` triggers; no path filters remain. | No code port needed. Keep open until closure is approved. |
| [#76](https://github.com/olegsh247-stack/Crypto/pull/76) — scanner false positives | **Duplicate / superseded** | Current `scripts/check-vps-only-repository.mjs` already excludes Markdown contents from the retired-provider token scan while still checking paths. | No code port needed. Keep open until closure is approved. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) — API/Web response contract | **Targeted gap ported to main; PR branch itself remains stale** | Current Web type uses `resolved` and `percentage`. The remaining `scenario_readiness` and scenario `snapshot_id` fields have now been added to `web/lib/api.ts`; API response-shape and Web compile-time contract tests are also in `main`. | No further code port is currently identified from this PR. Do not merge the stale branch wholesale; review it only for any branch-only test coverage not represented by the new main checks. |
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

1. The narrow PR #73 contract gap was ported to current main; VPS Build Rehearsal #491 passed and Web Build #139 passed. Release Gate #203 was still running at the time of this update.
2. PR #78's two document rows match current main; #71's core DST fix and regression tests are already present in main.
3. #77/#76 are redundant; #39 is stale/duplicate; #69 is source-contract-blocked; #72 is an older audit snapshot. Do not merge stale branches wholesale.
4. PRs remain open because closure/merge actions are not being performed without explicit approval.


## Follow-up completed — 2026-10-13

The missing API/Web type contract was ported directly to current `main` in focused commits:
- `27e27d37289c77ee4134b272c9a3a9c0006c59e9` — Web types declare BTC `scenario_readiness` and scenario `snapshot_id`.
- `a26b22d2d9f444e2b1aa89a3113c23274d079dae` — API runtime research-progress response-shape test.
- `2ecc1568ad82624d8621190c04a1eefcaefef587` — API test script.
- `c09470d1e433103b3942d8436ffab6e08d23db14` — Web compile-time contract fixture.
- `98dbf842208cc54186db782d1e89169b50eac2d0` — VPS Build Rehearsal runs API contract tests.

Checks observed:
- [VPS API Build Rehearsal #491](https://github.com/olegsh247-stack/Crypto/actions/runs/38312864096): **success**.
- [Build Crypto Web #139](https://github.com/olegsh247-stack/Crypto/actions/runs/38312851658): **success**.
- [Validate VPS Release Workflow #46](https://github.com/olegsh247-stack/Crypto/actions/runs/38312864093): static validation job **success**.
- [Crypto VPS Release Gate #203](https://github.com/olegsh247-stack/Crypto/actions/runs/38312864376): still in progress at the time of writing; not yet called green.

These are CI checks against the repository/disposable stack. No live production endpoint, database, or deployment was changed.


## Targeted code-level reconciliation — PR #80 and PR #69 (2026-10-13)

This follow-up inspects the branch-only implementation files, not just ahead/behind counts. No branch was merged and no ingestion or database operation was run.

### PR #80 — Kraken point-in-time BTC spot candidate

**Finding: useful isolated parser/tests; runtime writer and migration remain deferred.**

- Branch-only files include `vps/worker/src/krakenSpotPrice.ts`, `vps/worker/src/krakenSpotPrice.test.ts`, and `vps/worker/src/krakenSpotPriceLiveRehearsal.ts`, plus migration `infrastructure/postgres/migrations/2026-10-13-btc-kraken-trade-source.sql`.
- The parser has useful deterministic coverage for returned pair key normalization, newest-trade selection, stale/future timestamps and Kraken API errors. The candidate contract keeps `market.spot_price`, `btc`, `market.kraken`, `USD/BTC`, source URL and raw response hash explicit.
- The live rehearsal is guarded to PostgreSQL loopback hosts and database names ending in `_test`; it performs insert/idempotency/field assertions inside a transaction that ends in `ROLLBACK`. This is a disposable test rehearsal, not production persistence.
- **Do not port the migration or wire the Worker yet.** The latest public capture remains candidate-only and the last target-database audit is dated 2026-10-12 18:20 UTC, not current. The actual target runtime source registration/adapter mapping has not been re-audited read-only. The main-branch read-only capture already exercises Kraken candidate provenance without requiring a new runtime writer.
- Next gate for this work: first confirm the current canonical source/metric contract and target runtime mapping, then port parser/tests separately from any scheduled collector or migration, run the complete disposable rehearsal, and re-run the source registry audit.

### PR #69 — broad BTC observation collectors

**Finding: do not port persistence or enable collectors; keep branch source-contract-blocked.**

- Branch-only collector `vps/worker/src/btc-observations.ts` combines Binance BTCUSDT spot, Mempool hashrate, a 144-block reward/fee window, and Farside ETF table parsing. These are not equivalent to the current reviewed candidate contracts.
- The 144-block fee/subsidy ratio is a rolling diagnostic; the metric registry's persisted cadence is one observation per completed UTC day. Porting this collector as-is would reintroduce a window/cadence mismatch.
- The branch uses a Farside HTML parser, but current review has unresolved publication-time freshness and placeholder/no-data semantics. An ETF session date alone does not prove the 36-hour observation-time freshness contract.
- The branch documents scheduled persistence as opt-in, but opt-in is not acceptance: source provenance, units, aggregation windows, duplicate/revision semantics and target schema still require current review. DXY remains unresolved and must not be silently filled by this collector.
- Safe disposition: retain the branch as reference for test ideas only; no collector, scheduler hook, persistence code or migration is ported now. Revisit only after each input passes the canonical source/metric acceptance matrix.

### Reconciliation decision

| Work item | Decision | Reason / next gate |
|---|---|---|
| Kraken parser + fixture tests (#80) | **Candidate for a later narrow port** | Useful deterministic coverage, but first verify current target runtime/source registry and ensure the adapter contract matches the accepted metric definition. |
| Kraken migration + live rehearsal (#80) | **Defer** | Do not add schema/runtime writer until read-only target audit is current; rehearsal is safe only on guarded disposable `*_test` PostgreSQL and rolls back. |
| Broad collector/scheduler/persistence (#69) | **Do not port** | Includes rolling 144-block ratio and ETF freshness assumptions that do not match accepted contracts; DXY remains blocked. |
| Existing read-only capture + block-window validator | **Keep as current path** | Preserves evidence and allows reproducible review without production writes. |

No production/target database was accessed or changed in this follow-up. No source was accepted, no scenario or monitoring state was written, and no PR was merged or closed.
