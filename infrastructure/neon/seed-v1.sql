-- CryptoDataModel v1 — canonical seed for Neon
-- Idempotent: safe to run repeatedly.
-- Only registry-backed entities are seeded. The BTC initial dataset is intentionally
-- treated as partial research input; observations are inserted only when their source
-- can be mapped to the canonical source registry.

insert into assets
  (asset_id, symbol, name, category, research_tier, enabled, binance_symbol, fallback_symbols, research_reason)
values
  ('btc','BTC','Bitcoin','core','A',true,'BTCUSDT',
   '{"okx":"BTC-USDT","bybit":"BTCUSDT","mexc":"BTCUSDT"}'::jsonb,
   'Core monetary cryptoasset and primary research subject of the Crypto project.'),
  ('dash','DASH','Dash','l1_infrastructure','B',true,'DASHUSDT',
   '{"okx":"DASH-USDT","bybit":"DASHUSDT","mexc":"DASHUSDT"}'::jsonb,
   'Established PoW payments-focused L1 with a distinctive second-tier masternode architecture, InstantSend, CoinJoin, ChainLocks and on-chain treasury governance.'),
  ('eth','ETH','Ethereum','core','A',true,'ETHUSDT', '{"okx":"ETH-USDT","bybit":"ETHUSDT","mexc":"ETHUSDT"}'::jsonb, 'Core programmable crypto network and major settlement, DeFi and smart-contract infrastructure.'),
  ('sol','SOL','Solana','l1_infrastructure','A',true,'SOLUSDT', '{"okx":"SOL-USDT","bybit":"SOLUSDT","mexc":"SOLUSDT"}'::jsonb, 'Major high-throughput smart-contract L1 with a distinct execution and ecosystem model.'),
  ('cake','CAKE','PancakeSwap','defi','B',true,'CAKEUSDT', '{"okx":"CAKE-USDT","bybit":"CAKEUSDT","mexc":"CAKEUSDT"}'::jsonb, 'Major DeFi protocol token representing decentralized exchange infrastructure and on-chain liquidity activity.'),
  ('bch','BCH','Bitcoin Cash','bitcoin_ecosystem','B',true,'BCHUSDT', '{"okx":"BCH-USDT","bybit":"BCHUSDT","mexc":"BCHUSDT"}'::jsonb, 'Major Bitcoin fork with a distinct block-size and payments-oriented design path.'),
  ('ltc','LTC','Litecoin','l1_infrastructure','B',true,'LTCUSDT', '{"okx":"LTC-USDT","bybit":"LTCUSDT","mexc":"LTCUSDT"}'::jsonb, 'Long-running PoW monetary and payments-focused network with a distinct role in crypto market history.'),
  ('xrp','XRP','XRP','l1_infrastructure','A',true,'XRPUSDT', '{"okx":"XRP-USDT","bybit":"XRPUSDT","mexc":"XRPUSDT"}'::jsonb, 'Major payment and settlement-oriented cryptoasset with a distinct ledger architecture and institutional ecosystem.'),
  ('trx','TRX','TRON','stablecoin_payments','A',true,'TRXUSDT', '{"okx":"TRX-USDT","bybit":"TRXUSDT","mexc":"TRXUSDT"}'::jsonb, 'Major smart-contract network with significant stablecoin settlement and payments activity.')
on conflict (asset_id) do update set
  symbol=excluded.symbol,name=excluded.name,category=excluded.category,
  research_tier=excluded.research_tier,enabled=excluded.enabled,
  binance_symbol=excluded.binance_symbol,fallback_symbols=excluded.fallback_symbols,
  research_reason=excluded.research_reason,updated_at=now();

insert into metric_definitions
  (metric_id, namespace, name, description, default_unit, value_type)
values
  ('market.spot_price','market','BTC spot price','Point-in-time BTC spot market price.','USD/BTC','numeric'),
  ('security.hashrate','security','Network hashrate','Bitcoin network hashrate.','EH/s','numeric'),
  ('security.difficulty','security','Mining difficulty','Bitcoin mining difficulty.','difficulty','numeric'),
  ('security.block_time','security','Average block time','Average Bitcoin block time.','minutes','numeric'),
  ('security.fee_subsidy_ratio','security','Fee / subsidy ratio','Transaction fees relative to block subsidy.','ratio','numeric'),
  ('monetary.circulating_supply','monetary','Circulating supply','Estimated circulating Bitcoin supply.','BTC','numeric'),
  ('monetary.max_supply','monetary','Maximum supply','Protocol maximum supply.','BTC','numeric'),
  ('monetary.block_subsidy','monetary','Block subsidy','Current block subsidy.','BTC/block','numeric'),
  ('network.transaction_count','network','Daily confirmed transactions','Daily confirmed Bitcoin transactions.','transactions/day','numeric'),
  ('network.mempool_size','network','Mempool size','Bitcoin mempool size.','MB','numeric'),
  ('network.utxo_count','network','UTXO count','Unspent transaction output count.','UTXOs','numeric'),
  ('network.lightning_capacity','network','Lightning network capacity','Public Lightning network capacity.','BTC','numeric'),
  ('institutional.etf_net_flow','institutional','US spot Bitcoin ETF net flow','Daily US spot Bitcoin ETF net flow.','USD million/day','numeric'),
  ('institutional.etf_btc_holdings','institutional','US spot Bitcoin ETF holdings','BTC held by US spot Bitcoin ETFs.','BTC','numeric'),
  ('institutional.corporate_btc_holdings','institutional','Corporate treasury BTC holdings','BTC held by corporate treasuries.','BTC','numeric'),
  ('market.futures_open_interest','market','Bitcoin futures open interest','Open interest in Bitcoin futures.','USD','numeric'),
  ('market.perpetual_funding','market','Bitcoin perpetual funding rate','Perpetual futures funding rate.','percent/8h','numeric'),
  ('market.options_open_interest','market','Bitcoin options open interest','Open interest in Bitcoin options.','USD','numeric'),
  ('macro.dxy','macro','US Dollar Index','US Dollar Index.','index','numeric'),
  ('macro.us_10y_yield','macro','US 10Y Treasury yield','US 10-year Treasury yield.','percent','numeric'),
  ('technology.bitcoin_core_version','technology','Bitcoin Core version','Bitcoin Core software version.','version','text'),
  ('technology.critical_vulnerability','technology','Critical Bitcoin vulnerability','Critical vulnerability event indicator.','boolean/event','boolean')
on conflict (metric_id) do update set
  namespace=excluded.namespace,name=excluded.name,description=excluded.description,
  default_unit=excluded.default_unit,value_type=excluded.value_type,updated_at=now();

insert into sources
  (source_id,name,source_type,base_url,trust_level,description)
values
  ('protocol.primary','Bitcoin Developer Reference','primary','https://developer.bitcoin.org/reference/','high','Protocol and node-level facts.'),
  ('network.primary','Mempool.space','primary','https://mempool.space/','high','Public Bitcoin network, mempool and Lightning data.'),
  ('market.primary','Market data provider','market',null,'to_validate','Production market-data provider abstraction.'),
  ('institutional.primary','Farside Investors — Bitcoin ETF flows','institutional','https://farside.co.uk/btc/','high','US spot Bitcoin ETF flow and holdings data.'),
  ('analytics','Glassnode','analytics','https://glassnode.com/','high','On-chain and market analytics.'),
  ('lightning.primary','Mempool.space Lightning','primary','https://mempool.space/docs/api/rest','high','Lightning network statistics.'),
  ('macro.primary','US Treasury / Federal Reserve / BLS','official','https://home.treasury.gov/','high','US macroeconomic series.'),
  ('market.binance','Binance Spot Market API','primary','https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints','high','Primary spot market adapter.'),
  ('market.bybit','Bybit V5 Market API','primary','https://bybit-exchange.github.io/docs/v5/market/tickers','high','Fallback spot market adapter.'),
  ('market.okx','OKX V5 Market API','primary','https://www.okx.com/docs-v5/en/','high','Fallback spot market adapter.'),
  ('market.mexc','MEXC Spot Market API','primary','https://mexcdevelop.github.io/apidocs/spot_v3_en/','to_validate','Fallback spot market adapter.')
on conflict (source_id) do update set
  name=excluded.name,source_type=excluded.source_type,base_url=excluded.base_url,
  trust_level=excluded.trust_level,description=excluded.description,updated_at=now();

-- Initial BTC research observations with canonical source mapping.
insert into observations
  (metric_id,asset_id,value_numeric,unit,observed_at,source_id,source_url,methodology,status,freshness,revision)
values
  ('market.spot_price','btc',81043,'USD/BTC','2026-09-19T06:38:00Z','market.primary',
   'https://financefeeds.com/bitcoin-btc-price-81043-cftc-crypto-rules-white-house-bull-88000-bear-74000/',
   'Initial research snapshot; mapped from the initial dataset source. Production market feed not yet authoritative for this observation.',
   'NORMAL','STALE',1),
  ('security.hashrate','btc',1001,'EH/s','2026-09-19T00:00:00Z','network.primary',
   'https://shattered.io/bitcoin-hashrate-zettahash-difficulty-2026/',
   'Initial research snapshot; source methodology retained as an initial approximation. Production ingestion should use canonical network data.',
   'NORMAL','STALE',1),
  ('monetary.block_subsidy','btc',3.125,'BTC/block','2026-09-19T00:00:00Z','protocol.primary',
   'https://bitcoin.org/en/bitcoin-paper',
   'Current subsidy after the 2024 halving.',
   'NORMAL','STALE',1),
  ('monetary.max_supply','btc',21000000,'BTC','2026-09-19T00:00:00Z','protocol.primary',
   'https://bitcoin.org/en/faq',
   'Protocol maximum supply.',
   'NORMAL','STALE',1),
  ('monetary.circulating_supply','btc',20086198.00419505,'BTC','2026-09-19T00:00:00Z','network.primary',
   null,
   'Initial research snapshot from Bitcoin Core gettxoutsetinfo; canonical source mapping retained for the database.',
   'NORMAL','STALE',1),
  ('institutional.etf_net_flow','btc',324.6,'USD million/day','2026-09-18T00:00:00Z','institutional.primary',
   'https://farside.co.uk/btc/',
   'Daily US spot Bitcoin ETF net flow.',
   'WATCH','STALE',1),
  ('institutional.etf_net_flow','btc',-295.9,'USD million/day','2026-09-16T00:00:00Z','institutional.primary',
   'https://farside.co.uk/btc/',
   'Daily US spot Bitcoin ETF net flow.',
   'WATCH','STALE',1),
  ('institutional.etf_net_flow','btc',159.5,'USD million/day','2026-09-17T00:00:00Z','institutional.primary',
   'https://farside.co.uk/btc/',
   'Daily US spot Bitcoin ETF net flow.',
   'WATCH','STALE',1),
  ('institutional.etf_net_flow','btc',-450.4,'USD million/day','2026-09-15T00:00:00Z','institutional.primary',
   'https://farside.co.uk/btc/',
   'Daily US spot Bitcoin ETF net flow.',
   'WATCH','STALE',1)
on conflict do nothing;

insert into schema_migrations(version)
values ('crypto-seed-v1')
on conflict (version) do nothing;
