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
| Database driver | `vps/shared/src/db.ts` PostgreSQL pool | Target code scan confirms standard PostgreSQL pool only; retain bounded pool and graceful shutdown | Passed |
| Scheduled worker | `vps/worker` | Verify UTC schedule, no overlapping runs, idempotency and monitoring gate | VPS Release Gate passed |
| Database schema | PostgreSQL SQL schema and versioned migrations | Moved to `infrastructure/postgres/`; preserve migration order and checksums | Done; VPS Build Rehearsal passed |
| Local migration runner | `scripts/migrate-postgres.sh` | Sole runner is `scripts/migrate-postgres.sh`; duplicate runner removed | Done; VPS Release Gate passed |
| Compose | `vps/docker-compose.production.yml` | Keep DB/API/worker private; expose only Caddy 80/443; validate backups and restore | VPS Release Gate passed |
| CI release gate | `release-gate.yml` | Run VPS build, disposable PostgreSQL migration, backup/restore, API and worker E2E only | Updated; VPS Release Gate passed |
| Deployment | VPS SSH/deploy path | Build immutable image, backup, migrate, health check, API E2E, UI E2E, rollback | Not enabled until VPS exists |
| Production health | Manual GET-only check | Require the actual VPS API URL; never fall back to a hard-coded legacy endpoint | Updated |
| Secrets | GitHub Actions and host runtime | Inventory names only; provision VPS credentials after host purchase; rotate admin token; never commit values | Pending host |
| Frontend | `web/` | Keep API base configurable; verify same-origin/CORS and production build | Build gate retained |
| Previous runtime source/config | Removed from the repository; the already-deployed public service has not yet been switched | Do not deploy to or mutate the old service; complete target-host migration and controlled cutover after VPS purchase | Source cleanup done; cutover pending |
| Documentation | `docs/`, `README.md`, infrastructure notes | Current run instructions and active docs are VPS-only; repository-wide final scan remains | In progress |

## Completed in this batch

- Replaced the manual production release gate with a VPS-only build and test gate.
- Made the VPS rehearsal reusable by the release gate.
- Removed old workflows that could mutate production data, deploy the former runtime, seed production, or validate against the old live database.
- Removed the former runtime source, package dependency, and deployment configuration from the current repository tree.
- Moved the canonical schema, seed, and all versioned migrations into `infrastructure/postgres/`; the single supported runner is `scripts/migrate-postgres.sh`.
- Changed the read-only health workflow to require an explicitly supplied target API URL.
- Added static workflow validation and fixed ShellCheck warnings discovered by it.

These changes do not switch the public production endpoint or mutate production data.

## Required sequence

1. The automated repository-wide source scan passed with zero retired-platform references. Keep this scan required in the VPS build gate.
2. Clean PostgreSQL 16 bootstrap, migration rerun, backup checksum/restore, API/worker E2E, and web build are green in the current VPS Release Gate.
3. API and worker E2E against disposable PostgreSQL, backup checksum, restore, table counts, and web build passed in [VPS Release Gate #38272645153](https://github.com/olegsh247-stack/Crypto/actions/runs/38272645153). Repeat after future runtime changes.
4. Finish BTC's complete product scenario and evidence contracts on the target API; do not expand to more assets yet.
5. After the user purchases the VPS: secure SSH/firewall, configure DNS and Caddy, create least-privilege DB roles, configure off-host backups and deploy secrets.
6. Take a final source database dump, restore it to the VPS, compare schema, row counts, constraints, registries, candles, research, evidence, scenarios, and monitoring.
7. Perform a controlled cutover only after explicit approval; pause ingestion during restore and acceptance; verify health, API, BTC scenario, admin auth, monitoring, worker schedule, backup and restore.
8. Observe the VPS through the agreed rollback window. Remove any remaining obsolete runtime configs, secret references, URLs, workflow references and historical wording. Final scan must find zero references to retired platforms.
9. Record commit hashes and green CI runs; keep the project plan updated.

## Safety boundary

The target host has not yet been purchased, so the public endpoint is still the already-deployed service and has not been switched. Do not change its secrets, run production ingestion for tests, or switch public traffic. All rehearsal tests use disposable PostgreSQL. The next production-changing step is a controlled data export/restore and cutover after the target host exists.
