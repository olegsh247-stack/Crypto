BEGIN;

-- A trading pair is uniquely identified by its exchange and symbol.
-- Keep historical rows; normalize legacy NULL/blank exchanges to the existing
-- Binance canonical market registry before making exchange mandatory.
UPDATE market_pairs
SET exchange = 'binance'
WHERE exchange IS NULL OR btrim(exchange) = '';

ALTER TABLE market_pairs
  ALTER COLUMN exchange SET NOT NULL;

ALTER TABLE market_pairs
  DROP CONSTRAINT IF EXISTS market_pairs_symbol_unique;

ALTER TABLE market_pairs
  ADD CONSTRAINT market_pairs_exchange_symbol_unique UNIQUE (exchange, symbol);

CREATE INDEX IF NOT EXISTS market_pairs_exchange_enabled_idx
  ON market_pairs (exchange, enabled);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-09-market-pair-identity')
ON CONFLICT (version) DO NOTHING;

COMMIT;
