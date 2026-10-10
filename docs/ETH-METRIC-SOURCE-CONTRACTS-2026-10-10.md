# ETH Metric Source Contracts — 2026-10-10

**Issue:** [#5 — ETH vertical slice](https://github.com/olegsh247-stack/Crypto/issues/5)  
**Branch:** `fix/product-contour-v1-contracts`  
**Status:** Candidate-series capture is implemented and rehearsed on disposable PostgreSQL. CI captures 482 dated candidate records from ethsupply.fyi plus two point observations, inserts them into the disposable DB and confirms an idempotent replay. No production writes have occurred; independent source cross-check is still required before signal evaluation.

## 1. Preferred source candidate: ethsupply.fyi public API

- Methodology: https://ethsupply.fyi/methodology/
- Live snapshot: https://ethsupply.fyi/api/live
- Historical snapshot: https://ethsupply.fyi/api/history?range=30d
- Retained summary: https://ethsupply.fyi/api/tracked
- Official Ethereum supply explainer for protocol context: https://ethereum.org/eth/supply

The published methodology describes a per-slot ledger that accounts for issuance, execution fee burn, consensus penalties and ETH destruction; it describes reconciliation against execution state and consensus balances, plus independent validation paths. Its API schema exposes exact integer strings in wei/gwei, UTC Unix timestamps, generated-at metadata, availability status, sources and historical windows. This makes it a stronger candidate than a third-party dashboard scrape for reproducible supply-flow and fee observations.

### Candidate mappings

| Candidate metric | API fields / series | Unit to store | Window and timestamp | Caveats |
|---|---|---|---|---|
| Gross issuance | Historical `slots[].issuanceWei` | `ETH/interval` (30 epochs / 960 slots; not daily) | Preserve `fromTimestamp` and `toTimestamp`; `observed_at = toTimestamp` | Do not mix live and historical values or double-count consensus/execution issuance. |
| Execution fee burn | Historical `slots[].burnWei` | `ETH/interval` (30 epochs / 960 slots) | Provider interval bounds | Not the full supply-destruction total; consensus penalties and other execution burn are separate fields. |
| Consensus penalties | Historical `slots[].consensusPenaltiesWei` | `ETH/interval` (30 epochs / 960 slots) | Provider interval bounds | A separate deduction in the provider's net-supply equation. |
| Other execution burn | Historical `slots[].otherExecutionBurnWei` | `ETH/interval` (30 epochs / 960 slots) | Provider interval bounds | Separate from execution fee burn; includes other execution-layer destruction such as proven SELFDESTRUCT events. |
| Net supply flow | Historical `slots[].netWei` | `ETH/interval` (30 epochs / 960 slots; not daily) | Same provider interval as all equation components | Internal source equation reconciles exactly across 48/48 captured intervals; this is not an independent source cross-check. |
| L1 fee / data demand | Historical `slots[].baseFeeBurnWei`, `blobBaseFeeBurnWei`, `gasUsed`, `blobsUsed`, target/max fields | `ETH/interval` for burn series; gas/blob counts per interval | Preserve the provider's interval metadata | Execution/base-fee/blob-fee burn series are registered; gas/blob activity counts are not. Probe observed `blobsUsed` as a float despite the published schema declaring an integer, so it is deliberately not emitted. Burn is not total user fees/tips. |
| Entry/exit queue balances | Historical `staking[].pendingDepositsGwei`, `scheduledActivationsGwei`, `scheduledExitsGwei` | `ETH` point balances, converted exactly from Gwei | Use each point's `timestamp` | These are balances, not validator counts or operator concentration. |
| Entry/exit queue wait | Historical `queueWaits[].entryQueueWaitSeconds` / `exitQueueWaitSeconds` | `seconds` point values | Use each point's `timestamp` | Keep entry and exit wait times separate from queue balances. |
| Staking concentration | Validator-type / withdrawal-credential breakdown | Shares by credential category only, if defined consistently | Same point/window and denominator | Credential type is **not** staking-provider/operator concentration. Do not label it as such. |

### Validation gates before signal evaluation

1. Preserve the exact response timestamp/revision and inspect the capture probe artifact; do not copy the provider's raw payload into the public artifact.
2. The probe confirmed `range=30d`, `interval=30epochs`, `intervalSlots=960`, 225 slot points and an empty `epochs` array. The capture emits the latest 48 valid slot intervals (about 6.4 days), plus the latest 48 staking and queue-wait points. Do not call these daily observations.
3. Preserve exact wei/gwei integer strings during parsing. Convert to decimal ETH using integer/decimal arithmetic; do not use JavaScript floating-point for wei.
4. Evaluate freshness per metric using its own `DataValue.asOf`, not just document `generatedAt`. The first probe's live document was generated within seconds, while some accounting values had `asOf` timestamps roughly 18 minutes earlier. Reject missing, stale, partial or `unavailable` values and preserve provider warnings/source lineage.
5. Reconcile net flow against issuance, execution fee burn, consensus penalties and other execution burn over the same interval. The current capture reconciles 48/48 intervals exactly; missing components or mismatches block ingestion in rehearsal. This is internal consistency, not independent verification.
6. Cross-check at least one selected window against an independent source before promoting the series from candidate to accepted input.
7. Do not persist this provider's data into production until the source contract and migration have been reviewed and separately authorized.

## 2. L2 scale and activity: L2BEAT

- Official API documentation: https://api.l2beat.com/docs/
- Dashboard: https://l2beat.com/layer2s/tvs

The documented API exposes TVS and activity endpoints, including `/v1/tvs` and `/v1/activity`. The currently inspected TVS endpoint requires an API key in the query string. The project has no approved credential configured for ordinary CI; therefore the capture must skip it rather than make unauthenticated calls, put secrets in artifacts/logs, or scrape the dashboard and call it a stable API.

**Decision:** L2 TVS and activity remain gaps until either approved API access with secret-safe handling is configured or a public, documented, versioned alternative is verified. TVS in USD, activity counts/UOPS and Ethereum L1 blob/fee demand remain separate metric families.

## 3. Validator queue cross-check: beaconcha.in

- Public queue dashboard: https://www.beaconcha.in/validators/queues
- API documentation and access plans: https://www.beaconcha.in/api

The public dashboard shows entry/exit queue balances and wait-time history at 7d/30d/90d and longer windows. The API product advertises API keys and tiered access; this repository has no approved beaconcha.in credential. Therefore the dashboard is a manual comparison reference only: do not scrape its HTML, and do not treat a dashboard snapshot with a different finalized epoch/timestamp as an exact match to the captured ethsupply.fyi points. Automated cross-checking is blocked on an approved API access decision and a verified endpoint/schema.

**Decision:** keep entry queue, exit queue and queue wait time as separate metrics. Do not derive validator concentration from queue size. No independent queue cross-check is claimed yet.

## 4. Roadmap milestone signal

- Ethereum roadmap: https://ethereum.org/roadmap/glamsterdam/
- Ethereum Foundation milestone announcements: https://blog.ethereum.org/

This is a discrete event/status signal, not a numeric time series. Store the announcement URL, published/updated time, milestone, target network (testnet or mainnet), target date and observed status. A testnet milestone is not mainnet delivery. “On schedule” must not be inferred merely because a roadmap page still lists a target date.

## 5. Competitive share

No source is selected yet. Before a source adapter is approved, define a fixed peer universe and one comparable metric family (e.g. fees or activity share), with consistent methodology, coverage and windows across ETH and alternative L1s. Absolute activity from unlike chains is not a competitive-share observation.

## 6. Current status and implementation boundary

The branch registers 14 ETH metric IDs across three evidence groups: Binance ETH/USDT spot price (capture-time proxy), one execution block's base-fee burn, and ethsupply.fyi historical interval/point candidates for issuance, execution-fee burn, consensus penalties, other execution burn, net supply flow, staking queue balances and queue wait times. The latest validated capture contains 578 dated candidate observations: 48 rows per each of 12 historical series plus two point observations. The exact accounting equation reconciles across all 48 intervals with no missing components or mismatches. VPS rehearsal inserted all 578 rows into disposable PostgreSQL and confirmed a replay creates zero new rows. This demonstrates capture, internal accounting consistency and disposable-database ingestion, not independent verification of the provider's data or completeness.

The provider's published accounting equation is `netWei = issuanceWei − burnWei − consensusPenaltiesWei − otherExecutionBurnWei`. The capture now checks this equation exactly in wei for the same interval and records missing/mismatched intervals. `burnWei` is named `eth.execution_fee_burn_per_interval` because it is the base-fee plus blob-fee execution burn, not the complete supply destruction total. The ethsupply.fyi series are still third-party candidates: arithmetic reconciliation proves internal consistency only, not independent correctness. A first independent interval cross-check now validates the provider's execution base-fee and blob-fee burn against Ethereum JSON-RPC; broader intervals and the issuance/penalty/staking series still need independent verification. Interval data must not be silently relabelled daily. L2 TVS/activity still require approved API access or a verified alternative; validator concentration, a daily L1 activity/fee series, a comparable alternative-L1 peer set and official milestone status remain separate gaps. Do not implement numeric thresholds or update monitoring signals until definitions, source quality, windows and rationale are evidence-backed.


## 7. Independent RPC cross-check — 2026-10-10

The read-only research workflow [ETH Independent Interval Cross-check #4](https://github.com/olegsh247-stack/Crypto/actions/runs/38038470527) compared one complete ethsupply.fyi interval with execution block headers from `https://ethereum-rpc.publicnode.com`.

- Interval: `2026-10-10T05:04:23Z` through `2026-10-10T08:16:11Z`; provider slot range `15398720..15399679`.
- Coverage: 957 provider-reported blocks versus 957 RPC blocks (`26159820..26160776`).
- Base-fee burn: provider and RPC both `1835884177270781610` wei; delta `0` wei.
- Blob-fee burn: provider and RPC both `1974517068988416` wei; delta `0` wei.
- The calculation used the active blob `baseFeeUpdateFraction=11684671` from `eth_config`; the previous hard-coded Cancun-era fraction was incorrect for the current schedule. The implementation now resolves the active schedule and refuses to claim a match if the provider interval predates it.
- No database or blockchain writes were performed.

This is a successful independent check of two execution-fee components for one interval only. It does not independently validate issuance, consensus penalties, other execution burn, net supply flow, staking queues, or the complete historical series.

No production migration, observation write, Worker deployment, signal evaluation, scenario-state publication, or PR merge is authorized by this document.


## 8. Source-quality work plan — evidence gates before evaluator

This section is an implementation boundary, not a claim that the listed sources have passed validation. Keep candidate observations available for research/rehearsal, but do not promote them to accepted signal inputs until the per-family gates below are satisfied.

### Validation matrix

| Signal family | Current evidence | Required independent validation | Acceptance condition | Status |
|---|---|---|---|---|
| Gross issuance | ethsupply.fyi interval series; internal equation only | Recompute consensus-layer issuance for identical epoch/slot bounds from a separately operated consensus source or reproducible protocol-level data. Preserve missed slots, validator-set context, fork rules and exact interval mapping. | Same interval and methodology are reproducible; unexplained delta is zero or explicitly explained by a documented source/methodology difference. | Blocked |
| Consensus penalties | ethsupply.fyi interval series; internal equation only | Compare per-epoch penalty/reward accounting over the exact provider interval against independent consensus-layer data. Separate ordinary penalties, inactivity leak and slashing effects; do not infer penalties from net supply. | Independent totals cover the same finalized epochs and accounting categories, with a documented reconciliation. | Blocked |
| Entry/exit queues and waits | ethsupply.fyi timestamped points; dashboard reference only | Obtain an approved machine-readable source/schema or a documented manual protocol-data extraction; align finalized epoch and timestamp, and compare entry/exit balances and wait-time fields separately. | At least three distinct timestamps reconcile within a documented source update cadence; balances and wait estimates are not conflated. | Blocked |
| L2 TVS | L2BEAT documented endpoint; API key not configured | Approve secret handling and endpoint access, or verify a documented public alternative. Record universe, USD conversion, aggregation method, timestamp, and response schema. | Stable schema and timestamp semantics; fixed project universe; missing projects and price/FX effects are visible. | Blocked |
| L2 activity | L2BEAT documented activity endpoint; no approved capture | Verify authenticated endpoint/schema or public alternative; distinguish transactions, user operations, and UOPS. Define rollup universe and aggregation window. | One metric definition and fixed project universe are reproducible over comparable windows; no mixing of counts and rates. | Blocked |
| Validator/operator concentration | No suitable provider series | Select an independent dataset that attributes stake to operators/providers with a defensible entity-resolution method and denominator. Credential category is not operator identity. | Methodology, coverage, attribution confidence, denominator and timestamp are documented; unknown/unattributed stake is reported. | Blocked |
| Alternative-L1 competitive share | No fixed peer set or comparable family | Choose a fixed peer universe and one comparable metric family (fees or activity), with common windows, unit conventions, source coverage and inclusion rules. | ETH and each peer use the same family and window; missing peers are not silently dropped; share denominator is explicit. | Blocked |
| Official roadmap milestone | Official roadmap/blog links; no event ledger yet | Capture dated official announcements and changes, explicitly recording milestone, network, status, publication/update time and source URL. | Historical status changes are preserved; testnet and mainnet are distinct; target dates alone never imply delivery or schedule confidence. | Blocked |
| Base-fee and blob-fee burn | One independently checked interval; zero-wei deltas in that interval | Repeat the existing RPC comparison across multiple non-adjacent complete intervals from the retained candidate window, including interval block counts and active blob-schedule applicability. | At least three intervals spanning the captured window match exact component totals and block counts, or discrepancies are classified and resolved. | Partial: one interval |

### Execution order

1. **Broaden the existing RPC cross-check first.** Reuse the current integer-only computation and source-interval lineage. Test several non-adjacent intervals before expanding into consensus accounting. Keep this workflow research-only: a mismatch or non-evaluable interval must be visible in its artifact and must not be described as a passing source verdict.
2. **Resolve consensus issuance and penalties independently.** A protocol explanation is not an observed independent series. Do not estimate missing consensus components by rearranging the provider's net-flow equation; that would only restate the same source.
3. **Resolve staking queues as a separate workstream.** Do not scrape HTML or introduce unapproved credentials. If machine-readable access remains unavailable, record the blocker and keep the metrics candidate-only.
4. **Resolve L2 data access and definitions.** TVS and activity require separate contracts and separate quality checks; neither substitutes for L1 fee demand.
5. **Define concentration and competitive-share populations before capture.** Fix the entity/peer universe and denominator first; do not retrofit a narrative around whichever data happen to be available.
6. **Create a dated official milestone ledger.** Preserve changes rather than overwriting the latest status.
7. Only after the relevant family passes its evidence gate, define windows, baselines, missing-data behavior and numeric thresholds with explicit rationale. Then implement evaluator logic and parity tests across API/Worker. No automatic monitoring event or scenario-state publication is part of source validation.

### Research workflow acceptance semantics

- A green GitHub Actions run means the script executed and produced its artifact; it does not automatically mean the source is accepted.
- A "matched" result is a component/window-level result, not a provider-wide verdict.
- "Mismatch" and "not_evaluable" must remain inspectable; they must never be coerced into "matched" to keep CI green.
- Preserve the exact source interval, RPC block range/count, schedule parameters, deltas, and read-only guardrails in artifacts.
- No production database write, production migration, API/Worker deployment, VPS provisioning, PR merge, signal evaluation, monitoring event, or scenario-state publication is authorized by this research plan.


## 9. Validation results — 2026-10-10 (GitHub Actions)

Reviewed artifacts from [ETH Independent Interval Cross-check run 10](https://github.com/olegsh247-stack/Crypto/actions/runs/38039732906), [ETH Observation Capture run 96](https://github.com/olegsh247-stack/Crypto/actions/runs/38039732976), [Product Contour Gate run 197](https://github.com/olegsh247-stack/Crypto/actions/runs/38039733062), and [VPS API Build Rehearsal run 223](https://github.com/olegsh247-stack/Crypto/actions/runs/38039732962).

### Results accepted for this research step

- **Execution fee components: matched in all three sampled intervals.** The newest, middle, and oldest sampled complete intervals all matched independent Ethereum JSON-RPC recomputation exactly for both EIP-1559 base-fee burn and EIP-4844 blob-fee burn. All three also matched provider-reported block counts: 957/957, 955/955, and 957/957. Both component deltas were exactly 0 wei in every sampled interval.
- Sampled windows: 2026-10-10 05:29:59–08:41:47 UTC; 2026-10-07 00:41:59–03:53:47 UTC; 2026-10-03 23:05:59–2026-10-04 02:17:47 UTC.
- **Provider accounting identity: internally exact for 48/48 intervals.** The capture artifact reports zero missing component intervals and zero mismatches for `netWei = issuanceWei - burnWei - consensusPenaltiesWei - otherExecutionBurnWei`. This is an internal consistency check of the same provider payload, not independent validation of issuance, penalties, other execution burn, or net supply.
- Capture produced 578 candidate metric observations. L2BEAT remains skipped because approved API access is not configured. Validator/operator concentration and cross-chain competitive share remain unresolved.
- **Product Contour Gate: success** for Worker API bundle dry run, read-only UI/API contract/runtime, and disposable clean-DB migration/idempotency rehearsal.
- **VPS API Build Rehearsal: success** for the build-and-E2E job. This is a rehearsal result, not evidence that a VPS has been provisioned or production deployed.

### Scope and decision

Accept only the narrow claim that the provider's interval-level base-fee and blob-fee burn fields matched the independent RPC calculation in these three sampled windows. Do not generalize this to all 48 intervals or to the provider's full accounting model. The next evidence task is independent consensus-layer issuance and penalties for exactly aligned finalized epoch/slot ranges. No evaluator thresholds are approved by these results.


## 10. Consensus-layer source feasibility review — issuance and penalties

Reviewed the official Ethereum consensus API specification and protocol reward/penalty documentation before selecting an implementation path.

### Findings

- The official Beacon API defines `POST /eth/v1/beacon/rewards/attestations/{epoch}`, which returns attestation reward information for validators and carries `finalized` and `execution_optimistic` metadata. It is useful evidence, but it is **not a complete per-epoch issuance/penalty total**: its documented scope is attestation rewards, not every consensus-layer balance change.
- The API also defines `GET /eth/v1/beacon/rewards/blocks/{block_id}` for proposer rewards from attestations, sync committees and slashings included in a proposed block. That endpoint is also not a complete interval accounting ledger for all validators and all protocol penalties.
- Official protocol documentation describes rewards and penalties as epoch-applied, including missed participation, inactivity leak and slashing/correlation effects. Exact totals must follow the fork-specific consensus transition rules and the same finalized epoch range as the candidate provider interval.
- Therefore, neither the attestation endpoint alone nor block proposer rewards alone can be used as the independent total. Validator balance differences alone also cannot be treated as issuance/penalties without accounting for deposits, withdrawals, consolidations and other state changes.
- The standard API contract does not itself guarantee historical retention or provide a public endpoint URL. Any chosen endpoint must be probed for the required historical finalized epochs, request limits, retention, completeness, and rate limits before CI integration.

### Candidate validation route

1. Identify a read-only Beacon API provider or independently operated consensus dataset that can serve the historical epoch range corresponding to the candidate interval. Do not add a credential or vendor dependency until access, retention, and terms are reviewed.
2. Probe a single finalized epoch using the official schema. Preserve provider identity, endpoint/version, response status, `finalized`, `execution_optimistic`, epoch/slot mapping, and capture time. A non-finalized or execution-optimistic result is not accepted for reconciliation.
3. Determine whether the provider exposes a full protocol accounting result or only a subset. If only reward subcategories are exposed, label each as partial and do not sum them into a claimed complete issuance/penalty total.
4. If no provider exposes complete accounting, the alternative is a reproducible fork-aware consensus state-transition replay from a trusted finalized state and complete intervening blocks. This is a materially larger task and must be scoped/tested separately; do not approximate it from the provider's own fields.
5. Reconcile at least three non-adjacent complete windows with exact epoch boundaries, then expand coverage. Record gross issuance and penalties separately, and classify slashing/inactivity effects explicitly. Only then can either metric be promoted from candidate quality.

### Official references

- Ethereum Beacon API specification: https://github.com/ethereum/beacon-APIs
- Attestation rewards endpoint contract: https://github.com/ethereum/beacon-APIs/blob/master/apis/beacon/rewards/attestations.yaml
- Block rewards endpoint contract: https://github.com/ethereum/beacon-APIs/blob/master/apis/beacon/rewards/blocks.yaml
- Ethereum consensus rewards and penalties overview: https://ethereum.org/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/
- Fork-specific consensus transition specification: https://ethereum.github.io/consensus-specs/

### Decision

**No consensus issuance/penalty evaluator or numeric threshold is implemented in this step.** The next engineering task is a bounded, read-only provider feasibility probe against the chosen historical finalized interval. If a provider cannot demonstrate full coverage, document the limitation and stop rather than treating a partial endpoint as independent confirmation.


## 11. Historical Beacon API feasibility probe — 2026-10-10

Added a bounded, read-only probe in `scripts/research/probe_beacon_consensus_source.py` and the research-only workflow `.github/workflows/eth-consensus-source-probe.yml`.

### Probe contract

- Uses the documented PublicNode Ethereum Beacon API base URL `https://ethereum-beacon-api.publicnode.com`; no API key or secret is added.
- Captures the current candidate interval artifact, selects up to three non-adjacent intervals where gross issuance and consensus penalties share the same source slot bounds, and probes each interval's final slot/epoch.
- Checks historical `/eth/v1/beacon/states/{slot}/finality_checkpoints` access and requests one validator's attestation reward row through `POST /eth/v1/beacon/rewards/attestations/{epoch}`. The one-validator request bounds response size and is strictly a schema/access probe.
- Records provider URL, slot/epoch, response metadata, finalized and execution-optimistic flags, response shape, and capture time. Any inaccessible or non-finalized/optimistic interval remains visible as not evaluable.
- The artifact explicitly sets `complete_consensus_issuance_penalty_accounting_verified=false`. No database writes, chain writes, credential changes, deployment, or evaluator logic are part of this workflow.

### Interpretation boundary

This probe can establish only whether a documented public endpoint serves the chosen historical finalized ranges and a sample attestation-reward response. The reward endpoint returns per-validator attestation reward/penalty categories; it does not by itself provide a complete all-validator issuance ledger or every protocol penalty category. A green workflow must therefore not promote either metric to accepted evidence. If historical endpoint access works, the next decision is whether a separate reproducible fork-aware consensus accounting dataset/replay is feasible; if it fails, preserve the endpoint failure and do not substitute provider-derived totals.

Official references:
- PublicNode Ethereum Beacon API endpoint is documented in Nethereum's Beacon API client example: https://docs.nethereum.com/docs/consensus-light-client/nethereum-beaconchain/
- Official Beacon API repository and security/operation caveats: https://github.com/ethereum/beacon-APIs
- Attestation reward endpoint contract: https://github.com/ethereum/beacon-APIs/blob/master/apis/beacon/rewards/attestations.yaml
- Fork-specific consensus rules: https://ethereum.github.io/consensus-specs/

**Probe result — [ETH Consensus Source Feasibility Probe #2](https://github.com/olegsh247-stack/Crypto/actions/runs/38040200736):** the workflow and script completed and uploaded artifact `eth-consensus-source-feasibility-38040200736`, but all three historical state requests returned HTTP 403 from `https://ethereum-beacon-api.publicnode.com` (slots `15354719`, `15377759`, `15399839`; epochs `479834`, `480554`, `481244`). Therefore the provider was **not evaluable from this CI environment**. Because the state/finality request failed first, the attestation-reward endpoint was not reached; no claim is made that its historical access works. The successful workflow conclusion means the probe recorded the failure correctly, not that the provider passed. No complete consensus accounting was verified. The next source decision is to obtain an explicitly documented endpoint with authorized anonymous/API access or an approved provider credential; do not retry guessed URLs, use a documentation demo as production evidence, or estimate missing totals from ethsupply.fyi.


## 12. Second documented Beacon API endpoint candidate — 2026-10-10

The first probe established that `https://ethereum-beacon-api.publicnode.com` returned HTTP 403 for all three historical state/finality requests from GitHub Actions. That result is an access blocker for this environment, not proof that historical Beacon data is unavailable in general.

The probe now accepts an explicit `BEACON_API_BASE_URL` and `BEACON_API_PROVIDER` and the research workflow checks a second endpoint shown by the official Beacon API Swagger UI as its example server: `https://public-mainnet-node.ethereum.org`. The endpoint is tested only for read-only historical state/finality and one validator's attestation reward response; it is not pre-approved as a reliable or production data provider. The HTTP form shown by the Swagger UI is intentionally not used because the probe must not send unencrypted HTTP requests.

The workflow uploads separate artifacts for both candidates. Inspect actual HTTP status and response metadata before declaring access confirmed. A successful endpoint probe still proves only historical endpoint accessibility and a sample reward response—not complete all-validator issuance/penalty accounting. If both candidates fail, the next viable option is a documented provider with authorized access (likely requiring a user-approved API key) or a separately scoped fork-aware replay/dataset investigation. Do not add secrets or change repository credentials without explicit approval.

References:
- Official Beacon API Swagger UI, which lists the example server `http://public-mainnet-node.ethereum.org/`: https://ethereum.github.io/beacon-APIs/?urls.primaryName=v2.3.0
- Official API repository and public-exposure caveat: https://github.com/ethereum/beacon-APIs
- PublicNode Ethereum gateway overview: https://ethereum.publicnode.com/


### Results of the two-endpoint probe — workflow #4

Run: https://github.com/olegsh247-stack/Crypto/actions/runs/38050502012  
Artifact: `eth-consensus-source-feasibility-38050502012`

- `https://ethereum-beacon-api.publicnode.com`: HTTP 403 for all three historical state/finality requests (epochs 479862, 480582, 481272).
- `https://public-mainnet-node.ethereum.org`: TLS/connection failure for all three requests from GitHub Actions; no HTTP response or API schema was obtained.
- Neither endpoint reached the attestation reward request. The workflow succeeded because it captured the failures and uploaded artifacts; it did **not** pass provider feasibility.
- `complete_consensus_issuance_penalty_accounting_verified` remains false.

**Decision:** the anonymous public-endpoint route is blocked in the current CI environment. Do not keep cycling through unverified public URLs. Next viable route is an explicitly authorized data provider with documented historical finalized-epoch support and aggregate reward/penalty semantics, or a separately costed fork-aware replay. A credentialed provider may need a user-approved API key stored as a GitHub Actions secret; no secret has been created or requested by this change. Even an aggregate rewards API must be audited for missing protocol categories and exact epoch coverage before it can be treated as full issuance/penalty evidence.


## 13. Credentialed provider candidate review — beaconcha.in

Official provider overview: https://beaconcha.in/api. It advertises historical and real-time consensus data, validator rewards, and an API key. Its public API landing page describes a free trial and paid tiers; separate integration documentation reports that arbitrary custom reward time ranges are limited to Scale/Enterprise plans and rounded to whole UTC days. See also https://docs.beaconcha.in/api-reference/ethereum/validators/rewards-aggregate and https://docs.beaconcha.in/api-reference/ethereum/validators/rewards-list.

This is a **candidate requiring further verification**, not an approved source:
- The published reward APIs are validator-oriented. It is not yet established that an API response can provide a complete network-wide, fork-correct ledger of issuance and all penalties for our exact 30-epoch / 960-slot windows.
- Arbitrary historical ranges may require a paid tier, so no plan purchase or subscription is assumed.
- Do not store or request an API key in code, logs, or chat. If this provider is selected, the user must first authorize the account/plan and then add the key as a repository Actions secret through GitHub settings. The probe can then read the secret from an environment variable without printing it.
- Before integration, run a minimal request for one finalized epoch/window, document exact response fields, coverage and plan/rate-limit restrictions, and compare against a second independent method. If it cannot cover full-network issuance and all penalty categories, keep it as partial evidence only.

**Next gate:** no evaluator implementation until one of these is demonstrated: (a) a complete, documented aggregate dataset with exact epoch/slot coverage and independently reconciled categories, or (b) a separately approved and reproducible fork-aware state-transition replay design.
