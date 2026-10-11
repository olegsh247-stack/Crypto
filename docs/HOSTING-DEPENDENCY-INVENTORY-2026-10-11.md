# Hosting Dependency Inventory — 2026-10-11

**Scope:** repository-visible hosting/runtime/deployment dependencies on `main`.  
**Status:** repository inventory recorded; provider account inventory remains unverified.  
**Target direction:** self-hosted runtime on one VPS, Docker Compose, Caddy, Node.js API + separate Node.js worker, PostgreSQL 16.  
**Safety:** static inspection only. No provider console access, live database query, migration, deployment, VPS provisioning, DNS change or secret operation was performed.

## Executive verdict

The target architecture is directionally clear, and a VPS-compatible rehearsal stack exists. However, the current runtime is still coupled to Cloudflare Workers and Neon, API logic is duplicated, and the current main-branch migration workflow applies migrations to Neon **before** it runs its disposable PostgreSQL rehearsal. The repository alone cannot prove which account-level Cloudflare/Neon services are enabled.

**Do not run the production migration workflow as a test. Do not provision a VPS or cut over yet.** Continue with the full Product Contour audit after this hosting baseline is recorded.

## Dependency matrix

| Layer | Verified on `main` | Target / implication | Status |
|---|---|---|---|
| API runtime | `workers/crypto-api/wrangler.toml` defines Worker `crypto-api`, entry `src/index.ts`, hourly cron `0 * * * *`. | Move to a standard Node.js HTTP process after route/response parity is proven. | Current provider coupling |
| Database driver | `workers/crypto-api/src/index.ts` imports `@neondatabase/serverless`. | Use standard PostgreSQL driver (the rehearsal uses `pg`). | Current provider coupling |
| Database | API receives `DATABASE_URL`; migrations are under `infrastructure/neon/migrations/`. | PostgreSQL 16 in a private Docker network, with migration and app credentials separated. | Target not deployed |
| Alternate API | `vps/api/src/app.ts` exists and uses a shared `@crypto/vps-runtime` adapter. | Reuse only after tested API parity. | Rehearsal implementation |
| SQL adapter | `vps/shared/src/db.ts` uses `pg`, but exports the function as `neon()`. | Rename only as a separate compatibility-preserving change; misleading name is not proof it uses Neon. | Naming debt |
| API logic | Worker `workers/crypto-api/src/index.ts` and VPS `vps/api/src/app.ts` contain separate implementations. | Keep parity tests on the exact candidate commit; avoid an untested wholesale rewrite. | Drift risk |
| Worker schedule | Worker config is hourly; ingestion is gated by application logic. VPS compose config defaults `WORKER_INTERVAL_MS=86400000`. | Define matching Europe/London wall-clock semantics, missed-run behavior and restart/idempotency tests before cutover. | Parity not established by files alone |
| Reverse proxy | No Caddy service in current `vps/docker-compose.yml`. | Add Caddy and HTTPS as part of the later operational migration batch. | Missing from rehearsal compose |
| Database networking | Compose exposes local PostgreSQL on host port `55432`; API is exposed on `8080`. | These are local rehearsal settings, not a production security template. Production DB must remain private. | Local-only config |
| Credentials in compose | Compose contains `crypto_local_only` and `local-development-only`. | Never reuse in production; use secret injection and dedicated least-privilege credentials. | Local-only config |
| Persistence / backups | Named PostgreSQL volume exists. | Add off-host backups, retention and a successful restore rehearsal. A volume alone is not a backup. | Backup proof missing |
| CI migration | `.github/workflows/apply-neon-v2.yml` calls `scripts/migrate-neon.sh` against `NEON_DATABASE_URL` before the disposable clean-bootstrap rehearsal. | Change safety path only in a reviewed isolated PR; routine validation should use disposable PostgreSQL and never mutate production. | **High-risk workflow ordering** |
| Worker deploy | `.github/workflows/deploy-crypto-api.yml` configures secrets and deploys the Worker through Wrangler. | Keep only for current operations/rollback until controlled VPS deployment is approved and proven. | Current deployment coupling |
| Secrets | `docs/SECRET-INVENTORY.md` lists `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CRYPTO_ADMIN_TOKEN`. | Verify actual existence/usage, rotate admin token before cutover, and remove obsolete credentials only after rollback window. | Account-level verification pending |
| Market sources | Worker/VPS ingestion code calls Binance, Kraken fallback and CoinGecko fallback. | These are external data dependencies independent of hosting provider. | Retain and test |
| UI hosting | Not proven by these API/infra files alone. | Inventory the actual Web build/deployment and domain path separately. | Needs workflow/config check |

## Critical workflow finding

On the inspected `main` version, `.github/workflows/apply-neon-v2.yml` has a migration job whose first database-mutating operation applies the migration runner against `secrets.NEON_DATABASE_URL`. The disposable PostgreSQL bootstrap and idempotency rehearsal runs later in the same job.

Therefore, a workflow run can modify production Neon before the disposable rehearsal has passed. The workflow has `workflow_dispatch` and `workflow_call` triggers, but this inspected version has no explicit boolean confirmation input before the live migration step.

**Operational rule until a reviewed fix is merged:** do not dispatch/call this workflow to test it, and do not run a production Release Gate merely to check whether it is green. Review exact workflow callers and permissions before any safety change; do not infer that a similarly named workflow on an unmerged branch protects `main`.

## What is known vs not known

### Confirmed by repository files

- Current API path is Cloudflare Workers + Neon PostgreSQL.
- Worker deploy workflow uses Cloudflare credentials and Wrangler.
- Migration workflow uses `NEON_DATABASE_URL` and runs repository migrations.
- A Node.js/TypeScript API, worker, `pg` adapter and PostgreSQL 16 compose profile exist for rehearsal.
- Rehearsal compose currently exposes PostgreSQL and contains development-only credentials.
- The source tree has a portability/parity risk because Worker and VPS API implementations are duplicated.

### Not established by repository inspection

- Which Cloudflare account features are enabled/used outside this repository: Pages, R2, KV, Durable Objects, Queues, Access, DNS, CDN/WAF or other services.
- Actual live Neon branches, roles, extensions, compute/autosuspend, backups, retention, row counts, schema drift and current data.
- Actual configured GitHub secret values or whether every listed secret exists; secret values must not be inspected or copied into documentation.
- Actual production API response parity at the time of this static review.
- Whether a VPS has been purchased/provisioned; the repository indicates rehearsal groundwork, not a deployed VPS.

These are explicit open inventory items, not assumed negatives.

## Ordered actions

1. **Hosting architecture and inventory:** this document records repository-visible facts. The remaining account-level items must be checked through approved read-only access before cutover planning is considered complete.
2. **Product Contour v1 audit:** inspect migrations, schema/data contracts, API, Worker, UI and CI; use read-only checks where possible and clearly label static vs live evidence.
3. **BTC full scenario:** only after the audit baseline, demonstrate the complete evidence-backed path on BTC.
4. **Infrastructure migration batch:** only after the above, rehearse dump/restore, data parity, API/worker parity, backup/restore and rollback; provision and cut over only with explicit approval.

## Non-negotiable boundaries

- No production migration, deployment, DNS switch, secret rotation or provider decommissioning during this inventory step.
- A future date in a migration filename does not defer its execution; the migration runner processes unmarked migration files in lexical order.
- Disposable PostgreSQL success does not prove live Neon compatibility or data parity.
- Do not expand SOL/CAKE research before the BTC scenario is complete.


## Read-only Neon account inventory — 2026-10-11

The connected Neon management API was queried read-only for the project named `Crypto`, its project settings, branches, compute endpoints and snapshots. No connection string was requested, no SQL was run, and no account setting was changed.

| Item | Observed state | Hosting implication |
|---|---|---|
| Project | One project named `Crypto` returned by the search. | The repository's Neon dependency corresponds to an identifiable managed project. This is a management-plane observation, not a schema/data audit. |
| PostgreSQL version | Project metadata reports PostgreSQL 18. | The current infrastructure document proposes PostgreSQL 16 for VPS. Compatibility must be tested explicitly before choosing/downgrading the target major version; do not assume PostgreSQL 16 is equivalent to the live PostgreSQL 18 source. |
| Region | `aws-eu-central-1`. | Target VPS region and latency/data-residency considerations should be considered in sizing; no provider selected yet. |
| Branches | One branch named `production`, marked primary/default, state `ready`; metadata says `protected: false`. | Confirm whether branch protection is intentionally disabled. This is a configuration review item, not a change made here. |
| Compute | One read-write endpoint; observed state `idle`/suspended at inspection. Autoscaling limits: 0.25–2 CU; suspend timeout 0 seconds. | Current compute can suspend when idle. Do not infer performance from the idle snapshot. Record actual usage/cost data before migration sizing. |
| Connection controls | Project metadata reports `block_public_connections: false`, empty IP allow-list, and endpoint metadata `passwordless_access: true`. | **Security review required.** Confirm the exact semantics and intended posture in Neon before changing settings. Do not change access controls as part of this audit; coordinate application connectivity and rollback first. |
| Pooler | Endpoint metadata reports pooler disabled. | Check actual connection patterns/limits before deciding whether a pooler is needed for current Worker use; the VPS target should use a normal pooled Node PostgreSQL pool. |
| Snapshots | Snapshot listing returned an empty list. | This API listing is not proof that Neon has no point-in-time recovery or managed history. Still, no explicit project snapshot was listed. Verify the actual restore/PITR window and rehearse recovery before cutover. |
| History retention | Project metadata reports 21,600 seconds (6 hours). | This is short relative to a full migration/rollback window. Verify what this field governs and whether plan-level recovery covers the required window; do not treat it as a backup. |

### What remains unverified in Neon

- Live schema, row counts, research snapshots, observations and monitoring state; those belong to the Product Contour audit step.
- Roles and grants, extensions, actual backup/PITR availability and tested restore behavior.
- The exact semantics of `passwordless_access`, public-connection blocking and the empty allow-list in this project configuration.
- Whether the returned snapshot list represents all recovery capabilities exposed by the current plan.

These findings are from read-only management metadata. No production SQL or write path was used.
