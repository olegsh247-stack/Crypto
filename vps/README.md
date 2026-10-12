# VPS local rehearsal

This profile runs the API and Worker against self-hosted PostgreSQL for local rehearsal. It does not deploy to production.

## Start PostgreSQL

`docker compose up -d postgres`

## Apply repository schema and migrations

From the repository root:

`DATABASE_URL=postgresql://crypto:crypto_local_only@127.0.0.1:55432/crypto bash ./scripts/migrate-postgres.sh`

The provider-neutral migration runner applies the repository's current PostgreSQL schema and versioned migrations to the selected DATABASE_URL. Run only against the intended target.

## Build and start the Node API and worker

`docker compose up --build api worker`

The API is HTTP-only in this local rehearsal profile. Host ports bind to `127.0.0.1` only; PostgreSQL is not exposed to the public network. Scheduled ingestion runs in the separate `worker` process and shares the same PostgreSQL target. The worker does not ingest immediately on startup; it runs at `WORKER_SCHEDULE_UTC` (default `00:30` UTC) and schedules the next run after the previous run finishes.

Then verify GET /api/health, GET /api/db-health, GET /api/assets and GET /api/pairs. Worker logs should report `service":"crypto-worker-vps"` with ingestion counts.

## Safety

Do not put production DATABASE_URL, ADMIN_TOKEN, SSH keys, or VPS credentials in this compose file. The local password is intentionally non-production and must never be reused.
