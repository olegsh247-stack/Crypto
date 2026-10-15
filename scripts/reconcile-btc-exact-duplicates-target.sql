\set ON_ERROR_STOP on

-- This script is intentionally separate from the migration runner. It may be
-- used only on a restored target copy after a final source dump is verified.
DO $$
BEGIN
  IF current_setting('app.allow_btc_exact_duplicate_reconciliation', true) IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION 'Refusing BTC duplicate reconciliation: explicit session guard is missing';
  END IF;
END $$;

BEGIN;

DO $$
DECLARE conflicting_groups integer;
BEGIN
  SELECT count(*) INTO conflicting_groups
  FROM (
    SELECT metric_id, source_id, source_row_key,
           CASE WHEN source_row_key IS NULL THEN observed_at END AS legacy_observed_at,
           CASE WHEN source_row_key IS NULL THEN coalesce(period_start, '-infinity'::timestamptz) END AS legacy_period_start,
           CASE WHEN source_row_key IS NULL THEN coalesce(period_end, '-infinity'::timestamptz) END AS legacy_period_end,
           revision
    FROM observations
    WHERE asset_id = 'btc'
    GROUP BY metric_id, source_id, source_row_key,
             CASE WHEN source_row_key IS NULL THEN observed_at END,
             CASE WHEN source_row_key IS NULL THEN coalesce(period_start, '-infinity'::timestamptz) END,
             CASE WHEN source_row_key IS NULL THEN coalesce(period_end, '-infinity'::timestamptz) END,
             revision
    HAVING count(*) > 1
       AND count(DISTINCT jsonb_build_object(
         'value_numeric', value_numeric,
         'value_integer', value_integer,
         'value_boolean', value_boolean,
         'value_text', value_text,
         'value_json', value_json,
         'unit', unit,
         'source_url', source_url,
         'methodology', methodology,
         'status', status,
         'freshness', freshness
       )::text) > 1
  ) conflicts;

  IF conflicting_groups > 0 THEN
    RAISE EXCEPTION
      'Refusing BTC duplicate reconciliation: % conflicting payload groups require manual review',
      conflicting_groups;
  END IF;
END $$;

WITH ranked AS (
  SELECT observation_id,
         row_number() OVER (
           PARTITION BY metric_id, source_id, source_row_key,
                        CASE WHEN source_row_key IS NULL THEN observed_at END,
                        CASE WHEN source_row_key IS NULL THEN coalesce(period_start, '-infinity'::timestamptz) END,
                        CASE WHEN source_row_key IS NULL THEN coalesce(period_end, '-infinity'::timestamptz) END,
                        revision
           ORDER BY created_at ASC, observation_id ASC
         ) AS row_rank
  FROM observations
  WHERE asset_id = 'btc'
),
deleted AS (
  DELETE FROM observations o
  USING ranked r
  WHERE o.observation_id = r.observation_id
    AND r.row_rank > 1
  RETURNING o.observation_id
)
SELECT count(*) AS exact_duplicate_rows_removed FROM deleted;

COMMIT;
