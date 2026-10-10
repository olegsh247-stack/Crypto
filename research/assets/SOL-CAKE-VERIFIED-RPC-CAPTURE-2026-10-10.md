# SOL / CAKE — Verified point-in-time RPC capture and interpretation

**Capture time:** 2026-10-10 08:40 UTC  
**Workflow:** [Read-only SOL + CAKE RPC capture, run 38038663458](https://github.com/olegsh247-stack/Crypto/actions/runs/38038663458)  
**Branch/head at capture:** `fix/product-contour-v1-contracts` / `5e631b2b7d606abbf5c305b39201d77913a74403`  
**Artifact:** `sol-cake-rpc-capture-38038663458`  
**Raw JSON SHA-256:** `d2d845603664fe6235fc0b4a175626f9e2097d98f5b31e3c3d9fce3cdbc87bc1`  
**Capture result:** no RPC errors; raw data only; no chain or database writes.

## 1. CAKE — pinned BNB Smart Chain reads

The capture confirmed chain ID 56 and pinned every CAKE `eth_call` to BSC block **126,797,363**. The token contract was `0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82`, with 18 decimals.

| Observation | Raw contract value at block 126,797,363 |
|---|---:|
| `totalSupply()` | 5,543,692,995.751051 CAKE |
| `balanceOf(0x000000000000000000000000000000000000dead)` | 5,168,552,286.608597 CAKE |
| `totalSupply - burn-address balance` | **375,140,709.142454 CAKE** |
| CAKE held by token contract itself | 156,166.560807 CAKE |
| Balance of address `0x…0001` | 2,080.632173 CAKE |
| Balance of address `0x…0002` | 43.638654 CAKE |

### Correct interpretation

The raw `totalSupply()` value above 5 billion is **not by itself evidence of an RPC error or a 5-billion circulating supply**. CAKE has a very large balance at the conventional burn address. PancakeSwap's official tokenomics instructions explicitly say to calculate the homepage circulating supply by subtracting the burn-address balance from total supply; CAKE locked forever in the legacy CAKE pool is also treated as burned and is accounted for by the referenced Dune dashboard.

Accordingly, the same-block `totalSupply - burn balance` arithmetic is about **375.141 million CAKE**. This is a useful point-in-time cross-check and is directionally consistent with a supply in the hundreds of millions. It is **not yet the final canonical circulating-supply figure**, because the legacy CAKE pool address/balance and historical methodology still need to be verified, and no historical block-to-block series has been captured.

Sources:
- Official CAKE tokenomics and supply calculation: https://docs.pancakeswap.finance/protocol/cake-tokenomics
- BscScan token contract page: https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82
- Official token audit workbench / contract identity: https://github.com/pancakeswap/cake-token

### Do not do this

- Do not compare raw `totalSupply()` alone with the 400M policy hard cap and label the capture erroneous.
- Do not subtract arbitrary candidate addresses (including `0x…0001`, `0x…0002`, or the token contract itself) as “burned” without proving the tokenomics methodology.
- Do not call the current same-block subtraction a historical net supply change or holder-value-accrual measure.
- Do not assume the four-month issuer-reported sum of **-7,402,733 CAKE** is equal to the on-chain circulating-supply delta.

## 2. SOL — verified point-in-time supply and validator-account aggregates

The same run captured Solana finalized state at context slot **455,192,578**:

| Observation | Value |
|---|---:|
| Circulating supply reported by `getSupply` | 588,791,823.676452 SOL |
| Non-circulating supply reported by `getSupply` | 46,744,644.953929 SOL |
| Sum of those fields | 635,536,468.630381 SOL |
| Current vote-account activated stake aggregate | Preserved in raw capture |

These are point-in-time RPC values with a finalized slot, not a historical activity series. The vote-account aggregate is not validator-client diversity and not a unique-user measure. The artifact does **not** contain the required 30-day daily series of successful/failed non-vote transactions, fees, fee payers or application attribution.

## 3. What this closes and what remains open

- [x] A read-only RPC capture succeeded without errors.
- [x] CAKE contract reads are pinned to a single BSC block.
- [x] The raw CAKE supply is interpreted alongside the burn-address balance rather than used alone.
- [x] SOL supply values and finalized slot are captured and preserved.
- [ ] Identify and verify the legacy CAKE pool address and its treatment; avoid double-counting.
- [ ] Capture CAKE `totalSupply()`, burn-address balance and verified legacy-pool balance at aligned month-boundary blocks.
- [ ] Reconcile these block-pinned changes against issuer reports and document residuals.
- [ ] Capture the separate historical SOL activity series using an approved provider/API and independently reconcile samples.

This report is evidence-only. It authorizes no database write, schema migration, deployment, merge, score, scenario state or SOL/CAKE publication.
