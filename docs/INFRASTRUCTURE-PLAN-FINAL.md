# Infrastructure plan — VPS-only target

Status: PRIORITY 1 — ACTIVE
Updated: 2026-10-12

The only target architecture is the user's own VPS: Docker Compose, PostgreSQL 16, Node.js/TypeScript API, scheduled worker, Caddy HTTPS, off-host backups, and GitHub Actions CI/CD.

The full current inventory, execution order, completed changes, safety boundary, and acceptance criteria live in [VPS-MIGRATION-EXECUTION-STATUS.md](./VPS-MIGRATION-EXECUTION-STATUS.md). That tracker is authoritative and must be updated with every migration batch.

## Definition of done

- [ ] No third-party runtime or hosted database dependency remains in the repository.
- [ ] API and worker run only on the VPS target stack.
- [ ] PostgreSQL schema and migrations use `infrastructure/postgres/`.
- [ ] Repeatable clean bootstrap and migration rerun pass.
- [ ] Backup checksum, restore, and table-count comparison pass.
- [ ] API contract and worker idempotency E2E pass against disposable PostgreSQL.
- [ ] BTC scenario, factors, scores, evidence, monitoring, and API contracts are validated.
- [ ] HTTPS, firewall, private database network, admin authorization, and off-host backup are verified on the purchased host.
- [ ] Controlled data migration and cutover are explicitly approved and validated.
- [ ] All old runtime packages, configs, workflows, secrets references, docs, URLs, and names are removed from the final repository.
- [ ] Repository-wide scan finds zero references to retired platforms.
