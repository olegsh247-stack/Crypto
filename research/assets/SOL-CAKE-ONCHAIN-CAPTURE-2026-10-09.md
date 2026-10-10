# SOL / CAKE — Block-pinned on-chain capture
Capture date: 2026-10-09
Capture window: 19:44:24–19:44:34 UTC (individual RPC calls have their own timestamps)
Workflow: https://github.com/olegsh247-stack/Crypto/actions/runs/37982243766
Artifact is retained by GitHub Actions for 7 days. This document records reviewed key values; the workflow artifact retains the raw JSON response.

## SOL — Solana Mainnet

Endpoint: `https://api.mainnet-beta.solana.com`
Documentation: https://solana.com/docs/rpc/http

| Method / field | Observation |
|---|---:|
| `getSlot` | 454,979,262 |
| `getEpochInfo` epoch | 1053 |
| `getEpochInfo` block height | 433,016,512 |
| `getEpochInfo` cumulative transaction count | 558,032,279,242 |
| `getSupply` context slot | 454,979,264 |
| Circulating supply | 588,768,304.987148293 SOL |
| Non-circulating supply | 46,768,738.054202758 SOL |
| Derived total supply | 635,537,043.041351051 SOL |
| `getInflationRate` total, epoch 1053 | 0.036097079076420034 (3.6097079%) |
| Current vote accounts | 674 |
| Delinquent vote accounts | 6 |
| Sum of current `activatedStake` | 437,858,115.649943790 SOL |
| Sum of delinquent `activatedStake` | 9,610.856193640 SOL |

The RPC methods are not atomic: `getEpochInfo` was sampled earlier than `getSupply`, and the context slots differ slightly. The stake totals are raw sums of `getVoteAccounts` response fields, not client diversity or operator concentration. The inflation parameter is not a forecast of net issuance after burns. Cumulative transaction count is not a unique-user or successful-economic-transaction measure.

## CAKE — BNB Smart Chain

Endpoint: `https://bsc-dataseed.binance.org`
Chain ID: 56
Block number: **126,693,951** (`0x78d323f`)
Every `eth_call` below was pinned to that same block tag.
Contract: `0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82`
Decimals: 18
Official contract reference: https://docs.pancakeswap.finance/bridge/bridging

| Method / field | Observation |
|---|---:|
| `totalSupply()` | 5,543,692,995.751051201610995531 CAKE |
| `balanceOf(0x…dEaD)` | 5,168,552,286.608597070001506838 CAKE |
| `totalSupply - dead-address balance` | 375,140,709.142454131609488693 CAKE |
| Token contract self balance | 156,166.560807245683434045 CAKE |
| `balanceOf(0x…0001)` | 2,080.632173163135706288 CAKE |
| `balanceOf(0x…0002)` | 43.638654286051842170 CAKE |
| Candidate locked balances, combined | 158,290.831634694870982503 CAKE |
| Derived supply after also subtracting candidates | 374,982,418.310819436738506190 CAKE |
| Zero-address balance | 0 CAKE |

### Interpretation and unresolved discrepancy

The raw `totalSupply()` value is cumulative minted supply, not circulating supply, because transfers to a dead address do not necessarily decrement an ERC-20 `totalSupply`. PancakeSwap's official tokenomics documentation says to subtract the dead-address balance and treat CAKE locked forever in the legacy pool as burned. A third-party methodology cross-check identifies the token-contract self balance and `0x…0001` / `0x…0002` balances as permanently locked. Treat the derived **~374.982M CAKE** as a provisional calculation pending methodology review, not as an approved canonical supply field.

The provisional estimate is below the official 400M hard cap, but it differs by about **56.66M CAKE** from the earlier untimestamped DefiLlama view (318.32M circulating / 329.92M total). Do not average the values or silently overwrite either. Resolve dashboard timestamp/methodology and confirm all permanently irretrievable balances before publication.

Sources:
- Official tokenomics: https://docs.pancakeswap.finance/protocol/cake-tokenomics
- Independent methodology cross-check: https://cryptoburntracker.com/burns/pancakeswap/
- Raw capture workflow/artifact: https://github.com/olegsh247-stack/Crypto/actions/runs/37982243766

## Safety and publication status

This capture is read-only. No chain transactions, signatures, Neon writes, schema migrations, deployment, numeric scores, scenario states or monitoring events were created. SOL and CAKE remain unpublished research drafts.