# BTC Protocol-Issued Supply Candidate — 2026-10-17

## Captured evidence

Read-only staging run: [BTC Public Source Staging #39056549608](https://github.com/olegsh247-stack/Crypto/actions/runs/39056549608).

- Source: Mempool.space public Bitcoin API; source ID `network.primary`, matching the current metric's source-priority identifier.
- Tip height: `971896`.
- Tip block hash: `0000000000000000000142a5ac84bd7c3f866ac84b97d56b1ec23a2267258cf5`.
- Tip block header timestamp: `2026-10-17T18:03:12Z`.
- Capture retrieval time: `2026-10-17T18:05:22.109Z`.
- Protocol-scheduled issuance through the tip height, inclusive: `2,009,967,812,500,000 sats = 20,099,678.125 BTC`.
- Combined raw-evidence SHA-256: `c62b776119cb8177804135945e4d620eb1db4b8fe0df40b8bfa1bbdb5ea75cab`.
- Candidate acceptance status: `REVIEW_ONLY_PROTOCOL_DERIVED_SUPPLY`.

The capture reads the tip height, the block hash at that height, and the block details, then rechecks the hash and tip height. If the height or hash changes during capture, it rejects the candidate rather than treating a moving tip as consistent evidence. The retained evidence includes endpoint URLs, HTTP statuses/date headers and per-response hashes.

## Calculation contract

For every height from genesis block 0 through the captured tip height (H), inclusive:

[
S(H)=\sum_{h=0}^{H}\left(50\cdot 10^8\;\text{sats} \;\gg\; \left\lfloor\frac{h}{210000}\right\rfloor\right)
]

The implementation uses integer satoshis and the consensus 210,000-block subsidy-halving interval. It does not use floating-point arithmetic for the issuance sum.

Test vectors include:
- Height 0 → 50 BTC.
- Height 209999 → 10,500,000 BTC.
- Height 210000 → 10,500,025 BTC.
- Height 839999 → 19,687,500 BTC.
- Height 840000 → 19,687,503.125 BTC.
- Height 971189 → 20,097,468.75 BTC, matching the older Blockchain.com daily chart point dated 2026-10-13.
- Height 971896 → 20,099,678.125 BTC.

## Semantic boundary

This calculation is **total protocol-scheduled coinbase issuance**, not a measurement of economically spendable coins, unspent transaction outputs, or coins excluding burns/lost keys. It is a strong reproducible candidate for the project's “circulating supply” metric only if the metric contract explicitly adopts total issued/mined supply as its definition.

No registry or runtime changes were made. The current metric is `monetary.circulating_supply`, unit `BTC`, freshness window 48 hours, and source priority `network.primary`; the candidate matches the source identifier and has a fresh chain-tip timestamp, but is not yet promoted. The older Blockchain.com chart is stale and retained only as a historical cross-check.

## Remaining acceptance gate

- [ ] Confirm the product metric means protocol-issued/mined supply, not economically spendable supply.
- [ ] Keep `tip_block_timestamp`, retrieval time, height, block hash, and evidence hashes distinct.
- [ ] Retain the stable-tip recheck and integer-satoshi calculation tests.
- [ ] Only after explicit contract review, update the approved registry/runtime source mapping; this document alone does not authorize that change.

**Safety:** no production DB access/writes, ingestion, scenario-state updates, or probability changes occurred. BTC remains `not_evaluable`.
