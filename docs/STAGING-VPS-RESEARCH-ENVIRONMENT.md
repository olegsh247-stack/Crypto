# Staging VPS research environment runbook

Status: preparation only; reconciled against main `510c05e` on 2026-11-03. This runbook does not provision infrastructure or authorize production changes. The earlier PR #105 branch is a stale historical source; this version is based on current main.

## Objective

Create an isolated, self-hosted staging environment for Crypto on a user-owned VPS. It must not share a database, volume, secrets, DNS target, or write credentials with production.

## Safety invariants

- Never point staging at the production/source DATABASE_URL.
- Never restore a production dump into a staging database unless the user separately approves a sanitized export and the target is confirmed isolated.
- Do not run seed fixtures as evidence. `infrastructure/postgres/seed-v1.sql` is deterministic bootstrap/test material; fixture observations are not current research data.
- Do not start the Worker during initial staging acceptance. The current Worker writes daily candles for enabled assets and updates research review status; BTC observation ingestion being disabled does not make the entire Worker read-only.
- Do not expose PostgreSQL publicly. Only Caddy publishes 80/443; SSH is restricted by host firewall.
- No production migration, deployment, ingestion, DNS cutover, or PR merge is included.

## Phase 1 — provision host

Required operator inputs: VPS provider/instance, public IPv4 (or IPv6), SSH access, and a DNS name if public HTTPS is required.

Suggested starting size for a small isolated staging stack: 2–4 vCPU, 4–8 GB RAM, 80+ GB SSD, Ubuntu 24.04 LTS or another supported Docker host. Confirm capacity against actual dataset and backup size before provisioning.

On the host:
1. Create a non-root deployment user with SSH key authentication.
2. Disable password SSH login after key access is verified.
3. Configure firewall: SSH only from trusted source IP where practical; allow TCP 80/443 only when public HTTPS is needed; deny public 5432.
4. Install Docker Engine and Compose plugin.
5. Create a stable checkout path such as `/opt/crypto-staging`.
6. Create a separate staging environment file outside Git; generate unique secrets on the host.

## Phase 2 — configure isolated staging

Use `vps/docker-compose.production.yml` with an environment file stored outside the repository (for example `/etc/crypto-staging/staging.env`) and a unique Compose project name, `crypto-staging`. Run the commands below from the repository root and always pass the explicit `--env-file`; do not rely on an implicit `.env` that could belong to another environment.

Before startup:
- Set unique staging-only `POSTGRES_PASSWORD` and `ADMIN_TOKEN` values.
- Define all variables required by Compose interpolation: `POSTGRES_PASSWORD`, `ADMIN_TOKEN`, `CRYPTO_ADMIN_LOGIN_SECRET`, `CRYPTO_ADMIN_SESSION_SECRET`, `CRYPTO_ADMIN_ORIGIN`, `CORS_ORIGIN`, `CADDY_DOMAIN`, and `BACKUP_DIR_HOST`. `CRYPTO_ADMIN_LOGIN_SECRET` and `CRYPTO_ADMIN_SESSION_SECRET` must be unique staging-only secrets; `CRYPTO_ADMIN_ORIGIN` and `CORS_ORIGIN` must use the staging UI/API origin. `CADDY_DOMAIN` and `BACKUP_DIR_HOST` are required by Compose interpolation even when Caddy/backup are not started. Without public ingress, use a private/test origin and do not start Caddy.
- Set `BACKUP_DIR_HOST` to a dedicated staging path such as `/var/backups/crypto-staging`; create it with restrictive permissions.
- Confirm no variable points to a production database, volume, secret, or host path.
- Validate Compose without printing resolved environment values: `docker compose --project-name crypto-staging --env-file /etc/crypto-staging/staging.env -f vps/docker-compose.production.yml config --quiet`.

Initial service sequence (the explicit service list is important — never use an unrestricted `up -d`):
1. Start PostgreSQL only: `docker compose --project-name crypto-staging --env-file /etc/crypto-staging/staging.env -f vps/docker-compose.production.yml up -d postgres`.
2. Apply schema and versioned migrations to the empty staging database: `docker compose --project-name crypto-staging --env-file /etc/crypto-staging/staging.env -f vps/docker-compose.production.yml --profile ops run --rm migrate`.
3. Start API, Web, and Caddy (Caddy depends on both API and Web): `docker compose --project-name crypto-staging --env-file /etc/crypto-staging/staging.env -f vps/docker-compose.production.yml up -d api web caddy`. If there is no configured staging domain/public HTTPS, omit `caddy` and access the private services only through an approved tunnel or private ingress.
4. Do not start `worker` until its write behavior is separately approved for staging.
5. Verify health endpoints and API GET contracts.

The repository migration runner bootstraps schema and applies versioned migrations. It does not run the separate seed fixture file. Inspect each migration's inserted research rows and provenance before treating them as research evidence.

## Phase 3 — data classification and load

Classify every data set before loading:
- Curated research documents under `research/assets/`: authored research artifacts; validate date, sources, methodology, and caveats.
- Versioned SQL migrations: structured application records; review inserted snapshot/evidence content and source lineage.
- `seed-v1.sql`: deterministic seed and initial BTC observations explicitly marked stale/partial; not a live research dataset.
- `fixtures/`: test fixtures; never count as real research data.
- External market/protocol observations: obtain through documented source adapters or manually captured source payloads with timestamp, URL/source ID, method, unit, provenance, duplicate/revision handling.

Do not label an asset's data "real/current" merely because its research snapshot or API endpoint exists. For BTC/ETH/SOL/CAKE, record per asset: published research snapshot, research blocks, evidence rows, observation rows, source coverage, observation timestamps, freshness classification, and unresolved gaps.

## Phase 4 — read-only acceptance

Run GET-only checks against the staging API:
- `/api/health`
- `/api/db-health`
- `/api/assets`
- `/api/assets/btc`
- `/api/assets/eth`
- corresponding SOL and CAKE asset endpoints
- `/api/pairs`
- `/api/asset-types` (active type catalog used by Add Asset)

Run `scripts/e2e-smoke.mjs` only if the staging database satisfies its full registry/history assumptions. Otherwise use targeted GET checks and report missing data as a result, not as a reason to insert fixtures.

Capture one immutable acceptance report per run, including its UTC timestamp and the API build/commit SHA. For each of BTC, ETH, SOL, and CAKE record:
- asset identity and enabled state;
- published snapshot ID, version, status, and publication timestamp (or an explicit missing value);
- research-block row count, resolved/complete/partial/N/A counts, and expected 15-block coverage;
- evidence row count, null rates for required provenance fields, and links to source, metric, observation, and research block;
- observation row count and null rates for `observed_at`, `retrieved_at`, `unit`, `source_id`, `source_url`, `methodology`, and applicable payload hash/revision fields;
- source coverage by metric and source, including explicit gaps;
- freshness classifications and the values actually displayed by the API/UI (do not infer freshness from the age of the run);
- scenario and scenario-state snapshot IDs, verifying that every returned scenario/state belongs to the selected published snapshot and that no state from another snapshot is mixed in;
- duplicate logical observation keys and the disposition recorded for each;
- market-history coverage and latest finalized candle timestamps.

The acceptance report must include section row counts, null rates, lineage checks, and a cross-snapshot scenario-state check. Missing or empty data is a reported outcome, not a reason to load fixtures or create synthetic evidence. Preserve snapshot IDs and raw counts so a later run can be compared without silently changing the definition of completeness.

All acceptance queries must be SELECT-only. Keep output free of credentials and private keys.

## Stage 3 Product Contour gate

The Stage 3 gate is not passed by CI fixtures, a successful API health check, or the presence of seeded snapshots alone. It requires the read-only representative payload report above for BTC/ETH/SOL/CAKE on this isolated non-production environment. Acceptance is a separate review of snapshot IDs, section row counts, null rates, source lineage, freshness display, and the absence of cross-snapshot scenario state. Do not mark Stage 3 complete until that evidence has been reviewed.

## Phase 5 — backups and restore

- Configure local encrypted/permission-restricted backups with checksums.
- Add an independent encrypted off-host backup destination before relying on backups.
- Run a disposable restore rehearsal into a separate empty database.
- Compare schema, migration markers, table counts, constraints, and representative API responses.
- Do not claim disaster recovery is complete based on a same-host dump alone.

## Phase 6 — controlled Worker evaluation

Only after API/data acceptance:
1. Review the exact Worker write set and schedule.
2. Keep BTC observation ingestion disabled unless separately approved.
3. Use a staging-only database role and staging-only secrets.
4. Start Worker manually in one-shot mode only after explicit approval; inspect write counts and provenance.
5. Enable a schedule only after the one-shot run is accepted.

The current Worker is not read-only: it upserts daily market candles and updates expired research review statuses even when BTC observation ingestion is disabled. Therefore it must remain stopped during initial read-only acceptance.

## Current external blockers

The repository cannot itself create a paid VPS, obtain SSH credentials, or control the user's DNS. Provisioning requires the operator to supply/confirm:
- VPS provider/instance and public IP;
- SSH public-key access (never send a private key or password in chat);
- domain/DNS control, if HTTPS is required;
- a separate off-host backup destination.

Once the host is available, execute the phases above. Production stays unchanged throughout.
