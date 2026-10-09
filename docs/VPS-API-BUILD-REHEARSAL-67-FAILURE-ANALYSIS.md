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

### Follow-up finding from run #73

The registry and ETH-detail checks now pass. The moved history assertion is positioned after worker ingestion, but run #73 stopped earlier at `VPS API parity against live Worker` on `/api/pairs`.

The parity projection initially included each pair's database-generated `id`, which cannot be expected to match between the live database and a clean disposable database. Diagnostic output from run #77 exposed the concrete patch defect: the ID field had been removed from the live projection but accidentally remained in the VPS projection because the source contained two separate projections on one line and the first replacement changed only one occurrence. The parity script now omits the generated ID on both sides, while retaining all stable pair identity fields. The diagnostic payload remains enabled for future mismatches.

### Follow-up finding from run #79 — real VPS API contract defect

After fixing the pair projection symmetrically, the registry and pair parity checks passed. The next assertion found a real discrepancy: VPS scenario definitions were queried without selecting `snapshot_id`, so the API response could not prove which published baseline each definition belonged to. In addition, VPS `scenario_states` were queried by asset only, rather than being scoped to the latest published snapshot as the Worker API does.

The Node API query now includes `snapshot_id` in scenario definitions and filters runtime states to the latest published snapshot. This restores the intended lineage contract; it does not write or change database rows. The next rehearsal must verify the correction and may reveal further parity gaps.

### Follow-up finding from run #83 — external image-pull limit

Run #83 did not reach the API tests. The PostgreSQL container startup failed with Docker Hub's unauthenticated pull-rate-limit response (`toomanyrequests`). This is a CI image-fetch limitation, not a migration or application failure.

Both workflows use the public Amazon ECR mirror for the standard PostgreSQL 16 image. Run #90 showed that concurrent pulls can be throttled (`toomanyrequests: Rate exceeded`), so each workflow now explicitly pulls the image with bounded backoff (10, 20 and 30 seconds) before starting the disposable database. The next run must validate the retry path, clean bootstrap and migration idempotency end-to-end.

### Follow-up finding from run #84 — live Worker rollout boundary

With PostgreSQL startup working again, the rehearsal passed registry and pair parity, then reported that the live Worker response's ETH scenario definition did not contain `snapshot_id`. The branch's Worker source includes this field, but the currently deployed Worker endpoint still serves the older response shape. Production deployment is not authorized in this task, so the test must not require a production rollout just to validate the Node target.

The parity contract now compares the common scenario-definition fields between live Worker and VPS, while requiring the VPS API's scenario definitions and any scenario states to carry the latest published `snapshot_id`. If the live Worker supplies a lineage value, it must still match its own latest published snapshot. This keeps the compatibility comparison honest and validates the new VPS lineage contract without deploying to production.

### Follow-up finding from run #85 — history parity ordering

Run #85 passed health, registry, pair and ETH/BTC detail parity, including the revised scenario-lineage contract. It then failed when the parity script called persisted ETH market history: the disposable VPS database had not yet received candle rows, so its history endpoint correctly returned HTTP 503.

The VPS rehearsal now runs market-data ingestion before Worker/VPS parity. The existing worker E2E remains responsible for proving that ingestion added fresh rows. Runs #86/#87 failed before reaching the history check: the worker emitted a valid success result (`successful=9`, `written=72`), but the workflow's `grep -Eo` pattern over-escaped JSON braces, so the result variable was empty and `test -n` terminated the step. The regex now uses a single escape for each brace. The explicit HTTP-status/body diagnostic remains in place for the history check, and Worker/VPS parity remains after ingestion to independently validate the history endpoint. This avoids seeding fabricated market data into the database migrations.

Because parity failed before the remaining steps, mutation, worker-ingestion/history and admin-boundary E2E are still pending verification.

Then rerun the VPS rehearsal on the PR head. A pass must be observed in GitHub Actions; changing the test alone is not evidence of success.

## Safety / scope

The failed run used a disposable PostgreSQL 16 container and local test credentials. No production database write, migration, deployment, VPS provisioning or PR merge was performed.
