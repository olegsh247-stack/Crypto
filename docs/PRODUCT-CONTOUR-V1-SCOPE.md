# Product Contour v1 — scope boundary

## Product purpose

Crypto is an evidence-backed crypto-asset research and monitoring product. Its job is to help a user understand an asset's thesis, the evidence behind it, what assumptions matter, how confident the research is, and which observable changes would confirm or weaken the thesis.

It is not a trading bot and Product Contour v1 does not need to create one.

## In scope

- Canonical asset registry and domain taxonomy.
- Versioned research snapshots with traceable Evidence and source provenance.
- Critical Factors, Scores and explicit methodology.
- Published Bull / Base / Bear research scenarios with assumptions, catalysts, risks and invalidation conditions.
- Metric observations with source URL/ID, observed timestamp, calculation method, freshness and status.
- Monitoring that compares new, traceable evidence with the published research assumptions.
- Explainable monitoring events linked to the observation, source, snapshot and methodology version.
- A clear distinction between a published research baseline and a scenario state actually evaluated against current evidence.

## Explicitly out of scope for Product Contour v1

- Buy/sell, entry/exit or market-timing recommendations.
- Order placement, execution, leverage or position sizing.
- Price-target predictions presented as facts.
- Automatic probability updates from arbitrary indicator thresholds.
- Treating one short-window metric (price, ETF flows, hashrate or fee ratio) as a standalone trading signal.
- Expanding to more assets before one complete, auditable asset scenario is accepted.

## What "one complete scenario on BTC" means

1. A published BTC snapshot and its Base / Bull / Bear research definitions.
2. The important thesis assumptions and invalidation conditions are explicit.
3. Each monitored condition maps to a defined metric or evidence source and has an agreed calculation window.
4. Observations are source-linked, timestamped and freshness-checked; missing or stale data is shown as unavailable, not silently treated as neutral.
5. The evaluator emits either a documented result or a blocker. A material result can produce an explainable monitoring event linked to the relevant snapshot.
6. The UI distinguishes research judgment, measured evidence and current monitoring status.
7. Tests cover stale/missing data, conflicting evidence, duplicate observations, event idempotency and snapshot changes.

This is a research-evidence workflow, not a strategy backtest. Historical validation is still appropriate for checking that data and rules behave consistently, but it is not a claim that the product predicts prices.

## Current implementation boundary

The pure readiness gate and the offline BTC-Scenario-Rule-v1 prototype do not access the database or persist states/events. The directional prototype is retained only as an experiment and is not approved product behavior. Product acceptance should focus on evidence-linked confirmation/invalidation conditions, not on the prototype's Bull/Base/Bear score.
