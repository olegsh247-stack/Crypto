# BTC Hashrate and Fee/Subsidy Acceptance — 2026-10-17

**Scope:** BTC source contracts only. Review capture; no production database access, ingestion, scenario evaluation, scenario-state writes, or monitoring-event writes.

## 1. Network hashrate

- Candidate source: Mempool.space public API, `https://mempool.space/api/v1/mining/hashrate/1w`.
- Canonical metric/unit: `security.hashrate`, `EH/s`.
- Accepted semantic target: a daily estimated hashrate bucket, not the endpoint's `currentHashrate` field and not a weekly rolling average.
- Store the source series timestamp as the daily bucket end boundary and explicitly record `period_start = period_end - 24 hours`; the represented interval is `[period_start, period_end)` in UTC.
- Convert raw hashes/second to EH/s by dividing by `10^18`. Preserve the raw response and SHA-256, exact URL, `retrieved_at`, provider timestamp, endpoint/version evidence and parser/methodology version.
- The 48-hour registry freshness limit is an acceptance ceiling, not permission to use an old point. Re-evaluate freshness at the actual scenario capture time.
- Do not mix the daily series with `currentHashrate`. The public endpoint's deployed behavior must be confirmed against the reviewed field semantics before admission.

### Acceptance gates

1. HTTP success and valid JSON; nonempty series with numeric, positive hashrate and valid timestamp.
2. Explicit UTC period boundaries and a documented 24-hour daily bucket.
3. Unit conversion and method version recorded; no substitute of fetch time for observation time.
4. Registered source ID and allowed HTTPS endpoint prefix pass the repository readiness gate.
5. Raw payload checksum, retrieval time and freshness recorded.
6. A repeated capture can be compared without creating a second logical observation for the same daily bucket.

**Observed staging result (2026-10-17 14:13:40 UTC):** HTTP 200; 7 daily points; latest bucket `[2026-10-16T00:00:00Z, 2026-10-17T00:00:00Z)`; estimated hashrate `1009.5138912218121 EH/s`; payload SHA-256 `7554dafd3425d7d52ee717dd446d76ccfd68146a5b70f90705f325b0b8cf9856`. The value was fresh at capture time. This confirms the real response shape and unit conversion for the captured artifact; production ingestion is still not approved until the test run and canonical endpoint/source checks pass.

## 2. Fee/subsidy ratio

- Candidate source: Mempool.space `https://mempool.space/api/v1/mining/reward-stats/144`, intended to describe the latest 144-block window.
- Canonical metric/unit: `security.fee_subsidy_ratio`, dimensionless `ratio`.
- Do not use `/api/v1/mining/blocks/fees/1w` directly for a 144-block ratio: its rows are time-bucket aggregates, `avgHeight` is not an exact block boundary, and the reviewed implementation does not establish a matching subsidy denominator.
- The proposed ratio is `sum(transaction_fees_in_window) / sum(protocol_subsidy_in_window)`, calculated from the same exact set of canonical block heights. Do not divide total miner reward (subsidy plus fees) by subsidy; that would be a different metric.
- Before calculation, verify the deployed response fields, fee units (e.g. satoshis versus BTC), whether reward totals include subsidy and/or fees, exact block coverage, missing/stale block handling, and chain-reorganization/finality semantics. The API endpoint name alone does not establish these details.
- Determine protocol subsidy per block from the protocol schedule for each block height in the window. At current heights the subsidy is 3.125 BTC/block, but calculate the denominator from the actual included heights so a halving-boundary window remains correct.
- Preserve the raw payload, SHA-256, exact endpoint, retrieval time, first/last block height, row count, fee/subsidy units, formula version and the list or checksum of included block identities.
- If the response does not expose enough evidence to establish exact block coverage and fee/subsidy semantics, mark the ratio blocked; do not infer a value from summary fields or return zero.

### Acceptance gates

1. Actual staging response is captured and schema documented.
2. Exactly 144 distinct contiguous canonical block heights are evidenced, or the source's documented window semantics are explicitly reconciled and approved.
3. Fee and subsidy components use consistent units and identical block coverage.
4. Reorg/finality handling and a confirmation/re-capture rule are defined.
5. Formula has a version and an independently testable fixture derived from a real captured response.
6. The computed ratio is finite and nonnegative; zero is valid only when source data genuinely show zero total fees.
7. Raw provenance and the calculation inputs/results are reproducible from the saved artifact.

**Latest per-block staging audit (2026-10-17 18:10:44.914 UTC):** [BTC Public Source Staging run #39056926908](https://github.com/olegsh247-stack/Crypto/actions/runs/39056926908) succeeded. The aggregate endpoint returned heights `971753–971896` inclusive, exactly 144 blocks; `totalReward=45,219,667,947 sats`, `totalFee=219,667,947 sats`, `totalTx=719,909`. The new read-only audit fetched Mempool v1 block pages, extracted `extras.totalFees` per block, verified all 144 distinct contiguous heights and parent-hash links, and reconciled per-block fee sum exactly to the aggregate. It independently calculated subsidy from the protocol schedule for the same heights; `totalReward-totalFee=45,000,000,000 sats = 450 BTC`, exactly matching 144 × 3.125 BTC. Canonical start/end hashes and chain tip height/hash were rechecked before/after capture and remained unchanged. Per-block fees total `2.19667947 BTC`; the research candidate ratio is `219,667,947 / 45,000,000,000 = 0.0048815099333` (approximately `0.488151%` of subsidy). Evidence JSON SHA-256: `6895f032f24b2e0063b995b0b5331ae23ed8838cec8ab8d11e69947f3b13bb34`.

**Remaining block:** the per-block window is now internally verified, but it is still review-only. The current window ends at the tip, so recapture after at least six additional blocks and compare all overlapping heights/hashes/fees to detect any reorganization or revision. Exact deployed API implementation/version parity is also not independently pinned. Do not promote to production until those gates pass.

## 3. Safety boundary and next step

The source-staging workflow is read-only with respect to production: it captures into a temporary review directory and uploads a short-lived CI artifact. No observation is ingested and no scenario state or monitoring event is created. The per-block audit and validation tests are now implemented; inspect its result after a ≥6-block confirmation interval and compare overlapping block identities before considering admission. Do not claim production acceptance merely because capture and arithmetic pass.


### Follow-up confirmed window — 2026-10-18

- Successful read-only capture: [BTC Public Source Staging #39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890), artifact `btc-public-source-review`, artifact ID `12148192845`.
- Verified window: heights `971906–972049`, 144 unique contiguous blocks. Aggregate endpoint `totalFee=197,402,505 sats`; independently summed per-block fees also equal `197,402,505 sats = 1.97402505 BTC`. Protocol subsidy for the same window is `45,000,000,000 sats = 450 BTC`; fee/subsidy ratio `0.0043867223333` (about `0.438672%`). The aggregate reward is `45,197,402,505 sats`; all fee/subsidy arithmetic reconciles.
- Boundary hashes and tip height/hash were unchanged before/after capture; tip was height `972050`. Evidence JSON SHA-256: `c7832cc123ffbcdee4e3e007e37e75f13dda2a0e385c1e4d220a534746b16962`.
- The prior accepted window ended at height `971896`; this window starts at `971906`, so the two windows have **no overlap**. Do not run the comparator on these two windows or claim reorg confirmation. Pin `971906–972049` as the new baseline; the next eligible window must end at or beyond height `972055` (tip approximately `972056+`) and overlap the baseline. The capture must also pass the stable-tip check; a racing/moving tip is a blocked capture, not evidence.
- The first attempt in run [#39160312789](https://github.com/olegsh247-stack/Crypto/actions/runs/39160312789) failed the stable-window capture with `tip changed or behind window`; its source snapshot is not used as fee evidence. The retry in #39160316890 succeeded.
- Status remains review-only; API version parity remains unproven. No production changes or ingestion.
