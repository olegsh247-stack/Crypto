# VPS local rehearsal

This profile is for migration rehearsal only. It does not connect to Neon and does not deploy to Cloudflare.

## Start PostgreSQL

`docker compose up -d postgres`

## Apply repository schema and migrations

From the repository root:

`DATABASE_URL=postgresql://crypto:crypto_local_only@127.0.0.1:55432/crypto ./scripts/migrate-neon.sh`

The existing migration runner is intentionally reused. This proves that the VPS PostgreSQL target can consume the same schema and migrations.

## Build and start the Node API and worker

`docker compose up --build api worker`

The API is HTTP-only. Scheduled ingestion runs in the separate `worker` process and shares the same PostgreSQL target. The worker executes once on startup and then at `WORKER_INTERVAL_MS` (24h by default).

Then verify GET /api/health, GET /api/db-health, GET /api/assets and GET /api/pairs. Worker logs should report `service":"crypto-worker-vps"` with ingestion counts.

## Safety

Do not put production DATABASE_URL, ADMIN_TOKEN, SSH keys, or VPS credentials in this compose file. The local password is intentionally non-production and must never be reused.
