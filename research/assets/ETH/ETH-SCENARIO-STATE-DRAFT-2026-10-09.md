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
- The current UI does not visibly expose the state's `observed_at`, `snapshot_id`, or the `indicators` evidence payload in the scenario summary. These should be included in the acceptance criteria before publishing a state; otherwise the user cannot readily audit when and on what baseline it was assessed.
- `scripts/vps-api-parity.mjs` currently normalizes only asset identity, research lifecycle/freshness, snapshot status and research-block count for asset details. It does **not** compare `research_scenarios`, `scenario_states`, factors, scores, evidence, monitoring signals or events between Worker and Node API. A green parity result therefore would not yet prove the scenario workflow is portable.

## Verification boundary

The VPS API Build Rehearsal #98 and Product Contour Gate #72 passed on commit `4fca3266261552a559eb97a46746791ee6de8a84`. The rehearsal verified clean PostgreSQL bootstrap, asset/pair registry, ETH detail, mutation contracts, 9-asset worker ingestion (72 candle rows), persisted ETH history, 7-endpoint Worker/VPS parity including scenario lineage, and admin auth boundary.

The published ETH snapshot and scenario counts have not yet been emitted as a dedicated fresh preflight record, and a scenario-state insert/rollback transaction has not yet been exercised. The next workflow revision adds those checks against live Worker (read-only) and disposable PostgreSQL (transaction rolled back). Historical audit counts are not treated as a substitute for this fresh verification.

Until those checks are executed successfully, keep the state unpublished and the UI's “State not recorded” behavior intact.
