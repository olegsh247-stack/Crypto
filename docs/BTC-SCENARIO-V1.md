# BTC — Product Scenario v1

**Asset:** BTC (Bitcoin)  
**Research snapshot:** `BTC-2026-10-07-v1`  
**Methodology:** CryptoResearch v2 / Structure 1  
**Scenario status:** Published research baseline; not a live scenario evaluation  
**Scope:** One complete scenario path through the existing Product Contour. No schema or production data changes.

## Decision statement

The published BTC research baseline selects **Base** as the reference scenario. The thesis remains positive because Bitcoin's monetary scarcity, proof-of-work security, liquidity and institutional access support its monetary-asset role. The thesis is conditional rather than unconditional: macro liquidity, institutional flows, custody/regulatory access and long-term miner economics can materially change the outcome.

The selection is a research baseline from the published snapshot, not a claim that a scenario engine has evaluated fresh live inputs. The current schema/API supports scenario definitions and scenario states separately. Until a state tied to this exact snapshot exists, the dashboard labels Base as a published baseline rather than presenting it as a freshly evaluated state.

## Scenario set

| Scenario | Baseline probability | Confidence | Thesis impact |
|---|---:|---:|---|
| Bull | 30% | 0.84 | Positive |
| Base | 50% | 0.88 | Neutral / conditional |
| Bear | 20% | 0.78 | Negative |

Probabilities sum to 100%. They are the values in the published research definition, not market-implied probabilities.

### Base — selected reference scenario

**Assumptions**
- Bitcoin remains the dominant crypto monetary asset.
- Institutionalization and regulated access continue.
- Price performance remains cyclical and sensitive to macro liquidity and risk appetite.
- Proof-of-work security remains robust while miner revenue and fee-market development require continued attention.

**Supporting research**
- The published Structure 1 snapshot and its monetary-asset thesis.
- BTC evidence linked to the research blocks for monetary role, scarcity, network security, institutional access, macro sensitivity, risks and catalysts.
- The critical factors in the same snapshot: Monetary Demand, Institutional Allocation, Network Security, Fee-Market Strength, Decentralization, and Regulatory / Custody Environment.

**Invalidation conditions**
- Sustained loss of monetary demand.
- Credible deterioration in long-term network-security economics.
- Persistent institutional outflows or a material contraction in regulated access.
- A macro/liquidity regime that undermines the monetary-demand thesis for a sustained period.

**What would strengthen Base / shift toward Bull**
- Persistent institutional allocation and broader regulated access.
- Strong monetary demand without material deterioration in decentralization or miner economics.
- Evidence that the fee market can increasingly support security as subsidy issuance declines.

**What would weaken Base / shift toward Bear**
- Persistent institutional outflows and reduced access.
- Prolonged fee-market weakness combined with deteriorating miner economics.
- A material rise in mining, custody or infrastructure concentration.
- Sustained loss of BTC's relative monetary demand.

## Evidence and confidence boundaries

The current BTC migration creates a qualitative evidence chain connecting the published snapshot, research blocks, observations and registered sources. This is useful for traceability, but it must not be mistaken for a fresh quantitative evaluation:

- The research evidence is primarily qualitative baseline evidence.
- The monitoring signals seeded for BTC are baseline descriptions, not a complete live quantitative monitoring feed.
- The prior read-only Product Contour audit found no BTC `scenario_states` or `monitoring_events` rows. This patch does not create either row type or mutate production data.
- Existing market observations need freshness/provenance checks before they can change scenario status.
- No automatic transition among Bull / Base / Bear is introduced.

## Product behavior

On the Asset Dashboard:

1. If a scenario state matches the active published snapshot, show that state joined to its matching scenario definition.
2. If no snapshot-linked state exists, show the published Base definition as the **research baseline** and explicitly disclose that no snapshot-linked evaluation is recorded.
3. Do not join a state from an older snapshot to a definition from the current snapshot.
4. Continue to show all Bull / Base / Bear definitions, assumptions and invalidation conditions in the Scenarios section.
5. Do not fabricate an event, live probability, updated confidence or monitoring timestamp to make the scenario appear current.

## Acceptance criteria for this first scenario

- [x] One published BTC snapshot is identified.
- [x] Bull / Base / Bear definitions and probabilities are explicit.
- [x] Base assumptions and invalidation conditions are documented.
- [x] Supporting research and critical factors are named.
- [x] The UI distinguishes a published baseline from a snapshot-linked scenario state.
- [ ] Add and validate a real scenario-state evaluation only after its input metrics, source timestamps, and deterministic evaluation rule are specified.
- [ ] Populate monitoring events only from material, traceable observations.

**Conclusion:** BTC now has a clear, honest published Base scenario presentation. It is not yet a live-evaluated scenario engine; that remaining distinction is explicit rather than hidden.


## Live-data gate — read-only check on 2026-10-12

The published BTC snapshot and scenario definitions were checked against the current database:

- Snapshot `BTC-2026-10-07-v1` is `PUBLISHED`; all 15 blocks are complete and all 15 blocks have a domain link.
- The snapshot has 6 Critical Factors, 5 Scores, 3 Scenario definitions and 15 Evidence rows covering all 15 blocks.
- Scenario probabilities are Base 50%, Bull 30%, Bear 20%.
- There are 7 monitoring signals, but **zero scenario-state rows and zero monitoring-event rows**.
- There are 33 observation rows across 21 metrics; 18 rows are marked stale.
- Nine duplicate logical-key groups exist in the observations table, each with identical payload/provenance. Two rows lack a source URL.
- The numeric spot-price, hash-rate, circulating-supply, subsidy and ETF-flow observations are dated September 18–19 and marked stale. Fresh market candles do not make these separate observations fresh.
- The persisted research review state remains `current` until its scheduled review date, but that does not override per-metric stale flags.

### Evaluation decision

**Do not calculate or persist a live Bull/Base/Bear state from these inputs yet.** The current Base remains the published research baseline only. A live evaluation requires refreshed, source-verified values for the existing BTC inputs, a documented deterministic rule, and explicit data-freshness gates. The duplicate observation rows are preserved; the seed script is now idempotent for future reruns, but the existing rows were not deleted or rewritten.

The idempotency regression passed in disposable PostgreSQL on [PR #22](https://github.com/olegsh247-stack/Crypto/pull/22). That proves reruns will not add another copy of the targeted seed observations; it does not repair the existing live duplicates or refresh stale values.


## Deterministic evaluation preparation — input-quality gate

The next implementation step is a fail-closed input gate, not a scenario prediction. It deliberately does not write `scenario_states`, change the published 30/50/20 baseline probabilities, or create monitoring events.

### Required input contract

| Input | Requirement before evaluation |
|---|---|
| BTC spot price | Numeric, source-linked, marked CURRENT, observed within the registry's 1-hour window |
| Network hashrate | Numeric, source-linked, marked CURRENT, observed within the registry's 48-hour window |
| Fee-market / security economics | Numeric, source-linked, marked CURRENT, observed within the registry's 48-hour window |
| DXY macro proxy | Numeric, source-linked, marked CURRENT, observed within the registry's 48-hour window |
| US spot ETF net flows | At least 5 distinct recent daily observations, each source-linked; latest observation must be CURRENT and within the registry's 36-hour window |

All observation timestamps must be valid and not in the future. A value with a URL but a `STALE` freshness flag is not accepted. Duplicate rows for the same ETF-flow day count only once. A missing required metric is a blocker, not an implicit neutral signal.

The new pure function `scripts/btc-scenario-readiness.mjs` returns either `not_evaluable` with explicit blockers or `ready_for_rule_evaluation` with selected inputs and provenance. It always returns `can_persist_scenario_state: false`: passing the input gate is not the same as having an approved directional scoring rule.

### Current live-data implications

The read-only audit already establishes that the current spot price, hashrate and ETF-flow observations are stale. The audit also did not find a numeric fee-market observation in the BTC input set. Therefore the live dataset must fail this gate today. That is the intended outcome: no stale-value fallback, no guessed refresh, no fabricated Base/Bull/Bear state.

### Automated checks

The unit tests cover fresh traceable inputs, missing fee-market data, stale and future-dated observations, insufficient distinct ETF-flow days, and missing source URLs. The workflow runs on the isolated test fixtures only and has no database credentials or deployment step.

### Next acceptance gate

1. Obtain source-verified fresh observations for the existing inputs and establish the correct fee-market metric definition/source.
2. Specify and review the directional rule that maps those inputs to Bull/Base/Bear, including how contradictory inputs and invalidation events are handled.
3. Validate the rule against fixtures and historical cases without writing to production.
4. Only after those gates pass, plan the controlled persistence of a snapshot-linked scenario state and traceable monitoring events.


## Source review for candidate input refresh — 2026-10-12

This is a source review, not a production data update. The values below are candidate observations for the next controlled refresh; they have not been written to the database.

| Input | Candidate value / state | Observation window | Source and limitation |
|---|---|---|---|
| BTC spot price | Approximately $82.9k–$83.5k across reports | 11–12 Oct | [Investing.com historical BTC prices](https://www.investing.com/crypto/bitcoin/historical-data?cid=1057388) reports 74,792.6 EUR for 12 Oct; [Barron's market coverage](https://www.barrons.com/livecoverage/stock-market-news-today-101226/card/one-year-since-crash-most-leverage-leaves-bitcoin-AWXLCRuorwMwWeGeKn2W) reports $83,450. Different currencies and observation times mean a canonical USD point still needs a timestamped exchange API observation. |
| US spot BTC ETF net flow | +$21.1m on 9 Oct; October-to-date about −$386.3m through 9 Oct | 1–9 Oct trading sessions | [Farside Investors primary table](https://farside.co.uk/btc/) reports +102.7, +189.9, −89.8, +118.8, −484.9, −244.1 and +21.1 USD millions on the seven sessions shown. Flow data is daily, not continuous over weekends. |
| Network hashrate | About 1,029 EH/s for 11 Oct; 7-day mean about 984 EH/s in the cited calculation | Completed UTC days through 11 Oct | [Mempool.space mining API documentation](https://mempool.space/fa/docs/api/rest) exposes network hashrate series. [Satoshi Gazette's dated calculation](https://satoshigazette.org/data/mining?end=2026-10-12&window=30) documents the source, daily window and smoothing method; use the raw API and record the calculation method in the observation. |
| Fee/subsidy ratio | Candidate about 0.00413 (0.413%) | Recent 144 blocks, page checked 12 Oct | [Mempool.space mining dashboard](https://mempool.space/mining) reports average fees per block 0.0129 BTC; protocol subsidy is 3.125 BTC, so fees/subsidy = 0.0129 / 3.125. This is a short-window level, not by itself a trend or proof of long-term miner sustainability. |
| DXY | 102.39 | 12 Oct | [Investing.com DXY historical data](https://www.investing.com/indices/usdollar-historical-data) reports 102.39 on 12 Oct. This is a secondary market-data source; the canonical ingestion policy should retain its timestamp and provenance. |

### Implications for the input gate

1. Existing stale database observations are not silently overwritten by this source review.
2. The canonical metric ID for fee-market economics is `security.fee_subsidy_ratio` (already present in `metric_definitions`), not a new ad-hoc metric name.
3. The current fee/subsidy ratio is only a point-in-time estimate. Directional evaluation should compare a consistent rolling series (for example, seven complete UTC days) and keep the methodology/version.
4. The latest ETF-flow date found in Farside's table is 9 Oct. On 12 Oct this is still within the 48-hour gate, but the series has to be inserted with correct UTC dates, freshness, and source provenance before it can pass the database gate.
5. Spot price requires a canonical USD exchange observation with an explicit timestamp. Do not turn a cross-source price range into one synthetic observation.
6. Even when refreshed observations pass the quality gate, the directional Bull/Base/Bear scoring rule remains a separate review gate; no scenario state or probability update is authorized by this source review.


## Deterministic directional rule — BTC-Scenario-Rule-v1 (not yet applied to live data)

A pure, unit-tested rule makes scenario transitions reproducible. It is separate from the published 30% / 50% / 20% research probabilities. It does not persist state or modify those probabilities.

| Signal | Bull point | Bear point | Neutral band |
|---|---:|---:|---|
| BTC spot-price return over 7 complete UTC days | at least +5% | at most −5% | Between −5% and +5% |
| Sum of US spot BTC ETF net flows over latest 5 distinct trading days | at least +$500m | at most −$500m | Between −$500m and +$500m |
| Network hashrate: latest 7-day mean versus previous 7-day mean | at least +3% | at most −3% | Between −3% and +3% |
| DXY change over 5 complete UTC days | at most −0.5% | at least +0.5% | Between −0.5% and +0.5% |

Each directional signal contributes +1, 0, or −1. The result is Bull at a score of +3 or +4, Bear at −3 or −4, and Base for all scores from −2 through +2. The confidence band is descriptive only: high at absolute score 4, medium at absolute score 3, and low for Base. It does not change scenario probabilities.

The fee/subsidy ratio (`security.fee_subsidy_ratio`) is a required security-economics context input, but is not a directional vote in v1: a higher ratio alone can reflect stronger fee demand or temporary congestion.

These are explicit initial engineering guard bands, not statistically calibrated probabilities or a claim of predictive edge. Before production use, validate them against historical snapshots and review threshold suitability. Derived percentages must come from timestamped, source-linked inputs with consistent UTC windows. Missing or stale inputs block evaluation before this rule is called. Even after an evaluation result is produced in tests, `can_persist_scenario_state` remains false; persistence requires a separate reviewed integration and approved release.


## Dry-run of the directional rule against source-reviewed inputs — 2026-10-12

This is a reproducible calculation from public source pages, not a live database evaluation and not a persisted scenario state.

| Signal | Source-reviewed input | Rule result |
|---|---:|---|
| BTC 7-day return, close 4 Oct $86,480.30 to close 11 Oct $83,679.46 | about −3.24% | Neutral (inside ±5%) |
| US spot BTC ETF flows, five sessions 5–9 Oct | −$678.9m | Bearish vote (≤ −$500m) |
| Network hashrate, 7-day mean versus prior 7-day mean | about +1% | Neutral (inside ±3%) |
| DXY, 7 Oct 102.24 to 12 Oct 102.39 | about +0.15% | Neutral (inside ±0.5%) |
| Fee/subsidy ratio | 0.0129 / 3.125 = about 0.00413 | Context only; no directional vote |

Sources: [StatMuse BTC historical closes](https://www.statmuse.com/money/ask/bitcoin-price-history-october-2026), [Farside Investors ETF-flow table](https://farside.co.uk/btc/), [Satoshi Gazette hashrate series and methodology](https://satoshigazette.org/data/mining?end=2026-10-12&window=30), [Investing.com DXY history](https://www.investing.com/indices/usdollar-historical-data), and [Mempool.space mining dashboard](https://mempool.space/mining).

The resulting directional score is **−1**, so the rule returns **Base** (the ETF-flow signal is negative, while the other three directional signals are within their neutral bands). This is consistent with the rule's 3-of-4 threshold and does not prove the rule has predictive value.

Limitations: source timestamps and aggregation windows are not yet ingested into the database with a canonical shared data contract; the source review is a candidate fixture, not an approved production input set. The fee/subsidy ratio is a recent 144-block value, not a validated 7-day series. Therefore this dry-run does **not** satisfy the input-quality gate and must not be presented as a live-evaluated state.


## Scope correction — research scenario, not a trading signal

The directional rule described above is an **offline engineering prototype**, not an approved Crypto product feature. Its thresholds are not statistically calibrated, and the source-reviewed fixture is not a live database evaluation. It must not be presented as a trading recommendation, market-timing signal, or probability forecast.

For Product Contour v1, the intended BTC scenario is an evidence-backed research object:

1. Preserve the published Base / Bull / Bear research definitions and their stated assumptions.
2. Connect each material assumption and invalidation condition to a metric or evidence source, including source timestamp, method and freshness.
3. Monitor whether the observed evidence confirms, weakens or invalidates those assumptions.
4. Emit an explainable research event only when a documented condition is met; include the observation, source, condition, snapshot and methodology version.
5. Keep baseline probabilities as authored research judgments unless a separately reviewed research methodology explicitly revises them.

**Out of scope for Product Contour v1:** buy/sell/entry/exit signals, position sizing, order execution, price-target forecasting, portfolio allocation, and uncalibrated automatic Bull/Base/Bear scoring. The offline directional-rule prototype is not wired to production, does not change scenario probabilities, and must not be used as the acceptance criterion for the product scenario.

### Revised BTC completion criterion

The BTC scenario is complete when the published research scenario, its evidence, input freshness/provenance, explicit confirmation/invalidation conditions, and snapshot-linked monitoring evaluation form one auditable chain. This does not require a trading strategy or an asserted predictive edge.


## Input-gate correction — 2026-10-12

The ETF-flow readiness gate now checks the newest recorded ETF-flow row before filtering for valid observations. If that newest row is stale, future-dated, malformed, or lacks current freshness/provenance, readiness fails closed; it cannot silently fall back to older rows even when five older days pass the individual row checks. A regression test covers a stale newest row with five older current rows. This is a pure rule/test change: no database reads or writes, no scenario state, and no monitoring event.


## VPS API evidence contract verification — 2026-10-12

The target VPS API and disposable-PostgreSQL Build Rehearsal now verify the published BTC research chain without creating a live evaluation:

- `evidence` is returned for the active published snapshot, including block/domain, observation and metric, source URL, observed value/unit, claim, signal, assessment, confidence, thesis impact and status.
- Evidence-linked sources are included in the top-level source registry.
- Critical factors, scores and scenario states are restricted to the active published snapshot; scenario definitions expose their `snapshot_id`.
- E2E verifies the BTC snapshot `BTC-2026-10-07-v1`, 15 evidence records covering all 15 blocks, six factors, five scores, Bull/Base/Bear definitions and probabilities summing to 100%.
- The clean baseline still contains no `scenario_states` or `monitoring_events`; the seven monitoring signals remain descriptive baseline entries. This is intentional and is now asserted by CI.
- The ETF input-quality gate rejects a stale/untraceable newest row instead of silently falling back to older daily observations.

These are target API contract checks against disposable PostgreSQL. They do not prove that the currently serving public API is on the VPS, do not repair the historical duplicate/stale production observations, and do not authorize a scenario-state or event write.

The current factor-to-input and event acceptance requirements are documented in [BTC Monitoring Readiness Matrix v1](./BTC-MONITORING-READINESS-MATRIX.md). Remaining BTC blockers are source-verified fresh observations, reviewed metric aggregation windows, and explicit confirmation/invalidation conditions before any live state/event is persisted.


## Reproducible evaluation gate — 2026-10-13

The deterministic rule implementation is present in `scripts/btc-scenario-direction.mjs` (`BTC-Scenario-Rule-v1`) and is covered by `scripts/btc-scenario-direction.test.mjs`. The read-only readiness gate is implemented in `vps/shared/src/btc-scenario-readiness.ts` and covered by `scripts/btc-scenario-readiness.test.mjs`. These tests prove rule behavior and fail-closed input checks using fixtures; they are not evidence that today's real input set is complete.

### Current result: NOT EVALUABLE

The latest documented source review, `docs/BTC-SOURCE-REFRESH-REVIEW-2026-10-13.md`, explicitly keeps all captured candidates out of production ingestion. The Kraken spot candidate has now also passed a real, rollback-only PostgreSQL rehearsal, but that validates capture and storage contract only. It does not promote the candidate to an accepted scenario input.

| Required input | Current decision | Why it cannot enter the rule yet |
|---|---|---|
| Spot-price return, 7 days | Candidate source path validated; historical window still needs accepted, traceable points and logical-key/source contract review | One fresh point is not a 7-day return series |
| ETF net flow, 5 sessions | Blocked | Farside returned HTTP 403; TFTC mirror is stale and its mixed lineage/revision semantics are unresolved |
| Hashrate change, 7 days | Candidate only | Daily series bucket/smoothing semantics and stored metric mapping remain to be accepted |
| DXY change, 5 days | Blocked | No canonical endpoint and daily-close timestamp convention accepted |
| Fee/subsidy ratio | Blocked / context only | Averaged fees/rewards endpoints were rejected as proof of individual-block values; 165-block staging validation passed, but the proposed 144-block metric window remains candidate-only until its metric contract is accepted |

The readiness gate therefore must return `not_evaluable` for the current accepted-input set. Do not pass hand-entered values, old test fixtures, or candidate-only captures as though they were accepted live observations. In particular, do not use the previously documented illustrative October 12 fixture as today's evaluation.

### Next actions, in order

1. Finalize the fee/subsidy metric contract from the validated individual-block staging artifact: exact block window, numerator/denominator units, timestamp convention, and freshness/aggregation meaning. Keep it candidate-only until reviewed.
2. Resolve a canonical ETF flow source with current rows, publication timestamps, lineage, and revision semantics; missing/403 values are not zero.
3. Select and document a canonical DXY endpoint and daily-close convention.
4. Accept the price and hashrate historical series contracts and compare candidate logical keys against the repository's canonical schema/source registry using a read-only rehearsal.
5. Assemble an explicit immutable input manifest with source URLs, observed/retrieved timestamps, units, revisions, and payload hashes. Run readiness first; run `BTC-Scenario-Rule-v1` only if readiness returns `ready_for_rule_evaluation`.
6. Save the evaluation output as a review artifact only. Do not write `scenario_states`, `monitoring_events`, alter published probabilities, or connect scheduled production ingestion as part of this step.

**Decision:** the BTC scenario definition and deterministic rule are ready for a controlled evaluation, but the current real-world input set is not. The honest result is `not_evaluable`; Base remains the published research baseline, not a fresh evaluated state.


## Reproducible scenario gate — live candidate isolated, 2026-10-13

The latest standard CI set for the BTC Kraken branch is green on commit `72becab84d2def726df838204083822221410d2e`:

- [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38360967535) — success.
- [Seed observation idempotency rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38360967510) — success.
- [Validate VPS Release Workflow](https://github.com/olegsh247-stack/Crypto/actions/runs/38360967585) — success.

The live Kraken rollback rehearsal proved a single source candidate can be parsed and written only inside a disposable transaction, with duplicate handling and rollback verified. The captured sample was 83,590.3 USD/BTC at `2026-10-13T07:09:13.118Z`, retrieved at `2026-10-13T07:09:25.872Z`; it is historical evidence of the capture path, not a claim that the quote remains fresh now.

A new regression test passes a real-shaped, source-registered Kraken candidate into the scenario readiness gate alongside no other inputs. The expected result is `not_evaluable`, with explicit missing blockers for hashrate, fee/subsidy economics, DXY and the required ETF-flow series, and `can_persist_scenario_state=false`. This prevents one fresh price from being mistaken for a complete scenario input set.

The gate's age limits now documented here follow the canonical metric registry: spot price 1 hour, hashrate 48 hours, fee/subsidy ratio 48 hours, DXY 48 hours and latest ETF flow 36 hours. These are data-quality limits, not directional scoring thresholds.

**Current decision: no live scenario evaluation is accepted yet.** Next, source-verified inputs must be acquired for the remaining required metrics and at least five distinct ETF-flow days, with canonical units, source registration, observation timestamps, freshness and calculation windows. Fee/subsidy must be sourced as a documented rolling series before any factor confirmation/invalidation assessment. No scenario state or monitoring event is persisted by this change.


### Evidence refresh — staging run #27

The latest read-only capture is documented in `docs/BTC-SOURCE-REFRESH-REVIEW-2026-10-13.md` and artifact [BTC Public Source Staging #27](https://github.com/olegsh247-stack/Crypto/actions/runs/38361508900). It refreshed the Kraken candidate to 83,653.8 USD/BTC (exchange timestamp 07:15:24.229 UTC, retrieved 07:15:27.009 UTC) and the daily hashrate series to 999.342298838022 EH/s at 00:00 UTC. The 165-block validation passed; a proposed 144-block rolling ratio was 0.006309380666666667. All are still candidate-only.

The fee/subsidy metric registry says `frequency: 1d`; the proposed 144-block rolling window is not identical to a UTC calendar day. That definition must be decided and tested before using the ratio. Current capture manifest reports no production DB access or writes. ETF and DXY blockers remain open, so no current full-rule evaluation was run.

### Evidence refresh — directional series candidate capture #28

Read-only staging run [#38362350907](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907) passed all six directional-series parser tests and captured the historical Kraken OHLC and Mempool hashrate series. Artifact [11795391910](https://github.com/olegsh247-stack/Crypto/actions/runs/38362350907/artifacts/11795391910), archive SHA-256 `7ad8a07ef0b818c0c2f3ac24bf05f2a515adafb1552d486dea6ce911d1de8c49`.

- Kraken completed daily close through 2026-10-12: 81,737.1 USD/BTC; close seven days earlier: 85,751.5 USD/BTC; candidate return: −4.6814%. Raw payload SHA-256: `97628c0fb352d68b5625c7d58d8fa3a4cb70c633bd9df63936797130f67d666a`.
- Mempool daily hashrate candidate through 2026-10-12: 1,028.5949 EH/s; seven days earlier: 946.4696 EH/s; candidate change: +8.6770%. Raw payload SHA-256: `875785ad9fbaacb4a70ae209c2a4843377fb2fb38cb4c243b036530b28dd74f1`.

These calculations are reproducible candidate values, **not accepted rule inputs**. Kraken OHLC uses `market_kraken`, while canonical `market.spot_price` priority is `market.kraken`; do not alias the IDs without an explicit source contract decision. Mempool's endpoint is documented as a daily-average hashrate series; the capture now preserves UTC date labels and excludes the current UTC date rather than treating a value as instantaneous. This clarifies the series semantics but does not yet approve its metric-to-observation mapping. ETF source freshness/publication convention and DXY remain blocked. The scenario stays `not_evaluable`; no rule evaluation, production write, scenario/monitoring persistence, or probability change was performed.

### ETF flow source gate — CryptoETF.today candidate adapter

Added a read-only candidate adapter and deterministic tests for CryptoETF.today `/api/v1/flows/btc`. The provider documents daily net flows in USD millions, UTC flow dates, 30 days of free-tier history, and T+1 publication with possible same-day revision. The response's `updatedAt` is a response-level timestamp and is not accepted as the latest row's publication timestamp. The provider's public page reports data for 2026-10-09 published on 2026-10-10 05:47 UTC; at the 2026-10-13 review, that display is stale relative to the registry's 36-hour gate.

Implementation: `scripts/capture-btc-etf-flow-candidate.mjs`, tests: `scripts/capture-btc-etf-flow-candidate.test.mjs`, review: `docs/BTC-ETF-FLOW-CANDIDATE-REVIEW-2026-10-13.md`. The staging workflow uses optional secret `CRYPTOETF_API_KEY`; absent credentials result in `BLOCKED_NO_CREDENTIAL` and no request. The current API row schema does not provide per-row publication timestamps, so freshness remains blocked unless that evidence is added or a conservative method is explicitly approved.

No canonical source priority or metric registry was changed. ETF flow remains an unresolved input; scenario remains `not_evaluable`.

### Live ETF flow candidate captured through public MCP — 2026-10-13

The public MCP candidate capture now works against the provider's actual response shape. Staging [run #38371104698](https://github.com/olegsh247-stack/Crypto/actions/runs/38371104698) captured a 30-day BTC flow series; latest row is 2026-10-12 at **−$65.4M**, with six distinct flow dates in the last seven calendar days. Raw payload SHA-256: `4cec024a39ab5355336da610d84fe6ac2bac4700ec04e6b4236179245ea260fb`; artifact [11798629801](https://github.com/olegsh247-stack/Crypto/actions/runs/38371104698/artifacts/11798629801).

The latest flow-date midnight is 32.711 hours before retrieval, inside the 36-hour numerical window, but the response lacks per-row publication timestamps. The global `updatedAt` is not treated as row publication time. This source remains candidate-only until the metric's freshness timestamp convention is explicitly resolved; canonical `institutional.primary` remains unchanged. The scenario remains `not_evaluable` because source acceptance and other required inputs (DXY, hashrate method, fee/subsidy contract) are still unresolved.


### Hashrate contract clarification — 2026-10-13

The candidate capture now explicitly treats Mempool's historical hashrate points as provider-labelled **daily averages**, preserves the UTC-midnight date labels without interpreting them as instantaneous samples, and excludes the current UTC date. The parser tests enforce that method label. This aligns the candidate calculation with the provider's historical daily-average series description ([Mempool REST API](https://mempool.space/docs/api/rest); [endpoint documentation example](https://mempool.emzy.de/docs/api)).

The historical candidate change remains +8.6770% through 2026-10-12, but is not yet accepted as a live rule input. The source/method mapping must still be reviewed against the canonical `security.hashrate` metric contract. The Kraken OHLC source ID remains distinct from canonical `market.kraken`; ETF publication freshness remains unresolved; DXY and fee/subsidy remain blocked. Scenario status stays `not_evaluable`.


### DXY source feasibility — 2026-10-13

Added a read-only Yahoo Finance candidate capture for ticker `DX-Y.NYB`, which Yahoo identifies as the ICE US Dollar Index. This is only a feasibility candidate: the reviewed ICE product page describes commercial delivery channels but does not establish an unauthenticated public feed, and the Yahoo chart response does not prove the exact ICE daily-close/publication timestamp needed for the 48-hour freshness contract. No canonical source priority or metric registry was changed. See `docs/BTC-DXY-CANDIDATE-REVIEW-2026-10-13.md`.

The staging adapter validates and preserves a candidate five-observed-session change, but marks it `CANDIDATE_ONLY` and `BLOCKED_SOURCE_CONTRACT_REVIEW`. It cannot be used by the scenario readiness gate as accepted DXY input. The scenario remains `not_evaluable`.
