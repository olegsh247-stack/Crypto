# INFRA-BATCH-1 — VPS migration execution plan

Дата: 2026-10-07
Репозиторий: olegsh247-stack/Crypto
Статус: PRE-CUTOVER PREPARATION

## Цель

Подготовить перенос Crypto с Cloudflare Workers + Neon PostgreSQL на один VPS без изменения прикладного контракта и без разрушительного cutover.

Целевой стек: Ubuntu 24.04 LTS, Docker Engine + Compose, PostgreSQL 16, Node.js/TypeScript API, отдельный scheduled worker process, Caddy, GitHub Actions → SSH/deploy. PostgreSQL не публикуется в Internet.

**Важно:** этот batch не выключает и не удаляет Neon/Cloudflare.

## Gate 0 — текущий baseline

Перед началом VPS-работы подтверждено: Release Gate #50 GREEN; clean PostgreSQL bootstrap проходит два последовательных migration runs; Asset Registry / Market Registry / Research / Monitoring contracts проходят CI; ETH и BTC live history E2E проходят; scheduled ingestion и candle idempotency проходят; post-deploy UI runtime E2E проходит; Next.js обновлён до 15.5.27.

Исходная система остаётся rollback source до отдельного cutover decision.

## INFRA-01 — VPS foundation

Требования: 4 vCPU минимум; 8 GB RAM минимум; 100–160 GB NVMe минимум; Ubuntu 24.04 LTS; IPv4; SSH key-only access; firewall: 22/tcp, 80/tcp, 443/tcp; PostgreSQL port 5432 не публиковать; Docker data на persistent storage; регулярные OS/security updates.

Acceptance: Docker работает; Compose работает; disk/RAM/CPU проверены; firewall проверен; SSH password login disabled; PostgreSQL не доступен извне.

## INFRA-02 — Database

PostgreSQL 16 container + persistent volume + dedicated application role + dedicated migration/maintenance role + private Docker network. Existing SQL migrations are reused without schema rewrite.

Restore sequence: full Neon dump → clean PostgreSQL 16 → migration runner → schema/markers → row counts → constraints/indexes → canonical registry → ETH Asset Card → market history.

Acceptance: `DB_RESTORE_OK` only when source/target checks pass.

## INFRA-03 — API runtime

Current runtime dependency is `@neondatabase/serverless` + Cloudflare Worker. Target: standard Node.js HTTP runtime, `pg` PostgreSQL driver, same API routes/response contracts, same `ADMIN_TOKEN` semantics, no Neon-specific runtime dependency.

Rule: extract runtime adapter first; do not rewrite business logic or SQL contracts simultaneously.

Acceptance: `/api/health`, `/api/db-health`, assets, pairs, pair history, research, monitoring, admin mutation protection and full E2E.

## INFRA-04 — Worker

Preserve scheduled ingestion as a normal Node process/container. Requirements: scheduled execution; ingestion remains idempotent; monitoring refresh remains gated by successful ingestion writes; one worker instance in production unless a distributed scheduler/lock is deliberately added.

Acceptance: `INGESTION_E2E_OK` equivalent passes against local PostgreSQL.

## INFRA-05 — Backup / restore

Minimum policy: daily database dump; 7–14 day retention; weekly longer-lived copy; backup stored outside VPS; encrypted backup storage where supported; restore rehearsal before cutover.

Definition: **A backup is not GREEN until a restore has succeeded.**

Acceptance: `BACKUP_RESTORE_OK` with documented dump timestamp, restore timestamp and contract verification result.

## INFRA-06 — Caddy

Caddy terminates HTTPS and proxies only Web/API services. Requirements: production domain fixed before strict CORS; automatic TLS; HTTP → HTTPS redirect; no direct public API container port; health endpoint available through intended public origin.

## INFRA-07 — Secrets

Known repository-level secret dependencies are documented in `docs/SECRET-INVENTORY.md`. Before cutover: inventory every provider secret; rotate secrets tied to obsolete infrastructure; create VPS-specific secrets; verify GitHub Actions deploy credentials; verify API `ADMIN_TOKEN`; verify database credentials. Never put secret values into Git.

## INFRA-08 — CI/CD

Target: `test → build → deploy → migration → health → E2E`.

Preferred deployment sequence: build immutable images; backup current DB; deploy application; apply migrations; run health checks; run API E2E; run UI E2E; mark release healthy.

Rollback: keep previous image, database backup and Neon available; revert API image/config first; restore DB only when schema/data rollback is actually required.

## INFRA-09 — Cutover

Cutover is a separate approval point: freeze writes briefly → final Neon dump → restore/sync to VPS → verify source/target critical counts → switch API/Web origin → full E2E → observe → keep Neon and Cloudflare intact for rollback window.

No decommissioning during first cutover.

## INFRA-10 — Decommission

Only after the agreed rollback window and successful backup/restore: disable old Worker deployment; archive Cloudflare configuration; preserve final Neon backup; remove Neon only after explicit confirmation; remove obsolete secrets only after confirming no workflow uses them.

## Current blocker

The only mandatory account-level blocker before cutover is **SEC-03 secret inventory and rotation** plus the actual VPS/account credentials.

The repository is ready for preparation work; this is not a reason to perform destructive infrastructure changes yet.
