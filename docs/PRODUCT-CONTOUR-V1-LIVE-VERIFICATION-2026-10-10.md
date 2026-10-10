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
- [ ] Live HTTP responses captured from the Worker.
- [ ] GitHub Actions run completed and logs reviewed.
- [ ] Production Dashboard pages visually/runtime-checked for all four assets.

The live requests could not be executed from the assistant's network environment, and this change alone does not prove that the deployed API passes. The next evidence required is a successful run of **Live API E2E (no deploy)** in GitHub Actions, followed by review of its logs. A passing API payload contract still does not replace a browser-level check of the deployed Dashboard.

## Guardrails

No merge to `main`, production deployment, schema migration, data migration, DNS change, or Cloudflare/Neon decommissioning is included in this step.
