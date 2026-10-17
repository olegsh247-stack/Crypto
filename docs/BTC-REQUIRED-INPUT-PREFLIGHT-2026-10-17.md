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


## Follow-up — successful GitHub Runner capture (workflow run #156)

After the initial direct-read failure, the read-only staging workflow was run on `main` at commit `d9b6a9b22d0cde339fc15a7a746fe74d591d8f91`: [run #156](https://github.com/olegsh247-stack/Crypto/actions/runs/38967487610). The job and artifact upload succeeded. Artifact: [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38967487610/artifacts/12075551423), SHA-256 `7be48d15498a71319c72ab5e0f8825deb28dc0ad7bb0dd7f1be35bd9d390dca0`, expires 2026-10-23.

- **Kraken access is confirmed through GitHub Runner.** Registered endpoint returned HTTP 200. Captured value: **81,574 USD/BTC**, source trade time `2026-10-16T21:10:30.066Z`, retrieval `2026-10-16T21:10:31.607Z`, payload SHA-256 `47b214e44d915913a9f83a95146d1e8017d52229a9c88888e4e582809e2c7569`. It was fresh at capture time but is now older than the 1-hour limit; it is evidence that access works, not a current input.
- Binance market-data-only and OKX endpoints also returned HTTP 200 for BTC/USDT, but those values are cross-checks only: USDT is not silently treated as USD and neither replaces the canonical Kraken USD/BTC source. Binance's primary API returned 451; Bybit returned 403.
- Mempool hashrate and block-fee responses were captured, but their measurement-window/unit semantics still require verification before they can be used as research inputs.
- Farside's main page returned 403 to the runner; the all-data page returned 200. The candidate parser produced historical daily ETF rows and reconciliation results, but all ETF rows remain review-only/blocked because provider observation/publication time and revision/finality are unverified. Dashes are not converted to zero.
- The workflow reported one market-price candidate and six blocked candidates/inputs; `production_database_accessed=false` and `production_writes_performed=false`. The artifact is temporary and contains raw public-source responses; do not treat it as an approved durable archive.

**Updated decision:** the network-access blocker for Kraken is resolved using GitHub Actions. The freshness blocker is not resolved: a new capture is required before evaluating the BTC scenario. ETF flow remains blocked. BTC remains `not_evaluable`; no ingestion, database write, scenario-state/probability change, deployment or merge occurred. The workflow annotations about Node.js 20 deprecation and the upcoming Ubuntu runner-image migration are maintenance notices, not failures of this run.
