# API/UI and Scenario/Monitoring Contract Audit — 2026-10-11

**Scope:** static read of the repository's `main` API/UI/Worker code plus the successful disposable PostgreSQL seed-idempotency CI run. This is not a production mutation or complete Product Contour sign-off.

## 1. Disposable seed idempotency rehearsal

- Workflow: [Seed observation idempotency rehearsal #1](https://github.com/olegsh247-stack/Crypto/actions/runs/38171741980)
- Commit under test: `fb450a72933bc88b8878e57bf64cf8d6ba62aec3`; pull request: [#12](https://github.com/olegsh247-stack/Crypto/pull/12).
- PostgreSQL: disposable PostgreSQL 16 container, schema bootstrap and repository migrations applied locally; no Neon credentials or live connection.
- Result marker: `SEED_OBSERVATION_IDEMPOTENCY_OK first_run_rows=9 second_run_rows=10 revision_2_preserved=1 duplicate_natural_keys=0`.
- The test demonstrates idempotency for the six targeted BTC seed metric IDs and preserves a distinct synthetic revision 2. It does not clean up live duplicates, validate production values, or establish source/revision semantics for every metric.
- Keep PR #12 Draft while the patch receives review and downstream contract checks are completed. Do not merge merely to alter existing production rows; no production correction is included.

## 2. API/UI contract findings from static inspection

### API response shape

`workers/crypto-api/src/index.ts` constructs an asset detail response containing `metrics`, `history`, `research_snapshot`, `research_blocks`, `research_domains`, `critical_factors`, `scores`, `research_scenarios`, `scenario_states`, `monitoring_signals`, `monitoring_events`, `sources` and `evidence`. The source is a static contract inspection only; it does not prove the live public endpoint currently serves this exact revision or that the Web runtime renders it correctly.

The API chooses the latest observation per `metric_id` ordered by `observed_at DESC, revision DESC`. That ordering does not resolve ties by source, reporting period, retrieval time, or an explicit revision policy. It therefore remains insufficient to adjudicate conflicting source/reporting-window revisions automatically.

### Web contract/build blocker on `main`

`web/app/assets/[assetId]/page.tsx` on `main` references `confidence?.confidence` and `confidence?.score_type` in the Confidence score card, but the page defines `confidenceScore` rather than a `confidence` variable. This matches the prior Release Gate TypeScript failure. Do not treat `main` as Web-build verified on this basis. PR #6 had a passing Web build on a separate head, but that result is not proof for `main` or the current combined candidate.

The UI sets `scenarios = data.research_scenarios ?? data.scenario_states ?? []` and separately builds `currentScenario` from `data.scenario_states`. This distinction is important: scenario definitions are not equivalent to an evaluated current scenario state. With no persisted state rows, the UI can list Bull/Base/Bear definitions while the Current Scenario card still correctly reports no current state.

### Monitoring timestamp semantics — confirmed static defect

In `vps/worker/src/scheduler.ts`, `runScheduledIngestion` calls `refreshMonitoring` whenever at least one asset's candle ingestion succeeds. `refreshMonitoring` currently executes:

- `UPDATE monitoring_signals SET last_updated_at=now() WHERE status <> 'disabled'`;
- a research-status expiration update for due `current` research.

It does not calculate signal values, compare current metrics with signal thresholds, evaluate a scenario, or append a monitoring event before refreshing signal timestamps. Thus successful market-candle ingestion can make monitoring signals look freshly evaluated when their values/state have not been evaluated. The existing VPS rehearsal's check that `last_updated_at` changes after ingestion only proves timestamp mutation, not monitoring correctness.

**Acceptance requirement:** do not refresh a signal's evaluation timestamp merely because market candles were ingested. A timestamp should advance only when the corresponding signal was actually evaluated against its defined inputs/rules, and a state transition/event should be persisted only when supported by the evaluator's explicit contract. No production writes or code changes were made during this audit.

## 3. Scenario and monitoring data contract

- Live read-only audit previously found zero `scenario_states` rows and zero `monitoring_events` rows across the inspected database; BTC has scenario definitions but no evaluated scenario state.
- Do not insert synthetic scenario states/events into Neon to satisfy UI expectations.
- Before implementing an evaluator, specify inputs, required data freshness, threshold source, unknown/missing-input behavior, state transition rules, idempotency, event deduplication, and the relationship to the exact published research snapshot.
- Do not invent thresholds or infer scenario transitions from candle arrival alone.
- Test evaluator behavior only against a disposable database and explicit fixtures; preserve the separation between static definitions, evaluated state, current signals, and historical events.

## 4. Status and next actions

| Area | Current status | Next acceptance evidence |
|---|---|---|
| Seed rerun idempotency | **Passed** on disposable PostgreSQL 16 | Review patch; existing live duplicates remain untouched |
| Live API contract | Static shape inspected; live HTTP not yet independently verified in this audit | Read-only endpoint payload checks against the expected contract |
| Web UI / TypeScript | `main` has a known undefined `confidence` reference | Build and render checks on one exact candidate commit |
| Monitoring freshness | Static defect found: ingestion refreshes timestamps without signal evaluation | Separate ingestion from evaluation; regression test proving candles alone do not refresh signals |
| Scenario evaluator | Not demonstrated; no live scenario-state rows | Written contract and disposable-DB tests; no fabricated production state |
| Full BTC scenario | Not complete | Evidence-backed definitions, evaluator output, monitoring semantics and UI/API parity |

## Safety boundary

This audit did not execute SQL against Neon, apply production migrations, deploy code, change live observations, publish snapshots, or write scenario/event rows. The next work remains on the existing order: close API/UI and evaluator contract gaps, then complete one BTC scenario. Do not expand SOL/CAKE research or begin VPS deployment yet.


## Follow-up rehearsal findings — 2026-10-11 evening

The first three runs of [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38172372874) were useful contract checks, not evidence of a production failure:

- On run #337, shared runtime, VPS Worker build, VPS API build, clean PostgreSQL bootstrap and DB-health passed.
- Registry contract passed after aligning the expected enabled asset count with the canonical API response (10 enabled assets, 9 registered market pairs). The earlier assertion of 9 assets was stale.
- The ETH lifecycle/freshness contract passed.
- The empty clean-database persisted-history request returned HTTP 503 with `persisted_market_history_unavailable`, as implemented by the API when no daily candles exist yet. This is an explicit no-data response, not an API crash. The rehearsal assertion was updated to check this precise status/error/storage mode instead of demanding HTTP 200 with nonexistent rows.
- Run #337 then failed at the history assertion before worker-ingestion E2E. Therefore the monitoring timestamp regression assertion has **not yet run** and PR #13 is not accepted. Latest follow-up workflow execution has not yet appeared for the most recent commit; do not describe it as passed.

Next validation must run the latest PR #13 head and confirm all of: API contract, expected explicit empty-history response on a clean DB, Worker ingestion, candle natural-key idempotency, and unchanged monitoring evaluation timestamps. In particular, the monitoring timestamp test should include at least one existing signal fixture; otherwise comparing the maximum timestamp on an empty signal table is vacuous. The fixture must live only in disposable PostgreSQL, never Neon.
