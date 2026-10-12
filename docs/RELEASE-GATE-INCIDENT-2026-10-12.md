# Release Gate incident — 2026-10-12

## Confirmed cause

Run [38252098393](https://github.com/olegsh247-stack/Crypto/actions/runs/38252098393) completed the database migration/contract job and web build successfully, then failed in the Worker deploy job at **Configure database secret**.

The exact Cloudflare error in the job log was:

> Secret edit failed. You attempted to modify a secret, but the latest version of your Worker isn't currently deployed.

This was not evidence that the database URL value itself was invalid. The workflow attempted to rewrite the runtime `DATABASE_URL` secret before deploying the Worker version. The subsequent Worker deploy and live API E2E steps were skipped. A direct Engine contract check was nevertheless configured with `always()`, so it ran after the deployment failure. The run also executed a scheduled-ingestion/idempotency step from the workflow version used by that run; this must not be allowed to run after a failed deployment in future release runs.

## Changes in this fix

- Stop rewriting the already configured runtime `DATABASE_URL` secret during each Worker deployment. A deployment should not require the original database URL to be copied into GitHub Actions if the runtime secret is already configured in Cloudflare.
- Keep the existing runtime secret untouched. This patch does not change the database provider or detach the current Worker from its existing database.
- Run the post-deployment database contract check only when all preceding deployment and E2E steps succeed; it must not run as an unconditional `always()` side path after failure.
- Keep the Release Gate manual-only. Validate this workflow change in GitHub before any new production run.

## Production state and safe recovery

The failed run did **not** deploy the Worker code because the deploy step was skipped. The migration/contract job and web build did complete. No automatic rollback was run, because the database migration job may have applied valid, forward-compatible migrations and blind rollback would be unsafe.

The run's ingestion/idempotency step did execute and may have changed live candle rows and monitoring timestamps. Do not rerun it to "repair" the state. Before the next production release:
1. Review the current production data for the affected time window using read-only queries and compare with available run logs.
2. Confirm the currently deployed Worker health and runtime behavior.
3. Merge and validate this workflow guard fix.
4. Only then, with an explicitly approved release, deploy the Worker and run read-only API/contract checks. Do not execute ingestion as a deployment side effect.

## Architecture boundary

The current public API is still the existing Worker and depends on its configured runtime database secret. The target architecture remains VPS + self-hosted PostgreSQL. This incident fix is a narrow release-safety correction; it does not claim that the self-hosted cutover is complete or that the old database project has been deleted.
