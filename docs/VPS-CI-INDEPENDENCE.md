# VPS CI independence

## Decision

The VPS Build Rehearsal must be self-contained. It must not call any live production endpoint to decide whether the VPS implementation passes CI. Production availability or live data freshness must not make an isolated PostgreSQL/API build flaky.

## Verification

The workflow uses disposable PostgreSQL 16 and repository migrations. It verifies:

- shared runtime, worker and API builds;
- repeatable migration bootstrap;
- registry and asset lifecycle contracts;
- authenticated mutation boundaries;
- worker ingestion idempotency;
- API history and daily-candle finalization;
- admin authorization;
- health, database health, BTC response shape and history response shape;
- backup checksum and restore table counts.

## Scope

CI must not deploy, modify production data, change secrets, or migrate production data. The purchased VPS is the only target for future deployment.
