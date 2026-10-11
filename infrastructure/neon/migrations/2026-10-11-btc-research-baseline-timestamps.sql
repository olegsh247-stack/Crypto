-- Correct seed-generated timestamps for the BTC qualitative research baseline.
-- The original Asset Card migration used now() for static text observations and scores.
-- This migration restores the published baseline timestamp; it does not refresh facts.
-- Safe for clean bootstrap and existing DBs: only exact seeded baseline rows are targeted.
BEGIN;

DO $$
DECLARE
  baseline_as_of timestamptz := '2026-10-08T06:56:27.043Z'::timestamptz;
  seeded_research_at timestamptz;
BEGIN
  SELECT last_research_at INTO seeded_research_at
  FROM research_status
  WHERE asset_id = 'btc' AND snapshot_id = 'BTC-2026-10-07-v1';

  -- Correct only the qualitative observations whose seed methodology identifies them
  -- as static research text and whose timestamp was generated after the baseline as-of.
  UPDATE observations
  SET observed_at = baseline_as_of
  WHERE asset_id = 'btc'
    AND metric_id LIKE 'btc_research_%'
    AND methodology = 'CryptoResearch v2 / Structure 1 qualitative baseline'
    AND observed_at > baseline_as_of;

  -- Keep Evidence as-of aligned with the observation it cites.
  UPDATE evidence e
  SET as_of = baseline_as_of
  FROM observations o
  WHERE e.observation_id = o.observation_id
    AND e.snapshot_id = 'BTC-2026-10-07-v1'
    AND o.asset_id = 'btc'
    AND o.metric_id LIKE 'btc_research_%'
    AND o.methodology = 'CryptoResearch v2 / Structure 1 qualitative baseline'
    AND e.as_of IS DISTINCT FROM baseline_as_of;

  -- The seed writes the score rows and research_status timestamp in one transaction.
  -- Normalize only rows sharing that exact seed timestamp; do not overwrite a later
  -- independently recalculated score whose timestamp no longer matches the seed marker.
  IF seeded_research_at IS NOT NULL THEN
    UPDATE research_scores
    SET calculated_at = baseline_as_of
    WHERE asset_id = 'btc'
      AND snapshot_id = 'BTC-2026-10-07-v1'
      AND calculated_at = seeded_research_at;

    UPDATE research_snapshots
    SET published_at = baseline_as_of
    WHERE snapshot_id = 'BTC-2026-10-07-v1'
      AND published_at = seeded_research_at;

    UPDATE research_status
    SET last_research_at = baseline_as_of,
        next_review_at = '2026-11-07T06:56:27.043Z'::timestamptz,
        updated_at = now()
    WHERE asset_id = 'btc'
      AND snapshot_id = 'BTC-2026-10-07-v1'
      AND last_research_at = seeded_research_at;
  END IF;
END $$;

INSERT INTO schema_migrations(version)
VALUES ('2026-10-11-btc-research-baseline-timestamps')
ON CONFLICT (version) DO NOTHING;

COMMIT;
