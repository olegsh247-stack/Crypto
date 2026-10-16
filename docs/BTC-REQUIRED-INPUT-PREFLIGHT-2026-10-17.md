# BTC required-input preflight — 2026-10-17

## Scope and safety

Read-only preflight following the user's instruction to continue the BTC single-scenario work. This was not a production capture: no payload was written to the repository as an observation, no database or ingestion was used, and no scenario was evaluated or persisted.

## Spot price — blocked

The canonical registry allows the Kraken XBT/USD Trades endpoint for `market.spot_price`. The web retrieval tool could not access the Kraken API URL during this preflight. Therefore no current price value, observation timestamp, retrieval timestamp, or source payload hash was obtained. Search snippets or an alternate venue are not substituted for the registered source.

**Decision:** spot price remains unverified and cannot pass the 1-hour readiness gate. No value was guessed or inserted.

## ETF net flow — blocked

Read-only review of the public [Farside Bitcoin ETF Flow table](https://farside.co.uk/btc/) showed populated rows through **15 October 2026**. The row for **16 October 2026** contains dashes for fund-level values and a displayed total of 0.0; this is not evidence of a finalized zero-flow observation. The page states that its table is generated automatically and disclaims errors/inaccuracies.

The visible populated five-session values from 5–9 October remain -89.8, +118.8, -484.9, -244.1 and +21.1 USD million (sum -678.9 million), but they are historical and do not satisfy the latest-observation freshness requirement on 17 October. This historical sum is not used as a current scenario input.

**Decision:** do not coerce the 16 October dashes into zero, do not mark the row final, and do not treat the historical five-session sum as current. Farside raw payload was not archived; retention/reuse rights and the required revision/finality evidence remain unresolved.

## Readiness decision

BTC remains `not_evaluable`. Both required inputs must pass their own freshness, source, unit, provenance and integrity checks before the rule can run:
- `market.spot_price`: registered Kraken source, USD/BTC, observed within 1 hour.
- `institutional.etf_net_flow`: latest finalized traceable observation within 36 hours, plus at least five distinct reporting dates in the prior 14 days, complete fund coverage, and verified revision/finality evidence.

No database writes, ingestion, scenario-state changes, probability changes, deployment, or merge occurred. PR #83 remains Draft/open/unmerged.
