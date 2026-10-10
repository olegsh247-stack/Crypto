# CAKE legacy pool balance — pinned RPC capture and reconciliation gap

**Date:** 2026-10-10  
**Workflow:** [Research On-chain Capture run 38063027247](https://github.com/olegsh247-stack/Crypto/actions/runs/38063027247)  
**Code head:** `5805b8f308804bee4231466182dd453dafd325f9` (capture + normalizer); follow-up test commit `51e272d4725c5e364669e6e486034e5cfc962251)  
**BSC chain ID:** 56  
**Pinned BSC block:** 126,850,417  
**Raw capture SHA-256:** `327f5eb10a8436536d2537453ffb73a54bf6a06943661552a8349c86d6e3018a`  
**Artifact digest:** `sha256:0592f7df9b22f798371532577e5a5662c3d17cfe05b045608bf919160263662e`  
**Result:** capture succeeded with no RPC errors; normalizer and evidence-envelope validation succeeded.

## 1. New verified observation

The capture script now reads the CAKE balance of the legacy CAKE Pool at the same block as `totalSupply()` and the burn address.

| Field | Value at block 126,850,417 |
|---|---:|
| `totalSupply()` | 5,543,692,995.751051 CAKE |
| Conventional burn address `0x…dEaD` | 5,168,552,286.608597 CAKE |
| `totalSupply - burn-address balance` | 375,140,709.142454 CAKE |
| Legacy CAKE Pool `0x45c54210128a065de780C4B0Df3d16664f7f859e` balance | 13,393,669.234197 CAKE |
| `totalSupply - burn - entire legacy-pool balance` (sensitivity only) | 361,747,039.908257 CAKE |
| CAKE token contract self-balance | 156,166.560807 CAKE |
| `0x…0001` balance | 2,080.632173 CAKE |
| `0x…0002` balance | 43.638654 CAKE |

The raw total supply is large because a large amount of CAKE is held at the dead address. It must not be compared with the 400M policy cap on its own. The raw same-block subtraction gives about 375.141M before deciding which permanently locked balances belong in the canonical circulating-supply definition.

## 2. Source-backed methodology and unresolved difference

PancakeSwap's official documentation says to subtract the dead-address balance from contract total supply and says CAKE locked forever in the legacy CAKE pool is also considered burned: https://docs.pancakeswap.finance/protocol/cake-tokenomics

PancakeSwap's official Tokenomics 3.0 article identifies the legacy CAKE Pool address as `0x45c54210128a065de780C4B0Df3d16664f7f859e` and describes approximately 5.29M CAKE delegated to StakeDAO/CakePie as permanently locked at that time: https://blog.pancakeswap.finance/articles/implementation-of-cake-tokenomics-3-0-what-you-need-to-know

An independent public CAKE burn tracker documents its own calculation as total supply minus the dead address and the balances at the CAKE token contract, `0x…0001` and `0x…0002`; it also states that it cross-checks the dead-address balance against historical transfer logs. Its methodology does not simply subtract the entire legacy pool balance: https://cryptoburntracker.com/burns/pancakeswap/

This produces a methodology question that must not be papered over:
- The observed legacy-pool contract balance is **13.394M CAKE** at the pinned block.
- The official blog's approximately **5.29M CAKE** statement was a specific historical amount of delegated CAKE, not proof that the entire later pool balance is permanently irrecoverable.
- Blindly subtracting the entire current pool balance yields about **361.747M CAKE** before the three smaller permanently locked balances; this is only a sensitivity calculation, not an accepted canonical metric.
- The public independent tracker and official PancakeSwap guidance describe different levels of detail for the pool treatment. We need a transaction-level/pool-state explanation and a fresh comparable circulating-supply value before selecting a final formula.

## 3. Code and test changes

- `scripts/research/capture_sol_cake_rpc.py` now captures `balanceOf(legacy CAKE Pool)` at the same pinned block as all other CAKE reads.
- `scripts/research/normalize_sol_cake_rpc_capture.py` emits a distinct `legacy_cake_pool_balance` observation with block lineage; it does not silently subtract the balance.
- `scripts/research/tests/test_normalize_sol_cake_rpc_capture.py` includes a fixture and assertion for the new observation.
- The read-only capture workflow completed its capture, normalization and evidence-envelope validation steps successfully. The evidence-envelope test run also passed: https://github.com/olegsh247-stack/Crypto/actions/runs/38063038809

## 4. Next required CAKE work

1. Inspect the legacy pool's verified source and relevant balances/withdrawal/locker state to establish which portion is actually irrecoverable at the current date.
2. Obtain comparable supply values from the official PancakeSwap/Dune methodology and the independent tracker around the same time/block.
3. Capture `totalSupply()`, dead-address balance, verified permanently locked balances and pool-related balances at aligned historical month boundaries.
4. Reconcile issuer-reported June–September net-mint figures to those on-chain series. Do not equate issuer accounting periods to block boundaries without accounting for weekly-burn proration.
5. Only then approve the circulating-supply formula for Product Contour.

No production writes, database migration, deployment, PR merge, scores, scenarios, monitoring events or SOL/CAKE publication occurred.


## 5. Verified contract-state finding — 2026-10-10 follow-up

The verified source on BscScan identifies this address as the PancakeSwap `CakePool` contract and exposes state/functions including `totalLockedAmount()`, `totalShares()`, `available()`, `balanceOf()`, and per-user `userInfo(address)` fields including `lockEndTime`, `locked`, and `lockedAmount`. The source also exposes `withdraw`, `withdrawAll`, and `withdrawByAmount`. This is materially stronger than treating the address as a generic inaccessible wallet: the contract has accounting for user lock state and withdrawal paths.

- Verified contract/source and ABI: https://bscscan.com/address/0x45c54210128a065de780c4b0df3d16664f7f859e
- Official PancakeSwap integration documentation identifies the same address as the CakePool contract: https://docs.pancakeswap.finance/welcome-to-pancakeswap/how-to-guides/v3-v2-migration/migration/cake-syrup-pool
- BscScan's transaction/event view includes `Withdraw` and `Withdraw All` activity for this contract; these events establish that withdrawal activity exists, but do not by themselves identify how much of the current balance is permanently unrecoverable: https://goto.bscscan.com/address/0x45c54210128a065de780c4b0df3d16664f7f859e

### Interpretation

1. **Do not subtract the full `balanceOf(CakePool)` from circulating supply.** The pool is an active accounting contract with withdraw functions and individual user lock expiries. Contract balance is not synonymous with permanently burned supply.
2. `totalLockedAmount()` is a useful on-chain state variable, but it is not automatically equal to permanently irrecoverable CAKE. It tracks lock principal in the pool's own logic and can change as locks expire/unlock; current `userInfo` records may be needed to classify remaining lock periods and any delegated balances.
3. `totalShares()`, `available()`, `balanceOf()`, and `totalLockedAmount()` should be captured at one pinned block, alongside the CAKE token balance of the pool. The exact semantics of each getter must be read from verified source before deriving any circulating-supply adjustment.
4. Historical reconstruction must account for pool deposits, withdrawals, unlocks and token transfers. A withdrawal event is evidence of recoverability for that withdrawn amount, not proof that every current token is liquid; an active lock is not proof of permanent burn.
5. The earlier ~5.29M delegated/locked figure from the official 2025 article is a dated historical claim and must not be reused as the current locked balance.

### Next read-only capture enhancement

Extend the existing capture script to call the pool's verified view methods at the same BSC block tag as `totalSupply()` and token balances, preserving raw return values and selectors. Add tests for successful/missing pool-state fields, then use the captured state plus event history to calculate only explicitly supported bounds. Until this is complete, the circulating-supply formula remains unresolved and unpublished.

This finding narrows the uncertainty but does **not** yet establish a final circulating-supply number.


## 6. Next capture implementation — pool accounting getters

The read-only capture now also attempts to record the verified CakePool getters `totalLockedAmount()`, `totalShares()`, `available()`, and `balanceOf()` at the exact same pinned BSC block as the token supply/balance calls. Function selectors are pinned to the Keccak-256 signatures (`totalLockedAmount()` → `0x05a9f274`, `totalShares()` → `0x3a98ef39`, `available()` → `0x48a0d754`, `balanceOf()` → `0x722713f7`) and covered by a unit test. The normalizer keeps these as separate observations and labels pool shares distinctly; it does not subtract any pool-state field from circulating supply. The workflow runs the normalizer unit tests before performing the live read-only capture. The actual workflow result must be checked before treating these new fields as verified observations.


## 7. Successful same-block pool-state capture — run 38074692658

**Workflow:** [Research On-chain Capture #38074692658](https://github.com/olegsh247-stack/Crypto/actions/runs/38074692658) — success. Syntax check, evidence-normalizer unit tests, read-only capture, normalization, envelope validation and artifact upload all passed.

- **Pinned BSC block:** 126,873,367 (chain ID 56).
- **Raw capture SHA-256:** `56e6997159580821126388613bc644209e661a3636b42a217bc5a08ade459da5`.
- **Normalized envelope SHA-256:** `569f5edcc94aa0bbdad433730eae7807dfa9eb5c18a685bb3ef6d8354088bd92`.
- **Capture errors:** none. Artifact: `sol-cake-rpc-capture-38074692658`.

| Getter / observation | Value at block 126,873,367 | Source meaning / caveat |
|---|---:|---|
| CAKE `totalSupply()` | 5,543,692,995.751051 CAKE | Contract total supply, not circulating supply |
| Burn address balance | 5,168,552,286.608597 CAKE | Separate raw token balance |
| `totalSupply - burn balance` | 375,140,709.142454 CAKE | Candidate baseline only; policy exclusions still require methodology review |
| CAKE balance held by CakePool | 13,393,658.357722 CAKE | BEP-20 `balanceOf(CakePool)` |
| `available()` | 13,393,658.357722 CAKE | Verified source: direct token balance held by CakePool; exactly matches token-level balance at this block |
| `totalLockedAmount()` | 10,643,456.465049 CAKE | Pool accounting field; not equivalent by itself to permanently burned supply |
| `totalShares()` | 190,019,229.888360 shares | Share accounting; not to be assumed equal to CAKE |
| CakePool `balanceOf()` | 203,751,102.981434 CAKE | Verified source defines this as direct token balance plus `totalBoostDebt`, not the token balance of the contract |

The `balanceOf()` getter is therefore not a duplicate of the CAKE token's `balanceOf(pool)`: its difference from `available()` is approximately **190,357,444.623712 CAKE**, consistent with a substantial boost-debt component. The next capture enhancement adds the explicit `totalBoostDebt()` getter so that this relationship can be tested rather than inferred. Until that next read-only run succeeds, the difference is a derived cross-check from this artifact, not an independently captured `totalBoostDebt` field.

## 8. SOL point-in-time observation from the same run

The Solana RPC capture had no reported errors. `getSupply` returned finalized context slot **455,349,175**: circulating **588,848,618.770245 SOL**, non-circulating **46,750,203.227394 SOL**, combined **635,598,821.997639 SOL**. The separate `getSlot` request returned slot 455,349,174, one slot behind because calls are sequential; use the `getSupply` context slot for the supply observation. This is a point-in-time supply snapshot, not a historical activity series.

### Interpretation boundary

The new same-block state improves the description of the CakePool accounting, but it does **not** yet establish how much CAKE should be excluded from circulating supply. We still need the explicit boost-debt getter, relevant user-level lock-state/event history, and aligned source methodology before approving a canonical formula.


## 9. Final verified pool-accounting check — run 38075073697

**Workflow:** [Research On-chain Capture #38075073697](https://github.com/olegsh247-stack/Crypto/actions/runs/38075073697) — success. The paired [Research Evidence Envelope Tests #38075073757](https://github.com/olegsh247-stack/Crypto/actions/runs/38075073757) also passed.

- Pinned BSC block: **126,874,122**, chain ID 56.
- Raw capture SHA-256: `8f1cad22f097456c76b59ef20ba47f6ffc70d70011d377a685167887ebc1d9f3`.
- Normalized envelope SHA-256: `09c1a3734b1adf6473ace77b5162d23d15e2e5ac809bd06eb2981707b344f58a`.
- Capture errors: none; normalizer and envelope validation passed; artifact `sol-cake-rpc-capture-38075073697` uploaded.

| CakePool getter | Value at block 126,874,122 |
|---|---:|
| `available()` | 13,393,658.357722 CAKE |
| `totalBoostDebt()` | 190,357,444.623712 CAKE |
| `balanceOf()` | 203,751,102.981434 CAKE |
| `balanceOf() - available() - totalBoostDebt()` | **0 CAKE** |
| `totalLockedAmount()` | 10,643,456.465049 CAKE |
| `totalShares()` | 190,019,229.888360 shares |

The key identity from the verified CakePool source is now independently checked against the same pinned block and enforced by the normalizer: `balanceOf() = available() + totalBoostDebt()`. The new getter's selector is `0xe73008bc`, computed as Keccak-256 for `totalBoostDebt()` and covered by a unit test. A deliberately inconsistent fixture is rejected. This closes the contract-state capture implementation block; it does **not** close the circulating-supply methodology question.

### Next CAKE work

1. Capture aligned month-end values for `totalSupply()`, dead-address balance, pool token balance, `available()`, `totalBoostDebt()`, `totalLockedAmount()`, `totalShares()`, and pool events.
2. Inspect relevant `userInfo(address)` records and lock/unlock/withdraw history; avoid trying to enumerate all users through guessed lists.
3. Reconcile official PancakeSwap's locked/burn treatment against the on-chain pool accounting and the independent tracker on matched dates. Publish no final circulating-supply number until this is reproducible.


## 10. Historical month-boundary capture — successful archive-state run

**Workflow:** [Research CAKE Historical Month-boundary Capture #38075610742](https://github.com/olegsh247-stack/Crypto/actions/runs/38075610742) — success. The capture used `https://rpc-bnb.blockmachine.io`, a public BSC RPC endpoint, with a 1.05-second inter-request pacing interval to avoid public endpoint throttling. The separate current-state capture [#38075606119](https://github.com/olegsh247-stack/Crypto/actions/runs/38075606119) and evidence-envelope tests [#38075557661](https://github.com/olegsh247-stack/Crypto/actions/runs/38075557661) also passed.

- **Raw historical capture SHA-256:** `bc1a4a271f3b66d6bd1cd8ff9599795c9594b8ee36580e307359ac868980a2c6`.
- **Workflow artifact digest:** `sha256:704b07e385c701cb6b5be6f936a99eb1728e1d67fddc688c21d7aa63ef058ff8`.
- **Errors:** none. Every selected block hash and exact UTC timestamp was verified; all calls use that same pinned block for each snapshot.
- The month boundary block numbers/hashes were first located by binary search and preserved in the script; the historical run re-verified them against the alternate endpoint before reading state.

| UTC boundary | BSC block | Total supply (CAKE) | Burn-address balance (CAKE) | Supply minus burn (CAKE) | Tracker-style candidate (CAKE) | CakePool token balance (CAKE) | `totalLockedAmount()` (CAKE) |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2026-06-01 | 101,590,093 | 4,382,329,363.751051 | 4,038,491,951.275378 | 343,837,412.475673 | 343,680,606.393274 | 13,513,420.066182 | 10,730,956.399635 |
| 2026-07-01 | 107,345,138 | 4,677,241,871.751051 | 4,335,516,079.161436 | 341,725,792.589615 | 341,568,970.785227 | 13,472,550.741602 | 10,697,609.071108 |
| 2026-08-01 | 113,293,990 | 4,913,530,935.751051 | 4,572,916,172.198446 | 340,614,763.552605 | 340,457,938.765211 | 13,462,257.167809 | 10,688,450.400891 |
| 2026-09-01 | 119,243,647 | 5,209,477,531.751051 | 4,871,091,805.381706 | 338,385,726.369346 | 338,228,757.779641 | 13,445,597.387106 | 10,677,375.781769 |
| 2026-10-01 | 125,000,756 | 5,458,821,527.751051 | 5,110,604,012.337011 | 348,217,515.414041 | 348,059,224.582406 | 13,402,580.295356 | 10,650,860.940877 |

**Tracker-style candidate definition used only for comparison:** `totalSupply - burn address - CAKE token-contract self-balance - 0x…0001 balance - 0x…0002 balance`. It reproduces the independent tracker's described exclusions, but is not yet approved as Crypto's canonical circulating-supply formula. The full CakePool balance is not subtracted in this candidate.

| Boundary interval | Δ total supply (CAKE) | Δ burn address (CAKE) | Δ supply-minus-burn (CAKE) | Δ tracker-style candidate (CAKE) | Δ CakePool token balance (CAKE) |
|---|---:|---:|---:|---:|---:|
| Jun 1 → Jul 1 | +294,912,508.000000 | +297,024,127.886058 | −2,111,619.886058 | −2,111,635.608047 | −40,869.324580 |
| Jul 1 → Aug 1 | +236,289,064.000000 | +237,400,093.037010 | −1,111,029.037010 | −1,111,032.020016 | −10,293.573793 |
| Aug 1 → Sep 1 | +295,946,596.000000 | +298,175,633.183260 | −2,229,037.183260 | −2,229,180.985570 | −16,659.780703 |
| Sep 1 → Oct 1 | +249,343,996.000000 | +239,512,206.955305 | +9,831,789.044695 | +9,830,466.802765 | −43,017.091751 |

At all five snapshots, `available()` equals the BEP-20 token balance of the CakePool address, and `balanceOf() = available() + totalBoostDebt()` reconciles exactly (zero raw-unit difference). `totalLockedAmount()` declines from 10.731M to 10.651M CAKE over this window; this is pool accounting, not proof that the same amount is permanently burned.

### What the historical series says — and does not say

1. The on-chain candidate excluding the dead address and the three small tracker-listed balances fell through September, then increased by about 9.830M CAKE from the September 1 to October 1 boundary.
2. The earlier issuer-reported June–September monthly net-mint arithmetic totals **−7,402,733 CAKE**. That differs materially from the boundary-to-boundary candidate series (approximately **+4.379M CAKE** from June 1 to October 1). This is a real reconciliation gap to investigate, not evidence that either number should be overwritten.
3. Before comparing the issuer figure with this series, align the issuer's exact reporting periods, the source's burn-recognition dates, and the UTC block boundaries. Then reconcile token Transfer/mint/burn events and the weekly-burn proration described in the official methodology.
4. The sensitivity calculation subtracting the entire CakePool token balance would be about 13.4M CAKE lower at each boundary; it remains **unapproved**, because the pool has user withdrawals, lock state, and a large boost-debt accounting component.

### Next step

Reconstruct the exact June–September mint/burn transfer event totals and match them to issuer-reported monthly periods; verify the official methodology's weekly-burn proration. Only after this does the circulating-supply definition become eligible for Product Contour review. Do not publish a final circulating-supply value or derive scores from this candidate series yet.


## 11. Issuer report comparison — exact published values

The four official monthly reports state the following figures:

| Report month | Minted (CAKE) | Burned (CAKE) | Reported net mint (CAKE) | Report publication / as-of date | Source |
|---|---:|---:|---:|---|---|
| June 2026 | 652,564 | 2,402,150 | −1,749,587 | Published Jul 9; says as of Jul 6 | [June CAKE Burn Report](https://blog.pancakeswap.finance/articles/cake-burn-june-2026) |
| July 2026 | 674,316 | 1,944,441 | −1,270,125 | Published Aug 6; says as of Aug 3 | [July CAKE Burn Report](https://blog.pancakeswap.finance/articles/july-cake-burn-report) |
| August 2026 | 674,316 | 2,746,334 | −2,072,018 | Published Sep 9; says as of Sep 7 | [August CAKE Burn Report](https://blog.pancakeswap.finance/articles/august-cake-burn-report) |
| September 2026 | 652,564 | 2,963,567 | −2,311,003 | Published Oct 7; says as of Oct 5 | [September CAKE Burn Report](https://blog.pancakeswap.finance/articles/september-cake-burn-report) |
| **Total** | **2,653,760** | **10,056,492** | **−7,402,733** | Four reported months | Sum of the four reported net-mint values |

The June line has a one-CAKE arithmetic difference between the displayed minted/burned totals and the report's net-mint figure (652,564 − 2,402,150 = −1,749,586, while the report says −1,749,587). Preserve the issuer's stated net-mint value as reported; do not silently adjust it.

### Why the on-chain boundary series cannot yet be compared as if windows matched

The issuer explicitly says it excludes CAKE mints that directly contribute to burning and prorates weekly burns across adjacent months. The historical RPC series instead measures raw `totalSupply()`, the dead-address balance, and their difference at exact UTC block boundaries. Therefore the raw `totalSupply()` increase of hundreds of millions per month is not itself user-facing issuance: it must be separated from the mint-to-dead component, while dead-address transfers and the issuer's weekly-burn allocation are reconciled independently.

The on-chain tracker-style candidate changed by approximately **+4,378,618.189132 CAKE** from the June 1 to October 1 snapshots, whereas the sum of issuer-reported monthly net-mint figures is **−7,402,733 CAKE**. These are not aligned reporting windows, so this is a **reconciliation target**, not a conclusion that the issuer or RPC is wrong. The large September sign difference makes event-level attribution the next required step.

### Required event-level reconciliation

1. Identify mint-to-dead transfers separately from regular emission mints. The official reports explicitly exclude the former from their reported mint total.
2. Sum transfers into and out of the dead address for the same exact block intervals and reconcile them to the observed dead-address balance delta.
3. Compare `ΔtotalSupply − mint-to-dead amount` against the issuer's reported regular mint, then compare transfers-to-dead (with weekly-burn proration applied) against reported burns.
4. Use the issuer's stated as-of dates (July 6, August 3, September 7, October 5) as separate checkpoints where an exact time/block can be resolved. Do not claim calendar-month equality unless the reporting methodology establishes it.

The official reports and their notes are source evidence, not permission to publish a circulating-supply figure. Until the event-level bridge is complete, keep the candidate series unapproved.
