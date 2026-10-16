# BTC single research scenario — input readiness from existing records

**Date:** 2026-10-16  
**Mode:** offline review of already committed project evidence. No live data collection, database access/write, ingestion, scenario evaluation, deployment, or merge.

## Decision

Continue the single BTC research-scenario work without waiting for a complete daily ETF holdings panel. The user explicitly approved counting and using the available ETF holdings set, and the calculation section is closed. This does **not** waive freshness, provenance, units, or required-input checks.

## Existing input audit

The last recorded read-only source-data audit is dated 2026-10-12. It describes the source database at that audit time only.

| Metric | Last audited state | Decision for scenario |
|---|---|---|
| `market.spot_price` | 2 rows; latest 2026-09-19 06:38 UTC; stale; source URL registered | Historical context only; blocked as a current input |
| `security.hashrate` | 2 rows; latest 2026-09-19 00:00 UTC; stale; source URL registered | Historical context only; blocked as a current input |
| `security.fee_subsidy_ratio` | 0 rows; no source URL | Missing; do not estimate or seed |
| `macro.dxy` | 0 rows; no source URL | Missing; do not estimate or seed |
| `institutional.etf_net_flow` | 8 rows; latest 2026-09-18; stale; zero distinct current source-linked days in the prior 14-day window | Blocked as a current input |
| `monetary.circulating_supply` | duplicate logical-key group in the audit; no source URL | Provenance blocked until source is identified |
| `monetary.block_subsidy`, `monetary.max_supply` | duplicate logical-key groups in the audit | Historical values exist; deduplication is a target-only migration concern and must not be performed against the current source DB without approval |

Source: `docs/BTC-SOURCE-DATA-AUDIT-2026-10-12.md`. This report is not a fresh audit of any live or target database.

## ETF data handling decision

- Daily holdings candidate: 162 rows across IBIT, ARKB, BITB, HODL and OBTC; 5/13 coverage; latest common date 2026-10-14; partial five-fund sum 888,383.5954 BTC.
- SEC quarter-end control: 13/13 tickers on 2026-06-30; sum 1,211,244.47121778 BTC.
- These are different measures and frequencies. Holdings are not ETF net flows; the partial five-fund sum is not a 13-fund total. Neither is used to silently replace `institutional.etf_net_flow`.
- Detailed calculations: `docs/BTC-ETF-AVAILABLE-DATA-CALCULATION-2026-10-16.md`.

## Next execution boundary

The immediate next stage is to finish the **offline contract and test coverage for one BTC scenario**: confirm required metric IDs, unit conventions, freshness windows, missing-input behavior, and the exact conditions under which a scenario can become evaluable. Use existing stored examples and synthetic fixtures only. A failed gate must report named blockers; it must not manufacture a scenario state or change scores/probabilities.

After the contract is checked, refresh of actual market inputs is a separate explicitly authorized step. Do not run live capture, write to the DB, provision storage/VPS, deploy, or merge PR #83 under this review. PR #83 remains Draft and unmerged. BTC remains `not_evaluable` while required current inputs fail the gate.
