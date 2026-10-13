# BTC Kraken Runtime Mapping Gate — 2026-10-13

**Status: PASS — candidate contract and rollback-only PostgreSQL rehearsal verified in CI; production ingestion remains blocked.**
**Scope:** repository code and isolated/rollback-only tests. No production database access or writes; no scenario or monitoring changes.

## What was verified

- `data/CryptoDataModel/registry/metric-registry.json` assigns `market.spot_price` to source priority `market.kraken`, unit `USD/BTC`, and a 1-hour freshness window.
- `data/CryptoDataModel/registry/source-registry.json` describes the Kraken public Trades endpoint and XBT-to-BTC normalization.
- Migration `2026-10-13-btc-kraken-trade-source.sql` registers `market.kraken` as source metadata only. It intentionally inserts no observation.
- `vps/worker/src/scheduler.ts` fetches daily OHLC candles (Binance, then Kraken OHLC, then CoinGecko) and writes `market_daily_candles`. Its Kraken function calls `/0/public/OHLC`, labels candles `market_kraken`, and does not call `/0/public/Trades`.
- `runScheduledIngestion` does not currently create rows in `observations`. Registry metadata therefore does not establish an operational spot-price observation path.
- `vps/worker/src/krakenSpotPrice.ts` provides a pure parser and injectable read-only network capture function. It validates HTTP status, JSON/API errors, returned BTC/USD pair key, all trade rows, positive numeric price and actual epoch timestamp; rejects future timestamps; calculates freshness from the trade time; and returns the raw response body, source URL, HTTP status, retrieval/observation timestamps and SHA-256 for review. It never writes to PostgreSQL.
- `toKrakenObservationCandidateRow` now maps only a current, source-provenanced capture to the canonical observation fields. It fails closed on stale data, invalid identity/unit/URL/status, missing raw response/hash or invalid/future timestamps. It is a mapper only; it does not perform a write.
- Unit tests cover current/stale trades, future timestamps, API errors, malformed/empty rows, pair key validation, HTTP failures, invalid JSON, raw response/hash provenance, candidate field mapping, and rejection of stale or incomplete provenance.
- Added `scripts/test-btc-kraken-observation-contract.sql` and a shell guard. The disposable rehearsal validates registered BTC/metric/source, the natural-key index, one insert followed by an idempotent duplicate attempt, and metric/source foreign-key rejection. The SQL fixture runs in a transaction and always rolls back; the shell script refuses non-loopback hosts and databases not ending in `_test`.
- Added the rollback-only rehearsal to `.github/workflows/vps-api-build.yml`. VPS API Build Rehearsal #616 passed on commit `dfee4a1bd107c7edfdbe1cb3353864bb1aacaafe`, including worker build/unit tests, clean PostgreSQL migrations, this candidate observation rehearsal, worker ingestion E2E and BTC research evidence/snapshot lineage E2E. Seed observation idempotency rehearsal #25 also passed on the same commit. Evidence: https://github.com/olegsh247-stack/Crypto/actions/runs/38359583130 and https://github.com/olegsh247-stack/Crypto/actions/runs/38359583135.

## Contract decision

Canonical observation mapping:
- `metric_id=market.spot_price`
- `asset_id=btc`
- `value_numeric` = positive Kraken trade price
- `unit=USD/BTC`
- `observed_at` = exchange trade timestamp, not retrieval time
- `source_id=market.kraken`
- `source_url` = HTTPS Kraken Trades endpoint
- `methodology` records adapter version, retrieval time, raw payload SHA-256 and returned pair key
- `status=NORMAL`, `freshness=CURRENT`, `revision=1`

The natural logical key is the BTC partial unique index over metric, source, observation time, period bounds and revision. Repeated observations at the same trade timestamp cannot create another revision-1 row. A policy for meaningful corrections/revisions has not been approved; this implementation does not invent one.

Keep these source IDs distinct:
- `market.kraken`: candidate point-in-time trade source for `market.spot_price`.
- `market_kraken`: daily OHLC fallback used for `market_daily_candles`.

## Still blocked

1. Confirm the latest worker build/tests and rollback-only PostgreSQL contract rehearsal pass on the current commit.
2. Review how the raw response is retained for durable audit; the candidate object returns the raw body and hash, but the observation table stores the hash and provenance in `methodology`, not the entire raw body.
3. Keep this candidate path out of scheduled production ingestion. A separate explicit decision is required before any production observation writes.
4. Do not calculate or persist live BTC scenario/monitoring state until all required inputs pass freshness/provenance gates and the deterministic scoring rule is reviewed.

No production database was accessed or modified. No scenario/monitoring state was written, no published probabilities were changed, and no other assets were added.
