# BTC observation provenance and revision contract audit — 2026-10-11

**Scope:** BTC only; ETF flow, network hashrate, circulating supply, canonical Observation → Source → Evidence lineage.
**Repository evidence reviewed:** `infrastructure/neon/schema-v1.sql`, the migration directory on `fix/product-contour-v1-contracts` including `2026-10-13-eth-observation-registry-and-idempotency.sql`, `infrastructure/neon/migrations/2026-10-11-btc-market-observation-baseline.sql`, `vps/worker/src/scheduler.ts`, `workers/crypto-api/src/index.ts`, and the source-reconciliation notes linked below.
**Reference implementation inspected:** PR #9 head `d14a4eb02d77511a13c5ba9ffca4dc8204dd78da`.
**Safety:** audit/documentation only. No observations, snapshots, Evidence rows, scenario states, production database, migrations, or deployments were changed.

## Decision

**Do not correct the three stored market values yet.** The repository contains a proposed observation natural-key/revision uniqueness migration, but the complete end-to-end contract still lacks explicit retrieval/capture metadata and metric-specific time-window semantics. In addition, the inspected scheduled Worker ingestion updates market candles, not these three observation metrics.

## 1. What the current schema supports

The base `observations` table contains:

- `observed_at`: required timestamp;
- `period_start` and `period_end`: optional reporting-window bounds;
- `source_id`, `source_url`, and `methodology`;
- `revision`: integer defaulting to 1;
- `freshness` and `status`.

The base schema's observation indexes are non-unique lookup indexes. However, the reviewed migration directory already contains `2026-10-13-eth-observation-registry-and-idempotency.sql`, which proposes a unique index on `metric_id + normalized asset_id + source_id + observed_at + normalized period_start + normalized period_end + revision`. It checks for duplicate keys before creating the index. This is a useful generic idempotency foundation, and a correction can in principle append a higher revision when the event timestamp and period are held constant. It does **not** by itself establish source publication/retrieval metadata, capture identity, metric-specific window semantics, or monotonic revision assignment. Its presence in a repository branch is not proof that the migration has been applied to production; this audit did not query production.

The BTC baseline migration inserts the initial values only when no row exists for the same `asset_id + metric_id + source_id`. This protects repeat application of that seed from overwriting an existing row, but it is **not** a general source-revision ingestion strategy. A separately reviewed correction must use the approved natural key and a deliberate higher revision, while retaining the original row. Before applying the index migration in any environment, inspect duplicates in that environment.

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

1. Rehearse `2026-10-13-eth-observation-registry-and-idempotency.sql` against a disposable PostgreSQL database and verify duplicate-key handling. Do not infer it has been applied to production.
2. Approve a common observation contract that distinguishes event time, reporting period, retrieval time, source revision/capture, and methodology. The current table lacks an explicit retrieval timestamp and source revision/capture field.
3. Define how the existing natural key/revision rule will retain preliminary and revised ETF rows without conflating separate hashrate windows. Confirm whether source revisions may change `observed_at`; if they do, the current key will not group them as versions of the same event.
4. Decide whether circulating supply can be recovered historically or must be represented as a newly defined metric with a fresh, reproducible chain observation.
5. Implement only the missing schema/ingestion pieces additively, add tests for repeated ingestion and revised source values, and verify API selection by metric and window in disposable PostgreSQL.
6. Run read-only parity/preflight against Worker and VPS API. Keep all historical values visibly stale until their provenance is verified.

## Explicitly out of scope

No market-value replacement, automatic observation refresh, published-snapshot mutation, Evidence-link expansion beyond the reviewed SEC proposal links, scenario-probability recalculation, scenario-state creation, production migration, PR #9 merge, or deployment is authorized by this audit.


## 7. Proposed v1 observation provenance contract — implementation-ready acceptance rules

This section narrows the next implementation step; it is a **proposal for review**, not a schema change or permission to run a migration.

### Field semantics

- `observed_at`: the time the represented point observation applies to. For interval aggregates, use the source-defined event/reporting anchor consistently; do not substitute fetch time.
- `period_start` / `period_end`: the actual source reporting window, in UTC. For daily aggregates, persist the UTC interval represented by the value, not an assumed midnight timestamp alone. A point observation may leave both null only when it genuinely has no reporting interval.
- **Proposed additive `retrieved_at`**: timestamp when this system successfully captured the source response. It is ingestion provenance, not the observation time.
- **Proposed additive `source_revision`**: nullable source-issued revision/edition/version identifier when the provider supplies one. Never synthesize a provider revision from our database revision.
- **Proposed additive `capture_hash`**: SHA-256 of the normalized source response/record used to derive the value, where a stable, documented canonicalization is available. A hash proves byte/content identity only; it does not prove source correctness.
- `revision`: our monotonic revision number for the same logical observation key, incremented only after a reviewed correction. Retry of the same captured value must not increment it.
- `methodology`: exact transformation/aggregation explanation; where the method can evolve, include a stable methodology version in the description or a future dedicated field.
- `source_url`: exact source page/API endpoint used, not merely a homepage when a claim-specific URL is available.

Before adding fields, inspect all existing insert paths and consumers. If repository-wide compatibility cannot be maintained additively, split the work into a migration and a subsequent ingestion/API change rather than combining a schema cutover with value corrections.

### Versioning and idempotency rules

1. Same logical observation key + same capture hash: idempotent no-op; preserve the existing revision.
2. Same logical observation key + materially changed source content: retain the prior row and append the next revision after review.
3. Different reporting windows or different aggregation methods: separate logical observations; do not disguise them as revisions of one value.
4. A corrected source row whose event/reporting window is unchanged should normally keep the same `observed_at` and window, then increment revision. If a provider corrects the event date/window itself, record the source correction explicitly and do not rely on the existing natural key alone to infer lineage.
5. “Latest” selection must not be a blind `MAX(observed_at)` across incompatible windows/methods. API selection must be tested against the metric's declared temporal semantics and source policy.
6. Historical corrections retain their real event/reporting time and are not marked fresh merely because they were retrieved recently.

### BTC-specific acceptance fixtures

- **ETF flow:** preserve the original +324.6 USD million/day capture; represent the reviewed +433.0 value as a later revision only if source evidence confirms the same 2026-09-18 reporting window and the project can retain both captures. Both remain historical/stale.
- **Hashrate:** reject any fixture that treats 1001 EH/s for 2026-09-04 and approximately 826 EH/s for 2026-09-19 as competing revisions of the same observation. First define whether the metric is a point estimate, daily estimate, or rolling average and store its actual window/method.
- **Supply:** reject an observation labeled circulating supply if its only reproducible input is a UTXO-set total without an approved definition/derivation. A new UTXO-set metric is an option, but must not silently overwrite the existing metric's meaning.

### Required automated tests before ingestion changes are accepted

- migration applies twice on a clean disposable PostgreSQL database;
- migration fails safely with a useful message if natural-key duplicates exist before unique-index creation;
- retrying an identical source capture creates no duplicate and does not increase revision;
- a reviewed changed capture appends a higher revision while retaining the original;
- same-day but different reporting windows/methods remain distinct;
- latest-row selection is deterministic and respects metric/window semantics;
- missing source URL, retrieval timestamp, or required period metadata fails validation for metrics that require it;
- API output exposes observation time, reporting window, retrieval time, revision, method, source URL, status and freshness without claiming a historical value is current;
- read-only Worker/VPS parity passes before any rollout decision.

### Gate order

1. Review and approve these semantics.
2. Rehearse an additive schema migration and duplicate preflight in disposable PostgreSQL.
3. Add ingestion and selection tests with synthetic fixtures; do not use synthetic values as production observations.
4. Implement the source-specific BTC adapters only after the hashrate and supply metric definitions are settled.
5. Run read-only API contract/parity checks.
6. Only then consider a separate production migration/deployment decision. No scenario-state creation is part of this gate.


## 8. Migration-runner safety finding

The repository's `scripts/migrate-neon.sh` iterates over **every** `infrastructure/neon/migrations/*.sql` file in lexical filename order and applies any file whose version marker is absent. The date in a migration filename is descriptive ordering; it is **not** a scheduling guard.

Consequences:

- The presence of `2026-10-13-eth-observation-registry-and-idempotency.sql` on a branch does not prove it has run anywhere.
- Conversely, once that file is included in a commit that is passed to `scripts/migrate-neon.sh`, it will be applied on that target database unless its `schema_migrations` marker already exists. It is not automatically held until October 13.
- The same rule applies to the Oct 11–15 BTC scenario/evidence migrations in PR #9. They are executable migrations, not inert future plans, when included in the migration set.
- Do not merge a broad migration-bearing PR merely because each file has a later date. Before any production-targeting run, review the entire migration set and the exact target/ref; require the explicitly approved migration/cutover process.
- The documented disposable PostgreSQL rehearsal is valuable, but passing it proves clean-bootstrap/re-run behavior in that disposable database only. It is not evidence of production application or production data compatibility.

This is a rollout-control finding, not a request to alter the runner or execute migrations. No migration was run by this audit.
