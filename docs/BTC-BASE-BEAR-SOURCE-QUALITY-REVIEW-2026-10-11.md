# BTC Base/Bear source-quality follow-up — 2026-10-11

**Scope:** BTC only; published snapshot `BTC-2026-10-07-v1`.  
**Purpose:** identify defensible primary-source candidates without manufacturing evidence links, metric observations, monitoring thresholds, or scenario states.  
**Status:** documentation review on PR branch; no database writes or production changes.

## Decision summary

The current Evidence inventory does not yet justify adding new Base or Bear scenario links. We found useful source candidates for protocol mechanics and broad financial conditions, but these sources answer narrower questions than the scenario claims:

- A protocol specification can substantiate design properties; it cannot establish that BTC is currently the dominant monetary asset or that its 50% scenario weight is calibrated.
- Mining documentation can explain block rewards and fee incentives; it cannot establish current miner profitability or a sustained decline in fee revenue.
- A broad financial-conditions index can provide context for tightening/loosening; it does not by itself prove BTC-specific liquidity, institutional outflows, or price sensitivity.
- Current stale spot-price and ETF-flow observations remain historical observations, not evidence of current conditions.

Therefore: keep Base unlinked, keep the existing narrow Bull/Bear SEC proposal links unchanged, and do not seed new links until an existing Evidence claim is mapped to a source that directly supports that exact claim or a new properly sourced observation is created.

## Candidate source review

| Candidate | What it can support | What it cannot establish | Decision |
|---|---|---|---|
| Bitcoin white paper — https://bitcoin.org/en/bitcoin-paper | Original design intent for peer-to-peer electronic cash and the system's proposed mechanics | Current market dominance, adoption at scale, store-of-value performance, current institutional demand, or a calibrated scenario probability | Useful for protocol/design claims only; not a Base valuation link |
| Bitcoin developer guide, Mining — https://developer.bitcoin.org/devguide/mining.html | How miners receive block rewards and transaction fees; mechanics of solo/pool mining | Current fee revenue, cost basis, margins, miner stress, or profitability trend | Candidate background source; requires actual on-chain/revenue and cost data for Bear claims |
| Bitcoin developer guide, Block Chain — https://developer.bitcoin.org/devguide/block_chain.html | Block reward composition, subsidy and transaction-fee mechanics, UTXO/block structure | Current security economics, real-world liquidity, or market demand | Better scoped than a generic homepage for technical claims; still not a current market observation |
| Chicago Fed National Financial Conditions Index (NFCI) — https://fred.stlouisfed.org/series/NFCI | Weekly broad US financial conditions; positive values indicate tighter-than-average conditions and negative values looser-than-average conditions | Crypto-specific liquidity, BTC ETF flows, or a causal effect on BTC price | Candidate macro context only; needs explicit observation dates and a reviewed interpretation rule |
| FRED NFCI series data — https://fred.stlouisfed.org/data/NFCI | Machine-readable historical values for the NFCI series | A ready-made BTC scenario threshold or a BTC-specific causal relationship | Possible future ingestion source after a metric contract and revision policy are specified |

## Claim-to-evidence acceptance matrix

### Base

- **“BTC is a dominant crypto monetary asset”** — NOT SUPPORTED by the sources above. This is a comparative market claim and needs a defined universe, a dated market-cap/supply/liquidity or adoption comparison, and a reproducible method. The white paper does not prove present-day dominance.
- **“Scarcity / supply cap”** — potentially supportable by exact consensus-rule documentation and/or deterministic chain-derived supply data. The currently stored broad Bitcoin Core URL must not be treated as if it were a specific technical citation. Review the actual claim text and replace or supplement its source only through an additive, reviewable migration.
- **“Network security”** — requires carefully scoped technical evidence and current observable measures (for example, hashrate/difficulty history and their as-of times). A release-history page is not evidence of security level; hashrate alone is not a complete security guarantee.
- **Base probability 50%** — remains an analyst-assigned weight. None of these sources calibrates it.

### Bear

- **“Liquidity tightening / risk-off”** — NFCI may be a contextual macro series, but it is not sufficient alone. A future signal needs an explicit series, units, observation frequency, update/revision semantics and a reviewed interpretation. Do not invent a threshold from a single current reading.
- **“Persistent institutional outflows”** — requires a consistent, dated flow series with provider methodology, coverage, direction convention and missing-data handling. The existing ETF-flow observation is stale and cannot establish persistence.
- **“Prolonged fee weakness / miner economics deteriorate”** — requires an on-chain fee/reward series and a stated lookback, plus cost/profitability data if making a profitability claim. Developer documentation explains mechanics but does not measure current economics.
- **“BTC valuation is sensitive to liquidity, real yields or risk appetite”** — requires an explicitly documented empirical basis or should remain a qualitative hypothesis. A general regulatory page or a broad macro index is not direct evidence for the causal claim.

## Implementation guardrails

1. Do not add a link merely to make a scenario non-empty.
2. Do not rewrite historical `observed_at` values to current time; retain stale status until a new observation is ingested.
3. Distinguish source publication/update time, data observation time, and Crypto retrieval time.
4. Do not create numeric monitoring thresholds until metric definition, direction, lookback, source quality, cadence, missing-data behavior and review rationale are documented.
5. Do not change Base/Bull/Bear weights (50/30/20) or confidence values in this source-review task.
6. Do not create scenario-state rows. Definitions and current assessed state are separate artifacts.
7. Any source URL repair or new Evidence row must be an additive migration with clean-bootstrap/idempotency rehearsal, stable natural-key resolution (no hard-coded generated UUID), API projection tests and read-only BTC preflight.
8. No production migration, deployment, live database write or PR merge is authorized by this review.

## Next acceptance step

Inspect each existing BTC Evidence row alongside its exact claim and stored source URL. For each row, classify it as:

- direct support for the claim;
- contextual/background only;
- insufficient or mismatched source;
- requires a new measured observation.

Only direct, claim-matched sources should be linked to a scenario as `supports`, `contradicts` or `invalidation`. Context links must be labelled as context and must not be presented as proof. If no direct support exists, preserve the gap explicitly and proceed to define the needed observable data contract before adding monitoring logic.
