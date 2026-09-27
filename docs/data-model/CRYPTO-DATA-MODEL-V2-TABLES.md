# CryptoDataModel v2 — Tables, Fields, Relations & Constraints

**Status:** Design specification only — no Neon migration yet.

This document translates `CRYPTO-DATA-MODEL-V2.md` into a database-oriented specification. Existing v1 tables remain the foundation; v2 adds only the Research Engine layer.

## 1. Existing v1 tables — retained

| Table | Role | v2 action |
|---|---|---|
| `assets` | canonical asset identity | extend with asset-type FK if needed |
| `metric_definitions` | metric registry | retain |
| `observations` | immutable measurements | retain |
| `sources` | source registry | retain |
| `research_snapshots` | immutable research snapshots | retain/extend |
| `monitoring_events` | historical monitoring events | retain |
| `scenario_states` | existing scenario state | retain; reconcile with v2 `research_scenarios` before migration |

## 2. New / extended tables

### `asset_types`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `code` | text | no | UNIQUE, lowercase snake_case |
| `name` | text | no | |
| `description` | text | yes | |
| `parent_type_id` | uuid | yes | FK → `asset_types.id` |
| `is_active` | boolean | no | DEFAULT true |
| `created_at` | timestamptz | no | DEFAULT now() |
| `updated_at` | timestamptz | no | DEFAULT now() |

Initial codes: `monetary_asset`, `l1_settlement_asset`, `l1_execution_asset`, `l2_scaling_asset`, `defi_protocol_token`, `infrastructure_token`, `stablecoin`, `privacy_asset`, `governance_token`, `exchange_platform_token`, `rwa_related_asset`, `other`.

### `assets` — extension

Add:

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `primary_asset_type_id` | uuid | yes initially | FK → `asset_types.id` |
| `secondary_asset_type_id` | uuid | yes | FK → `asset_types.id` |

Do not make the primary type NOT NULL until existing assets have been classified.

### `research_blocks`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE CASCADE |
| `block_number` | smallint | no | CHECK 1 ≤ value ≤ 15 |
| `title` | text | no | |
| `status` | text | no | CHECK in `complete`, `partial`, `n_a`, `not_started` |
| `summary` | text | yes | |
| `analysis` | text | yes | |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `created_at` | timestamptz | no | DEFAULT now() |

Unique constraint: `(research_snapshot_id, block_number)`.

### `research_domains`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `code` | text | no | UNIQUE |
| `name` | text | no | |
| `description` | text | yes | |
| `display_order` | smallint | no | UNIQUE |

Seed rows are the six canonical domains from Structure 1.

### `research_block_domains`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `research_block_id` | uuid | no | FK → `research_blocks.id` ON DELETE CASCADE |
| `research_domain_id` | uuid | no | FK → `research_domains.id` ON DELETE RESTRICT |
| `relevance_weight` | numeric(6,5) | yes | CHECK 0 ≤ value ≤ 1 |
| `display_order` | smallint | yes | |

Primary key: `(research_block_id, research_domain_id)`.

### `evidence`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE CASCADE |
| `research_block_id` | uuid | yes | FK → `research_blocks.id` ON DELETE SET NULL |
| `research_domain_id` | uuid | yes | FK → `research_domains.id` ON DELETE SET NULL |
| `observation_id` | uuid | yes | FK → `observations.id` ON DELETE SET NULL |
| `source_id` | uuid | yes | FK → `sources.id` ON DELETE SET NULL |
| `evidence_type` | text | no | CHECK fact/calculation/assessment/hypothesis |
| `claim` | text | no | |
| `data_summary` | text | yes | |
| `signal` | text | no | CHECK improving/stable/deteriorating/mixed/unknown |
| `assessment` | text | yes | |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `thesis_impact` | text | no | CHECK positive/neutral/negative/mixed |
| `status` | text | no | CHECK strong/watch/weak/unknown |
| `as_of` | timestamptz | yes | |
| `created_at` | timestamptz | no | DEFAULT now() |

At least one of `observation_id`, `source_id`, or a documented calculation/hypothesis context should exist for material evidence. Enforce the exact rule at application layer initially because DB-only enforcement would be overly rigid for qualitative research.

### `critical_factors`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `asset_id` | uuid | no | FK → `assets.id` ON DELETE CASCADE |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE CASCADE |
| `name` | text | no | |
| `description` | text | yes | |
| `importance_weight` | numeric(6,5) | yes | CHECK 0 ≤ value ≤ 1 |
| `current_state` | text | yes | |
| `trend` | text | yes | CHECK improving/stable/deteriorating/mixed/unknown |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `thesis_impact` | text | yes | CHECK positive/neutral/negative/mixed |
| `monitoring_priority` | smallint | yes | CHECK 1 ≤ value ≤ 5 |
| `created_at` | timestamptz | no | DEFAULT now() |

Unique constraint: `(research_snapshot_id, name)`.

Target 3–7 per Asset snapshot is a validation rule, not a hard DB constraint.

### `scores`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `asset_id` | uuid | no | FK → `assets.id` ON DELETE CASCADE |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE CASCADE |
| `score_type` | text | no | CHECK health/thesis/value_accrual/confidence/competitive_position |
| `value` | numeric(8,4) | yes | |
| `scale_min` | numeric(8,4) | yes | |
| `scale_max` | numeric(8,4) | yes | |
| `methodology_version` | text | no | |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `explanation` | text | no | |
| `calculated_at` | timestamptz | no | DEFAULT now() |

If numeric scoring is used, require `scale_min < scale_max` and `value BETWEEN scale_min AND scale_max`. Qualitative `competitive_position` may use NULL numeric value plus explanation.

Unique constraint: `(research_snapshot_id, score_type, methodology_version)`.

### `research_scenarios`

This is the v2 research representation of scenarios. Existing `scenario_states` remains until a reconciliation decision is made.

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE CASCADE |
| `scenario_type` | text | no | CHECK bull/base/bear |
| `probability` | numeric(6,5) | yes | CHECK 0 ≤ value ≤ 1 |
| `assumptions` | text | no | |
| `supporting_evidence` | text | yes | |
| `invalidation_conditions` | text | yes | |
| `thesis_impact` | text | yes | CHECK positive/neutral/negative/mixed |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `created_at` | timestamptz | no | DEFAULT now() |

Unique constraint: `(research_snapshot_id, scenario_type)`.

Do not force scenario probabilities to total 1 unless the research methodology explicitly declares them mutually exclusive and exhaustive.

### `monitoring_signals`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `asset_id` | uuid | no | FK → `assets.id` ON DELETE CASCADE |
| `critical_factor_id` | uuid | yes | FK → `critical_factors.id` ON DELETE SET NULL |
| `metric_id` | uuid | yes | FK → `metric_definitions.id` ON DELETE SET NULL |
| `monitoring_event_id` | uuid | yes | FK → `monitoring_events.id` ON DELETE SET NULL |
| `name` | text | no | |
| `current_value` | jsonb | yes | |
| `previous_value` | jsonb | yes | |
| `direction` | text | yes | CHECK improving/stable/deteriorating/mixed/unknown |
| `threshold` | jsonb | yes | |
| `threshold_type` | text | yes | |
| `thesis_impact` | text | yes | CHECK positive/neutral/negative/mixed |
| `status` | text | no | CHECK active/watch/triggered/disabled |
| `confidence` | numeric(5,4) | yes | CHECK 0 ≤ value ≤ 1 |
| `last_updated_at` | timestamptz | no | DEFAULT now() |

One current row per logical signal can be enforced later with a stable signal key. Historical changes belong in `monitoring_events` / observations, not by duplicating signal rows.

### `research_status`

| Field | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `asset_id` | uuid | no | FK → `assets.id` ON DELETE CASCADE |
| `research_snapshot_id` | uuid | no | FK → `research_snapshots.id` ON DELETE RESTRICT |
| `status` | text | no | CHECK current/update_recommended/outdated |
| `reason` | text | no | |
| `last_research_at` | timestamptz | no | |
| `last_major_update_at` | timestamptz | yes | |
| `next_review_at` | timestamptz | yes | |
| `updated_at` | timestamptz | no | DEFAULT now() |

Unique constraint: `(asset_id)` — one current Research Status per Asset.

## 3. Index plan

Minimum indexes:

- `assets(primary_asset_type_id)`
- `research_snapshots(asset_id, created_at DESC)`
- `research_blocks(research_snapshot_id, block_number)`
- `research_block_domains(research_domain_id)`
- `evidence(research_snapshot_id)`
- `evidence(observation_id)`
- `evidence(source_id)`
- `critical_factors(asset_id, research_snapshot_id)`
- `scores(asset_id, research_snapshot_id, score_type)`
- `research_scenarios(research_snapshot_id, scenario_type)`
- `monitoring_signals(asset_id, status)`
- `research_status(asset_id)` UNIQUE

## 4. Delete / history policy

- Research snapshots: never hard-delete in normal operation.
- Observations: never hard-delete in normal operation.
- Evidence: deleted only as part of deleting an unpublished/draft snapshot; published snapshot evidence is immutable.
- Monitoring signals: current state may be updated; historical changes must be represented by monitoring events and/or observations.
- Asset types/domains: deactivate rather than delete after use.

## 5. Migration order

1. Seed `asset_types`.
2. Seed `research_domains`.
3. Add nullable asset-type FKs to `assets`.
4. Create `research_blocks`.
5. Create `research_block_domains`.
6. Create `evidence`.
7. Create `critical_factors`.
8. Create `scores`.
9. Create `research_scenarios` only after reconciling `scenario_states`.
10. Create `monitoring_signals`.
11. Create `research_status`.
12. Backfill asset types for existing assets.
13. Validate BTC/ETH/SOL/CAKE fixtures.
14. Only then consider making required fields NOT NULL.

## 6. Migration blockers

Before production SQL is generated, resolve:

1. Exact v1 table names and column types in the current Neon schema.
2. Whether `assets.id`, `metric_definitions.id`, `observations.id`, `sources.id`, `research_snapshots.id`, and `monitoring_events.id` are UUIDs or another type.
3. Exact existing `scenario_states` semantics; avoid duplicate scenario systems.
4. Existing API compatibility requirements.
5. Whether RLS/auth exists or is planned.
6. Whether `jsonb` is already the project's standard for flexible metric/threshold values.

**This document intentionally does not contain executable SQL.**
