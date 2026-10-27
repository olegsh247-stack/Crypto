# BTC observation collectors v1

Status: implementation and fixture tests only; scheduled persistence is **disabled by default**.

## Candidate inputs

| Metric ID | Provider / endpoint | Canonical unit | Timestamp/window semantics |
|---|---|---|---|
| `market.spot_price` | Kraken public XBTUSD Trades endpoint | `USD/BTC` | `observed_at` is the provider's latest trade timestamp; `retrieved_at` records collection time. Source ID is `market.kraken`. |
| `security.hashrate` | Mempool.space `/api/v1/mining/hashrate/1w` | `EH/s` | Select the latest complete UTC daily bucket, not the partial current day; convert `avgHashrate` from H/s to EH/s. |
| `security.fee_subsidy_ratio` | Mempool.space `/api/v1/mining/reward-stats/144` | `ratio` | Compute `totalFee / (totalReward - totalFee)` over the endpoint's start/end block range; verify both endpoint block timestamps and store them as period bounds. |
| `institutional.etf_net_flow` | Farside Investors BTC ETF table | `USD million/day` | Parse the table's explicit `Total` column; preserve reporting day as a UTC daily window; parentheses are negative; rows with no reported fund values are skipped. |

DXY is intentionally **not collected**. It is optional supporting context and does not block the first BTC scenario. No alternative index or unverified quote page is silently substituted.

## Read-only candidate review

After building the worker, run:

```bash
node scripts/collect-btc-input-candidates.mjs
```

This performs public HTTP GETs only and prints candidate values, source URLs, timestamps/windows, freshness, per-source failures and the unresolved DXY metric. It does not connect to PostgreSQL and does not insert or update observations. A stale provider page or an unexpected response schema fails closed.

## Scheduled persistence safety

The VPS Worker only invokes source collection/persistence when `BTC_OBSERVATION_INGESTION_ENABLED=true`. The application code defaults the flag to false and Docker Compose sets it to false explicitly. Until source candidates are reviewed, the flag must remain disabled.

When enabled, the collector:
- persists only validated numeric observations for the four listed metrics;
- records source ID, source URL, canonical unit, methodology, reporting/window timestamps, freshness and status;
- uses a transaction-scoped advisory lock per logical key;
- leaves identical payloads unchanged and increments revision when the payload for the same logical key changes;
- reports per-source errors as a partial result instead of inventing fallback values.

The collector never writes scenario states or monitoring events. DXY may remain missing without blocking readiness; required spot-price and ETF-flow inputs must still pass source, freshness, period and provenance checks.

## Verification

Fixture tests cover the hashrate UTC bucket, fee/subsidy calculation, ETF table Total-column parsing, negative values, skipped no-data rows, malformed table rejection and candidate collection. Disposable PostgreSQL E2E covers idempotent inserts, unchanged repeated payloads, revision increments, exact-duplicate cleanup guards and unique-key enforcement.

No live source database or production service is modified by these tests.
