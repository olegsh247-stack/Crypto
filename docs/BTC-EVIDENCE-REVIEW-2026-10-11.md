# BTC Evidence review for scenario links — 2026-10-11

**Scope:** BTC only; snapshot `BTC-2026-10-07-v1`.  
**Source of row inventory:** successful read-only VPS API Build Rehearsal #294 and BTC row-level preflight.  
**State:** review recorded on PR branch; seed migration is not production-applied.

## Decision

The current 15 Evidence rows are predominantly qualitative assessments, not independent measurements of institutional flows, market liquidity, fee economics, or miner profitability. The API's metric rows for ETF flows, price, supply and hashrate are separate observations; they must not be silently treated as Evidence rows or as fresh readings. In the last checked payload, ETF flows were observed on 2026-09-18 and spot price on 2026-09-19, both marked stale.

Only one Evidence row has a sufficiently specific source for a narrow regulatory-catalyst link:
- Evidence `cb2704be-210b-42e2-925f-977d5889acdd`: “Regulatory and custody improvements can expand institutional access.”
- Source: SEC press release for proposed custody rules, dated 2026-10-01.
- Interpretation: it documents a proposal that may reduce regulatory friction for advisers and regulated funds. It does **not** prove final adoption, realized institutional allocation, ETF inflows, or a bullish price outcome.

## Curated links in the additive seed migration

Migration: `infrastructure/neon/migrations/2026-10-11-btc-scenario-evidence-links-seed.sql`

| Scenario | Relation | Evidence | Why this link is defensible | Limitation |
|---|---|---|---|---|
| Bull | `supports` | SEC custody proposal Evidence row above | Directly supports existence of a potential institutional-access catalyst | Proposal only; no proof of realized adoption or flows |
| Bear | `context` | Same SEC custody proposal Evidence row | Countervailing policy context for the Bear assumption that custody barriers increase | Does not invalidate Bear; proposal is not final |

The seed uses stable scenario type + snapshot + Evidence ID joins, composite same-snapshot constraints, and `ON CONFLICT DO NOTHING`. It is repeatable and does not change the existing scenario probabilities or create scenario states.

## Deliberately not linked yet

- **Base:** no current Evidence row directly proves “dominant crypto monetary asset” or supports a calibrated 50% probability. Scarcity and network-security claims exist, but their current stored source URLs point to a broad Bitcoin Core landing page rather than claim-specific pages; linking them as strong proof would overstate the source.
- **Bull:** no direct Evidence row currently proves expanding treasury adoption, realized institutional allocation, sustained monetary demand, or robust current network-security economics. The stale ETF flow metric is not a substitute for claim-specific Evidence.
- **Bear:** no claim-specific Evidence row proves liquidity tightening, persistent institutional outflows, prolonged fee weakness, or deteriorating miner economics. Generic risk prose sourced to a broad development page is not adequate proof.
- The SEC crypto-asset interpretation describes legal classification and securities-law application; it does not substantiate the stored claim that BTC valuation is sensitive to liquidity, real yields or risk appetite.
- Bitcoin Core release history supports release activity, not market demand or investment performance. The current broad Bitcoin Core landing-page URL is insufficiently specific for some stored scarcity/security claims.

These gaps are intentional. Do not add links solely to make all scenarios non-empty. Next source-quality work should attach direct, claim-specific URLs to the relevant Evidence records or create properly sourced Evidence from suitable official/on-chain/market data. Preserve actual observation timestamps and stale status.

## Probability and scenario-state guardrails

- Keep Base 50% / Bull 30% / Bear 20% unchanged as analyst-assigned weights.
- Do not derive probabilities from link counts or Evidence sentiment.
- Confidence remains distinct from scenario probability.
- No scenario-state row is created by this migration.
- Production remains untouched; schema and seed migrations require the separately approved migration process before deployment.
