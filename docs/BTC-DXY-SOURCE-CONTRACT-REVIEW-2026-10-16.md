# BTC macro context: DXY source-contract clarification (2026-10-16)

## Current project decision

**DXY is optional context, not a BTC readiness gate.** The canonical decision is recorded in [BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md](BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md). This note supplements that decision and must not be read as reopening the DXY blocker. ICE DXY and the Fed broad index are different metrics; do not silently substitute one for the other.

## ICE U.S. Dollar Index (DXY)

ICE identifies DXY as its administered, fixed-weight six-currency index. The weights are EUR 57.6%, JPY 13.6%, GBP 11.9%, CAD 9.1%, SEK 4.2%, and CHF 3.6%. ICE lists intraday and daily frequencies, historical availability since 1996, and delivery through ICE Connect, Consolidated History/Feed, Data API, and Data Files. This demonstrates that an official DXY series exists, but does not by itself establish free public access, an acceptable license for the project's retention, or a ready-to-use endpoint.

Sources:
- [ICE Data Indices — Currency Indices](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices)
- [ICE FX Indices methodology PDF](https://www.theice.com/publicdocs/data/ICE_FX_Indexes_Methodology.pdf)

## Federal Reserve broad dollar index — alternative, not equivalent

The Federal Reserve publishes a daily nominal broad trade-weighted dollar index, FRED/ALFRED series `DTWEXBGS`, with index base January 2006 = 100. The broad index uses a wider set of trading-partner currencies (26 economies in the documented methodology) and weights based on bilateral goods and services trade; weights and historical values may be revised. This is a legitimate official macro indicator, but it is not ICE DXY and must not be relabelled as DXY.

Sources:
- [FRED/ALFRED DTWEXBGS](https://alfred.stlouisfed.org/series?seid=DTWEXBGS)
- [Federal Reserve index methodology](https://www.federalreserve.gov/econres/notes/feds-notes/revisions-to-the-federal-reserve-dollar-indexes-20190115.html)
- [Federal Reserve current H.10 release](https://www.federalreserve.gov/releases/h10/current/)

## Allowed use in the first BTC scenario

- Yahoo Finance `DX-Y.NYB` may be used as a manual display/research reference only; do not automate collection or redistribute its data without required permission.
- FRED `DTWEXBGS` may be used only under its own explicit name and date/freshness rules; never write it into `macro.dxy` or splice it into a DXY series.
- If neither contextual series is available, omit DXY context and continue. Do not block readiness solely on DXY.
- No further DXY source investigation is required for the first BTC scenario. ETF publication/revision/finality remains a separate gate.

## Guardrails

No API calls or live data captures, no credentials, no database writes, ingestion, source promotion, metric/formula change, scenario evaluation/state/probability changes, deployment, or PR merge were performed. DXY remains optional/non-blocking; BTC may still be `not_evaluable` because of other gates, especially ETF evidence stability and rights.

Related: [Plan 100](PLAN-100.md), [ETF issuer-source coverage matrix](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md), [Prompt 100 journal](PROMPT-100-JOURNAL.md).
