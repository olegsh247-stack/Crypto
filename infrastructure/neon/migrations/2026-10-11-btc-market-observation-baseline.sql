-- Preserve the six canonical BTC market observations in a clean/VPS bootstrap.
-- These are explicitly stale point-in-time baselines, not current live market data.
-- Idempotent: existing observations for the same asset/metric/source are never overwritten.

BEGIN;

INSERT INTO sources (source_id,name,source_type,base_url,trust_level,description)
VALUES
 ('institutional.primary','Farside Investors — Bitcoin ETF flows','institutional','https://farside.co.uk/btc/','high','Daily US spot Bitcoin ETF net-flow source.'),
 ('market.primary','Market data provider','market',NULL,'to_validate','Point-in-time BTC spot quote; provider/source quality requires review.'),
 ('network.primary','Mempool.space','primary','https://mempool.space/','high','Bitcoin network and on-chain data source.'),
 ('protocol.primary','Bitcoin Developer Reference','primary','https://developer.bitcoin.org/reference/','high','Bitcoin protocol and issuance reference.')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO metric_definitions (metric_id,namespace,name,description,default_unit,value_type)
VALUES
 ('institutional.etf_net_flow','institutional','BTC ETF net flow','Daily US spot Bitcoin ETF net flow.','USD million/day','numeric'),
 ('market.spot_price','market','BTC spot price','Point-in-time BTC spot price; refresh with an approved market-data feed.','USD/BTC','numeric'),
 ('monetary.block_subsidy','monetary','BTC block subsidy','Protocol subsidy per block.','BTC/block','numeric'),
 ('monetary.circulating_supply','monetary','BTC circulating supply','Point-in-time circulating supply observation.','BTC','numeric'),
 ('monetary.max_supply','monetary','BTC maximum supply','Protocol maximum BTC supply.','BTC','numeric'),
 ('security.hashrate','security','BTC network hashrate','Approximate point-in-time network hashrate estimate.','EH/s','numeric')
ON CONFLICT (metric_id) DO NOTHING;

WITH baseline(metric_id,value_numeric,unit,observed_at,source_id,source_url,status,methodology) AS (
 VALUES
  ('institutional.etf_net_flow',324.6::numeric,'USD million/day','2026-09-18T00:00:00Z'::timestamptz,'institutional.primary','https://farside.co.uk/btc/','WATCH','Initial BTC dataset; daily US spot ETF net flow.'),
  ('market.spot_price',81043::numeric,'USD/BTC','2026-09-19T06:38:00Z'::timestamptz,'market.primary','https://financefeeds.com/bitcoin-btc-price-81043-cftc-crypto-rules-white-house-bull-88000-bear-74000/','NORMAL','Initial BTC dataset; point-in-time quote, not a production-grade market feed.'),
  ('monetary.block_subsidy',3.125::numeric,'BTC/block','2026-09-19T00:00:00Z'::timestamptz,'protocol.primary','https://bitcoin.org/en/bitcoin-paper','NORMAL','Initial BTC dataset; protocol subsidy after the 2024 halving.'),
  ('monetary.circulating_supply',20086198.00419505::numeric,'BTC','2026-09-19T00:00:00Z'::timestamptz,'network.primary',NULL,'NORMAL','Initial BTC dataset; point-in-time gettxoutsetinfo-derived estimate.'),
  ('monetary.max_supply',21000000::numeric,'BTC','2026-09-19T00:00:00Z'::timestamptz,'protocol.primary','https://bitcoin.org/en/faq','NORMAL','Initial BTC dataset; protocol maximum supply.'),
  ('security.hashrate',1001::numeric,'EH/s','2026-09-19T00:00:00Z'::timestamptz,'network.primary','https://shattered.io/bitcoin-hashrate-zettahash-difficulty-2026/','NORMAL','Initial BTC dataset; approximate historical hashrate estimate.')
)
INSERT INTO observations
 (metric_id,asset_id,value_numeric,unit,observed_at,source_id,source_url,methodology,status,freshness)
SELECT b.metric_id,'btc',b.value_numeric,b.unit,b.observed_at,b.source_id,b.source_url,b.methodology,b.status,'STALE'
FROM baseline b
WHERE NOT EXISTS (
 SELECT 1 FROM observations o
 WHERE o.asset_id='btc' AND o.metric_id=b.metric_id AND o.source_id=b.source_id
);

INSERT INTO schema_migrations(version)
VALUES ('2026-10-11-btc-market-observation-baseline')
ON CONFLICT (version) DO NOTHING;

COMMIT;
