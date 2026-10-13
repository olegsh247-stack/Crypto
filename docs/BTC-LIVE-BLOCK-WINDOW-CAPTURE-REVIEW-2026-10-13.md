# BTC Live Block-Window Capture Review — 2026-10-13

**Capture run:** [BTC Block Window Validation #38420640819](https://github.com/olegsh247-stack/Crypto/actions/runs/38420640819)  
**Artifact:** [btc-block-window-review-38420640819](https://github.com/olegsh247-stack/Crypto/actions/runs/38420640819/artifacts/11826482287)  
**Artifact SHA-256:** `4351fa94264c183f72790ad495d4921ad71a1bc3bfd04bea0bedbfd735ec6232`  
**Decision:** live capture passed validation as candidate evidence only; no production acceptance.

## 1. Capture result

- Retrieved at: `2026-10-13T15:16:44.656Z` to `2026-10-13T15:16:48.761Z`.
- Public source: Mempool.space REST API over HTTPS.
- Tip anchor before and after collection: height `971261`, hash `000000000000000000015a88be0889bec9e1959ffc22dc4d13d98681dd1dbcbc`.
- Anchor recheck: `PASS`; both height and hash were unchanged.
- 11 block pages returned HTTP 200 with JSON content.
- 165 unique contiguous blocks validated: heights `971097–971261`.
- Missing heights: 0; duplicate heights: 0; duplicate hashes: 0.
- Future-timestamp violations: 0; Median Time Past violations: 0.
- Every block's fee/reward fields were numeric and non-negative, and `reward - totalFees` matched the subsidy expected at that block height.
- Manifest status: `PASS_CANDIDATE_ONLY`; no capture error.

The immutable artifact contains the manifest, all 11 raw page bodies, and normalized block rows. It is retained by GitHub Actions for 14 days from upload, so preserve it externally if long-term evidence retention is required.

## 2. Rolling 144-block calculation (candidate only)

| Field | Value |
|---|---:|
| Window | Latest 144 consecutive blocks in this capture |
| Height range | 971118–971261 |
| Total fees | 260,468,982 sats |
| Total subsidy | 45,000,000,000 sats |
| Candidate ratio | 0.0057881996 (about 0.57882%) |
| Status | `CANDIDATE_ONLY_NOT_ACCEPTED` |

The ratio is reproducible from the normalized evidence as:

`sum(total_fees_sats) / sum(subsidy_sats)`

It is not a production observation, does not imply a trend, and must not be used to change scenario scores, probabilities, monitoring state, or published research.

## 3. Metric-window contract review

The canonical repository metric registry currently declares `security.fee_subsidy_ratio` with:

- unit: `ratio`;
- frequency: `1d`;
- freshness window: `48h`;
- canonical source priority: `network.primary` (Mempool.space).

The prior source-contract review also requires a matched numerator and denominator and explicitly warns that one 144-block point is context, not a validated rolling trend.

### Recommendation

Use a **completed UTC calendar day** as the canonical persisted observation window because that matches the metric registry's `frequency: 1d`. Keep the latest 144-block ratio as a separate diagnostic candidate only, unless the metric registry is deliberately revised to define a rolling-block frequency and corresponding monitoring semantics.

This is a contract recommendation, not an accepted registry change. The current 165-block capture begins at approximately `2026-10-12T13:29:20Z`, so it does **not** cover the entire UTC day of 2026-10-12. It cannot be used to calculate that day's complete daily ratio.

## 4. Next read-only gate

1. Extend capture coverage far enough to include a full completed UTC day, with block-height and timestamp buffers around both day boundaries.
2. Select blocks for that UTC day using source block timestamps; sum per-block fees and the subsidy for the same exact set of blocks.
3. Preserve raw responses, retrieval timestamps, source URLs, body hashes, the day boundary, included height range, and calculation version.
4. Compare the UTC-day result with the rolling 144-block diagnostic without promoting either candidate to production.
5. Update the canonical metric/source/monitoring contract only after the definition is explicitly accepted and the resulting checks pass.

## 5. Safety boundary

No database was accessed by the capture. No observations, historical rows, source registries, metric registries, monitoring events, scenario states, scores, probabilities, or published snapshots were changed. BTC remains `not_evaluable` until all required inputs and contracts pass acceptance.
