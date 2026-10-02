# Crypto — Architecture ↔ Neon DB Mapping

## Purpose

This document connects **Structure 1** to the current Neon/PostgreSQL model and defines the contract used by the Dynamic Asset Engine.

Structure 1 remains the architectural source of truth. This document describes how its concepts are persisted and read from the database.

## 1. Core entities

| Structure 1 concept | Neon table / source | Role |
|---|---|---|
| Asset | `assets` | Canonical research subject |
| Asset Type | `asset_types` | Determines relevant metrics and Critical Factors |
| Pair | `market_pairs` | Market instrument; separate from Asset |
| Market history | `market_daily_candles` | Asset market observations |
| Metric observation | `observations` | Evidence/data layer |
| Source | `sources` | Evidence provenance |
| Research Snapshot | `research_snapshots` | Immutable-ish research state by version |
| Research Block 01–15 | `research_blocks` | Full Deep Research sections |
| Research Domain | `research_domains` | Six Dashboard aggregation domains |
| Block ↔ Domain | `research_block_domains` | Many-to-many mapping |
| Critical Factor | `critical_factors` | Asset-specific thesis drivers |
| Score | `scores` | Health / Thesis / Value Accrual / related scores |
| Scenario | `scenario_states` | Current and historical scenarios |
| Monitoring event | `monitoring_events` | New-data / change events |
| Monitoring signal | `monitoring_signals` | Signal state and thesis impact |
| Research status | `research_status` | Current research lifecycle state |

## 2. Research flow

```text
ASSET
  ↓
Asset Type
  ↓
Observations + Sources + Market Data
  ↓
Research Snapshot
  ↓
Research Blocks 01–15
  ↓
Research Domains
  ↓
Critical Factors
  ↓
Scores + Scenarios
  ↓
Monitoring Signals / Events
  ↓
Research Status
  ↓
Dashboard
```

## 3. Invariants

1. `assets` is the research subject; `market_pairs` is a market instrument.
2. Research is attached to `asset_id`, not to a Pair.
3. A Pair can provide market data for an Asset but does not become the research identity.
4. A Research Snapshot contains the complete research state for a point in time.
5. `research_blocks` preserve the original 01–15 structure.
6. Domains aggregate blocks; they do not replace the 15 blocks.
7. Monitoring can change current status without silently rewriting historical research.
8. Evidence is traceable through observations and sources.
9. Asset Type controls relevance; unavailable or irrelevant metrics remain `N/A` rather than being fabricated.
10. Critical Factors are Asset-specific.

## 4. Research block contract

The current API calculates progress from `research_blocks.block_number` and `research_blocks.status`.

Canonical numbering:

01 Essence & Role
02 Technology & Architecture
03 Tokenomics
04 Network / Protocol State
05 Ecosystem
06 Users & Activity
07 Institutions & Capital
08 Governance / Protocol Economics
09 Macro
10 Competition & Alternatives
11 Risks
12 Catalysts
13 Scenarios
14 Conclusion
15 Monitoring

Completion states accepted by the API are normalized from:

`COMPLETED`, `PUBLISHED`, `DONE`, `COMPLETE`, `RESEARCH COMPLETE`.

## 5. Research status contract

The engine exposes:

- `Not started`
- `In progress`
- `Research complete`
- `Monitoring`

Progress is derived from the 15 research blocks. Block 15 being complete is required for the final `Monitoring` state.

## 6. Evidence contract

For material conclusions the intended chain is:

`DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS`

Persistence should keep these layers distinguishable:

- Data: `observations`, `market_daily_candles`
- Provenance: `sources`
- Signal: `monitoring_signals`
- Assessment: research block/domain content
- Confidence: block/factor/score confidence fields
- Thesis impact: monitoring signal / critical factor fields
- Status: research status / signal status / factor state

## 7. Dashboard contract

The dashboard should read aggregated state rather than reconstructing Deep Research itself.

Required dashboard concepts:

- Asset / Ticker / Asset Type
- Health Score
- Thesis Score
- Value Accrual Score
- Confidence
- Current Scenario
- Main Catalyst
- Main Risk
- Six Research Domains
- Key Signals
- Research Status

The main interface must not expose `ETH-01`, `ETH-02`, etc. as primary navigation.

## 8. Dynamic Asset Engine contract

For an Asset request the API should return, in one coherent payload where available:

1. canonical Asset identity;
2. Asset Type;
3. current Research Status and progress;
4. latest observations/metrics;
5. market history;
6. latest Research Snapshot;
7. Research Blocks 01–15;
8. six Research Domains;
9. Critical Factors;
10. Scores;
11. Scenario States;
12. Monitoring Events;
13. Monitoring Signals;
14. Sources.

The current `/api/assets/:assetId` endpoint is the integration point for this contract.

## 9. First implementation target

The first complete Asset implementation is **ETH**.

Before generating ETH research content, the engine must be able to:

- identify ETH as an Asset;
- identify its Asset Type;
- persist/retrieve its 15 research blocks;
- calculate research progress;
- expose the six domains;
- expose Critical Factors;
- expose scores and scenarios;
- expose monitoring state;
- keep Pair data separate.

## 10. What this document does not do

This mapping does not invent missing database columns or force Structure 1 concepts into unrelated tables. If a required concept is not represented by the current schema, it must be added deliberately in a separate migration rather than hidden in JSON or silently overloaded into another field.

---

**Status:** implementation contract for Structure 1 ↔ Neon ↔ Dynamic Asset Engine.
