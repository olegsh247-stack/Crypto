# Retire Neon: self-hosted PostgreSQL cutover plan

**Status:** plan only. No production resources or data have been changed.
**Target:** self-hosted VPS + PostgreSQL + Node API + separate Worker.
**Non-goal:** Neon is not part of the target architecture. Do not add Neon branching, Neon Auth, Neon Functions, or other Neon services.

## Decision

Retire Neon completely from the Crypto runtime and operational workflow after the self-hosted replacement is proven. Until cutover, the current Cloudflare Worker still depends on Neon; deleting the Neon project before switching the live API would cause an outage and could permanently destroy the only current copy of production data.

## Current facts checked in the repository

- `vps/docker-compose.yml` already defines PostgreSQL 16 with a persistent volume, API, and Worker.
- `vps/shared/src/db.ts` already uses the standard `pg` driver and a connection pool. The exported function is misleadingly named `neon()`; rename it to a neutral name such as `createSqlClient()` when doing the runtime cleanup.
- `vps/README.md` explicitly describes the current profile as a local migration rehearsal, not a production deployment.
- `workers/crypto-api/package.json` still depends on `@neondatabase/serverless`.
- `wrangler.toml` still configures the Cloudflare Worker, whose current runtime uses Neon.
- The repository migration runner is named `scripts/migrate-neon.sh`, but the SQL migrations themselves are PostgreSQL migrations and can be run against self-hosted PostgreSQL after compatibility checks.

## Ordered exit plan

### Phase 1 — Freeze the target architecture
- Target runtime: VPS, Docker Compose, PostgreSQL, Node API, Node Worker.
- Do not introduce new cloud database services.
- Do not buy/deploy the VPS automatically; wait until the user has provisioned a server.
- No production database writes, migrations, secret changes, or DNS/API cutover during this phase.

### Phase 2 — Make the VPS stack self-contained
- Rename the misleading `neon()` wrapper and its imports/exports to neutral PostgreSQL terminology.
- Keep the standard `pg` driver; do not add the Neon driver to VPS packages.
- Rename `scripts/migrate-neon.sh` to a provider-neutral migration runner only after all references are identified and updated.
- Make sure all runtime packages/builds work without Neon-specific packages or credentials.
- Verify the API and Worker use only `DATABASE_URL` for the self-hosted PostgreSQL connection.
- Align Worker scheduling with the required schedule and correct monitoring timestamps so a candle refresh cannot falsely imply that signals were re-evaluated.
- Configure production-only secrets outside the repository; set up HTTPS/reverse proxy, firewall, health checks, persistent storage, backups, and restore instructions.

### Phase 3 — Prove a clean, repeatable database build
- Start a fresh disposable PostgreSQL 16 instance.
- Apply every migration from an empty database.
- Run the complete migration set a second time and verify idempotency.
- Run schema, API contract, Worker parity, ingestion idempotency, evidence lineage, monitoring, and web build/type checks.
- Verify the BTC Product Contour v1 data and one complete BTC scenario against the resulting schema.
- Keep CI databases disposable and isolated; no production Neon credentials are needed for these checks.

### Phase 4 — Prepare data transfer (only when a VPS exists)
- Take a verified backup/export of the current production database.
- Restore it into the VPS PostgreSQL without changing the live source.
- Compare schema/migration markers, row counts, foreign-key integrity, natural-key duplicates, latest observation timestamps, BTC snapshots, factors, scores, scenarios, monitoring, and Evidence.
- Test API and Worker against the restored VPS database in isolation.
- Document rollback: keep the old service and source database intact until acceptance passes.

### Phase 5 — Cut over the live service
- Choose a maintenance/cutover window and stop concurrent ingestion writes during final synchronization.
- Apply the final data delta, validate the VPS database, and switch the API endpoint/runtime to the VPS.
- Confirm health, read-only endpoints, API contract, Worker execution, scheduler, and monitoring.
- Keep a short rollback window; if checks fail, return traffic to the old service without deleting the source data.
- Only after the new runtime is accepted, remove Cloudflare/Neon runtime dependencies and credentials from deployment workflows and repository configuration.

### Phase 6 — Delete Neon after explicit final acceptance
- Confirm that the live API and Worker no longer depend on Neon.
- Confirm that a restorable backup exists and the VPS data is accepted.
- Remove unused Neon GitHub secrets/variables and stale workflows, then search the whole repository for `neon`, `NEON_DATABASE_URL`, and `@neondatabase/serverless`.
- Delete the Neon project only after the user confirms the cutover and deletion. Deleting the project destroys its branches and data; do not use project deletion as a shortcut before migration.

## Acceptance criteria for “Neon removed”
- Production API and Worker run against the VPS PostgreSQL.
- No application runtime imports `@neondatabase/serverless`.
- No VPS runtime function or package is named after Neon.
- Migration scripts and docs are provider-neutral.
- CI does not require Neon credentials for ordinary build, migration, or contract checks.
- No workflow can accidentally migrate or seed the retired Neon database.
- Backup and restore have been tested.
- Final repository search shows no live Neon dependency; any remaining mention is only a historical migration note, if retained intentionally.

## Immediate next action

Complete Phase 2 as a focused, reviewable code change, while keeping the current live API untouched. Do not merge or deploy automatically. Then run clean PostgreSQL CI and continue through the ordered phases above.
