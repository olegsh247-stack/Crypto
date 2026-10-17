# DXY source verification — 2026-10-17

## Decision

**No source from the reviewed list is currently approved as an automated, free canonical ICE US Dollar Index (DXY) feed. Do not create a new key yet.** DXY stays a blocked/optional input; this does not replace it with a different dollar index and does not change BTC runtime source priorities or scenario status.

The required cadence is daily for this series. A 15-minute polling loop would not create more frequent source observations and is unnecessary; check at most once per day after the source's daily session has closed, unless a provider contract documents a different publication schedule.

## Findings

| Candidate | Actual capability found | Access / limits | Decision |
|---|---|---|---|
| Yahoo Finance `DX-Y.NYB` | The public page identifies the instrument as the US Dollar Index / ICE Futures. | Yahoo's terms prohibit automated collection without express prior permission. The third-party `yfinance` project describes itself as unofficial and intended for personal use. A visible chart or accessible chart endpoint is not permission to automate or retain/redistribute data. | Manual visual reference only; not an automated source without explicit permission. |
| Alpha Vantage | Official docs describe `INDEX_DATA` and an index catalog, but the “Other Major Indices” data endpoint is marked **premium**. The reviewed docs do not establish that DXY is available on the free tier. | A free API key alone does not unlock a premium endpoint. | No key requested; not a qualifying free source based on current documentation. Revisit only if provider's catalog and plan explicitly confirm DXY on a usable free tier. |
| FXMacroData | Documented free data is USD macro announcements/calendar/catalogue/COT, not the ICE DXY market index. Its FX price/reference-rate endpoints are separate datasets. | FX history needs a paid Individual/Business key; the published plan starts at USD 50/month. | Not a DXY source. No key. |
| Live-Rates.com | Keyless `/rates` is limited to 3 requests/hour/IP. Instrument catalogue and historical endpoints require a key; docs describe roughly 170 FX, metals and crypto instruments, but do not verify an ICE DXY instrument. | Cannot prove DXY coverage from public docs without an authenticated instrument-list response. | Unverified, not approved. Do not create a key just to discover whether DXY exists; only revisit if a free/trial key is acceptable and DXY can be verified first. |
| FRED `DTWEXBGS` | Confirmed daily nominal broad US dollar index from the Federal Reserve, with a different currency basket and base (Jan 2006=100). It is not ICE DXY. | Public series/table is viewable; FRED API requires a key. Data notes say values can be revised and request source attribution. | Optional separately labelled broad-dollar context only; never map it to DXY or silently substitute it. |
| ICE | The index owner is the authoritative route for official DXY market-data terms and licensing. | No verified free, public automated feed or redistribution grant established in this review. | Only canonical route if an accessible licence/feed is later identified; defer paid access. |
| TradingView `TVC:DXY` | Chart can serve as a human visual cross-check. | Chart visibility does not establish a free supported API or automated collection rights. | Manual cross-check only. |

## Evidence links

- Yahoo Finance instrument page: https://finance.yahoo.com/quote/DX-Y.NYB/
- Yahoo Terms of Service, automated collection: https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html
- `yfinance` project documentation: https://github.com/ranaroussi/yfinance
- Alpha Vantage index data documentation: https://www.alphavantage.co/documentation/
- FXMacroData API quickstart: https://fxmacrodata.com/documentation/quickstart
- FXMacroData API reference and plan boundaries: https://fxmacrodata.com/documentation/reference
- Live-Rates API documentation: https://github.com/Live-Rates/live-rates.com
- FRED broad dollar index: https://fred.stlouisfed.org/series/DTWEXBGS
- ICE US Dollar Index product page: https://www.ice.com/products/194/US-Dollar-Index

## Data contract if a lawful source is later approved

- Instrument identity: ICE US Dollar Index (DXY); never alias `DTWEXBGS` as DXY.
- Frequency: daily; store the provider's session/candle date separately from retrieval timestamp.
- Required provenance: provider and endpoint, retrieval time in UTC, source observation/publication time when supplied, source row/period identity, units/index base, response hash, parser/method version, freshness decision and any revision/finality fields the provider actually supplies.
- Do not invent publication timestamps or finality. If source provides only a date, preserve date-only semantics.
- Freshness: latest expected completed business-day observation; holidays/weekends follow the provider calendar. Missing/older data is stale/blocked, not forward-filled as a new observation.
- Retain raw payload only after provider terms and retention rights are explicitly checked. Keep hashes and derived metadata even when raw retention is not permitted.
- Never calculate an “ICE DXY equivalent” from arbitrary FX pairs unless a separately specified and validated methodology is approved.

## Outcome

No credentials are required now. Next action is not more broad source searching: use manual Yahoo/TradingView references only, or approve a separately labelled FRED broad-dollar proxy if the product contract explicitly permits a non-DXY context factor. Automated DXY remains blocked pending a lawful source/plan that actually serves ICE DXY.
