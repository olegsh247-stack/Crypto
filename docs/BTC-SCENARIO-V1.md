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
