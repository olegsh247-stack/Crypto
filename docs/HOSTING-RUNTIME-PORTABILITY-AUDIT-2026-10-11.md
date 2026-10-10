# Hosting Runtime Portability Audit — 2026-10-11

**Repository:** `olegsh247-stack/Crypto`  
**Static baseline:** `main` at `cfc213c7755c24e0e0addc24b9268a79cc43d324`  
**Related working branch:** `fix/product-contour-v1-contracts`  
**Status:** Architecture audit in progress; no runtime changes or cutover performed.

## Executive decision

The intended target remains **Caddy → Node.js API + separate Node.js ingestion worker → PostgreSQL 16**. A meaningful VPS rehearsal implementation already exists, but it is not yet a drop-in replacement for the live Cloudflare Worker/Neon path.

**Decision:** continue architecture/portability work now, but do not provision a VPS or perform production migration/cutover. Before further runtime refactoring, establish explicit parity contracts and close the scheduler/monitoring freshness differences listed below. Do not treat the existence of a VPS Docker build as proof of operational readiness.

## Verified dependency inventory

| Concern | Current `main` | Existing self-hosted rehearsal | Audit result |
|---|---|---|---|
| API runtime | Cloudflare Worker; entry point `workers/crypto-api/src/index.ts`; Wrangler config and scheduled handler | Node.js HTTP server at `vps/api/src/server.ts`, wrapping Web `Request`/`Response` and the app handler | Target runtime exists, but the API implementation is duplicated |
| SQL driver | `@neondatabase/serverless` | `pg` connection pool in `vps/shared/src/db.ts` | PostgreSQL portability is plausible; the shared adapter is still named `neon()`, which misrepresents its actual driver |
| Database | Neon PostgreSQL through `DATABASE_URL` | PostgreSQL 16 container in local/disposable rehearsal | Target DB exists only as a rehearsal profile; no production VPS database is running |
| API handler | `workers/crypto-api/src/index.ts` (~37 KB at audit baseline) | `vps/api/src/app.ts` (~31 KB at audit baseline) | Similar route logic is maintained in two separate files; semantic drift is a material risk |
| Scheduled ingestion | Wrangler cron `0 * * * *`; handler gates normal runs on Europe/London hour `00` | Worker runs immediately on process startup and then on `WORKER_INTERVAL_MS` (24 h by default) | Not schedule-equivalent: a restart can trigger an extra run, and a fixed interval can drift from London midnight |
| Monitoring refresh | The `main` Worker refresh helper advances `monitoring_signals.last_updated_at` after ingestion | The VPS scheduler also advances signal timestamps after successful candle ingestion | This does not prove signal evaluation ran. Do not carry this behavior into the target; the product contract requires signal freshness to reflect actual evaluation |
| Reverse proxy / HTTPS | Current endpoint is hosted by Cloudflare Worker | No Caddy service in `vps/docker-compose.yml` | Caddy is part of the target design but is not yet implemented in the rehearsal compose stack |
| CI / migration | `apply-neon-v2.yml` uses `NEON_DATABASE_URL`; on `main` it applies migrations before the disposable clean-bootstrap rehearsal | `vps-api-build.yml` builds Node services and tests migrations against disposable PostgreSQL | Do not run the production migration workflow merely as a test. The disposable rehearsal must be the default validation path |
| Deployment | `deploy-crypto-api.yml` configures secrets and deploys the Cloudflare Worker | VPS build/rehearsal only; no verified controlled SSH deployment path | Deployment automation for the target remains future work and requires separate approval |
| Secrets | `DATABASE_URL`, `ADMIN_TOKEN`; GitHub Actions uses Neon and Cloudflare secret names | Environment variables are read by Node services; compose contains local-only credentials | Secret inventory is a documented pre-cutover requirement; account-level inventory cannot be established from repository files alone |
| Persistence / backups | Neon-managed database service | Local compose has a PostgreSQL named volume | A persistent volume is not a backup. Automated backup, off-host retention and a proven restore are not yet evidenced by the rehearsal profile |

## Concrete findings

### H-01 — API implementations can drift

The Worker entry point and VPS app contain separate copies of routing, SQL and response-building logic. The current VPS rehearsal includes a parity script against the live Worker, which is useful, but a parity run only proves the tested requests and fields at that commit.

**Required before cutover:** run parity on the exact candidate commit with representative success, empty, error and admin-auth cases, and include Product Contour fields/lineage in the contract. Keep both implementations only while that parity remains tested; do not assume source equivalence.

### H-02 — Worker schedule is not equivalent

Cloudflare invokes the scheduled handler hourly and the handler allows the ordinary ingestion run only during the London 00:00 hour. The VPS worker runs once immediately at startup and then on a fixed interval. Those semantics differ under restarts, delays and daylight-saving transitions.

**Required before cutover:** make the Node worker schedule against the same explicit Europe/London day boundary, preserve idempotency, define behavior for missed runs, and test repeated/restarted execution against disposable PostgreSQL. A fixed 24-hour timer is not a sufficient substitute for a wall-clock schedule.

### H-03 — Candle ingestion must not imply signal evaluation

At the audit baseline, both Worker and VPS scheduler code can update `monitoring_signals.last_updated_at` after candle ingestion without demonstrating that a signal evaluator ran. This makes the timestamp misleading.

**Required:** the hosting implementation must adopt the corrected product contract: ingestion freshness, research-review freshness and signal-evaluation freshness are distinct. Only a successful evaluation may advance the signal timestamp. This is a compatibility blocker, not a reason to invent monitoring events or thresholds.

### H-04 — The self-hosting deployment shape is incomplete

The local compose profile provides PostgreSQL, API and worker, but does not include Caddy, backup jobs, production-grade secret injection, log retention/health monitoring or an SSH deployment workflow. Its exposed database port and hard-coded credentials are for local rehearsal only and must not be reused in production.

**Required before cutover:** add and test the HTTPS/reverse-proxy and operational runbook only after API/worker parity is established. Keep PostgreSQL on a private network in the production design. Prove backup and restore, not just volume persistence.

### H-05 — Migration naming and workflow boundaries are provider-coupled

The SQL migration directory and runner are named for Neon even though the migrations are intended to work on standard PostgreSQL. The current `main` migration workflow applies to live Neon before running its disposable bootstrap check. A feature-branch guard may improve safety, but does not change the fact that `main` must not be used for a production workflow test.

**Required:** keep production migration workflows approval-gated; use disposable PostgreSQL for all ordinary migration rehearsals. Rename provider-specific scripts/directories only as a separate, tested cleanup after all callers and workflows are inventoried—do not rename them casually during product work.

### H-06 — Provider account inventory is still unverified

Repository inspection confirms the Worker and Neon database dependency. It does not establish whether Cloudflare Pages, R2, KV, Durable Objects, Queues, Access, DNS, CDN/WAF or other account-level services are enabled or used outside this repository.

**Required:** before cutover, complete a read-only provider/account inventory and reconcile it with `docs/SECRET-INVENTORY.md`. Do not claim that an account-level feature is unused solely because it is absent from the source tree.

## Safe next implementation sequence

1. **Freeze this architecture baseline and preserve the agreed project order.** Hosting architecture is the active priority; product-contract acceptance and the single BTC scenario follow; broad research expansion comes later.
2. Define the shared runtime contract for API routes, environment variables, SQL parameterization, errors, CORS and scheduling. Record expected behavior independently of either hosting provider.
3. Strengthen disposable PostgreSQL parity tests so they compare the same API contract across Worker and Node implementations, including the corrected signal-freshness rule. Do not point these tests at production Neon.
4. Implement the smallest portable-runtime changes only after tests expose the exact divergence. Avoid a wholesale rewrite of the ~37 KB Worker handler without a contract suite.
5. Add the target operational layer (Caddy, private database networking, backup/restore, health/logging, controlled deployment) after runtime parity is proven.
6. Rehearse migration, restore, rollback and data/API parity. Provisioning, production writes/migrations, traffic changes and Cloudflare/Neon decommissioning remain separate explicit-approval actions.

## Boundaries and evidence

- This audit is static analysis of public repository files; no Cloudflare or Neon account console was inspected.
- No live database query, production write, migration, deployment, VPS provisioning, DNS change, secret rotation or service decommissioning was performed.
- No claim is made that the target hosting environment is production-ready.
- Related architecture decision: `docs/HOSTING-ARCHITECTURE-DECISION-2026-10-10.md`.
- Canonical execution order: `docs/PROJECT-READINESS-ROADMAP-2026-10-10.md`.
