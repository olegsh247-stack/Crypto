# CryptoDataModel v2 — Research Engine Layer

**Status:** Design specification — not yet migrated to Neon  
**Baseline:** CryptoDataModel v1 + Structure 1  
**Purpose:** Extend the existing data model without breaking v1.

## 1. Design principles

1. v1 remains the storage foundation.
2. Research snapshots are immutable historical records.
3. Monitoring is separate from full research refreshes.
4. One research block may feed multiple Dashboard Domains.
5. Asset Type determines applicable metrics and research questions.
6. Facts, calculations, assessments, hypotheses and sources remain distinguishable.
7. Scores are versioned and explainable; never store an unexplained number.
8. `N/A` is valid when a metric or research concept is not applicable to an Asset.
9. Historical observations and research snapshots are not silently overwritten.
10. This document is a schema design only. No Neon migration should be created until BTC, ETH, SOL and CAKE pass validation.

## 2. Core relationship

```text
Asset
 ├── Asset Type
 ├── Metrics
 │    └── Observations ── Source
 ├── Research Snapshot
 │    ├── Research Blocks 01–15
 │    ├── Research Domains
 │    ├── Evidence
 │    ├── Critical Factors
 │    ├── Scores
 │    ├── Scenarios
 │    └── Sources
 └── Monitoring
      └── Signals / Events
```

## 3. Existing v1 entities retained

### Asset
Identity and canonical metadata for the crypto asset.

### MetricDefinition
Definition of a measurable metric, including applicability and provenance requirements.

### Observation
Immutable time-stamped metric observation. An observation may reference its source and methodology.

### Source
Canonical source registry entry.

### ResearchSnapshot
Immutable full research state for an Asset at a point in time.

### MonitoringEvent
A detected or recorded change relevant to ongoing monitoring.

### ScenarioState
Bull / Base / Bear scenario state and related assumptions.

## 4. v2 additions

### AssetType
Defines the economic/protocol class of an Asset.

Recommended fields:

- `id`
- `code`
- `name`
- `description`
- `parent_type_id` nullable
- `is_active`
- `created_at`
- `updated_at`

Initial types:

- `monetary_asset`
- `l1_settlement_asset`
- `l1_execution_asset`
- `l2_scaling_asset`
- `defi_protocol_token`
- `infrastructure_token`
- `stablecoin`
- `privacy_asset`
- `governance_token`
- `exchange_platform_token`
- `rwa_related_asset`
- `other`

Asset receives:

- `primary_asset_type_id`
- optional `secondary_asset_type_id`

---

### ResearchBlock
One of the 15 canonical research sections within a ResearchSnapshot.

Fields:

- `id`
- `research_snapshot_id`
- `block_number` (1–15)
- `title`
- `status`
- `summary`
- `analysis`
- `confidence`
- `created_at`

The block number is stable across Assets even though its detailed content is Asset-specific.

Canonical blocks:

1. Essence & Role
2. Technology & Architecture
3. Tokenomics
4. Network / Protocol State
5. Ecosystem
6. Users & Activity
7. Institutions & Capital
8. Governance / Protocol Economics
9. Macro
10. Competition & Alternatives
11. Risks
12. Catalysts
13. Scenarios
14. Conclusion
15. Monitoring

---

### ResearchDomain
The six user-facing Dashboard domains.

Fields:

- `id`
- `code`
- `name`
- `description`
- `display_order`

Canonical domains:

1. `foundation` — Foundation
2. `technology_infrastructure` — Technology & Infrastructure
3. `economics_ecosystem` — Economics & Ecosystem
4. `adoption_capital` — Adoption & Capital
5. `competition_environment` — Competition & Environment
6. `thesis_outlook` — Thesis & Outlook

---

### ResearchBlockDomain
Many-to-many mapping between ResearchBlock and ResearchDomain.

Fields:

- `research_block_id`
- `research_domain_id`
- `relevance_weight` nullable
- `display_order` nullable

Reason: one research block may feed more than one Dashboard Domain. Example: BTC block 04 can contribute to Technology & Infrastructure and Adoption & Capital.

---

### Evidence
Connects an analytical claim to supporting data and sources.

Fields:

- `id`
- `research_snapshot_id`
- `research_block_id` nullable
- `research_domain_id` nullable
- `observation_id` nullable
- `source_id` nullable
- `evidence_type`
- `claim`
- `data_summary`
- `signal`
- `assessment`
- `confidence`
- `thesis_impact`
- `status`
- `as_of`
- `created_at`

Recommended `evidence_type` values:

- `fact`
- `calculation`
- `assessment`
- `hypothesis`

Recommended `signal` values:

- `improving`
- `stable`
- `deteriorating`
- `mixed`
- `unknown`

Recommended `thesis_impact` values:

- `positive`
- `neutral`
- `negative`
- `mixed`

Recommended `status` values:

- `strong`
- `watch`
- `weak`
- `unknown`

An Evidence record should make this chain reconstructable:

`DATA → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS`

---

### CriticalFactor
Asset-specific factor that materially influences the thesis.

Fields:

- `id`
- `asset_id`
- `research_snapshot_id`
- `name`
- `description`
- `importance_weight`
- `current_state`
- `trend`
- `confidence`
- `thesis_impact`
- `monitoring_priority`
- `created_at`

Target count: 3–7 per Asset snapshot.

Examples:

BTC:
- Monetary Demand
- Scarcity
- Network Security
- Institutional Adoption

CAKE:
- Protocol Usage
- Trading Volume
- Liquidity
- Token Utility
- Value Accrual

---

### Score
Versioned, explainable analytical score.

Fields:

- `id`
- `asset_id`
- `research_snapshot_id`
- `score_type`
- `value`
- `scale_min`
- `scale_max`
- `methodology_version`
- `confidence`
- `explanation`
- `calculated_at`

Initial score types:

- `health`
- `thesis`
- `value_accrual`
- `confidence`
- `competitive_position`

`competitive_position` may use a categorical representation rather than a numeric value; do not force numeric precision where the methodology is qualitative.

---

### Scenario
Versioned scenario definition associated with a ResearchSnapshot.

Fields:

- `id`
- `research_snapshot_id`
- `scenario_type`
- `probability` nullable
- `assumptions`
- `supporting_evidence`
- `invalidation_conditions`
- `thesis_impact`
- `confidence`
- `created_at`

Initial scenario types:

- `bull`
- `base`
- `bear`

Scenarios are not forecasts. Probabilities must remain nullable unless the methodology explicitly supports a defensible probability estimate.

---

### MonitoringSignal
Current monitoring state derived from observations/events and linked to a critical factor or thesis.

Fields:

- `id`
- `asset_id`
- `critical_factor_id` nullable
- `metric_id` nullable
- `monitoring_event_id` nullable
- `name`
- `current_value` nullable
- `previous_value` nullable
- `direction`
- `threshold` nullable
- `threshold_type` nullable
- `thesis_impact`
- `status`
- `confidence`
- `last_updated_at`

Monitoring signals are mutable current state; the underlying Observation/Event history remains immutable.

---

### ResearchStatus
Current freshness/state indicator for an Asset's research.

Fields:

- `id`
- `asset_id`
- `research_snapshot_id`
- `status`
- `reason`
- `last_research_at`
- `last_major_update_at`
- `next_review_at` nullable
- `updated_at`

Initial statuses:

- `current`
- `update_recommended`
- `outdated`

A major monitoring change can move status from `current` to `update_recommended` without rewriting the historical snapshot.

## 5. Mapping from Structure 1

```text
Research 01–15
      ↓
ResearchBlock
      ↓
ResearchBlockDomain
      ↓
ResearchDomain
      ↓
Evidence / CriticalFactor / Score
      ↓
Dashboard
```

Monitoring is parallel, not a replacement for Research:

```text
Research Snapshot
      ↓
Initial Thesis
      ↓
Critical Factors
      ↓
Monitoring Signals
      ↓
Change Detection
      ↓
Research Status
      ↓
Research Refresh when justified
```

## 6. BTC validation mapping

| BTC block | Primary domain | Secondary domain(s) |
|---|---|---|
| 01 Essence & Role | Foundation | Thesis & Outlook |
| 02 Technology & Architecture | Technology & Infrastructure | — |
| 03 Tokenomics | Economics & Ecosystem | Thesis & Outlook |
| 04 Network / On-chain State | Technology & Infrastructure | Adoption & Capital |
| 05 Ecosystem | Economics & Ecosystem | Adoption & Capital |
| 06 Users & Activity | Adoption & Capital | Economics & Ecosystem |
| 07 Institutions & Capital | Adoption & Capital | Thesis & Outlook |
| 08 Governance / Protocol Economics | Economics & Ecosystem | Thesis & Outlook |
| 09 Macro | Competition & Environment | Thesis & Outlook |
| 10 Competition & Alternatives | Competition & Environment | Thesis & Outlook |
| 11 Risks | Thesis & Outlook | — |
| 12 Catalysts | Thesis & Outlook | — |
| 13 Scenarios | Thesis & Outlook | — |
| 14 Conclusion | Thesis & Outlook | — |
| 15 Monitoring | Monitoring | — |

## 7. Asset-type behavior

### BTC
Primary type: Monetary Asset.

Emphasize monetary demand, scarcity, security, institutional adoption and macro sensitivity.

### ETH
Primary type: L1 / Settlement Asset.

Emphasize settlement, staking, execution ecosystem, L2, fees, value accrual and developer/economic activity.

### SOL
Primary type: L1 / Execution Asset.

Emphasize execution performance, validators, network health, applications, ecosystem growth, liquidity and value accrual.

### CAKE
Primary type: DeFi Protocol Token.

Do not force L1 network metrics. Emphasize protocol usage, trading volume, liquidity, token utility, supported infrastructure and value accrual. Non-applicable network metrics may be `N/A`.

## 8. Integrity rules

- Never overwrite an immutable ResearchSnapshot.
- Never overwrite an immutable Observation.
- Do not silently change methodology versions.
- Do not manufacture values for non-applicable metrics.
- Do not calculate a score without storing its methodology version and explanation.
- Do not treat protocol/network success as automatic token success.
- Do not treat scenarios as forecasts.
- Preserve source provenance for material claims.
- Keep current Monitoring state separate from historical Research snapshots.

## 9. Migration gate

Before creating Neon SQL/migrations, validate this model against:

- BTC
- ETH
- SOL
- CAKE

Validation must confirm:

1. All 15 research blocks can be represented.
2. All six Dashboard Domains can be populated.
3. One block can map to multiple domains.
4. Asset-specific Critical Factors work.
5. Evidence can trace claims to observations/sources.
6. Scores are explainable and versioned.
7. Monitoring can update without rewriting Research.
8. Research Status can indicate when a refresh is required.
9. Non-applicable metrics can be represented cleanly.
10. Existing v1 API behavior remains compatible.

**No production database migration until all ten checks pass.**
