# VPS local rehearsal

This profile is for migration rehearsal only. It does not connect to Neon and does not deploy to Cloudflare.

## Start PostgreSQL

`docker compose up -d postgres`

## Apply repository schema and migrations

From the repository root:

`DATABASE_URL=postgresql://crypto:crypto_local_only@127.0.0.1:55432/crypto ./scripts/migrate-neon.sh`

The existing migration runner is intentionally reused. This proves that the VPS PostgreSQL target can consume the same schema and migrations.

## Build and start the Node API

`docker compose up --build api`

Then verify GET /api/health, GET /api/db-health, GET /api/assets and GET /api/pairs.

## Safety

Do not put production DATABASE_URL, ADMIN_TOKEN, SSH keys, or VPS credentials in this compose file. The local password is intentionally non-production and must never be reused.
