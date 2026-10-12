-- BTC observation natural-key/revision idempotency.
-- Deliberately fails closed if any BTC duplicate logical keys remain. Reconcile
-- exact duplicates on a restored target copy, then rerun the migration runner.
BEGIN;
DO $$
DECLARE duplicate_groups integer;
BEGIN
  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT metric_id, source_id, observed_at,
           coalesce(period_start, '-infinity'::timestamptz) AS period_start_key,
           coalesce(period_end, '-infinity'::timestamptz) AS period_end_key,
           revision
    FROM observations
    WHERE asset_id = 'btc'
    GROUP BY metric_id, source_id, observed_at,
             coalesce(period_start, '-infinity'::timestamptz),
             coalesce(period_end, '-infinity'::timestamptz),
             revision
    HAVING count(*) > 1
  ) duplicates;
  IF duplicate_groups > 0 THEN
    RAISE EXCEPTION
      'BTC observation idempotency blocked: % duplicate logical-key groups remain. Review the read-only audit; reconcile exact duplicates only on the restored target copy, then rerun migrations.',
      duplicate_groups;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS observations_btc_natural_key_revision_uq
ON observations (
  metric_id, source_id, observed_at,
  (coalesce(period_start, '-infinity'::timestamptz)),
  (coalesce(period_end, '-infinity'::timestamptz)),
  revision
)
WHERE asset_id = 'btc';
COMMIT;
