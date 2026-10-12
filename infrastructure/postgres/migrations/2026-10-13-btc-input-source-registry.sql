-- Canonical metric and source registry entries required by BTC input readiness.
-- Registry metadata only: this migration does not create observations.
BEGIN;

INSERT INTO metric_definitions (
  metric_id, namespace, name, description, default_unit, value_type
)
VALUES
  ('market.spot_price', 'market', 'BTC spot price',
   'Point-in-time BTC spot market price.', 'USD/BTC', 'numeric'),
  ('security.hashrate', 'security', 'Network hashrate',
   'Trailing-window average Bitcoin network hashrate.', 'EH/s', 'numeric'),
  ('security.fee_subsidy_ratio', 'security', 'Fee / subsidy ratio',
   'Fees divided by subsidy over a documented rolling block window.', 'ratio', 'numeric'),
  ('macro.dxy', 'macro', 'US Dollar Index',
   'ICE U.S. Dollar Index (DXY); source access must be explicitly licensed/verified.', 'index', 'numeric'),
  ('institutional.etf_net_flow', 'institutional', 'US spot Bitcoin ETF net flow',
   'Daily US spot Bitcoin ETF net flow from the source table.', 'USD million/day', 'numeric')
ON CONFLICT (metric_id) DO UPDATE SET
  namespace=EXCLUDED.namespace,
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  default_unit=EXCLUDED.default_unit,
  value_type=EXCLUDED.value_type,
  updated_at=now();

INSERT INTO sources (
  source_id, name, source_type, base_url, trust_level, description
)
VALUES
  ('network.primary', 'Mempool.space Bitcoin Network API', 'primary',
   'https://mempool.space/', 'high',
   'Public Bitcoin network hashrate and mining reward/fee data.'),
  ('institutional.primary', 'Farside Investors Bitcoin ETF Flows', 'institutional',
   'https://farside.co.uk/btc/', 'high',
   'Daily US spot Bitcoin ETF flow table; collector must validate its header and total column.'),
  ('market_binance', 'Binance Market Data', 'market_data',
   'https://data-api.binance.vision', 'high',
   'Public Binance spot ticker and daily candle data.')
ON CONFLICT (source_id) DO UPDATE SET
  name=EXCLUDED.name,
  source_type=EXCLUDED.source_type,
  base_url=EXCLUDED.base_url,
  trust_level=EXCLUDED.trust_level,
  description=EXCLUDED.description,
  updated_at=now();

INSERT INTO schema_migrations (version)
VALUES ('2026-10-13-btc-input-source-registry')
ON CONFLICT (version) DO NOTHING;

COMMIT;
