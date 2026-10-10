# Product Contour v1 — Evidence-Based Readiness Audit

**Date:** 2026-10-09  
**Branch:** `fix/product-contour-v1-contracts`  
**Scope:** Source structure, existing test evidence, documented read-only API data status and readiness gaps.  
**Not performed by this audit:** production database writes, migrations, deployment, visual redesign, PR merge, VPS purchase/provisioning.

## Executive verdict

**Product Contour v1 is structurally implemented and its latest recorded Product Contour Gate passed, but the product is not yet complete end-to-end.**

The gate passed on 9 October 2026: [Product Contour Gate #29](https://github.com/olegsh247-stack/Crypto/actions/runs/37982436267). Its two jobs completed successfully:
- Web build + read-only UI/API contract/runtime E2E;
- all migrations run twice against a disposable PostgreSQL 16 database, including clean bootstrap/idempotency checks.

This validates the code/test paths exercised by that gate. It does **not** prove the VPS target is equivalent, that every asset has complete data, or that a dated scenario-state assessment exists.

## Product contour matrix

| Block | Current implementation | Data / verification evidence | Status | Remaining work |
|---|---|---|---|---|
| Home | `web/app/page.tsx`; product overview and asset registry entry | Included in passing UI runtime contract E2E | Implemented | Keep registry counts/status API-derived; no design changes |
| Assets | Dynamic registry embedded at `/#assets`; asset detail at `/assets/{assetId}` | Runtime contract checks exercise the registry and asset routes | Implemented with route clarification | No separate `/assets` list route; this matches the current v1 contract |
| Asset Dashboard | `web/app/assets/[assetId]/page.tsx`; consumes Dynamic Asset Engine response | UI runtime E2E passed; contract audit documents current snapshot scoping corrections | Implemented; data-lineage checks remain important | Keep current view scoped to latest published snapshot |
| Deep Research | `/research` and `/assets/{assetId}/research`; canonical 15 blocks | Runtime E2E checks canonical ETH headings; BTC/ETH have 15/15 resolved blocks in latest recorded data snapshot | Implemented; coverage varies by asset | Preserve explicit missing/partial/N/A states |
| Domains | Data-driven domain records and mapped research blocks | Latest recorded counts: BTC 6, ETH 6; SOL/CAKE none | Implemented; asset coverage partial | Verify domain-to-snapshot lineage on the selected asset |
| Factors | Critical factors from API and Dashboard | Latest recorded counts: BTC 6, ETH 6; SOL/CAKE none | Implemented; lineage is a critical contract | Factors must belong to the currently published snapshot |
| Scores | Score records and Dashboard cards | Latest recorded counts: BTC 5, ETH 5; SOL/CAKE none | Implemented; lineage is a critical contract | Display score value separately from confidence metadata; retain method/version and rationale |
| Scenarios | Published Bull/Base/Bear definitions and separate runtime state collection | Latest recorded definitions: BTC 3, ETH 3; scenario-state rows: 0 for both | Partially complete as a decision workflow | Perform a dated, evidence-backed scenario-state evaluation for the chosen asset; do not auto-create states merely by publishing a snapshot |
| Monitoring | Signals, freshness and event history | Latest recorded signals: BTC 7, ETH 6; events: 0 | Implemented; operational history not populated | Keep events empty until a real configured trigger occurs; prove scheduled refresh on target runtime |
| Evidence | Evidence rows, sources and source URLs | Latest recorded evidence rows: BTC 15, ETH 15; rows with source URL: 15 each | Implemented for BTC/ETH; coverage varies by asset | Validate evidence/source lineage and provenance on the selected asset |

## Asset readiness

| Asset | Published snapshot | Research blocks resolved | Domains | Factors | Scores | Scenario definitions | Scenario states | Signals | Events | Evidence |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| BTC | `BTC-2026-10-07-v1` | 15/15 | 6 | 6 | 5 | 3 | 0 | 7 | 0 | 15 |
| ETH | `ETH-2026-10-04-v1` | 15/15 | 6 | 6 | 5 | 3 | 0 | 6 | 0 | 15 |
| SOL | None | 0/15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CAKE | None | 0/15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Counts are from the repository's latest recorded read-only API audit, not newly queried production database rows in this documentation update. SOL/CAKE research files and source captures are drafts only; they are not published database snapshots.

## Cross-cutting contract findings

The source-level contract audit identified the following areas that must remain explicit acceptance criteria:

1. **Research lifecycle/progress:** resolved blocks mean `complete + n_a`; completed blocks are a separate count. The current PR corrects Web/server alignment.
2. **Snapshot lineage:** factors and scores must be scoped to the latest published snapshot, not mixed across asset history.
3. **Scenario lineage:** scenario definitions and runtime states are separate concepts. A state must not be merged into a definition unless the relationship and snapshot lineage are proven.
4. **Evidence/source registry:** sources referenced directly by evidence must remain discoverable, with a valid URL preserved from source/observation data.
5. **Freshness contract:** list/detail API responses must preserve the same status and optional review timestamps.
6. **Monitoring semantics:** zero events is valid before a configured trigger occurs; do not fabricate events to make the UI look populated.
7. **Publication semantics:** publishing a research snapshot does not automatically create a scenario state or a monitoring event.

The latest Product Contour Gate passed on the code commit preceding this documentation-only commit. This provides build/runtime and disposable-migration evidence for that code baseline, but no new gate is claimed for the current documentation commit.

## Hosting/portability status

The self-hosted target decision is recorded in [Hosting Architecture Decision](./ARCHITECTURE-DECISION-SELF-HOSTED.md).

The Node API/worker and PostgreSQL rehearsal profile already exist under `vps/`, but they are not yet accepted as the production runtime. The local Compose profile lacks the Next.js Web service and reverse proxy/TLS layer, and the available VPS build workflow must be shown passing against the current code. Product Contour acceptance on the current Worker does not imply API/worker parity on Node.

No Cloudflare/Neon runtime dependency has been removed in this audit. The current release path remains the compatibility baseline until the self-hosted path passes its own parity and E2E checks.

## Priority order

### P0 — Close the hosting architecture audit
- Inventory all Worker/Neon/Wrangler-specific runtime and deployment dependencies.
- Compare the current Worker API with `vps/api` and scheduled ingestion with `vps/worker`.
- Add Web + reverse proxy/TLS to the target topology plan; keep PostgreSQL private and secrets external.
- Verify the VPS build/rehearsal workflow's latest result. Do not buy/provision a server yet.

### P1 — Define the single-asset acceptance fixture
Use **ETH** as the first end-to-end product asset because it already has a published 15/15 research snapshot, domains, factors, scores, scenario definitions, monitoring signals and evidence. Keep BTC as a comparison/regression asset.

Acceptance should verify, on one consistent published snapshot:
- dashboard and 15-block research view;
- factors and scores with explanations/methodology and correct snapshot lineage;
- Bull/Base/Bear definitions;
- one dated scenario-state assessment with rationale, evidence and snapshot lineage;
- monitoring signals/freshness;
- evidence and source URLs;
- no fabricated monitoring events when no trigger occurred.

### P2 — Fix only confirmed blockers
Batch fixes by shared contract/root cause. Do not repeatedly tweak wording or visual design. Every code patch must be followed by build, API/UI contract tests and relevant database rehearsal.

### P3 — Expand research only after acceptance
Resume SOL/CAKE publication work only after the ETH vertical slice passes. Draft research remains draft until evidence gaps, metric definitions and publication approval are resolved.

## Latest verification update — 2026-10-09

Fresh read-only preflight against the live Worker and VPS Node API matched published ETH snapshot `ETH-2026-10-04-v1` and all checked collection counts: blocks 15, domains 6, factors 6, scores 5, evidence 15, signals 6, events 0, scenario definitions 3, scenario states 0. The live Worker response does not expose definition-level snapshot lineage, while the VPS response does; the preflight records this limitation explicitly. A disposable PostgreSQL transaction inserted an evidence-linked candidate scenario-state row and verified rollback left zero rows.

## Acceptance decision

- **Source structure:** present for all ten Product Contour blocks.
- **Current code gate:** Product Contour Gate #81 passed after factor/score lineage checks and the evidence-bearing rollback fixture; [run details](https://github.com/olegsh247-stack/Crypto/actions/runs/38032000436). VPS API Build Rehearsal #112 also passed on the same code commit; [run details](https://github.com/olegsh247-stack/Crypto/actions/runs/38032000250). Later commits only update research/audit documentation; their own Actions runs are still being checked.
- **Research coverage:** BTC/ETH have published baselines; SOL/CAKE are not yet published.
- **End-to-end decision workflow:** runtime contracts, ETH snapshot preflight and disposable scenario-state rollback are verified; the product assessment is not complete because BTC/ETH still have no recorded scenario-state assessments and the ETH trend-evidence set remains incomplete.
- **Self-hosted runtime:** Node API + Worker builds, clean PostgreSQL 16 bootstrap, migration idempotency, 9-asset ingestion, history, seven-endpoint Worker/VPS parity and admin boundary passed in CI. Production topology is still not accepted or deployed; no VPS has been provisioned.
- **Release/merge:** not authorized by this audit. PR #3 remains draft; no production migration, deployment, or data mutation was performed.

## Follow-up correction — monitoring freshness semantics (2026-10-10)

A review of the actual Worker and VPS scheduler found a confirmed freshness-contract defect: after successfully ingesting market candles, both runtimes updated every enabled `monitoring_signals.last_updated_at` to `now()` without recalculating `current_value`, `previous_value`, direction, or threshold status. That made a recent worker run look like a fresh signal evaluation even though the signal itself had not changed.

The correction removes that timestamp update from both schedulers. Candle ingestion now updates market history only; the existing research-review expiry check remains separate. Signal timestamps must not advance until a real signal-evaluation path updates the signal values. The VPS rehearsal assertion was changed accordingly: two idempotent ingestion runs must leave monitoring-signal timestamps unchanged.

This is a product correctness fix, not a monitoring feature completion. The current signals still lack a complete numeric metric/evaluation path, so ETH scenario-state publication remains blocked. No production data was written and no monitoring event was created. Product Contour Gate and VPS API Build Rehearsal must pass on the resulting branch head before this correction is accepted.
