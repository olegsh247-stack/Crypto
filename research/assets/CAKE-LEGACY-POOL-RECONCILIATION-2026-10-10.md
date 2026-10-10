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
