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
