# BTC Source Acceptance Matrix — 2026-10-13

**Scope:** BTC only; repository registry review of the public capture dated 2026-10-12.  
**Mode:** documentation and source-contract review only. No database connection, ingestion, historical-row changes, scenario evaluation, or monitoring writes.  
**Decision:** **no input is approved for production ingestion by this review.** The source captures are evidence candidates, not accepted observations.

## Registry cross-check

Reviewed:
- `data/CryptoDataModel/registry/metric-registry.json`
- `data/CryptoDataModel/registry/source-registry.json`
- `docs/BTC-SOURCE-CAPTURE-REVIEW-2026-10-13.md`
- `docs/BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md`

The metric registry currently defines these required contracts:

| Metric ID | Canonical source priority | Unit | Maximum age | Capture review decision |
|---|---|---|---:|---|
| `market.spot_price` | `market.kraken` | `USD/BTC` | 1 hour | **Candidate only** |
| `security.hashrate` | `network.primary` | `EH/s` | 48 hours | **Blocked pending explicit daily-bucket/aggregation method approval** |
| `security.fee_subsidy_ratio` | `network.primary` | `ratio` | 48 hours | **Blocked pending versioned numerator/denominator/window method approval** |
| `institutional.etf_net_flow` | `institutional.primary` (Farside) | `USD million/day` | 36 hours | **Blocked: canonical source unavailable in capture runner** |
| `macro.dxy` | `macro.primary` | `index` | 48 hours | **Blocked: source ID is too generic to establish a canonical DXY feed** |

## Per-input decisions

### 1. Spot price — Kraken

- Captured endpoint returned HTTP 200 with 1,000 trade rows.
- Captured candidate: 82,840.20 USD/BTC at 2026-10-12 21:37:38.772 UTC; pair key `XXBTZUSD`.
- Repository source ID `market.kraken` exists, and the metric registry selects it.
- The trade timestamp is source-provided, not the retrieval timestamp. Preserve the raw response hash and exact pair key.
- **Not accepted:** the capture is now older than the metric's one-hour freshness budget. The live production `sources` registry and runtime adapter have also not been independently verified.
- **Acceptance gate:** obtain a new capture; validate positive price, pair normalization, source-provided trade time, HTTPS source URL, registered source ID, raw payload hash, retrieval time, and idempotency identity. Recheck the production registry only through an explicitly approved read-only audit.

### 2. Network hashrate — Mempool.space

- Captured endpoint returned HTTP 200 with seven daily series points.
- Latest captured point: 1,028.594876 EH/s with timestamp `2026-10-12T00:00:00Z`. Reviewed upstream implementation constructs the daily estimate for `[2026-10-11T00:00:00Z, 2026-10-12T00:00:00Z)`, so that timestamp is the **end boundary** of the preceding UTC day, not its start.
- The value is an estimate based on the blocks in that 24-hour interval; separate `currentHashrate` is based on the most recent 1,008 blocks and is not interchangeable.
- **Still blocked:** public service's deployed version has not been pinned to the reviewed upstream code; the captured observation is historical and needs a fresh capture before acceptance.
- **Acceptance gate:** confirm deployed endpoint parity, preserve `period_start` and `period_end` explicitly, convert raw hashes/s to EH/s, check freshness at acceptance time, and use a stable key for the represented UTC day.

### 3. Fee/subsidy ratio — Mempool.space

- The captured fees endpoint returned `avgHeight`, `timestamp`, `avgFees`, and optional `USD` fields.
- Upstream implementation review confirms each row is an average grouped by fixed-duration time bucket: `avgFees = AVG(fees)`, `avgHeight = AVG(height)`, and `timestamp = AVG(blockTimestamp)` for that bucket. It is not one row per block, and `avgHeight` is not an exact block boundary.
- **Not accepted:** the time-bucket aggregate cannot directly support a ratio over 144 blocks. No ratio has been calculated.
- **Next candidate for review:** `/api/v1/mining/reward-stats/144`, whose upstream implementation aggregates the most recent 144 non-stale block rows. Verify deployed response fields/units, exact height continuity, meaning of total reward, reorg handling, and the subsidy denominator before approving any methodology or changing endpoint allowlists.

### 4. US spot BTC ETF net flows — Farside / TFTC candidate

- Metric registry selects `institutional.primary` (Farside) with a 36-hour latest-row freshness budget.
- Farside returned HTTP 403 in the capture runner. An HTTP failure is not zero flow and does not authorize a fallback by itself.
- TFTC returned HTTP 200 and reports data only through 2026-10-09. Its lineage combines sources, its publication timestamp/revision semantics remain unclear, and the five-session sum differs from Farside's displayed rounded totals by approximately USD 2.2 million.
- TFTC's `institutional.tftc` ID is registered in repository data but is **not** in the metric's canonical `source_priority`; it must not be silently promoted.
- **Not accepted:** the TFTC series is stale for the 36-hour gate at capture time and remains an unapproved fallback. Do not create a 2026-10-12 zero from dashes/placeholders.
- **Acceptance gate:** either obtain a defensible current Farside capture or formally review TFTC lineage, row-level source/date semantics, revision behavior, missing/dash handling, discrepancy policy, licensing/attribution, and canonical-priority change. Require five distinct completed trading dates with provenance and a valid current latest row.

### 5. DXY — US Dollar Index

- Metric registry points to `macro.primary`, whose description covers Treasury/Federal Reserve/BLS and does not identify a specific DXY feed.
- The capture review found differing vendor values and no approved observation-time convention.
- **Blocked:** a broad USD index or an unreviewed vendor quote is not an acceptable substitute.
- **Acceptance gate:** select a specific source and stable endpoint, register its exact identity, define daily close/time zone and publication semantics, preserve the source timestamp, and reconcile differences before setting the canonical metric source.

## Common acceptance rules

A candidate can be promoted only after all checks below pass:

1. Canonical `metric_id` and registered `source_id`; HTTPS source URL.
2. Numeric value and exact canonical unit, matching both the observation contract and metric registry.
3. Actual source observation time or defined aggregation window in UTC, separate from retrieval time.
4. Retrieval timestamp, endpoint/method, raw response or immutable artifact reference, and content hash.
5. Metric-specific freshness check at evaluation time; invalid latest data must block readiness rather than silently fall back to older rows.
6. Exact approved source identity and endpoint URL for each metric, in addition to generic registry membership and HTTPS. A registered fallback or unrelated HTTPS URL is not canonical until source priority and endpoint semantics are reviewed and changed.
7. Defined revision behavior and a deterministic logical observation key based on the source's actual observation window, not fetch time.
8. Duplicate audit and dry-run diff that classifies inserts, no-ops, conflicting revisions, and rejected candidates. Do not delete or rewrite historical rows during this review.

## Disposition and next action

- The readiness implementation now fails closed on unapproved source IDs, endpoint URLs, and unapproved calculation methods. Hashrate and fee/subsidy remain blocked until their methods are explicitly approved; the raw fee endpoint is not itself a ratio. It also rejects non-positive spot prices. `institutional.tftc` cannot pass as an ETF substitute; a correct ID paired with an unrelated HTTPS URL is also rejected. DXY remains blocked because no specific source ID/endpoint has been approved. The generic `macro.primary` source is not accepted as a DXY feed.
- Current BTC dataset remains **`not_evaluable`**.
- No source capture in this review is approved for production ingestion.
- No observation, snapshot, scenario state, monitoring event, published probability, or historical row may be changed based on this document.
- Next: refresh only the candidates whose capture can be repeated safely; resolve endpoint semantics and the DXY source contract; then prepare a review-only candidate manifest and dry-run diff. Recheck the production source registry only with a separate read-only audit. Scenario evaluation remains offline-only until inputs and rules independently pass review.

## Evidence

- [BTC Public Source Capture Review — 2026-10-13](./BTC-SOURCE-CAPTURE-REVIEW-2026-10-13.md)
- [BTC Source Contract and Controlled Input Refresh v1](./BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md)
- [Canonical metric registry](../data/CryptoDataModel/registry/metric-registry.json)
- [Canonical source registry](../data/CryptoDataModel/registry/source-registry.json)
