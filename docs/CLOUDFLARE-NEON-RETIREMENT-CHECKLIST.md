# Cloudflare and Neon retirement checklist

Status: **not ready to execute**. This is a post-cutover checklist; it does not disable workflows or change production.

## Current dependency boundary

The target VPS Compose stack now exists in the repository, with Caddy HTTPS, private PostgreSQL/API ports, fixed UTC Worker scheduling, and a local backup utility. The backup/restore process is tested against disposable PostgreSQL. This does **not** mean production has moved: until an actual VPS is provisioned, the final database copy is accepted, and traffic is switched, production remains Cloudflare Worker + Neon.

## Legacy workflows that still target production

| Workflow | Current effect | Required action after accepted VPS cutover |
|---|---|---|
| `.github/workflows/release-gate.yml` | Manual Release Gate calls the Neon migration workflow, web build, Cloudflare Worker deployment/live E2E, then UI runtime E2E | Replace with a VPS release/deploy gate; never use this old gate for routine releases after cutover |
| `.github/workflows/apply-neon-v2.yml` | Reusable/manual workflow applies schema and migrations to `NEON_DATABASE_URL` | Retire after rollback window; replace with target-PostgreSQL migration job |
| `.github/workflows/apply-neon-schema.yml` | Manual schema/migration workflow against Neon | Retire after rollback window |
| `.github/workflows/deploy-crypto-api.yml` | Deploys Worker with Wrangler, enables workers.dev endpoint, runs live E2E and reads Neon contracts | Retire after VPS deploy/health/E2E path is proven |
| `.github/workflows/production-readonly-health.yml` | Read-only smoke check against the legacy Worker URL | Point at the accepted public VPS endpoint after DNS/routing cutover |
| `.github/workflows/seed-neon-data.yml` | Manual production seed write to Neon | Disable after the rollback window; do not use for VPS data |
| `.github/workflows/validate-neon-v2-migration.yml` | Validates an old Neon migration against Neon | Archive/disable after its evidence is retained and the source is retired |

The following may remain as CI if they only use disposable PostgreSQL: `vps-api-build.yml`, `seed-observation-idempotency.yml`, and local contract/unit tests. A workflow name containing “Neon” is not by itself proof that it writes to production; inspect its actual `DATABASE_URL` and trigger before changing it.

## Retirement sequence

1. Provision the VPS, DNS, firewall, secrets, persistent volumes, and off-host encrypted backup destination.
2. Run a restore rehearsal and a final source dump. Compare all public table counts, key integrity, schema constraints, and representative API responses.
3. Perform the approved write freeze and final restore. Keep VPS Worker ingestion paused during API acceptance.
4. Route the public API domain to Caddy/VPS and verify TLS, health, BTC research/evidence, daily history finalization, admin authorization, and monitoring.
5. Enable the VPS Worker schedule deliberately; verify a scheduled run and no overlapping writers.
6. Update the read-only production health workflow to the VPS public URL and add a VPS deployment/release workflow. Verify both with the actual host before retiring the legacy release gate.
7. Keep Cloudflare/Neon intact for the agreed rollback window. Record all VPS-only writes so they can be reconciled if rollback is required.
8. After acceptance and the rollback window, disable legacy production workflows first. Confirm no workflow callers remain; then remove obsolete secrets and runtime configuration. Delete neither the source database nor backups until retention policy permits it.

## Non-negotiable safety rules

- Do not remove Cloudflare/Neon now: they still serve production.
- Do not run the current Release Gate as a routine check; it can migrate Neon and deploy the Cloudflare Worker.
- Do not attempt Cloudflare secret mutation as part of retirement.
- Do not switch back to Neon after VPS-only writes without a reviewed reconciliation plan.
- Do not call the project “cloud-independent in production” until the public route, database, ingestion schedule, backups, and release workflow all operate on the target VPS.
