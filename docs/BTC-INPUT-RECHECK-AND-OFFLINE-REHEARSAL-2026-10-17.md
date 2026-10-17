# BTC Input Recheck and Offline Scenario Rehearsal — 2026-10-17

**Mode:** public-source staging and offline-only deterministic calculation. No production database access, ingestion, scenario-state persistence, monitoring-event writes or baseline probability changes.

## 1. Fee/subsidy: per-block window verified, acceptance still gated

The aggregate endpoint alone was insufficient, so a read-only per-block audit was added in `scripts/capture-btc-fee-subsidy-window.mjs`, with pure validation tests in `scripts/validate-btc-fee-window.mjs`.

Latest staging run [#39056926908](https://github.com/olegsh247-stack/Crypto/actions/runs/39056926908) succeeded. It captured the 144-block window from height `971753` through `971896` inclusive:

- Aggregate `totalFee`: `219,667,947 sats`; per-block sum reconciles exactly.
- Aggregate `totalReward`: `45,219,667,947 sats`; reward minus fees is `45,000,000,000 sats = 450 BTC`.
- Protocol subsidy independently calculated over those same 144 heights: `450 BTC`.
- Per-block fee total: `2.19667947 BTC`.
- Research candidate ratio: `219,667,947 / 45,000,000,000 = 0.0048815099333`, approximately `0.488151%` of subsidy.
- All 144 block heights are distinct and contiguous; every parent hash links to the preceding block; the canonical hashes at both window boundaries and the chain tip height/hash were identical before and after capture.
- Evidence JSON SHA-256: `6895f032f24b2e0063b995b0b5331ae23ed8838cec8ab8d11e69947f3b13bb34`.

**Decision: review-only, not yet production-accepted.** This is materially stronger than the prior aggregate-only candidate, but the window ends at the captured tip. Re-capture after at least six additional blocks and compare every overlapping height/hash/fee to identify any reorganization. The deployed API implementation/version is not independently pinned by response metadata; keep that as a separate acceptance gate. No registry/runtime changes or ingestion.

## 2. Circulating supply source review

Candidate capture: Blockchain.com chart `https://api.blockchain.info/charts/total-bitcoins?timespan=all&format=json`.
- HTTP 200; 1,501 daily chart points.
- Chart name: `Bitcoins in circulation`; unit: `BTC`; period: `day`.
- Latest returned point: `20,097,468.75 BTC`, timestamp `2026-10-13T04:22:46Z` (UTC date 2026-10-13).
- Retrieved at `2026-10-17T14:29:00Z`; point age at retrieval was about 106 hours, exceeding the registry's 48-hour window.
- Raw response SHA-256: `ff6f63571b08ba5be72148927117f51ac6e2af4d82eb90ac1cd85772d9d20f94`.

**Decision: BLOCKED.** This is a candidate total-issued/mined-supply chart, not a direct measure of economically spendable BTC; its latest point is stale for the 48-hour contract, and the metric registry currently prioritizes `network.primary`, whereas this capture is registered as `analytics`. Do not promote it, alter the registry, or use it as a current input without a reviewed source-priority/methodology decision. The source date, unit and lineage are now explicit, so the old baseline value should not be silently refreshed from this candidate.

## 3. Mandatory-input freshness recheck

Latest read-only staging run: [BTC Public Source Staging #39056926908](https://github.com/olegsh247-stack/Crypto/actions/runs/39056926908). It passed the new per-block fee-window tests and uploaded the full review artifact; temporary artifact retention is seven days.

| Input | Latest reviewed evidence | Freshness / acceptance |
|---|---|---|
| BTC/USD spot | Kraken `81,451.00 USD/BTC`; trade at `2026-10-17T14:30:34.877Z`; retrieval `14:30:36Z` | Fresh under 1 hour; candidate only, not ingested |
| Hashrate | `1009.5138912218121 EH/s`; daily bucket `[2026-10-16T00:00Z, 2026-10-17T00:00Z)` | Fresh under 48 hours; daily estimate; candidate only |
| Fee/subsidy | 144-block per-height audit: `0.0048815099333` (2.19667947 BTC fees / 450 BTC subsidy) | 144 heights, parent links, aggregate fees/subsidy, boundary hashes and stable tip verified; review-only pending ≥6-block recapture comparison and deployed-version parity |
| DXY | Previously captured Yahoo Finance `DX-Y.NYB` daily close `101.84` for session date 2026-10-16 | Within 48 hours as of this recheck, but not approved by the current canonical source allowlist; optional context only in offline rehearsal |
| US BTC spot ETF flows | Farside page checked 2026-10-17: page date 2026-10-17, latest completed session row 2026-10-16; all 12 fund values present and fund sum reconciles to displayed -82.4 USD million. Exact observation/publication time and revision/finality are not supplied | **Session-date freshness is current**, but canonical acceptance remains blocked pending a second snapshot ≥24 hours later, revision/retention review, and approved session-aware freshness contract. TFTC/SoSoValue remain cross-checks only |
| Circulating supply | Mempool tip height 971896, hash `0000000000000000000142a5ac84bd7c3f866ac84b97d56b1ec23a2267258cf5`; block timestamp `2026-10-17T18:03:12Z`; protocol-scheduled total issuance `20,099,678.125 BTC`; retrieval `18:10:40Z`; payload SHA-256 `34aa5237f233a6de7d5db91a9738237d509ed0f3e89fad20157f17e2fb11da96` | Fresh candidate under 48h and source ID matches `network.primary`; **review-only** until the metric is explicitly defined as protocol-issued supply rather than economically spendable supply. Blockchain.com chart remains a stale cross-check dated 2026-10-13 |

Consequently, the current BTC scenario is still **`not_evaluable`**. Fresh spot and hashrate do not compensate for the unresolved ETF acceptance, fee/subsidy reorg/version proof, and supply metric-semantics gates. DXY remains optional macro context and is excluded from canonical scenario inputs until its source access and daily-close freshness contract are approved; it is not used as a silent substitute for a mandatory BTC input. No database was read or changed in this staging run.

## 4. Reproducible offline BTC scenario

Added:
- `fixtures/btc-offline-scenario-v1.json`
- `scripts/run-btc-offline-scenario.mjs`

The runner recomputes the historical fixture's price return, five-session ETF sum, DXY change and fee/subsidy context from the committed source values, asserts the deterministic rule output, and prints the result. It uses no network or database and cannot persist a scenario state.

Expected result:
- Rule: `BTC-Scenario-Rule-v1`
- Scenario: `base`
- Directional score: `-1`
- Confidence band: `low`
- Baseline probabilities changed: `false`
- Scenario state persisted: `false`

This is a historical deterministic rehearsal, **not a current market evaluation**. The fixture explicitly marks itself as non-live, not a database observation set, and not approved for ingestion. The BTC Scenario Readiness Gate passed on commit `35c93bd9`, including the offline runner step. The updated source-staging parser passed on commit `0490aa4b` and now explicitly reports the fee/subsidy metric as blocked for production acceptance. The separate VPS build/rehearsal remains tracked by its own workflow.

## 5. Safety and next gate

- No production DB access/writes, observation ingestion, scenario-state writes, monitoring-event writes, or probability updates.
- Fee/subsidy is now explicitly blocked rather than implicitly accepted from a numeric aggregate.
- Protocol-issued supply now has a fresh, reorg-checked Mempool tip candidate; it remains review-only until metric semantics are approved. The older Blockchain.com chart remains a stale cross-check and is not used as the current observation.
- BTC stays `not_evaluable` until the canonical ETF two-snapshot/revision/retention gate and the fee/subsidy and supply acceptance contracts are resolved. DXY is optional context and remains excluded while its access/freshness contract is blocked. The offline fixture does not override any mandatory input gate.
