# Crypto — аудит источников и централизованной конфигурации

Дата проверки: 2026-10-17  
Область: registry + read-only BTC source staging + существующие source contracts. Это фактический первичный аудит по доступным файлам и последнему staging artifact, не заявление о полном динамическом трассировании каждого UI/API consumer.

## Итог

**Да, источники целесообразно централизовать в коде/конфигурации.** Сейчас источник описывается в нескольких местах с разными уровнями подробности: `data/CryptoDataModel/registry/source-registry.json` (общая карточка), `metric-registry.json` (приоритет источников на метрику), `scripts/capture-btc-public-sources.mjs` (URL, парсер, статус и provenance), `scripts/prepare-btc-observation-candidates.mjs` (повторно зашитые URL/разрешения), `infrastructure/postgres/seed-v1.sql` (runtime/seed parity), workflow env/secrets и документация. Это уже создаёт риск рассинхронизации: например, DXY URL/allowlist и статус Yahoo должны быть согласованы между capture, normalizer, registries, seed и readiness tests.

Рекомендуется **единый Source Catalog**, но не один неструктурированный файл со всеми правилами. Каталог должен быть источником истины для идентичности/endpoint/config, а отдельные metric contracts — для единиц, freshness, допустимых source IDs и качества/финализации. Не переносить секреты в каталог: только имя env var/secret reference.

## Подтверждённый read-only staging

Workflow: [BTC Public Source Staging run #168](https://github.com/olegsh247-stack/Crypto/actions/runs/39009940767), commit `7d29e5ff3e91099b7eae58ccd8949b16089e556e`, conclusion **success**. Artifact `btc-public-source-review`, SHA-256 `81aff80f468acb45a8d07f210c6b5cbf162889d2aadbaf36f3dd977c70e234dd`, создан 2026-10-17 06:27Z; временное хранение до 2026-10-24. Manifest указывает `mode=read-only-staging-only`, `production_database_accessed=false`, `production_writes_performed=false`.

- Kraken XBT/USD: HTTP 200, trade timestamp сохранён отдельно от retrieval timestamp; цена в этом capture 81,473.1 USD/BTC. В момент проверки capture свежий, но значение быстро устаревает и не является подтверждением текущей свежести позднее.
- Binance primary: HTTP 451. Binance market-data-only: HTTP 200, BTC/USDT — только cross-check.
- OKX: HTTP 200, BTC/USDT — только cross-check. Bybit: HTTP 403.
- Mempool.space hashrate и block-fees endpoints: HTTP 200; для использования значений всё ещё нужны проверки bucket/window semantics, единиц и расчёта.
- Farside landing page: HTTP 403; Farside all-data page: HTTP 200. ETF-строки остаются blocked review-only: нет подтверждённых provider observation/publication time и revision/finality semantics.
- TFTC JSON: HTTP 200, кандидат/зеркало, не canonical; provenance и ревизии требуют дальнейшего подтверждения.
- CryptoETF.today MCP: HTTP 200, 30-day cross-check only, не canonical ETF flow.
- SoSoValue: HTTP 200 при использовании `SOSOVALUE_API_KEY`; 22 дневные записи в полученном ответе, дата — торговый день, точное время публикации/окончательность не передаются. Последняя строка за 2026-10-16: −82.3893051 млн USD; Farside за ту же дату: −82.4 млн USD, разница ≈0.010695 млн USD. За 2026-10-07 SoSoValue: −487.0674115 млн USD, Farside: −484.9 млн USD, разница ≈2.167412 млн USD — существенная. SoSoValue подтверждён как работающий keyed cross-check, но не принят как canonical source и не допущен к ingestion.
- Yahoo Finance DXY: staging намеренно не делает HTTP-запрос; статус `BLOCKED_ACCESS_TERMS`. ICE DXY остаётся кандидатом без подтверждённого публичного endpoint/лицензии. `macro.dxy.source_priority` пустой.

## Source inventory — фактические роли

| Source ID / provider | Метрики и блоки из metric registry | Реальное использование, найденное в этом проходе | Статус |
|---|---|---|---|
| `market.kraken` — Kraken public Trades XBTUSD | `market.spot_price` USD/BTC; blocks 08, 15; freshness 1h | Staging: `scripts/capture-btc-public-sources.mjs`; нормализация: `scripts/prepare-btc-observation-candidates.mjs`; metric priority: `metric-registry.json`; общая запись: `source-registry.json` | **Канонический кандидат** для USD/BTC; staging работает. Candidate не означает, что свежий вход уже сохранён в runtime. |
| `market.binance` — api.binance.com BTCUSDT | Spot price review; blocks 08,15 только как диагностический cross-check | Capture script | Primary endpoint заблокирован в runner (451). Не canonical; USDT ≠ USD. |
| `market.binance` — data-api.binance.vision BTCUSDT | То же, cross-check | Capture script | HTTP 200; cross-check only, отдельный endpoint должен иметь отдельную запись каталога. |
| `market.okx` — OKX BTC-USDT trades | Spot price cross-check; blocks 08,15 | Capture script + source registry | HTTP 200; cross-check only, USDT. |
| `market.bybit` — Bybit BTCUSDT recent trades | Spot price cross-check; blocks 08,15 | Capture script + source registry | HTTP 403 из runner; cross-check не доступен в данном окружении. |
| `market.mexc` — MEXC Spot API | В metric registry нет текущего source priority; market metrics используют placeholder `market.primary` | Source registry/docs; реальный call site в данном проходе не найден | Candidate/documentation-only до доказательства интеграции и контракта. |
| `market.primary` — generic market provider | Futures OI, perpetual funding, options OI; blocks 08,15 | Metric registry; generic placeholder | **Placeholder**, не конкретный провайдер; нельзя считать три метрики обеспеченными источником. |
| `network.primary` — Mempool.space | Hashrate blocks 04,11,15; difficulty 04,11,15; block time 04,11,15; fee/subsidy 03,04,11,15; circulating supply 03,15; subsidy 03,04,15; transactions 04,06,15; mempool 04,15; UTXO 03,04,06,15 | Source registry + metric priority; staging capture явно включает hashrate и block-fees | REST доступ подтверждён для двух staging endpoints; остальные метрики требуют endpoint-level mapping. Для hashrate/fees обязательна проверка window/unit/methodology. |
| `lightning.primary` — Mempool.space Lightning | Lightning capacity BTC; blocks 05,06,12,15 | Source registry + metric priority | Registry-defined; в текущем capture конкретный Lightning endpoint не вызывается. |
| `protocol.primary` — Bitcoin Developer Reference | Max supply blocks 03,14; subsidy blocks 03,04,15; Core version и critical vulnerability blocks 02,11,15 | Source registry + metric priority | Документация/RPC — source class, но конкретные call sites/refresh contract требуют отдельной трассировки. |
| `analytics` — Glassnode | Hashrate blocks 04,11,15; corporate BTC holdings blocks 07,12,13,15 | Source registry + metric priority | API/dashboard, лицензия/ключ/конкретные adapters не подтверждены этим staging; не считать автоматически доступным. |
| `institutional.primary` — Farside all-data | ETF net flow blocks 07,08,12,15; ETF BTC holdings blocks 07,12,15; corporate holdings priority также содержит этот ID | Source registry + metric priority; capture + parser + review-only candidate generation | All-data HTTP 200, landing 403. Rows blocked из-за timestamp/revision/finality; holdings и corporate holdings нельзя считать обеспеченными только потому, что этот ID назначен в registry. |
| `institutional.tftc` — TFTC JSON | ETF-flow cross-check; не включён в `institutional.etf_net_flow.source_priority`; blocks 07,08,12,15 как диагностический контекст | Capture + cross-source comparison logic + source registry | HTTP 200; candidate mirror, не canonical; существенное расхождение 7 Oct. |
| `institutional.sosovalue` — SoSoValue keyed summary history | ETF-flow cross-check; не включён в source priority; blocks 07,08,12,15 как диагностический контекст | Capture script с env secret; candidate generator cross-check; source registry | HTTP 200 с ключом. Только cross-check; 22 rows; date-only semantics, no finality/publication timestamp. |
| CryptoETF.today MCP | ETF-flow cross-check; отсутствует как canonical registry ID | Capture script + comparison diagnostics | HTTP 200; 30-day cross-check only, не canonical. Для полноценного каталога добавить отдельный provider/endpoint entry, не делать его canonical автоматически. |
| `macro.yahoo_finance_candidate` — Yahoo `DX-Y.NYB` | `macro.dxy` blocks 09,15; freshness registry 48h | Source registry + explicit blocked branch in capture/normalizer contract; no network request in current workflow | **Blocked** по условиям доступа; chart session label не доказывает actual close/publication timestamp. |
| `macro.ice_dxy_candidate` — ICE DXY | `macro.dxy` blocks 09,15 | Source registry/docs only; нет подтверждённого live endpoint | Candidate only; лицензия/access/schema/time semantics unknown. |
| `macro.primary` — Treasury/Fed/BLS generic | US 10Y yield blocks 09,15 | Metric/source registry only | **Placeholder**, не конкретный endpoint/серия. Не использовать для DXY. |
| FRED `DTWEXBGS` | В текущем registry не подключён к `macro.dxy` | Внешняя документация/research only | Broad nominal USD index, не ICE DXY; не взаимозаменяем. |

## Metric-to-research-block matrix (IDs как заданы в registry)

| Metric ID | Unit | Source priority | Research blocks |
|---|---|---|---|
| `market.spot_price` | USD/BTC | `market.kraken` | 08, 15 |
| `security.hashrate` | EH/s | `network.primary`, `analytics` | 04, 11, 15 |
| `security.difficulty` | difficulty | `network.primary` | 04, 11, 15 |
| `security.block_time` | minutes | `network.primary` | 04, 11, 15 |
| `security.fee_subsidy_ratio` | ratio | `network.primary` | 03, 04, 11, 15 |
| `monetary.circulating_supply` | BTC | `network.primary` | 03, 15 |
| `monetary.max_supply` | BTC | `protocol.primary` | 03, 14 |
| `monetary.block_subsidy` | BTC/block | `protocol.primary`, `network.primary` | 03, 04, 15 |
| `network.transaction_count` | transactions/day | `network.primary` | 04, 06, 15 |
| `network.mempool_size` | MB | `network.primary` | 04, 15 |
| `network.utxo_count` | UTXOs | `network.primary` | 03, 04, 06, 15 |
| `network.lightning_capacity` | BTC | `lightning.primary` | 05, 06, 12, 15 |
| `institutional.etf_net_flow` | USD million/day | `institutional.primary` | 07, 08, 12, 15 |
| `institutional.etf_btc_holdings` | BTC | `institutional.primary` | 07, 12, 15 |
| `institutional.corporate_btc_holdings` | BTC | `institutional.primary`, `analytics` | 07, 12, 13, 15 |
| `market.futures_open_interest` | USD | `market.primary` placeholder | 08, 15 |
| `market.perpetual_funding` | percent/8h | `market.primary` placeholder | 08, 15 |
| `market.options_open_interest` | USD | `market.primary` placeholder | 08, 15 |
| `macro.dxy` | index | **empty** | 09, 15 |
| `macro.us_10y_yield` | percent | `macro.primary` placeholder | 09, 15 |
| `technology.bitcoin_core_version` | version | `protocol.primary` | 02, 11, 15 |
| `technology.critical_vulnerability` | boolean/event | `protocol.primary` | 02, 11, 15 |

В `metric-registry.json` есть ID блоков, но в этом registry нет их человекочитаемых названий. Названия блоков не выдумываются; в следующем проходе их нужно привязать к единому каноническому документу/реестру блоков.

## Предлагаемая единая конфигурация

### 1. `data/CryptoDataModel/registry/source-catalog.json` — provider/endpoint catalog

Для каждого endpoint:
- `endpoint_id` (уникален даже если один provider имеет несколько URLs), `source_id`, `provider`, `base_url`, `path`, `method`, query template, symbols/pairs;
- `auth.type` и только `auth.secret_env` (например, `SOSOVALUE_API_KEY`), никаких значений ключей;
- `enabled_for_staging`, `enabled_for_runtime`, `role` (canonical/cross_check/review_only/blocked/placeholder);
- timeout, rate-limit notes, access/terms status, last verification date;
- parser/adapter ID, payload schema version, expected content type;
- source timestamp field/semantics, session timezone/date field, retrieval-time handling;
- row key scope, payload hash, duplicate policy, revision/finality support;
- owner/documentation URL and archival/redistribution constraints.

### 2. Metric contract остаётся отдельным

В `metric-registry.json` держать `metric_id`, unit, validation, freshness policy, research block IDs и разрешённые endpoint/source IDs. Не дублировать полный URL, auth или parser implementation в metric registry. Для DXY пустой priority остаётся правильным fail-closed состоянием до допуска источника.

### 3. Parser/adapter registry в коде

Вынести provider-specific parsing в отдельные adapter modules, выбирать по стабильному `adapter_id`. Секрет читать только из environment в момент вызова. URL/endpoint брать из каталога, не держать второй набор URL allowlists в normalizer; при этом fail-closed policy (разрешённый source ID, metric, unit, timestamp semantics, freshness) должна остаться в тестах/metric contract.

### 4. Validation

- schema validation для catalog и uniqueness tests для endpoint IDs;
- тест, что каждый `source_priority` разрешается в catalog/registry и каждый runtime-enabled endpoint привязан к metric;
- тест, что canonical source не может ссылаться на `placeholder`, `blocked` или `cross_check`;
- test parity для JSON catalog ↔ SQL seed без подключения к production DB;
- тесты на единицы (USD vs USDT), date-only ETF rows, placeholders/dashes vs zero, duplicate key, revisions/finality, timestamp future/age;
- workflow source inventory artifact должен перечислять catalog version/hash и capture mode;
- документация и terms review обязательны до подключения любого внешнего провайдера.

## Выявленные несоответствия и следующие шаги

1. `macro.dxy` не имеет source priority — сохранять этот блокер; не продвигать Yahoo/ICE/FRED.
2. ETF source priority ссылается на Farside, хотя ingestion остаётся заблокированным по timestamp/revision/finality. Нужен readiness status/eligibility, а не только presence в priority.
3. SoSoValue работает с ключом, но ответ покрывает только 22 торговых дня и не доказывает стабильный полный архив; сравнение показывает минимум одно существенное расхождение.
4. В staging скрипте разные providers и URLs hard-coded, а normalizer отдельно hard-codes Kraken/DXY source expectations. Централизация оправдана, но миграция должна идти поэтапно и с тестами, без изменения канонических источников на первом шаге.
5. `market.primary` и `macro.primary` — не конкретные поставщики; futures/options/funding и 10Y yield не должны отображаться как обеспеченные данными до endpoint-level contract.
6. `source-registry.json` — общая карточка источника, а не полный исполняемый каталог endpoint-ов. CryptoETF.today и Binance market-data-only endpoint показывают, почему provider-level IDs недостаточно.

## Границы

В этом проходе не менялись runtime registry/source priorities, SQL seed, evaluator, scenario state/score/probability, production DB, deployment или PR status. Отчёт не объявляет BTC готовым: BTC остаётся `not_evaluable` до свежего spot и принятого ETF flow; DXY не является обязательным разрешённым источником до завершения своего контракта.


## Дополнение 2026-10-17 — polling intervals и API keys

Для целевой частоты 15–60 минут применяется принцип по потребности, а не общий опрос всех провайдеров. Spot может опрашиваться каждые 15 минут только при обоснованной потребности; базовый вариант — 30–60 минут. Дневные ETF flows/holdings, macro daily series, corporate holdings и релизные/протокольные данные должны опрашиваться daily/event-driven или реже, с учётом публикации/ревизий. Poll interval не равен freshness window.

Полный перечень ключей и предложенных интервалов вынесен в [SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md](SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md). На текущий момент единственный подтверждённо нужный ключ для проверенного staging — `SOSOVALUE_API_KEY`, уже настроенный в GitHub Actions; SoSoValue остаётся cross-check only. Другие ключи пока не создавать: сначала принять конкретные endpoints и проверить тарифы/ToS. В будущем Source Catalog для каждого endpoint обязателен `poll_interval`, `poll_mode`, `provider_min_interval`, rate limit/backoff и отдельная freshness policy.


## Дополнение 2026-10-17 — фактический runtime source path

Проверен `vps/api/src/app.ts`. Runtime ticker fallback — Binance → Kraken → CoinGecko, тогда как research `market.spot_price` имеет source priority `market.kraken`. Binance используется также для candles (несколько endpoint hosts); USD candle conversion использует Binance USDT candles и Kraken OHLC daily. CoinGecko simple/price endpoint вызывается без API key. Эти runtime endpoints не полностью представлены как отдельные endpoint entries в source registry/catalog.

Ticker cache в runtime — 60 секунд, response Cache-Control — max-age 30 / s-maxage 60; upstream polling request-driven, не расписание. Это потенциально чаще требуемого интервала 15–60 минут. Поле `timestamp` runtime ticker присваивается временем приложения после fetch, а не подтверждённым timestamp источника. Эти два пункта требуют отдельного исправления/контрактного решения, но код не менялся в этом аудиторском шаге.

См. [политику ключей и частоты опроса](SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md) для текущего списка ключей и целевого cadence.


## Дополнение — cache TTL исправлен на рабочей ветке, не в main

В commit `3da2ffba02a1aa3307066038bb6da2eda5dc6c78` на `fix/btc-readiness-registry-runtime-source` TTL in-process ticker cache увеличен с 60 секунд до 15 минут; HTTP Cache-Control — с `max-age=30, s-maxage=60` до `max-age=900, s-maxage=900`. Это уменьшает частоту повторных запросов upstream при частом обновлении интерфейса. Изменение пока не в main и не развернуто; дождаться CI build/E2E. Fallback Binance → Kraken → CoinGecko не менялся. Timestamp по-прежнему является временем приложения после fetch, а не подтверждённым trade timestamp.


## Дополнение — Source Catalog v1 baseline

Создан первоначальный endpoint-level каталог `data/CryptoDataModel/registry/source-catalog.v1.json` и план миграции `docs/SOURCE-CATALOG-V1-DESIGN-AND-MIGRATION-PLAN-2026-10-17.md`. В каталоге представлены все текущие IDs из `source-registry.json` (включая placeholder entries для невыбранных market/macro providers), плюс два явных unregistered candidates: Yahoo Finance DXY и CryptoETF.today. Эти два кандидата не добавлены в metric source_priority; их наличие в каталоге не даёт права на ingestion или scenario evaluation.

Добавлен `scripts/validate-source-catalog.mjs` в VPS API Build Rehearsal. Проверка валидирует уникальность catalog IDs, source ID alignment, допустимые статус/роль/access/polling enum, наличие unit/observation-time/period/terms fields и отсутствие credential-like URL query parameters; допускает URL-less provider placeholder только если он явно `unknown + blocked + manual`. Проверка выводит coverage gaps как baseline report, не меняя runtime. В последнем наблюдавшемся run [#39015560940](https://github.com/olegsh247-stack/Crypto/actions/runs/39015560940) шаг `Validate source catalog inventory (read-only)` завершился **success**; полный VPS build/E2E на момент записи ещё выполняется.

Каталог пока не является runtime source of truth. Нельзя пока рефакторить capture/runtime/SQL seed на его основе: сначала подтвердить полный CI run и просмотреть baseline coverage report. Source priorities, production data, scenario state/score/probability и deployment не менялись.


## Дополнение — runtime market endpoints внесены в каталог отдельно от research sources

По фактическим call sites в `vps/api/src/app.ts` в catalog добавлены отдельные записи для runtime UI ticker/candles:
- Binance ticker и klines (пример BTC/USDT), с fallback hosts `data-api.binance.vision`, `api-gcp.binance.com`, `api.binance.com`;
- Kraken Ticker и daily OHLC (XBT/USD);
- CoinGecko simple/price и market_chart (CoinGecko добавлен только как `candidate_unregistered`, потому что отдельного source ID пока нет в source registry).

Эти endpoints помечены `review_only`, а не canonical research ingestion. UI ticker currently stamps `timestamp` at retrieval time for Binance/Kraken/CoinGecko; this must not be mistaken for a provider trade observation timestamp. Binance candle route uses BTC/USDT series, and some USD candle paths derive from USDT candles, so they must not be represented as canonical USD spot observations. Runtime cache remains 15 minutes only on this branch; source fallback order and response contract were not changed by the catalog inventory.


## Итог read-only parity baseline — 2026-10-17

Catalog contains 33 endpoint records. Programmatic comparison against the current branch reports 16/16 source-registry IDs covered, all metric source IDs covered, no duplicate catalog IDs, and four unregistered/provisional source IDs kept out of metric `source_priority`: `macro.yahoo_finance_candidate`, `institutional.cryptoetf_today`, `market.coingecko`, and `institutional.sosovalue.candidate`.

The read-only validator now checks 10 runtime endpoint families, 10 public-capture endpoint families and 4 candidate-preparation endpoint families. Full VPS API Build Rehearsal/E2E for this validator/catalog state passed: [run #39015830480](https://github.com/olegsh247-stack/Crypto/actions/runs/39015830480). It validates catalog/source-reference parity; it does not claim all providers are operationally accepted, nor does it make the catalog a runtime source of truth.

Known limitation: this baseline traces the explicit endpoint families above, not every future dynamic URL or every SQL-seed consumer. Next step is a broader read-only drift report over candidate-preparation/capture call sites and SQL seed semantics; only after review should any adapter be refactored to consume the catalog.
