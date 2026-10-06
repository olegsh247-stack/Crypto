BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('market_binance', 'Binance Market Data', 'market_data', 'https://data-api.binance.vision', 'high', 'Public Binance spot market data used for canonical daily candles when available.'),
  ('market_kraken', 'Kraken Market Data', 'market_data', 'https://api.kraken.com/0/public/OHLC', 'high', 'Public Kraken OHLC fallback used for supported assets.'),
  ('market_coingecko', 'CoinGecko Market Data', 'market_data', 'https://api.coingecko.com/api/v3', 'medium', 'Public CoinGecko market data fallback for history reads.')
ON CONFLICT (source_id) DO UPDATE SET
  name=EXCLUDED.name,
  source_type=EXCLUDED.source_type,
  base_url=EXCLUDED.base_url,
  trust_level=EXCLUDED.trust_level,
  description=EXCLUDED.description,
  updated_at=now();

INSERT INTO schema_migrations (version)
VALUES ('2026-10-11-market-data-sources')
ON CONFLICT (version) DO NOTHING;

COMMIT;
