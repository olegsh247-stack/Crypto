# BTC Directional Series Gate — 2026-10-13

**Status: candidate series captured and parser tests passed; source acceptance remains blocked.**
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

## Fresh candidate capture — 2026-10-13

Read-only staging workflow [run #38362350907](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907) passed its six deterministic parser tests and captured both endpoints. Artifact [ID 11795391910](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907/artifacts/11795391910), archive SHA-256 `7ad8a07ef0b818c0c2f3ac24bf05f2a515adafb1552d486dea6ce911d1de8c49`. Raw response bodies and row-level series are retained in the artifact. The capture is `PASS_CANDIDATE_ONLY`, not accepted scenario input.

| Series | Captured result | Raw payload SHA-256 | Acceptance |
|---|---|---|---|
| Kraken daily OHLC | HTTP 200; completed daily candles through 2026-10-12; latest close **81,737.1 USD/BTC**; close seven days earlier **85,751.5 USD/BTC**; calculated 7-day return **−4.6814%** | `97628c0fb352d68b5625c7d58d8fa3a4cb70c633bd9df63936797130f67d666a` | Candidate only. Kraken returns at most 720 OHLC rows; source ID `market_kraken` still needs reconciliation with canonical `market.spot_price` priority `market.kraken`. |
| Mempool hashrate history | HTTP 200; daily points through 2026-10-12; latest candidate **1,028.5949 EH/s**; seven days earlier **946.4696 EH/s**; calculated 7-day change **+8.6770%** | `875785ad9fbaacb4a70ae209c2a4843377fb2fb38cb4c243b036530b28dd74f1` | Candidate only. Bucket timestamp/smoothing convention is not yet authoritatively confirmed. |

The calculations are reproducible from the preserved candidate rows; they are not yet approved directional inputs. The Kraken daily series must not be silently treated as the registered Trades source, and the hashrate change must not be interpreted until the source's daily bucket convention is verified. The separate public-source capture still records ETF HTTP 403 and DXY as unresolved.

## Acceptance rules

A candidate series is accepted for offline scenario review only when all of these hold:

1. Required points are present and consecutive; no interpolation or synthetic zero-filling.
2. Raw response and parser version are retained with SHA-256 and retrieval timestamp.
3. Source ID, source URL, units, observed-time and period-bound conventions match an explicitly reviewed contract.
4. The selected endpoints return a complete historical window and freshness checks pass.
5. The calculated return/change can be independently reproduced from the preserved rows.

A successful HTTP response alone is not acceptance. Passing this gate does not authorize production ingestion or persistent scenario evaluation.

## Current blockers and next action

- Resolve the Kraken OHLC versus Trades source identity without aliasing `market_kraken` and `market.kraken`.
- Verify Mempool's hashrate timestamp and smoothing semantics; keep the series candidate-only until then.
- Acquire an authorized current ETF series and an approved DXY source.
- Reconcile the fee/subsidy rolling-144-block method with the existing daily metric contract and authoritative field/unit semantics.
- Only when every required input passes, run the fixed-manifest readiness gate and one deterministic BTC rule offline/read-only. Keep the scenario `not_evaluable` until then.

## References

- Kraken Spot API documentation entry point: https://docs.kraken.com/api/docs/rest-api/get-ohlc-data
- Mempool.space REST API reference: https://mempool.space/docs/api/rest

These references describe public API interfaces; they do not by themselves prove that the repository's canonical source IDs, timestamp conventions, or metric semantics have been accepted.
