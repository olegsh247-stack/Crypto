# ETH Metric Source Contracts — 2026-10-10

**Issue:** [#5 — ETH vertical slice](https://github.com/olegsh247-stack/Crypto/issues/5)  
**Branch:** `fix/product-contour-v1-contracts`  
**Status:** Source-selection proposal. Endpoints listed here are candidates until payload, freshness and field semantics are tested in a read-only capture. No new metrics are ingested by this document.

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
| Gross issuance | Historical `epochs[].issuanceWei` or live `accounting.issuance.totalWei` | ETH per day/epoch, derived from exact wei | Use provider interval bounds and finalized/head metadata | Do not mix live and finalized values or double-count consensus/execution issuance. Confirm whether the chosen field is a point or interval total. |
| Total burn | Historical `epochs[].burnWei`; breakdown fields for base fee and blob fee | ETH per day/epoch, derived from exact wei | Provider interval bounds | Keep base-fee burn, blob-fee burn, penalties and other destruction separate where available. |
| Net supply flow | Historical `epochs[].netWei` or live `accounting.netWei` | ETH per day/epoch | Preserve source interval and finalized/head state | Treat this as provider-derived net flow, not an independently reconstructed number. Cross-check issuance minus burn and provider warnings. |
| L1 fee / data demand | Historical `baseFeeBurnWei`, `blobBaseFeeBurnWei`, `gasUsed`, `blobsUsed`, target/max fields | ETH per day/epoch, gas or blobs per interval | Use aligned history points and provider interval metadata | Burn is not total user fees/tips. Gas and blob counts are activity measures, not interchangeable with fee burn. |
| Entry/exit queue | Historical staking/queue series and `entryQueueWaitSeconds` / `exitQueueWaitSeconds` where present | ETH queued, validators/requests or seconds, each separate | Repeated dated points; do not infer a trend from one snapshot | Queue balances, queue wait and validator concentration are distinct metrics. Verify coverage and null/missing semantics. |
| Staking concentration | Validator-type/withdrawal-credential breakdown | Shares by credential category only, if defined consistently | Same point/window and denominator | Credential type is **not** staking-provider/operator concentration. Do not label it as such. |

### Required adapter checks before registering metrics

1. Capture a sample response without database writes and pin the exact response timestamp/revision.
2. Confirm the actual JSON shape for the chosen range, exact field names, interval boundaries and finalized/head semantics. Do not infer nested paths from the schema alone.
3. Preserve exact wei/gwei integer strings during parsing. Convert to decimal ETH using integer/decimal arithmetic; do not use JavaScript floating-point for wei.
4. Reject missing, stale, partial or `unavailable` values. Keep provider warnings and source lineage in the artifact.
5. Reconcile net flow against the chosen issuance/burn components where their intervals match. Record any unreconciled difference as a quality warning; do not silently force equality.
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

The public dashboard shows entry and exit queue information and historical views. It is useful for cross-checking a capture, but dashboard HTML is not the ingestion contract. Programmatic API access, key requirements, response fields, update cadence and historical availability must be verified before implementing an adapter.

**Decision:** keep entry queue, exit queue and queue wait time as separate metrics. Do not derive validator concentration from queue size.

## 4. Roadmap milestone signal

- Ethereum roadmap: https://ethereum.org/roadmap/glamsterdam/
- Ethereum Foundation milestone announcements: https://blog.ethereum.org/

This is a discrete event/status signal, not a numeric time series. Store the announcement URL, published/updated time, milestone, target network (testnet or mainnet), target date and observed status. A testnet milestone is not mainnet delivery. “On schedule” must not be inferred merely because a roadmap page still lists a target date.

## 5. Competitive share

No source is selected yet. Before a source adapter is approved, define a fixed peer universe and one comparable metric family (e.g. fees or activity share), with consistent methodology, coverage and windows across ETH and alternative L1s. Absolute activity from unlike chains is not a competitive-share observation.

## 6. Current status and implementation boundary

The branch currently registers two capture candidates:

- `eth.market_spot_price` — Binance ETH/USDT spot; capture timestamp is a proxy because the ticker response does not provide provider observation time.
- `eth.base_fee_burned_per_block` — one block's base-fee burn from Ethereum JSON-RPC; excludes priority fees and is not a daily series.

These two candidates do not yet supply the six-signal evaluator. The preferred next capture extension is a **read-only ethsupply.fyi schema probe** and payload-validation artifact. Only after exact response semantics are confirmed should daily/epoch metric IDs and source registry entries be added. Do not implement thresholds or update monitoring signals until the metric definitions and source windows are evidence-backed.

No production migration, observation write, Worker deployment, signal evaluation, scenario-state publication, or PR merge is authorized by this document.
