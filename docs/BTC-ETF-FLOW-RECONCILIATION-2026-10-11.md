# BTC ETF-flow source reconciliation — 2026-10-11

**Scope:** BTC only; stored metric `institutional.etf_net_flow`, observation date 2026-09-18.  
**Decision type:** source-revision analysis only. No observation, published snapshot, database row, or scenario state was changed.

## Finding

The discrepancy is now substantially explained by a **preliminary-to-revised Farside table update**, rather than evidence that two different fund universes were intentionally measured:

- The stored value is **+$324.6M** for 18 September 2026.
- Farside's currently visible all-data table reports **+$433.0M** for that date, including IBIT **+$108.4M**, FBTC **+$310.7M**, and BITB **+$9.7M**; the other displayed non-zero contributions are HODL +$2.3M and ARKB +$1.9M. The total is consistent with the displayed fund-level values. [Farside current historical table](https://farside.co.uk/bitcoin-etf-flow-all-data/)
- A contemporaneous account of the revision states that +$324.6M was the figure seen before IBIT had been reflected, and that IBIT's additional +$108.4M brought the total to +$433.0M. [Contemporaneous explanation](https://note.com/noble_chives458/n/n744825060c60?hl=en)
- A later dated report also reproduces the current Farside row and fund breakdown. [Liquid State, 18 September 2026](https://www.liquidstate.tech/brief/farside-btc-etf-tue-15-outflow)

This evidence makes **+$433.0M the best-supported revised historical total** in the current Farside table. The old +$324.6M value is consistent with an earlier/incomplete table state where IBIT's +$108.4M was not yet included. It should not be represented as the final revised daily total.

## What is and is not resolved

**Resolved to a high-confidence working explanation:** the difference is the later inclusion/revision of IBIT, not a justified choice between two equally complete final totals.

**Not resolved at the data-contract level:** the repository's observation does not preserve the original Farside table capture, retrieval timestamp, revision identifier, or an explicit “preliminary” status. We therefore cannot prove exactly which version of the source was ingested or when it changed. The contemporaneous explanation is secondary corroboration, while the live Farside page is the primary source for the currently displayed total.

## Safe correction proposal

1. Keep the stored +$324.6M observation unchanged for now; it is a historical record of an incompletely captured source state, not an approved final value.
2. Do not mutate the published snapshot `BTC-2026-10-07-v1` in place and do not silently rewrite the existing observation.
3. In a separately reviewed, version-aware data correction, add a new observation/revision for **+$433.0M**, observed for the 2026-09-18 session, citing Farside and retaining retrieval time/source-version context if the schema supports it.
4. Before implementing that correction, inspect the observation natural key, revision support, and snapshot immutability/versioning rules. If the schema cannot preserve both the preliminary record and the revised record safely, design an additive migration/data-contract change first.
5. Keep the metric stale for current-market decisions. A corrected historical daily flow does not make a 23-day-old observation current.

## Acceptance impact

This resolves the *explanation* for the ETF discrepancy but does not by itself make the BTC scenario ready. The hashrate date/window mismatch, circulating-supply semantic/source gap, qualitative-only monitoring signals, stale market metrics, and live Worker rollout gap remain. No scenario state should be published based on this reconciliation alone.

## Verification

- Current Farside table shows the 18 Sep 2026 row total +$433.0M and IBIT +$108.4M.
- The component amounts reconcile to the displayed total.
- The contemporaneous revision explanation identifies the missing IBIT amount as the difference.
- No repository runtime, database, or production mutation was performed for this source review.
