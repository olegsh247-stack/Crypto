BEGIN;

CREATE TABLE IF NOT EXISTS market_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  base_asset_id text NOT NULL,
  quote_asset_id text NOT NULL,
  exchange text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT market_pairs_symbol_unique UNIQUE (symbol),
  CONSTRAINT market_pairs_base_quote_check CHECK (base_asset_id <> quote_asset_id)
);

CREATE INDEX IF NOT EXISTS market_pairs_enabled_idx ON market_pairs (enabled, symbol);

CREATE TABLE IF NOT EXISTS commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text NOT NULL,
  unit text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT commodities_symbol_unique UNIQUE (symbol)
);

CREATE INDEX IF NOT EXISTS commodities_enabled_idx ON commodities (enabled, symbol);

COMMIT;
