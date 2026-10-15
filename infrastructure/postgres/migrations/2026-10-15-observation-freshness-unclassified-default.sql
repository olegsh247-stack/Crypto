-- Prevent new observations from being labelled CURRENT unless freshness was explicitly assessed.
-- Existing observations are not rewritten; this only changes the default and allowed classification.
BEGIN;

ALTER TABLE observations
  ALTER COLUMN freshness SET DEFAULT 'UNCLASSIFIED';

DO $$
DECLARE
  constraint_row record;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'observations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%freshness%'
  LOOP
    EXECUTE format('ALTER TABLE observations DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;

ALTER TABLE observations
  ADD CONSTRAINT observations_freshness_classification_chk
  CHECK (freshness IN ('CURRENT', 'STALE', 'EXPIRED', 'UNCLASSIFIED'));

INSERT INTO schema_migrations (version)
VALUES ('2026-10-15-observation-freshness-unclassified-default')
ON CONFLICT (version) DO NOTHING;

COMMIT;
