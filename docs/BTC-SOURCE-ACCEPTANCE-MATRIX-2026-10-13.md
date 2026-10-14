# BTC Source Acceptance Matrix — 2026-10-13

**Scope:** BTC only; refreshed read-only public-source captures and a validated block-window candidate.  
**Mode:** source review and dry-run only. No production database connection or writes.  
**Decision:** **zero inputs approved for production ingestion**. Candidate calculations are reproducible evidence, not accepted observations.

## Canonical metric contracts

| Metric ID | Canonical source priority | Unit | Maximum age | Current decision |
|---|---|---|---:|---|
| `market.spot_price` | `market.kraken` | `USD/BTC` | 1 hour | **Candidate only:** fresh trade; target runtime source registration/adapter must be rechecked read-only |
| `security.hashrate` | `network.primary` | `EH/s` | 48 hours | **Candidate only:** UTC daily bucket semantics verified against pinned upstream source; target runtime source registration still needs recheck |
| `security.fee_subsidy_ratio` | `network.primary` | `ratio` | 48 hours | **Candidate only:** completed UTC-day calculation validated; canonical acceptance remains pending |
| `institutional.etf_net_flow` | `institutional.primary` (Farside) | `USD million/day` | 36 hours | **Candidate only:** 12 Oct row reconciles to TFTC's displayed precision; observation/publication-time and freshness semantics unresolved |
| `macro.dxy` | `macro.primary` | `index` | 48 hours | **Blocked:** generic source ID does not identify a canonical DXY feed |

The metric registry already specifies `frequency: 1d` for `security.fee_subsidy_ratio`. This review recommends a completed UTC calendar day as the persisted observation window and keeps the rolling 144-block value diagnostic-only. No registry priority, observation, monitoring state, scenario state, score, probability, or snapshot was changed.

## Per-input decisions

### 1. Spot price — Kraken

- Latest trade candidate: **83,588.10 USD/BTC** at `2026-10-13T15:26:08.170Z`.
- Retrieval time: `2026-10-13T15:26:13.228Z`; age at retrieval: about 5.1 seconds.
- Pair key: `XXBTZUSD`; requested pair: `XBTUSD`; 1,000 trade rows; HTTP 200.
- Raw-body SHA-256: `366489edb7a76a768c51ca9f5d9066c0b865506b26ed8801d88d08d633206fe3`.
- **Hold:** the last database audit found `market.kraken` absent from the live `sources` table. The repository registry/seed does not prove the target runtime is updated.
- **Acceptance gate:** fresh read-only target-runtime source registry/adapter verification, then re-run source, unit, freshness and idempotency checks.

### 2. Network hashrate — Mempool.space

- Latest series value: **999.342299 EH/s**, raw field converted from hashes/second.
- Series timestamp: `2026-10-13T00:00:00Z`; this labels the completed window `2026-10-12T00:00:00Z` to `2026-10-13T00:00:00Z`, end-exclusive.
- Endpoint: [`/api/v1/mining/hashrate/1w`](https://mempool.space/api/v1/mining/hashrate/1w); HTTP 200; seven points.
- Raw-body SHA-256: `379aa3569f6b1841f1445463936abd22ac7efcbaa2900929896d74823bf8c764`.
- The pinned upstream implementation at [commit 7e790680](https://github.com/mempool/mempool/blob/7e79068004e97ecc73415f4c0b1a5aeab347faa0/backend/src/api/mining/mining.ts) confirms that the estimate is calculated from the preceding 24-hour UTC block window and timestamped at its end-exclusive UTC midnight. Do not substitute `currentHashrate` for this dated series.
- **Hold:** target runtime source/adapter verification and candidate acceptance remain outstanding.

### 3. Fee/subsidy ratio — Mempool.space block data

- Validated 330 contiguous blocks: heights `970932–971261`, fetched over 22 pages. All returned HTTP 200; raw page hashes match the manifest; unchanged tip anchor; no missing/duplicate heights or hashes; timestamp checks passed.
- Completed UTC day: **2026-10-12**, window `00:00:00Z` inclusive to `2026-10-13T00:00:00Z` exclusive.
- Included blocks: 152, heights `971006–971157`; fees **286,069,738 sats**; expected subsidy over those same blocks **47,500,000,000 sats**.
- Candidate ratio: **0.0060225208** (about 0.602252%).
- Rolling 144-block diagnostic: **0.0057881996**. It is not the recommended persisted observation window because the metric registry specifies `frequency: 1d`.
- The pinned upstream [block API implementation](https://github.com/mempool/mempool/blob/7e79068004e97ecc73415f4c0b1a5aeab347faa0/backend/src/api/blocks.ts) sets `extras.reward` from coinbase outputs and `extras.totalFees` from block statistics; the frontend treats both as satoshis. The invariant `reward - totalFees = expected subsidy at block height` passed for all 330 blocks.
- **Hold:** the calculation is reproducible, but the UTC-day contract still needs canonical acceptance across metric/source/monitoring documentation and a fresh target-runtime read-only source check.

### 4. US spot BTC ETF net flows — Farside / TFTC

- Farside returned HTTP 200 in the latest capture; the 12 Oct 2026 session total is **−65.4 USD million**.
- TFTC JSON returned HTTP 200 and reports **−65.401 USD million** for 12 Oct, matching Farside's displayed one-decimal precision. TFTC lineage combines multiple sources and remains an unapproved mirror; it is not added to canonical source priority.
- Farside 13 Oct row has dashes across fund columns and a displayed `0.0` total. Treat it as an unreported/placeholder row, **not a confirmed zero**.
- Farside's row date is available, but a defensible publication timestamp is not established by this capture. The 36-hour freshness gate cannot be certified from the date alone.
- **Hold:** define the session-date-to-observation-time rule and 36-hour evaluation convention; preserve Farside as canonical source priority unless a separate reviewed decision changes it.

### 5. DXY — US Dollar Index

- The metric registry points to `macro.primary`, described generically as Treasury/Federal Reserve/BLS rather than a specific DXY endpoint.
- No canonical feed, stable endpoint or daily-close/observation-time convention is approved.
- **Blocked:** do not substitute a broad trade-weighted USD index or mix vendor quotes.

## Dry-run disposition

The preliminary staging manifest is [`BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json`](data-review/BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json). It compares candidates against the last available read-only database audit from 2026-10-12, **not a fresh live database read**.

| Candidate | Preliminary disposition |
|---|---|
| Kraken spot price | Hold: live `market.kraken` registration/adapter unverified |
| Daily hashrate | Hold: UTC window semantics verified; target-runtime source check required |
| Daily fee/subsidy ratio | Hold: reproducible candidate; canonical contract acceptance required |
| 12 Oct ETF flow | Hold: observation-time/freshness rule unresolved |
| DXY | Blocked: no canonical source |

**Result: zero ready-for-insert candidates; zero inserts/updates/deletes.** Before any ingestion review, perform a fresh read-only audit of the actual target database and rerun the dry-run diff. The previous duplicate audit identified nine duplicate logical-key groups (18 rows); those historical rows remain untouched.

## Common acceptance rules

1. Use a canonical `metric_id` and registered `source_id`; retain the HTTPS endpoint.
2. Validate numeric value and exact canonical unit.
3. Preserve source observation time or exact aggregation window separately from retrieval time.
4. Retain raw payload or immutable artifact, SHA-256, retrieval time, method, and source row identity.
5. Evaluate metric-specific freshness at the actual acceptance time; do not silently fall back to older rows.
6. Define revision behavior and an idempotency key based on the logical observation window, not fetch time.
7. Produce a dry-run diff classifying inserts, no-ops, conflicts and rejected candidates. Do not delete or rewrite history blindly.

## Final disposition

- BTC remains **`not_evaluable`**.
- No candidate is approved for production ingestion.
- No observation, historical row, scenario state, monitoring event, published probability, or research snapshot was changed.
- The next gate is a fresh read-only target-database audit plus resolution of source registration, ETF timestamp/freshness, and DXY source contract. Scenario evaluation remains offline-only until required inputs and rules pass review.

## Evidence

- [BTC UTC-Day Candidate Review](BTC-UTC-DAY-CANDIDATE-REVIEW-2026-10-13.md)
- [BTC Public-Source Refresh](BTC-PUBLIC-SOURCE-REFRESH-2026-10-13.md)
- [BTC Source Contract and Controlled Input Refresh](BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md)
- [BTC Monitoring Readiness Matrix](BTC-MONITORING-READINESS-MATRIX.md)
- [Canonical metric registry](../data/CryptoDataModel/registry/metric-registry.json)
- [Canonical source registry](../data/CryptoDataModel/registry/source-registry.json)


## CI and readiness-gate verification — 2026-10-13

After the selective PR reconciliation, the docs-only head completed both PR-triggered checks successfully:

- [VPS API Build Rehearsal #857](https://github.com/olegsh247-stack/Crypto/actions/runs/38447537476) — **success**. Worker/API builds and response-contract tests passed; disposable PostgreSQL bootstrap/migrations, canonical BTC input registry, read-only provenance audit, idempotency/duplicate rehearsal, backup/restore, API contracts, worker ingestion, evidence/snapshot lineage, history/candle finalization and admin boundary E2E all passed.
- [BTC Block Window Validation #36](https://github.com/olegsh247-stack/Crypto/actions/runs/38447537716) — **success**. Syntax and deterministic validation tests passed. Live capture steps were skipped for this PR-triggered run, so this is not a new live-source capture.

The readiness implementation on main was also inspected. It requires current, traceable observations with exact units and registered sources for spot, hashrate, fee/subsidy and DXY; ETF requires a latest observation within 36 hours plus at least five distinct daily observations within the 14-day history window. It returns not_evaluable on blockers and explicitly sets can_persist_scenario_state: false; it does not calculate a probability or write state. This matches the intended fail-closed boundary.

**What CI does not prove:** the PostgreSQL instance is disposable and created by the workflow. It does not establish current contents of the external target/legacy database, its live sources table, or production endpoint freshness. The last target database audit remains 2026-10-12 18:20 UTC; no fresh target read was available in this run.

**Decision unchanged:** zero BTC candidates accepted for ingestion; scenario remains not_evaluable; no production or target DB access/writes. Next action remains source/metric acceptance and, when an approved read-only target path exists, a fresh target source-registry/adapter audit followed by a no-write staging diff.

## 2026-10-14 — live page recheck

- Farside now displays 2026-10-13 total **+109.8 USD million**, but the IBIT constituent cell is `-` while other constituent cells contain values.
- Treat this as an incomplete/unconfirmed session row, not a complete daily flow observation. Do not accept the displayed total until source completeness/finalization is established.
- The public page was retrievable on 2026-10-14, but this proves only retrieval date; it does not establish the source publication timestamp required by the 36-hour freshness gate.
- Decision remains **candidate only / hold**. The 2026-10-12 −65.4m row still matches TFTC to displayed precision, but TFTC remains an unapproved mirror and is not a canonical fallback.
