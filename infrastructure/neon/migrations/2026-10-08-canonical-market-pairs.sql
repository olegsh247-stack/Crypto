-- Canonical market registry for the current asset universe.
-- Idempotent: safe to apply repeatedly.
-- Only creates a pair when both referenced assets exist.

INSERT INTO market_pairs (symbol, base_asset_id, quote_asset_id, exchange, enabled)
SELECT v.symbol, v.asset_id, 'usdt', v.exchange, true
FROM (VALUES
  ('BTC/USDT',  'btc',  'binance'),
  ('DASH/USDT', 'dash', 'binance'),
  ('ETH/USDT',  'eth',  'binance'),
  ('SOL/USDT',  'sol',  'binance'),
  ('CAKE/USDT', 'cake', 'binance'),
  ('BCH/USDT',  'bch',  'binance'),
  ('LTC/USDT',  'ltc',  'binance'),
  ('XRP/USDT',  'xrp',  'binance'),
  ('TRX/USDT',  'trx',  'binance')
) AS v(symbol, asset_id, exchange)
WHERE EXISTS (SELECT 1 FROM assets a WHERE a.asset_id = v.asset_id)
  AND EXISTS (SELECT 1 FROM assets a WHERE a.asset_id = 'usdt')
ON CONFLICT (symbol) DO UPDATE
SET base_asset_id = EXCLUDED.base_asset_id,
    quote_asset_id = EXCLUDED.quote_asset_id,
    exchange = EXCLUDED.exchange,
    enabled = true;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-08-canonical-market-pairs')
ON CONFLICT (version) DO NOTHING;
