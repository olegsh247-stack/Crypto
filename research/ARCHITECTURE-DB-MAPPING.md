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
| Research Snapshot | `research_snapshots` | Research state by version |
| Research Block 01–15 | `research_blocks` | Full Structure 1 sections |
| Research Domain | `research_domains` | Six Dashboard aggregation domains |
| Block ↔ Domain | `research_block_domains` | Many-to-many mapping |
| Critical Factor | `critical_factors` | Asset-specific thesis drivers |
| Score | `research_scores` | Research scores |
| Scenario | `scenario_states` | Current and historical scenarios |
| Monitoring event | `monitoring_events` | New-data / change events |
| Monitoring signal | `monitoring_signals` | Signal state and thesis impact |
| Research freshness | `research_status` | `current / update_recommended / outdated` |

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
Research Lifecycle + Freshness
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
7. Monitoring can change current state without silently rewriting historical research.
8. Evidence is traceable through observations and sources.
9. Asset Type controls relevance; unavailable or irrelevant metrics remain `N/A` rather than being fabricated.
10. Critical Factors are Asset-specific.
11. The API and Web use the same shared Research Status contract.
12. Pair interpretation is generic: base-vs-quote performance is described from the pair itself; no asset-specific pair text is permitted in the engine.

## 4. Research block contract

The canonical block record uses:

- `research_block_id`
- `block_number`
- `title`
- `status`

Canonical block statuses are:

`not_started / partial / complete / n_a`

Legacy aliases such as `COMPLETED`, `PUBLISHED`, `DONE` and `RESEARCH COMPLETE` are normalized at the boundary into `complete`; they are not separate canonical states.

## 5. Research status contract

Research status has **two independent dimensions**.

### Lifecycle — derived from the 15 blocks

```text
not_started
in_progress
complete
monitoring
```

The Web displays these through the shared lifecycle labels:

`Not started / In progress / Research complete / Monitoring`.

### Freshness — persisted in `research_status.status`

```text
current
update_recommended
outdated
```

Freshness is not a lifecycle state and must never overwrite lifecycle information. API responses expose both:

- `asset.research_status` / `research_progress` → lifecycle
- `research_freshness` → DB freshness

## 6. API ↔ Web contract

The API returns canonical database identifiers, including:

- `research_block_id`
- `research_domain_id`
- `critical_factor_id`
- `score_id`
- `monitoring_signal_id`
- `scenario_state_id`

The Web must use these identifiers as React keys and must map `block_number` rather than expecting a legacy `number` field.

The Web uses the shared contract in `shared/research-status-contract.ts` for normalization and labels.

## 7. Evidence contract

For material conclusions the intended chain is:

`DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS`

Persistence keeps these layers distinguishable:

- Data: `observations`, `market_daily_candles`
- Provenance: `sources`
- Signal: `monitoring_signals`
- Assessment: research block/domain content
- Confidence: block/factor/score confidence fields
- Thesis impact: monitoring signal / critical factor fields
- Status: lifecycle + freshness, kept as separate dimensions

## 8. Dashboard contract

The dashboard reads aggregated state rather than reconstructing Deep Research itself.

Required concepts:

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
- Research Lifecycle
- Research Freshness

The main interface must not expose `ETH-01`, `ETH-02`, etc. as primary navigation.

## 9. Dynamic Asset Engine contract

For an Asset request the API should return, in one coherent payload where available:

1. canonical Asset identity;
2. Asset Type;
3. current Research Lifecycle and progress;
4. Research Freshness;
5. latest observations/metrics;
6. market history;
7. latest Research Snapshot;
8. Research Blocks 01–15;
9. six Research Domains;
10. Critical Factors;
11. Scores;
12. Scenario States;
13. Monitoring Events;
14. Monitoring Signals;
15. Sources.

The `/api/assets/:assetId` endpoint is the integration point for this contract.

## 10. First implementation target

The first complete Asset implementation is **ETH**.

Before generating ETH research content, the engine must be able to:

- identify ETH as an Asset;
- identify its Asset Type;
- persist/retrieve its 15 research blocks;
- calculate lifecycle progress;
- expose research freshness separately;
- expose the six domains;
- expose Critical Factors;
- expose scores and scenarios;
- expose monitoring state;
- keep Pair data separate.

## 11. CI contract

Changes under `shared/**` trigger both Web build and Worker deployment workflows. The Web TypeScript project explicitly includes `../shared/**/*.ts`.

## 12. What this document does not do

This mapping does not invent missing database columns or force Structure 1 concepts into unrelated tables. If a required concept is not represented by the current schema, it must be added deliberately in a separate migration rather than hidden in JSON or silently overloaded into another field.

---

**Status:** implementation contract for Structure 1 ↔ Neon ↔ Dynamic Asset Engine.
