# BTC single-scenario offline contract review — 2026-10-16

## Scope

Read-only review of:
- `data/CryptoDataModel/registry/metric-registry.json`
- `vps/shared/src/btc-scenario-readiness.ts`
- `scripts/btc-scenario-direction.mjs`
- `scripts/btc-scenario-direction.test.mjs`

No live fetch, database access/write, ingestion, production action, deployment, or PR merge was performed.

## Contract cross-check

- The registry marks `market.spot_price` as required, unit `USD/BTC`, freshness `1h`, with Kraken Trades/XBTUSD URL prefix allowlisted.
- The registry marks `institutional.etf_net_flow` as required, unit `USD million/day`, freshness `36h`; its readiness policy additionally requires at least five distinct reporting dates in the last 14 days and an approved source URL.
- The readiness module derives required non-ETF inputs from the registry and handles ETF flow separately for the additional completeness/finality/history checks.
- Hashrate is not marked required by the registry. DXY explicitly has `required: false`. Fee/subsidy ratio has no readiness-required flag. The pure rule treats all three as optional and does not use fee/subsidy ratio as a directional signal.
- The rule refuses evaluation unless the caller passes `readiness_status: ready_for_rule_evaluation`; it does not fetch data, persist scenario state, or change baseline probabilities.

## Review finding

The visible `btc-scenario-direction.test.mjs` suite exercises the pure rule's direction thresholds, optional-input omission, fail-closed behavior when the readiness status is not ready, and no-persistence/no-probability-change contract. It does **not** directly test `assessBtcScenarioReadiness` against a matrix of fresh/stale, approved/unapproved, duplicate, future-dated, or incomplete ETF observations. I did not find a readiness-specific test file at the initially checked path; this is not proof that no such tests exist elsewhere.

Therefore the rule evaluator's fixture tests must not be described as proving the source-quality gate. Before treating the gate as fully regression-tested, add focused tests around the readiness module and its registry-derived constraints. Do not relax the gate to make candidate observations pass.

## Decision / current status

- No demonstrated mismatch was found between the registry's required/optional flags and the pure evaluator's documented required/optional input contract.
- The source-quality gate remains conservative; actual BTC scenario readiness remains `not_evaluable` on the last audited data because the required price/ETF inputs were stale or lacked complete provenance.
- The historical Rule v2 result (Base, score -1, low confidence) remains an offline fixture rehearsal only, not a current market assessment.
- No runtime, registry, thresholds, probabilities, scenario state, or database were changed in this review.
- PR #83 remains Draft and unmerged.

## Next step

Add and run dedicated readiness-gate regression tests in the existing project test harness. Only after that, a separate explicitly authorized action may refresh current required inputs; no live capture is authorized by this review.


## Regression coverage added after the review

Added `vps/shared/test/btc-scenario-readiness.test.mjs` and a package test command (`npm test`) that builds the TypeScript runtime and runs Node's test runner. The new suite covers a valid complete input set, stale spot price, unapproved source, future-dated spot observation, incomplete ETF fund coverage, duplicate reporting dates, and missing ETF revision/finality evidence.

**Execution status:** tests have been added but have not yet been executed in this environment. Do not interpret test existence as a passing result. The next low-cost verification is to run `npm test` in `vps/shared` / confirm the existing non-production CI runs it. No live capture, DB write, deployment, or merge was performed.


## Update 2026-10-17 — CI evidence and evaluator status fail-closed regression

The dedicated readiness tests are now confirmed by GitHub Actions run [#298](https://github.com/olegsh247-stack/Crypto/actions/runs/38965974798), which succeeded on `bb5ad42002f7826505bf311f02e5b9444e0f0af3`. Coverage includes fresh/traced inputs, stale spot, unapproved source, future timestamp, incomplete ETF coverage, duplicate reporting dates, and missing revision/finality evidence.

A further offline regression test was added in commit `9d50d4d5caedca54f3003e0eec85435ddfc50309` to ensure missing or unknown `readiness_status` fails closed without scenario output or persistence permission. This additional test is pending CI; no PASS is claimed yet. BTC remains `not_evaluable` on audited real candidates. No live capture, database writes, ingestion, deployment, probability/state change, or PR merge occurred; PR #83 remains Draft.


### CI result for the follow-up regression

GitHub Actions [BTC Scenario Readiness Gate #299](https://github.com/olegsh247-stack/Crypto/actions/runs/38966644329) completed successfully on commit `9d50d4d5caedca54f3003e0eec85435ddfc50309`. The new missing/unknown-readiness-status fail-closed regression is therefore CI-confirmed. This verifies offline behavior only; actual BTC inputs remain `not_evaluable` until freshness and provenance blockers are cleared through a separately authorized data update.
