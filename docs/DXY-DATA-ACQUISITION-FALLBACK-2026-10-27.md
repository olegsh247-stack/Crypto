# DXY data acquisition: source fallback decision — 2026-10-27

## Goal

Obtain usable USD index observations with an observation/session date, retrieval timestamp, freshness check, source provenance, and raw-response hash. Do not block the work on Yahoo Finance: try sources in sequence and move on immediately when an endpoint is unavailable, unstable, stale, or does not return machine-readable data.

## Source order for testing

1. **Yahoo Finance `DX-Y.NYB` chart endpoint** — first attempt for the market's commonly quoted ICE US Dollar Index. The web page is readable, but a direct chart API request was not verified in this environment; do not treat page scraping as proof that automated API capture works.
2. **exchangerate.dev `GET /v1/indices/dxy-reconstructed`** — next attempt, without waiting on Yahoo. This is a transparent six-currency formula reconstruction, not official ICE DXY. The response is documented to include value, methodology/weights, constituent rates, observation timestamps and source metadata. If direct API returns a complete, fresh response, retain it as a separately labelled reconstructed series.
3. **Another machine-readable market-data source** — continue to the next provider if both above fail. Test an actual endpoint and payload; do not stop at search snippets or a provider's marketing page.
4. **FRED `DTWEXBGS`** — usable as a distinct broad-dollar proxy if no DXY feed is obtainable. Never relabel it as DXY; it is a different index and should have its own metric/source identity.

RapidAPI and TickDB are not preferred until a specific API is shown to return DXY in a repeatable free tier. Historical CSV pages are fallback for backfill, not the first choice for recurring acquisition.

## Observed public data (not a successful API capture)

- A public market page reported the ICE DXY close as **101.99 for 2026-10-27**. This is a reported daily close, not an intraday quote.
- Yahoo Finance search results were inconsistent/stale across regional pages and dates. Therefore, Yahoo is not accepted as a sole source until direct API retrieval and freshness are tested.
- The exchangerate.dev public methodology page displayed an older reconstruction sample (101.835 dated 2026-10-06); this is not a current observation and must not be used as today's value.

## Execution limitation and next action

Direct HTTP attempts from the current execution environment to both Yahoo's chart endpoint and exchangerate.dev's DXY endpoint failed before an HTTP response because DNS resolution was unavailable. This is an environment/network failure, not evidence that either provider's endpoint is down. Continue with another provider or rerun the direct requests from the repository's permitted test runner; record HTTP status, retrieval time, raw body hash, provider observation time, and freshness outcome.

## Acceptance rules

- Keep provider observation/session time separate from retrieval time.
- A missing provider publication timestamp is acceptable for research use if the session date is present and the retrieval time/freshness rule is recorded.
- Reject missing, stale, malformed, partial, or non-numeric responses; do not silently fill forward.
- Keep official/market DXY and reconstructed DXY as separate source series. Never average conflicting providers.
- Research-only capture does not authorize changes to active source priority, production ingestion, scenario state, or production storage.
