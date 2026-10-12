# Release Gate incident — 2026-10-12

## Confirmed cause

Run [38252098393](https://github.com/olegsh247-stack/Crypto/actions/runs/38252098393) completed the database migration/contract job and web build successfully, then failed in the Worker deploy job at **Configure database secret**.

The Cloudflare error was:

> Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed.

This did not establish that the database URL value was invalid. The workflow attempted to rewrite the runtime `DATABASE_URL` secret before deploying the Worker version. Worker deploy and live API E2E were skipped. The historical workflow version also ran a scheduled-ingestion/idempotency step and a direct DB contract check after deployment failure; that behavior is removed/guarded in the current workflow.

## Fixes merged and follow-up hardening

PR [#29](https://github.com/olegsh247-stack/Crypto/pull/29) was merged as [`8916112`](https://github.com/olegsh247-stack/Crypto/commit/8916112f0034d63d8823886a5553719219debbda). It:
- Stops rewriting the already configured runtime `DATABASE_URL` during deploy.
- Makes direct DB contract verification conditional on successful preceding steps.
- Documents that the existing runtime database and provider are unchanged.

A second secret mutation remained in the deploy workflow: optional `ADMIN_TOKEN` configuration. The same Cloudflare deployment-version constraint could affect this step too. The follow-up branch `fix/release-gate-preserve-worker-secrets` removes all runtime-secret writes from the release workflow. Secret rotation is a separate, explicit operation.

The current release workflow must remain manual-only. A successful build/test run is not proof that the production Worker has been deployed.

## Production state and data-integrity status

- In run 38252098393, the migration/contract job and web build succeeded.
- Worker deploy and live API E2E were skipped.
- No automatic rollback was run; valid forward-compatible migrations must not be blindly reversed.
- The old workflow's scheduled-ingestion/idempotency step did run despite the deployment failure. It may have changed live candle rows and monitoring timestamps. This is an **unverified possible side effect**, not proof of corruption.
- A read-only comparison of affected candle rows and monitoring timestamps against run logs is still required. Do not rerun ingestion to repair it and do not delete or rewrite rows without identifying exact affected records and agreeing on a correction.

## Safe recovery sequence

1. Merge the release-workflow hardening that preserves both runtime secrets.
2. Run CI validation for the workflow change; do not trigger the production Release Gate merely to test it.
3. Inspect current Worker health and API behavior read-only.
4. Inspect the affected production candle and monitoring records read-only, comparing observed timestamps and values with the failed run's logs.
5. Review the current production schema/migration state. Do not roll back migrations without evidence.
6. Only after the above checks, explicitly authorize a manual production release. That release must not run ingestion as a side effect and must end with live API and read-only contract verification.

## Architecture boundary

The current public API is still the existing Cloudflare Worker and depends on its configured runtime database secret. The target architecture remains VPS + self-hosted PostgreSQL. This incident fix does not complete that cutover and does not authorize deleting the existing database project.
