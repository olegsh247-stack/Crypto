# VPS API runtime boundary

Дата: 2026-10-07

## Current state

`workers/crypto-api/src/index.ts` currently combines HTTP routing, response contracts, business logic, PostgreSQL SQL, Neon-specific database client, and Cloudflare Worker `fetch` / `scheduled` entrypoints.

The current production deployment must remain unchanged during VPS preparation.

## Migration boundary

The first VPS implementation must extract only the database runtime dependency.

### Keep unchanged

- route paths;
- HTTP methods;
- JSON response shapes;
- admin authorization semantics;
- market-pair identity validation;
- research lifecycle/freshness contracts;
- ingestion/idempotency logic;
- monitoring refresh gate;
- E2E expectations.

### Replace

`@neondatabase/serverless` → PostgreSQL `pg` pool in the Node runtime.

The Node adapter should expose the same tagged-SQL call shape currently used by the application, using parameterized queries and a bounded connection pool.

It must release connections in all paths, preserve the existing API error boundary, never expose connection strings, and support graceful shutdown.

## Entry-point boundary

Target structure:

- `vps/api/src/server.ts` — Node HTTP entrypoint
- `vps/api/src/db.ts` — pg adapter
- `vps/api/src/routes/` — extracted API routing
- `vps/worker/src/scheduler.ts` — scheduled ingestion entrypoint

Do not duplicate business logic between API and worker.

## Database compatibility rule

Do not rewrite SQL during runtime migration unless PostgreSQL compatibility requires it.

Sequence: clone current Worker code into Node target → replace only DB adapter → compile → run local PostgreSQL → migration suite → API E2E → scheduled ingestion E2E → compare output → refactor duplicated modules only after correctness is proven.

## Cloudflare safety rule

The existing `workers/crypto-api` package and `wrangler.toml` remain the production source until the VPS API passes the complete gate. No Neon/Cloudflare credential is removed during this preparation step.

## Acceptance

Node target is not ready until DB bootstrap, API health, DB health, assets/pairs, history fallback, research lifecycle/freshness, admin security, scheduled ingestion, monitoring refresh, candle idempotency, ETH E2E, BTC E2E and UI runtime E2E all pass against VPS.
