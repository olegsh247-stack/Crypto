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

## Latest verified batch — 2026-10-12

- [VPS Release Gate #38286162070](https://github.com/olegsh247-stack/Crypto/actions/runs/38286162070) passed on `main`, including repository scan, PostgreSQL 16 clean bootstrap, backup/restore with table-count comparison, API/Worker E2E and web build.
- PR #52 merged: the VPS API exposes active-snapshot evidence and includes evidence-linked sources; factors, scores and scenario states are scoped to the active published snapshot. [Build Rehearsal #38286046472](https://github.com/olegsh247-stack/Crypto/actions/runs/38286046472) passed.
- PR #54 merged: evidence includes displayable observation values/units and scenario definitions return `snapshot_id`; E2E asserts strict lineage. [Build Rehearsal #38286251489](https://github.com/olegsh247-stack/Crypto/actions/runs/38286251489) passed.
- PR #55 merged: the BTC input gate rejects a stale newest ETF-flow row rather than silently falling back to older rows. [BTC Scenario Readiness Gate #38286364175](https://github.com/olegsh247-stack/Crypto/actions/runs/38286364175) passed.
- No production data was changed. BTC still has no snapshot-linked scenario state or monitoring event; monitoring signals remain descriptive baseline entries. The next product step is the factor-to-observation/event readiness contract in `BTC-MONITORING-READINESS-MATRIX.md`, then source-backed observation reconciliation. Do not persist a live scenario state until those gates pass.

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


## Verified checkpoint — 2026-10-12

- The target API now returns the current published snapshot's evidence rows with observation and source provenance, and scopes factors, scores and scenario states to that same snapshot.
- The VPS Release Gate passed after the evidence contract change: [run 38286407510](https://github.com/olegsh247-stack/Crypto/actions/runs/38286407510). The BTC E2E verifies 15 research blocks, 6 current-snapshot factors, 5 current-snapshot scores, the Bull/Base/Bear set, 15 evidence rows and no fabricated snapshot-linked scenario state.
- The PostgreSQL rehearsal now uses a Docker-assigned ephemeral loopback port, avoiding fixed-port collisions between concurrent workflows. The Build Rehearsal passed after this change: [run 38286818304](https://github.com/olegsh247-stack/Crypto/actions/runs/38286818304).
- A read-only BTC input provenance audit is available at `scripts/audit-btc-input-provenance.sql`. It reports freshness, source links, duplicate logical keys and snapshot/monitoring coverage without modifying data. Compare its output before and after a future database restore.
- Production readiness remains blocked on the real host and data: the VPS has not been provisioned, numeric BTC observations need source-verified refresh/reconciliation, and no live scenario-state or monitoring-event row may be fabricated to make the dashboard appear current.


## BTC data-integrity follow-up — 2026-10-12

- The BTC readiness gate now requires canonical registry-backed sources and exact units, and the latest VPS Build Rehearsal passed after the change: [run 38287989090](https://github.com/olegsh247-stack/Crypto/actions/runs/38287989090). Unit and Web builds also passed: [readiness tests](https://github.com/olegsh247-stack/Crypto/actions/runs/38287989009), [Web build](https://github.com/olegsh247-stack/Crypto/actions/runs/38287989006).
- PR #62 merged as `763e4750e129ae7d961a4f452927fbeada7253d1`. The API does not treat an HTTPS URL alone as provenance: the source must exist in the registry, and both the stored unit and the metric registry's canonical unit must match the readiness contract.
- The next safe data-integrity step is to expose full payloads for the known duplicate BTC observation groups so exact duplicates can be distinguished from conflicting revisions before designing any cleanup. The enhanced audit remains read-only; no observation rows have been changed.
- A legacy external build check still appears on commits even though the target repository workflows are VPS-only. Its failed build is outside the VPS test pipeline; disconnecting the obsolete repository integration remains a final retirement task. Do not shut down the currently serving public API before VPS cutover approval.
