# BTC source-data audit — 2026-10-12

Status: read-only source database audit. No rows were inserted, updated, or deleted.

## Input readiness inventory

The following results were retrieved with SELECT-only queries on 2026-10-12. Age is relative to the audit execution time. These results describe the source database at audit time; they are not claims about the future VPS database.

| Metric ID | Rows | Latest observation | Approx. age | Freshness | Source URL registered | Current readiness |
|---|---:|---|---:|---|---|---|
| `market.spot_price` | 2 | 2026-09-19 06:38 UTC | 563 h | STALE | Yes | Blocked: not current |
| `security.hashrate` | 2 | 2026-09-19 00:00 UTC | 570 h | STALE | Yes | Blocked: not current |
| `security.fee_subsidy_ratio` | 0 | — | — | — | No | Blocked: missing |
| `macro.dxy` | 0 | — | — | — | No | Blocked: missing |
| `institutional.etf_net_flow` | 8 | 2026-09-18 00:00 UTC | 594 h | STALE | Yes | Blocked: not current; 0 distinct current source-linked days in the last 14 days |

The stored values for spot price, hashrate and ETF flow are historical baseline observations, not acceptable live inputs. No fallback to older observations is allowed when the latest observation fails freshness/provenance validation.

## Duplicate observation groups

The read-only duplicate query found **9 logical-key groups / 18 rows**. All 9 groups have two rows and `distinct_payloads = 1`: the meaningful payload and provenance fields are identical within each group; only the generated `observation_id` and `created_at` differ.

| Metric ID | Duplicate groups | Rows |
|---|---:|---:|
| `institutional.etf_net_flow` | 4 | 8 |
| `market.spot_price` | 1 | 2 |
| `monetary.block_subsidy` | 1 | 2 |
| `monetary.circulating_supply` | 1 | 2 |
| `monetary.max_supply` | 1 | 2 |
| `security.hashrate` | 1 | 2 |
| **Total** | **9** | **18** |

The circulating-supply observation also has no source URL. This is a separate provenance blocker, not a duplicate-payload conflict.

## Proposed target-only reconciliation rule — not executed

After a final source dump is restored to the target database, and before installing a uniqueness constraint:

1. Re-run the row-level duplicate audit against the restored target and compare the output to the source report and dump checksum.
2. Abort if any duplicate group has `distinct_payloads > 1`, or if a duplicate group appears that is not in the reviewed report.
3. For an approved exact-duplicate group only, preserve the row with the earliest `created_at`; use the lexicographically smallest `observation_id` as a deterministic tie-breaker. Preserve all nonduplicate rows.
4. Re-run the audit and require zero duplicate logical-key groups.
5. Only then add the unique natural-key/revision constraint in a separate reviewed migration and rerun backup/restore plus API E2E.

This policy is a proposal for the future target copy, not an authorization to clean the currently serving source database. No cleanup SQL or schema migration was run as part of this audit.

## Required next inputs

- Refresh BTC spot price from a registered market source with canonical `USD/BTC` units and an explicit observation timestamp.
- Refresh network hashrate from a registered network-data source, preserving the averaging window and `EH/s` units.
- Define and test fee/subsidy ratio from the underlying reward/fee data and a documented rolling block window; do not seed a guessed ratio.
- Select and document a stable DXY source and publication timestamp.
- Obtain at least five distinct recent US spot ETF flow days from the primary table, with source URL, reporting day, unit and revision semantics.
- Do not create a scenario-state evaluation or monitoring event until these inputs pass the read-only readiness gate and the confirmation/invalidation rules are reviewed.
