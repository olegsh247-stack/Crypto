# Infrastructure v1

## Status

Infrastructure baseline for the Crypto project.

## Hard constraint

The free deployment path must work **without requiring a bank card**.

No paid resources, automatic upgrades, or billing-dependent services are part of the baseline.

## Baseline architecture

```
                    Binance
                       |
              market-data collector
                       |
          +------------+------------+
          |                         |
    realtime 60 sec             daily 1D
    temporary                  permanent
          |                         |
          |                  CryptoDataModel
          |                         |
          +------------+------------+
                       |
                 API / cache
                       |
              Cloudflare Workers
                       |
                     Neon
                  PostgreSQL
                       |
                    Website
```

## Responsibilities

### Cloudflare Workers

Use for:
- API/edge layer
- short-lived cache
- request routing
- optional scheduled ingestion
- serving normalized data to the website

Free baseline target:
- keep normal application traffic within the provider's current free limits
- avoid unnecessary polling
- cache public/read-heavy responses

### Neon

Use as the PostgreSQL persistence layer for:
- daily market history
- normalized observations
- metric definitions and source references where appropriate
- monitoring events
- research snapshots
- scenario state
- other structured CryptoDataModel data

The current dataset size is expected to be small at the start.

For 50 assets:
- 50 daily records/day
- 18,250 daily records/year
- 91,250 daily records/5 years
- 182,500 daily records/10 years

This excludes lower-frequency research metrics and metadata, which remain small relative to the database capacity.

### GitHub

Use for:
- methodology
- schemas
- registries
- configuration
- research snapshots that belong in version control
- integration code

GitHub is not the primary time-series database.

## Market-data policy

### Binance

Binance is the primary market-data source.

For listed assets:
- display price: Binance first
- 1H/4H realtime: Binance first
- 1D historical candles: Binance first
- preserve Binance timestamps and candle boundaries
- do not invent a London-time day boundary

### Fallback exchanges

Current fallback order:

1. Binance
2. OKX
3. Bybit
4. MEXC

Fallback is used only when the preferred source cannot provide the required asset/data.

Every normalized observation records its actual source.

The exchange ordering is a configuration, not a claim that one exchange is universally superior. The ranking must remain versioned and reviewable.

## Realtime policy

Realtime update target: **once per 60 seconds**.

Maximum tracked assets: **50**.

1H and 4H data are temporary and are not part of permanent historical storage.

Do not persist tick-level or minute-level data by default.

If realtime is later upgraded to WebSocket streaming, the DataModel/API contract should remain unchanged.

## Historical policy

Permanent market history is based on Binance 1D klines when Binance supports the asset.

Store:
- asset_id
- source_id
- period_start
- period_end
- open
- high
- low
- close
- volume
- source timestamp
- observation timestamp
- status
- revision

The 7D chart is a view derived from seven daily observations. It is not stored as a separate permanent dataset.

## Capacity assumptions

Initial target:
- 50 assets
- 60-second realtime refresh
- daily permanent market history
- 7D derived from daily history
- no permanent 1m/5m/15m market history
- research metrics collected at their own registry-defined cadence
- public website initially optimized for a small number of concurrent users

The key scaling variable is expected to be **user/API traffic**, not daily market-history storage.

## Cost-control rules

1. Do not store data merely because it can be collected.
2. Do not poll each asset independently when a supported batch endpoint can provide the same data.
3. Do not make every browser client query Binance directly.
4. Cache public/read-heavy API responses.
5. Keep realtime data temporary.
6. Store canonical daily observations once.
7. Keep raw source data only when required for validation, revision tracking, or research.
8. No paid provider is required for the baseline deployment.
9. No automatic billing or automatic paid-plan upgrade is allowed in the baseline.

## Free-tier acceptance criteria

Infrastructure v1 is acceptable only if:

- the core website works on free plans;
- the core database works on a free plan;
- no bank card is required for the intended free deployment path;
- no paid API is required for the baseline market-data layer;
- 50 assets can be tracked;
- realtime refresh can run at 60 seconds;
- daily history can be retained;
- research/monitoring data can be stored;
- provider limits are documented and monitored;
- moving to a paid plan later does not require changing the CryptoDataModel.

## Next validation

Before production deployment, verify current provider terms and account-specific signup requirements again. Provider free-tier limits can change.

The next infrastructure test should model:
- 10 concurrent users
- 100 concurrent users
- 1,000 concurrent users

and measure API requests, cache hit ratio, database reads/writes, and realtime collector load.
