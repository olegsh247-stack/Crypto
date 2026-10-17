# PROMPT — Полный аудит источников данных Crypto и единого места настройки

Дата подготовки: 2026-10-17
Репозиторий: https://github.com/olegsh247-stack/Crypto
Назначение: самостоятельный промпт для полного аудита. Наличие этого файла не означает, что аудит уже завершён.

## Цель

Работай как ведущий инженер по данным и архитектор интеграций. Изучи фактический код репозитория и ответь:
1. Какие источники используются или рассматриваются? Для каждого — стабильный ID, метрики, блоки исследования, точные файлы/функции, тип использования, доступ, статус и ограничения.
2. Где источник реально используется: получение → нормализация → реестр/seed/БД → API/расчёты → research blocks → monitoring/evidence/UI? Отличай runtime от staging, cross-check, docs-only, deprecated и placeholder.
3. Можно ли вынести изменяемые настройки источников в единый каталог, чтобы менять URL, provider, symbol, credentials reference, timeout, freshness, priority и fallback без поиска строк по всему проекту? Предложи конкретный дизайн и безопасный план миграции.

## Ограничения

- Сначала только inspect/read-only аудит. Не менять код, registry, seed, БД, сценарии, scores/probabilities, workflow, секреты, deployment или PR state.
- Никаких production capture, production DB writes, ingestion или scenario evaluation/state changes.
- Не выводить значения секретов и ключей; указывать только имя переменной/секрета и место использования.
- HTTP 200 не означает, что источник принят. Проверить официальную документацию, Terms/licence, автоматизированный сбор, архивирование/redistribution, schema, units, timestamps, timezone, freshness, row identity, duplicates, revision/finality и историю.
- Различать source observation/event time, trading/session date, provider publication/update time и retrieval time. Не подменять observed_at временем получения.
- Не смешивать USD и USDT. Не подменять ICE DXY широким индексом доллара ФРС.
- Неизвестное отмечать UNKNOWN / NEEDS VERIFICATION, не додумывать.
- Не записывать запланированные проверки в Plan 100 или journal как завершённые. Подтверждённые существенные результаты записывать в docs/PLAN-100.md и docs/PROMPT-100-JOURNAL.md.

## Обязательная область поиска

Проверь весь репозиторий: data/CryptoDataModel/registry/metric-registry.json; data/CryptoDataModel/registry/source-registry.json; infrastructure/postgres/seed-v1.sql и migrations; scripts/; все .github/workflows/; API/backend/jobs/scheduler/shared libraries; research engine/calculations/scoring/scenario code; web/UI/dashboard/monitoring/evidence; docs/PLAN-100.md, docs/PROMPT-100-JOURNAL.md, source acceptance matrices, ETF matrices, contracts и audits; tests/fixtures/mocks; env templates, Docker/VPS files. Найди все URLs, endpoints, ticker/symbols, provider IDs, secrets names, environment variables, hard-coded fallbacks и provider-specific parsers.

Трассируй вызовы, а не только совпадения строк. Для каждого вывода укажи точные repository paths/line ranges и external documentation. Проверь расхождения между registry, seed, runtime, docs и tests.

## Известные источники и кандидаты — перепроверь, список не считается полным

### BTC capture / cross-check
- Kraken public Trades: https://api.kraken.com/0/public/Trades?pair=XBTUSD; source ID market.kraken; кандидат канонического BTC/USD spot.
- Binance BTCUSDT: https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=1000.
- Binance market-data-only: https://data-api.binance.vision/api/v3/trades?symbol=BTCUSDT&limit=1000.
- OKX BTC-USDT: https://www.okx.com/api/v5/market/trades?instId=BTC-USDT&limit=500.
- Bybit BTCUSDT: https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=BTCUSDT&limit=1000.
- Mempool.space hashrate: https://mempool.space/api/v1/mining/hashrate/1w; block fees: https://mempool.space/api/v1/mining/blocks/fees/1w; also REST/WebSocket and Lightning API.
- CryptoETF.today MCP: https://mcp.cryptoetf.today/api/mcp — cross-check only, not canonical ETF flow.
- Farside: https://farside.co.uk/btc/ and https://farside.co.uk/bitcoin-etf-flow-all-data/.
- TFTC JSON: https://www.tftc.io/bitcoin-etf-flows/data.json.
- SoSoValue: https://openapi.sosovalue.com/openapi/v1/etfs/summary-history?symbol=BTC&country_code=US&limit=300; secret name SOSOVALUE_API_KEY. Cross-check candidate only until live response, access terms, date mapping, history, publication/finality semantics and reconciliation pass.
- Yahoo DXY chart: https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=5d&interval=1d; automation currently blocked pending terms/access review.
- ICE DXY product candidate: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices; actual feed/access/licence unconfirmed.

### Source IDs found in registry — trace actual use
- protocol.primary — Bitcoin Developer Reference
- network.primary — Mempool.space
- market.kraken — Kraken
- market.primary — generic market-data adapter/provider placeholder
- institutional.primary — Farside ETF flows
- institutional.tftc — TFTC candidate
- institutional.sosovalue — SoSoValue candidate
- analytics — Glassnode
- lightning.primary — Mempool.space Lightning
- macro.primary — generic US Treasury/Federal Reserve/BLS placeholder
- market.binance, market.bybit, market.okx, market.mexc — market-data candidates/providers
- macro.ice_dxy_candidate — ICE DXY candidate
- macro.yahoo_finance_candidate — Yahoo DXY candidate
Registry IDs alone do not prove live integration.

### DXY candidates to investigate
- FXMacroData: user reports some no-key/free USD data and 90-day history. Verify whether actual ICE DXY is exposed; generic USD macro/forex series are not automatically DXY.
- Alpha Vantage: key required. Verify exact DXY symbol/catalogue, historical daily values, free-tier limits, terms and close/session timestamp semantics.
- Live-Rates.com: user reports keyless /rates limited to 3 requests/hour/IP. Verify DXY instrument availability and whether no-key response contains usable timestamp, units and session date; check whether historical endpoints require a key.
- FRED DTWEXBGS: official Nominal Broad U.S. Dollar Index, NOT ICE DXY. Document only as a distinct metric/alternative; never silently substitute it for macro.dxy.
- Investing.com / investpy: unofficial scraping, no documented public API. Check terms, maintenance and access risk; do not adopt scraping just because a one-off request works.
- Yahoo Finance DX-Y.NYB: blocked pending permission and timestamp-contract review.
- ICE official DXY: index administrator; product documentation is not proof of a public API or redistribution rights.
For each DXY candidate, decide ACCEPTABLE CANDIDATE, CROSS-CHECK ONLY, BLOCKED, or NOT THE SAME METRIC. Do not change source priority in this audit.

## Required deliverables

### A. Master source inventory
One row per provider/endpoint, not just per brand. Include: provider/source ID; metrics/units/assets; canonical research block IDs and titles; usage type (runtime canonical, runtime noncanonical, staging, cross-check, manual research, docs-only, deprecated, placeholder); exact call-site file/function/workflow/API route; URL/auth method (secret name only); observation-time semantics/timezone/session date/retrieval time; freshness/failure/fallback; row identity/deduplication/revisions/finality/provenance hash; terms/licence/automation/archive constraints; current status and missing evidence.

### B. Block-to-source matrix
For every research block, list metrics, source candidates and actual sources. Mark canonical vs fallback vs corroboration, missing inputs, duplicates and the code that maps metrics to blocks. Use the real canonical block titles from repository; do not guess.

### C. Data-path diagram
Trace provider/endpoint → adapter/fetch → raw capture → parser/normalizer → candidate/validation → registry/seed → storage/API → calculation/scenario → monitoring/evidence/UI. Label confirmed edges vs intended/documented edges.

### D. Central configuration recommendation
Answer directly whether sources can be configured centrally. Prefer a declarative source catalogue, but do not create one giant config that contains executable parsing logic. Consider:
- source-catalog.yaml/json: stable provider ID, endpoint, metric IDs, units, auth method, enabled status, role canonical/cross-check, freshness, timezone/date semantics, docs/terms links, rate limits, retention/reuse policy and config version.
- Environment/secret store: credentials only; never commit secret values or put them in the catalogue.
- Typed adapter registry: provider-specific auth/parsing stays in code; configuration selects a stable adapter ID.
- Explicit acceptance registry: adding a URL must not automatically promote a candidate to canonical source priority.
- Shared timeout/retry/rate-limit policies with provider overrides.
- Provenance contract: raw hash, source ID/URL, observed_at, session date, provider update/publication time, retrieved_at, methodology version, row key, revision/finality and freshness result.
- Clean parity with PostgreSQL seed/migrations/API contracts; identify duplicated conflicting definitions.
- Tests for config schema, registry-seed parity, missing secrets, source rejection, failure handling, duplicate/revision rules and deterministic replay.
Explain what belongs in config vs code vs secrets vs database, plus security and operational trade-offs.

### E. Migration plan
Give small reviewable steps, likely files, tests, rollback and acceptance criteria. Inventory first; do not implement migration as part of audit. Keep current behavior unchanged until each step passes.

### F. Decision summary
Report source counts by status/use type; blockers to BTC evaluable; evidence-based DXY ranking; feasibility and smallest safe first step for central configuration; remaining unknowns requiring legal/manual confirmation.

## Acceptance criteria

1. Every registry source ID and every external provider URL found in code/config/workflows/docs is reconciled into the inventory.
2. Every canonical metric maps to its actual research block(s), unit and runtime call site.
3. Placeholders, stale docs, unused adapters, candidates and cross-check-only sources are separated from live integrations.
4. Duplicated source settings across code/registry/seed/workflows are listed with exact paths.
5. Every DXY candidate has an evidence-based status; FRED broad index is not mislabeled as DXY.
6. Central configuration preserves provenance, freshness, revision/finality and source-approval gates.
7. No production/runtime behavior changes and no source is promoted automatically.
8. Only substantive confirmed outcomes are added to Plan 100 and journal.

Начни с чтения репозитория и построения инвентаря. Не проси пользователя вручную проверять код или workflow-логи. Если конкретная capability недоступна, назови точное ограничение и продолжи всю доступную проверку.