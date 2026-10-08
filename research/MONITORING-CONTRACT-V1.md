# Crypto — Monitoring Contract v1

**Status:** FROZEN PRODUCT CONTRACT  
**Scope:** Monitoring semantics, responsibilities and presentation layers  
**Design:** visual styling is out of scope  
**Infrastructure/VPS:** out of scope

## 1. Purpose

Monitoring is the current-state layer after a Research Snapshot.

It answers two questions:

1. What changed?
2. Does that change the thesis?

Monitoring must not rewrite a historical Research Snapshot.

## 2. Three-layer model

Monitoring is one product block with three clearly separated responsibilities:

```
MONITORING
│
├── DASHBOARD — What does it mean?
│
├── SIGNALS   — What is happening now?
│
└── EVENTS    — What changed?
```

These are not three independent systems and not three primary product routes.

The user enters Monitoring through the Dashboard. Signals and Events provide drill-down detail.

## 3. Dashboard

**Question:** What does the current monitoring state mean?

Dashboard is the interpretation layer. It aggregates current Signals and recent Events and connects them to Critical Factors and the current Scenario.

Dashboard should expose, where data is available:

- overall monitoring state;
- most important improving signals;
- most important deteriorating signals;
- material recent events;
- thesis impact;
- current scenario context;
- what to watch next.

Dashboard must not invent a new source of truth. It reads aggregated state from Signals and Events.

Example conceptual output:

```
Monitoring

What changed?
  Institutional demand ↑
  Fee-market strength ↓

What matters?
  Fee-market weakness is the main negative signal.

Thesis impact
  Positive overall, but miner economics require attention.

Current scenario
  Base

Watch next
  Fee revenue
  Mining concentration
  Institutional flows
```

## 4. Signals

**Question:** What is happening now?

A Signal is a persistent current-state representation of an important thesis driver.

Canonical fields already supported by the current model include:

- `monitoring_signal_id`
- `asset_id`
- `critical_factor_id`
- `metric_id`
- `name`
- `current_value`
- `previous_value`
- `direction`
- `thesis_impact`
- `status`
- `confidence`
- `last_updated_at`

Canonical direction values:

- `improving`
- `stable`
- `deteriorating`
- `mixed`
- `unknown`

Canonical thesis impact values:

- `positive`
- `neutral`
- `negative`
- `mixed`

Canonical signal status values:

- `active`
- `watch`
- `triggered`
- `disabled`

A Signal is not an event history. Its current state may change over time.

## 5. Events

**Question:** What specifically changed?

An Event is a historical record of a material observation/change.

The existing database contract supports:

- `event_id`
- `asset_id`
- `metric_id`
- `event_type`
- `severity`
- `observed_at`
- `details`
- `status`
- `created_at`
- `closed_at`

Canonical event severity values already present in the schema:

- `INFO`
- `WATCH`
- `REVIEW`

Canonical event status values:

- `OPEN`
- `ACKNOWLEDGED`
- `CLOSED`

We do **not** introduce new severity/status enums in Monitoring v1 without a separate schema decision.

An Event should preserve enough detail to explain:

- what happened;
- when it happened;
- which metric/data point caused it;
- which Signal or Critical Factor was affected where applicable;
- the resulting thesis impact where that assessment exists;
- supporting evidence where available.

## 6. Relationship between Signal and Event

Signals and Events are deliberately different.

```
SIGNAL
Fee-market strength
Deteriorating
Negative
Watch

        ↑ caused / supported by

EVENT
Fee revenue weakened
8 Oct 2026
WATCH
```

A Signal can exist without a recent Event.

An Event can cause a Signal to change.

The current Signal is the state; Events are the historical explanation of changes.

## 7. Relationship to Research Snapshot

```
RESEARCH SNAPSHOT
       │
       │ baseline
       ↓
MONITORING
   ├── SIGNALS
   └── EVENTS
```

Research Snapshot is historical analytical state.

Monitoring is mutable/current state plus append-only change history.

No monitoring write may modify the contents of a prior Research Snapshot.

A new research cycle creates a new Research Snapshot rather than rewriting the old one.

## 8. Relationship to Critical Factors

Signals should connect to Critical Factors where applicable.

Example:

```
Critical Factor: Miner Economics
        ↓
Monitoring Signals
  ├── Hashprice
  ├── Fee-market strength
  ├── Miner revenue
  └── Mining concentration
        ↓
Current state
        ↓
Thesis impact
```

This prevents Monitoring from becoming an unrelated KPI dashboard.

## 9. Relationship to Scenarios

Monitoring does not automatically replace a Scenario.

Instead, monitoring can provide evidence that:

- supports the current scenario;
- weakens the current scenario;
- increases the probability of another scenario;
- requires a future research refresh.

Example:

```
Current Scenario: BASE

Institutional demand      Improving / Positive
Fee-market strength      Deteriorating / Negative

Result:
Base remains valid,
but Bear-case risk has increased.
```

Automatic scenario transitions are **not** part of Monitoring v1 unless a separate deterministic rule is explicitly defined.

## 10. Evidence chain

Monitoring follows the canonical evidence chain:

```
DATA
  ↓
METRIC
  ↓
SIGNAL
  ↓
ASSESSMENT
  ↓
CONFIDENCE
  ↓
THESIS IMPACT
  ↓
STATUS
```

The system must distinguish observed data from interpretation.

No metric or current value may be fabricated to make a Monitoring card complete.

## 11. Baseline and freshness

A completed Research Snapshot may become the Monitoring baseline.

The baseline must reference the exact `snapshot_id`.

Monitoring may change research freshness:

```
current
  ↓
update_recommended
  ↓
outdated
```

Monitoring must not change historical Research Block statuses.

## 12. Product navigation

Monitoring remains one Asset Dashboard section:

```
Asset Dashboard
  └── Monitoring
       ├── Dashboard
       ├── Current Signals
       └── Recent Events
```

These are internal Monitoring layers, not independent primary navigation.

Primary navigation remains:

```
Home / Assets / Research
```

## 13. Monitoring v1 implementation boundary

Before implementation changes:

1. preserve the existing DB schema and enums;
2. reuse the existing `monitoring_signals` and `monitoring_events` model;
3. expose the existing fields without overloading them;
4. improve the Asset Dashboard Monitoring section around the three-layer model;
5. only add schema/API fields when an existing contract cannot represent a required concept;
6. do not introduce realtime monitoring ingestion as part of this UI/semantic pass;
7. do not redesign the visual identity.

## 14. Current BTC baseline limitation

The current BTC Asset Card seeds Monitoring Signals with qualitative baseline descriptions in `current_value`.

Therefore the current BTC Monitoring state is a **research baseline**, not yet a fully live quantitative monitoring system.

The product must display this honestly.

A future monitoring ingestion layer may replace baseline values with measured observations and generate Events without changing this three-layer architecture.

## 15. Acceptance test

For an asset with monitoring data, the user must be able to:

1. open Monitoring;
2. understand the current monitoring conclusion from the Dashboard;
3. inspect current Signals;
4. inspect recent Events;
5. see which Critical Factors are affected;
6. understand thesis impact;
7. see the current Scenario context;
8. distinguish current state from historical events;
9. trace material conclusions toward data/evidence where available;
10. return to the rest of the Asset Dashboard without losing asset context.

**Status:** canonical Monitoring v1 contract.
