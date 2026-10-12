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
| BTC spot price | Numeric, source-linked, marked CURRENT, observed within 24 hours |
| Network hashrate | Numeric, source-linked, marked CURRENT, observed within 7 days |
| Fee-market / security economics | Numeric, source-linked, marked CURRENT, observed within 7 days |
| DXY macro proxy | Numeric, source-linked, marked CURRENT, observed within 5 days |
| US spot ETF net flows | At least 5 distinct recent daily observations, each source-linked and CURRENT; latest within 48 hours |

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
