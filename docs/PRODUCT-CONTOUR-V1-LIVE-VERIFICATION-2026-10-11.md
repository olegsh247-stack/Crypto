# Product Contour v1 — read-only live Neon verification (2026-10-11)

**Scope:** actual schema/table metadata and read-only SQL results from Neon project `Crypto`, branch `production`, database `neondb`.  
**Branch ID:** `br-lingering-sunset-b1b75nsm`.  
**Method:** Neon management metadata and SELECT-only SQL. No writes, migrations, data corrections, scenario publication, or deployments.  
**Important:** this document is a partial live database check, not a complete Product Contour acceptance sign-off. Live HTTP API/UI could not be independently fetched in this check, so those layers remain unverified here.

## Executive result

The live database contains the expected Product Contour v1 tables and a published BTC research snapshot. The BTC baseline is structurally populated across all 15 research blocks, six domains, six critical factors, five scores, three scenario definitions and 15 evidence rows with source/observation/block/domain/as-of links.

However, **the live contour is not yet a complete end-to-end product scenario**. The most important gaps are:
1. No BTC `scenario_states` rows and no `monitoring_events` rows.
2. BTC has seven monitoring signals (four `active`, three `watch`), last updated at `2026-10-08T12:30:54.538Z`; no events were present to demonstrate triggered monitoring.
3. BTC observations contain duplicate natural-key rows, and the live `observations` indexes include no natural-key uniqueness index. Do not delete/correct them until the intended revision semantics and exact duplicate contents are reviewed.
4. Every BTC observation row has `period_start` and `period_end` null. That may be valid for point-in-time metrics, but it is not adequate for interval metrics such as daily ETF flow without explicit metric-specific semantics.
5. BTC circulating-supply observation has a null `source_url`; several market/protocol metrics are marked stale.
6. The read-only live API and UI path remains to be verified separately.

## Hosting baseline from the management plane

- One Neon project named `Crypto` was found.
- PostgreSQL version metadata: **18**. The infrastructure plan currently proposes PostgreSQL 16 for VPS. That major-version difference must be treated as a compatibility decision and tested; do not assume a PostgreSQL 16 target is equivalent to the live PostgreSQL 18 source.
- One default/primary branch named `production`, marked `ready`; metadata says it is not protected.
- One read-write compute endpoint was listed, observed `idle`/suspended at inspection, autoscaling 0.25–2 CU, suspend timeout 0.
- Metadata reports `block_public_connections=false`, an empty IP allow-list, and `passwordless_access=true`. Confirm intended security posture and exact setting semantics before making any changes; none were made.
- Endpoint metadata reports pooler disabled.
- Snapshot listing returned no explicit snapshots. This is not proof that Neon offers no PITR/history; verify the actual recovery window and perform a restore rehearsal.
- Reported history retention: 21,600 seconds (6 hours). Verify what this setting governs and whether the available recovery window meets migration/rollback needs.
- Database: `neondb`. Management metadata listed 21 public base tables, including assets, research, observations, Evidence and monitoring tables.
- Migration marker count: 17, including `2026-10-12-canonical-registry-finalize`. The marker proves that a migration version is recorded in this database; it does not by itself prove the whole schema is identical to the current repository.

## Live Product Contour findings

### Asset and snapshot coverage

There are 10 enabled assets in the live registry: BTC, ETH, SOL, CAKE, BCH, DASH, LTC, TRX, XRP and USDT.

| Asset | Published snapshots | Research status rows | Interpretation |
|---|---:|---:|---|
| BTC | 1 | 1 | Published Structure 1 baseline; current DB status row |
| ETH | 1 | 1 | Published baseline remains present |
| BCH | 0 | 0 | No published snapshot/status row found |
| CAKE | 0 | 0 | No published snapshot/status row found |
| DASH | 0 | 0 | No published snapshot/status row found |
| LTC | 0 | 0 | No published snapshot/status row found |
| SOL | 0 | 0 | No published snapshot/status row found |
| TRX | 0 | 0 | No published snapshot/status row found |
| USDT | 0 | 0 | No published snapshot/status row found |
| XRP | 0 | 0 | No published snapshot/status row found |

This is a database snapshot/status inventory only. It does not claim the other assets lack market history or other non-snapshot data.

### BTC published snapshot

- Snapshot: `BTC-2026-10-07-v1`, version 1, status `PUBLISHED`, published/created at `2026-10-08T06:56:27.043Z`.
- Research status: `current`; last research `2026-10-08T06:56:27.043Z`; next review `2026-11-07T06:56:27.043Z`.
- Research blocks: 15 rows, all status `complete`.
- Domains: 6 global domain definitions; BTC block-domain mapping has 15 links and uses all 6 distinct domains.
- Critical factors: 6, all linked to `BTC-2026-10-07-v1`.
- Scores: 5, all linked to the same snapshot and methodology `CryptoResearch-v2-Structure1`.
- Scenarios: exactly one each of `bull`, `base`, `bear`, linked to the same snapshot. Stored probabilities are 0.30 / 0.50 / 0.20 respectively (sum 1.00).
- Evidence: 15 rows; all 15 have a source, observation, research block, research domain and `as_of` timestamp.
- Scenario states: **0 rows for BTC**.
- Monitoring signals: 7 rows (4 `active`, 3 `watch`); latest `last_updated_at` is `2026-10-08T12:30:54.538Z`.
- Monitoring events: **0 rows for BTC**.

### BTC observation quality and idempotency

Read-only counts for `observations` filtered to `asset_id='btc'`:

- 33 rows, 21 distinct metric IDs, 9 distinct source IDs.
- 18 rows have freshness `STALE`.
- 2 rows have missing/blank `source_url`.
- 33 rows have `period_start IS NULL` and 33 have `period_end IS NULL`.
- Latest `observed_at` is `2026-10-08T06:56:27.043Z`.
- The live table has a primary-key index on `observation_id` and non-unique lookup indexes only; no natural-key unique index was present in the inspected live schema.

The natural-key duplicate check found nine groups with two rows each (same metric, asset, source, observed timestamp and revision):
- `market.spot_price` — 2026-09-19;
- `security.hashrate` — 2026-09-19;
- `monetary.block_subsidy` — 2026-09-19;
- `monetary.circulating_supply` — 2026-09-19;
- `monetary.max_supply` — 2026-09-19;
- `institutional.etf_net_flow` — 2026-09-15, 09-16, 09-17 and 09-18.

This query groups by the natural-key fields; before any cleanup, compare the full rows including values, URLs, methodology and timestamps. Do not delete duplicates or add a unique index to production as part of this audit. The revision/provenance contract must be settled and rehearsed first.

Two specific provenance issues are visible in the current rows:
- Circulating supply `20,086,198.00419505 BTC` observed 2026-09-19 has a null `source_url` even though its source registry label is Mempool.space.
- ETF flow `324.6 USD million/day` for 2026-09-18 is `WATCH` and `STALE`, but its reporting period is not explicitly populated in `period_start/period_end`. Preserve historical values while resolving source revisions and reporting-window semantics.

### What this says about readiness

| Contour part | Live result | Status |
|---|---|---|
| Asset registry | 10 enabled canonical lowercase IDs; BTC and ETH have published snapshots | Partial; continue full all-asset registry/pair audit |
| BTC snapshot / 15 blocks | Published snapshot, 15/15 complete | Structurally present |
| Domains / block mapping | 6 domains, 15 BTC mapping rows, all 6 used | Structurally present |
| Factors / Scores | 6 factors + 5 scores on BTC snapshot | Structurally present; semantic review remains |
| Scenario definitions | Bull/Base/Bear definitions exist and probabilities sum to 1.00 | Structurally present |
| Scenario state | No BTC scenario-state rows | **Missing for complete evaluated scenario** |
| Evidence | 15/15 linked to source, observation, block, domain and as-of | Linkage present; source/claim correctness still requires row-by-row review |
| Observations | Duplicate natural keys; no live unique natural-key index; missing source URL/period semantics | **Data-contract blocker** |
| Monitoring | 7 BTC signals but 0 BTC events; last update Oct 8 | Partial; evaluation/event generation and freshness need proof |
| API / UI | Not independently verified in this check | Unverified |
| Migration parity | 17 migration markers; live PostgreSQL 18 vs proposed target 16 | Requires schema-vs-repo and major-version compatibility audit |

## Next actions — keep the agreed order

1. Finish the read-only Product Contour matrix for all enabled assets and relevant registry/market pairs; do not publish new research snapshots for SOL/CAKE.
2. Verify the live API read-only endpoints and UI contract separately. Do not count this DB result as API/UI verification.
3. Review exact duplicate BTC observation rows and reconcile the BTC source/revision contract. No production corrections or uniqueness migration until a disposable rehearsal passes.
4. Complete the BTC scenario acceptance path, including evidence-backed state evaluation and monitoring semantics. Do not fabricate a scenario state or monitoring event just to make the contour appear complete.
5. After the BTC scenario is demonstrated, revisit research expansion and the VPS migration batch.

## Safety and evidence boundary

- All SQL executed for this document was SELECT-only.
- No database row, schema, migration marker, provider setting, snapshot or scenario state was changed.
- No connection string or credential was requested or written.
- This check used the Neon management API and live database metadata; it did not inspect Cloudflare account-level settings.
- Live API/UI access was not confirmed, so those checks remain explicitly open.


## Additional all-asset registry and market-history checks — 2026-10-11

The read-only SQL audit was extended to the full enabled-asset registry, market pairs, daily candle coverage and monitoring freshness.

- **Asset registry:** 10 enabled canonical lowercase asset IDs; no uppercase duplicates were returned by the registry query.
- **Market pairs:** 9 enabled pairs, one for each non-stablecoin asset, all quoted in `usdt`; no orphan base/quote assets and no duplicate `(exchange, symbol)` keys were found. USDT itself has no market pair, which is expected for this registry role and should not be interpreted as missing base-asset coverage.
- **Market history:** 90 daily candles total, 10 for each of the 9 paired assets. All series run from `2026-09-29T00:00:00Z` through `2026-10-08T00:00:00Z`. No candle is within the last three days at the time of the audit on 2026-10-11; market history is stale by a three-day recency check.
- **Observation duplicates across all assets:** the natural-key duplicate query found nine duplicate groups, all in BTC. No duplicates were returned for other assets in this grouping.
- **Monitoring freshness:** both BTC and ETH signals have `last_updated_at=2026-10-08T12:30:54.538Z`; the live DB has 7 BTC signals (4 active, 3 watch) and 6 ETH signals (3 active, 3 watch). There are no monitoring-event rows anywhere in the live table, and no scenario-state rows anywhere in the live table.

### Asset-by-asset snapshot/status matrix

| Asset | Enabled | Pair | Daily candles | Published snapshot | Research status |
|---|---:|---|---:|---:|---|
| BTC | Yes | BTC/USDT | 10 | 1 | current |
| ETH | Yes | ETH/USDT | 10 | 1 | current |
| SOL | Yes | SOL/USDT | 10 | 0 | none |
| CAKE | Yes | CAKE/USDT | 10 | 0 | none |
| BCH | Yes | BCH/USDT | 10 | 0 | none |
| DASH | Yes | DASH/USDT | 10 | 0 | none |
| LTC | Yes | LTC/USDT | 10 | 0 | none |
| TRX | Yes | TRX/USDT | 10 | 0 | none |
| XRP | Yes | XRP/USDT | 10 | 0 | none |
| USDT | Yes | quote asset | 0 | 0 | none |

This matrix describes the database at inspection time only. It does not imply that every 10-candle series is complete or sufficient for the eventual product.

## Live API/UI verification status

A direct public fetch of `https://crypto-api.olegsh247.workers.dev/` could not be completed by the available web retrieval path in this run. Therefore the live API root, asset detail endpoints, and UI rendering have **not** been independently confirmed here. The API/UI part remains OPEN; do not mark the entire Product Contour green on the basis of database rows or CI reports alone.


## Second pass: all-asset Product Contour audit matrix — 2026-10-11

This pass extends the initial BTC-focused check to every enabled asset and validates the published snapshot structure for both assets that currently have a published snapshot. All queries were SELECT-only.

### Per-asset research structure

| Asset | Tier | Published snapshots | Published blocks | Domains used | Factors | Scores | Scenarios | Evidence | Research status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| BTC | A | 1 | 15/15 complete | 6 | 6 | 5 | 3 | 15 | current |
| ETH | A | 1 | 15/15 complete | 6 | 6 | 5 | 3 | 15 | current |
| BCH | B | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| CAKE | C | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| DASH | B | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| LTC | B | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| SOL | A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| TRX | B | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| USDT | A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |
| XRP | B | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none |

For BTC and ETH, the published snapshots each have exactly 15 distinct block numbers, 1 through 15, all marked `complete`. Both have six global research domains represented in the block-domain mappings, six factors, five scores, one each of Bull/Base/Bear definitions and 15 Evidence rows. Each Evidence row has source, observation, block, domain and `as_of` populated. The score records are linked to the respective snapshot and use `CryptoResearch-v2-Structure1`.

**Interpretation:** this establishes that BTC and ETH have populated research baselines. It does not prove the correctness of the scores, the evidence claims, API/UI delivery, or a complete scenario lifecycle. ETH remains a compatibility/regression asset; BTC remains the first scenario to finish. The other eight enabled assets have registry/market-history records but no published research snapshot or research-status row in the inspected database.

### All-asset observation and monitoring matrix

| Asset | Observation rows | Distinct metrics | Stale observations | Missing source URL | Missing period start/end | Latest observation |
|---|---:|---:|---:|---:|---:|---|
| BTC | 33 | 21 | 18 | 2 | 33 / 33 | 2026-10-08 06:56 UTC |
| ETH | 14 | 14 | 0 | 0 | 14 / 14 | 2026-10-07 09:16 UTC |
| BCH, CAKE, DASH, LTC, SOL, TRX, USDT, XRP | 0 each | 0 each | 0 each | 0 each | n/a | n/a |

The live observation table contains 47 rows total for BTC and ETH. The period fields are null for all 47 rows. Whether this is acceptable must be defined per metric: point observations may not require an interval, while daily flows/averages do. The absence of observations for other enabled assets is a coverage gap, not permission to generate or publish research for them in this phase.

Monitoring has 13 signals in total: BTC 7 (4 active, 3 watch), ETH 6 (3 active, 3 watch). All signal rows were last updated at `2026-10-08T12:30:54.538Z`. There are zero `scenario_states` and zero `monitoring_events` rows across the entire database, not only for BTC. This is a systemic lifecycle gap.

### Product Contour v1 acceptance status after this pass

| Acceptance area | Result | Decision |
|---|---|---|
| Registry / asset IDs | 10 enabled assets; canonical lowercase IDs | Pass for basic registry shape |
| Market pairs | 9 enabled asset/USDT pairs; no orphan assets or duplicate exchange-symbol keys | Pass for pair referential integrity |
| Daily market candles | 10 per paired asset, Sep 29–Oct 8; none in the last three days as of Oct 11 | Fail for current freshness/coverage expectation; verify ingestion cadence and API semantics |
| Published research baseline | BTC and ETH have 15/15 complete blocks; eight assets have no published snapshot | Partial, consistent with BTC-first scope; do not expand research yet |
| Domains / Factors / Scores / scenario definitions | Structurally populated and snapshot-aligned for BTC and ETH | Structural pass; content/claim validation remains |
| Evidence links | 15/15 complete linkage for each published snapshot | Structural pass; provenance/content review remains |
| Scenario-state evaluation | Zero rows globally | **Fail / blocking for a complete scenario** |
| Monitoring event lifecycle | Zero rows globally; signals stale since Oct 8 | **Fail / blocking for demonstrated monitoring** |
| Observation provenance / idempotency | BTC natural-key duplicate groups; no live natural-key unique index; periods absent | **Fail / blocking until semantics and migration are rehearsed** |
| API / UI | Not independently verified | Open |
| Hosting portability / schema parity | PostgreSQL 18 source vs PostgreSQL 16 proposal; production migration workflow safety issue documented | Open; no cutover |

### Next work item

The broad database inventory is now documented. The next task is not to expand SOL/CAKE research. It is to close the remaining evidence gaps for the BTC path in this order: (1) exact BTC duplicate row/provenance comparison, (2) metric-specific period/revision contract and isolated idempotency rehearsal, (3) read-only API endpoint verification, (4) scenario-state and monitoring evaluation contract/tests without writing fabricated live rows, and (5) UI/API parity checks. Any production data correction or migration remains prohibited until separately reviewed and explicitly approved.


## Exact comparison of BTC duplicate observation rows — 2026-10-11

The duplicate groups were inspected by selecting every column in the paired rows, including the payload, metric, source, timestamps, provenance, status and freshness. This was read-only.

**Result:** the two rows in each duplicate group have identical metric payload and metadata. Their `observation_id` UUIDs differ, and `created_at` differs by exactly 5 hours 20 minutes 23.274 seconds. No differing value, source URL, methodology, status, freshness, period or revision was found in the nine pairs. That pattern is consistent with the same seed batch being inserted twice, but the database rows alone do not prove the precise write path.

| Metric / observation day | Value in both rows | Source | Both row IDs end with / start with | Finding |
|---|---:|---|---|---|
| `institutional.etf_net_flow` / Sep 15 | -450.4 USD million/day | Farside | IDs `0e57557d…` and `5e9cd812…` | Payloads identical; revision 1 |
| `institutional.etf_net_flow` / Sep 16 | -295.9 USD million/day | Farside | `13aabdb6…` and `fbe07d8f…` | Payloads identical; revision 1 |
| `institutional.etf_net_flow` / Sep 17 | +159.5 USD million/day | Farside | `004137c9…` and `2ae6d871…` | Payloads identical; revision 1 |
| `institutional.etf_net_flow` / Sep 18 | +324.6 USD million/day | Farside | `1332b192…` and `b4b74ec7…` | Payloads identical; revision 1; stale and WATCH |
| `market.spot_price` / Sep 19 06:38 UTC | 81,043 USD/BTC | Market data provider | `b6b5bcde…` and `f3e5f06e…` | Payloads identical; initial source mapping is not authoritative production feed |
| `security.hashrate` / Sep 19 | 1,001 EH/s | Mempool label; source URL points to a third-party article | `a1b632b4…` and `f111b9a0…` | Payloads identical; source/date/metric semantics need review |
| `monetary.block_subsidy` / Sep 19 | 3.125 BTC/block | Bitcoin Developer Reference label | `bbd74e3c…` and `ef701390…` | Payloads identical |
| `monetary.circulating_supply` / Sep 19 | 20,086,198.00419505 BTC | Mempool.space label; URL missing | `908e9174…` and `f8d9722b…` | Payloads identical; provenance incomplete and metric definition needs review |
| `monetary.max_supply` / Sep 19 | 21,000,000 BTC | Bitcoin Developer Reference label | `645af9d7…` and `96c9cf6a…` | Payloads identical |

### Decision

- Do **not** delete one row from each pair. There is no deletion/cleanup in this audit.
- Do **not** create the natural-key unique index in production yet: the exact intended natural key must include the chosen source/reporting-window/revision semantics, and a duplicate cleanup would be required before such an index could succeed.
- Next, reproduce the duplicate insert in a disposable PostgreSQL database using the repository's actual seed/ingestion path; then test idempotency under a repeated run and a legitimate revision. Compare exact rows and ensure that legitimate revised observations remain representable.
- For ETF flow, define the daily reporting period explicitly before considering any revision. For hashrate, separate point snapshot vs daily estimate/rolling average and correct the observation timestamp only through a separately reviewed, source-supported correction. For circulating supply, verify the actual RPC/source field and reproducible calculation; do not assume `gettxoutsetinfo.total_amount` is automatically circulating supply.

No live rows, schema objects or migration markers were changed.


### Source-level root cause for the BTC seed duplicates

Repository inspection confirmed a plausible direct cause:

- `infrastructure/neon/seed-v1.sql` inserts the nine BTC numeric observations with generated `observation_id` UUIDs and ends the insert with `ON CONFLICT DO NOTHING`. Because each rerun generates new UUIDs and the live table had no natural-key unique index, the conflict clause did not suppress logical duplicates.
- `.github/workflows/seed-neon-data.yml` runs the seed SQL on manual dispatch or on a qualifying push to `main`; it does not skip the seed when `crypto-seed-v1` is already recorded. The migration marker is therefore not an execution guard for this workflow.
- Live `schema_migrations` records `crypto-seed-v1` at `2026-09-24T12:49:16.612Z`. One copy of the duplicated rows was created at `12:49:16.433Z`, and the second copy at `18:09:39.707Z` that same day. This timing strongly supports a repeated seed execution, although it does not independently identify the actor or workflow run.

A code-only fix is proposed in [PR #12 — Fix seed-v1 observation idempotency](https://github.com/olegsh247-stack/Crypto/pull/12). It checks the logical observation key before insertion and adds a disposable PostgreSQL 16 regression rehearsal. The PR remains Draft because its new workflow has not yet run; no merge or production execution has been performed. The patch does not clean up the existing nine duplicate groups or add a production unique index.
