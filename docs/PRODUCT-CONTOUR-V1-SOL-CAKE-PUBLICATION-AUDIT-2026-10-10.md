# Product Contour v1 — SOL/CAKE publication and web-runtime audit

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Reconcile live asset-detail payloads with the canonical research artifacts, UI behavior, and available web-hosting evidence.  
**Safety:** Read-only audit. No database writes, migrations, deploys, DNS changes, or merge to `main`.

## Executive result

The live API contract is healthy for BTC, ETH, SOL, and CAKE, but SOL and CAKE are **not yet publishable research assets in the application**. Their Markdown research files are expressly draft source artifacts, and the live detail payloads have no published snapshot, no research blocks, no critical factors, no scores, no scenarios, no monitoring signals, and no evidence. The correct next step is to close evidence gaps and publish only after a documented review—not to force lifecycle status to `monitoring` or populate dashboard sections with placeholder analysis.

The API's six domain records for SOL/CAKE are taxonomy/structure, not proof that those domains have completed asset-specific research.

## Evidence

### 1. Live API payload status

From the successful Live API E2E run documented in [the live verification report](./PRODUCT-CONTOUR-V1-LIVE-VERIFICATION-2026-10-10.md):

| Asset | Lifecycle | Freshness | Research blocks | Domains | Factors | Scores | Scenarios | Signals | Evidence |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| BTC | monitoring | current | 15 | 6 | 6 | 5 | 3 | 7 | 15 |
| ETH | monitoring | current | 15 | 6 | 6 | 5 | 3 | 6 | 15 |
| SOL | not_started | null | 0 | 6 | 0 | 0 | 0 | 0 | 0 |
| CAKE | not_started | null | 0 | 6 | 0 | 0 | 0 | 0 | 0 |

The endpoint and response shape passed HTTP/E2E checks. This is contract availability, not evidence completeness.

### 2. Research artifacts are explicitly drafts

- `research/assets/SOL/SOL-RESEARCH-01-15.md` says: **“Draft source artifact only. Not published as a Research Snapshot in Neon.”** It calls for refreshed and evidence-linked live network, supply, validator, and ecosystem metrics before publication.
- `research/assets/CAKE/CAKE-RESEARCH-01-15.md` says: **“Draft source artifact only. Not published as a Research Snapshot in Neon.”** It calls for refreshed supply, fees, volume, liquidity, chain distribution, and burn/emission metrics before publication.
- `research/assets/SOL-CAKE-EVIDENCE-GAP-MATRIX-2026-10-09.md` marks material blocks Partial or Incomplete and says no block should be marked N/A merely to reach 15/15.
- `research/assets/SOL-CAKE-DATA-UPDATE-2026-10-09.md` says the refresh does not close publication gaps and does not authorize scores, scenario state, monitoring events, or Neon writes.
- `research/assets/SOL-CAKE-ONCHAIN-CAPTURE-2026-10-09.md` contains useful block-pinned raw observations, but also flags methodology caveats and unresolved CAKE supply discrepancies. A raw capture does not, by itself, approve a canonical circulating-supply value.

Therefore, the zero research-content counts in the live payload are consistent with the documented publication policy. They should not be “fixed” by seeding unreviewed draft content into the production snapshot tables.

### 3. Dashboard contract behavior

The asset detail page (`web/app/assets/[assetId]/page.tsx`) reads the published snapshot, research blocks, domains, factors, scores, scenarios, monitoring, sources and evidence from the API. It normalizes missing blocks and calculates displayed research progress from the returned block collection. This is compatible with an unresearched asset: a missing snapshot and zero resolved blocks should remain an explicit not-started state.

Potential presentation risk to keep in mind during browser verification: six domain definitions can appear alongside zero completed blocks. The UI should make clear that these are available research domains, not six completed domains. This is a verification point, not a claim that a visual defect has already been observed.

### 4. Dashboard deployment/runtime remains unverified

- `.github/workflows/web-build.yml` is a build-only reusable/manual workflow. It installs dependencies and runs `npm run build`; it does not deploy the web app.
- The connected Vercel deployment list returned no deployments for app names `Crypto` or `crypto-web`, and the previously checked project list did not contain a Crypto project.
- This only establishes that a Crypto web deployment was not found in the available Vercel account/listing. It does not prove that no deployment exists under another account/provider or a different project name.
- The API Worker is deployed and its live HTTP E2E passed, but this does not establish that the Next.js Dashboard is deployed or that its pages render in a real browser.

## Decisions

1. Keep SOL and CAKE lifecycle at `not_started` until reviewed, evidence-linked research is published.
2. Do not add made-up scores, scenarios, signals, or evidence merely to fill dashboard cards.
3. Preserve the current API/UI contract and continue to treat the research Markdown as draft input, not a database publication manifest.
4. Before the final browser-level Dashboard check, identify the intended web hosting target and URL. Do not deploy, alter DNS, or change hosting architecture as part of this audit.
5. The next research step is a source-by-source evidence closure pass for SOL and CAKE, prioritized by the blockers in the evidence-gap matrix; then review publication readiness before any database write.

## Acceptance criteria for the next research phase

- Every claimed metric has a source, retrieval timestamp, units, methodology, and asset/network scope.
- Primary/on-chain data is reconciled with third-party dashboards where definitions differ; unresolved discrepancies remain explicit.
- All 15 Structure 1 blocks are individually marked complete, partial, not applicable with justification, or not started. Coverage is not equated with completeness.
- Scores include methodology version, explanation, confidence, and traceable evidence.
- Bull/base/bear scenarios have explicit assumptions, measurable invalidation criteria, and evidence lineage.
- Monitoring signals have baseline values, source lineage, thresholds/cadence, and a clear relationship to critical factors.
- Publication to Neon occurs only after review and an explicitly authorized write step.

## Non-actions

No production database write, migration, deployment, DNS change, secret update, UI redesign, PR merge, or change to `main` was performed.
