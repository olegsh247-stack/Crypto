# API/Web Response Contract Fix — 2026-10-12

## Scope

This branch aligns the Web asset-detail response types with the existing VPS API payload and adds contract checks. It does not change the API runtime payload, source selection, research calculations, scenario rules, or persistence behavior.

## Changes

- `AssetDetailResponse.research_progress` now declares `status`, `completed`, `resolved`, `total`, and `percentage` to match `calculateResearchStatus()`.
- Added the optional BTC `scenario_readiness` response type. Its persistence capability is a literal `false`; the shape does not authorize scenario-state writes.
- Added `snapshot_id` to the `ResearchScenario` type to expose snapshot lineage already returned by the API.
- Added an API runtime test asserting the exact research-progress response keys and values.
- Added a Web compile-time fixture so the strict TypeScript build checks the corresponding client types.
- Added a focused GitHub Actions workflow to run the API test and Web build for contract-related changes.

## Validation boundary

The checks are configured in GitHub Actions but must be observed on this PR before calling the patch validated. CI will build/test against repository code and an isolated runner; it is not a live public API or production deployment test.

No database changes, migrations, production writes, UI redesign, deployment, or merge are included.
