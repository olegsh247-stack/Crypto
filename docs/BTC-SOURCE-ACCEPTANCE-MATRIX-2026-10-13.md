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


### Follow-up — reward-stats candidate (2026-10-14)

The upstream query for `/api/v1/mining/reward-stats/:blockCount` aggregates the latest N rows marked non-stale and returns min/max heights, total reward, total fees and transaction count. It does not return the full height list, and the query alone does not establish consecutive-height coverage. The public REST summary does not define the payload's numeric units or sufficiently certify `reward` semantics. Keep this endpoint **candidate only**; fee/subsidy remains blocked until deployed-version parity, units, exact canonical height coverage, reorg handling and the protocol-subsidy denominator are verified. No ratio or method ID approved.


### Reward-stats response-schema follow-up — 2026-10-14

The REST example shows startBlock, endBlock and string-valued totalReward, totalFee and totalTx but does not specify units in the endpoint description. Reviewing the upstream model establishes that `extras.reward` is the sum of coinbase transaction outputs and `extras.totalFees` comes from Bitcoin Core block stats `totalfee`; Mempool's block UI renders both as satoshi amounts. Thus the reviewed upstream implementation treats `totalReward` as total coinbase payout (subsidy + fees) and both sums as satoshis. This is source-code evidence for that revision, not proof of public deployment parity. The aggregate query selects up to N non-stale rows and returns only min/max heights; it does not prove every height is present and consecutive. Keep this endpoint as a candidate only until deployed-version parity, exact canonical height coverage, reorg handling, and the protocol-subsidy denominator are verified. No ratio/method ID approved.

### Reward-stats continuity gate — 2026-10-14

The aggregate endpoint is insufficient as the sole continuity proof: its upstream query returns min/max heights and sums for up to N non-stale rows, but not the selected-row count or full height list. Keep it as a possible cross-check, not the canonical evidence for a fee/subsidy calculation. Prefer a reviewed block-level window with an explicit expected height set and per-height canonical hash, timestamp, reward and fees; validate gaps, duplicates, stale/canonical conflicts, units and reorg revisions. Match protocol subsidy to those exact heights. This remains a proposed capture contract, not approval of a methodology ID; no live API or database was accessed.


### DXY canonical-source review — 2026-10-16

See [BTC DXY canonical-source review](BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md). Official ICE materials identify ICE as the DXY administrator and describe controlled delivery/licensing; this review did not establish an authorized stable endpoint and permission for automated retrieval/storage. FRED series `DTWEXBGS` is a distinct Nominal Broad U.S. Dollar Index, not ICE DXY. Therefore `macro.dxy` remains blocked and neither the metric registry nor source registry is changed. An explicit choice is required: obtain authorized ICE DXY access, or deliberately redefine the product metric as a different broad-dollar index and update its contract before registration.


### ETF publication/revision/finality review — 2026-10-16

See [BTC ETF publication, revision and finality review](BTC-ETF-PUBLICATION-REVISION-FINALITY-REVIEW-2026-10-16.md). Farside documents real-time updates but the reviewed public descriptions do not establish a per-row publication timestamp, provider revision ID, correction history or finality point. TFTC documents a twice-daily sync and automatic corrections to recent and older rows, and states CC BY 4.0 reuse with attribution; its lineage varies by period (current daily aggregates/per-fund flows from SoSoValue, historical per-fund records through mid-2026 compiled in part from Farside). This improves the documented evidence but does not make TFTC canonical or prove finality. Keep the production ETF input blocked; preserve capture artifacts/hashes and source values, and keep the two-source mean research-only. No registry or production data changed.


### ETF snapshot-policy feasibility — 2026-10-16

Static inspection of the manual-only staging workflow found that raw responses, manifest and review-only candidates are uploaded as a GitHub Actions artifact with a 7-day retention period. Full-response hashes exist, but there is no durable archive guarantee, snapshot identity spanning all inputs/parser versions, or deterministic row-level diff against the previous capture. See [ETF immutable snapshot policy feasibility review](BTC-ETF-SNAPSHOT-POLICY-FEASIBILITY-REVIEW-2026-10-16.md). This path is not yet implemented or approved; no storage/retention change was made.


### Offline ETF snapshot diff — implemented, CI pending

The PR branch now contains `scripts/diff-btc-etf-snapshots.mjs` plus focused tests and runs them in the push validation job. It compares two existing capture artifact directories offline and explicitly classifies every compared row as `UNCHANGED`, `NEW`, `VALUE_CHANGED`, `ROW_MISSING`, `INCOMPLETE`, or `NOT_COMPARABLE`. The `row_results` collection contains all classifications; `changes` contains only non-unchanged rows. Prior/current row payloads are retained in the diff. Identical ETF source payload hashes across captures are reported as a same-payload no-op even when capture times differ. This does not provide durable retention or declare a provider row final. CI for the latest commit is still pending verification; no live capture was launched.


### Offline ETF snapshot diff — CI verified (2026-10-16)

The date validator was hardened to reject impossible calendar dates and a regression test was added. [BTC Public Source Staging #116](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520636) passed all three validation test steps; the capture job was skipped. [VPS API Build Rehearsal #1449](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520738) also passed. This verifies the current CI run only; provider finality, durable retention and ETF production acceptance remain unresolved. BTC remains `not_evaluable`.

### Versioned ETF snapshot manifest — implemented, CI pending (2026-10-16)

The offline tool now supports exporting a portable versioned snapshot JSON from an existing capture directory and comparing either directories or exported manifests. The manifest carries artifact hashes, source-payload fingerprint, source coverage and normalized ETF rows. Tests cover its identity/hash/coverage fields. This does not select durable storage/retention or establish provider finality; CI for this follow-up is pending. BTC remains `not_evaluable`.

### Snapshot manifest integrity — implemented, CI pending (2026-10-16)

Exported snapshot manifests now carry a canonical-content SHA-256, and loading a saved manifest validates the schema and content hash. A regression test confirms that modifying a normalized row invalidates the manifest. CI for the latest code/test commits is pending; durable retention, provider finality and ETF production acceptance remain unresolved.
