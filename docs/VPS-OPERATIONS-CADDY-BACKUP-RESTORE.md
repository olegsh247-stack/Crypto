# VPS operational layer: Caddy, PostgreSQL backup and restore

**Status:** configuration and scripts are prepared for rehearsal; no VPS is provisioned and no production cutover is authorized. The CI backup/restore rehearsal must pass on the final commit before this layer is considered validated.

## Compose configuration

- Caddy is the only service publishing public HTTP/HTTPS ports (80/443); it reverse-proxies to the Node API.
- The PostgreSQL host port and direct API host port are bound to loopback only for operator/local checks.
- PostgreSQL uses a persistent Docker volume. Caddy's certificate and configuration state use named volumes.
- API and worker use the standard `pg` runtime adapter; no Neon-specific database client is used in the VPS containers.
- Worker schedule is London-calendar-midnight based; no fixed 24-hour interval is injected by Compose.
- Production deployment requires a real `SITE_ADDRESS`, strong unique secrets, firewall review and explicit approval. The values in `vps/.env.example` are for local rehearsal only.

## Local rehearsal

1. Copy `vps/.env.example` to `vps/.env` and set unique values. Use a password composed of URL-safe characters for `POSTGRES_PASSWORD`, because it is also placed in `DATABASE_URL`.
2. From the repository root, start the profile with `docker compose --env-file vps/.env -f vps/docker-compose.yml up --build -d`.
3. Apply the repository migrations to the intended disposable database, then verify `/api/health`, `/api/db-health`, and the API contract tests.
4. Do not expose port 55432 or 8080 in firewall rules. Public ingress should go through Caddy.

## Backup

Run `bash scripts/vps-backup.sh` after the Compose stack is up. It creates a PostgreSQL custom-format dump in `backups/`, verifies that PostgreSQL can list the archive contents, writes a SHA-256 checksum, and restricts local file permissions.

A backup stored only on the same server is not disaster recovery. Before real operation, copy backups to a separate storage location, encrypt them at rest/in transit, define retention, and monitor backup success. No external storage credentials or destinations are configured by this change.

## Restore

- `bash scripts/vps-restore-rehearsal.sh backups/crypto-....dump` restores into a newly created isolated database and drops that temporary database on exit. Use this to test recoverability without overwriting the active database.
- `RESTORE_CONFIRM=YES bash scripts/vps-restore.sh backups/crypto-....dump` is intentionally guarded and restores into the configured application database. It is destructive to conflicting objects and must not be used on production without an approved recovery plan and a verified backup.
- A successful `pg_restore` and a non-empty `assets` table are necessary but not sufficient. After a restore, also verify schema/migration markers, asset and pair registries, candle history, research snapshots, observations, monitoring signals and API responses before serving traffic.

## CI acceptance

The VPS Build Rehearsal validates Compose interpolation and shell syntax, creates a custom-format dump from its disposable PostgreSQL database, restores that dump into a separate temporary database, and verifies public table and asset counts. The original rehearsal database remains the source and is not overwritten by the restore test.

## Explicitly out of scope

No VPS purchase/provisioning, production migration, DNS/traffic switch, production credentials, external backup provider, Cloudflare/Neon decommissioning, or merge into `main`.
