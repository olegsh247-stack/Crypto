# Hosting Dependency Map — 2026-10-13

**Repository:** `olegsh247-stack/Crypto`  
**Audit baseline:** `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`  
**Status:** repository-side target architecture verified in CI; external account/runtime facts remain partially blocked.

This map separates what the repository proves from what requires authorized account-level or live endpoint verification. It is not an instruction to deploy, cut over traffic, change secrets/DNS, or delete external services.

## 1. Target runtime and hosting

| Component | Intended role | Repository evidence | Status / remaining proof |
|---|---|---|---|
| Linux VPS + Docker Compose | Own-host deployment boundary | `vps/docker-compose.production.yml`, `docs/VPS-PRODUCTION-DEPLOYMENT.md` | **Prepared, not deployed.** No VPS is provisioned. |
| PostgreSQL 16 | Canonical application database | Compose service `postgres`; `scripts/migrate-postgres.sh` | Clean bootstrap and migration rerun passed in disposable PostgreSQL CI; production migration not performed. |
| VPS API (Node.js/TypeScript) | Product API | `vps/api/package.json`, `vps/api/src/server.ts` | Build and API E2E passed in Build Rehearsal #458. No deployed VPS endpoint exists to verify. |
| VPS Worker (Node.js/TypeScript) | Scheduled ingestion/research operations | `vps/worker/package.json`, `vps/worker/src/index.ts`, `docs/VPS-WORKER-SCHEDULE.md` | Build and Worker ingestion E2E passed in Build Rehearsal #458. Not deployed to a purchased VPS. |
| Shared runtime / PostgreSQL client | Common API/Worker DB access | `vps/shared/package.json`, dependency `pg` | Repository target uses PostgreSQL driver `pg`; no active non-Markdown code/config reference to a hosted DB SDK was found by the scanner. |
| Caddy | TLS and only public service ports | `vps/docker-compose.production.yml`, `vps/Caddyfile` | Compose contract test confirms public 80/443 and private PostgreSQL/API/Worker ports. DNS and certificate issuance are not provisioned. |
| Next.js Web | User interface | `web/package.json`, `web/` | Web build is not part of VPS Build Rehearsal #458. A current-main Web build/type contract check remains required. |

## 2. Data, migration and recovery

| Area | Evidence | Status |
|---|---|---|
| Migration runner | `scripts/migrate-postgres.sh`; `docs/POSTGRES-MIGRATION-RUNBOOK.md` | Repeat-safe bootstrap/migration rehearsal passed on disposable PostgreSQL. Do not point rehearsal scripts at production. |
| Backup/restore | `scripts/backup-postgres.sh`; `docs/POSTGRES-BACKUP.md`; production Compose `backup` service | CI backup/restore rehearsal passed. It proves a disposable test only. Off-host encrypted backup destination is not configured/proven. |
| Runtime configuration | `vps/.env.production.example`; `.gitignore` | Example and secret names exist. Actual host environment does not exist yet. |
| Secrets | `docs/SECRET-INVENTORY.md` | Purpose/name inventory only. Actual repository/org secret presence and values were not inspected; no values were accessed or changed. |
| Database cutover | `docs/POSTGRES-MIGRATION-RUNBOOK.md` | **Blocked:** no VPS, no approved source dump/restore, no cutover authorization. |
| Production data quality | `docs/BTC-SOURCE-DATA-AUDIT-2026-10-12.md` | Historical read-only audit found stale/missing BTC inputs and duplicate groups. CI does not repair production observations. |

## 3. CI/CD, GitHub and deployment boundary

| Area | Evidence | Status |
|---|---|---|
| VPS Build Rehearsal | `.github/workflows/vps-api-build.yml` | Triggers on pull requests, pushes to any branch, manual dispatch and reusable workflow calls. Current target-stack rehearsal #458 passed. |
| Release Gate | `.github/workflows/release-gate.yml` | Target build/rehearsal and Web build are separated into reusable workflows; CI docs state no production deployment or production writes. |
| Repository hygiene gate | `scripts/check-vps-only-repository.mjs` | Checks all paths and non-Markdown text contents for retired-provider/runtime tokens. Markdown governance documents are excluded from content matching so the policy can name the platforms being retired; paths are still checked. Historical Git objects are not scanned. |
| External Cloudflare-linked check | Open PR checks for #69, #71, #72 and #39 show a “Workers Builds: crypto-api” check context. | **External integration still appears active for PR checks.** This alone does not prove that a deployment occurred or that the service is serving current traffic. Direct account/settings access is needed to identify the installation, triggers and target resource. |
| GitHub App / repository integrations | No account-level installation inventory was available in this audit. | **Blocked:** must inspect authorized GitHub App installations/webhooks and related external account configuration before claiming removal. |
| Legacy public endpoint | `docs/VPS-MIGRATION-EXECUTION-STATUS.md` says the endpoint has not been switched because no VPS exists; migration runbook describes current production as legacy runtime + source database. | Repository documentation says the old endpoint remains the current production endpoint. Actual reachability, DNS ownership, serving runtime and database attachment were not independently verified in this pass. |
| DNS / TLS / deployment secrets | `docs/VPS-PRODUCTION-DEPLOYMENT.md` | No target DNS, TLS issuance or production deploy secrets are provisioned for a VPS. Do not change existing public routing without approval. |

## 4. Runtime dependency scan and historical references

- The current target source/configuration scan passed in Build Rehearsal #458: [run #458](https://github.com/olegsh247-stack/Crypto/actions/runs/38309007906).
- The scan checks the current working tree only; it does not rewrite or sanitize Git history.
- Legacy names remain in historical commits and in Markdown policy/audit documents where they describe the retirement decision. This is not evidence that current target runtime code imports those platforms.
- No Git history rewrite, force push, production deployment, traffic switch, secret change, DNS change, production ingestion or migration was performed.

## 5. Stage 1 decision

**Stage 1 remains IN PROGRESS.**

Repository-side target architecture and disposable CI rehearsal are verified. Remaining blockers are external facts that cannot be proven from source code alone:

1. Identify and inspect the live legacy public endpoint, DNS/routing and actual runtime/database attachment through an approved read-only path.
2. Inspect Cloudflare/GitHub App integration settings and determine exactly which checks/hooks/resources remain; do not disable/delete anything until dependencies and rollback implications are known.
3. Verify actual secret names/presence without exposing secret values.
4. Provision a real VPS before any deployment, production migration or cutover.
5. Establish encrypted off-host backup and prove restore before any migration.

The project must continue to target self-hosted VPS + PostgreSQL. The unresolved external checks do not authorize returning to a hosted runtime/database dependency, nor do they prove the old services have already been shut down.
