# BTC observation provenance and revision contract audit — 2026-10-11

**Scope:** BTC only; ETF flow, network hashrate, circulating supply, canonical Observation → Source → Evidence lineage.
**Repository evidence reviewed:** `infrastructure/neon/schema-v1.sql`, `infrastructure/neon/migrations/2026-10-11-btc-market-observation-baseline.sql`, `vps/worker/src/scheduler.ts`, `workers/crypto-api/src/index.ts`, and the source-reconciliation notes linked below.
**Reference implementation inspected:** PR #9 head `d14a4eb02d77511a13c5ba9ffca4dc8204dd78da`.
**Safety:** audit/documentation only. No observations, snapshots, Evidence rows, scenario states, production database, migrations, or deployments were changed.

## Decision

**Do not correct the three stored market values yet.** The repository has enough fields to begin describing time windows and revisions, but it does not yet provide a complete, enforced, reproducible observation-revision contract. In addition, the inspected scheduled Worker ingestion updates market candles, not these three observation metrics.

## 1. What the current schema supports

The base `observations` table contains:

- `observed_at`: required timestamp;
- `period_start` and `period_end`: optional reporting-window bounds;
- `source_id`, `source_url`, and `methodology`;
- `revision`: integer defaulting to 1;
- `freshness` and `status`.

The base schema's observation indexes are non-unique lookup indexes. The reviewed base schema does not itself enforce uniqueness of a logical observation/revision, or enforce that revision numbers are monotonic for a source's revised report. Before designing an index, inspect all migrations and existing duplicates on the target branch/database; this audit did not query production or claim a complete live-schema inventory.

The BTC baseline migration inserts the initial values only when no row exists for the same `asset_id + metric_id + source_id`. This protects repeat application of that seed from overwriting an existing row, but it is **not** a general source-revision ingestion strategy and does not establish a natural key for revised observations.

The Worker API projection selects one row per `metric_id`, ordered by `observed_at DESC, revision DESC`. That makes a higher revision useful when the observation timestamp is identical, but it does not define how to compare different reporting windows, sources, publication times, or source corrections.

## 2. Ingestion-path finding

The inspected `vps/worker/src/scheduler.ts` fetches daily candles from Binance, with Kraken and CoinGecko fallbacks, and upserts `market_daily_candles`. It also updates expired research-review status. The inspected function does not ingest Farside ETF flows, a hashrate series, or a Bitcoin Core UTXO-set/supply observation into `observations`.

Therefore, these three BTC values are currently seed/baseline observations in the reviewed path, not values refreshed by the canonical scheduled Worker. Do not infer that a successful candle-ingestion run refreshes these metrics.

## 3. Metric-specific semantic decisions required

### ETF net flow — `institutional.etf_net_flow`

- The current historical Farside page supports +$433.0M as the revised 2026-09-18 total; +$324.6M is consistent with a preliminary/incomplete table state before IBIT's +$108.4M was included.
- Keep the existing +$324.6M row immutable until a reviewed correction path can preserve both source states.
- Define the source reporting date/session window separately from retrieval/publication time. Record the source URL, reporting period, retrieval time, and revision/capture identity where available.
- A corrected historical flow remains historical/stale; revision does not make it current.

Reference: `docs/BTC-ETF-FLOW-RECONCILIATION-2026-10-11.md`.

### Network hashrate — `security.hashrate`

- The cited 1,001 EH/s source refers to 2026-09-04, not 2026-09-19.
- A separate approximately 826 EH/s figure is a daily estimate for 2026-09-19 and is not interchangeable with a snapshot or a rolling mean without a defined contract.
- Decide whether the canonical metric represents a source snapshot, a UTC-day estimate, or a rolling average. Persist the actual window in `period_start/period_end`, plus method/source and retrieval metadata. If materially different aggregation methods must coexist, use separate metric identifiers rather than silently mixing them.
- Do not replace 1,001 with 826 until the intended metric and exact source window are approved.

Reference: `docs/BTC-HASHRATE-OBSERVATION-RECONCILIATION-2026-10-11.md`.

### Circulating supply — `monetary.circulating_supply`

- The stored value is described as `gettxoutsetinfo`-derived, but has no source URL, block height, best-block hash, exact RPC field, or reproducible calculation.
- `gettxoutsetinfo.total_amount` describes BTC represented in the UTXO set at a particular chain state. It is not automatically interchangeable with a general circulating-supply definition.
- Recover the original response/derivation if possible. Otherwise, do not retrofit guessed metadata to the old value. Decide whether the intended metric is a UTXO-set total (named accordingly) or circulating supply defined by an explicit, reproducible issuance/burn methodology.
- A reproducible chain-derived observation should preserve at least block height and block hash, exact field/calculation, source/client version where relevant, and retrieval timestamp.

Reference: `docs/BTC-CIRCULATING-SUPPLY-SEMANTICS-2026-10-11.md`.

## 4. Canonical Observation → Source → Evidence → Scenario chain

The reviewed API contract already exposes useful lineage fields: metric observations carry source IDs/URLs and observation timestamps; Evidence rows carry `observation_id`, `source_id`, and `as_of`; scenario-Evidence links are scoped to the same research snapshot. Preserve that lineage when a metric is corrected.

Acceptance rules for a future correction:

1. Never update the old value in place just to make the API look current.
2. Keep event/reporting time, retrieval time, and research assessment time distinct.
3. Store the source's reporting window and the actual revision/capture identity; do not use retrieval time as `observed_at` for the underlying market event.
4. Keep the old row and append a new version only under an explicitly defined logical key and revision rule.
5. If an Evidence row cites the old observation, preserve that relationship. Create or revise Evidence only through the reviewed snapshot/versioning process; do not silently repoint existing Evidence.
6. Do not link stale numeric observations as proof of current market conditions.
7. Do not create `scenario_state` as part of metric correction or Evidence-link work.

## 5. Next implementation gate

Before adding a migration or ingestion code:

1. Inventory every existing migration for observation uniqueness, revision semantics, and any trigger that may alter observations; inspect actual duplicate keys in a disposable database, not production writes.
2. Approve a common observation contract that distinguishes event time, reporting period, retrieval time, source revision/capture, and methodology. The current table lacks an explicit retrieval timestamp and source revision/capture field.
3. Define a logical-key/revision strategy that can retain preliminary and revised ETF rows without conflating separate hashrate windows.
4. Decide whether circulating supply can be recovered historically or must be represented as a newly defined metric with a fresh, reproducible chain observation.
5. Implement the schema/ingestion changes additively, add tests for repeated ingestion and revised source values, and verify API selection by metric and window in disposable PostgreSQL.
6. Run read-only parity/preflight against Worker and VPS API. Keep all historical values visibly stale until their provenance is verified.

## Explicitly out of scope

No market-value replacement, automatic observation refresh, published-snapshot mutation, Evidence-link expansion beyond the reviewed SEC proposal links, scenario-probability recalculation, scenario-state creation, production migration, PR #9 merge, or deployment is authorized by this audit.
