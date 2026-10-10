# ETH Scenario-State Evaluation — Draft / Not Publishable

**Assessment date:** 2026-10-09  
**Asset:** ETH  
**Published research baseline:** `ETH-2026-10-04-v1`  
**Candidate scenario:** Base  
**Status:** BLOCKED — evidence refresh and read-only data-lineage verification required  
**This file is not a database record and does not authorize a write to `scenario_states`.**

## Why this is blocked

The published baseline describes the current scenario as “Base with positive catalysts,” but the source artifact itself says current market and ecosystem metrics must be refreshed through Monitoring before treating the snapshot as current. The existing migration's scenario definitions and scores are a qualitative baseline, not proof of conditions on 2026-10-09.

A new dated state must not be inferred only from a five-day-old qualitative snapshot or from the existence of Bull/Base/Bear definitions. Before assigning an observed state, refresh current evidence for:
- ETH price/market regime and its measurement window;
- net issuance versus fee burn;
- staking and validator concentration / exit-entry conditions;
- L1 settlement activity and blob/data demand;
- L2 activity and whether it is translating into ETH value accrual;
- institutional demand only where a dated, attributable source is available;
- roadmap status from primary Ethereum sources, including whether announced dates are targets or confirmed milestones.

Each metric needs an observation timestamp, source URL, definition and window. Do not compare unlike periods or treat roadmap announcements as realized outcomes.

## Provisional hypothesis — not a current assessment

The prior published baseline's **Base** thesis is the correct candidate to test first, not a conclusion to publish automatically:
- Ethereum remains a leading settlement/security ecosystem;
- L2 activity can grow without proportionate value accrual to ETH;
- scaling and data availability are potential catalysts;
- competition, fragmentation and weak ETH value accrual remain material invalidation risks.

This hypothesis is inherited from `ETH-2026-10-04-v1`. It is not evidence that Base is still the observed state on the assessment date.

## Required evidence matrix

| Question | Evidence needed | Decision effect |
|---|---|---|
| Is the market regime consistent with Base? | Dated ETH price/relative-performance series with a declared window; macro/risk-regime evidence | Context only; do not let price alone determine fundamental scenario |
| Is ETH value accrual strengthening? | Issuance/burn metrics, fees and blob demand over comparable windows | Positive or negative evidence for Base vs Bull/Bear |
| Is staking/network security stable? | Dated staking/validator metrics and concentration caveats | Validate security thesis and concentration risk |
| Is Ethereum settlement demand improving? | L1 fees/transactions, blob usage, L2 settlement indicators with source/window | Test the key thesis driver |
| Are L2 gains accruing to ETH? | Compare L2 activity/fees and Ethereum settlement/data economics | Critical discriminator between Bull and Base |
| Has roadmap risk changed? | Official Ethereum roadmap / release notes, distinguishing planned from shipped | Catalyst or execution-risk update |
| Are material invalidation conditions triggered? | Direct evidence mapped to the Base scenario's published invalidation conditions | May shift state toward Bear or require review |

## Scenario-state contract

The current schema defines `scenario_states` with:
- `asset_id`: `eth` only after confirming canonical asset ID in the current target database;
- `scenario_id`: legacy free-text identifier; use `base` to allow the current UI to resolve the scenario type;
- `state`: a distinct observed state label, not a duplicate of the scenario definition;
- `confidence`: text in the existing schema; record a calibrated qualitative label and explain it;
- `rationale`: concise evidence-led explanation;
- `indicators`: JSON object containing metric values, windows, direction, source URLs, observed timestamps, caveats and mapping to scenario assumptions/invalidation;
- `observed_at`: the evaluation timestamp;
- `snapshot_id`: `ETH-2026-10-04-v1` only if that is still the latest published baseline and its identity is confirmed by a read-only check.

The legacy schema does not enforce a foreign key from `scenario_id` to `research_scenarios`. Do not invent one in application code. The application must keep the definition and observed state separate and display the baseline lineage.

## Publish gate

Do not insert a `scenario_states` row until all checks pass:
1. Confirm current published ETH snapshot ID, publication state, asset ID and counts via a read-only query/API response.
2. Refresh and cite the evidence matrix above with observation times and comparable windows.
3. Map each material observation to Base assumptions, supporting evidence or invalidation conditions.
4. State why Bull and Bear are less consistent with the evidence, or mark the result inconclusive.
5. Assign confidence based on coverage and source quality, not intuition.
6. Validate the candidate payload against the actual schema and API contract on a disposable PostgreSQL database.
7. Verify the UI displays the observed state, rationale, confidence and snapshot lineage separately from scenario definitions.
8. Only then request explicit authorization for a database write. Production writes are not authorized by this draft.

## Current decision

**No scenario state is published.** The product must show “State not recorded” until the evidence refresh and approval gate are complete. An empty monitoring-event list remains valid unless an actual configured trigger has fired.


## Read-only public evidence refresh — 2026-10-09

This section adds public-source evidence to the draft. It does **not** turn the draft into a published scenario state. Metrics below have different publishers and windows; they must be recorded with provenance rather than merged into one synthetic score.

### Market regime

- CoinGecko's live ETH page showed **$2,479.21** and a **7.10% decline over seven days** in the page snapshot opened during this refresh: https://www.coingecko.com/en/coins/ethereum. The same page showed a 24-hour range of $2,466.01–$2,512.13 and a circulating supply near 122.119M ETH. Treat these as source-capture values, not a timeless quote.
- YCharts' ETH/USD series reported **$2,472.73 for 9 October**, down **3.91% from the prior daily observation** and **45.39% year over year**: https://ycharts.com/indicators/ethereum_price. The daily series is not an intraday quote; its value is broadly consistent with the CoinGecko spot range, while the daily return and 7-day return use different windows.

**Implication:** near-term market context is negative / volatile and should not be described as a bullish price regime. This alone does not determine the fundamental scenario.

### Issuance and staking

InsideCrypto's Ethereum on-chain metrics page, labeled **9 October 2026, 12:12 UTC (delayed)**, reported:
- 30-day gross issuance: **89,019 ETH**;
- 30-day burn: **2,698 ETH**;
- 30-day net supply increase: **86,321 ETH** (+0.07%);
- active validator set: **853,431**;
- active validator balance: **43,818,089 ETH**;
- scheduled exits: **20,608**; pending deposits: **17,597**.

Source: https://insidecrypto.net/onchain/ethereum/

The provider says its supply data is sourced from ethsupply.fyi. These are delayed provider estimates, not an independent direct-node calculation. A scheduled exit is a validator lifecycle event and **does not by itself establish a future ETH sale**. The current 30-day data does not support describing ETH as net-deflationary for that interval.

**Implication:** the monetary scarcity/value-accrual argument is not currently confirmed by net supply reduction. Staking remains large, while exit and entry queues require context and trend history before drawing a security or capital-flow conclusion.

### Scaling and roadmap

- Ethereum Foundation's 28 September 2026 announcement scheduled Glamsterdam for Sepolia at epoch 353,024 / slot 11,296,768 on **6 October 2026, 13:53:36 UTC**. It explicitly said Hoodi and mainnet dates were TBD: https://blog.ethereum.org/2026/09/17/glamsterdam-testnet-announcement
- The official roadmap continues to describe Glamsterdam as testing on devnets and mainnet timing as unconfirmed: https://ethereum.org/roadmap/glamsterdam/
- L2BEAT's current indexed overview reports about **$33.20B total value secured** and **2.06K UOPS** for Layer 2s, and says **99.4% of blob data** is posted by L2s: https://l2beat.com/. These are changing dashboard figures; record the actual capture timestamp and methodology before using them as a trend. They are evidence of ecosystem scale, not direct proof of value accruing to ETH.

**Implication:** scaling remains a plausible catalyst, but mainnet delivery must not be described as completed. The critical unresolved question remains whether L2 growth produces sufficient settlement/data demand and economic value for ETH.

### Provisional assessment after refresh

**Candidate state to evaluate: Base, with negative near-term market context and unresolved value-accrual pressure. Confidence: low-to-medium until the project API/database evidence is reconciled.**

Why Base remains the leading candidate to test:
- Ethereum retains material settlement/security and L2 data-availability relevance;
- the scaling roadmap remains active, but the mainnet upgrade is not confirmed as shipped;
- negative price context and positive net issuance argue against an unqualified Bull assessment;
- current evidence does not yet prove a structural Bear thesis such as durable ecosystem migration or a persistent collapse in ETH settlement demand.

This is a hypothesis, not a published assessment. The available evidence is enough to reject the phrase “positive market regime” and to flag net issuance as a current concern, but it is **not enough to assert the full Bull/Base/Bear probabilities or create a durable production state**.

### Dated trend evidence refresh — 2026-10-10

This appendix adds a reproducible set of dated observations. These are **external research inputs**, not a write to the Crypto database and not a published scenario state.

#### 1. Supply flow — negative for near-term supply scarcity

InsideCrypto's delayed snapshot, captured 2026-10-09 12:12 UTC, reports:
- 7-day gross issuance 20,905 ETH; burn 686.53 ETH; net issuance +20,219 ETH.
- 30-day gross issuance 89,019 ETH; burn 2,698 ETH; net issuance +86,321 ETH (+0.07% of reported supply).
- Coverage was reported as 99.99% for both windows.

Source: https://insidecrypto.net/onchain/ethereum/supply/

**Interpretation:** issuance materially exceeded fee burn over the reported windows. This weighs against a short-term “ultrasound / deflationary supply” thesis. Treat the values as a third-party delayed estimate; before production publication, reconcile the definitions and observations against the project's stored evidence and a second supply source.

#### 2. Network fee activity — improving versus one year ago, highly volatile day to day

YCharts' Etherscan-sourced daily “Ethereum Network Transaction Fees Per Day” series reports 186.44 ETH for 2026-10-08, +45.60% year over year versus 128.05 ETH. Its historical values for the recent 14-day window are:

| Date | Transaction fees (ETH/day) |
|---|---:|
| 2026-09-25 | 130.41 |
| 2026-09-26 | 100.68 |
| 2026-09-27 | 292.60 |
| 2026-09-28 | 295.51 |
| 2026-09-29 | 251.06 |
| 2026-09-30 | 135.97 |
| 2026-10-01 | 152.42 |
| 2026-10-02 | 130.11 |
| 2026-10-03 | 78.76 |
| 2026-10-04 | 117.15 |
| 2026-10-05 | 170.57 |
| 2026-10-06 | 153.62 |
| 2026-10-07 | 179.18 |
| 2026-10-08 | 186.44 |

Source: https://ycharts.com/indicators/ethereum_network_transaction_fees_per_day

**Interpretation:** fees recovered from the 2026-10-03 low and the latest observation is above the year-ago comparison, but the series is volatile. This is a network-fee activity proxy, not a direct substitute for net issuance or ETH value accrual. Keep it separate from the supply-flow series.

#### 3. L2 scale — growing ecosystem, value-accrual question unresolved

L2BEAT's TVS dashboard captured for the one-year window ending 2026-10-06 reports rollup total value secured of $34.39B and +34.1% year over year. Source: https://l2beat.com/layer2s/tvs

**Interpretation:** the scaling ecosystem remains materially active and the reported TVS trend is positive. TVS is affected by asset prices and bridge/asset composition; it does not by itself prove that L2 growth translates into ETH demand, burn or holder value.

#### 4. Staking queues — live cross-sectional observation, not yet a historical trend

Beaconcha.in's validator-queue page captured 2026-10-10 showed approximately 1.40M ETH in the deposit queue, 434.5K ETH in the exit queue, and 43.75M ETH in active validator balance. Source: https://www.beaconcha.in/validators/queues

**Interpretation:** both entry and exit queues are material; a single snapshot cannot establish whether staking demand is strengthening or weakening. Record dated daily/weekly captures before assigning a trend or treating queue size as a directional signal.

#### Evidence-weighted scenario implications

- **Base remains the leading candidate to test, not a confirmed state.** The combined picture is mixed: positive L2 TVS growth and a year-over-year fee improvement coexist with clearly positive net issuance and volatile daily fees.
- **Bull is not established:** the evidence does not show sustained fee/burn acceleration or positive net issuance across comparable windows.
- **Bear is not established:** this evidence set does not show a durable collapse in L2 ecosystem scale or network-fee activity.
- **Confidence remains low-to-medium** because source methods differ, the staking observation is cross-sectional, and these external series have not yet been reconciled with the exact stored ETH observations/factors/scores for the published baseline.

### Stored product evidence reconciliation — read-only preflight 2026-10-10

The fresh read-only API preflight exposed the actual contents behind the matching counts. This changes the publication decision: the 15 published evidence rows are **qualitative research evidence**, not current market observations.

- All 15 evidence rows have `as_of = 2026-10-07T09:16:19.544Z`.
- The rows have no numeric `observation_value` and no numeric `observation_unit`; `observation_text` contains narrative research claims.
- Their source names are primarily Ethereum Foundation and Ethereum Roadmap pages. They support protocol/ecosystem context, but do not directly store the fresh 30-day net issuance, daily transaction-fee, L2 TVS or validator-queue observations listed in the external refresh above.
- The baseline's six factors remain qualitative: L2/data demand improving (0.75 confidence), settlement demand mixed (0.70), value accrual improving but conditional (0.82), ecosystem growth improving (0.88), institutional demand mixed (0.70), and network adoption improving (0.75). All six carry snapshot lineage `ETH-2026-10-04-v1`.
- The five published scores are baseline values, not recalculated market scores: health 0.82, thesis 0.78, value accrual 0.68, confidence 0.82 and competitive position 0.80.
- The stored Base scenario definition has probability 0.50 and confidence 0.82. These are the published baseline's scenario parameters, not a fresh posterior probability from the new evidence.

The API/runtime contract now returns and checks these collections with snapshot lineage, but **contract correctness does not make stale qualitative evidence current**. Do not simply attach the external observations to the old evidence IDs: they describe different claims. The next valid product step is to capture the fresh metric observations and their dated source URLs into the product's observation/evidence workflow, then recalculate or explicitly assess the affected factors. Only after that should a candidate state be reviewed for publication.

### Remaining blockers before publication

1. Reconcile these external observations with the project's actual `observations`, `monitoring_signals`, `critical_factors` and evidence rows for `ETH-2026-10-04-v1`, using read-only queries/API only.
2. Verify source timestamps, metric definitions, windows and whether the API stores ETH as `ETH` or canonical `eth`; do not write until the identifier and snapshot lineage are confirmed.
3. Add at least one reproducible trend series for net issuance/burn, staking queues and L2/settlement demand, not just one cross-sectional point.
4. Validate the candidate state payload against a disposable PostgreSQL instance and the existing UI contract.
5. Keep the current product label “State not recorded” until an authorized write is explicitly approved.


## Repository contract verification — 2026-10-09

Static source inspection confirms the following implementation behavior on branch `fix/product-contour-v1-contracts`:

- `workers/crypto-api/src/index.ts` returns `research_scenarios` separately from `scenario_states`. Both are queried against the latest `PUBLISHED` research snapshot for the requested asset; scenario states are ordered newest first.
- The API normalizes the asset ID from the URL to lowercase. The canonical identity migration maps ETH to `asset_id='eth'`. The earlier historical seed used uppercase `ETH`, so a clean bootstrap must include the canonicalization migrations; a test against only the older ETH seed would not represent the current contract.
- `web/app/assets/[assetId]/page.tsx` derives the observed state separately from scenario definitions and correctly falls back to “State not recorded” when no state exists.
- The scenario summary now exposes `observed_at`, `snapshot_id` and an expandable `indicators` payload when a state exists. The no-state fallback remains “State not recorded.” Product Contour Gate #76 passed the UI/runtime contract E2E after this change.
- `scripts/vps-api-parity.mjs` now compares scenario definitions and runtime states as part of asset-detail parity, including snapshot-lineage checks for the VPS response. The separate read-only ETH preflight also compares counts for blocks, domains, factors, scores, evidence, monitoring signals/events and scenario definitions/states.

## Verification boundary

The latest verified PR head `84f04cbfe86954926bcbdf2bf357a2665abaa69a` passed [VPS API Build Rehearsal #102](https://github.com/olegsh247-stack/Crypto/actions/runs/37992104164) and [Product Contour Gate #76](https://github.com/olegsh247-stack/Crypto/actions/runs/37992104882).

Fresh read-only ETH preflight confirmed the same published baseline in both runtimes: `ETH-2026-10-04-v1`, status `PUBLISHED`, with three scenario definitions (Base/Bear/Bull), 15 research blocks, 6 domains, 6 factors, 5 scores, 15 evidence rows, 6 monitoring signals, 0 monitoring events and 0 scenario-state rows. Live Worker and VPS collection counts matched. The VPS API exposes and verifies snapshot lineage; the current live Worker runtime does not expose definition-level `snapshot_id` in its response, which is explicitly recorded by the preflight instead of being misrepresented as verified.

The disposable PostgreSQL transaction test inserted an evidence-linked candidate state and confirmed that rollback left zero rows. This tests the payload/schema pathway only; it does not publish a production state.

**Decision remains BLOCKED for production publication.** External evidence reviewed in the draft is still not a reproducible trend set reconciled against stored observations and factors. Keep the state unpublished and the UI's “State not recorded” behavior intact until the trend evidence is assembled and an explicit production-write approval is given.
