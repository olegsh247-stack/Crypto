# BTC Kraken Runtime Mapping Gate — 2026-10-13

**Status: BLOCKED — registry metadata exists, but the production-style worker does not ingest this spot-price observation.**
**Scope:** repository inspection only. No production database access or writes; no scenario or monitoring changes.

## What was verified

- `data/CryptoDataModel/registry/metric-registry.json` assigns `market.spot_price` to source priority `market.kraken`, unit `USD/BTC`, and a 1-hour freshness window.
- `data/CryptoDataModel/registry/source-registry.json` describes the Kraken public Trades endpoint and XBT-to-BTC normalization.
- Migration `2026-10-13-btc-kraken-trade-source.sql` registers `market.kraken` as source metadata only. It intentionally inserts no observation.
- `scripts/capture-btc-public-sources.mjs` can capture and validate a Kraken Trades response in read-only staging. It marks the price as `CANDIDATE_ONLY`.
- The current `vps/worker/src/scheduler.ts` fetches daily OHLC candles (Binance, then Kraken OHLC, then CoinGecko) and writes `market_daily_candles`. Its Kraken function calls `/0/public/OHLC`, labels candles `market_kraken`, and does not call `/0/public/Trades`.
- `runScheduledIngestion` does not currently create rows in `observations`. Therefore the presence of `market.kraken` in the metric/source registries does not establish an operational spot-price observation path.

## Decision

Do not promote the captured Kraken trade to a canonical observation and do not mark BTC spot-price readiness as passed. The recent migration and successful disposable-PostgreSQL rehearsals verify the registry metadata and migration path, not the missing runtime adapter.

Keep these source IDs distinct:
- `market.kraken`: candidate point-in-time trade source for `market.spot_price`.
- `market_kraken`: daily OHLC fallback used for `market_daily_candles`.

## Required implementation gate

Before accepting a BTC spot-price observation, implement and test a dedicated, fail-closed adapter that:

1. Calls Kraken public Trades for `XBTUSD` and checks HTTP status, API-level errors, returned pair key, numeric price, and actual trade epoch timestamp.
2. Preserves the raw pair/response provenance and maps XBT to the canonical BTC asset without changing the source ID.
3. Rejects a future timestamp and any trade older than the registry's 1-hour window; calculates freshness from `observed_at`, not retrieval time.
4. Writes only to the canonical `observations` contract with `metric_id=market.spot_price`, `asset_id=btc`, `unit=USD/BTC`, registered `source_id=market.kraken`, HTTPS `source_url`, and a stable logical observation key/revision policy.
5. Has disposable-PostgreSQL tests for duplicate reruns, stale/future timestamps, malformed/empty responses, API errors, pair normalization, and no-write-on-failure.
6. Runs as a candidate/rehearsal path first. Production ingestion and scenario/monitoring writes remain out of scope until separately reviewed and authorized.

## Next priority

Implement the adapter contract and its isolated tests. Do not broaden the asset universe, change published scenario probabilities, or use this registry-only migration as evidence that live BTC inputs are ready.
