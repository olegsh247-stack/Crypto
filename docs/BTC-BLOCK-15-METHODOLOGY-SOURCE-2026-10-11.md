# BTC block 15 — internal methodology source classification

**Snapshot:** `BTC-2026-10-07-v1`  
**Scope:** source classification for the existing block 15 monitoring-chain statement only.

## Finding

The block 15 statement says that monitoring connects data, metrics, signals, assessment, confidence, thesis impact and status. This describes Crypto's own research/monitoring method. A Bitcoin development page is not an appropriate source for a claim about Crypto's internal methodology.

## Decision

- Keep the existing published snapshot, claim text, observation value, as-of timestamp, status, freshness, confidence and scenario definitions unchanged.
- Change only the source identity/URL to the project's own `docs/RESEARCH_METHOD.md` artifact, using the source type `internal_methodology`.
- Preserve the existing Evidence row and its relationship to the observation; update its source ID to follow the observation.
- Do not represent this row as evidence that Bitcoin has a particular market, protocol or economic property. It documents the methodology used by this product.
- Do not create scenario links from this row. It does not support Base, Bull or Bear.
- The migration is additive/idempotent and must be tested on disposable PostgreSQL before any separately authorized production rollout.

## Why no row deletion or timestamp refresh

The snapshot is already published. Deleting the Evidence row would silently rewrite the published record; changing its observation timestamp would falsely imply the methodology statement was newly observed. Source provenance is corrected while the original as-of and assessment remain intact.

## Acceptance

1. Clean database bootstrap and migration idempotency pass.
2. The API still exposes the same BTC snapshot and 15-block contour.
3. Only the reviewed source metadata differs between the currently deployed Worker and the VPS rehearsal until a separately approved rollout.
4. The source registry exposes the internal methodology source on the VPS.
5. No production DB, deployment, or scenario-state row is changed by this repository commit.
