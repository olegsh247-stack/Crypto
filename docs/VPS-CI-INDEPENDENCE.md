# VPS CI independence from Cloudflare

## Decision

The VPS Build Rehearsal must be self-contained. It must not call the live Cloudflare Worker to decide whether the VPS implementation passes CI. Production availability, live data freshness, or a legacy Worker contract must not make an isolated PostgreSQL/API build flaky or block the planned retirement of Cloudflare.

## Verification retained

The workflow uses a disposable PostgreSQL 16 instance and repository migrations. It verifies:

- VPS shared runtime, Worker, and API builds;
- repeatable migration bootstrap;
- registry and asset lifecycle API contracts;
- authenticated mutation boundaries;
- Worker ingestion idempotency against the disposable database;
- API history and daily-candle finalization;
- admin authorization boundaries;
- health, database health, BTC response shape, and history response shape.

The former live parity script compared the VPS API with `https://crypto-api.olegsh247.workers.dev`. That check was removed because it made CI depend on Cloudflare and on live production data. Its stable behavior checks are covered by local contract/E2E assertions instead.

## Scope and safety

This is a CI-only change. It does not deploy the VPS, alter Cloudflare, modify Neon, run production ingestion, change secrets, or migrate production data. Cloudflare and Neon remain the current production path until a separate, verified data migration and explicit cutover.
