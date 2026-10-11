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


## 6. Follow-up verification — row-level parity and external source spot-check (2026-10-11)

The read-only checks that were still pending above have now been completed on branch commit `18536ba238e791d847b68e0923062b53965c02aa`:

- [VPS API Build Rehearsal #38122242540](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242540) — PASS.
- [Product Contour Gate #38122242606](https://github.com/olegsh247-stack/Crypto/actions/runs/38122242606) — PASS.
- Live Worker and disposable VPS API match on snapshot `BTC-2026-10-07-v1`, 15 blocks, 6 domains, 6 factors, 5 scores, 15 evidence rows, 7 qualitative signals, 3 scenario definitions, 21 metrics and 9 registered sources.
- All six baseline market metrics match exactly across implementations, including value, unit, observation timestamp, source ID/URL, status and freshness. They are still marked stale and dated 18–19 September; this is parity, not freshness.
- The three VPS scenario definitions expose the expected snapshot lineage. The live Worker does not expose `snapshot_id` on those definition rows, so cross-runtime lineage cannot be independently verified from the Worker projection.
- All 15 Evidence rows expose evidence ID, observation ID, metric ID, source ID, source URL and `as_of`. The API projection supplies the joined metric/source fields, but the preflight does not independently query a separate observation endpoint; do not overstate this as independent validation of every source claim.

### External-source spot-check

The following candidate inputs from sections 2–4 were spot-checked against public pages. They remain external corroboration, not rows linked to the published snapshot:

- Investing.com now shows an Oct 11 BTC daily row around **$83,036.7**; because Oct 11 was still in progress at retrieval, treat it as a partial/current-session reading, not a completed UTC close. The earlier ~$82,879 figure is not a canonical close.
- Alpha Finance's BTC ETF dashboard shows **+$21.1M** for the 9 Oct session and about **-$386.3M** over the latest seven sessions through 9 Oct. This is a secondary aggregator and must retain its stated session window.
- Satoshi Gazette's mining page reports a three-complete-UTC-day estimated hashrate mean of about **967 EH/s** and daily estimates that vary materially. This is a derived estimate, not a direct measurement of deployed mining equipment.
- Maketo reports **$36.03M** total miner reward on 8 Oct, of which about **$246K (0.68%)** came from fees. This is a secondary calculation for one day, suitable as a flagged research input, not by itself a live trigger.
- The linked SEC custody proposal page is real and dated 1 Oct 2026; it describes a **proposal**, not a final implemented rule. The SEC interpretation at S7-2026-09 is also a real March 2026 interpretive release. Do not conflate either with proof of realized BTC inflows or adoption.

Sources checked: [Investing.com BTC historical data](https://www.investing.com/crypto/bitcoin/historical-data), [Alpha Finance BTC ETF dashboard](https://alphafinance.io/etf/bitcoin/), [Satoshi Gazette mining estimates](https://satoshigazette.org/data/mining), [Maketo miner revenue](https://maketo.com/bitcoin/miner-earnings), [SEC custody proposal](https://www.sec.gov/newsroom/press-releases/2026-100-sec-proposal-would-address-how-investment-advisers-and-funds-can-custody-crypto-assets-under-federal), [SEC crypto-asset interpretation](https://www.sec.gov/rules-regulations/2026/03/s7-2026-09).

### Updated decision

**Candidate Base remains under review; no current scenario state is justified for publication yet.** The external inputs are mixed, use different windows and source methodologies, and are not reconciled into the snapshot's observation/evidence records. Product monitoring remains qualitative: all seven signals have no `metric_id`, no `critical_factor_id`, and no threshold in the exposed payload. The six historical market metrics are stale. No scenario-state row should be written until a consistent, dated observation set is reconciled to the product's canonical evidence chain and the state rationale is reviewed.

The remaining work is now specific: (1) confirm the product's freshness rules for research metrics labelled `fresh` at 2026-10-08; (2) define a minimal BTC monitoring evaluation using the existing metric and factor contracts, without fabricating thresholds; (3) verify whether a read-only observation-level route exists or add it only if required by the existing contract; (4) prepare a candidate Base-state rationale with explicit evidence IDs and invalidation conditions, but keep it as a draft until review and separate authorization. Do not expand to SOL/CAKE.


### Material source conflicts discovered after the initial spot-check

The stored historical metrics must not be used as evidence for a scenario state until reconciled:
- **ETF flow:** the stored observation is +$324.6M on 18 Sep 2026. Farside's current historical table shows +$433.0M, while contemporaneous reports citing Farside show +$324.6M and say IBIT was flat. The row matches between Worker and VPS, but the source revision / fund-inclusion discrepancy remains unresolved.
- **Hashrate:** the stored 1,001 EH/s observation is dated 19 Sep, while its cited Shattered article describes approximately 1,001 EH/s on 4 Sep. Satoshi Gazette's estimate for 19 Sep is about 826 EH/s. This is a date/window mismatch, not a minor freshness issue.
- **Circulating supply:** the stored value has no source URL. The described `gettxoutsetinfo` derivation would represent UTXO-set total amount, not automatically circulating supply, and the record has no block height/hash to reproduce the result.
- **Spot price:** the $81,043 figure and 06:38 UTC timestamp are present in the cited 19 Sep FinanceFeeds article, attributed there to CoinGecko. This supports a historical quote, not a current feed or an approved source registry.

These conflicts strengthen the BLOCKED decision. Do not repair them by changing only source URLs, moving timestamps, or overwriting observations. Recover the original query/window and metric definition, then propose a reviewed source/data correction separately. Until then, the candidate Base state remains a draft and no scenario-state row is authorized.