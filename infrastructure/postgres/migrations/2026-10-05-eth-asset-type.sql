-- Finalize canonical ETH Asset Card classification.
UPDATE assets
SET primary_asset_type_id='l1_settlement_asset', category='core', research_tier='A', enabled=true, updated_at=now()
WHERE asset_id='ETH';

INSERT INTO schema_migrations (version)
VALUES ('2026-10-05-eth-asset-type')
ON CONFLICT (version) DO NOTHING;
