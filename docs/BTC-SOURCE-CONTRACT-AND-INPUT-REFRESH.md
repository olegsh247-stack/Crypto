# BTC Source Contract and Controlled Input Refresh v1

**Review date:** 2026-10-12  
**Asset:** BTC  
**Research snapshot:** `BTC-2026-10-07-v1`  
**Status:** source contract defined; candidate refresh reviewed; **not approved for production ingestion**  
**Safety boundary:** this document is a review artifact. It does not write observations, change historical rows, create scenario states/events, or change published probabilities.

## 1. Required observation contract

Every observation submitted for review must contain:

- `asset_id` = `btc`;
- canonical `metric_id` from the registry (no ad-hoc metric IDs);
- numeric value and explicit canonical unit;
- `observed_at` in ISO-8601 UTC, representing the actual observation time/window, not the page-fetch time;
- `source_id` that already exists in the `sources` registry and `source_url` using HTTPS;
- freshness status derived at ingestion time from the metric-specific age limit;
- source publication/update time where available, retrieval time, method/window, and revision/raw-row identity;
- idempotency key based on the metric's logical observation window, not retrieval time.

Do not manufacture an observation timestamp from a web page's crawl time. Do not treat missing, dash, placeholder, or unreported values as numeric zero. Preserve source payloads and review metadata so that a candidate can be reproduced.

## 2. Canonical metric contract and gates

| Metric ID | Unit | Maximum age | Additional acceptance rule |
|---|---|---:|---|
| `market.spot_price` | `USD/BTC` | 24 h | One named exchange/pair and actual timestamp; never average unrelated exchange quotes into a synthetic point |
| `security.hashrate` | `EH/s` | 7 days | Store source's raw daily estimate and documented aggregation; distinguish daily estimate from rolling mean |
| `security.fee_subsidy_ratio` | `ratio` | 7 days | Value must state numerator, denominator, block/window range and calculation version; one 144-block point is context, not a validated rolling trend |
| `macro.dxy` | `index` | 5 days | One selected provider and defined daily close/time convention; reconcile materially conflicting vendor values before acceptance |
| `institutional.etf_net_flow` | `USD million/day` | latest row <=48 h | At least five distinct recent trading dates; latest source row must be valid/current; dashes or a placeholder total are not zero |

For every metric, the observation's `unit` must match both the required canonical unit and `metric_definitions.default_unit`. The source ID must be registered. Invalid latest observations block readiness; they must not be bypassed by silently falling back to older rows.

## 3. Candidate refresh review — 2026-10-12

These are source-review candidates only. They have **not** been inserted into the database.

| Metric | Candidate evidence found | Source / timestamp semantics | Decision |
|---|---|---|---|
| BTC spot price | ChartExchange BTCUSD page showed 82,754.65 USD at 2026-10-12 12:30 EDT (16:30 UTC); its daily bar was still in progress | [ChartExchange BTCUSD history](https://chartexchange.com/symbol/crypto-btcusd/historical/). This is a composite quote/page timestamp, not yet the chosen canonical exchange feed. | **Hold**: select a registered exchange source and ingest its actual timestamped quote or completed bar; do not use this candidate as a synthetic canonical point. |
| US spot BTC ETF flows | Farside lists completed-session totals: 5 Oct −89.8m, 6 Oct +118.8m, 7 Oct −484.9m, 8 Oct −244.1m, 9 Oct +21.1m USD million. Sum = −678.9m across five distinct sessions. | [Farside Investors BTC ETF flows](https://farside.co.uk/btc/), page reviewed 2026-10-12. The 12 Oct row shows dashes across funds and a displayed total of 0.0; this is a placeholder/unreported session, **not a confirmed zero flow**. | **Historical candidate series only**: retain the five completed trading dates with source provenance. The latest confirmed row is 9 Oct and may fail the <=48 h gate depending on evaluation time; no 12 Oct zero row may be ingested. |
| Network hashrate | Satoshi Gazette's documented series gives about 961 EH/s for 9 Oct, last complete UTC day in the retrieved series; it documents three-day smoothing of mempool.space daily estimates. | [Dated mining series](https://satoshigazette.org/data/mining?end=2026-10-10&window=30) and [mempool.space API docs](https://mempool.space/docs/api/rest). | **Hold for current refresh**: source evidence is reproducible but only through 9 Oct; retrieve the raw source series through the latest complete UTC day and persist method/window. Do not relabel an estimate as instantaneous hashrate. |
| Fee/subsidy ratio | A prior source review estimated 0.0129 BTC average fees per block / 3.125 BTC subsidy = 0.004128 ratio over a recent 144-block window. | [mempool.space mining dashboard](https://mempool.space/mining). This is a short-window point, not a rolling seven-day series. | **Blocked**: obtain and calculate a consistent series with explicit window and source observations; do not pass the old point estimate as a validated trend. |
| DXY | Current vendor pages disagree: Investing.com page values around 102.21–102.42 for 12 Oct depending on localized page; Reuters reported 102.39 during the day. | [Investing.com historical DXY](https://www.investing.com/indices/usdollar-historical-data), [Reuters 12 Oct coverage](https://www.reuters.com/world/asia-pacific/dollar-stays-near-18-month-high-mideast-conflict-inflation-data-focus-2026-10-12/). | **Hold**: choose and register one provider, define the close/time convention, and retain its actual timestamp. Do not mix values from different vendors or times. |

## 4. Freshness and provenance review result

- **ETF flows:** five distinct completed dates are visible, but the latest confirmed value is 9 Oct. The 12 Oct displayed 0.0 is not a valid observation because the individual fund cells are dashes. The latest-row freshness gate must decide whether the 9 Oct record is still within 48 hours at evaluation time; never fabricate a 12 Oct zero.
- **Spot price:** an up-to-date quote is visible publicly, but the current source candidate is not yet the project's selected registered exchange source with an auditable timestamp. It is not ready for production ingestion.
- **Hashrate:** dated data and methodology exist, but the series needs refreshing through the latest complete UTC day and ingestion with its aggregation method.
- **Fee/subsidy:** the existing point estimate is not enough to satisfy the required rolling-series definition.
- **DXY:** provider/time disagreement must be resolved by selecting one canonical source and observation convention.
- **Units:** expected units are `USD/BTC`, `EH/s`, `ratio`, `index`, and `USD million/day`. Unit validation must check both the observation and metric registry.
- **Repeated observations:** do not delete duplicate history. First export every row in each logical-key group; classify exact duplicates, revisions, conflicting values, and missing provenance. Define a deterministic winner/retention rule, preserve audit lineage, and only then propose a separate reviewed remediation.
- **Readiness:** because current price/source selection, the current hashrate series, a valid rolling fee/subsidy series, canonical DXY, and latest ETF-flow freshness are not all confirmed, the current dataset must remain `not_evaluable`.

## 5. Safe ingestion and duplicate-control procedure

1. Fetch source payloads with a retrieval timestamp and preserve the raw response or immutable review artifact.
2. Normalize into a staging manifest; no production writes during review.
3. Validate registered source, HTTPS URL, metric ID, unit, numeric value, observation timestamp, freshness and calculation window.
4. Calculate the metric-specific logical key. For ETF flows this is at minimum `metric_id + trading_date + source_id`; for point quotes it includes provider/pair and observation timestamp; derived rolling metrics include window and method version.
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
