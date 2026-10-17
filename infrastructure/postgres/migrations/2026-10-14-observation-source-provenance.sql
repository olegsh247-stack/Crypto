-- Preserve source timing and raw-row provenance separately from observation time.
-- Nullable metadata keeps existing historical rows valid; no historical values are rewritten.
BEGIN;

ALTER TABLE observations
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS retrieved_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_row_key text,
  ADD COLUMN IF NOT EXISTS source_payload_sha256 text,
  ADD COLUMN IF NOT EXISTS methodology_version text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'observations_source_payload_sha256_format_chk'
      AND conrelid = 'observations'::regclass
  ) THEN
    ALTER TABLE observations
      ADD CONSTRAINT observations_source_payload_sha256_format_chk
      CHECK (
        source_payload_sha256 IS NULL
        OR source_payload_sha256 ~ '^[0-9a-fA-F]{64}$'
      );
  END IF;
END $$;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-14-observation-source-provenance')
ON CONFLICT (version) DO NOTHING;

COMMIT;
