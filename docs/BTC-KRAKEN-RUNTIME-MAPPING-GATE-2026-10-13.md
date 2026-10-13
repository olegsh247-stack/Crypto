# BTC Kraken Runtime Mapping Gate — 2026-10-13

**Status: PARTIAL — read-only candidate capture implemented; observation ingestion remains blocked.**
**Scope:** repository code and isolated tests only. No production database access or writes; no scenario or monitoring changes.

## What was verified

- `data/CryptoDataModel/registry/metric-registry.json` assigns `market.spot_price` to source priority `market.kraken`, unit `USD/BTC`, and a 1-hour freshness window.
- `data/CryptoDataModel/registry/source-registry.json` describes the Kraken public Trades endpoint and XBT-to-BTC normalization.
- Migration `2026-10-13-btc-kraken-trade-source.sql` registers `market.kraken` as source metadata only. It intentionally inserts no observation.
- `vps/worker/src/scheduler.ts` fetches daily OHLC candles (Binance, then Kraken OHLC, then CoinGecko) and writes `market_daily_candles`. Its Kraken function calls `/0/public/OHLC`, labels candles `market_kraken`, and does not call `/0/public/Trades`.
- `runScheduledIngestion` does not currently create rows in `observations`. Registry metadata therefore does not establish an operational spot-price observation path.
- Added `vps/worker/src/krakenSpotPrice.ts`: a pure parser plus an independently injectable read-only network capture function. It validates HTTP status, JSON/API errors, returned BTC/USD pair key, all trade rows, positive numeric price and actual epoch timestamp; rejects future timestamps; calculates freshness from the trade time; and returns the raw response body, source URL, HTTP status and SHA-256 for review. It never writes to PostgreSQL.
- Added `vps/worker/src/krakenSpotPrice.test.ts` for current/stale trades, future timestamps, API errors, malformed/empty rows, pair key validation, canonical output fields, raw response/hash provenance, HTTP failures and invalid JSON. Worker test command includes all compiled `*.test.js` files.

## Decision

Do not promote the captured Kraken trade to a canonical observation and do not mark BTC spot-price readiness as passed. The new function is a read-only candidate capture path, not an observation writer and not connected to scheduled ingestion. CI must pass before the implementation is treated as verified.

Keep these source IDs distinct:
- `market.kraken`: candidate point-in-time trade source for `market.spot_price`.
- `market_kraken`: daily OHLC fallback used for `market_daily_candles`.

## Remaining implementation gate

1. Run and confirm worker build/unit tests and disposable PostgreSQL migration/idempotency rehearsals for the latest commit.
2. Design an explicit, opt-in candidate observation rehearsal with the canonical `observations` contract and stable logical key/revision policy; do not wire it to scheduled production ingestion.
3. Add disposable-PostgreSQL tests for duplicate reruns, source/metric foreign keys and no-write-on-failure. Any candidate write must require an explicit rehearsal invocation and remain isolated from production.
4. Review source URL, raw-payload hash, retrieval time, observation time, units and logical key before any separate authorization for production ingestion.

Production ingestion and scenario/monitoring writes remain out of scope until separately reviewed and authorized. Do not broaden the asset universe or change published scenario probabilities.
