-- Make Asset Card monitoring signals idempotent.
-- Existing duplicate ETH rows are collapsed before enforcing the canonical key.

BEGIN;

DELETE FROM monitoring_signals a
USING monitoring_signals b
WHERE a.asset_id = b.asset_id
  AND a.name = b.name
  AND a.monitoring_signal_id > b.monitoring_signal_id;

CREATE UNIQUE INDEX IF NOT EXISTS monitoring_signals_asset_name_uidx
  ON monitoring_signals (asset_id, name);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-05-monitoring-signal-uniqueness')
ON CONFLICT (version) DO NOTHING;

COMMIT;
