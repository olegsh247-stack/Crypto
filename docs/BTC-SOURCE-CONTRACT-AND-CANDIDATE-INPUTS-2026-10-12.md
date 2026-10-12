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


## Staging capture run and parser correction — 2026-10-12

Read-only GitHub Actions run: https://github.com/olegsh247-stack/Crypto/actions/runs/38290669941
Artifact: `btc-public-source-review`, ID `11766330405`, retention 7 days. Raw response files and `manifest.json` were uploaded as a review artifact; they were not committed to the repository and no database was accessed.

Observed run output:
- Kraken Trades returned HTTP 200. The response parser reported a latest trade price of 82,419.6 USD/BTC with source trade timestamp `2026-10-12T18:24:24.922Z`. This is a time-bounded staging observation, not a current price claim beyond that timestamp. It is not promoted into the candidate manifest or used for scenario evaluation.
- Mempool `/mining/hashrate/1w` returned HTTP 200 with 7 rows. The previous script incorrectly looked for a nested `hashrates` property even though the response was a top-level array, so it did not expose the latest series timestamp/value. This was a parser defect; the old run is not evidence that hashrate units/freshness were validated.
- Mempool `/mining/blocks/fees/1w` returned 830 rows. That response is not a matched 24-hour fee/subsidy pair and cannot support the ratio calculation. The capture now requests the 24-hour fee and reward endpoints separately, records their response shapes, and explicitly leaves ratio derivation blocked pending unit/window reconciliation.
- Farside returned HTTP 403 in the runner, so no new ETF rows were accepted from it.
- The TFTC JSON candidate endpoint returned HTTP 200 and 705 rows. This is an unapproved mirror, not a canonical source; it remains excluded from accepted inputs until source lineage, licence/terms, date semantics, revisions and missing-value handling are reviewed.
- DXY remains blocked pending a licensed/approved source.

The capture script was corrected to parse the top-level hashrate array, expose source observation timestamps and explicit unit conversion, capture matched-window fee and reward components separately, and distinguish raw capture from input validation. A successful staging workflow means the HTTP responses were collected; it does **not** mean that the required BTC inputs passed readiness.

## Updated gate

No scenario evaluation is authorized. Spot price has one auditable staging observation at the stated timestamp, but hashrate semantics still require review; fee/subsidy ratio remains uncalculated; ETF flow is not currently accepted; and DXY remains unresolved. No database writes, migrations, scenario-state writes, monitoring changes, production deployment or merge were performed by the staging workflow.


### Corrected staging capture — run 7

Run: https://github.com/olegsh247-stack/Crypto/actions/runs/38299519815
Artifact: [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38299519815/artifacts/11769702814), ID `11769702814`, retention 7 days.

The first run after parser changes (run 6) exposed that the hashrate response shape can differ between requests and that Farside is blocked from the GitHub runner. The capture was adjusted so unknown hashrate schemas are recorded as unvalidated evidence, HTTP-blocked responses are preserved as `BLOCKED_HTTP`, and known external-source blocks do not make the capture workflow itself fail. Run 7 completed successfully.

Run 7 reported:
- Kraken: `82,658.4 USD/BTC`, source trade time `2026-10-12T19:43:28.221Z`, response SHA-256 `160d0516f32aac0872377b919fede0206498eba89cf67cc70ce576742c7bad6c`. The value is a captured observation at that timestamp only; it has not been written to the candidate manifest or database.
- Mempool hashrate: `1,028.5948763981921 EH/s`, source series timestamp `2026-10-12T00:00:00.000Z`, response SHA-256 `b669c2da52aa006f09bcfb2884b7438101041a3dc3b479d4ebfd0c30129ddf62`. The endpoint is a 1-week aggregation. The numeric conversion was parsed, but aggregation/bucket semantics and metric comparability remain to be confirmed before acceptance.
- Mempool fee series: 157 rows, response SHA-256 `b31de40af7e41a6fc29683e88883aa64e810d4570b035ab789f6fe0f5c9d7934`.
- Mempool reward series: 158 rows, response SHA-256 `5264e3d033d1dd5c3095a1233e6e029eddf7fff92c2b017237b1df89d239fdb3`. Different row counts mean a common time/block window is not established. No fee/subsidy ratio was calculated.
- Farside: HTTP 403; response body and fingerprint preserved, but no ETF value accepted.
- TFTC: 705 rows captured, response SHA-256 `dd2168e41af07cbeab4bc263bf3cbfd88152a5312486f20d4a6fa3ba3230b87e`. Still an unapproved mirror, excluded from canonical inputs.

The workflow's green result means the read-only capture and artifact upload completed. It is **not** a data-readiness pass. All raw payloads remain in the short-retention Actions artifact, not committed to the repository. No production database, scenario state or monitoring state was touched.

### Gate after run 7

The source-capture mechanism is now operational and yields timestamped, fingerprinted evidence. The BTC input gate remains **BLOCKED**: hashrate aggregation semantics need confirmation; fee/reward series windows and units are not reconciled; Farside is blocked from the runner and TFTC is not approved as canonical; DXY still lacks a confirmed licensed feed; and the ETF 36-hour freshness requirement is unmet. No scenario evaluation is authorized.

### Matched fee/reward reconciliation — run 7 artifact review

The retained run 7 artifact was downloaded and inspected read-only. This corrects the earlier preliminary note that the differing row counts alone meant a common window was not established. The two endpoints returned 157 fee rows and 158 reward rows, but their records can be reconciled by `avgHeight`:

- 157 shared `avgHeight` keys, from 970974 through 971130.
- All 157 matched keys have exactly equal source timestamps between fee and reward records.
- One reward-only record exists at `avgHeight=970973`; it is outside the fee series and is excluded. No records are paired by array position.
- For every matched row, `avgRewards - avgFees = 312,500,000` raw units. This is consistent with the 3.125 BTC block subsidy and a satoshi-scale payload, although the API endpoint summary does not explicitly specify units; retain that as a unit-contract check rather than silently assuming it.
- Using the same 157 matched rows, the reproducible read-only candidate is:

  `sum(avgFees) / sum(avgRewards - avgFees) = 0.005535490996178344` (about `0.5535491%`).

- Latest matched source timestamp: `2026-10-12T19:13:30Z`. The raw fee and reward response fingerprints remain `b31de40af7e41a6fc29683e88883aa64e810d4570b035ab789f6fe0f5c9d7934` and `5264e3d033d1dd5c3095a1233e6e029eddf7fff92c2b017237b1df89d239fdb3`, respectively.

Mempool's official REST documentation describes these endpoints as average total fees and average block rewards over the requested trailing period: https://mempool.space/docs/api/rest. The matched-height/timestamp join and constant inferred subsidy provide a coherent derivation candidate. **The ratio is still not promoted to an accepted scenario input** until raw-unit semantics and the exact canonical calculation contract are confirmed. It was not written to the database and has not been used in scenario evaluation.

This finding narrows the blocker: fee/reward data are no longer simply “unmatched”; a matched candidate can be reproduced. Remaining checks concern explicit unit semantics and acceptance into the canonical input contract.
