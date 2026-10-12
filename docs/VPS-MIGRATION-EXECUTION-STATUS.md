# VPS migration execution status

Status: PRIORITY 1 — ACTIVE
Updated: 2026-10-12

## Non-negotiable target

The finished repository and deployed product must run on the user's own VPS using Docker Compose, PostgreSQL 16, Node.js/TypeScript API and scheduled worker, Caddy HTTPS, automated backups, and GitHub Actions. No runtime, database, deployment, CI, configuration, secret, or documentation dependency on the retired external platforms may remain in the final repository.

This document is an execution tracker, not approval to modify the currently serving production system before the VPS is purchased and verified.

## Repository inventory and action status

| Area | Current target implementation | Required action | Status |
|---|---|---|---|
| API runtime | `vps/api` Node.js HTTP server | Complete contract parity, security, lifecycle and history E2E | In progress |
| Database driver | `vps/shared/src/db.ts` PostgreSQL pool | Confirm no target runtime imports the old serverless driver; use bounded pool and graceful shutdown | Audit required |
| Scheduled worker | `vps/worker` | Verify UTC schedule, no overlapping runs, idempotency and monitoring gate | Local E2E exists; repeat in release gate |
| Database schema | PostgreSQL SQL schema and versioned migrations | Move to neutral `infrastructure/postgres/` paths; preserve migration order and checksums | Pending |
| Local migration runner | `scripts/migrate-postgres.sh` | Make it the sole supported migration runner; remove duplicate runners | Pending |
| Compose | `vps/docker-compose.production.yml` | Keep DB/API/worker private; expose only Caddy 80/443; validate backups and restore | CI rehearsal exists |
| CI release gate | `release-gate.yml` | Run VPS build, disposable PostgreSQL migration, backup/restore, API and worker E2E only | Updated; CI verification running |
| Deployment | VPS SSH/deploy path | Build immutable image, backup, migrate, health check, API E2E, UI E2E, rollback | Not enabled until VPS exists |
| Production health | Manual GET-only check | Require the actual VPS API URL; never fall back to a hard-coded legacy endpoint | Updated |
| Secrets | GitHub Actions and host runtime | Inventory names only; provision VPS credentials after host purchase; rotate admin token; never commit values | Pending host |
| Frontend | `web/` | Keep API base configurable; verify same-origin/CORS and production build | Build gate retained |
| Legacy runtime code/config | `workers/`, root runtime config and old package | Remove after VPS acceptance and verified cutover; no new features there | Pending cutover |
| Documentation | `docs/`, `README.md`, infrastructure notes | Make current run instructions VPS-only; remove obsolete docs and all retired-platform mentions in final cleanup | In progress |

## Completed in this batch

- Replaced the manual production release gate with a VPS-only build and test gate.
- Made the VPS rehearsal reusable by the release gate.
- Removed old workflows that could migrate production data, deploy the old runtime, seed production, or validate against the old live database.
- Changed the read-only health workflow to require an explicitly supplied target API URL.
- Added static workflow validation and fixed ShellCheck warnings discovered by it.

These changes do not switch the public production endpoint or mutate production data.

## Required sequence

1. Finish repository-wide dependency inventory, including source imports, package manifests, runtime entrypoints, cron/scheduler config, workflow calls, environment variables, secrets references, docs, and URLs.
2. Make PostgreSQL schema/migrations and seed fixtures provider-neutral, then verify a clean PostgreSQL 16 bootstrap twice.
3. Complete API and worker E2E entirely against disposable PostgreSQL; verify backup checksum and restore counts.
4. Finish BTC's complete product scenario and evidence contracts on the target API; do not expand to more assets yet.
5. After the user purchases the VPS: secure SSH/firewall, configure DNS and Caddy, create least-privilege DB roles, configure off-host backups and deploy secrets.
6. Take a final source database dump, restore it to the VPS, compare schema, row counts, constraints, registries, candles, research, evidence, scenarios, and monitoring.
7. Perform a controlled cutover only after explicit approval; pause ingestion during restore and acceptance; verify health, API, BTC scenario, admin auth, monitoring, worker schedule, backup and restore.
8. Observe the VPS through the agreed rollback window. Only after acceptance remove legacy runtime source, old configs, obsolete secret references and historical platform-specific docs. Final scan must find zero occurrences in the repository.
9. Record commit hashes and green CI runs; keep the project plan updated.

## Safety boundary

Until the target host exists and the data copy is accepted, do not delete the only available production data source, change production secrets, run production ingestion for tests, or switch public traffic. All rehearsal tests use disposable PostgreSQL. The final goal remains full removal, not indefinite coexistence.
