-- Disposable PostgreSQL only. This transaction must never be run against production.
-- Proves a candidate ETH scenario state can be inserted with snapshot lineage and
-- that ROLLBACK leaves no persistent scenario_states row behind.

BEGIN;

WITH candidate AS (
  SELECT rs.research_scenario_id::text AS scenario_id, rs.snapshot_id
  FROM research_scenarios rs
  JOIN research_snapshots s ON s.snapshot_id = rs.snapshot_id
  WHERE s.asset_id = 'eth'
    AND s.status = 'PUBLISHED'
    AND rs.scenario_type = 'base'
  ORDER BY s.version DESC
  LIMIT 1
)
INSERT INTO scenario_states (
  asset_id, scenario_id, state, confidence, rationale, indicators, observed_at, snapshot_id
)
SELECT
  'eth',
  scenario_id,
  'base',
  '0.50',
  'CI rollback rehearsal only',
  jsonb_build_object('test_marker', 'scenario-state-rollback-rehearsal'),
  now(),
  snapshot_id
FROM candidate;

DO $$
DECLARE rows_found integer;
BEGIN
  SELECT count(*) INTO rows_found
  FROM scenario_states
  WHERE asset_id = 'eth'
    AND rationale = 'CI rollback rehearsal only'
    AND indicators->>'test_marker' = 'scenario-state-rollback-rehearsal';

  IF rows_found <> 1 THEN
    RAISE EXCEPTION 'scenario state insert rehearsal expected 1 row, got %', rows_found;
  END IF;
  RAISE NOTICE 'SCENARIO_STATE_ROLLBACK_INSERT_OK rows=%', rows_found;
END $$;

ROLLBACK;

DO $$
DECLARE rows_found integer;
BEGIN
  SELECT count(*) INTO rows_found
  FROM scenario_states
  WHERE asset_id = 'eth'
    AND rationale = 'CI rollback rehearsal only'
    AND indicators->>'test_marker' = 'scenario-state-rollback-rehearsal';

  IF rows_found <> 0 THEN
    RAISE EXCEPTION 'scenario state rollback leaked % rows', rows_found;
  END IF;
  RAISE NOTICE 'SCENARIO_STATE_ROLLBACK_OK rows_after_rollback=%', rows_found;
END $$;
