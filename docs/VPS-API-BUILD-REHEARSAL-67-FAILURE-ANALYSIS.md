# VPS API Build Rehearsal #67 — Failure Analysis

**Date:** 2026-10-09  
**Run:** [VPS API Build Rehearsal #67](https://github.com/olegsh247-stack/Crypto/actions/runs/37987370004)  
**Commit tested:** `212227b1b061318609b74857e6d92841e33ab47f)  
**Branch:** `fix/product-contour-v1-contracts`

## Finding

The rehearsal failed at the first registry assertion in `VPS API contract E2E`, with:

```text
AssertionError: assets=0
```

The failure is in the **test's response-shape parsing**, not in the TypeScript build or PostgreSQL bootstrap.

The VPS API's `GET /api/assets` handler returns an object shaped as `{ api_version, assets: [...], count, max_assets }`. The workflow test only attempted `assets.items` and then treated the response itself as an array. Since the response is an object with an `assets` field, the test incorrectly derived an empty list and failed before checking the real asset count. The API implementation is in `vps/api/src/app.ts`.

## What passed in run #67

- VPS shared runtime, Worker and Node API TypeScript builds.
- PostgreSQL 16 startup.
- Clean database bootstrap and a second migration-run/idempotency check: 16 migration markers, no duplicate markers.
- Node API health and database health checks.

## What did not run

Because the registry assertion failed, the ETH detail/history checks, live Worker parity, mutation contract, worker ingestion and admin-boundary E2E steps were skipped. They remain unverified by this run.

## Correction

Update the workflow contract test to read the documented `assets` property first, while retaining compatible handling for `items` or a bare array only where those shapes are actually returned. Keep the exact expected registry count and enabled-pair assertions so this fix does not weaken validation.

Then rerun the VPS rehearsal on the PR head. A pass must be observed in GitHub Actions; changing the test alone is not evidence of success.

## Safety / scope

The failed run used a disposable PostgreSQL 16 container and local test credentials. No production database write, migration, deployment, VPS provisioning or PR merge was performed.
