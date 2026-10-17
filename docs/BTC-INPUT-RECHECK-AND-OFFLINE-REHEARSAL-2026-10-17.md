# BTC Input Recheck and Offline Scenario Rehearsal — 2026-10-17

**Mode:** public-source staging and offline-only deterministic calculation. No production database access, ingestion, scenario-state persistence, monitoring-event writes or baseline probability changes.

## 1. Fee/subsidy: final acceptance decision

The Mempool.space `/api/v1/mining/reward-stats/144` endpoint returns aggregate totals, not individual block hashes. The upstream implementation reviewed in the repository sums `reward` and `fees` for the latest N rows with `stale = 0`; the public response does not prove the deployed backend version or expose every block identity.

Latest review capture at 2026-10-17 14:30:36 UTC:
- HTTP 200; blocks `971730–971873`, inclusive count 144.
- `totalReward = 45,230,958,590 sats`.
- `totalFee = 230,958,590 sats`.
- `totalReward - totalFee = 45,000,000,000 sats = 450 BTC`, matching 144 × 3.125 BTC.
- Candidate ratio: `230,958,590 / 45,000,000,000 = 0.0051324131111`, or `0.5132413111%` of subsidy.
- Raw response SHA-256: `285d16d799a9ad3f51f23178e8bb9bea3d2048103b77e34f2aff17e9656ad71f`.

**Decision: BLOCKED for production acceptance.** The numeric calculation and height range are internally consistent, but this aggregate cannot prove the canonical hash identity of each included block or exclude an in-window reorganization. The deployed API version is also not pinned by response metadata. The capture parser now reports `BLOCKED_REORG_AND_DEPLOYED_VERSION_UNVERIFIED` even when the arithmetic succeeds. Do not ingest this value as an accepted observation. To reopen acceptance, use a source/method that preserves block identities and fee/subsidy components for a fixed 144-block window, or establish equivalent independently verifiable chain evidence; pin the deployed source version and test a reorg/re-capture fixture. No production registry or runtime adapter was changed.

## 2. Circulating supply source review

Candidate capture: Blockchain.com chart `https://api.blockchain.info/charts/total-bitcoins?timespan=all&format=json`.
- HTTP 200; 1,501 daily chart points.
- Chart name: `Bitcoins in circulation`; unit: `BTC`; period: `day`.
- Latest returned point: `20,097,468.75 BTC`, timestamp `2026-10-13T04:22:46Z` (UTC date 2026-10-13).
- Retrieved at `2026-10-17T14:29:00Z`; point age at retrieval was about 106 hours, exceeding the registry's 48-hour window.
- Raw response SHA-256: `ff6f63571b08ba5be72148927117f51ac6e2af4d82eb90ac1cd85772d9d20f94`.

**Decision: BLOCKED.** This is a candidate total-issued/mined-supply chart, not a direct measure of economically spendable BTC; its latest point is stale for the 48-hour contract, and the metric registry currently prioritizes `network.primary`, whereas this capture is registered as `analytics`. Do not promote it, alter the registry, or use it as a current input without a reviewed source-priority/methodology decision. The source date, unit and lineage are now explicit, so the old baseline value should not be silently refreshed from this candidate.

## 3. Mandatory-input freshness recheck

Latest read-only staging run: [BTC Public Source Staging #39041045356](https://github.com/olegsh247-stack/Crypto/actions/runs/39041045356). Artifact digest: `sha256:d36abc2acd66d1a3f31ffa2d078c45eb6cef56da2011460032175ba50b0aac62`; temporary artifact expires 2026-10-24. The run passed after the parser was changed to explicitly block fee/subsidy production acceptance pending reorg/version proof.

| Input | Latest reviewed evidence | Freshness / acceptance |
|---|---|---|
| BTC/USD spot | Kraken `81,451.00 USD/BTC`; trade at `2026-10-17T14:30:34.877Z`; retrieval `14:30:36Z` | Fresh under 1 hour; candidate only, not ingested |
| Hashrate | `1009.5138912218121 EH/s`; daily bucket `[2026-10-16T00:00Z, 2026-10-17T00:00Z)` | Fresh under 48 hours; daily estimate; candidate only |
| Fee/subsidy | 144-block candidate ratio `0.0051324131111` | Arithmetic valid; production acceptance blocked by reorg/version proof |
| DXY | Previously captured Yahoo Finance `DX-Y.NYB` daily close `101.84` for session date 2026-10-16 | Within 48 hours as of this recheck, but not approved by the current canonical source allowlist; optional context only in offline rehearsal |
| US BTC spot ETF flows | Farside page checked 2026-10-17: page date 2026-10-17, latest completed session row 2026-10-16; all 12 fund values present and fund sum reconciles to displayed -82.4 USD million. Exact observation/publication time and revision/finality are not supplied | **Session-date freshness is current**, but canonical acceptance remains blocked pending a second snapshot ≥24 hours later, revision/retention review, and approved session-aware freshness contract. TFTC/SoSoValue remain cross-checks only |
| Circulating supply | Mempool tip height 971896, hash `0000000000000000000142a5ac84bd7c3f866ac84b97d56b1ec23a2267258cf5`; block timestamp `2026-10-17T18:03:12Z`; protocol-scheduled total issuance `20,099,678.125 BTC`; retrieval `18:05:22Z`; payload SHA-256 `c62b776119cb8177804135945e4d620eb1db4b8fe0df40b8bfa1bbdb5ea75cab` | Fresh candidate under 48h and source ID matches `network.primary`; **review-only** until the metric is explicitly defined as protocol-issued supply rather than economically spendable supply. Blockchain.com chart remains a stale cross-check dated 2026-10-13 |

Consequently, the current BTC scenario is still **`not_evaluable`**. A fresh spot trade and fresh hashrate do not compensate for the ETF gate or the unapproved DXY source. No database was read or changed in this staging run.

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
- BTC stays `not_evaluable` until the canonical ETF latest-row freshness/provenance gate and the approved-source gate for DXY are resolved. The offline fixture does not override those gates.
