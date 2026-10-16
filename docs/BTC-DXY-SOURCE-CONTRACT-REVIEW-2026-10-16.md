# BTC macro input: DXY source-contract review (2026-10-16)

## Decision

The project must not silently substitute the Federal Reserve's broad trade-weighted dollar index for ICE U.S. Dollar Index (DXY). They are different indices with different baskets, weighting schemes, and intended interpretations. The correct source depends on the canonical metric contract already used by the BTC input registry. This document records research only; it does not change that contract or any runtime source.

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

## Source-contract questions still open

1. Confirm the exact canonical metric identifier and intended index in the BTC registry (ICE DXY versus Fed broad dollar index).
2. If the intended metric is ICE DXY, establish an authorized data route, license/retention rights, daily close timestamp/time zone, holidays/missing-value rules, revision semantics, and reproducible historical coverage.
3. If the intended metric is the Fed broad index instead, treat that as an explicit metric/source-contract decision requiring review—not a silent fallback. Preserve series ID `DTWEXBGS`, base (Jan 2006=100), daily frequency, source attribution, release/observation timestamps and revision awareness.
4. Only after the contract is resolved should an offline fixture/source adapter be proposed. No live capture or source-registry change is authorized by this research.

## Guardrails

No API calls or live data captures, no credentials, no database writes, ingestion, source promotion, metric/formula change, scenario evaluation/state/probability changes, deployment, or PR merge were performed. BTC remains `not_evaluable`.

Related: [Plan 100](PLAN-100.md), [ETF issuer-source coverage matrix](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md), [Prompt 100 journal](PROMPT-100-JOURNAL.md).
