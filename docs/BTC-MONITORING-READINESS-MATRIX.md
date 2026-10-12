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
