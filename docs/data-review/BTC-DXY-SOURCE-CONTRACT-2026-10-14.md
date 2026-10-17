# BTC DXY source contract review — 2026-10-14

**Decision: BLOCKED — no canonical DXY source is approved.**  
**Scope:** define the acceptance contract and accurately represent the unresolved source in the repository. This is not a live-data capture, a source-priority approval, or a scenario evaluation.

## 1. What the official source evidence establishes

ICE Data Indices identifies ICE as administrator of the ICE U.S. Dollar Index (DXY) and describes intraday and daily products. It lists delivery mechanisms including ICE Connect, ICE Consolidated History, ICE Consolidated Feed, ICE Data API and data files. The developer-catalog URL in the repository is product documentation; it is **not** a public market-data endpoint. A project-accessible endpoint, credentials, license and permitted use/redistribution have not been established.

Official references:
- [ICE Data Indices — Currency Indices](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices)
- [ICE Currency Indices product page](https://www.ice.com/fixed-income-data-services/index-solutions/currency-indices)
- [ICE methodology update notice](https://www.ice.com/publicdocs/equity_indices/notices/DXY_ICE_FX_Indices_Methodology_Updates_20210311.pdf)

ICE's 2021 methodology notice describes an index publication schedule that differs by weekday and a 5 PM Eastern Friday cutoff. Because that notice is dated, it is useful evidence that publication time is methodology/calendar-dependent, but it must not be assumed to be the current operational schedule without the current methodology supplied through the licensed product.

## 2. Canonical observation contract (not yet enabled)

When an approved ICE feed is actually available, a candidate DXY observation must preserve:

- `metric_id`: `macro.dxy`
- `source_id`: a specific approved ICE feed identifier, not `macro.primary`
- `unit`: `index` (dimensionless index level)
- `value_numeric`: the provider-supplied DXY index level, positive and finite
- `period_start`: the ICE index business date represented by the daily observation, not a timestamp fabricated from retrieval time
- `observed_at`: the actual provider timestamp of the final DXY index level disseminated for that index business day, converted to UTC without losing the original timezone/time convention in provenance
- `retrieved_at`: when our collector obtained the payload; kept separate from `observed_at`
- `source_updated_at`: only when the provider explicitly supplies it
- `source_url`: the exact licensed feed/API/file endpoint actually used, not the product-catalog page
- `source_row_key`: stable key based on provider identity plus index business date and observation type
- `source_payload_sha256`, `methodology`, and `methodology_version`: captured and versioned for auditability
- `revision`: provider revision/finalization semantics must be documented before accepting historical corrections

Do not substitute the futures contract's daily settlement for the DXY cash index level: ICE describes a separate settlement calculation for DX futures. Do not substitute FRED `DTWEXBGS`: the Federal Reserve identifies that as the Nominal Broad U.S. Dollar Index, a different basket and series. Do not use an unreviewed third-party chart/API as canonical simply because it is reachable.

## 3. Acceptance gates before changing source priority

1. Confirm the project can lawfully access and use the selected data product; record the actual product and permitted use.
2. Obtain a real, immutable sample response/file from the actual feed. Verify field names, value, timezone, source timestamp, index business date and exact endpoint.
3. Obtain the current methodology/calendar and define what “last disseminated level for the index business day” means for holidays and early/irregular sessions.
4. Define freshness against the index calendar rather than blindly treating weekends and holidays as missing or stale.
5. Establish revision/finalization policy and a deterministic logical row key; prove repeated captures are idempotent and corrections are distinguishable.
6. Keep the runtime readiness allowlist and metric registry blocked until the previous checks are reviewed and a deliberate source-priority change is committed.

## 4. Repository change made in this stage

- `macro.dxy.source_priority` is now empty instead of misleadingly listing the generic `macro.primary` source.
- `macro.ice_dxy_candidate` remains registered as a candidate only; its notes now distinguish product documentation from an actual feed and specify the required timestamp/date fields.
- The runtime readiness gate still has an empty DXY source/URL allowlist. Tests explicitly assert that the metric registry does not advertise a generic or unlicensed source as canonical and that a registered ICE candidate cannot bypass the gate.

No production database was accessed or changed. No ingestion, live DXY capture, source-priority promotion, scenario evaluation, probability change, scenario-state write or deployment occurred.

## 5. Next action

The remaining blocker is not another code change: it is access to an actual authorized DXY data product and a sample payload plus current publication methodology. Without that, do not invent an endpoint or create synthetic DXY observations. Continue in parallel with the ETF acceptance work already documented in the BTC source contract.
