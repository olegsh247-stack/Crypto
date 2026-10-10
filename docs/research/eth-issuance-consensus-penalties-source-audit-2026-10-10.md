# ETH issuance and consensus penalties — public source audit

**Audit date:** 2026-10-10  
**Scope:** Find a public, machine-readable source for historical ETH issuance and consensus penalties without a paid data plan or operating an archive node.  
**Repository context:** Crypto product repository; this note does not concern the separate CRYPTO-JOURNAL Excel prototype.

## Decision

**A strong public candidate exists: https://ethsupply.fyi/. Do not continue broad API hunting yet.** Its published methodology describes a per-slot supply ledger with coverage from genesis to the present and exposes JSON API contracts. The live page separates issuance, execution-layer burn, and consensus penalties; its displayed consensus components include missed source/target, inactivity, missed sync, initial slashing, and correlation slashing.

However, the public documentation alone does **not yet prove** that the retained historical API returns every component for every historical slot/epoch over the entire period required by all six ETH signals. Treat this as a promising candidate, not as fully validated ingestion input, until the response coverage and arithmetic are tested.

## Source and machine-readable interfaces

- Website and live ledger: https://ethsupply.fyi/
- Methodology and API schema: https://ethsupply.fyi/methodology/
- Live JSON endpoint: https://ethsupply.fyi/api/live
- Historical chart endpoint: https://ethsupply.fyi/api/history?range=retained
- Tracked retained accounting endpoint: https://ethsupply.fyi/api/trackedRetained
- Ethereum consensus rewards/penalties specification: https://github.com/ethereum/consensus-specs
- Official explanatory reference: https://ethereum.org/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/

The published API schema says numeric quantities requiring exact precision are represented as decimal strings in Wei/Gwei. Successful responses publish an ETag, SHA-256 digest, generated-at timestamp, and revision headers. This is useful for reproducible ingestion and revision detection.

## What the source claims to cover

The methodology describes:
- A live per-slot supply ledger, with historical proof/reconciliation against Ethereum state.
- Supply changes from issuance, execution fee burn, consensus penalties, and ETH destruction via SELFDESTRUCT.
- A historical full-state cross-check at execution block 15,082,718 and a pinned reconciliation at block 25,827,072 / consensus slot 15,064,579.
- API ranges including `live`, `24h`, `7d`, `30d`, and `retained`.
- Historical summary fields for issuance, burn, base-fee burn, blob-fee burn, consensus penalties, other execution burn, and net supply change.

These are claims in the source's own methodology and require independent verification before being treated as confirmed data quality.

## Important distinction

A correct **total supply / net issuance** series is not equivalent to a complete historical **penalty-component** series. Product signals must not infer historical validator penalties from a supply difference if that difference also includes execution burn, issuance, or other destruction.

Likewise, a public API can be free to read but still have limited retention, rate limits, undocumented gaps, or revisions. No paid plan or archive node should be introduced unless the targeted tests show a real coverage gap.

## Validation gate before ingestion

1. Fetch and preserve the raw JSON for `/api/live` and `/api/history?range=retained`; record retrieval time, response status, headers, schema, revision and SHA-256.
2. Establish exact earliest/latest timestamps and slots for each required field; test for missing intervals and null/unavailable statuses.
3. Confirm whether all six ETH signals can be derived directly. Keep issuance, execution burn, ordinary consensus penalties, and slashing-related penalties separate.
4. Compare selected epochs/slots against independent evidence: Ethereum consensus specifications and a second source or independently reproducible chain data. Include at least one historical slashing/correlation-penalty event and one ordinary missed-duty period where available.
5. Reconcile component sums to the published consensus-penalty total and supply-change equation at identical chain positions. Record rounding/precision and any known splice or methodology change.
6. If the historical API lacks component-level coverage, retain the source for the fields it does support and mark only the unsupported fields as unavailable. Do not start another open-ended provider search.

## Provisional status

**Candidate found; full-history component validation pending.** The next task is a bounded endpoint/schema/coverage test, not another general search for APIs. If the test confirms that the complete penalty-component history is not publicly accessible, document that exact gap and continue the Product Contour v1 with already-validated metrics.
