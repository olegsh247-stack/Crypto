# BTC input contract: DXY daily close (review-only)

**Review date:** 2026-10-17  
**Metric:** macro.dxy — U.S. Dollar Index (DXY)  
**Candidate ticker:** DX-Y.NYB  
**Unit:** index_points  
**Registry maximum age:** 48 hours  
**Status:** contract specified; **source access blocked; not accepted for scenario evaluation or canonical ingestion**

## Value definition

- Use the latest **completed daily session's Close** for the U.S. Dollar Index.
- Do not use Adj Close, regularMarketPrice, an intraday quote, or a different broad USD index as a substitute.
- Store the provider's session date (the date label of the daily candle) separately from UTC timestamps.
- Preserve the raw provider candle timestamp and exchange timezone if a permitted source returns them. Interpret the session date in the provider's exchange timezone, not by truncating the UTC ISO timestamp.
- A daily candle timestamp can label the session rather than state when the close actually occurred. It must not be relabeled as observed_at or publication time without documentation.
- Keep observed_at, source_published_at (if supplied), and retrieved_at distinct. If the actual close/publication time cannot be established, observed_at remains unknown and the input stays blocked.

## Freshness contract

The metric registry currently sets a maximum age of **48 hours**. This is a limit, not permission to pretend the daily candle label is the actual close timestamp.

A candidate may pass freshness only if one of the following is approved and testable:
1. The provider supplies a trustworthy close/observation timestamp, and age is computed from that timestamp; or
2. The project explicitly approves a deterministic session-age policy based on the provider's exchange calendar/timezone, completed-session status, and publication delay.

Until then, freshness is **UNVERIFIABLE / BLOCKED**. Weekend/holiday carry-forward is not a new observation and does not reset age.

## Yahoo Finance access and reuse limits

Yahoo Finance identifies DX-Y.NYB as the U.S. Dollar Index / ICE Futures instrument. Its general Terms of Service prohibit automated collection from Yahoo services without express prior permission. The chart endpoint query1.finance.yahoo.com/v8/finance/chart/... is undocumented and is not treated as an approved public API.

Consequences:
- Automated requests to the undocumented chart endpoint are disabled in the BTC source-staging script.
- The old capture is historical review evidence only; it is not a permission grant and must not be refreshed or promoted.
- Do not bypass blocks, rotate identities, or use browser automation to circumvent access controls.
- Do not commit or redistribute Yahoo raw payloads as a durable public data archive absent rights review.
- Yahoo remains a blocked candidate unless express permission is obtained or a licensed/official DXY data feed is selected.

Sources:
- Yahoo Finance DXY historical data: https://finance.yahoo.com/quote/DX-Y.NYB/history/
- Yahoo Terms of Service: https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html

## BTC scenario input-check behavior

DXY is included in the BTC input review as a **required-but-blocked macro candidate**. Report its contract state, latest known session date, timestamp provenance, access permission, and freshness result. If there is no newly permitted capture with verifiable observation time, record BLOCKED; do not substitute zero, carry forward silently, use a broad trade-weighted USD index, or change the scenario state/probability.

## Acceptance checklist

- [ ] A permitted, stable source endpoint is selected and registered.
- [ ] The value is the completed daily Close, with explicit unit.
- [ ] Session date and exchange timezone are preserved.
- [ ] Actual observation/close time and publication/update time are separately represented, or an approved session-age rule is tested.
- [ ] 48-hour freshness policy is enforceable, including weekends and market holidays.
- [ ] Retrieval time, response hash and source terms/retention rights are recorded.
- [ ] Conflicting values are reconciled against an independently permitted source.
- [ ] Only after all gates pass may macro.dxy be considered in the offline BTC scenario calculation.
