# BTC Directional Series Gate — 2026-10-13

**Status: implementation contract clarified; candidate capture still required.**
**Scope:** BTC only, read-only source review. No production database access, observation writes, scenario-state writes, monitoring writes, or published-probability changes.

## Purpose

The BTC rule needs changes over a historical window, not just one fresh value. A single spot quote cannot establish a seven-day return, and one hashrate point cannot establish a seven-day hashrate change. This gate defines the minimum reproducible candidate series before any scenario rule evaluation.

## Spot price: proposed candidate contract

- Endpoint: Kraken Spot REST OHLC, pair `XBTUSD`, interval `1440` minutes.
- Endpoint form: `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440`.
- Use the candle close field, not the current trade price, to compute a daily-series return.
- Require **eight consecutive completed UTC daily candles** to calculate a seven-day close-to-close return. Exclude the currently forming candle even if returned by the endpoint.
- Validate timestamps, chronological order, duplicate timestamps, positive finite OHLC values, close within [low, high], gaps, and capture-time freshness. Preserve the raw response body and SHA-256, retrieval time, candle start/end convention, source URL, pair key, and parser version.
- Formula: `(latest_completed_close / close_7_completed_days_earlier) - 1`.
- Do not mix Kraken trade-timestamp spot observations with daily candle closes in the same series without an explicit method boundary.

### Source identity gate

The repository currently distinguishes `market.kraken` (point-in-time Trades candidate) from `market_kraken` (daily OHLC candle path). Keep those IDs distinct. The existing canonical `market.spot_price` source priority names `market.kraken`; therefore the OHLC series is **candidate-only** until the metric/source mapping is explicitly reviewed. Do not alias IDs or silently change the registry.

## Hashrate: proposed candidate contract

- Endpoint: Mempool.space historical hashrate series, `https://mempool.space/api/v1/mining/hashrate/6m` (official REST reference documents `/api/v1/mining/hashrate/:timePeriod` as the network-wide hashrate/difficulty series).
- Select completed daily buckets only. The current/incomplete UTC bucket must not be treated as a completed daily observation.
- Preserve the original response, payload SHA-256, retrieval time, each bucket timestamp, raw value and unit conversion from H/s to EH/s.
- Require eight consecutive completed daily points, no duplicates or missing UTC dates, positive finite values, and timestamps that are not in the future. Verify the provider's bucket timestamp convention against returned samples before interpreting a timestamp as bucket start or end.
- Formula: `(latest_completed_daily_hashrate / daily_hashrate_7_days_earlier) - 1`.
- A weekly-smoothed estimate must not be relabeled as an instantaneous measurement. Record the endpoint's averaging/smoothing semantics as part of the method.

## Acceptance rules

A candidate series is accepted for offline scenario review only when all of these hold:

1. Required points are present and consecutive; no interpolation or synthetic zero-filling.
2. Raw response and parser version are retained with SHA-256 and retrieval timestamp.
3. Source ID, source URL, units, observed-time and period-bound conventions match an explicitly reviewed contract.
4. The selected endpoints return a complete historical window and freshness checks pass.
5. The calculated return/change can be independently reproduced from the preserved rows.

A successful HTTP response alone is not acceptance. Passing this gate does not authorize production ingestion or persistent scenario evaluation.

## Current blockers and next action

- Implement a read-only historical series capture for the Kraken daily OHLC and Mempool historical hashrate endpoints, with deterministic tests for incomplete candles, gaps, duplicates, invalid values, source identity, and return calculations.
- Capture one current artifact and review its exact rows, time bounds, hashes and formulas.
- Resolve the `market.kraken` versus `market_kraken` source mapping before considering the price series accepted.
- Keep the scenario `not_evaluable` until the ETF flow, DXY, fee/subsidy metric contract and all other required inputs also pass their acceptance gates.

## References

- Kraken Spot API documentation entry point: https://docs.kraken.com/api/docs/rest-api/get-ohlc-data
- Mempool.space REST API reference: https://mempool.space/docs/api/rest

These references describe public API interfaces; they do not by themselves prove that the repository's canonical source IDs, timestamp conventions, or metric semantics have been accepted.
