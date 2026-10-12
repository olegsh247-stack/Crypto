BEGIN;

-- A legacy ETH asset can be reintroduced by the historical 2026-10-04
-- Asset Card migration when that migration was previously run after the
-- 2026-10-06 canonicalization step. Move any remaining references back to
-- the canonical lowercase asset and remove the duplicate registry row.
-- If a legacy monitoring signal duplicates an existing canonical signal,
-- keep the canonical row and remove only the legacy duplicate.
DELETE FROM monitoring_signals legacy
WHERE legacy.asset_id='ETH'
  AND EXISTS (
    SELECT 1 FROM monitoring_signals canonical
    WHERE canonical.asset_id='eth' AND canonical.name=legacy.name
  );

DELETE FROM research_status legacy
WHERE legacy.asset_id='ETH'
  AND EXISTS (
    SELECT 1 FROM research_status canonical
    WHERE canonical.asset_id='eth'
  );

UPDATE research_snapshots SET asset_id='eth' WHERE asset_id='ETH';
UPDATE observations SET asset_id='eth' WHERE asset_id='ETH';
UPDATE monitoring_events SET asset_id='eth' WHERE asset_id='ETH';
UPDATE scenario_states SET asset_id='eth' WHERE asset_id='ETH';
UPDATE market_daily_candles SET asset_id='eth' WHERE asset_id='ETH';
UPDATE critical_factors SET asset_id='eth' WHERE asset_id='ETH';
UPDATE research_scores SET asset_id='eth' WHERE asset_id='ETH';
UPDATE monitoring_signals SET asset_id='eth' WHERE asset_id='ETH';
UPDATE research_status SET asset_id='eth' WHERE asset_id='ETH';
UPDATE market_pairs SET base_asset_id='eth' WHERE base_asset_id='ETH';
UPDATE market_pairs SET quote_asset_id='eth' WHERE quote_asset_id='ETH';

DELETE FROM assets WHERE asset_id='ETH';

INSERT INTO schema_migrations (version)
VALUES ('2026-10-10-remove-legacy-uppercase-eth')
ON CONFLICT (version) DO NOTHING;

COMMIT;
