# VPS worker schedule and parity gate

**Status:** CI passed on commit `103440d8c03842b64562d62c9c5c3f147deec380`; VPS API Build Rehearsal #251 and Product Contour Gate #225 are green. No production DB or VPS was touched.

## Scope

This change is limited to worker scheduling and regression coverage. It does not change API contracts, database schema, migrations, production data, or deployment configuration.

## London-midnight schedule

- Normal VPS worker mode waits for the next `Europe/London` midnight, then re-arms for the next calendar-day boundary after the run completes.
- The next boundary is calculated using the IANA timezone database through `Intl.DateTimeFormat`; it is not a fixed 24-hour interval.
- `WORKER_INTERVAL_MS=0` remains an explicit one-shot mode for the disposable PostgreSQL CI rehearsal.
- The worker logs the next scheduled UTC instant and identifies the schedule timezone as `Europe/London`.

## Automated schedule cases

The worker test suite checks:
- GMT midnight calculation;
- BST midnight calculation;
- the 23-hour day at the spring DST transition;
- the 25-hour day at the autumn DST transition;
- strictly-future scheduling when invoked exactly at a boundary.

## Monitoring signal regression

The existing disposable-PostgreSQL worker E2E runs ingestion twice. It now captures the full JSONB rows for every non-disabled `monitoring_signals` record before and after both runs, instead of comparing only the maximum timestamp. The gate requires at least one non-disabled signal row and requires the full snapshot to remain byte-for-byte equal in canonical JSONB output.

This is a stronger regression check than comparing only `max(last_updated_at)`: a change to any included signal row, including its evaluation timestamp, fails the gate.

## Still outstanding

- CI verified GMT/BST/DST schedule cases, repeated worker ingestion, full monitoring-signal row immutability, API parity against the live Worker, and isolated PostgreSQL backup/restore.
- Account-level Cloudflare/Neon inventory and production migration/rollback readiness remain outside this disposable CI proof.
- The next step is a repository-level hosting dependency inventory, followed by an explicit gap list for the eventual controlled cutover.

No production database or VPS has been touched by this change.
