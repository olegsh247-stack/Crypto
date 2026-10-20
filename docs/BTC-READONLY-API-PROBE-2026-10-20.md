# BTC read-only API probe — 2026-10-20

**Purpose:** practical test of an available BTC network-data API for Plan 100. This is a one-off read-only probe; no key, database, scenario state, registry, deployment, or scheduled collection was touched.

## Result: mempool.space hashrate endpoint

- Endpoint: `GET https://mempool.space/api/v1/mining/hashrate/1m`
- Retrieval: the API response was accessible and returned JSON.
- Response fields observed: `hashrates[]` with Unix `timestamp` and `avgHashrate`; `difficulty[]` with `time`, `height`, `difficulty`, `adjustment`; top-level `currentHashrate` and `currentDifficulty`.
- Top-level current hashrate reported: `1.058347073374176e+21` hashes/second, equivalent to approximately **1,058.35 EH/s**.
- Top-level current difficulty reported: `140577680051919.6`.
- Latest dated hashrate point visible in the response: timestamp `1792454400` = `2026-10-20T00:00:00Z`; `avgHashrate=1.065922275929967e+21` H/s, approximately **1,065.92 EH/s**.
- Previous dated point: `2026-10-19T00:00:00Z`, `avgHashrate=1.109164723723967e+21` H/s, approximately **1,109.16 EH/s**.
- The response exposes timestamped daily series and numeric values; converting H/s to EH/s is division by (10^{18}).
- Limitation: this inspection did not capture the complete raw HTTP body, response headers, retrieval timestamp from the provider client, or a full-response SHA-256. Therefore it is a successful endpoint/shape probe, **not yet an accepted provenance-grade BTC observation**. Repeat using the project's staging probe so response hash, retrieval time, HTTP status and normalized output are recorded together.

## Current decision

- Network hashrate is optional context in the first BTC scenario, with a 48-hour freshness contract. This response's latest dated point is within that window, but the source-specific metric mapping and full provenance still need confirmation.
- Do not use the undated top-level `currentHashrate` as if it had its own observation timestamp; prefer the timestamped series point unless the API contract explicitly defines the top-level field's timestamp semantics.
- No BTC scenario was evaluated and no state/probability was changed. BTC remains `not_evaluable` until the required spot-price and ETF-flow inputs pass their gates.

## Next practical probes

1. Run a fresh Kraken BTC/USD trade-based observation through the existing staging probe; record source trade time, retrieval time, quote units, age and response hash.
2. Run a second ETF API snapshot using the already configured SoSoValue credential through the existing manual probe; compare reporting dates and row-level values with the prior snapshot. Do not write to production or enable scheduled capture.
3. Capture actual fee/reward fields and document the exact fee/subsidy calculation window and units; do not estimate missing values.
4. Re-run the offline BTC readiness/rule test on the resulting reviewed fixture. A passing code test does not itself make the current scenario evaluable.
