# Release Gate incident — 2026-10-12

## Confirmed cause

Run [38252098393](https://github.com/olegsh247-stack/Crypto/actions/runs/38252098393) completed the database migration/contract job and web build successfully, then failed in the Worker deploy job at **Configure database secret**.

The Cloudflare error was:

> Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed.

This did not establish that the database URL value was invalid. The workflow attempted to rewrite the runtime `DATABASE_URL` secret before deploying the Worker version. Worker deploy and live API E2E were skipped.

## Fixes merged and follow-up hardening

PR [#29](https://github.com/olegsh247-stack/Crypto/pull/29) was merged as [`8916112`](https://github.com/olegsh247-stack/Crypto/commit/8916112f0034d63d8823886a5553719219debbda). It:
- Stops rewriting the already configured runtime `DATABASE_URL` during deploy.
- Makes direct DB contract verification conditional on successful preceding steps.
- Documents that the existing runtime database and provider are unchanged.

A second secret mutation remained in the deploy workflow: optional `ADMIN_TOKEN` configuration. PR [#32](https://github.com/olegsh247-stack/Crypto/pull/32) was merged as [`b25df56`](https://github.com/olegsh247-stack/Crypto/commit/b25df561303c3549614320f0845326db31ddc847). It removes all runtime-secret writes from the release workflow, preserves configured `DATABASE_URL` and `ADMIN_TOKEN`, keeps the Engine contract check gated on successful prior steps, and explicitly excludes ingestion from the production release workflow. Secret rotation is a separate, explicit operation.

The current release workflow must remain manual-only. A successful build/test run is not proof that the production Worker has been deployed. The workflow hardening has not yet been validated by a dedicated CI run, and no production Release Gate was triggered to test it.

## Production state and data-integrity status

### Confirmed from run 38252098393 logs

- The migration/contract job and web build succeeded.
- The secret configuration step failed; Worker deploy and live API E2E were skipped.
- Despite that failure, the historical workflow ran its **Scheduled ingestion E2E and idempotency** step using the configured production database connection. The step started local `wrangler dev` with `DATABASE_URL` and `FORCE_SCHEDULED_INGESTION=1`, then invoked the local scheduled handler twice. This was not a disposable database test.
- The log reports the enabled non-USDT registry as `bch btc cake dash eth ltc sol trx xrp`.
- After the ingestion calls, each of those nine assets had `total=14` daily candle rows and `fresh_2d=3`; the duplicate candle-key check returned `0`.
- The maximum `last_updated_at` for non-disabled monitoring signals changed from `2026-10-08 12:30:54.538989+00` to `2026-10-12 12:57:52.197804+00`. The step reported `fresh_signals=13` and `research_status_rows=2`.

### What is not yet established

- The log proves the ingestion step ran and monitoring timestamps changed. It does **not** enumerate the exact candle rows inserted or updated, nor prove that all candle values are correct.
- The count of three candles within two days per asset and the zero-duplicate check are aggregate checks, not a row-by-row integrity comparison.
- Current Worker health and current API behavior have not yet been independently verified read-only.
- No automatic rollback was run. Do not roll back migrations, delete rows, rewrite candle values, or rerun ingestion as a repair without first identifying exact records and agreeing on a correction.

A read-only comparison of current candle rows and monitoring records against the run logs remains required. Use a read-only query path; do not use the production Release Gate as a diagnostic probe.

## Safe recovery sequence

1. Preserve the merged workflow hardening: no runtime secret mutation and no ingestion in the production release workflow.
2. Validate the workflow file and relevant build/test contracts without triggering a production release.
3. Inspect current Worker health and API behavior read-only.
4. Inspect the exact candle rows and monitoring records changed around 2026-10-12 12:57 UTC, comparing current values with run logs. If historical before-images are unavailable, record that limitation rather than guessing or reverting.
5. Review the current production schema/migration state read-only. Do not roll back migrations without evidence.
6. Only after these checks, explicitly authorize a manual production release. That release must not run ingestion as a side effect and must end with live API and read-only contract verification.

## Architecture boundary

The current public API is still the existing Cloudflare Worker and depends on its configured runtime database secret. The target architecture remains VPS + self-hosted PostgreSQL. This incident fix does not complete that cutover and does not authorize deleting the existing database project.
