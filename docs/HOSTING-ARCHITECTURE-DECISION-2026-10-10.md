# Crypto Hosting Architecture Decision — 2026-10-10

**Status:** Architecture decided; migration not authorized or deployed.  
**Supersedes:** Any ambiguity about whether Cloudflare Workers and Neon are intended as permanent dependencies.  
**Related:** `docs/INFRASTRUCTURE-PLAN-FINAL.md`, `docs/INFRA-BATCH-1.md`, Issue #5.

## Decision

The intended steady-state hosting architecture for this personal Crypto project is:

```text
Internet
  |
Caddy (HTTPS / reverse proxy)
  |
Node.js + TypeScript API
  |                 \
  |                  Worker process (scheduled ingestion)
  |
PostgreSQL 16 (private Docker network + persistent volume)

GitHub Actions -> tests/rehearsal -> controlled SSH deploy to VPS
```

The product should not require Cloudflare Workers or Neon to operate in its target state. Existing HTTP/API contracts, SQL model, research engine and worker behavior should be retained where practical; the migration is intended to be infrastructural rather than a product rewrite.

## What happens now vs later

### Now — architecture and compatibility

1. Treat Node.js API + standard PostgreSQL driver + PostgreSQL 16 as the target contract.
2. Keep the VPS API and worker rehearsal profile as the compatibility target.
3. Audit and reduce runtime-specific assumptions before adding product features that would deepen them.
4. Make read-only data capture and product logic independent of Cloudflare bindings and Neon-specific database APIs.
5. Validate against disposable PostgreSQL and compare API/worker behavior on the same test cases.
6. Document the complete Cloudflare and Neon account-level inventory separately; repository inspection cannot prove which account features are enabled.

### Later — actual migration and cutover

Do not purchase/provision a VPS, copy production data, run production migrations, change DNS/traffic, or decommission Cloudflare/Neon as part of ordinary product development. Those steps require the product audit, a migration rehearsal, backup-and-restore proof, schema/data/API parity, a rollback plan, and explicit authorization.

The cutover sequence remains:

1. Provision the VPS only when approved.
2. Install Docker Compose, PostgreSQL 16, API, worker, Caddy and backups.
3. Restore a verified database dump into the target PostgreSQL.
4. Compare schema, constraints, row counts, asset/pair registries, history, research, observations, signals and API responses.
5. Test the Node API and worker against the target DB, including a restore test and rollback rehearsal.
6. Freeze writes for a controlled final sync, switch traffic only after validation, and keep the old environment available for an agreed rollback window.
7. Decommission Cloudflare Workers and Neon only after the target is stable and rollback is no longer required.

## Dependency map

| Concern | Current implementation | Target implementation |
|---|---|---|
| API runtime | Cloudflare Worker / Web APIs | Node.js HTTP process |
| SQL driver | `@neondatabase/serverless` | Standard PostgreSQL driver (`pg`) |
| Database | Neon PostgreSQL | PostgreSQL 16 in private Docker network |
| Scheduled ingestion | Existing Worker/runtime path | Separate Node.js worker process/container |
| Reverse proxy / HTTPS | Current deployment-dependent | Caddy |
| CI migrations | Workflow can target Neon secrets | Disposable DB in CI; controlled target migration only during approved migration |
| Deploy | Cloudflare Worker deploy workflow | GitHub Actions to controlled SSH deploy, only after approved VPS setup |

## Compatibility rules for current product work

- Do not add Neon-only SQL features or runtime APIs without a documented reason and a PostgreSQL compatibility test.
- Prefer standard PostgreSQL SQL and a shared DB contract.
- The existing `vps/shared/src/db.ts` provides a rehearsal adapter over `pg`, but the function name `neon()` is misleading. Renaming it is a separate code change and must preserve shared runtime compatibility.
- Do not connect the read-only capture script to either database. Capture output is a reviewable artifact first.
- No production writes or migrations in normal CI.
- No browser-side admin secrets.
- Do not introduce Redis, Kubernetes, or multi-server complexity without a demonstrated requirement.

## Current status

- The VPS API build rehearsal is a disposable compatibility environment, not a deployed server.
- No VPS has been purchased or provisioned.
- Neon and Cloudflare remain the current operational environment until an approved cutover.
- Product Contour v1 and the ETH numeric observation pipeline continue in parallel with architecture-compatible code.
- This decision does not authorize merging PR #3, production migration, deployment, DNS changes or decommissioning.

## Definition of done for hosting migration

- [ ] Full account-level inventory completed.
- [ ] VPS PostgreSQL backup and restore verified.
- [ ] API runs on Node.js without Cloudflare Worker runtime.
- [ ] API runs against PostgreSQL 16 without Neon-specific driver.
- [ ] Worker runs as a separate Node.js process.
- [ ] Schema, data, API responses and worker behavior match the validated source.
- [ ] Authentication, HTTPS, logs and backups are verified.
- [ ] Rollback is rehearsed.
- [ ] Cutover is explicitly approved and completed.
- [ ] Cloudflare/Neon decommissioned only after the rollback window.
