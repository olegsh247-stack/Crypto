BEGIN;

-- Canonical asset identity is lowercase. Make the canonical ETH parent exist
-- before re-pointing any legacy uppercase ETH research rows. This keeps the
-- migration valid on both seeded and completely clean databases.
INSERT INTO assets (
  asset_id, symbol, name, category, research_tier, enabled,
  binance_symbol, fallback_symbols, research_reason, primary_asset_type_id
)
SELECT
  'eth', symbol, name, category, research_tier, enabled,
  binance_symbol, fallback_symbols, research_reason, 'l1_settlement_asset'
FROM assets
WHERE asset_id='ETH'
ON CONFLICT (asset_id) DO NOTHING;

INSERT INTO assets (
  asset_id, symbol, name, category, research_tier, enabled,
  binance_symbol, fallback_symbols, research_reason, primary_asset_type_id
)
VALUES (
  'eth', 'ETH', 'Ethereum', 'core', 'A', true,
  'ETHUSDT', '{}'::jsonb,
  'First complete Asset Card implementation for CryptoResearch v2 / Structure 1.',
  'l1_settlement_asset'
)
ON CONFLICT (asset_id) DO NOTHING;

-- The canonical ETH card wins if a lowercase placeholder already exists.
DELETE FROM research_status WHERE asset_id='eth';
DELETE FROM monitoring_signals WHERE asset_id='eth';
DELETE FROM research_snapshots WHERE asset_id='eth';

UPDATE assets
SET symbol='ETH', name='Ethereum', category='core', research_tier='A', enabled=true,
    research_reason='First complete Asset Card implementation for CryptoResearch v2 / Structure 1.',
    primary_asset_type_id='l1_settlement_asset', updated_at=now()
WHERE asset_id='eth';

UPDATE research_snapshots SET asset_id='eth' WHERE asset_id='ETH';
UPDATE observations SET asset_id='eth' WHERE asset_id='ETH';
UPDATE monitoring_events SET asset_id='eth' WHERE asset_id='ETH';
UPDATE scenario_states SET asset_id='eth' WHERE asset_id='ETH';
UPDATE market_daily_candles SET asset_id='eth' WHERE asset_id='ETH';
UPDATE critical_factors SET asset_id='eth' WHERE asset_id='ETH';
UPDATE research_scores SET asset_id='eth' WHERE asset_id='ETH';
UPDATE research_scenarios SET snapshot_id='ETH-2026-10-04-v1' WHERE snapshot_id='ETH-2026-10-04-v1';
UPDATE monitoring_signals SET asset_id='eth' WHERE asset_id='ETH';
UPDATE research_status SET asset_id='eth' WHERE asset_id='ETH';

DELETE FROM assets WHERE asset_id='ETH';

-- Make the remaining canonical asset registry classifications explicit.
UPDATE assets SET primary_asset_type_id='monetary_asset' WHERE asset_id IN ('btc','bch','ltc') AND primary_asset_type_id IS NULL;
UPDATE assets SET primary_asset_type_id='l1_settlement_asset' WHERE asset_id IN ('xrp','trx') AND primary_asset_type_id IS NULL;
UPDATE assets SET primary_asset_type_id='l1_execution_asset' WHERE asset_id='sol' AND primary_asset_type_id IS NULL;
UPDATE assets SET primary_asset_type_id='defi_protocol_token' WHERE asset_id='cake' AND primary_asset_type_id IS NULL;
UPDATE assets SET primary_asset_type_id='l1_settlement_asset' WHERE asset_id='dash' AND primary_asset_type_id IS NULL;

INSERT INTO schema_migrations(version) VALUES ('2026-10-06-canonicalize-asset-identities') ON CONFLICT (version) DO NOTHING;
COMMIT;
