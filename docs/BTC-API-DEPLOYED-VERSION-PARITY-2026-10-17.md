# BTC Deployed API Version-Parity Gate — 2026-10-17

## Purpose and safety boundary

This gate checks whether the deployed API implementation can be tied to the reviewed repository source before a BTC source calculation is accepted. This is an evidence/documentation change only. It does not query the production API, access a database, change runtime code, deploy, or alter scenario state.

## Repository inspection

Reviewed current `main` source:

- `vps/api/src/app.ts` implements `GET /api/health` as `{ status: "ok", service: "crypto-api" }` after checking that `DATABASE_URL` is configured.
- The health response does not expose an API version, source commit SHA, build ID, image digest, or deployment ID.
- `GET /api/db-health` executes `select now()` and is therefore not required for version parity.
- `GET /api/assets/btc` reads database-backed application data and cannot establish which exact source commit produced the response.
- `docs/VPS-PRODUCTION-DEPLOYMENT.md` says the VPS skeleton is prepared, not deployed; no VPS cutover has been established by that document.

## Decision

**Version parity remains BLOCKED / NOT PROVEN.** A successful health response only proves that some service answers the health contract. It does not prove that the running implementation matches the source reviewed for BTC calculations.

Do not infer deployed version from `api_version` in a sample API payload, a Git commit on `main`, a successful build rehearsal, or the existence of a legacy Worker URL. Those are not deployment attestations.

## Evidence required to close the gate

1. Identify the actual deployment target and operator/provider that owns it; distinguish the legacy Worker endpoint from the future VPS target.
2. Obtain provider-side deployment metadata for the running target: deployed commit SHA or immutable artifact/image digest, deployment timestamp, and target/environment identity.
3. Compare that identity with the reviewed commit and build provenance. If the platform cannot expose reliable metadata, a later explicitly approved implementation change may add a non-sensitive build identity to a safe health endpoint; do not make that runtime change as part of this documentation-only step.
4. Verify the fee/subsidy parser/calculation version and source implementation are included in that same immutable build.
5. Record the evidence URL/ID and comparison result in this document and `PROMPT-100-JOURNAL.md`.

## Acceptance status

- Repository health-handler behavior inspected: **confirmed**.
- Public/deployed API version identity: **not established**.
- Repository-to-deployment commit parity: **not established**.
- Production API/DB queried in this step: **no**.
- Runtime/registry/deployment changed: **no**.
- BTC status: remains **`not_evaluable`** until this and all other mandatory gates pass.
