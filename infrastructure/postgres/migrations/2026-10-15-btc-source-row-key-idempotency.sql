-- BTC idempotency: provider row identity takes precedence when available.
-- Keep the former natural key only for legacy rows with no source_row_key.
-- This migration changes schema constraints only; it does not rewrite observations.
BEGIN;

DO $$
DECLARE duplicate_groups integer;
BEGIN
  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT metric_id, source_id, source_row_key, revision
    FROM observations
    WHERE asset_id = 'btc' AND source_row_key IS NOT NULL
    GROUP BY metric_id, source_id, source_row_key, revision
    HAVING count(*) > 1
  ) duplicates;
  IF duplicate_groups > 0 THEN
    RAISE EXCEPTION
      'BTC source-row idempotency blocked: % duplicate source-row key groups remain. Review them before applying this migration.',
      duplicate_groups;
  END IF;

  SELECT count(*) INTO duplicate_groups
  FROM (
    SELECT metric_id, source_id, observed_at,
           coalesce(period_start, '-infinity'::timestamptz) AS period_start_key,
           coalesce(period_end, '-infinity'::timestamptz) AS period_end_key,
           revision
    FROM observations
    WHERE asset_id = 'btc' AND source_row_key IS NULL
    GROUP BY metric_id, source_id, observed_at,
             coalesce(period_start, '-infinity'::timestamptz),
             coalesce(period_end, '-infinity'::timestamptz),
             revision
    HAVING count(*) > 1
  ) duplicates;
  IF duplicate_groups > 0 THEN
    RAISE EXCEPTION
      'BTC legacy idempotency blocked: % duplicate natural-key groups remain. Review/reconcile exact legacy duplicates on a restored target copy before applying this migration.',
      duplicate_groups;
  END IF;
END $$;

DROP INDEX IF EXISTS observations_btc_natural_key_revision_uq;

CREATE UNIQUE INDEX observations_btc_source_row_revision_uq
ON observations (metric_id, source_id, source_row_key, revision)
WHERE asset_id = 'btc' AND source_row_key IS NOT NULL;

CREATE UNIQUE INDEX observations_btc_legacy_natural_key_revision_uq
ON observations (
  metric_id, source_id, observed_at,
  (coalesce(period_start, '-infinity'::timestamptz)),
  (coalesce(period_end, '-infinity'::timestamptz)),
  revision
)
WHERE asset_id = 'btc' AND source_row_key IS NULL;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-15-btc-source-row-key-idempotency')
ON CONFLICT (version) DO NOTHING;

COMMIT;
