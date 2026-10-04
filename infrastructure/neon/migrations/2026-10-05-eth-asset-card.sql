-- ETH Asset Card verification/finalization migration.
-- The canonical ETH ingestion is 2026-10-04-eth-asset-card.sql.
-- This migration intentionally does not create a second asset identifier.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM assets WHERE asset_id='ETH') THEN
    UPDATE assets
    SET primary_asset_type_id='l1_settlement_asset', category='core', research_tier='A', enabled=true, updated_at=now()
    WHERE asset_id='ETH';
  END IF;
END $$;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-05-eth-asset-card')
ON CONFLICT (version) DO NOTHING;
