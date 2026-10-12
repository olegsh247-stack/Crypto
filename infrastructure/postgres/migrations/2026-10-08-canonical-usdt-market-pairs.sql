BEGIN;

-- System quote asset used by the canonical crypto market-pair layer.
-- USDT is a registry asset, but it is not a research target in v1.
INSERT INTO assets (
  asset_id, symbol, name, category, research_tier, enabled,
  binance_symbol, fallback_symbols, research_reason
)
VALUES (
  'usdt', 'USDT', 'Tether USD', 'stablecoin', 'C', true,
  NULL, '{}'::jsonb,
  'System quote asset for canonical crypto market pairs.'
)
ON CONFLICT (asset_id) DO UPDATE
SET symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    research_tier = EXCLUDED.research_tier,
    enabled = EXCLUDED.enabled,
    research_reason = EXCLUDED.research_reason,
    updated_at = now();

UPDATE assets
SET primary_asset_type_id = 'stablecoin', updated_at = now()
WHERE asset_id = 'usdt';

-- Canonical first-class market pairs for the registered crypto assets.
INSERT INTO market_pairs (symbol, base_asset_id, quote_asset_id, exchange, enabled)
SELECT v.symbol, v.asset_id, 'usdt', 'binance', true
FROM (VALUES
  ('BTC/USDT', 'btc'),
  ('DASH/USDT', 'dash'),
  ('ETH/USDT', 'eth'),
  ('SOL/USDT', 'sol'),
  ('CAKE/USDT', 'cake'),
  ('BCH/USDT', 'bch'),
  ('LTC/USDT', 'ltc'),
  ('XRP/USDT', 'xrp'),
  ('TRX/USDT', 'trx')
) AS v(symbol, asset_id)
WHERE EXISTS (SELECT 1 FROM assets a WHERE a.asset_id = v.asset_id)
ON CONFLICT (symbol) DO UPDATE
SET base_asset_id = EXCLUDED.base_asset_id,
    quote_asset_id = EXCLUDED.quote_asset_id,
    exchange = EXCLUDED.exchange,
    enabled = EXCLUDED.enabled,
    disabled_at = NULL;

CREATE INDEX IF NOT EXISTS assets_enabled_category_idx
  ON assets (enabled, category);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-08-canonical-usdt-market-pairs')
ON CONFLICT (version) DO NOTHING;

COMMIT;
