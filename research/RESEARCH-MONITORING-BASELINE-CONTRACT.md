# Research → Monitoring Baseline Contract

## Purpose

Research is an immutable snapshot. Monitoring observes the asset after that snapshot and never rewrites the historical research state.

## Canonical flow

```text
Asset
  ↓
Research Snapshot N
  ├─ 15 Research Blocks
  ├─ Domains
  ├─ Critical Factors
  ├─ Scores
  └─ Scenarios
        ↓
Monitoring Baseline
        ↓
Monitoring Signals / Events / Observations
        ↓
Research Snapshot N+1 when a new research cycle is explicitly created
```

## Rules

1. A completed Research Snapshot is eligible to become the Monitoring baseline.
2. The baseline references the exact `snapshot_id`; it is never reconstructed from the current mutable asset state.
3. Monitoring events and signals are append-only observations. They do not modify the source Research Snapshot.
4. A new research cycle creates a new snapshot; it does not overwrite the previous snapshot.
5. Research lifecycle and research freshness remain separate dimensions.
6. `research_status.status` (`current`, `update_recommended`, `outdated`) describes freshness, not completion.
7. Monitoring may change freshness from `current` to `update_recommended` or `outdated`, but it must not change historical block statuses.
8. Monitoring signals must identify the asset and, where applicable, the baseline snapshot they evaluate.
9. Pair observations remain instrument data. They may feed a monitoring signal but never redefine the Asset or its Research Snapshot.
10. The API should expose baseline metadata explicitly instead of hiding it inside `asset.research_status`.

## State transition

```text
Research lifecycle: complete
        +
Freshness: current
        ↓
Monitoring baseline established
        ↓
New observation
        ↓
Signal evaluation
        ├─ no material change → freshness remains current
        └─ material change → update_recommended / outdated
```

## Historical integrity

For any asset, the system must be able to answer:

- which research snapshot was active at a given time;
- which monitoring baseline was derived from it;
- which signals/events occurred after that baseline;
- whether a later research cycle replaced it.

No monitoring write may mutate the contents of a prior research snapshot.

## ETH acceptance criteria

ETH is considered correctly connected when:

- its completed research snapshot is addressable by `snapshot_id`;
- the monitoring layer can reference that snapshot as its baseline;
- a monitoring observation can be added without changing the snapshot;
- freshness can change independently of lifecycle;
- the next research cycle creates a new snapshot.

**Status:** canonical contract for Research → Monitoring integration.
