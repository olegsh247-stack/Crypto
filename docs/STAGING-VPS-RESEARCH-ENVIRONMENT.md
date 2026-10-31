# Staging VPS research environment runbook

Status: preparation only. This runbook does not provision infrastructure or authorize production changes.

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

Use `vps/docker-compose.production.yml` with a unique staging `.env` file and a separate Compose project name, for example `crypto-staging`.

Before startup:
- Set a unique `POSTGRES_PASSWORD` and `ADMIN_TOKEN`.
- Set `CADDY_DOMAIN` and `CORS_ORIGIN` only if a domain is configured.
- Set a dedicated backup directory such as `/var/backups/crypto-staging`.
- Confirm no variable points to a production database, volume, or host path.
- Validate the rendered Compose configuration without printing secrets.

Initial service sequence:
1. Start PostgreSQL only.
2. Apply schema and versioned migrations to the empty staging database.
3. Start API and Caddy only.
4. Do not start Worker until its write behavior is separately approved for staging.
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

Run `scripts/e2e-smoke.mjs` only if the staging database satisfies its full registry/history assumptions. Otherwise use targeted GET checks and report missing data as a result, not as a reason to insert fixtures.

Capture counts and provenance summaries for:
- assets and enabled market pairs;
- research snapshots and 15-block completeness by asset;
- evidence rows and source/metric/observation links;
- observations grouped by asset, metric, source, status, and freshness;
- duplicate logical observation keys;
- market history coverage and latest closed candle timestamps.

All acceptance queries must be SELECT-only. Keep output free of credentials and private keys.

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
