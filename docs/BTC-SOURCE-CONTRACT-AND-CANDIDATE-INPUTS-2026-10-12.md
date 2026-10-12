# BTC Source Contract and Candidate Input Snapshot — 2026-10-12

## Purpose and safety boundary

This note closes only the parts of the BTC source contract that can be verified from the canonical registry and public source documentation, and records a read-only candidate snapshot for ETF flows. It does not insert or update observations, reconcile the production database, evaluate a scenario, persist scenario state, or authorize deployment.

Snapshot review date: 2026-10-12. The source page itself identifies the current date as 12 October 2026.

## Canonical contracts in the repository

The metric registry is `data/CryptoDataModel/registry/metric-registry.json` (registry version 1.0.0, asset scope BTC). The source registry is `data/CryptoDataModel/registry/source-registry.json` (version 1.0.2).

| Metric | Canonical unit | Freshness window | Registered source | Contract / unresolved point |
|---|---|---:|---|---|
| `market.spot_price` | `USD/BTC` | 1h | `market.kraken` | Use Kraken public Trades endpoint for an actual trade timestamp and price; normalize raw XBT pair notation to BTC while preserving the raw pair and response. A ticker response alone does not supply a trustworthy observation timestamp. |
| `security.hashrate` | `EH/s` | 48h | `network.primary` (Mempool.space) | Use a documented network hashrate endpoint and preserve its averaging period. Do not label a trailing-period average as an instantaneous measurement. Confirm returned unit/scale before conversion to EH/s. |
| `security.fee_subsidy_ratio` | `ratio` | 48h | `network.primary` | Must be derived from explicitly recorded fee and subsidy components over the same block/time window. Preserve numerator, denominator, window and formula version; do not treat a ratio with an unknown window as equivalent. |
| `institutional.etf_net_flow` | `USD million/day` | 36h | `institutional.primary` (Farside Investors) | Source table reports daily totals in US$ millions. Source date is the observation period, not the time the page was fetched. Blank/unreported fund cells must remain missing, never be converted to zero. |
| `macro.dxy` | `index` | 48h | `macro.primary` | **Contract unresolved.** The source registry describes Treasury/Federal Reserve/BLS generically, but does not identify an authoritative DXY series/endpoint. Do not silently substitute a broad trade-weighted dollar index for DXY. Select and document an exact licensed/authoritative source or explicitly revise the metric definition and methodology before using it. |

Source references:
- Kraken public market-data endpoint documentation: https://support.kraken.com/hc/articles/360000919986-public-endpoint-examples-you-can-try-them-directly-in-a-web-browser-
- Mempool.space REST API documentation: https://mempool.space/docs/api/rest
- Farside Bitcoin ETF flow table: https://farside.co.uk/btc/

## Read-only ETF candidate snapshot

Values below are transcribed from the Farside table's **Total** column. Unit: USD million per US trading day. Parentheses in the source indicate negative flows. The source's date column is retained as the period date.

| Period date | Net flow (USD million/day) | Source status |
|---|---:|---|
| 2026-09-28 | 31.0 | Reported |
| 2026-09-29 | 66.2 | Reported |
| 2026-09-30 | -148.7 | Reported |
| 2026-10-01 | 102.7 | Reported |
| 2026-10-02 | 189.9 | Reported |
| 2026-10-05 | -89.8 | Reported |
| 2026-10-06 | 118.8 | Reported |
| 2026-10-07 | -484.9 | Reported |
| 2026-10-08 | -244.1 | Reported |
| 2026-10-09 | 21.1 | Reported |
| 2026-10-12 | **not reported** | Source row exists, fund cells are blank and total displays 0.0; reject as a placeholder, not a measured zero |

The source table's latest reported trading-day observation is 2026-10-09. On the 2026-10-12 review, that period date is older than the metric registry's 36-hour freshness window. The 2026-10-12 row is not a valid replacement because the source shows no fund-level reports. Therefore the latest ETF-flow input is **not eligible for the current scenario-readiness gate** at this snapshot.

There is one source row per listed period date in the inspected table; the candidate series above has no repeated period dates. This is a source-page check only, not a database duplicate audit. The source's published daily totals are retained as-is; no source values have been inserted or modified.

## Input acceptance checklist before any write

For each candidate observation, require all of the following:
1. Registered `source_id` and canonical source URL.
2. Explicit source period/date and a separate retrieval timestamp.
3. Numeric value parsed without treating blanks, dashes or placeholders as zero.
4. Canonical unit and, where conversion is needed, a recorded deterministic conversion.
5. Source revision/raw payload or a stable content fingerprint sufficient for audit.
6. Duplicate key policy: asset + metric + period start (and provider/source where required), with revision/update behavior explicitly decided.
7. Freshness checked against the metric registry at evaluation time, not guessed from fetch time.
8. Read-only preview/diff reviewed before any database write.

## Current decision

- ETF historical rows above are candidate evidence only; do not insert them automatically.
- ETF latest value fails the 36-hour gate at this review.
- DXY source contract remains open and blocks the scenario input contract.
- Spot price, hashrate and fee/subsidy ratio still need actual timestamped, source-linked payloads validated against their canonical units and freshness windows.
- Do not calculate scenario probabilities, write scenario state, update monitoring timestamps, or touch production until all required inputs pass and the user explicitly approves any write operation.

## Follow-up verification — 2026-10-12

### DXY source decision

The exact named benchmark is ICE U.S. Dollar Index (symbol DXY), administered by ICE Data Indices. ICE documents intraday, daily, delayed and historical delivery through its licensed products, including ICE Data API and ICE Data Files:
- Official product/specification: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices
- ICE licensing information: https://www.ice.com/iba/about

This resolves the identity of the benchmark, but **does not resolve permission or a usable endpoint for this project**. ICE describes licensed delivery and requires an appropriate licence for use/redistribution of its benchmarks. No ICE credential, licence, or approved feed is established in the repository. Therefore DXY remains blocked for automated ingestion; do not scrape a chart, infer a value from futures, or silently replace DXY with a different dollar index. To close the contract, either establish permitted access to the exact DXY series or explicitly approve a metric/methodology change.

### Actual payload validation status

The public endpoint documentation supports the intended adapter design:
- Kraken Trades endpoint: https://api.kraken.com/0/public/Trades?pair=XBTUSD — trade rows include individual prices and Unix timestamps; preserve raw pair, raw response and selected trade timestamp.
- Mempool hashrate endpoint: https://mempool.space/api/v1/mining/hashrate/1m — preserve the source's period/aggregation and response timestamps; do not label a period average as an instantaneous measurement.
- Mempool fee series: https://mempool.space/api/v1/mining/blocks/fees/24h
- Mempool reward series: https://mempool.space/api/v1/mining/blocks/rewards/24h

The API JSON response bodies were not captured in an auditable form during this verification. Consequently **no current spot price, hashrate, or fee/subsidy ratio is accepted into the candidate package**. The endpoint URLs and their documentation are not substitutes for the raw observations. No value or retrieval timestamp has been fabricated. For the ratio, collect fee and total reward observations for the same 24-hour window, retain both components and calculate fees / (total_reward - fees); reject the result if the source windows, units, or timestamps cannot be reconciled.

### Candidate snapshot manifest and duplicate policy

The companion file data/CryptoDataModel/candidates/btc-input-snapshot-2026-10-12.json is an explicitly incomplete, read-only manifest. It includes only the transcribed ETF daily totals and marks raw payload fingerprints/retrieval timestamps as unavailable where they were not captured. Missing required inputs remain missing; the file is not an ingestion payload and must not be applied to a database.

Duplicate review remains bounded to available evidence:
- The Farside page rows listed above have one row per period date in the inspected table.
- This is not a live database duplicate audit. The earlier repository audit identified 9 logical-key duplicate groups (18 rows); none is deleted or reconciled by this work.
- Candidate logical key: asset_id + metric_id + source_id + period_start. Same-key identical payloads should be classified as exact duplicates; same-key differing values or fingerprints are revisions/conflicts requiring explicit review, never silent overwrite.
- A source correction must preserve the prior revision and record the revised source value/fingerprint and retrieval time. A blank/unreported source cell is a missing observation, not zero.

### Gate result

As of this review, the BTC input contract is **not complete**: current timestamped Kraken/Mempool payloads have not been captured and validated; DXY access is not licensed/confirmed; and the latest reported Farside flow remains outside the 36-hour freshness gate. Therefore there is no complete candidate input set and no scenario evaluation should run yet. No database writes, migrations, scenario-state writes, monitoring changes, production deployment, or merge were performed.
