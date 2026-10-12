# Hosting dependency audit and safe cutover plan

**Date:** 2026-10-12  
**Scope:** Read-only audit of the current `main` repository and its self-hosted target configuration.  
**Change boundary:** Documentation only. No source-code fixes, PR merges, production queries/writes, secret changes, deployment, or runtime changes were performed.

## Executive decision

The only target architecture is the user's own VPS:

`DNS → Caddy (HTTPS) → Node.js API → self-hosted PostgreSQL 16`, with a separate Node.js scheduled Worker, private database/API/Worker networking, and verified backups. GitHub Actions is CI/release validation, not a hosted runtime dependency.

The retired edge-runtime platform and hosted database are not part of the desired final architecture. However, repository cleanup and a target-stack rehearsal do **not** prove that the currently serving public endpoint has been cut over. The migration tracker says the former public service has not yet been switched and the VPS is not provisioned. Do not delete the existing database/project or disable the old endpoint until data parity, backup/restore, acceptance, and a controlled cutover are complete.

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
- Existing production data must be preserved and migrated deliberately. Do not infer that the hosted database is safe to delete because target migrations pass.
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


## Additional code-review finding — Worker London-day boundary

**Status: defect confirmed; narrow fix implemented and validated in [PR #71](https://github.com/olegsh247-stack/Crypto/pull/71), pending review/merge.**

The current `vps/worker/src/scheduler.ts` parses the `Intl.DateTimeFormat` offset with this regular expression:

```ts
/^GMT([+-])(\d{2}):(\d{2})$/
```

The pattern contains doubled backslashes in the regular-expression literal, so it looks for a literal backslash followed by `d` instead of matching numeric digits. For an offset such as `GMT+01:00`, the match fails and the code falls back to zero offset. During British Summer Time this shifts the intended London-midnight candle boundary to UTC midnight (one hour early). This is a concrete target-Worker defect, not merely a choice between UTC and London calendar semantics.

The inspected VPS Build Rehearsal exercises ingestion and idempotency but does not assert the London boundary across GMT/BST transitions; no dedicated scheduler test file was found at the checked conventional paths. The current successful gate therefore does not establish this conversion is correct.

**Follow-up completed in PR #71:** six regression tests cover winter, summer, both DST transition dates, and the days immediately after. The focused Worker patch and test step are on a branch based on current `main`; VPS Build Rehearsal and workflow static validation passed. The PR remains unmerged and no production deployment occurred. Do not merge the stale scheduler PR as a substitute for the focused fix.


## Dependency inventory completion pass — current `main` at `115e13995c4ba005545a78033bf4a638b3584c38`

This section narrows the requested Neon/Cloudflare audit by separating repository evidence from account-level state that cannot be inferred from source code.

### Neon and Cloudflare disposition

| Surface | Current-main evidence | Finding / required confirmation |
|---|---|---|
| Runtime application | Target runtime files are under `vps/api` and `vps/worker`; production Compose uses Node.js services and PostgreSQL 16. No Neon SDK/runtime config or Cloudflare Wrangler config appeared in the inspected main tree. | Repository target runtime is provider-neutral/self-hosted. This does **not** prove the live public endpoint has moved off the legacy Worker or that the old service has been disconnected. |
| Database | Target migrations live under `infrastructure/postgres/migrations/`; `scripts/migrate-postgres.sh` uses `DATABASE_URL` and applies every unmarked SQL file in lexical order. | The target migration path no longer depends on a Neon-specific runner. The legacy hosted database must remain preserved until backup/restore, parity, cutover and rollback gates pass. |
| CI/CD | `.github/workflows/release-gate.yml` calls VPS build/rehearsal and Web build. The inspected workflow uses disposable PostgreSQL and has no production deploy step or Neon/Cloudflare credentials. `production-readonly-health.yml` is a manually triggered GET-only check against a supplied URL. | Repository CI is self-hosted-target validation, not deployment. No production workflow should be enabled without a separate reviewed deployment path. |
| Environment variables | Production Compose consumes `POSTGRES_PASSWORD`, `ADMIN_TOKEN`, `CORS_ORIGIN`, `CADDY_DOMAIN`, `WORKER_SCHEDULE_UTC`, `BACKUP_DIR_HOST`, and `BACKUP_RETENTION_DAYS`. API/Worker get `DATABASE_URL` assembled internally from the Postgres password. CI creates an ephemeral `DATABASE_URL` for disposable PostgreSQL. | These are target-host variables. The secret inventory lists `DEPLOY_SSH_KEY` as future/planned, not as proof of an active deploy workflow. Do not print or copy secret values during the audit. |
| GitHub App / repository integration | Source files cannot establish which GitHub Apps are installed, their permissions, or whether a third-party service has a repository integration. | **Unverified externally.** Inspect repository Settings → GitHub Apps / installed apps and account-level integrations before declaring GitHub App access removed. Do not revoke an app based only on absence of source references. |
| Cloudflare Git integration / live Worker | No Cloudflare deploy workflow or Wrangler configuration was found in the inspected main tree; PR #70 and this audit are documentation-only. | **External state remains unverified.** Confirm in the Cloudflare dashboard whether a Worker/Pages project is connected to this repository, whether builds are disabled, and whether the legacy public endpoint still routes to it. Repository absence alone is not disconnection. |
| Backups | `scripts/backup-postgres.sh` creates a custom-format dump, archive list and SHA-256; Compose mounts `BACKUP_DIR_HOST`; systemd template schedules daily at 02:00 UTC. | CI rehearses backup/restore on disposable PostgreSQL. No evidence yet proves a real host, off-host encrypted copy, timer execution or restore of the production dataset. |
| Migration safety | The migration runner applies every file in `infrastructure/postgres/migrations/*.sql` in lexical order when unmarked. | A date in a filename does not defer a migration. Review the complete pending migration set against a disposable clean database before any target DB operation; never use the production Release Gate as a test. |
| Branch protection | GitHub's current branch metadata reports `main` as unprotected and required status checks disabled. | A real governance gap: merge protection is not enforced at the branch level. This audit records the finding but does not change repository settings or guess the desired ruleset. |

### Runtime and CI variable boundary

- **Local/disposable CI:** temporary `DATABASE_URL`, test-only admin token and local CORS origin are created inside the workflow; they are not production credentials.
- **Future VPS runtime:** values in `vps/.env.production.example` are placeholders. A real `.env.production` must remain outside Git with restrictive permissions.
- **Future deployment:** `DEPLOY_SSH_KEY` is described in the secret inventory as a future secret. No deployment workflow or SSH deployment action was observed in the inspected release-gate workflow.
- **Legacy services:** any old Neon/Cloudflare secrets may exist in GitHub or provider settings even though they are not referenced by current-main source. Their existence and last-use status cannot be inferred safely from repository code.

### Hosting audit exit criteria — still open

- [x] Repository target topology, migration runner, CI-only release gate, target environment-variable names and backup/restore rehearsal path identified.
- [x] No Neon-specific migration directory or Cloudflare deploy configuration found in the inspected current-main tree.
- [ ] Verify `main` branch protection in GitHub settings. The rulesets read returned an empty list, but the branch-protection endpoint returned HTTP 403 for the connected integration; this is insufficient evidence to claim the branch is unprotected.
- [ ] Confirm Cloudflare Git/Worker connection state in provider dashboard; do not treat absence from Git as proof of disconnection.
- [ ] Confirm installed GitHub Apps and repository permissions from GitHub settings.
- [ ] Inventory existing repository/environment secrets by **name and usage only**; remove nothing until all references and rollback requirements are checked.
- [ ] Confirm whether the legacy public API still routes to the old runtime and database; no endpoint switch or deletion is authorized here.
- [ ] After VPS is actually provisioned, verify host firewall, real environment file permissions, off-host backup, timer execution and restore from a production-like dump.

The hosting architecture audit is therefore **partially complete, not closed**. The repository-side dependency map is documented; provider/account-level connection state, live routing, actual secret usage, and real-host backup behavior remain unverified. Keep the overall plan on step 1 until those external checks can be evidenced, then proceed to the open-PR comparison. No production changes, secret changes, merges, deploys, migrations, or database writes were performed by this pass.


### Migration runner: concrete execution implication

At the audited `main` SHA, the migration tree already contains `2026-10-13-btc-input-source-registry.sql` and `2026-10-13-btc-observation-natural-key.sql`, although the audit date is 2026-10-12. This is not a scheduling mechanism: `scripts/migrate-postgres.sh` iterates all `*.sql` files in lexical order and applies each unmarked migration. A clean bootstrap or a later migration run can therefore execute these files immediately. Their presence on `main` must not be interpreted as production application; before any real target DB operation, inspect both files, run the entire ordered migration set on disposable PostgreSQL, and record the exact migration markers on the intended target. No migration was executed against production during this audit.


## Follow-up pass — account evidence and scanner validation (2026-10-12)

### Neon account state (read-only inventory)

A read-only inventory through the connected Neon account confirms that a project named **Crypto** exists, with a primary branch named **production** and a read-write PostgreSQL endpoint. The endpoint reported an idle state at inspection, while its activity metadata was dated today. This is sufficient to establish that the Neon resource still exists; it is **not** sufficient to prove that the current public API is or is not using it.

- No SQL was executed against the database.
- No database contents, connection strings, resource IDs, hostnames, or account identifiers are recorded in this public repository.
- Do not delete, suspend, rotate, or otherwise change the project or endpoint until public-runtime routing, required data, backup/restore, target parity, and rollback are verified.
- Public API-to-database routing remains unverified. This requires a safe, read-only endpoint/configuration check; it must not be guessed from the project name or recent activity.

### Cloudflare account state

The available connected tools do not provide read access to the user's Cloudflare dashboard. Repository inspection still shows no Cloudflare deployment configuration in the inspected main files, but that does not establish whether an account-level Worker/Pages project, Git connection, DNS route, or secret binding remains active. Keep this item open until the dashboard can be inspected. No Cloudflare setting was changed.

### VPS-only scanner false-positive prevention

The scanner in scripts/check-vps-only-repository.mjs previously searched Markdown prose for retired-provider names. That would turn required audit history and the master plan into false positives once those documents are integrated, despite no operational dependency being present. A narrow proposed fix is in [PR #76](https://github.com/olegsh247-stack/Crypto/pull/76): provider-reference scanning remains on operational/source/configuration files, while Markdown is reviewed separately as documentation. The PR's VPS API Build Rehearsal completed successfully on its branch; this is CI evidence for that branch only, not a merge or production change.

### Updated disposition

The repository-side target architecture remains self-hosted PostgreSQL + API + Worker + Caddy. The Neon account-level resource is confirmed to exist; its live-runtime relationship remains unknown. Cloudflare dashboard state, GitHub secret names/usage, installed repository Apps, and live public endpoint routing remain external blockers. Hosting audit stays open at Plan 100 step 1. No provider resources, DNS, secrets, production data, or deployment state were changed.


### Verification closure pass — 2026-10-12

This pass closes the checks that can be verified from the repository and available GitHub Actions evidence, while explicitly retaining inaccessible account-level checks as blocked.

**Verified in repository/CI**
- VPS-only scanner fix is present on PR #76 head `c60fc7651292f008ad06c2bb35d313801d7c4cb0`.
- [VPS API Build Rehearsal run #38302522671](https://github.com/olegsh247-stack/Crypto/actions/runs/38302522671) completed successfully. The job passed the VPS-only scan, shared runtime/API/Worker builds, Compose network-boundary validation, disposable PostgreSQL migration bootstrap, BTC source/provenance checks, idempotency/duplicate rehearsal, backup/restore rehearsal, API/Worker E2E contracts, research snapshot lineage, candle finalization, and admin-boundary checks.
- This result is evidence for the PR branch only. It does not mean the fix is merged, the main branch is protected, or production has changed.
- Read-only Neon account inventory confirms a Crypto project, primary production branch and read-write endpoint exist. No SQL was executed; live public API routing to that database is still unknown.

**Not verifiable with the current connected access**
- Cloudflare Workers & Pages projects, GitHub connection, DNS/routes and bindings: dashboard access is unavailable here.
- Repository/environment secret names and usage: the GitHub integration does not expose the secrets API. Secret values must not be shared.
- Installed repository Apps and their repository-specific permissions: the available installation listing does not provide a reliable per-repository integration inventory.
- Current public API → runtime → database routing: no safe, authoritative read-only mapping is available from the inspected repository files.
- `main` branch protection: GitHub rulesets read returned no rulesets, but the branch-protection endpoint returned 403 to this integration. Do not infer that `main` is unprotected from this response.

**Disposition:** repository/CI checks are complete for this pass; the hosting audit as a whole remains `BLOCKED` on provider/account/runtime evidence. No production resources, secrets, DNS, migrations, data, merges, or deployments were changed. Do not remove Neon/Cloudflare resources or claim they are retired until the blocked facts are verified and an approved cutover exists.
