# VPS API runtime boundary

Updated: 2026-10-12

## Target structure

- `vps/api/src/server.ts` — Node HTTP entrypoint
- `vps/api/src/app.ts` — HTTP routing, response contracts and application logic
- `vps/shared/src/db.ts` — standard PostgreSQL pool adapter
- `vps/worker/src/scheduler.ts` — scheduled ingestion entrypoint

## Keep stable

- route paths and HTTP methods;
- JSON response shapes;
- admin authorization semantics;
- market-pair identity validation;
- research lifecycle and freshness contracts;
- ingestion/idempotency logic;
- monitoring refresh gate;
- E2E expectations.

## Runtime requirements

Use parameterized PostgreSQL queries and a bounded connection pool. Release connections on all paths, preserve the API error boundary, never expose connection strings, and support graceful shutdown. Do not duplicate business logic between API and worker.

## Acceptance

Node target is not ready until clean DB bootstrap, API health, assets/pairs, history finalization, research lifecycle/freshness, evidence/scenarios, monitoring, admin security, scheduled ingestion, candle idempotency, BTC E2E and UI runtime E2E pass against disposable PostgreSQL.
