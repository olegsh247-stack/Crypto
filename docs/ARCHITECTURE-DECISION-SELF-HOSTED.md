# Hosting Architecture Decision — Crypto

**Status:** Decision baseline for implementation planning  
**Date:** 2026-10-09  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Runtime hosting and infrastructure dependencies only. No production migration or deployment is authorized by this document.

## Decision

Crypto's target runtime is **self-managed hosting on one VPS**, using Docker Compose and PostgreSQL under the project owner's control. The VPS is purchased and provisioned only after the product audit and one complete end-to-end asset scenario have passed.

This is a decision about the target architecture, not an instruction to immediately remove or disable the currently running services.

- **Target:** Next.js Web + Node.js API + scheduled worker + PostgreSQL 16, managed together through Docker Compose.
- **Current compatibility baseline:** Cloudflare Worker API + Neon PostgreSQL. Keep it intact until the self-hosted implementation has demonstrated parity.
- **No provider lock-in in product logic:** business rules, API contracts, SQL schema and migrations should remain portable wherever practical.
- **GitHub/GitHub Actions may remain** as source control and CI. They are not the application's runtime host and do not need to be removed to achieve self-hosted runtime hosting.
- External market-data and chain RPC endpoints are data providers, not hosting dependencies; retain provider adapters and explicit provenance.

## Why not buy/configure the VPS now?

A server does not help establish whether the product is complete. The sequence is:

1. document the runtime boundary and inventory provider-specific dependencies;
2. audit Product Contour v1 against real code and test evidence;
3. complete one end-to-end asset scenario and verify contracts;
4. prove the Node/PostgreSQL target locally and compare it against the current API;
5. only then rent/provision the VPS, migrate data deliberately, deploy, and run the final release gate.

This avoids paying for a server while the product contract is still changing and avoids migrating twice.

## Repository evidence found

- `workers/crypto-api/src/index.ts` is the current Worker entrypoint and currently combines routing/business logic with database access and Worker `fetch`/`scheduled` entrypoints.
- `workers/crypto-api/package.json` depends on `@neondatabase/serverless`.
- `wrangler.toml` declares the `crypto-api` Worker and a daily cron trigger.
- `.github/workflows/deploy-crypto-api.yml` configures Worker secrets, deploys through Wrangler, and runs live API/ingestion checks.
- `.github/workflows/apply-neon-v2.yml` and `scripts/migrate-neon.sh` form the existing migration/contract path. The script name is historical; its use of `DATABASE_URL` makes it usable with a compatible PostgreSQL target, subject to rehearsal.
- A Node target already exists under `vps/api`, `vps/worker`, and `vps/shared`. The shared adapter uses the `pg` driver and a parameterized query interface.
- `vps/docker-compose.yml` currently defines PostgreSQL, API, and worker for **local rehearsal**. Its documented development credentials are intentionally non-production.
- `.github/workflows/vps-api-build.yml` defines a build/database/API rehearsal and a parity check against the current live Worker. The existence of this workflow is not, by itself, proof that its latest run passed.
- `web/package.json` defines a normal Next.js build/start flow; the current VPS Compose file does not yet include a Web service or a production reverse proxy/TLS service.

## Target topology

```text
Internet
   |
   v
Reverse proxy (Caddy or Nginx; HTTPS)
   |--------------------|
   v                    v
Next.js Web          Node.js API
                         |
             ------------------------
             |                      |
             v                      v
        PostgreSQL 16         Scheduled worker
        persistent volume     (same DB/network)
```

The API, Web, worker and database should share a private Docker network. PostgreSQL should not be exposed publicly. Production secrets must be supplied through the deployment environment/secret mechanism, not committed into Compose or source files. Backups must be automated and restoration tested.

## Cloud-specific dependencies to retire only after parity

| Current dependency | Target replacement | Required proof before cutover |
|---|---|---|
| Cloudflare Worker runtime and Wrangler deployment | Node.js API container | API route/response parity, error handling, auth, graceful shutdown, health checks |
| Worker `scheduled` trigger | Dedicated Node worker process or scheduler | Same ingestion, idempotency, monitoring refresh, retry/error behavior |
| `@neondatabase/serverless` | `pg` pool against ordinary PostgreSQL | Clean bootstrap, all migrations, parameterized-query parity, connection limits and shutdown |
| Neon-hosted PostgreSQL | PostgreSQL 16 volume on VPS | Clean migration rehearsal, data migration/validation plan, backup/restore proof |
| Cloudflare runtime secrets | VPS/deployment environment secrets | Secret rotation, no secret leakage, protected admin routes |
| Worker-specific CI deployment | Build/test CI plus deliberate VPS deployment step | Rollback strategy, health verification and final release gate |

## Known gaps before this can be called production-ready

1. The local Compose profile has only PostgreSQL/API/worker; it lacks the Next.js Web and a reverse proxy/TLS service.
2. Compose contains fixed development-only credentials and publishes the PostgreSQL port for local access. This is acceptable only for local rehearsal; production configuration must keep the DB private and use strong externally supplied secrets.
3. The Node API and worker must be tested for behavioral parity with the current Worker on the same fixtures/database state. A passing TypeScript build alone is insufficient.
4. Worker lifecycle details need review: graceful shutdown, retry/backoff, overlap prevention, structured logs, failure visibility and scheduler behavior.
5. The full Product Contour runtime must be exercised against the Node API, not only the existing live Worker.
6. Migration/bootstrap behavior must be verified on a fresh ordinary PostgreSQL instance and on a rerun; do not infer this from the migration runner's filename or from a previous run on Neon.
7. Production data transfer, backup retention, restoration, monitoring, domain/DNS and rollback procedures remain deployment-stage tasks.
8. The current Release Gate's Neon/Cloudflare production path must not be triggered as part of read-only audit work. Production migration, production deployment and PR merge remain separate approval points.

## Safety rules

- Do not remove Cloudflare or Neon secrets/configuration while the current release path is still the known-good compatibility baseline.
- Do not run production migrations, production deployment, or destructive data operations during architecture audit.
- Do not merge PR #3 merely because the architecture document is added.
- Treat local VPS Compose as a rehearsal profile, not a production deployment recipe.
- Keep the visual design unchanged during these infrastructure/product-contract stages.

## Exit criteria for Phase 1

Phase 1 is complete only when:
- every runtime/cloud-specific dependency has been inventoried from code and workflows;
- the current Worker and Node API responsibilities are mapped, including the scheduled job;
- the self-hosted topology and secret/data boundaries are documented;
- known gaps and required parity checks are accepted;
- a safe, reversible migration/cutover plan is agreed.

The server purchase and actual deployment remain at the end of the project sequence.
