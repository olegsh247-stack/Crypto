-- BTC scenario-to-evidence links (additive contract)
-- Purpose: make the reasoning behind Bull/Base/Bear definitions inspectable.
-- This migration defines a relation only. It does not fabricate evidence links,
-- recalculate probabilities, create scenario states, or write to production.
-- Apply only through the separately approved migration process.

BEGIN;

-- Composite keys let PostgreSQL enforce that a scenario and evidence row belong
-- to the same immutable research snapshot.
CREATE UNIQUE INDEX IF NOT EXISTS research_scenarios_snapshot_id_id_uidx
  ON research_scenarios (snapshot_id, research_scenario_id);

CREATE UNIQUE INDEX IF NOT EXISTS evidence_snapshot_id_id_uidx
  ON evidence (snapshot_id, evidence_id);

CREATE TABLE IF NOT EXISTS research_scenario_evidence (
  snapshot_id text NOT NULL,
  research_scenario_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  relation_type text NOT NULL CHECK (
    relation_type IN ('supports', 'contradicts', 'invalidation', 'context')
  ),
  rationale text NOT NULL CHECK (length(trim(rationale)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_id, research_scenario_id, evidence_id, relation_type),
  CONSTRAINT research_scenario_evidence_scenario_snapshot_fk
    FOREIGN KEY (snapshot_id, research_scenario_id)
    REFERENCES research_scenarios (snapshot_id, research_scenario_id)
    ON DELETE CASCADE,
  CONSTRAINT research_scenario_evidence_evidence_snapshot_fk
    FOREIGN KEY (snapshot_id, evidence_id)
    REFERENCES evidence (snapshot_id, evidence_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS research_scenario_evidence_evidence_idx
  ON research_scenario_evidence (snapshot_id, evidence_id);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-11-research-scenario-evidence-links')
ON CONFLICT (version) DO NOTHING;

COMMIT;
