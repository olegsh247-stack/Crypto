BEGIN;

-- Market pairs are independent trading entities, but their legs must resolve to
-- canonical Asset Registry identities. Keep historical rows; only strengthen integrity.
ALTER TABLE market_pairs
  ADD CONSTRAINT market_pairs_base_asset_fk
    FOREIGN KEY (base_asset_id) REFERENCES assets(asset_id),
  ADD CONSTRAINT market_pairs_quote_asset_fk
    FOREIGN KEY (quote_asset_id) REFERENCES assets(asset_id),
  ADD CONSTRAINT market_pairs_symbol_format_check
    CHECK (symbol = upper(symbol) AND position('/' in symbol) > 0);

CREATE INDEX IF NOT EXISTS market_pairs_base_asset_idx
  ON market_pairs (base_asset_id, enabled);

CREATE INDEX IF NOT EXISTS market_pairs_quote_asset_idx
  ON market_pairs (quote_asset_id, enabled);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-07-market-pair-integrity')
ON CONFLICT (version) DO NOTHING;

COMMIT;
