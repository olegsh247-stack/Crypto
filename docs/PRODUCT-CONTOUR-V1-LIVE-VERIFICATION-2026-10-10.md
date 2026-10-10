# Product Contour v1 — live API and Dashboard verification

Date: 2026-10-10  
Working branch: `fix/product-contour-v1-contracts`  
Production API URL supplied for verification: `https://crypto-api.olegsh247.workers.dev`

## Scope

The Dashboard asset page loads each asset through `GET /api/assets/{assetId}`. Its view consumes the asset lifecycle and research freshness, research progress, research blocks/domains, critical factors, scores, monitoring signals, scenarios, sources, evidence, scenario states, monitoring events, market history, and metrics.

The live E2E script now checks the detail payloads for **BTC, ETH, SOL, and CAKE** against the fields used by the Dashboard. ETH retains the stricter published-research checks, including 15 research blocks, six domains, resolved blocks, scenarios, and evidence traceability. Existing health, DB-health, registry, pair, ticker, persisted-history, intraday-history, and repeat-request checks remain in the script.

## Safe execution path

Added `.github/workflows/live-api-e2e.yml`, a manually triggered workflow that runs the live API checks against an existing URL. It **does not deploy** the Worker, update secrets, run migrations, or change DNS. The default URL is the endpoint supplied for this audit; the input can be overridden when necessary.

The existing `Deploy Crypto API` workflow was deliberately not dispatched because it performs a deployment and secret configuration, which is outside this verification-only step.

## Evidence status at commit time

- [x] API contract and Dashboard data consumers inspected.
- [x] E2E assertions added for BTC, ETH, SOL, and CAKE Dashboard detail payloads.
- [x] Separate no-deploy workflow added for executing the live E2E suite.
- [x] Live HTTP responses captured from the Worker; all tested endpoints returned HTTP 200.
- [x] GitHub Actions run completed and logs reviewed: [run #4 — success](https://github.com/olegsh247-stack/Crypto/actions/runs/38061014765).
- [ ] Production Dashboard pages visually/runtime-checked for all four assets.

The live requests could not be executed from the assistant's network environment, and this change alone does not prove that the deployed API passes. The next evidence required is a successful run of **Live API E2E (no deploy)** in GitHub Actions, followed by review of its logs. A passing API payload contract still does not replace a browser-level check of the deployed Dashboard.

## Guardrails

No merge to `main`, production deployment, schema migration, data migration, DNS change, or Cloudflare/Neon decommissioning is included in this step.


## Live run results — 2026-10-10

Run: [Live API E2E (no deploy), run #4](https://github.com/olegsh247-stack/Crypto/actions/runs/38061014765)  
Conclusion: `success`  
Tested deployed endpoint: `https://crypto-api.olegsh247.workers.dev`

HTTP 200 responses were observed for health, DB health, asset registry, details for BTC/ETH/SOL/CAKE, pair registry, BTC/ETH tickers, all nine daily pair histories, BTC 1h/4h histories, BTC/ETH intraday histories, and repeated BTC/ETH daily-history requests. The E2E assertions completed and emitted `E2E_OK`.

### Actual Dashboard detail payload summary

| Asset | Lifecycle | Freshness | Blocks | Domains | Factors | Scores | Scenarios | Signals | Evidence |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| BTC | monitoring | current | 15 | 6 | 6 | 5 | 3 | 7 | 15 |
| ETH | monitoring | current | 15 | 6 | 6 | 5 | 3 | 6 | 15 |
| SOL | not_started | not set | 0 | 6 | 0 | 0 | 0 | 0 | 0 |
| CAKE | not_started | not set | 0 | 6 | 0 | 0 | 0 | 0 | 0 |

The API contract checks pass for all four payloads, but this does **not** mean the four assets have equally complete research. BTC and ETH have populated research data; SOL and CAKE currently return empty research collections with lifecycle `not_started`. This is a product-completeness finding, not an HTTP/API availability failure.

A browser-level inspection of the deployed Dashboard is still pending because the deployed Web URL has not yet been identified from the repository configuration. No production deployment or merge was performed during this verification.


## Release gate diagnosis — 2026-10-11

### Confirmed failure

[Crypto Release Gate #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38054710056) ran against `main` at `b86d91d`, not the working branch. Its database migration/contract gate passed, including clean-database bootstrap rehearsal. The Web build then failed TypeScript checking in `web/app/assets/[assetId]/page.tsx:210` with `Cannot find name 'confidence'`. The UI runtime and Worker/live E2E jobs were skipped as a consequence of the failed Web build.

### Working-branch comparison

The current file retrieved from `fix/product-contour-v1-contracts` uses the declared `confidenceScore` variable in the Confidence card; the exact undeclared `confidence` reference reported by #121 is not present in that retrieved version. This is evidence that #121 is stale relative to the working-branch page, **not** evidence that the working branch currently passes a production build.

The latest confirmed Product Contour Gate and VPS API Build Rehearsal successes found in the Actions history are both on older commit `99fecfa` ([Contour Gate #211](https://github.com/olegsh247-stack/Crypto/actions/runs/38054184666), [Build Rehearsal #237](https://github.com/olegsh247-stack/Crypto/actions/runs/38054184377)). The successful Live API E2E #4 is on `06562d4` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38061014765)). None of these results proves that the latest working-branch head passes the full Web/runtime gate.

### Release-gate status and next action

- [x] Identify why Release Gate #121 failed.
- [x] Compare the failing line with the working-branch page.
- [ ] Obtain a fresh Web build and Product Contour/runtime validation on the current working-branch head.
- [ ] Identify the deployed Web URL and complete browser-level runtime verification; no URL is assumed or invented.
- [ ] Only after those checks, finalize the Product Contour v1 acceptance decision and proceed to one complete BTC scenario.

No production deployment, production migration, DB write, PR merge, VPS provisioning, or cloud-provider removal was performed for this diagnosis. The unrelated CAKE Transfer Log Reconciliation failures remain attributable to public BSC RPC access/rate limits and are not treated as Product Contour gate results.
