# BTC Source Contract and Controlled Input Refresh v1

**Review date:** 2026-10-12  
**Asset:** BTC  
**Research snapshot:** \`BTC-2026-10-07-v1\`  
**Status:** source contract defined; candidate refresh reviewed; **not approved for production ingestion**  
**Safety boundary:** this document is a review artifact. It does not write observations, change historical rows, create scenario states/events, or change published probabilities.

## 1. Required observation contract

Every observation submitted for review must contain:

- \`asset_id\` = \`btc\`;
- canonical \`metric_id\` from the registry (no ad-hoc metric IDs);
- numeric value and explicit canonical unit;
- \`observed_at\` in ISO-8601 UTC, representing the actual observation time/window, not the page-fetch time;
- \`source_id\` that already exists in the \`sources\` registry and \`source_url\` using HTTPS;
- freshness status derived at ingestion time from the canonical metric registry;
- source publication/update time where available, retrieval time, method/window, revision/raw-row identity;
- idempotency key based on the metric's logical observation window, not retrieval time.

Do not manufacture an observation timestamp from a web page's crawl time. Do not treat missing, dash, placeholder, or unreported values as numeric zero. Preserve source payloads and review metadata so that a candidate can be reproduced.

## 2. Canonical metric contract and gates

The freshness gates below are aligned to \`data/CryptoDataModel/registry/metric-registry.json\`, rather than looser scenario-specific limits.

| Metric ID | Unit | Registry freshness window | Additional acceptance rule |
|---|---|---:|---|
| \`market.spot_price\` | \`USD/BTC\` | 1 h | One named exchange/pair and actual timestamp; never average unrelated exchange quotes into a synthetic point |
| \`security.hashrate\` | \`EH/s\` | 48 h | Store source's raw daily estimate and documented aggregation; distinguish daily estimate from rolling mean |
| \`security.fee_subsidy_ratio\` | \`ratio\` | 48 h | Value must state numerator, denominator, block/window range and calculation version; one 144-block point is context, not a validated rolling trend |
| \`macro.dxy\` | \`index\` | 48 h | One selected provider and defined daily close/time convention; reconcile materially conflicting vendor values before acceptance |
| \`institutional.etf_net_flow\` | \`USD million/day\` | 36 h | At least five distinct recent trading dates; latest source row must be valid/current; dashes or a placeholder total are not zero |

For every metric, the observation's \`unit\` must match both the required canonical unit and \`metric_definitions.default_unit\`. The source ID must be registered. Invalid latest observations block readiness; they must not be bypassed by silently falling back to older rows.

### Registry audit finding — blockers remain

The repository registry has now been inspected directly:

- `security.hashrate` and `security.fee_subsidy_ratio` point first to registered `network.primary` (Mempool.space); the exact endpoint, aggregation window and stored-method mapping still need to be confirmed.
- `institutional.etf_net_flow` points to registered `institutional.primary` (Farside Investors), but a parser/reconciliation contract is still required.
- `market.spot_price` points to `market.kraken` in the metric registry and the source registry. A repository audit found that `infrastructure/postgres/seed-v1.sql` had not seeded this source, so a clean database could reject Kraken observations as unregistered. The seed now includes `market.kraken` with the public Trades endpoint for `XBTUSD`; this is a repository-only correction and does not alter any deployed database. The actual production `sources` table and adapter still require independent verification. Preserve the raw trade payload and convert Kraken's returned trade epoch timestamp to UTC.
- `macro.dxy` currently points to generic `macro.primary` (Treasury/Federal Reserve/BLS) rather than a specific registered DXY data endpoint and close-time convention. This input is **blocked by source specificity**.
- The canonical metric registry defines freshness windows of 1 h, 48 h, 48 h, 48 h and 36 h for the five gates respectively. The readiness implementation and SQL audit have been aligned to those windows. For ETF history, the latest observation must pass the 36-hour gate; the five-session sample is validated as a traceable 14-day historical series, not by requiring every historical day to remain a fresh latest observation.

Kraken's BTC/USD source selection is explicit in the repository registry, but no live trade has been staged from the API and the database registry/adapter remain unverified. No DXY vendor has been selected because its endpoint and observation-time convention remain unresolved.

## 3. Candidate refresh review — 2026-10-12

These are source-review candidates only. They have **not** been inserted into the database. The five ETF session values are also captured in the reproducible review artifact [`docs/data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json`](data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json); it deliberately leaves `observed_at` null until a defensible publication/observation timestamp is confirmed.

| Metric | Candidate evidence found | Source / timestamp semantics | Decision |
|---|---|---|---|
| BTC spot price | A public ChartExchange page showed a composite BTCUSD quote on 12 Oct, but this is not the selected venue and is not an auditable raw trade record | [ChartExchange BTCUSD history](https://chartexchange.com/symbol/crypto-btcusd/historical/). The selected venue is Kraken, using the [public Trades endpoint](https://api.kraken.com/0/public/Trades?pair=XBTUSD), which returns individual trade prices and Unix timestamps. | **Hold** until a raw Kraken response is fetched and the newest trade timestamp, pair key, price, and response are recorded. Do not substitute a page timestamp. |
| US spot BTC ETF flows | Farside lists completed-session totals: 5 Oct −89.8m, 6 Oct +118.8m, 7 Oct −484.9m, 8 Oct −244.1m, 9 Oct +21.1m USD million. Sum = −678.9m across five distinct sessions. | [Farside Investors BTC ETF flows](https://farside.co.uk/btc/), page reviewed 2026-10-12. The 12 Oct row shows dashes across funds and a displayed total of 0.0; this is a placeholder/unreported session, **not a confirmed zero flow**. | **Historical candidate series only**: retain the five completed trading dates with source provenance. The latest confirmed row is 9 Oct and fails or is likely to fail the 36 h gate at the current review time; no 12 Oct zero row may be ingested. |
| Network hashrate | Satoshi Gazette's documented series gives about 961 EH/s for 9 Oct, last complete UTC day in the retrieved series; it documents three-day smoothing of mempool.space daily estimates. | [Dated mining series](https://satoshigazette.org/data/mining?end=2026-10-10&window=30) and [mempool.space API docs](https://mempool.space/docs/api/rest). | **Hold for current refresh**: source evidence is reproducible but only through 9 Oct; retrieve the raw source series through the latest complete UTC day and persist method/window. Do not relabel an estimate as instantaneous hashrate. |
| Fee/subsidy ratio | A prior source review estimated 0.0129 BTC average fees per block / 3.125 BTC subsidy = 0.004128 ratio over a recent 144-block window. | [mempool.space mining dashboard](https://mempool.space/mining). This is a short-window point, not a rolling seven-day series. | **Blocked**: obtain and calculate a consistent series with explicit window and source observations; do not pass the old point estimate as a validated trend. |
| DXY | Current vendor pages disagree: Investing.com page values around 102.21–102.42 for 12 Oct depending on localized page; Reuters reported 102.39 during the day. | [Investing.com historical DXY](https://www.investing.com/indices/usdollar-historical-data), [Reuters 12 Oct coverage](https://www.reuters.com/world/asia-pacific/dollar-stays-near-18-month-high-mideast-conflict-inflation-data-focus-2026-10-12/). | **Hold**: choose and register one provider, define the close/time convention, and retain its actual timestamp. Do not mix values from different vendors or times. |

## 4. Freshness and provenance review result

- **ETF flows:** five distinct completed dates are visible, but the latest confirmed value is 9 Oct. The 12 Oct displayed 0.0 is not a valid observation because the individual fund cells are dashes. The latest-row freshness gate must decide whether the 9 Oct record is still within 36 hours at evaluation time; never fabricate a 12 Oct zero.
- **Spot price:** Kraken is selected in the repository registry, but the live raw trade response has not yet been staged and the database source registry/adapter path still needs verification. It is not ready for production ingestion.
- **Hashrate:** dated data and methodology exist, but the series needs refreshing through the latest complete UTC day and ingestion with its aggregation method.
- **Fee/subsidy:** the existing point estimate is not enough to satisfy the required rolling-series definition.
- **DXY:** provider/time disagreement must be resolved by selecting one canonical source and observation convention.
- **Units:** expected units are \`USD/BTC\`, \`EH/s\`, \`ratio\`, \`index\`, and \`USD million/day\`. Unit validation must check both the observation and metric registry.
- **Repeated observations:** do not delete duplicate history. First export every row in each logical-key group; classify exact duplicates, revisions, conflicting values, and missing provenance. Define a deterministic winner/retention rule, preserve audit lineage, and only then propose a separate reviewed remediation.
- **Readiness:** because current price/source selection, the current hashrate series, a valid rolling fee/subsidy series, canonical DXY, and latest ETF-flow freshness are not all confirmed, the current dataset must remain \`not_evaluable\`.

## 4A. Read-only database audit — 2026-10-12 18:20 UTC

A read-only query was executed against the currently connected `Crypto` production branch. No rows were inserted, updated, or deleted.

| Check | Result | Interpretation |
|---|---|---|
| `market.spot_price` latest row | 81,043 USD/BTC at 2026-09-19 06:38 UTC; age 563.70 h; source `market.primary`; `STALE` | Fails the 1 h gate and does not use the selected Kraken source |
| `security.hashrate` latest row | 1,001 EH/s at 2026-09-19 00:00 UTC; age 570.33 h; `STALE` | Fails the 48 h gate |
| `security.fee_subsidy_ratio` | No observation | Fails the required-input gate |
| `macro.dxy` | No observation | Fails the required-input gate |
| `institutional.etf_net_flow` latest row | 324.6 USD million/day at 2026-09-18 00:00 UTC; age 594.33 h; `STALE` | Fails the 36 h gate |
| Source registry in the live database | `market.kraken` absent; `market.primary` remains present with no base URL | The repository seed correction has not been deployed to the database; production source registration remains unverified |
| Duplicate observation groups | 9 groups, 18 rows, 9 extra rows; all 9 groups have identical payloads and 0 conflicting groups | Exact-duplicate candidates are identified; all rows must be preserved pending a separately reviewed remediation |
| Published snapshot evidence | `BTC-2026-10-07-v1`: 15 evidence rows across 15 blocks; 0 missing registered sources, observations, or source URLs | Evidence linkage check passes for this snapshot |
| Scenario/monitoring persistence | 0 snapshot-linked scenario states; 0 BTC monitoring events; 0 monitoring signals linked to a metric or critical factor | No current persisted scenario/monitoring output was found by this query |

The nine exact-duplicate groups cover spot price, hashrate, block subsidy, circulating supply, maximum supply, and four ETF flow dates (15–18 September). This is a classification result only. No deduplication was performed.

**Current readiness: `not_evaluable`.** The source seed mismatch is corrected in GitHub only. The production database remains unchanged, and current inputs still fail freshness/completeness checks. The Kraken API page could be opened but the web retrieval returned no readable trade payload, so no current trade price or trade timestamp has been fabricated or staged.

## 5. Safe ingestion and duplicate-control procedure

1. Fetch source payloads with a retrieval timestamp and preserve the raw response or immutable review artifact.
2. Normalize into a staging manifest; no production writes during review.
3. Validate registered source, HTTPS URL, metric ID, unit, numeric value, observation timestamp, freshness and calculation window.
4. Calculate the metric-specific logical key. For ETF flows this is at minimum \`metric_id + trading_date + source_id\`; for point quotes it includes provider/pair and observation timestamp; derived rolling metrics include window and method version.
5. Compare candidate keys with all existing rows. Classify exact duplicates separately from same-key conflicting revisions. Never collapse separate source observations merely because dates match.
6. Generate a dry-run diff: insert candidates, exact duplicate/no-op candidates, conflicting keys, rejected stale/untraceable rows, and reasons. No UPDATE/DELETE by default.
7. Require review of that diff before any ingestion is executed.
8. Re-run the read-only provenance audit and readiness gate. Acceptance requires zero unresolved duplicate logical-key groups for the selected inputs and all source/unit/freshness checks passing.

## 6. Boundary before scenario evaluation

Passing the input gate only permits a **read-only, reproducible rule evaluation** after the rule and its thresholds are separately reviewed. It does not authorize a scenario-state write or monitoring-event write.

Keep the published research probabilities unchanged: Bull 30%, Base 50%, Bear 20%. Do not wire the offline directional prototype into production, and do not recalibrate probabilities in this task. Record rule version, exact input observation IDs, source URLs, UTC windows, transformations and result in a dry-run artifact only. Scenario persistence requires a separate explicit review and release.

## 7. Completion checklist

- [ ] Canonical source IDs confirmed against the repository source registry.
- [ ] Current BTC quote fetched from the selected registered exchange feed.
- [ ] Five distinct completed ETF-flow sessions staged; placeholder rows excluded; latest-row freshness checked at run time.
- [ ] Hashrate raw series refreshed through latest complete UTC day and method recorded.
- [ ] Fee/subsidy rolling series computed from documented raw observations.
- [ ] DXY provider and daily observation convention selected; discrepancies resolved.
- [ ] Staging rows pass source, unit, timestamp, freshness and numeric validation.
- [ ] Duplicate-group payloads classified; dry-run remediation reviewed; no blind historical deletion.
- [ ] Readiness passes on the reviewed candidate set.
- [ ] Reproducible scenario evaluation is run read-only only after separate rule review.
- [ ] No scenario state/event persistence and no probability changes.
