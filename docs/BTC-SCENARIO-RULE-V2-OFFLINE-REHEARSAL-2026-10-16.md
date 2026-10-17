# BTC Scenario Rule v2 — offline historical rehearsal

**Date recorded:** 2026-10-16  
**Mode:** deterministic calculation on the already reviewed 2026-10-12 source-candidate fixture. No live fetch, database access/write, ingestion, scenario-state persistence, probability change, deployment, or merge.

## Input values

The fixture values are those already embedded in `scripts/btc-scenario-direction.test.mjs` under “source-reviewed October 12 fixture”; they are retained as historical candidates, not promoted to current observations.

| Input | Fixture values | Calculation | Rule input |
|---|---|---|---:|
| BTC spot price | 86,480.30 → 83,679.46 USD/BTC | `(83679.46 / 86480.30 - 1) × 100` | **−3.2383%** |
| ETF net flow | −89.8, +118.8, −484.9, −244.1, +21.1 USD million | Sum of five completed sessions | **−678.9 USD million** |
| Hashrate change | +1% candidate | Below ±3% directional threshold | **0 signal** |
| DXY change | 102.24 → 102.39 | `(102.39 / 102.24 - 1) × 100` | **+0.1467%**, neutral under current thresholds |
| Fee/subsidy ratio | fees 0.0129 BTC / subsidy 3.125 BTC | `0.0129 / 3.125` | **0.004128**, context only |

## Deterministic Rule v2 output

- Price return −3.2383% is inside the ±5% threshold: **0**.
- Five-session ETF flow −678.9 million is at/below the −500 million threshold: **−1**.
- Hashrate change +1% is inside the ±3% threshold: **0**.
- DXY change +0.1467% is inside the ±0.5% threshold: **0**.
- Fee/subsidy ratio does not contribute to directional score.

**Directional score: −1. Scenario label: Base. Confidence band: low.** The output is a historical offline rule rehearsal, not a live or current recommendation.

## Why this does not pass current readiness

1. The ETF candidate's latest confirmed session is 2026-10-09; the registry requires a current latest row within 36 hours, plus five distinct recent sessions, source lineage, revision/finality and complete-fund controls. Its `observed_at` is unverified.
2. The BTC price fixture is historical and does not satisfy the registry's 1-hour freshness window.
3. The hashrate and DXY candidates are optional context and are not blockers by themselves; the fee/subsidy ratio is optional non-directional context. Missing optional values must be omitted, never imputed.
4. No current input gate passed, so the result must not be persisted as a `scenario_state`, used to change baseline probabilities, or presented as a fresh evaluation.

## Contract decisions confirmed

- Required directional inputs: price return over seven days and the five-session ETF net-flow sum.
- Readiness source gate: current, registered, allowed-source observations with canonical units, actual observation/reporting times, source row key and payload hash.
- ETF gate: a valid current latest row and at least five distinct reporting days, plus full-fund completeness and revision/finality evidence.
- Optional context: hashrate and DXY; fee/subsidy ratio is non-directional context only.
- `can_persist_scenario_state = false` remains mandatory for this rehearsal.

## Decision

The rule's offline behavior is sufficiently specified for this historical fixture. The result is **Base / score −1 / low confidence, historical only**. The actual BTC scenario remains `not_evaluable` until the required current price and ETF flow inputs pass readiness. No rule thresholds, baseline probabilities, metric registry, runtime, or database were changed.
