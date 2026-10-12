# BTC Input Source Review — 2026-10-12

Status: **candidate sources only; not approved for ingestion**  
Scope: BTC scenario inputs for one auditable research scenario. No production values were written.

## Why this review exists

The live read-only audit found three required inputs stale and two missing. This review identifies plausible source endpoints and documents the acceptance gaps. Search snippets and public dashboards are discovery aids, not ingestion evidence: the ingestion job must retrieve the source directly, retain the exact response/source timestamp and revision, and validate the result before it can be marked current.

## Candidate input contracts

| Metric ID | Candidate source | Candidate observation / context | Required ingestion contract | Status |
|---|---|---|---|---|
| `market.spot_price` | Coinbase BTC-USD market data; https://api.exchange.coinbase.com/products/BTC-USD/ticker | Coinbase's public converter displayed about $82.9k on 2026-10-12; page display time was local/unspecified, so this is not a canonical observation | Use a direct ticker or defined UTC candle close; persist exchange/product, quote currency, retrieved_at, source timestamp, value, unit and source URL. Do not use an article's publication date as price observation time | Candidate; exact API response not captured |
| `institutional.etf_net_flow` | Farside Investors daily US spot BTC ETF table; https://farside.co.uk/btc/ | A secondary report attributed +$21.1m to the 2026-10-09 session, but the indexed primary page was stale when inspected and did not expose the latest rows | Capture the actual daily total from the primary table after the US session is finalized; store session date/period_start, observed_at, USD million/day, source URL, source ID and revision. Require five distinct recent trading sessions; never infer weekend observations | Blocked pending direct primary-source verification |
| `security.hashrate` | Mempool.space hashrate API; https://mempool.space/api/v1/mining/hashrate/1w | Public dashboard search result showed about 1.01 ZH/s; the API response and exact window were not captured in this review | Persist the defined weekly-average hashrate window, exact window start/end, value normalized to the registered unit (currently EH/s), retrieval time, source URL and revision. Preserve the raw unit and conversion | Candidate; exact API response not captured |
| `security.fee_subsidy_ratio` | Mempool.space mining dashboard/API; https://mempool.space/mining and https://mempool.space/docs/api/rest | Dashboard search result showed 452.04 BTC total miner reward over 144 blocks and average fees of 0.0141 BTC/block. Those values suggest roughly 2.04 BTC total fees against 450 BTC subsidy (about 0.453%), but they are not a captured, validated API observation | Do not store the derived ratio until raw fee and subsidy quantities, block range, aggregation method, units, source response and timestamp are captured. Separate a 144-block point-in-time ratio from a rolling trend | Blocked pending raw values and method approval |
| `macro.dxy` | ICE US Dollar Index is the index owner; Reuters can provide contextual reporting. Example dated 2026-10-12: https://www.reuters.com/world/asia-pacific/dollar-stays-near-18-month-high-mideast-conflict-inflation-data-focus-2026-10-12/ | Reuters reported the index at 102.39 in its 2026-10-12 article; this is an article-reported value, not a direct licensed market-data feed | Decide whether the product requires ICE DXY specifically or an openly reproducible alternative such as a named FRED broad-dollar series. Do not silently substitute one series for the other. Record the observation date, source timestamp, licensing/availability constraints and exact series definition | Blocked: source contract decision required |

## Acceptance rules before ingestion

1. Register the actual provider/source in `sources`; do not reuse a generic source ID if it obscures the provider or URL.
2. Confirm the metric ID, unit, time convention, aggregation window and freshness limit against `metric_definitions`.
3. Fetch a direct source response and retain enough provenance to reproduce the value. Search snippets and derived articles are not a substitute.
4. Keep observation time distinct from retrieval time and publication/session date. All persisted timestamps must be explicit UTC instants or date-only periods where the source is a daily series.
5. Reject missing, malformed, future-dated, stale, untraceable or duplicate logical observations. Never mark a row `CURRENT` solely to satisfy readiness.
6. For ETF flows, count distinct finalized US trading sessions, not calendar days. The current generic 48-hour gate should be reviewed against weekends and market holidays before any scenario is evaluated.
7. For fee/subsidy economics, persist or retain the raw components and version the aggregation formula. A single 144-block ratio does not establish a trend.
8. Do not insert these candidate values into the production database. First capture and review direct source payloads, then test the ingestion adapter and freshness contract against disposable PostgreSQL.

## Current decision

The scenario remains **not evaluable**. This source review does not update the published snapshot, score, scenario probability, monitoring signal, scenario state or event. The live production blockers are documented in [BTC Monitoring Readiness Matrix](./BTC-MONITORING-READINESS-MATRIX.md).
