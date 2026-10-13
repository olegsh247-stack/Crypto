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

1. The explicit live-capture rehearsal is complete and passed in [BTC Kraken Live Candidate Rehearsal #2](https://github.com/olegsh247-stack/Crypto/actions/runs/38360852900); standard checks for the later docs/test commits also passed.
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

The live rehearsal subsequently **passed** in [BTC Kraken Live Candidate Rehearsal #2](https://github.com/olegsh247-stack/Crypto/actions/runs/38360852900) on commit `e7d553732d9a05a8c9952cc200645150275e99b3`. The first attempt (#1) failed at the explicit-confirmation step before any database or external API action; the guard was corrected, and the next run passed end-to-end. The successful run captured a candidate price of 83,590.3 USD/BTC at exchange time `2026-10-13T07:09:13.118Z`, retrieved at `2026-10-13T07:09:25.872Z` (12 seconds old), HTTP 200, returned pair key `XXBTZUSD`, raw payload SHA-256 `02f5b8a02d5668d1855de3ce5c413d779954706a276f15c210af42dde0459284`. It inserted one row, verified a duplicate was a no-op, checked the stored fields, rolled back, then independently confirmed `persisted_rows=0`. The price remains `CANDIDATE_ONLY`; this does not approve production ingestion or scenario use.

This remains rehearsal-only: no production DB credentials are used, no production observations are written, scheduled ingestion remains unchanged, and BTC scenario/monitoring state and published probabilities remain untouched.


## Live candidate rehearsal result — 2026-10-13

- Run: https://github.com/olegsh247-stack/Crypto/actions/runs/38360852900 — **SUCCESS**.
- Candidate: BTC/USD 83,590.3 USD/BTC; source timestamp 2026-10-13 07:09:13.118 UTC; retrieved 2026-10-13 07:09:25.872 UTC; age 12 seconds; freshness CURRENT; HTTP 200.
- Returned pair key: `XXBTZUSD`; source: `https://api.kraken.com/0/public/Trades?pair=XBTUSD`.
- Raw payload SHA-256: `02f5b8a02d5668d1855de3ce5c413d779954706a276f15c210af42dde0459284`.
- The temporary PostgreSQL database was loopback-only (`127.0.0.1`, `crypto_test`); repository migrations passed. The rehearsal inserted once, confirmed a duplicate insert did nothing, verified the candidate fields, rolled back, and then independently confirmed `persisted_rows=0`. The disposable database was removed.
- No production database credentials were used; no production observation, scenario, monitoring state, or published probability was changed.
- Workflow #1 failed only at the confirmation guard before building or contacting Kraken. The guard was corrected, and workflow #2 passed all steps.
- The workflow keeps a narrow `push` trigger limited to changes to its own workflow file on this feature branch, so this one-off rehearsal can be repeated by explicitly updating that file; it is not scheduled and ordinary documentation/code pushes do not trigger the live network capture.


## Scenario readiness handoff — 2026-10-13

The standard CI checks on commit `72becab84d2def726df838204083822221410d2e` all passed: VPS API Build Rehearsal #635, Seed observation idempotency #35 and Validate VPS Release Workflow #58. The scenario-readiness regression added in the subsequent commit verifies that the Kraken candidate alone cannot pass the input gate; other required metrics remain blockers.

The candidate capture is evidence that the adapter and rollback rehearsal work, not an accepted current scenario input for all time. It is not written to production and cannot be used to bypass the required freshness window. The next product step is to obtain source-verified current inputs for the remaining metrics and daily ETF flow series, then produce a read-only, reproducible confirmation/invalidation assessment for the published BTC Base thesis. No directional-rule prototype or probability changes are approved by this handoff.
