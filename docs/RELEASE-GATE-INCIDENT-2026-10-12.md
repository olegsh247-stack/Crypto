# Release Gate incident — 2026-10-12

## Confirmed cause

Run [38252098393](https://github.com/olegsh247-stack/Crypto/actions/runs/38252098393) completed the database migration/contract job and web build successfully, then failed in the Worker deploy job at **Configure database secret**.

The legacy runtime error was:

> Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed.

This did not establish that the database URL value was invalid. The workflow attempted to rewrite the runtime `DATABASE_URL` secret before deploying the Worker version. Worker deploy and live API E2E were skipped.

## Fixes merged and follow-up hardening

PR [#29](https://github.com/olegsh247-stack/Crypto/pull/29) was merged as [`8916112`](https://github.com/olegsh247-stack/Crypto/commit/8916112f0034d63d8823886a5553719219debbda). It stops rewriting the already configured runtime `DATABASE_URL` during deploy and gates direct DB contract verification on successful preceding steps.

PR [#32](https://github.com/olegsh247-stack/Crypto/pull/32) was merged as [`b25df56`](https://github.com/olegsh247-stack/Crypto/commit/b25df561303c3549614320f0845326db31ddc847). It removes all runtime-secret writes from the release workflow, preserves configured `DATABASE_URL` and `ADMIN_TOKEN`, and explicitly excludes ingestion from the production release workflow. Secret rotation is a separate, explicit operation.

PR [#34](https://github.com/olegsh247-stack/Crypto/pull/34) added a production-independent `actionlint` workflow. Both the PR run and the post-merge run succeeded: [PR validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38261028571) and [main validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38261042187). This confirms static workflow validation only; it is not a live deployment test.

The current Release Gate remains manual-only. A successful build/test run is not proof that the production Worker has been deployed.

## Production state and data-integrity audit

### Confirmed from run 38252098393 logs

- The migration/contract job and web build succeeded.
- The secret configuration step failed; Worker deploy and live API E2E were skipped.
- Despite that failure, the historical workflow ran its **Scheduled ingestion E2E and idempotency** step using the configured production database connection. The step started local `runtime-cli dev` with `DATABASE_URL` and `FORCE_SCHEDULED_INGESTION=1`, then invoked the local scheduled handler twice. This was not a disposable database test.
- The log reports the enabled non-USDT registry as `bch btc cake dash eth ltc sol trx xrp`.
- The log reported 14 daily candle rows per asset, three candles within two days, and zero duplicate candle keys.
- The maximum `last_updated_at` for non-disabled monitoring signals changed from `2026-10-08 12:30:54.538989+00` to `2026-10-12 12:57:52.197804+00`. The step reported `fresh_signals=13` and `research_status_rows=2`.

### Read-only production database checks completed on 2026-10-12

Queries were executed against the existing source PostgreSQL project `Crypto` project, default `production` branch, database `source PostgreSQL projectdb`. All queries were read-only.

- **36 candle rows were newly created during the incident window** (2026-10-12 12:57:49–12:57:50 UTC): four daily candles per each of the nine enabled non-USDT assets, with candle open dates 2026-10-09 through 2026-10-12. All 36 rows identify `market_binance` and the corresponding Binance USDT symbol.
- Each of the nine assets currently has 14 rows spanning candle open dates 2026-09-29 through 2026-10-12. There are zero duplicate keys for `(asset_id, candle_open_at, source_id)`.
- A structural OHLCV check found zero rows with invalid high/low/open/close relationships or negative volume across the 126 candle rows.
- There is one candle per asset whose close time is in the future: the 2026-10-12 daily candle, scheduled to close on 2026-10-13 UTC. This is an in-progress daily candle, not a finalized daily close; consumers must not present it as a closed candle.
- All 13 non-disabled monitoring signals (7 `active`, 6 `watch`) currently have `last_updated_at=2026-10-12 12:57:52.197804+00`. Their stored values are descriptive thesis text, and `previous_value` is null. No rows were found in `observations` created during the incident window, and no `monitoring_events` rows were found in that window.
- The schema's `market_daily_candles` table has `created_at` but no `updated_at`. Therefore the current table can identify the 36 new rows but cannot identify every pre-existing row that may have been overwritten by an upsert or recover its before-image. Current values cannot be declared fully correct solely from structural checks.
- The migration ledger was inspected read-only. No migration rollback or schema mutation was performed.
- A direct independent live API health check has **not** been confirmed. The public endpoint was inaccessible from the available web fetch path and DNS lookup from the current environment failed; that is not evidence by itself that the Worker is down.

### Additional deployment configuration finding

The selected target cadence is **daily at 00:30 UTC** (`30 0 * * *`). This is the initial operating schedule while we establish a stable, auditable ingestion cycle. Moving to hourly later is expected to be a configuration change, provided idempotency, source limits, and in-progress candle handling are verified first.

The release workflow deploys from the repository root (`workingDirectory: "."`), and the Worker dry-run build also uses the root `runtime-cli.toml`; the root file is therefore the production deployment source of truth. The nested `former-runtime-source/runtime-cli.toml` has now been aligned to the same daily cron so local/nested commands do not silently imply a different schedule. This repository change does **not** deploy the Worker or prove which cron is currently active in production. The failed Gate did not deploy, so production cadence remains unconfirmed until a separately approved deployment and read-only verification.

Do not add ingestion to the release workflow. Release and scheduled ingestion remain separate operations.

### What remains unknown

- Exact before/after values for any pre-existing candle rows updated by upsert.
- Independent parity of the three completed candles (2026-10-09, 10, 11) against the source's historical response at the time of ingestion. The current DB values and OHLCV structure are available, but no before-image/source-response archive was found in the incident log.
- Current live Worker/API health, the API's handling of the in-progress 2026-10-12 candle, and the cron configuration active on the deployed Worker. The repository now consistently specifies daily at 00:30 UTC, but production has not yet been redeployed to confirm it.

Do **not** roll back migrations, delete rows, rewrite candle values, or rerun ingestion as a repair without identifying exact records and agreeing on a correction. The evidence so far does not establish corruption, but it also does not prove complete row-level correctness.

## Safe recovery sequence

1. Preserve the merged workflow hardening: no runtime secret mutation and no ingestion in the production release workflow.
2. Keep the successful static validation as the CI baseline; validate any further workflow changes without triggering production release.
3. Keep the repository's root Worker config authoritative and the nested config synchronized; the selected target is daily at 00:30 UTC. Verify the deployed schedule only after an explicitly approved release.
4. Verify current Worker health and API behavior through an independent read-only request path.
5. Inspect and document current candle source parity, especially completed dates 2026-10-09 through 2026-10-11. If historical before-images are unavailable, record that limitation rather than guessing or reverting.
6. Ensure API responses distinguish the in-progress 2026-10-12 candle from finalized daily candles; do not alter production data as part of this check.
7. Only after these checks, explicitly authorize a manual production release. That release must not run ingestion as a side effect and must end with live API and read-only contract verification.

## Architecture boundary

The current public API is still the existing legacy runtime Worker and depends on its configured runtime database secret. The target architecture remains VPS + self-hosted PostgreSQL. This incident fix does not complete that cutover and does not authorize deleting the existing database project.
