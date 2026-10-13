# BTC DXY Candidate Review — 2026-10-13

**Decision: third-party candidate adapter added; canonical acceptance remains blocked.**
**Scope:** Read-only candidate capture only. No production database access or writes, no registry changes, no scenario-state changes.

## Source screening

The metric registry requires `macro.dxy` in index units, daily frequency, 48-hour freshness, with current canonical source priority `macro.primary`. The source registry describes `macro.primary` broadly as US Treasury / Federal Reserve / BLS, which does not identify an authoritative ICE DXY daily-close endpoint.

ICE identifies the ICE U.S. Dollar Index as an ICE-administered index, with daily and intraday data available through commercial delivery products (ICE Connect, ICE Consolidated History/Feed, ICE Data API and ICE Data Files). The reviewed public ICE product page does not establish an unauthenticated public API feed. References:
- ICE DXY product information: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices
- Yahoo Finance public history page labels `DX-Y.NYB` as the ICE US Dollar Index: https://finance.yahoo.com/quote/DX-Y.NYB/history/

Yahoo Finance is therefore used only as an **unapproved third-party candidate** to test whether a traceable daily series is technically available. It is not represented as a licensed canonical source, and it is not added to the metric source priority.

## Candidate adapter

- Script: `scripts/capture-btc-dxy-candidate.mjs`
- Tests: `scripts/capture-btc-dxy-candidate.test.mjs`
- Endpoint: Yahoo Finance chart API for `DX-Y.NYB`, daily interval, one-month range.
- The capture retains the raw response, retrieval time, HTTP status and SHA-256. It validates the exact ticker, timestamp/close array alignment, positive finite closes, duplicate session dates and future timestamps.
- The current New York calendar date is excluded conservatively so an in-progress daily bar is not mistaken for a completed close.
- Candidate calculation: latest completed close divided by the close five observed trading sessions earlier, minus one. Weekends and exchange holidays are not filled or synthesized.
- The output explicitly reports `CANDIDATE_ONLY` and `BLOCKED_SOURCE_CONTRACT_REVIEW`. The adapter does not claim that the Yahoo bar timestamp is the exact ICE close/publication timestamp.

The read-only staging workflow captures this artifact alongside the existing BTC candidates. A failed or unavailable external endpoint is retained as a blocked result; it does not make the BTC scenario evaluable.

## Acceptance blockers

1. No reviewed license/terms determination that authorizes this third-party feed for the project's intended use.
2. The captured chart response does not establish the exact ICE daily close/publication timestamp needed to enforce the metric's 48-hour freshness contract.
3. Canonical metric priority remains `macro.primary`; no source registry or metric registry changes have been made.
4. Scenario readiness requires every other input as well; a DXY candidate cannot independently unlock evaluation.

**Decision:** use the Yahoo result for source feasibility and calculation review only. Do not ingest it as an accepted observation or use it in the scenario rule until source authorization and timestamp semantics are explicitly accepted. If those cannot be established, retain DXY as a blocker or change the methodology only through a separately reviewed decision.
