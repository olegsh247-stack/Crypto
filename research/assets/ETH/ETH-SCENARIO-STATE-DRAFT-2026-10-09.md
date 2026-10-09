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
