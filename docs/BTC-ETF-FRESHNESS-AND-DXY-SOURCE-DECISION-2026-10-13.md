# BTC ETF Freshness and DXY Source Decision Record — 2026-10-13

**Scope:** BTC Product Contour v1 inputs only.  
**Status:** design decision record; no canonical registry changes authorized.  
**Mode:** evidence review only. No database connection, ingestion, or product-state writes.

## Executive decision

Two source-contract blockers can be narrowed, but neither is approved for ingestion by this document:

1. **ETF flows:** do not infer `observed_at` from page retrieval time. Farside's row date identifies a session, not a verified publication timestamp. The current 36-hour freshness rule cannot be proven from the captured page alone. Adopt neither an invented timestamp nor a silent fallback.
2. **DXY:** ICE identifies the ICE U.S. Dollar Index (DXY/USDX) as its proprietary benchmark and exposes data through ICE's index/data channels. No free, stable, documented canonical endpoint has been established for this repository. Keep `macro.dxy` blocked until a feed and permitted-use terms are verified.

No metric registry, source priority, monitoring state, scenario state, score, probability, or published snapshot is changed. BTC remains `not_evaluable`.

## 1. ETF flow: separate session date, observation time, and retrieval time

### Evidence currently available

- Farside BTC ETF table: https://farside.co.uk/btc/
- Latest captured completed session: **2026-10-12**, total **−65.4 USD million**.
- TFTC JSON cross-check: https://www.tftc.io/bitcoin-etf-flows/data.json — **−65.401 USD million** for 2026-10-12, matching Farside's one-decimal display precision. TFTC is a corroborating, unapproved mirror and is not promoted to canonical source priority.
- The Farside row for 2026-10-13 has dashes and a displayed `0.0`; it is not evidence of a confirmed zero flow.
- The latest capture proves when this repository retrieved the page, not when Farside published or last updated the row.

### Required field semantics

Preserve these concepts independently:

| Field | Meaning | Rule |
|---|---|---|
| `session_date` | US trading session represented by the row | Required; parse as a calendar date, not a UTC timestamp |
| `observed_at` | Actual source-declared observation/publication time, if exposed | Null if the source does not establish it; never fill from `retrieved_at` |
| `retrieved_at` | When our capture obtained the page/response | Set by the capture; not a substitute for observation time |
| `source_row_status` | Reported, placeholder/unreported, or invalid | Dashes/blank placeholders must not be coerced to numeric zero |
| `raw_body_sha256` | Identity of the captured source body | Retain with the immutable capture artifact |

### Freshness decision

The existing metric contract says `freshness_window: 36h`, but the available Farside capture does not establish a defensible publication timestamp. Therefore **do not mark this candidate fresh solely because it was retrieved recently or because its session date is recent**.

Two acceptable paths remain for a future explicit contract decision:

- **Preferred if the source exposes it:** use a source-declared update/publication timestamp, retain the session date separately, and evaluate the existing 36-hour rule against that timestamp.
- **If no publication timestamp exists:** change the metric's freshness contract explicitly from elapsed-hour freshness to trading-session lag, with a documented US market calendar, holiday handling, latest expected completed session, and revision policy. This is a metric-contract change and must be reviewed across registry, adapter, validation, monitoring, and acceptance tests before use.

Until one path is supported by evidence and reviewed, classification remains `HOLD_OBSERVATION_TIME_FRESHNESS_UNRESOLVED`. Do not write an observation.

## 2. DXY: distinguish the exact ICE benchmark from broad USD indices

### Evidence and source options

- ICE's official currency-index catalog identifies **ICE U.S. Dollar Index / DXY** as a six-currency benchmark and lists intraday, daily, delayed, end-of-day, and historical data delivered through ICE channels: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices
- ICE's index solutions page identifies the index symbol as **DXY**: https://www.ice.com/fixed-income-data-services/index-solutions/currency-indices
- The Federal Reserve's FRED series **DTWEXBGS** is the *Nominal Broad U.S. Dollar Index*, a daily trade-weighted basket with its own composition and base: https://fred.stlouisfed.org/series/DTWEXBGS

### Decision

- **Do not** map FRED `DTWEXBGS` or any other broad trade-weighted USD measure into `macro.dxy`. They are different indices, not interchangeable values.
- **Do not** select an undocumented retail chart endpoint or unofficial mirror as canonical solely because it is reachable.
- Keep `macro.dxy` blocked until an exact DXY source has a stable endpoint, documented field/unit, observation-time or close convention, revision behavior, access reliability, and confirmed permitted-use terms.
- If the product later decides that the broad Fed index is more suitable than licensed DXY, propose a **separate metric ID** with its own definition and source contract; do not silently rename or repurpose `macro.dxy`.

Current classification remains `BLOCKED_NO_CANONICAL_SOURCE`.

## 3. Effect on the BTC candidate dry run

| Candidate | Decision after this review |
|---|---|
| Kraken spot price | Hold: target-runtime `market.kraken` registration/adapter still requires fresh read-only verification |
| Mempool hashrate | Hold: UTC-day bucket semantics verified; target-runtime source verification still required |
| Fee/subsidy ratio | Hold: candidate calculation reproducible; canonical contract acceptance still required |
| ETF net flow | Hold: publication/observation-time and freshness contract unresolved |
| DXY | Blocked: exact canonical feed and permitted-use terms not established |

**No inserts authorized.** The last known database audit is from 2026-10-12 18:20 UTC; it is not a fresh read of the target runtime. This record does not claim that a live database audit was performed.

## 4. Next gates

1. When the actual target runtime is available, run a read-only audit of the live source registry, adapters, metric observations, logical-key duplicates, and freshness state. Do not use the historical snapshot as current state.
2. Verify `market.kraken` and `network.primary` against that runtime without writes.
3. Obtain source evidence for ETF publication/update time; otherwise prepare an explicit trading-session-lag contract change for review.
4. Obtain an exact DXY feed and verify its permitted use, or keep DXY blocked. Treat a Fed broad USD index only as a separate metric proposal.
5. Accept the completed-UTC-day fee/subsidy contract across the metric, source, monitoring, and validation documentation.
6. Re-run the staging dry run. Any unresolved gate means no ingestion review and no scenario evaluation.

## References

- [ICE U.S. Dollar Index — official data catalog](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices)
- [ICE Currency Indices](https://www.ice.com/fixed-income-data-services/index-solutions/currency-indices)
- [Federal Reserve broad USD index DTWEXBGS](https://fred.stlouisfed.org/series/DTWEXBGS)
- [Farside Bitcoin ETF flows](https://farside.co.uk/btc/)
- [TFTC public ETF-flow JSON candidate](https://www.tftc.io/bitcoin-etf-flows/data.json)
- [BTC Source Acceptance Matrix](BTC-SOURCE-ACCEPTANCE-MATRIX-2026-10-13.md)
- [BTC Candidate Staging Dry Run](data-review/BTC-CANDIDATE-STAGING-DRY-RUN-2026-10-13.json)

## 2026-10-14 — official DXY rights and delivery-path check

A further check of ICE's own published materials supports the existing block rather than identifying a free canonical API:

- ICE's official [DXY data catalog](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices) lists intraday, daily, delayed, end-of-day and historical products, delivered through ICE data channels; it does not document a public anonymous endpoint suitable for this repository.
- ICE's [U.S. Dollar Index futures page](https://www.ice.com/products/194/US-Dollar-Index-USDX-Futures?cat=204) states that the index formulation, values, weightings and methods are proprietary and that use is prohibited without ICE's express written consent.
- ICE's [data licensing overview](https://www.ice.com/fixed-income-data-services/data-and-analytics/proprietary-data) describes subscriber/vendor licensing and approval paths for use or redistribution.

**Decision remains `BLOCKED_NO_CANONICAL_SOURCE`.** This is not a claim that every possible personal/internal use requires the same commercial subscription; it means the repository has not established an exact accessible feed and permitted-use basis for this intended automated use. Do not scrape a retail chart or use an unofficial endpoint as a substitute. The viable next path is either a documented ICE-authorized provider/feed with terms confirmed for this use, or a separately reviewed replacement metric with its own ID and contract. `DTWEXBGS` remains a different broad USD index, not DXY.

This research changes no source registry, metric registry, observation, scenario, monitoring state or other runtime data.

## 2026-10-14 — current Farside completeness check

A fresh public-page review on 2026-10-14 shows the 2026-10-13 row with a displayed total of **+109.8 USD million**, but the IBIT column is a dash while other fund columns have values. This is not equivalent to a fully reported daily total: the missing major-fund field means the day's displayed aggregate may be partial or provisional. Do not accept the +109.8 value as a complete daily ETF observation until Farside confirms that the row is finalized or all constituent fields are complete. The page's retrieval date is not a source-declared publication timestamp, so it still does not satisfy the existing 36-hour freshness rule on its own.

Classification: `HOLD_INCOMPLETE_SESSION_ROW_AND_OBSERVATION_TIME_UNRESOLVED`. Preserve the row as source-review evidence only; do not substitute zero for the dash, infer `observed_at` from retrieval time, or fall back to TFTC as canonical.
