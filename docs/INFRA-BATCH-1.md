# INFRA-BATCH-1 — self-hosted VPS execution plan

Updated: 2026-10-12
Status: ACTIVE — PRIORITY 1

## Target

Ubuntu 24.04 LTS, Docker Engine + Compose, PostgreSQL 16, Node.js/TypeScript API, separate scheduled worker process, Caddy HTTPS, GitHub Actions CI/CD, private database network, and encrypted off-host backups.

## INFRA-01 — VPS foundation

Minimum target: 4 vCPU, 8 GB RAM, 100–160 GB NVMe, IPv4, key-only SSH, firewall limited to SSH/HTTP/HTTPS, and persistent storage. PostgreSQL must not be publicly exposed.

Acceptance: host hardening, firewall, Docker/Compose, storage and resource checks pass.

## INFRA-02 — PostgreSQL

Use the canonical schema and ordered migrations under `infrastructure/postgres/`. The application role and migration/maintenance role must be separate. Run the migration runner twice on a clean PostgreSQL 16 instance.

Acceptance: no duplicate migration markers; required tables, constraints, indexes, registries and API contracts pass.

## INFRA-03 — API runtime

Use `vps/api` and the standard PostgreSQL pool in `vps/shared`. Preserve routes, response shapes, authorization, research lifecycle/freshness, history and monitoring contracts.

Acceptance: health, database health, registry, history, research, monitoring, evidence, admin boundaries and full BTC scenario E2E pass.

## INFRA-04 — Worker

Run `vps/worker` as a separate process/container. Keep UTC scheduling, idempotent candle upserts, monitoring refresh gated by successful ingestion, and a single production scheduler.

Acceptance: two consecutive disposable-database runs, fresh history, zero duplicate natural keys, no unintended monitoring refresh.

## INFRA-05 — Backups

Daily dump, 7–14 day retention, off-host encrypted copy, checksum verification, and periodic restore rehearsal.

Acceptance: restore into a clean database and compare table counts and core contracts.

## INFRA-06 — HTTPS and network

Caddy terminates TLS and proxies to private API services. Only ports 80/443 are public; database/API/worker ports remain private.

## INFRA-07 — Secrets

Keep values out of Git. Use least-privilege credentials, rotate the admin token before cutover, and create deployment credentials only when the host exists.

## INFRA-08 — CI/CD

The release gate must test the VPS target against disposable PostgreSQL only. The future deploy sequence is: build immutable image → backup → deploy → migrate → health → API E2E → UI E2E → release healthy.

## INFRA-09 — Cutover

After host purchase: freeze writes briefly, take a final source dump, restore to PostgreSQL 16, compare schema/data/contracts, verify API and BTC scenario, then switch the public route only after explicit approval.

## INFRA-10 — Final removal

After acceptance and the agreed rollback window, remove all remaining legacy runtime source, configuration, workflows, secret references, docs, and URLs. The final repository must contain zero mentions of retired platforms.
