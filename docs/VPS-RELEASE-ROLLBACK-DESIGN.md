# VPS release and rollback design (pre-deployment)

**Status:** design only. No VPS is provisioned, no SSH deployment workflow is configured, and no production release is authorized.
**Related:** [Hosting architecture decision](./HOSTING-ARCHITECTURE-DECISION-2026-10-10.md), [Hosting dependency inventory](./HOSTING-DEPENDENCY-INVENTORY-2026-10-11.md), [Caddy / backup / restore operations](./VPS-OPERATIONS-CADDY-BACKUP-RESTORE.md).

## Decision

The target release path is **GitHub Actions -> protected production approval -> SSH to one VPS -> deploy an exact commit SHA using Docker Compose -> verify health -> retain the previous application release for rollback**.

Do not add Kubernetes, a container registry, or a second orchestration layer without a demonstrated need. The public repository can be fetched by the VPS; secrets and production configuration must never be committed to Git.

This document is not a deploy script and does not authorize running a release.

## Release prerequisites (all required)

- [ ] VPS is explicitly purchased/provisioned and its OS, firewall and recovery access are documented.
- [ ] SITE_ADDRESS is decided; DNS points to the host; Caddy certificate issuance and renewal are tested.
- [ ] SSH access is restricted to the deploy account, with least privilege; host key is verified out of band and pinned in GitHub Actions.
- [ ] GitHub production environment has required reviewer approval. Workflow manual-dispatch confirmation alone is not a substitute for environment protection.
- [ ] GitHub secrets are configured only after the VPS exists: VPS_HOST, VPS_USER, VPS_SSH_PRIVATE_KEY, and pinned VPS_KNOWN_HOSTS. No private key is stored in the repository or VPS environment file committed to Git.
- [ ] The VPS has a protected environment file with unique credentials and permissions restricted to the service/operator account.
- [ ] An encrypted off-host backup destination, retention, restore procedure and backup-failure alert are configured and tested.
- [ ] A verified backup and a disposable restore have passed immediately before the first production migration.
- [ ] Target PostgreSQL schema/data and API/worker parity have been compared; write ownership and final-sync procedure are agreed.
- [ ] The old Cloudflare Worker + Neon environment can remain available throughout an agreed rollback window.

## Normal application release (after prerequisites)

1. **Select immutable revision.** Release only a reviewed commit SHA that passed VPS Build Rehearsal and Product Contour Gate. Record the SHA and workflow URLs in the release record.
2. **Build and test before SSH.** Run typecheck/build, contract tests, clean PostgreSQL bootstrap and migration idempotency, API/worker E2E, London schedule/DST tests, backup/restore rehearsal, and admin-boundary tests. No production secrets are required by these jobs.
3. **Require protected approval.** Use GitHub environment production with a required reviewer. A manual dispatch input may be an additional guard, not the only guard.
4. **Pre-deploy backup.** On the VPS, create a timestamped PostgreSQL custom-format backup, checksum it, verify archive readability, upload the encrypted copy off-host, and verify upload. Abort on any failure.
5. **Deploy application revision.** Connect using the pinned SSH host key and dedicated deploy account. Fetch the exact SHA; do not deploy a moving branch name. Preserve the currently running image/build as the previous release.
6. **Database migration is a separate gate.** Do not automatically run destructive/schema migrations as a side effect of every app deployment. Review the migration, check backward compatibility, verify backup completion, and require explicit production approval before applying it.
7. **Start/refresh services.** Rebuild or load the API and worker for the selected SHA, then apply the Compose update. PostgreSQL data volume and Caddy state must not be removed or recreated by routine release commands. Never use docker compose down -v in production.
8. **Health gate.** Check container health, /api/health, /api/db-health, representative read-only API contracts, worker process health and logs. Verify no duplicate ingestion and that monitoring signals remain unchanged unless an approved product operation is expected.
9. **Observe.** Keep the previous app release and the old Cloudflare/Neon environment available through the rollback window. Record the deployed SHA, migration marker, backup reference, health results and operator approval.

## Abort and rollback criteria

Abort the rollout before traffic is switched if any preflight, backup, migration, service startup, API contract, database health, worker health or data-integrity check fails.

For an **application-only regression with a backward-compatible schema**:
1. Stop rollout and retain logs/diagnostics.
2. Switch API and worker services back to the previously recorded application SHA.
3. Restart services without modifying the PostgreSQL volume.
4. Re-run health and contract checks.
5. If rollback does not restore health, stop writes/ingestion and follow the incident recovery procedure.

For a **schema/data regression**:
- Do not assume application rollback reverses a database migration.
- Stop ingestion and all writers to prevent further divergence.
- Determine whether a forward fix is safer than restore.
- Restoring a backup over the active database is a separate destructive recovery action requiring explicit incident approval, a verified backup, and a defined data-loss point. Use the guarded restore procedure only after preserving the current failed state where feasible.
- After restore or repair, validate migration markers, assets and pairs, candle history, research snapshots, observations, monitoring signals and API responses before reopening traffic.

## Cloudflare/Neon to VPS cutover (separate change, not a normal release)

1. Confirm the exact production hostname and current routing. Do not assume the workers.dev endpoint can be switched by changing DNS.
2. Record DNS TTL and current Worker cron. Resolve the schedule mismatch between root wrangler.toml (30 0 * * *) and workers/crypto-api/wrangler.toml (0 * * * *) before disabling or replacing the Worker schedule.
3. Take and verify a final source backup/export. Establish a write freeze for admin mutations and scheduled ingestion.
4. Perform the final sync into VPS PostgreSQL; compare schema/migration markers, row counts and domain-level invariants. Ensure only one environment is the authoritative writer.
5. Start VPS API and worker with ingestion disabled until read-only parity and health checks pass.
6. Switch traffic only through the actual configured domain/routing mechanism; validate TLS, health, API contracts and logs.
7. Enable VPS ingestion once, verify idempotency and schedule behavior, then monitor for the agreed period.
8. Keep Cloudflare/Neon intact and recoverable for the full rollback window. If rollback is required, freeze VPS writes first and reconcile any writes since cutover before re-enabling the old environment; never allow both workers to ingest concurrently.
9. Decommission Cloudflare/Neon only after explicit approval, successful observation and confirmation that rollback is no longer required.

## Current non-goals and blockers

- No production VPS deploy workflow exists yet; this is the desired design, not implemented automation.
- No production host, SSH key, host key pin, production environment protection, real off-host backup or TLS/DNS rehearsal has been verified.
- No production data copy, write freeze, traffic switch, migration, or service decommission is authorized.
- The account-level Cloudflare/Neon settings and actual domain routing still require inspection.
