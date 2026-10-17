# VPS Worker schedule contract

Status: target-hosting implementation

## Schedule

The VPS Worker runs scheduled ingestion once per UTC day at `00:30` by default. The configured time is `WORKER_SCHEDULE_UTC` in `HH:mm` UTC format. Docker Compose sets it to `00:30`.

The process calculates the next UTC occurrence and schedules the next run only after the current run finishes. It does not run ingestion immediately on process startup and does not use a 24-hour interval measured from container startup. This avoids schedule drift after restarts and prevents overlapping runs in one process.

## Operations

- Keep the Worker and PostgreSQL on the VPS Docker network.
- Do not run production ingestion as part of release/deployment checks.
- Build and E2E checks must use a disposable PostgreSQL database.
- On restart, the Worker schedules the next upcoming UTC occurrence; if `00:30 UTC` has already passed, the next run is the following day.
- `WORKER_SCHEDULE_UTC` must match `HH:mm` and is interpreted as UTC, not server-local time.

## Verification

The VPS Build Rehearsal must compile the Worker and run ingestion/idempotency E2E against disposable PostgreSQL. Before production cutover, verify the VPS system clock is synchronized and confirm the first scheduled execution from service logs.

## Cutover boundary

This change defines the target VPS schedule only. It does not disable the legacy legacy runtime Worker, change source database, deploy a VPS, or run ingestion against production.
