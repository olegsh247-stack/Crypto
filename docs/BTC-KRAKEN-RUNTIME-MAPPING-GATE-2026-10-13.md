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

1. Run the explicit live-capture rehearsal after its `workflow_dispatch` definition is available from the default branch; the current branch's worker build, unit tests and rollback-only synthetic contract rehearsal pass in VPS API Build Rehearsal #626.
2. Review how the raw response is retained for durable audit; the candidate object returns the raw body and hash, but the observation table stores the hash and provenance in `methodology`, not the entire raw body.
3. Keep this candidate path out of scheduled production ingestion. A separate explicit decision is required before any production observation writes.
4. Do not calculate or persist live BTC scenario/monitoring state until all required inputs pass freshness/provenance gates and the deterministic scoring rule is reviewed.

No production database was accessed or modified. No scenario/monitoring state was written, no published probabilities were changed, and no other assets were added.

## Explicit live-capture rehearsal (added 2026-10-13)

Added `vps/worker/src/krakenSpotPriceLiveRehearsal.ts` and `.github/workflows/btc-kraken-live-candidate-rehearsal.yml` as a separately invoked path. It is intentionally not part of scheduled worker ingestion or ordinary CI:

- The workflow requires the exact manual confirmation `RUN_ROLLBACK_ONLY`.
- It creates its own disposable `crypto_test` PostgreSQL instance bound to loopback and applies repository migrations.
- The runner validates the database URL before making the external Kraken request. The script refuses any non-loopback PostgreSQL host or database name not ending in `_test`.
- It captures the current public Kraken XBT/USD Trades response, validates freshness and provenance, then tries the canonical observation insert twice in one transaction.
- Assertions verify the first insert, duplicate no-op, one logical row, and exact persisted candidate fields. The transaction ends with `ROLLBACK`; the workflow then verifies no Kraken BTC observations remain before deleting the disposable database.
- Logs include the candidate price, exchange observation time, retrieval time, freshness, source URL, pair key and raw response SHA-256, but not the full raw payload.

The live rehearsal has **not yet been executed**. The manual workflow is on the open PR branch and requires the workflow file to be available from the repository's default branch before GitHub can dispatch it. No live Kraken price or live database-write test is claimed until a successful workflow run exists.

This remains rehearsal-only: no production DB credentials are used, no production observations are written, scheduled ingestion remains unchanged, and BTC scenario/monitoring state and published probabilities remain untouched.
