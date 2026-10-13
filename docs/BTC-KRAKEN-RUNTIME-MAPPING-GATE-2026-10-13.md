# BTC Kraken Runtime Mapping Gate — 2026-10-13

**Status: PARTIAL — candidate parser added; runtime ingestion remains blocked.**
**Scope:** repository code and isolated tests only. No production database access or writes; no scenario or monitoring changes.

## What was verified

- `data/CryptoDataModel/registry/metric-registry.json` assigns `market.spot_price` to source priority `market.kraken`, unit `USD/BTC`, and a 1-hour freshness window.
- `data/CryptoDataModel/registry/source-registry.json` describes the Kraken public Trades endpoint and XBT-to-BTC normalization.
- Migration `2026-10-13-btc-kraken-trade-source.sql` registers `market.kraken` as source metadata only. It intentionally inserts no observation.
- `scripts/capture-btc-public-sources.mjs` can capture a Kraken Trades response in read-only staging. It marks the price as `CANDIDATE_ONLY`.
- `vps/worker/src/scheduler.ts` fetches daily OHLC candles (Binance, then Kraken OHLC, then CoinGecko) and writes `market_daily_candles`. Its Kraken function calls `/0/public/OHLC`, labels candles `market_kraken`, and does not call `/0/public/Trades`.
- `runScheduledIngestion` does not currently create rows in `observations`. Registry metadata therefore does not establish an operational spot-price observation path.
- Added pure parser `vps/worker/src/krakenSpotPrice.ts`. It validates the response/error shape, returned BTC/USD pair key, trade rows, price and timestamp; selects the newest trade; rejects future timestamps; calculates freshness from the actual trade time; and returns a `CANDIDATE_ONLY` object without network or database side effects.
- Added `vps/worker/src/krakenSpotPrice.test.ts` for current/stale trades, future timestamps, API errors, malformed/empty rows, pair key validation and canonical output fields. Worker test command now includes all compiled `*.test.js` files.

## Decision

Do not promote the captured Kraken trade to a canonical observation and do not mark BTC spot-price readiness as passed. The parser is a first isolated implementation step, not an active collector and not an observation writer. CI must pass before the parser tests are treated as verified.

Keep these source IDs distinct:
- `market.kraken`: candidate point-in-time trade source for `market.spot_price`.
- `market_kraken`: daily OHLC fallback used for `market_daily_candles`.

## Remaining implementation gate

1. Add a network adapter around the pure parser that checks HTTP status and retains raw response/provenance metadata; keep the fetch function independently testable.
2. Add disposable-PostgreSQL tests for the observation contract and idempotent logical key/revision policy. Do not connect this path to scheduled production ingestion yet.
3. Confirm a candidate can only be written in an explicitly invoked rehearsal mode; test no-write-on-failure, stale/future timestamps, duplicate reruns and source/metric foreign-key registration.
4. Review source URL, raw-payload hash, retrieval time, observation time, units and logical key before any separate authorization for production ingestion.

Production ingestion and scenario/monitoring writes remain out of scope until separately reviewed and authorized. Do not broaden the asset universe or change published scenario probabilities.
