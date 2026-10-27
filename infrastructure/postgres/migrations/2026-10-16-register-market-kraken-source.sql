-- Register the canonical Kraken BTC/USD observation source for clean and migrated databases.
-- Idempotent; does not create or rewrite observations.
BEGIN;

INSERT INTO sources (source_id,name,source_type,base_url,trust_level,description)
VALUES (
  'market.kraken',
  'Kraken Spot public market-data API',
  'market',
  'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
  'high',
  'Canonical BTC/USD spot source; observation time comes from Kraken trade epoch timestamp.'
)
ON CONFLICT (source_id) DO UPDATE SET
  name=EXCLUDED.name,
  source_type=EXCLUDED.source_type,
  base_url=EXCLUDED.base_url,
  trust_level=EXCLUDED.trust_level,
  description=EXCLUDED.description,
  updated_at=now();

COMMIT;
