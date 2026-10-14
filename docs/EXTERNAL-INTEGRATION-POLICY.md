# External Integration Policy

**Status:** mandatory for all new and existing external integrations  
**Applies to:** data sources, APIs, websites, SDKs, libraries, cloud/hosting/database services, auth, storage, CI/CD, and automation  
**Required before implementation, repair, or operational use.**

## 1. Required sequence

1. **Find and read official documentation first.** Start with the provider's official developer docs, API reference, access guide, terms/licensing, changelog/deprecation notices, and status page where relevant. Search results, examples, community posts, SDK code, and the page's visible data are secondary evidence—not a substitute for official documentation.
2. **Record the documentation review.** Capture official URLs, date reviewed, the exact documented product/endpoint/version, and the integration purpose in the relevant source registry or project decision note. If no official API/specification exists, state that plainly. Do not infer an API from an ordinary website.
3. **Establish the contract before coding.** Verify:
   - supported access method and endpoint/host;
   - auth, account/plan requirements, and required permissions;
   - terms of service, licensing, redistribution/storage limits, and attribution;
   - quotas, rate limits, request frequency, pagination, and backoff/retry guidance;
   - response format/schema, units, sign conventions, precision, identifiers, and error payloads;
   - timestamp meanings (event/observation/publication/retrieval), timezone, calendar, revisions and historical corrections;
   - freshness expectations, source lineage, availability/status, versioning and deprecation;
   - secret handling, data minimization, and security requirements;
   - access from the actual intended environment (local development, GitHub Actions, and/or VPS).
4. **Test safely and separately.** Start with read-only requests and sanitized fixtures. Test parser behavior on representative documented payloads, including missing fields, explicit zero, malformed data, changed schema, stale data, rate limits, and access errors. Never write to production as part of source discovery.
5. **Gate readiness.** Report each separately: (a) fixture/unit tests pass, (b) live provider access verified, (c) runtime/source registration verified, (d) end-to-end acceptance verified. Passing one does not imply the others.
6. **Document the decision and only then proceed.** Record blockers and their owners/approval needs. Keep the metric/provider disabled or blocked if an unknown affects correctness, authorization, or safety.

## 2. HTTP errors and source changes

- Treat 401/403 as an access/authentication/policy blocker until official documentation or provider support clarifies the intended access path.
- Do not evade access controls, impersonate a browser, rotate IPs/identities, use proxies, or build anti-bot workarounds unless the provider explicitly documents and authorizes the method.
- Treat 404 as a possible endpoint/version change and verify against official docs before changing URLs.
- Respect 429 and documented quotas; do not retry aggressively. Use documented retry/backoff rules for transient failures.
- Treat 5xx/timeouts as availability failures; preserve diagnostics and use bounded retries.
- Do not silently change to a mirror or a similarly named metric. Compare definitions, coverage, methodology, units, timestamp semantics, revisions and licensing; obtain project approval before changing the canonical source.
- Preserve raw payloads/hashes and retrieval metadata when allowed, without misrepresenting retrieval time as publication or observation time.

## 3. Evidence required in the repository

For each external integration, retain a durable record (in the source registry, integration note, or data contract) containing:

- provider/product and intended metric/capability;
- official documentation and terms links, review date, and version/access plan;
- endpoint and access/auth expectations;
- schema/units/time semantics/freshness/error behavior;
- tested environments and the date/result of live access checks;
- source priority, fallback policy, known limitations and unresolved blockers;
- validation tests and readiness status.

If official documentation is absent or ambiguous, contact the provider or seek project-owner approval for a constrained research-only experiment. Do not promote undocumented behavior to a canonical production dependency.

## 4. Farside BTC ETF source review (2026-10-14)

Official source pages reviewed:

- [Bitcoin ETF Flow – All Data](https://farside.co.uk/bitcoin-etf-flow-all-data/)
- [Bitcoin ETF Flow](https://farside.co.uk/btc/)
- [Farside team/contact page](https://farside.co.uk/team/)
- [Farside Privacy Policy](https://farside.co.uk/privacy-policy/)

The published all-data page describes the table as automatically generated in real time and includes a disclaimer that Farside is not liable for errors or inaccuracies. It presents a dated table in US$ millions with fund columns and a Total column; dashes appear in cells and must not be coerced to numeric zero. The pages and privacy notice reviewed do **not** provide a public API specification, documented machine-access endpoint, per-row publication timestamp contract, or explicit scraping/access policy. The privacy notice describes personal-data processing; it is not a license or API usage agreement for ETF-flow data. No separate public data-licensing/terms document was found in the reviewed official navigation. Therefore, do not assume a supported API or infer source publication time from HTTP retrieval time.

GitHub Actions read-only capture on 2026-10-14 returned HTTP 403 for both the legacy page route and the all-data route. Search/index access to a rendered page does not establish that automated retrieval is authorized or available. Do not bypass the 403 or designate TFTC as canonical just because its endpoint is accessible. ETF flow remains blocked for scenario use until Farside's intended machine-access method and relevant usage terms are clarified, the source can be accessed through an authorized route, and parser/schema/freshness/runtime acceptance are verified. If necessary, use the provider's contact channel to ask for an approved data-access method.

This review is not permission to activate ETF data or write to production.

## 5. Exchange spot-price candidates — initial documentation review (2026-10-14)

Reviewed official documentation:
- Binance Spot REST and public market-data access: https://developers.binance.com/en/docs/products/spot/rest-api ; https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md
- OKX API v5: https://app.okx.com/docs-v5/en
- Bybit V5 Get Tickers: https://bybit-exchange.github.io/docs/v5/market/tickers

Initial documented facts:
- Binance offers public market-data-only endpoints, including ticker, book ticker, trades and klines. Timestamp fields are generally milliseconds by default; each endpoint's exact event/aggregation semantics must be checked separately.
- OKX public market-data endpoints do not require authentication. OKX documents independent market-data caches and warns that a later response can contain older data than a previous response; capture ordering and freshness must be validated.
- Bybit V5 `GET /v5/market/tickers` returns last price and best bid/ask and a response-level `time`; the caller must explicitly select `category=spot` rather than derivatives.
- `BTCUSDT` is quoted in USDT, not USD. Do not store it as `USD/BTC` without a documented conversion/peg policy. Do not mix last trade, midpoint, candle close, index and mark prices as one metric.

Status: documentation-only screening, not integration approval. No live requests, credentials, writes or source activation performed. Before implementation, the chosen endpoint still requires a full contract review covering exact schema/timestamps, quotas and retry policy, terms/licensing/retention/redistribution, access from intended runtime, sanitized fixtures, and a separately reported live read-only test. Until then, all three remain candidates only; do not add them to source priority or use them as silent fallback.



## 6. Exchange endpoint comparison — BTC spot-price candidates (2026-10-14)

This is a documentation-level candidate review, not permission to activate any source.

Official endpoint references reviewed:
- Binance Spot REST overview and endpoint reference: https://developers.binance.com/en/docs/products/spot/rest-api ; https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md
- OKX API v5: https://app.okx.com/docs-v5/en
- Bybit V5 Kline and Tickers: https://bybit-exchange.github.io/docs/v5/market/kline ; https://bybit-exchange.github.io/docs/v5/market/tickers
- Kraken OHLC and Ticker: https://docs.kraken.com/api/docs/rest-api/get-ohlc-data ; https://docs.kraken.com/api/docs/rest-api/get-ticker-information

### Endpoint distinctions

- **Kraken OHLC, `XBTUSD`, interval 60:** candidate for a completed hourly close in USD. Treat the candle's timestamp as its interval start, exclude the still-open candle, and verify response boundaries and rate limits against the official reference.
- **Kraken Ticker, `XBTUSD`:** exposes last-trade and bid/ask snapshot fields, but the reviewed response schema does not supply a per-trade/per-quote timestamp. Capture time is not a substitute for source event time.
- **Binance Spot klines, `BTCUSDT`, interval 1h:** timestamped OHLC bars, with response time fields in milliseconds by default. Public market-data access is documented. The quote currency is USDT, not USD.
- **OKX `GET /api/v5/market/candles?instId=BTC-USDT&bar=1Hutc`:** candle timestamp is the bar opening time and `confirm=1` indicates completion. Public market data does not require auth, but OKX warns independent caches may return older data on later requests; validate freshness/order.
- **Bybit `GET /v5/market/kline?category=spot&symbol=BTCUSDT&interval=60`:** OHLC bars; explicitly select spot. The bar timestamp is not itself the close event time. The ticker endpoint's response-level `time` must not be mislabeled as the last trade timestamp.

### Proposed choice for the first BTC scenario

Prefer a completed hourly Kraken `XBTUSD` candle close as the canonical *candidate* for a reproducible USD-quoted observation. Binance, OKX and Bybit completed-hour candles can serve as independent divergence/staleness diagnostics, clearly labeled USDT-quoted. Do not silently convert USDT to USD, mix tickers with candle closes, or switch source automatically. Kraken Ticker remains a separate current-snapshot diagnostic unless its missing source-event timestamp can be addressed by an explicit, accepted freshness contract.

This proposal does **not** change `market.spot_price`, source priority, the live collector, or scenario readiness. The current registry's 15-minute cadence is not a fixed user requirement; an hourly interval may be considered, but the registry is not to be changed until the metric contract is approved.

### Remaining gates before implementation

1. Confirm exact payload schema, interval boundaries, candle completion, endpoint-specific quotas and retry/backoff.
2. Review terms and permitted storage/retention/redistribution for the intended use; endpoint documentation alone does not establish a data license.
3. Verify access from the intended runtime (local/GitHub Actions/VPS) without bypassing controls.
4. Add sanitized fixture tests for valid, missing, malformed, stale, incomplete-bar and provider-error cases.
5. Run and report a separate read-only live access check; keep it distinct from fixture tests and runtime registration.
6. Reconcile price divergence and freshness rules before considering any source as canonical or fallback.

No live provider calls, credentials, production writes, source activation, registry change, or scenario state change were performed during this review.
