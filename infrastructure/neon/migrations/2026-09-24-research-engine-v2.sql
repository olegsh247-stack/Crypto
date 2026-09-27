-- CryptoDataModel v2 — Research Engine Layer
-- Safe additive migration on top of infrastructure/neon/schema-v1.sql.
-- No v1 table is dropped or renamed. Existing data is preserved.
-- This migration is intentionally not destructive.

BEGIN;

CREATE TABLE IF NOT EXISTS asset_types (
  asset_type_id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  parent_type_id text REFERENCES asset_types(asset_type_id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO asset_types (asset_type_id, code, name, description)
VALUES
  ('monetary_asset', 'monetary_asset', 'Monetary Asset', 'Asset primarily analyzed as money, store of value, or monetary network.'),
  ('l1_settlement_asset', 'l1_settlement_asset', 'L1 Settlement Asset', 'Native asset of a Layer-1 settlement and smart-contract network.'),
  ('l1_execution_asset', 'l1_execution_asset', 'L1 Execution Asset', 'Native asset of a Layer-1 optimized for high-throughput execution.'),
  ('l2_scaling_asset', 'l2_scaling_asset', 'L2 Scaling Asset', 'Asset associated with a Layer-2 scaling ecosystem.'),
  ('defi_protocol_token', 'defi_protocol_token', 'DeFi Protocol Token', 'Token whose primary relevance is a decentralized finance protocol.'),
  ('infrastructure_token', 'infrastructure_token', 'Infrastructure Token', 'Token associated with crypto infrastructure or middleware.'),
  ('stablecoin', 'stablecoin', 'Stablecoin', 'Token designed to maintain a stable reference value.'),
  ('privacy_asset', 'privacy_asset', 'Privacy Asset', 'Asset with privacy as a core protocol property or thesis.'),
  ('governance_token', 'governance_token', 'Governance Token', 'Token whose primary utility includes protocol governance.'),
  ('exchange_platform_token', 'exchange_platform_token', 'Exchange Platform Token', 'Token tied to an exchange or trading platform ecosystem.'),
  ('rwa_related_asset', 'rwa_related_asset', 'RWA-related Asset', 'Asset materially connected to real-world asset infrastructure.'),
  ('other', 'other', 'Other', 'Fallback classification when no specific type is appropriate.')
ON CONFLICT (asset_type_id) DO NOTHING;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS primary_asset_type_id text REFERENCES asset_types(asset_type_id),
  ADD COLUMN IF NOT EXISTS secondary_asset_type_id text REFERENCES asset_types(asset_type_id);

CREATE INDEX IF NOT EXISTS assets_primary_asset_type_idx
  ON assets (primary_asset_type_id);

CREATE INDEX IF NOT EXISTS assets_secondary_asset_type_idx
  ON assets (secondary_asset_type_id);

CREATE TABLE IF NOT EXISTS research_domains (
  research_domain_id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  display_order smallint NOT NULL UNIQUE
);

INSERT INTO research_domains (research_domain_id, code, name, description, display_order)
VALUES
  ('foundation', 'foundation', 'Foundation', 'Core identity, role, purpose and monetary/economic function.', 1),
  ('technology_infrastructure', 'technology_infrastructure', 'Technology & Infrastructure', 'Protocol architecture, network health, infrastructure and technical capability.', 2),
  ('economics_ecosystem', 'economics_ecosystem', 'Economics & Ecosystem', 'Token economics, incentives, applications, liquidity and ecosystem economics.', 3),
  ('adoption_capital', 'adoption_capital', 'Adoption & Capital', 'Users, activity, institutions, capital flows and adoption.', 4),
  ('competition_environment', 'competition_environment', 'Competition & Environment', 'Competitors, alternatives, macro and external environment.', 5),
  ('thesis_outlook', 'thesis_outlook', 'Thesis & Outlook', 'Risks, catalysts, scenarios, conclusion and investment/research thesis.', 6)
ON CONFLICT (research_domain_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS research_blocks (
  research_block_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE CASCADE,
  block_number smallint NOT NULL CHECK (block_number BETWEEN 1 AND 15),
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('complete','partial','n_a','not_started')),
  summary text,
  analysis text,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, block_number)
);

CREATE INDEX IF NOT EXISTS research_blocks_snapshot_idx
  ON research_blocks (snapshot_id, block_number);

CREATE TABLE IF NOT EXISTS research_block_domains (
  research_block_id uuid NOT NULL REFERENCES research_blocks(research_block_id) ON DELETE CASCADE,
  research_domain_id text NOT NULL REFERENCES research_domains(research_domain_id) ON DELETE RESTRICT,
  relevance_weight numeric(6,5) CHECK (relevance_weight BETWEEN 0 AND 1),
  display_order smallint,
  PRIMARY KEY (research_block_id, research_domain_id)
);

CREATE INDEX IF NOT EXISTS research_block_domains_domain_idx
  ON research_block_domains (research_domain_id);

CREATE TABLE IF NOT EXISTS evidence (
  evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE CASCADE,
  research_block_id uuid REFERENCES research_blocks(research_block_id) ON DELETE SET NULL,
  research_domain_id text REFERENCES research_domains(research_domain_id) ON DELETE SET NULL,
  observation_id uuid REFERENCES observations(observation_id) ON DELETE SET NULL,
  source_id text REFERENCES sources(source_id) ON DELETE SET NULL,
  evidence_type text NOT NULL CHECK (evidence_type IN ('fact','calculation','assessment','hypothesis')),
  claim text NOT NULL,
  data_summary text,
  signal text NOT NULL CHECK (signal IN ('improving','stable','deteriorating','mixed','unknown')),
  assessment text,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  thesis_impact text NOT NULL CHECK (thesis_impact IN ('positive','neutral','negative','mixed')),
  status text NOT NULL CHECK (status IN ('strong','watch','weak','unknown')),
  as_of timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidence_snapshot_idx ON evidence (snapshot_id);
CREATE INDEX IF NOT EXISTS evidence_observation_idx ON evidence (observation_id);
CREATE INDEX IF NOT EXISTS evidence_source_idx ON evidence (source_id);

CREATE TABLE IF NOT EXISTS critical_factors (
  critical_factor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  importance_weight numeric(6,5) CHECK (importance_weight BETWEEN 0 AND 1),
  current_state text,
  trend text CHECK (trend IN ('improving','stable','deteriorating','mixed','unknown')),
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  thesis_impact text CHECK (thesis_impact IN ('positive','neutral','negative','mixed')),
  monitoring_priority smallint CHECK (monitoring_priority BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, name)
);

CREATE INDEX IF NOT EXISTS critical_factors_asset_snapshot_idx
  ON critical_factors (asset_id, snapshot_id);

CREATE TABLE IF NOT EXISTS research_scores (
  score_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE CASCADE,
  score_type text NOT NULL CHECK (score_type IN ('health','thesis','value_accrual','confidence','competitive_position')),
  value numeric(8,4),
  scale_min numeric(8,4),
  scale_max numeric(8,4),
  methodology_version text NOT NULL,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  explanation text NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (value IS NULL OR (scale_min IS NOT NULL AND scale_max IS NOT NULL AND scale_min < scale_max AND value BETWEEN scale_min AND scale_max)),
  UNIQUE (snapshot_id, score_type, methodology_version)
);

CREATE INDEX IF NOT EXISTS research_scores_asset_snapshot_idx
  ON research_scores (asset_id, snapshot_id, score_type);

CREATE TABLE IF NOT EXISTS research_scenarios (
  research_scenario_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE CASCADE,
  scenario_type text NOT NULL CHECK (scenario_type IN ('bull','base','bear')),
  probability numeric(6,5) CHECK (probability BETWEEN 0 AND 1),
  assumptions text NOT NULL,
  supporting_evidence text,
  invalidation_conditions text,
  thesis_impact text CHECK (thesis_impact IN ('positive','neutral','negative','mixed')),
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, scenario_type)
);

CREATE INDEX IF NOT EXISTS research_scenarios_snapshot_idx
  ON research_scenarios (snapshot_id, scenario_type);

CREATE TABLE IF NOT EXISTS monitoring_signals (
  monitoring_signal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  critical_factor_id uuid REFERENCES critical_factors(critical_factor_id) ON DELETE SET NULL,
  metric_id text REFERENCES metric_definitions(metric_id) ON DELETE SET NULL,
  monitoring_event_id uuid REFERENCES monitoring_events(event_id) ON DELETE SET NULL,
  name text NOT NULL,
  current_value jsonb,
  previous_value jsonb,
  direction text CHECK (direction IN ('improving','stable','deteriorating','mixed','unknown')),
  threshold jsonb,
  threshold_type text,
  thesis_impact text CHECK (thesis_impact IN ('positive','neutral','negative','mixed')),
  status text NOT NULL CHECK (status IN ('active','watch','triggered','disabled')),
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  last_updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitoring_signals_asset_status_idx
  ON monitoring_signals (asset_id, status);

CREATE TABLE IF NOT EXISTS research_status (
  research_status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL UNIQUE REFERENCES assets(asset_id) ON DELETE CASCADE,
  snapshot_id text NOT NULL REFERENCES research_snapshots(snapshot_id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('current','update_recommended','outdated')),
  reason text NOT NULL,
  last_research_at timestamptz NOT NULL,
  last_major_update_at timestamptz,
  next_review_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS research_status_snapshot_idx
  ON research_status (snapshot_id);

-- Record the migration only after all statements above succeed.
INSERT INTO schema_migrations (version)
VALUES ('2026-09-24-research-engine-v2')
ON CONFLICT (version) DO NOTHING;

COMMIT;
