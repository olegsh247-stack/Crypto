# VPS API Build Rehearsal #67 — Failure Analysis

**Date:** 2026-10-09  
**Run:** [VPS API Build Rehearsal #67](https://github.com/olegsh247-stack/Crypto/actions/runs/37987370004)  
**Commit tested:** `212227b1b061318609b74857e6d92841e33ab47f`  
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

### Follow-up finding from run #70

The first parser correction exposed a second stale expectation: the actual canonical registry contains **10 enabled assets**, not 9. This is intentional: the registry includes `usdt` as the system quote asset, while the worker's market-data ingestion set remains the nine non-USDT research assets. The canonical registry finalization migration explicitly seeds BTC, DASH, ETH, SOL, CAKE, BCH, LTC, XRP, TRX and USDT.

Run #70 therefore failed with `AssertionError: assets=10` after correctly reading the `assets` property. The workflow contract now expects 10 and asserts the exact canonical asset-ID set; the existing pair count remains 9. This preserves the distinction between the registry and the research/ingestion universe instead of excluding USDT from the API response.

### Follow-up finding from run #71

After correcting the registry count, run #71 passed the registry checks (`assets=10`, `pairs=9`) and the ETH detail/lifecycle/freshness checks. It then failed because the history endpoint returned HTTP 503 on the clean database before the scheduled worker had ingested market candles.

This is an ordering defect in the rehearsal: persisted history is correctly unavailable on a newly bootstrapped empty database, but the test demanded history before running the worker. The workflow now checks the persisted history endpoint **after the first successful worker ingestion** and its assertion that market-candle rows increased. This tests the intended end-to-end lifecycle without adding fake market rows to migrations or weakening the history assertion.

Then rerun the VPS rehearsal on the PR head. A pass must be observed in GitHub Actions; changing the test alone is not evidence of success.

## Safety / scope

The failed run used a disposable PostgreSQL 16 container and local test credentials. No production database write, migration, deployment, VPS provisioning or PR merge was performed.
