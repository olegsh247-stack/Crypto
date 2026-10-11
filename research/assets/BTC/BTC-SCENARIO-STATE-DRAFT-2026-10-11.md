# BTC Scenario-State Evaluation — Draft / Not Publishable

**Assessment date:** 2026-10-11  
**Asset:** BTC  
**Published research baseline:** `BTC-2026-10-07-v1`  
**Candidate scenario to test:** Base  
**Status:** BLOCKED — live API evidence rows, observation lineage, and configured monitoring thresholds must be checked before any state is published  
**Important:** This document is an analytical draft only. It is not a database record and does not authorize a write to `scenario_states`.

## 1. What the read-only API check actually established

The successful UI/API runtime gate on commit `21d1cdda7bf299005761cd611b5114312727b715` returned:

- lifecycle: `monitoring`;
- published snapshot: `BTC-2026-10-07-v1`;
- research blocks: 15, with 15/15 resolved;
- domains: 6;
- critical factors: 6;
- scores: 5;
- scenario definitions: 3;
- scenario states: 0;
- monitoring signals: 7;
- monitoring events: 0;
- evidence rows: 15, all 15 with a source URL;
- registered sources: 9.

This validates payload availability and broad structure. It does **not** establish the current observed scenario. In particular, zero scenario-state rows means there is no persisted observation of a current scenario to validate; it must not be inferred from the existence of Bull/Base/Bear definitions.

## 2. External data refresh — evidence to reconcile with the product data

The following independent public observations were found on 2026-10-11. They are candidate corroborating inputs, not yet proven to be the exact observations referenced by the published BTC snapshot or its Evidence rows.

| Input | Latest value used here | Observation window / as-of | Source | Interpretation limit |
|---|---|---|---|---|
| BTC price | About $82,879 | Investing.com daily row for 2026-10-11; day still in progress at retrieval | https://www.investing.com/crypto/bitcoin/historical-data | Intraday/partial daily value; must not be mixed with a completed UTC close |
| BTC price trend | $85,552.4 on Oct 6 close to $82,879.1 shown for Oct 11, roughly -3.1% | Oct 6–11, mixed daily-session/partial-day series | https://www.investing.com/crypto/bitcoin/historical-data | Directional short-window context only; calculate canonical returns from one consistent feed and completed candles |
| US spot BTC ETF flow | +$21.1M on Oct 9; approximately -$386.3M over the latest seven sessions | Latest US trading session through Oct 9 | https://alphafinance.io/etf/bitcoin/ | One positive session does not reverse multi-session outflows; verify methodology and session window before storing |
| Network hashrate | About 967 EH/s, 3-day mean; 30-day mean about 964 EH/s, roughly 5% above the preceding 30 days | Complete UTC days through Oct 10 | https://satoshigazette.org/data/mining?end=2026-10-11&window=30 | Estimated from block production, not a direct count of mining equipment; daily variance is material |
| Miner reward composition | About $36.03M paid to miners on Oct 8; fees about $246K or 0.68% of the total reward | Oct 8, 2026 | https://maketo.com/bitcoin/miner-earnings | Secondary calculation; use a consistent primary dataset/window for production monitoring |
| Macro discount-rate pressure | US 10-year Treasury yield reached roughly 5.36% in the week | Week ending Oct 9 | https://www.reuters.com/world/china/global-markets-flows-graphic-2026-10-09/ | Contextual macro factor, not a BTC-specific trigger; validate series and timestamp in the product's metric contract |

### Preliminary reading, not a published state

- Price has weakened over the short observation window.
- ETF flow was positive on Oct 9 but negative across the cited seven-session window.
- Estimated hashrate remains high and its 30-day mean is higher than the prior window.
- Fees remain a small share of miner reward in the cited single-day observation, which is a long-horizon security-budget issue rather than proof of an immediate network failure.
- Elevated long-term yields are a plausible headwind for liquidity-sensitive assets.

These observations are mixed. They do not, by themselves, justify replacing the baseline Base hypothesis with Bull or Bear. The defensible current label is **candidate Base under review**, not a confirmed current scenario state.

## 3. What must be verified inside Crypto before publishing

All checks in this section are read-only. Do not insert a scenario-state row as part of the audit.

1. Fetch the full `GET /api/assets/btc` response from the live Worker and the VPS Node API, if the latter is available in the test environment.
2. Confirm that the published snapshot is still `BTC-2026-10-07-v1` and that its status is `PUBLISHED`.
3. Inspect the actual rows—not only counts—for metrics, observations, evidence and sources. Record their IDs, source URLs, observation timestamps, units, definitions, and windows.
4. Verify that each material scenario input can be traced through the product's Evidence chain: data/observation → source → signal/assessment → confidence → thesis impact.
5. Confirm factor and score rows are scoped to `BTC-2026-10-07-v1`; verify scenario-definition snapshot lineage is actually exposed by the live Worker or explicitly record that it is not independently verifiable there.
6. Check the seven monitoring signals for their current values, last-updated timestamps, thresholds, direction and source/observation links. Do not assume that a signal count means the signals are current.
7. Check daily price candles and all other time-windowed metrics using consistent completed periods. Separate a partial Oct 11 value from completed daily candles.
8. Compare the fresh external readings above with the product's own observations. If source, timestamp, unit, window or value conflicts, record the discrepancy; do not silently replace one value with another.
9. Determine whether a scenario-state event is a required v1 product behavior or an explicit analyst action. If it is an analyst action, document the authorization and review step before any production write.
10. Only after these checks, prepare a candidate state with a dated rationale, evidence/observation identifiers, explicit uncertainty and snapshot lineage. Review it before deciding whether it should be published.

## 4. Decision rules for this draft

- **Base remains a candidate, not an asserted state.** The published baseline describes Bitcoin as the dominant crypto monetary asset with institutionalization and macro sensitivity; the new observations are mixed and the current product evidence chain has not yet been independently verified row by row.
- **Do not assign a probability** from these few indicators. The current methodology does not justify a defensible numeric probability here.
- **Do not publish Bull** based only on one day of ETF inflows or a high hashrate estimate.
- **Do not publish Bear** based only on a short price pullback, recent ETF outflows or low fees on one day.
- Reassess only when inputs use consistent observation windows and the product's source/observation lineage is confirmed.

## 5. Exit criteria

This draft can be considered for publication only when all are true:

- the live BTC payload and its snapshot lineage are read and checked at row level;
- current price, ETF flow, hashrate, miner-reward composition and macro observations have consistent as-of times and definitions;
- the seven monitoring signals have been checked for freshness and traceability;
- a scenario state can reference its baseline snapshot and evidence IDs;
- the candidate rationale and invalidation conditions are explicit and reviewed;
- the state write, if ultimately authorized, is a separate deliberate action with verification and rollback/recovery awareness.

Until then, no production data, schema, deployment, or monitoring configuration should be changed.
