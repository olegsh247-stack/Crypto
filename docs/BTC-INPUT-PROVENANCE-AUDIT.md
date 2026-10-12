# BTC input provenance audit

Status: read-only audit tool. It does not repair, insert, update, or delete observations.

## Purpose

Use this against the source database before export and against the restored VPS PostgreSQL database after restore. It produces comparable evidence for the five input families in the BTC scenario input-quality contract:

- `market.spot_price`: no older than 24 hours;
- `security.hashrate`: no older than 7 days;
- `security.fee_subsidy_ratio`: no older than 7 days;
- `macro.dxy`: no older than 5 days;
- `institutional.etf_net_flow`: latest observation within 48 hours for scenario readiness and at least five distinct current source-linked days.

The SQL reports the latest timestamp, freshness, source ID, URL presence, source registry integrity, and observation counts. For ETF flow it also counts distinct current, source-linked days within the last 14 days. It lists duplicate logical keys without deleting or merging them, and reports snapshot evidence, scenario-state and monitoring linkage counts.

## Run

From a machine with a compatible `psql` client and a read-only connection string:

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/audit-btc-input-provenance.sql
```

The same command can be run against source and restored target; save each output alongside the dump checksum and migration record. Never place a database URL or password in a committed file or terminal transcript.

## Interpretation

- `BLOCKED_*` means that the latest row for that required metric fails at least one individual gate.
- `INDIVIDUAL_INPUT_CHECKS_PASS` is not proof that the complete scenario is evaluable: the ETF series still needs five distinct days and a latest point within 48 hours, and derived values must use consistent UTC windows.
- Duplicate logical keys are evidence to reconcile, not permission to delete rows. Compare payload, revision, provenance, and source timestamps before deciding on a repair. The audit prints every row in each duplicate group with observation ID, full value fields, unit, source URL, status, freshness, revision, created timestamp, and a review class distinguishing identical payloads from conflicts. It never chooses or deletes a survivor.
- Evidence count/coverage is distinct from live scenario evaluation. A published qualitative evidence row does not imply a current numeric input or a snapshot-linked scenario state.
- This audit does not authorize scenario-state persistence or monitoring-event creation.

## Current BTC boundary

The published snapshot remains the research baseline. The existing source review identified stale numeric observations, duplicate logical-key groups, missing source URLs, and no snapshot-linked scenario-state or monitoring-event rows. Until the audit passes against verified, refreshed inputs and a reviewed evidence-based monitoring rule, do not label the scenario as live-evaluated.
