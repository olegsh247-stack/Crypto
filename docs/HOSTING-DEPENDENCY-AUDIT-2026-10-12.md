# Hosting dependency audit and safe cutover plan

**Date:** 2026-10-12  
**Scope:** Read-only audit of the current `main` repository and its self-hosted target configuration.  
**Change boundary:** Documentation only. No source-code fixes, PR merges, production queries/writes, secret changes, deployment, or runtime changes were performed.

## Executive decision

The only target architecture is the user's own VPS:

`DNS → Caddy (HTTPS) → Node.js API → self-hosted PostgreSQL 16`, with a separate Node.js scheduled Worker, private database/API/Worker networking, and verified backups. GitHub Actions is CI/release validation, not a hosted runtime dependency.

Cloudflare and Neon are not part of the desired final architecture. However, repository cleanup and a target-stack rehearsal do **not** prove that the currently serving public endpoint has been cut over. The migration tracker says the former public service has not yet been switched and the VPS is not provisioned. Do not delete the existing database/project or disable the old endpoint until data parity, backup/restore, acceptance, and a controlled cutover are complete.

## Evidence from current main

| Area | Verified repository evidence | Assessment |
|---|---|---|
| Target runtime | `vps/docker-compose.production.yml` defines PostgreSQL 16, API, Worker, Caddy, and backup/migration ops services. | Target topology exists. |
| Network exposure | Compose publishes ports 80/443 only on Caddy; PostgreSQL, API and Worker have no published host ports. API and Caddy share the edge network; PostgreSQL and Worker use the backend network. | Good target boundary; still needs host/firewall validation after VPS purchase. |
| Database | `infrastructure/postgres/` and `scripts/migrate-postgres.sh` are the target schema/migration path. | Clean bootstrap and rerun must continue passing on disposable PostgreSQL and later on the target host. |
| Backups | Compose has an ops-profile backup service and host-mounted backup directory. | A local backup is not enough for disaster recovery; verify off-host copy, checksum, restore and table-count comparison. |
| Deployment | `docs/VPS-MIGRATION-EXECUTION-STATUS.md` says VPS SSH/deploy is not enabled until a host exists and cutover is pending. | No VPS deployment should be claimed yet. |
| CI | `.github/workflows/release-gate.yml` currently has both `workflow_dispatch` and a `push` trigger for selected main paths; it calls the VPS build/rehearsal and Web build workflows. The inspected workflow body does not itself configure a production deploy. | A push-triggered test gate is present; it is not evidence of a production cutover. Continue checking all called workflows before any release/deploy workflow is enabled. |
| API CORS | `vps/api/src/app.ts` defaults `Access-Control-Allow-Origin` to `*` if `CORS_ORIGIN` is absent. Compose production requires `CORS_ORIGIN` in `.env.production`. | Defense-in-depth issue: the Compose path requires configuration, but direct/manual API startup can silently become permissive. Fix only in an approved code batch and test missing/invalid origin behavior. |
| Worker schedule / candle calendar | `vps/worker/src/index.ts` schedules the job at a fixed UTC time (default `00:30`). `vps/worker/src/scheduler.ts` also uses `Europe/London` day-boundary helpers for candle dates. | These are distinct contracts, not automatically a bug. Document whether the daily run should follow UTC or London calendar boundaries and test both GMT and BST transitions before changing behavior. |
| README | `README.md` still describes the old Skill / GitHub Project / Issues workflow and calls ETH the first full Asset Card. | Documentation is stale relative to the active VPS-only plan and BTC-first product sequence. Update after the architecture/acceptance wording is agreed. |
| BTC product readiness | `docs/BTC-SCENARIO-V1.md` and `docs/BTC-MONITORING-READINESS-MATRIX.md` correctly distinguish a published research baseline from live evaluation. The latter records stale observations, nine duplicate logical-key groups, two missing source URLs, and no scenario-state/event rows. | Keep BTC as the only product vertical. No live state/event persistence until inputs, freshness, lineage and deterministic rules pass review. |

## Dependency map

### Target runtime path

1. DNS points to the purchased VPS.
2. Caddy terminates HTTPS on ports 80/443 and proxies to the API over the private edge network.
3. API and Worker use the same self-hosted PostgreSQL service through `DATABASE_URL`.
4. PostgreSQL is not published to the host network; Worker has no public port.
5. Migration and backup containers are opt-in under the Compose `ops` profile.
6. Backups must be copied off-host and restore-tested; a Docker volume alone is not a backup strategy.
7. GitHub Actions builds/tests the repository and disposable PostgreSQL. A future deployment path must be separately reviewed and enabled only after the host exists.

### Transitional dependency boundary

- The target repository architecture is self-hosted, but the migration tracker explicitly says the existing public service has not yet been switched.
- Existing production data must be preserved and migrated deliberately. Do not infer that Neon is safe to delete because target migrations pass.
- Do not perform any write against the old production database, seed it, run ingestion, or deploy to the old public runtime as part of this audit.
- The old endpoint, data copy, secrets and DNS remain cutover concerns until the target host is provisioned and verified.

## E1–E8 disposition from this pass

| ID | Current assessment | Required next action |
|---|---|---|
| E1 snapshot lineage | Target API audit and recent tracker report snapshot-scoped factors, scores, scenario states and evidence/source lineage. | Retain lineage E2E assertions; do not treat repository tests as proof of public-endpoint parity. |
| E2 monitoring timestamp pollution | The tracker says the target Worker path was corrected, but the old public Worker has not been redeployed/cut over. | Verify the correction in current target tests; never use ingestion timestamps as evidence of evaluation. |
| E3 unfinalized daily candles | Target API contains finalized-candle filtering; Worker still constructs candle boundaries using London calendar helpers. | Check all history/calculation consumers and tests; reconcile the separate legacy PR before considering it. |
| E4 BTC input quality | Readiness remains blocked by stale key observations, missing required inputs, duplicate logical-key groups and absent scenario/event rows. | Preserve duplicates pending a reviewed cleanup plan; source and validate observations before deterministic evaluation. |
| E5 CORS default | Wildcard fallback exists in `vps/api/src/app.ts`; production Compose requires an explicit origin. | Treat as a hardening item for an approved patch, not as proof of current production exposure. |
| E6 branch/PR overlap | Multiple open PRs cover adjacent audit, hosting, worker and data topics. | Before merging, compare each PR head with current main and current tests; do not merge by number or stale description alone. |
| E7 schedule semantics | UTC scheduler time and London-local candle-day boundaries coexist. | Decide and document intended semantics, then test around daylight-saving changes. |
| E8 README drift | Current README does not reflect BTC-first work and VPS target architecture. | Update in a documentation-only PR after this dependency map is accepted. |

## Safe cutover sequence

1. **Repository safety and architecture:** keep the target stack self-hosted; inventory and disable any future production deployment triggers unless they are explicitly approved. CI-only push checks may remain.
2. **BTC product gate:** complete the BTC source/input contract, freshness/provenance validation, duplicate handling plan, deterministic scenario rule, and snapshot-linked evaluation contract. No production writes.
3. **Provision the VPS:** only after the user has rented/purchased it. Configure SSH access, firewall, DNS, disk/backup storage and host security.
4. **Deploy the target stack without switching traffic:** start PostgreSQL, run migrations, start API/Worker/Caddy, verify health and contract E2E.
5. **Back up and restore:** take a consistent source backup, transfer it securely, restore into target PostgreSQL, verify checksums, schema/migration markers, table counts and critical BTC rows.
6. **Read-only parity:** compare source and target row counts, active snapshot IDs, factors, scores, scenarios, evidence, observations and market history. Reconcile differences before switching.
7. **Acceptance rehearsal:** verify API/UI, auth/admin boundary, CORS, candle finalization, Worker schedule, idempotency, no overlapping jobs, monitoring timestamp integrity, off-host backups and restore.
8. **Explicit cutover approval:** only after the user reviews the evidence, switch DNS/traffic using a rollback plan and observe the target.
9. **Retire old dependencies:** only after a stable target period, verified backups and explicit acceptance, remove old secrets/services/projects and obsolete repository references. Never delete the old database before these gates.

## Acceptance gates

- [ ] User has provisioned the VPS; no assumption that it already exists.
- [ ] Production Compose validation confirms only Caddy is publicly exposed.
- [ ] Clean PostgreSQL bootstrap and migration rerun pass.
- [ ] Backup checksum, off-host copy, restore and table-count comparison pass.
- [ ] Target API/Worker/Web E2E pass on disposable PostgreSQL.
- [ ] BTC inputs have valid source, unit, UTC period, timestamp, revision and freshness; duplicate groups are handled under an approved plan.
- [ ] BTC scenario evaluation is deterministic, reproducible and tied to the active published snapshot.
- [ ] Monitoring signals are not refreshed by ingestion alone; events are emitted only by a reviewed evaluation rule.
- [ ] CORS and admin authorization are explicitly tested.
- [ ] Worker UTC schedule and London-day candle semantics are documented and DST-tested.
- [ ] Read-only source/target data parity is accepted.
- [ ] User explicitly approves traffic cutover and later retirement of old services/data.

## Change control

This document records findings and a plan only. It does not authorize code fixes, PR merges, production queries/writes, migrations, secret changes, deployment, DNS changes, or deletion of any hosted service or database.
