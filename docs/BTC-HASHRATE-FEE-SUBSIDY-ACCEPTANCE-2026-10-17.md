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

**Observed staging result (2026-10-17 14:13:40 UTC):** HTTP 200, payload `{"startBlock":971728,"endBlock":971871,"totalReward":"45231274297","totalFee":"231274297","totalTx":"714014"}`; raw SHA-256 `92dfedfd15be72e738a7b628a31a7e3cd32b9071cbf0c6352f0f78000e922fe6`. The inclusive height range is exactly 144 blocks. The current public backend implementation calculates these fields as sums over the latest N blocks with `stale = 0` (reviewed in [Mempool BlocksRepository](https://github.com/mempool/mempool/blob/master/backend/src/repositories/BlocksRepository.ts)). Total reward minus total fees is `45,000,000,000 sats = 450 BTC`, matching 144 × 3.125 BTC. Therefore the reproducible research candidate ratio is `231,274,297 / 45,000,000,000 = 0.0051394288222` (fees equal approximately `0.513943%` of subsidy). This is not yet a production-approved observation: the aggregate does not include per-block hashes, so chain reorg/finality risk and exact deployed-version parity still require an explicit policy.

## 3. Safety boundary and next step

The source-staging workflow is read-only with respect to production: it captures into a temporary review directory and uploads a short-lived CI artifact. No observation is ingested and no scenario state or monitoring event is created. After this commit, inspect the staging run and artifact, record actual response keys/units/coverage, add parser tests from the captured schema, and only then decide whether either metric can be admitted. Do not claim acceptance merely because the capture returns HTTP 200.
