# BTC Monitoring Readiness Matrix v1

Status: research baseline only; **not ready for live evaluation or event persistence**  
Snapshot: `BTC-2026-10-07-v1`  
Last read-only input audit: 2026-10-12

## Purpose and boundary

This matrix connects the published BTC Base/Bull/Bear research definitions and six critical factors to the observations needed for an auditable monitoring chain. It is not a trading signal, and it does not authorize scenario-state or monitoring-event writes.

The currently published scenario probabilities remain authored research judgments: Base 50%, Bull 30%, Bear 20%. The directional-rule prototype is offline-only and is not an acceptance criterion for Product Contour v1.

## Current verified baseline

- The published snapshot has 15 complete research blocks, 6 critical factors, 5 scores, 3 scenario definitions and 15 evidence records.
- The VPS API now exposes evidence with snapshot, block, observation/metric and source provenance; its disposable-PostgreSQL E2E checks verify that the evidence covers all 15 blocks and stays within the active snapshot.
- The API and clean migration seed do not create a scenario-state evaluation or monitoring event. The UI must continue to describe Base as a published baseline.
- The 7 monitoring signals in the seed are descriptive baselines, not live measured values; their current values are objects containing descriptions.
- The last read-only data audit found stale spot-price, hashrate, circulating-supply, subsidy and ETF-flow observations; nine duplicate logical-key groups; and two rows without source URLs. Those rows were not rewritten.
- The source review dated 2026-10-12 proposed candidate values only; no candidate values were inserted into the database.

## Factor-to-monitoring matrix

| Critical factor | Evidence / candidate input contract | Confirmation condition | Invalidation / escalation condition | Readiness |
|---|---|---|---|---|
| Monetary Demand | Canonical USD spot price plus distinct daily US spot BTC ETF flows; retain source, observed time, UTC window, revision and freshness | Sustained monetary demand consistent with the published thesis | Sustained loss of monetary demand | Blocked: current observation freshness/provenance audit must be repaired; quantitative duration/threshold is not approved |
| Institutional Allocation | At least 5 distinct recent ETF-flow trading days, each current and source-linked; latest row current and within the freshness window | Persistent institutional allocation and broader regulated access | Persistent institutional outflows or material contraction in regulated access | Blocked: source-linked current series not yet established in the target database |
| Network Security | Hashrate/difficulty series with a fixed calculation window, plus miner revenue and fee data; distinguish level from trend | Robust network security and stable decentralization | Credible deterioration in long-term network-security economics | Blocked: the candidate hashrate series needs canonical raw-source ingestion and documented aggregation |
| Fee-Market Strength | Fee revenue / subsidy ratio as a consistent rolling series; preserve raw fee observations and calculation methodology | Fee market increasingly supports security as subsidy issuance declines | Prolonged fee weakness combined with deteriorating miner economics | Blocked: the available 144-block ratio is only a point-in-time context value, not a validated rolling trend |
| Decentralization | Mining-pool share, node/client distribution, and custody/infrastructure concentration from named sources | No material concentration deterioration | Material rise in mining, custody or infrastructure concentration | Blocked: canonical metric IDs, source selection, window and escalation threshold are not yet defined |
| Regulatory / Custody Environment | Official regulator / legislative source events with source URL, publication timestamp, jurisdiction, affected access/custody surface and reviewed assessment | Broader regulated custody and investment access | Material restriction of access or a custody/regulatory change that weakens the thesis | Blocked: event taxonomy and review workflow need to be specified; do not turn a news headline directly into a status transition |

## Event contract

A future monitoring event is valid only when it includes:

- active `snapshot_id` and methodology/condition version;
- stable metric or reviewed source-event identity;
- observation/source IDs and the actual source URL;
- source timestamp, observation timestamp and evaluation timestamp;
- freshness result and the reason the observation was accepted;
- named confirmation/invalidation condition and the observed values used;
- severity, thesis impact, status and an explanation a reviewer can reproduce.

No event should be created from a qualitative seed description, a stale observation, an untraceable value, an assumed neutral value, or a source-review table that has not been ingested and verified. A new research snapshot must not inherit a state from an older snapshot.

## Acceptance gates before a live scenario-state evaluation

1. Reconcile and document duplicate logical observation keys without deleting historical rows blindly.
2. Establish source-linked current observations for the existing candidate metrics, with explicit units, timestamps, freshness, revision and method.
3. Approve metric definitions and aggregation windows for spot price, ETF flows, hashrate and fee/subsidy economics.
4. Define source/event contracts for mining concentration, custody concentration and regulatory access.
5. Review and approve confirmation/invalidation conditions. Numeric thresholds must be justified and versioned; do not silently adopt the offline directional prototype.
6. Evaluate the rules in a read-only/dry-run against traceable fixtures and historical cases.
7. Only after explicit review, add a snapshot-linked state/event persistence path and test idempotency, lineage, auditability and rollback.

## Non-goals

No price forecast, buy/sell signal, entry/exit recommendation, position sizing, execution, probability recalibration, or automatic scenario transition is introduced by this matrix.


## API exposure — 2026-10-12

The VPS API now returns a read-only `scenario_readiness` object for BTC, computed from persisted observations for the canonical metric IDs. It reports blockers and selected provenance, but always sets `can_persist_scenario_state: false`; it does not choose Bull/Base/Bear or write state/events. The disposable-database E2E asserts that the current seeded data fails closed because fee/subsidy and DXY observations are missing and the latest ETF-flow row is stale. This API response is the input-quality gate only, not a scenario evaluation.


## Live production input audit — 2026-10-12 (read-only)

The production Neon database was queried using SELECT statements only. No rows were inserted, updated or deleted. Results reflect the database at audit time, not a claim that it is the target VPS database.

| Required metric | Rows | Latest observation (UTC) | Freshness | Result |
|---|---:|---|---|---|
| `market.spot_price` | 2 | 2026-09-19 06:38 | STALE | Blocked: not current |
| `institutional.etf_net_flow` | 8 | 2026-09-18 00:00 | STALE | Blocked: not current; zero distinct current, source-linked ETF days in the last 14 days |
| `security.hashrate` | 2 | 2026-09-19 00:00 | STALE | Blocked: not current |
| `security.fee_subsidy_ratio` | 0 | — | — | Blocked: metric observation missing |
| `macro.dxy` | 0 | — | — | Blocked: metric observation missing |

The three existing numeric series have registered source IDs and source URLs, but their latest rows are stale. ETF source: `institutional.primary`; spot source: `market.primary`; hashrate source: `network.primary`. The source URL for the circulating-supply observation is absent; that observation is not one of the five required readiness inputs above, but it remains a provenance defect.

The duplicate-key query returned **nine groups**, covering spot price, block subsidy, circulating supply, max supply, hashrate and four ETF-flow days. Every group had two rows and `distinct_payloads = 1`: the duplicate records have identical values and metadata under the checked logical key. They were preserved; no automatic cleanup was performed.

The published snapshot `BTC-2026-10-07-v1` still has 15 evidence rows covering all 15 blocks, with no missing registered evidence source, observation or source URL. It has zero snapshot-linked scenario-state rows and zero monitoring-event rows; no live scenario evaluation exists yet.

### Decision

BTC scenario readiness is **BLOCKED**, not ready for rule evaluation. Next: obtain current, source-verifiable inputs; define and approve fee/subsidy and DXY metric contracts; then prepare a separate duplicate-reconciliation plan. Do not insert candidate values, change freshness flags, delete duplicate rows or persist a scenario state as part of this audit.
