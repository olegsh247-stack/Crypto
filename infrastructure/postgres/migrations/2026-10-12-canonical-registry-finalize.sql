BEGIN;

-- Final canonical registry repair for clean bootstrap.
-- Runs after historical migrations so legacy cleanup cannot leave the
-- current runtime registry empty or incomplete.

INSERT INTO assets (
  asset_id, symbol, name, category, research_tier, enabled,
  binance_symbol, fallback_symbols, research_reason
)
VALUES
  ('btc','BTC','Bitcoin','core','A',true,'BTCUSDT','{"okx":"BTC-USDT","bybit":"BTCUSDT","mexc":"BTCUSDT"}'::jsonb,'Canonical core asset'),
  ('dash','DASH','Dash','core','B',true,'DASHUSDT','{"okx":"DASH-USDT","bybit":"DASHUSDT","mexc":"DASHUSDT"}'::jsonb,'Canonical core asset'),
  ('eth','ETH','Ethereum','core','A',true,'ETHUSDT','{"okx":"ETH-USDT","bybit":"ETHUSDT","mexc":"ETHUSDT"}'::jsonb,'Canonical core asset'),
  ('sol','SOL','Solana','core','A',true,'SOLUSDT','{"okx":"SOL-USDT","bybit":"SOLUSDT","mexc":"SOLUSDT"}'::jsonb,'Canonical core asset'),
  ('cake','CAKE','PancakeSwap','defi','C',true,'CAKEUSDT','{"okx":"CAKE-USDT","bybit":"CAKEUSDT","mexc":"CAKEUSDT"}'::jsonb,'Canonical core asset'),
  ('bch','BCH','Bitcoin Cash','core','B',true,'BCHUSDT','{"okx":"BCH-USDT","bybit":"BCHUSDT","mexc":"BCHUSDT"}'::jsonb,'Canonical core asset'),
  ('ltc','LTC','Litecoin','core','B',true,'LTCUSDT','{"okx":"LTC-USDT","bybit":"LTCUSDT","mexc":"LTCUSDT"}'::jsonb,'Canonical core asset'),
  ('xrp','XRP','XRP','core','B',true,'XRPUSDT','{"okx":"XRP-USDT","bybit":"XRPUSDT","mexc":"XRPUSDT"}'::jsonb,'Canonical core asset'),
  ('trx','TRX','TRON','core','B',true,'TRXUSDT','{"okx":"TRX-USDT","bybit":"TRXUSDT","mexc":"TRXUSDT"}'::jsonb,'Canonical core asset'),
  ('usdt','USDT','Tether USDt','stablecoin','A',true,'USDTUSDT','{"okx":"USDT-USDT","bybit":"USDTUSDT","mexc":"USDTUSDT"}'::jsonb,'Canonical quote asset')
ON CONFLICT (asset_id) DO UPDATE SET
  symbol=EXCLUDED.symbol,name=EXCLUDED.name,category=EXCLUDED.category,
  research_tier=EXCLUDED.research_tier,enabled=true,
  binance_symbol=EXCLUDED.binance_symbol,fallback_symbols=EXCLUDED.fallback_symbols,
  research_reason=EXCLUDED.research_reason,updated_at=now();

UPDATE assets
SET primary_asset_type_id = CASE asset_id
  WHEN 'btc' THEN 'monetary_asset' WHEN 'dash' THEN 'l1_settlement_asset'
  WHEN 'eth' THEN 'l1_settlement_asset' WHEN 'sol' THEN 'l1_execution_asset'
  WHEN 'cake' THEN 'defi_protocol_token' WHEN 'bch' THEN 'monetary_asset'
  WHEN 'ltc' THEN 'monetary_asset' WHEN 'xrp' THEN 'l1_settlement_asset'
  WHEN 'trx' THEN 'l1_settlement_asset' WHEN 'usdt' THEN 'stablecoin'
END, updated_at=now()
WHERE asset_id IN ('btc','dash','eth','sol','cake','bch','ltc','xrp','trx','usdt');

INSERT INTO market_pairs (symbol, base_asset_id, quote_asset_id, exchange, enabled)
SELECT v.symbol, v.asset_id, 'usdt', 'binance', true
FROM (VALUES
  ('BTC/USDT','btc'),('DASH/USDT','dash'),('ETH/USDT','eth'),
  ('SOL/USDT','sol'),('CAKE/USDT','cake'),('BCH/USDT','bch'),
  ('LTC/USDT','ltc'),('XRP/USDT','xrp'),('TRX/USDT','trx')
) AS v(symbol, asset_id)
ON CONFLICT (exchange, symbol) DO UPDATE SET
  base_asset_id=EXCLUDED.base_asset_id,quote_asset_id=EXCLUDED.quote_asset_id,
  enabled=true;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-12-canonical-registry-finalize')
ON CONFLICT (version) DO NOTHING;

COMMIT;
