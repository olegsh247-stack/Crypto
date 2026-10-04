-- Finalize ETH Asset Card classification.
UPDATE assets
SET primary_asset_type_id='l1_settlement_asset', updated_at=now()
WHERE asset_id='eth';

INSERT INTO schema_migrations (version)
VALUES ('2026-10-05-eth-asset-type')
ON CONFLICT (version) DO NOTHING;
