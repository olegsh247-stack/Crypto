# Hosting dependency inventory — 2026-10-11

**Scope:** repository-level audit of the current Cloudflare/Neon runtime and the prepared VPS target.
**Branch:** `fix/vps-worker-london-schedule-parity`
**Validated commit:** `103440d8c03842b64562d62c9c5c3f147deec380` (hosting changes; later documentation-only commits record the result).
**Safety:** read-only inspection plus documentation only. No production secret was read, no live migration/deployment was run, and no infrastructure was changed.

## Executive result

The VPS API/worker path is now buildable and has passed the disposable PostgreSQL compatibility rehearsal, including a backup restore into a separate database. This is meaningful proof of portability, but it is not yet a production-ready cutover.

The current live service still depends on Cloudflare Workers and Neon. The repository contains a manual, explicitly confirmed release workflow that applies migrations to Neon and deploys the Worker. The VPS path has Caddy, Node.js API, a separate worker process, PostgreSQL 16, local backup/restore scripts and CI rehearsal, but no provisioned host, no external backup destination, and no implemented controlled SSH deployment/cutover workflow.

## Runtime dependency inventory

| Area | Current/live path | VPS target / status |
|---|---|---|
| API execution | Cloudflare Worker; `workers/crypto-api/package.json` depends on `@neondatabase/serverless` | Node.js HTTP API; `vps/api` uses shared runtime and standard `pg` adapter |
| Database | Neon PostgreSQL via GitHub secret `NEON_DATABASE_URL` / Worker `DATABASE_URL` | PostgreSQL 16 container on a private Compose network with persistent volume; clean bootstrap and migrations pass in disposable CI |
| Deployment | `.github/workflows/deploy-crypto-api.yml` uses Cloudflare API token/account ID, Wrangler secret setup, Worker deploy and live E2E | No VPS host or SSH deployment workflow is configured in the inspected VPS path; do not infer one exists |
| Release safety | `.github/workflows/release-gate.yml` is manual and requires explicit boolean confirmation before calling Neon migration and Worker deploy workflows | A controlled VPS release path, approval, health gates and rollback workflow remain to be designed/verified |
| Scheduling | Root `wrangler.toml` currently declares cron `30 0 * * *`; `workers/crypto-api/wrangler.toml` separately declares `0 * * * *`. The deploy workflow works from repository root, so root config is the relevant config for that command. Confirm intended production schedule before cutover | VPS worker uses `Europe/London` calendar midnight with GMT/BST-aware boundaries and passed DST tests |
| HTTPS / ingress | Current public API is served through Cloudflare Workers | Caddy configuration proxies to Node API; Compose exposes ports 80/443 publicly and binds direct API/PostgreSQL ports to loopback. Real domain, firewall and certificate issuance are not yet rehearsed on a VPS |
| Backup / recovery | This repository inspection does not prove Neon retention, PITR, export schedule or account settings | Scripted custom-format dump, checksum, archive validation and guarded restore exist. Disposable CI backup/restore passed. No real backup has been taken and no off-host encrypted backup/retention/alerting is configured |
| Secrets | GitHub Actions references `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, optional `CRYPTO_ADMIN_TOKEN` | `vps/.env.example` contains local-only placeholders. No production VPS credentials are configured |
| Schema/migrations | Migration files live under `infrastructure/neon/`; `scripts/migrate-neon.sh` uses standard `psql` and has been rehearsed twice on clean disposable PostgreSQL | The migration runner is provider-neutral in operation despite its legacy filename. Rename only after checking every workflow/document reference; do not create a second migration path |
| External data sources | API/worker fetch public market and chain data over HTTPS/RPC | These are data-provider dependencies, not Cloudflare/Neon hosting dependencies. Their rate limits, outages, freshness and source quality require a separate data-source resilience audit |
| CI/source control | GitHub Actions and GitHub repository are used for source and rehearsal | Remain dependencies for CI and code management; not a reason to keep Cloudflare or Neon in the runtime |

## Validation evidence

On commit `103440d8c03842b64562d62c9c5c3f147deec380`:

- [VPS API Build Rehearsal #251](https://github.com/olegsh247-stack/Crypto/actions/runs/38093843668) — PASS. Build, migration bootstrap/rerun, rollback rehearsal, API contracts, ingestion/idempotency, worker ingestion, monitoring-signal immutability, live Worker API parity, read-only ETH preflight, admin boundary, and PostgreSQL backup + isolated restore all passed.
- [Product Contour Gate #225](https://github.com/olegsh247-stack/Crypto/actions/runs/38093843795) — PASS. Web/runtime contract, Worker bundle dry run (no deploy), and disposable DB migration rehearsal passed.

The backup/restore gate proves the dump can be restored into a separate disposable PostgreSQL database and basic schema/table/asset checks pass. It does **not** prove production-data completeness, offsite disaster recovery, VPS host operations, DNS, TLS issuance, firewall setup, production credentials, or rollback under real traffic.

## Gaps to close before a migration can be approved

### P0 — resolve before production cutover

1. **Account-level inventory:** verify actual Cloudflare Worker settings, cron, secrets/bindings, routes/domains, logs/retention and rollback options; verify Neon project/branch, connection mode, backup/PITR/retention, roles/permissions, compute and actual migration state. Repository files cannot prove account settings.
2. **Production data parity plan:** compare source and target schema, constraints, migration markers, row counts and representative records for assets/pairs, candles, research snapshots/blocks/domains/factors/scores, scenarios/states, observations/evidence/sources, monitoring signals and event history.
3. **Off-host backup and recovery:** define encrypted destination, retention, checksum verification, restore cadence, access policy and failure alerts. A backup only on the VPS disk is not disaster recovery.
4. **Deployment and rollback:** implement and review a controlled, least-privilege VPS deployment mechanism with explicit approval, health checks, worker/API version alignment, and a rehearsed rollback. Do not add production secrets to repository files.
5. **Real host ingress/security rehearsal:** domain/DNS, Caddy certificate issuance and renewal, firewall, SSH hardening, updates, service restart behavior, logs/monitoring and disk-space alarms.
6. **Schedule contract:** reconcile the two Wrangler cron declarations and explicitly choose the intended UTC/London calendar semantics before any production schedule change. The VPS schedule is DST-safe; the current Worker schedule is not equivalent by definition.
7. **Cutover/rollback runbook:** define write freeze/final sync, traffic switch, observation window, rollback trigger and the period for which Cloudflare/Neon remain available.

### P1 — complete during the hosting audit

- Trace every production workflow that reads or mutates `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `CRYPTO_ADMIN_TOKEN`; classify it as production release, read-only validation, or rehearsal.
- Decide whether the Web frontend will remain on its current hosting provider or also move; this audit does not infer frontend hosting from a successful build.
- Review operational backup script behavior on a real Compose installation only after a disposable local rehearsal, and document tested commands/expected output.
- Rename legacy Neon-specific script/docs only after a repository-wide reference audit; preserve one canonical migration mechanism.

## Next step (no deployment)

Continue with a **release-workflow and secret-reference audit**: map every production-capable workflow, its trigger, secrets, and side effects; verify that ordinary PR/push gates cannot accidentally run production migrations or deploy the Worker. Then document the minimal target release workflow before implementing it.

## Explicitly not done

- No VPS purchased/provisioned or deployed.
- No production Neon migration, export, restore or write.
- No Cloudflare Worker deployment, DNS change or decommission.
- No real backup created.
- No GitHub Actions production release workflow run.
