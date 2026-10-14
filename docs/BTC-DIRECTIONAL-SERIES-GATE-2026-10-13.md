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
- The provider REST reference documents this endpoint as network-wide hashrate/difficulty and provider API reference copies describe the historical series as **daily average hashrates** ([Mempool REST reference](https://mempool.space/docs/api/rest); [endpoint documentation example](https://mempool.emzy.de/docs/api)).
- Treat each returned timestamp as a provider date label for the daily-average point, not as an instantaneous hashrate sample. The captured labels are UTC midnight; preserve that raw convention without inventing an intraday observation time.
- Exclude the current UTC date conservatively; only use date-labelled points from completed prior UTC dates.
- Preserve the original response, payload SHA-256, retrieval time, each bucket timestamp, raw value and unit conversion from H/s to EH/s.
- Require eight consecutive completed daily points, no duplicates or missing UTC dates, positive finite values, and timestamps that are not in the future.
- Formula: `(latest_completed_daily_average / daily_average_7_days_earlier) - 1`.
- The result is a change in the provider's **daily-average hashrate series**, not an instantaneous or weekly-smoothed value.

## Fresh candidate capture — 2026-10-13

Read-only staging workflow [run #38362350907](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907) passed its six deterministic parser tests and captured both endpoints. Artifact [ID 11795391910](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907/artifacts/11795391910), archive SHA-256 `7ad8a07ef0b818c0c2f3ac24bf05f2a515adafb1552d486dea6ce911d1de8c49`. Raw response bodies and row-level series are retained in the artifact. The capture is `PASS_CANDIDATE_ONLY`, not accepted scenario input.

| Series | Captured result | Raw payload SHA-256 | Acceptance |
|---|---|---|---|
| Kraken daily OHLC | HTTP 200; completed daily candles through 2026-10-12; latest close **81,737.1 USD/BTC**; close seven days earlier **85,751.5 USD/BTC**; calculated 7-day return **−4.6814%** | `97628c0fb352d68b5625c7d58d8fa3a4cb70c633bd9df63936797130f67d666a` | Candidate only. Kraken returns at most 720 OHLC rows; source ID `market_kraken` still needs reconciliation with canonical `market.spot_price` priority `market.kraken`. |
| Mempool hashrate history | HTTP 200; daily points through 2026-10-12; latest candidate **1,028.5949 EH/s**; seven days earlier **946.4696 EH/s**; calculated 7-day change **+8.6770%** | `875785ad9fbaacb4a70ae209c2a4843377fb2fb38cb4c243b036530b28dd74f1` | Candidate only. The endpoint is documented as a daily-average series and UTC-midnight labels are preserved as date labels; source/method acceptance and the metric-to-observation mapping still require review. |

The calculations are reproducible from the preserved candidate rows; they are not yet approved directional inputs. The Kraken daily series must not be silently treated as the registered Trades source. The hashrate calculation is specifically a change between provider-labelled daily-average values; the current UTC date is excluded. The source/method remains candidate-only pending metric-to-observation mapping review. The separate public-source capture records the ETF candidate and DXY as unresolved.

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
- Keep Mempool hashrate semantics explicit: provider-labelled daily-average series, UTC date labels, current date excluded. Review the mapping to `security.hashrate` before promotion.
- Acquire an authorized current ETF series and an approved DXY source.
- Reconcile the fee/subsidy rolling-144-block method with the existing daily metric contract and authoritative field/unit semantics.
- Only when every required input passes, run the fixed-manifest readiness gate and one deterministic BTC rule offline/read-only. Keep the scenario `not_evaluable` until then.

## References

- Kraken Spot API documentation entry point: https://docs.kraken.com/api/docs/rest-api/get-ohlc-data
- Mempool.space REST API reference: https://mempool.space/docs/api/rest

These references describe public API interfaces; they do not by themselves prove that the repository's canonical source IDs, timestamp conventions, or metric semantics have been accepted.

## Latest refresh — staging run #38388459518

The newest read-only capture on 2026-10-13 11:11 UTC is available in artifact [11806659469](https://github.com/olegsh247-stack/Crypto/actions/runs/38388459518/artifacts/11806659469). The parser suite passed 6/6 tests.

- Kraken daily OHLC: completed close on 2026-10-12 **81,737.1 USD/BTC**; close seven days earlier **85,751.5 USD/BTC**; candidate return **−4.6814%**; raw payload SHA-256 `4f38e355bb145a386c383915659c186842df1815e9d2848d2ce0d19c2d138c5f`.
- Mempool daily-average hashrate: latest 2026-10-12 **1,028.5949 EH/s**; seven days earlier **946.4696 EH/s**; candidate change **+8.6770%**; raw payload SHA-256 `1fd7446253f1e097fd9ccef69d4eb7578f4aa3ee1ed7a1629a8fb0a5e0509c6e`.

Both remain `CANDIDATE_ONLY`. The current capture clarifies the hashrate method as provider-labelled daily averages and excludes the current UTC date, but does not change source registration. Kraken OHLC remains distinct from the canonical `market.kraken` Trades source. No accepted BTC directional inputs or scenario evaluation were created.
