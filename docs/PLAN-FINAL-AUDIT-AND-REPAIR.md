# ПЛАН-ФИНАЛ — полный аудит и ремонт Crypto

Статус: MASTER PLAN
Дата: 2026-10-07

## 0. Назначение

Это главный план перед следующим большим циклом работ над Crypto.

Цель: прекратить поштучное обнаружение проблем во время исправлений. Сначала провести полный инвентаризационный аудит проекта и live-системы, составить единую карту состояния, затем исправлять проблемы пакетами по приоритету.

До завершения этапа FULL AUDIT не вносить новые локальные архитектурные фиксы, кроме P0-блокеров безопасности/данных, которые необходимо немедленно закрыть.

## 1. Главный принцип

НЕ РАБОТАТЬ ЦИКЛОМ:

> исправили → нашли новую дыру → исправили → нашли следующую дыру

РАБОТАТЬ ЦИКЛОМ:

> полный рентген → единая матрица проблем → архитектурный план → пакетные исправления → полный regression → E2E audit

Каждая найденная проблема должна попасть в матрицу. Нельзя терять проблему только потому, что она найдена в другом слое.

## 2. Что считать источником истины

Проверять одновременно:

1. Git repository / код / migrations / seed / docs.
2. Database schema и реальные данные live DB.
3. Live API endpoints.
4. Workers / scheduled jobs / ingestion.
5. UI mapping и отображение статусов.
6. CI/CD и migration workflow.
7. Security boundaries.

Если код говорит одно, а live DB/API другое — фиксировать оба состояния и считать это расхождением.

## 3. Полная матрица аудита

### A. Database Schema

Проверить:
- таблицы;
- PK/FK;
- NOT NULL;
- CHECK constraints;
- UNIQUE constraints;
- indexes;
- enum/reference tables;
- migration order;
- schema_migrations;
- schema drift.

Результат: список всех schema inconsistencies.

### B. Asset Registry

Для каждого enabled asset проверить:
- canonical lowercase asset_id;
- symbol;
- name;
- category;
- research_tier;
- primary_asset_type_id;
- binance_symbol;
- fallback_symbols;
- enabled;
- отсутствие дублей.

Проверить все зарегистрированные assets, а не только ETH.

### C. Market Registry

Проверить:
- market_pairs;
- base_asset_id;
- quote_asset_id;
- exchange;
- symbol;
- enabled;
- FK на assets;
- canonical quote assets;
- отсутствие orphan pairs;
- отсутствие duplicate pairs;
- соответствие pair symbol market identity.

Отдельно проверить USDT/USD/USDC semantics.

### D. Market History / Ingestion

Проверить полный путь:

Asset → Market Identity → Pair → Exchange → API → History → DB/cache → API response → UI.

Проверить:
- Binance symbols;
- fallback exchanges;
- unsupported assets;
- stablecoin quote handling;
- rate limits;
- error handling;
- stale data;
- missing history;
- empty history;
- normalization.

### E. Research Engine

Для каждого research-enabled asset проверить:
- snapshot;
- 15 blocks;
- block numbering;
- block status;
- N/A semantics;
- domain mapping;
- evidence;
- critical factors;
- scenarios;
- scores;
- research_status;
- freshness;
- lifecycle.

Проверить, что Research contract одинаково трактуется DB/API/UI/CI.

### F. Monitoring

Проверить:
- monitoring_signals;
- signal uniqueness;
- signal ownership by asset;
- freshness;
- Block 15 semantics;
- transition research → monitoring;
- stale/current logic;
- monitoring lifecycle.

### G. API

Проверить все публичные и административные endpoints:
- GET assets;
- GET asset detail;
- POST asset;
- DELETE asset;
- pairs;
- history;
- research;
- monitoring;
- admin/schema.

Для каждого endpoint проверить:
- input validation;
- canonicalization;
- DB query;
- response shape;
- null handling;
- error handling;
- auth;
- consistency between list/detail/history.

Особенно проверить casing: ETH/eth.

### H. Workers

Проверить:
- worker entrypoints;
- scheduled jobs;
- ingestion;
- enrichment;
- research status enrichment;
- failure/catch behavior;
- retries;
- idempotency;
- stale writes;
- dead/legacy workers.

### I. UI

Проверить:
- API → shared types;
- asset cards;
- research status;
- lifecycle;
- freshness;
- monitoring;
- history;
- empty/error states;
- filters;
- sorting;
- casing;
- status mapping.

UI не должен придумывать status, которого нет в backend contract.

### J. CI/CD

Проверить:
- migrations applied in correct order;
- migration markers;
- contract checks;
- Asset Registry checks;
- Market Registry checks;
- Research checks;
- Monitoring checks;
- API smoke checks;
- deployment workflow;
- failure visibility.

CI должен проверять систему, а не только наличие файлов.

### K. Security

Проверить P0:
- POST/DELETE authorization;
- admin endpoint protection;
- public schema exposure;
- secrets;
- environment variables;
- privileged DB operations;
- CORS;
- rate limiting where relevant.

Любая публичная admin/schema поверхность — P0/P1 в зависимости от реального доступа.

### L. Data Completeness

Для всех current assets составить таблицу:

asset | registry | market identity | pair | history | research | monitoring | API | UI | status

Отдельно выделить:
BTC, ETH, SOL, XRP, TRX, DASH, LTC, BCH, CAKE, USDT и любые другие фактически существующие assets.

### M. Legacy / Dead Code

Найти:
- старый engine;
- duplicate contracts;
- obsolete workers;
- dead migrations;
- unused tables;
- unused fields;
- hardcoded symbols;
- duplicate status definitions;
- conflicting documentation.

Не удалять автоматически. Сначала классифицировать: KEEP / MIGRATE / DELETE.

### N. Documentation

Проверить:
- README;
- architecture docs;
- Research contract;
- Monitoring contract;
- Pair/Commodity Engine docs;
- setup instructions;
- migration instructions;
- API contract.

Документация должна соответствовать реальному коду и DB.

### O. End-to-End

Финальная проверка должна пройти путь:

Asset Registry
→ Asset Type
→ Market Identity
→ Market Pair
→ Market History
→ Research Snapshot
→ 15 Blocks
→ Domains
→ Factors
→ Scenarios
→ Scores
→ Research Status
→ Monitoring Signals
→ Lifecycle
→ API
→ UI.

ETH должен быть первым полностью доказанным E2E asset.

## 4. Формат результата полного аудита

Создать одну таблицу:

| ID | Layer | Component | Status | Severity | Evidence | Root Cause | Required Fix | Dependencies |
|---|---|---|---|---|---|---|---|---|

Status:
- GREEN — готово;
- YELLOW — частично/есть риск;
- RED — сломано;
- MISSING — отсутствует;
- LEGACY — требуется миграция/удаление.

Severity:
- P0 — блокирует корректность/безопасность/production;
- P1 — ломает важный product path;
- P2 — технический долг/качество;
- P3 — косметика/docs.

## 5. После аудита — пакетный repair plan

Не исправлять сразу каждую найденную строку.

Сначала группировать:

### Batch 1 — P0
Security, identity, data corruption, broken production paths.

### Batch 2 — Core Contracts
Asset Registry, Market Registry, Research, Monitoring.

### Batch 3 — Data
Canonical seeds, pairs, history, research cards.

### Batch 4 — API/Workers
Consistency, validation, lifecycle, ingestion.

### Batch 5 — UI
Status/lifecycle/data presentation.

### Batch 6 — Legacy
Remove/replace obsolete architecture.

### Batch 7 — Documentation
Synchronize docs with final implementation.

## 6. Definition of Done

Работу считать законченной только когда:

1. Нет P0.
2. Нет незакрытых P1 без явно принятого решения.
3. DB schema соответствует migrations.
4. Registry соответствует Market layer.
5. Market layer соответствует API.
6. Research contract одинаков в DB/API/UI/CI.
7. Monitoring contract одинаков в DB/API/UI/CI.
8. ETH проходит полный E2E.
9. Все current assets имеют известный и документированный статус.
10. Legacy code классифицирован.
11. CI проверяет ключевые инварианты.
12. Live API подтверждает ожидаемый contract.
13. README/architecture docs соответствуют фактической системе.

## 7. Жёсткое правило следующего цикла

После запуска FULL AUDIT нельзя говорить:

> «Я обнаружил ещё одну проблему»

как о неожиданности.

Новая проблема допустима только если:
- она появилась из-за исправления;
- она относится к внешней системе, которую невозможно было проверить заранее;
- или это новая регрессия.

Во всех остальных случаях проблема должна быть добавлена в матрицу полного аудита до начала repair.

## 8. Название плана

Каноническое название документа:

**ПЛАН-ФИНАЛ — Full Audit & Repair**

Короткое рабочее имя:

**ПЛАН-ФИНАЛ**

Не создавать параллельные «ПЛАН Б», «ПЛАН В» и т.п. без явной причины. Этот документ является master plan текущего цикла.
