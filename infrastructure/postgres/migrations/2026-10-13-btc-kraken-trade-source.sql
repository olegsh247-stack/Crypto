-- Register the Kraken Trades source used by the point-in-time BTC spot-price candidate.
-- Keep this distinct from market_kraken, which is the daily OHLC fallback.
-- Metadata only: no observations are inserted or modified.
BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES (
  'market.kraken',
  'Kraken Spot Trades',
  'market_data',
  'https://api.kraken.com/0/public/Trades',
  'high',
  'Public Kraken Trades endpoint used as a point-in-time BTC/USD spot-price candidate. Request pair XBTUSD, preserve raw pair and response provenance, and normalize XBT to BTC at the adapter boundary. Distinct from market_kraken daily OHLC fallback.'
)
ON CONFLICT (source_id) DO UPDATE SET
  name=EXCLUDED.name,
  source_type=EXCLUDED.source_type,
  base_url=EXCLUDED.base_url,
  trust_level=EXCLUDED.trust_level,
  description=EXCLUDED.description,
  updated_at=now();

INSERT INTO schema_migrations (version)
VALUES ('2026-10-13-btc-kraken-trade-source')
ON CONFLICT (version) DO NOTHING;

COMMIT;
