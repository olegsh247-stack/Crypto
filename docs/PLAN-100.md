# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 16 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Последние проверенные CI-свидетельства (базовый снимок 14 октября 2026; дополнение 15 октября см. ниже):** BTC Scenario Readiness Gate #203 passed on code SHA `ffeff5686dda5df6f4e5a4dae859671be6a0ec91` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38617960879)); BTC Public Source Staging #69 passed on code SHA `6dbe6b48a55afb60c3a8176483fbf9bb9d0dcf74`, including the official Binance market-data-only endpoint ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38618817154)); VPS Build Rehearsal #1194 passed on documentation commit `7338953755c3714e5a13a84f4e70101d70fd4610` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38618134185)). Rehearsals triggered by the newer cross-check/documentation commits are tracked separately and must not be called passed until complete. ETF timestamps/revision semantics and DXY remain blockers.  
**Документ в репозитории:** `docs/PLAN-100.md`  
**Назначение:** единый рабочий план от текущего состояния до полной готовности продукта, self-hosted hosting, безопасного cutover и операционной устойчивости.


## Обновление 2026-10-16 — проверка CI и первичного источника GBTC

- Проверен VPS build-and-E2E workflow run [#38884351373](https://github.com/olegsh247-stack/Crypto/actions/runs/38884351373) для commit `9523d7be7031e92014f6281ba34579458bfcaf1a`: все 27 основных шагов завершились успешно, включая VPS-only границы, сборки API/Worker, проверку canonical BTC registry, provenance audit, идемпотентность и reconciliation дублей, PostgreSQL backup/restore rehearsal, API/Worker E2E и BTC evidence/snapshot lineage E2E. Это CI rehearsal, а не подтверждение фактически развёрнутого VPS, долговременного архива или независимого failure-domain restore.
- Матрица первичных источников ETF расширена по GBTC: SEC 10-Q за 2026-Q2 содержит точечные NAV/share, net assets, BTC holdings и shares outstanding; 10-Q за Q1 показывает квартальные выпуски/погашения акций. Эти документы подходят для периодической сверки, но не доказывают полный ежедневный поток. Официальная страница Grayscale вернула HTTP 403 при проверке; недокументированный API или права на систематическое хранение не предполагаются.
- Матрица: [BTC ETF issuer source coverage](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md). Изменение записано commit `630f3dc58eec170e2cb33c6143d309682db24ed6`; запись в «Промт 100» — commit `c0edbf61f1738b0924f523064e95483a4e4e01c6`.
- Решение не меняется: ни один новый источник не продвинут в runtime registry, формула не менялась, live capture и production writes не запускались. PR #83 остаётся Draft; BTC остаётся `not_evaluable`. Следующий шаг — продолжать документальную проверку ежедневной исторической доступности, методологии и прав для оставшихся активных фондов, прежде чем предлагать замену источника или изменение evaluator.

## Дополнение 2026-10-16 — Grayscale Bitcoin Mini Trust: квартальная первичная сверка

SEC 10-Q за 2026-Q2 сообщает на 2026-06-30: 122,749,963 shares, principal-market NAV/share $25.98, net assets $3.189 млрд и 54,280.40050138 BTC. На обложке отдельно указан share count 133,199,963 на 2026-07-30; это другая дата, не сопоставлять как одну запись. Источник пригоден для периодической сверки, но не заменяет ежедневный flow feed. Матрица: commit `512ee36d39ad968a1a86ca8ffc4a45cb0d4500b1`; «Промт 100»: commit `c39286ac4b2fe3f2f887decd0d97f55b5dbe53ca`. Не выполнялись capture и продвижение источника.

## Корректировка 2026-10-16 — ARKB привязан к последнему SEC 10-Q

Матрица проверена повторно: строка ARKB теперь ссылается на SEC 10-Q за 2026-Q2 и фиксирует данные на 2026-06-30 — 97,015,000 акций, NAV/share $19.47 и net assets $1.889 млрд. Более раннее упоминание Q1 убрано из текущей строки. Изменение матрицы: commit `1d88209b7bb1a4654132fcb1be753ba4ac4b5c72`; журнал: commit `4883d8ec3ae218a17d5ddc65b726f51781bc870c`. Ежедневный поток и права на систематическое архивирование остаются неподтверждёнными.

## Дополнение 2026-10-16 — подтверждены последние квартальные данные SEC для ARKB и BTCO

- ARKB SEC 10-Q за 2026-Q2: на 2026-06-30 — 97,015,000 акций, NAV/share $19.47, net assets $1.889 млрд.
- BTCO SEC 10-Q за 2026-Q2: на 2026-06-30 — 5,370,000 акций, NAV/share $58.81, net assets $315.789 млн, 5,345 BTC. В отчёте раскрыты квартальные покупки 140,000 акций и погашения 1,510,000 акций (чистое изменение -1,370,000). Это квартальная сверка, а не ежедневный поток.
- Матрица уточнена: [BTC ETF issuer source coverage](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md), commit `899ea29554f2502ce783f31ae64a8f4c3052d287`; «Промт 100» — commit `0830a9a17a7afcdb1284f0d68d3f67f091f6a6c9`.
- Результаты VPS Build Rehearsal для предыдущих изменений матрицы подтверждены как успешные: runs [#38885834201](https://github.com/olegsh247-stack/Crypto/actions/runs/38885834201), [#38885861743](https://github.com/olegsh247-stack/Crypto/actions/runs/38885861743), [#38885892752](https://github.com/olegsh247-stack/Crypto/actions/runs/38885892752), [#38885971999](https://github.com/olegsh247-stack/Crypto/actions/runs/38885971999).
- Дальнейший барьер прежний: не утверждать квартальные данные как ежедневный ряд; не менять registry, приоритет источников или формулу без полного контракта, reconciliation и подтверждения прав на хранение.

## Дополнение 2026-10-16 — покрытие первичных ETF источников ARKB и BTCO

- ARKB: официальный обзор 21shares показывает датированные NAV/market price/AUM; SEC Q1 2026 сообщает shares outstanding на дату. Полный ежедневный исторический ряд акций/созданий/погашений не подтверждён.
- BTCO: Invesco указывает, что NAV публикуется каждый рабочий день; SEC Q1/Q2 2026 дают периодические данные по акциям/финансам. Полный ежедневный ряд shares/creation-redemption и разрешённый способ систематического архивирования не установлены.
- Матрица покрытия обновлена: [BTC ETF issuer source coverage](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md), commit `b74bebb3b9963b0a71539dfeab2bc0acb2bb677d`; запись «Промт 100» — commit `170ad54defbd0dc663bc825de0f38595a69fcdb8`.
- Вывод не меняется: первичные отчёты годятся для периодической сверки, но не доказывают полноценный ежедневный агрегат потоков. Не менять metric registry, приоритеты источников или формулу, пока контракт источника, история, календарная семантика, права и reconciliation не подтверждены.

## 0. Короткое решение: что строим и в каком порядке

Мы строим исследовательскую платформу для криптоактивов, которая в целевом состоянии работает на собственном VPS пользователя, использует PostgreSQL и позволяет получать воспроизводимые, проверяемые аналитические результаты с прозрачными источниками, единицами, временными метками, версиями и доказательствами.

**Обязательный порядок приоритетов:**

1. **Hosting architecture и зависимости** — закрепить self-hosted целевую архитектуру в репозитории и CI. Внешнюю проверку Cloudflare/GitHub App/DNS вести отдельно и не блокировать разработку продуктового пути BTC; закрыть её до отключения legacy-сервиса или cutover.
2. **Сверка всех открытых PR с `main`** — установить, что уже реализовано, что дублируется, что устарело, что действительно нужно; ничего автоматически не объединять и не закрывать.
3. **Полный Product Contour v1 audit** — проверить фактические контракты API, Web, Worker, источников, факторов, scores, сценариев, monitoring и Evidence на актуальном коде и доступных read-only данных.
4. **Один полный воспроизводимый сценарий BTC** — только после проверки происхождения, свежести, единиц, временных интервалов, revision/lineage и конфликтов входов. Сначала offline/read-only воспроизведение. Не создавать автоматически состояние сценария или monitoring event.
5. **Приёмка одного сквозного продуктового пути BTC** — пользовательский интерфейс, API-контракты, evidence, snapshot lineage, объяснимый результат и повторяемые тесты.
6. **Подготовка и развёртывание на собственном VPS** — только когда VPS будет реально приобретён/предоставлен. До этого — локальные и CI-репетиции на disposable PostgreSQL; не менять текущий публичный сервис.
7. **Контролируемая миграция и cutover** — backup, restore, parity, acceptance, явное разрешение пользователя, план отката и период наблюдения.
8. **Только после прохождения BTC-сценария** — расширять источники, исследования и активы; не начинать массовое расширение заранее.

План не означает, что все этапы уже сделаны. Статус каждого этапа меняется только на основании проверяемых доказательств, тестов, результатов команд или актуальных данных GitHub.

## 1. Цель и критерий полной готовности

Проект считается полностью готовым не потому, что сборка зелёная или страницы существуют, а когда одновременно выполнены все условия:

- Репозиторий и CI не зависят от Neon/Cloudflare как от обязательной части целевой runtime-архитектуры, и не содержат неучтённых устаревших deployment/migration/secret references.
- Публичный сервис переведён на собственный VPS только после явного согласования, проверки данных и готового rollback.
- PostgreSQL разворачивается с нуля воспроизводимо; миграции имеют проверенный порядок и безопасный повторный запуск; backup и restore реально проверены.
- API, Web и Worker имеют согласованные контракты и проверенную snapshot lineage; lifecycle/freshness и значения прогресса согласованы.
- Источники зарегистрированы и проверяемы; каждое значение имеет понятную метрику, единицы, период/дату наблюдения, время получения, URL/происхождение и, где применимо, revision/aggregation window.
- Дубликаты логических наблюдений исследованы и разрешены только по утверждённому правилу; конфликтные записи не удаляются автоматически.
- Сценарий BTC воспроизводим из зафиксированного набора входов, версии методики и активного published snapshot. Повторный запуск с теми же входами и версией даёт тот же результат.
- Scenario state и monitoring event создаются только явным, протестированным evaluation-процессом, а не обычной загрузкой свечей/данных.
- Сквозные тесты подтверждают API, Web, Worker, evidence, monitoring, безопасность административных операций, расписание, идемпотентность и отсутствие перекрёстного смешивания snapshot.
- Для VPS подтверждены доступность, безопасность сети, off-host backup, восстановление, мониторинг, эксплуатационные инструкции и процедура отката.
- Документация соответствует реальному состоянию. Главный план обновлён, изменения закоммичены и отправлены в GitHub.

## 2. Неприкосновенные правила выполнения

1. **Не менять порядок этапов без прямого решения пользователя.** Если более поздняя задача выглядит привлекательной, но блокирующий ранний этап не закрыт, сначала закрывается блокирующий этап.
2. **Не сливать PR автоматически.** Сначала сравнить с актуальным `main`, проверить CI, зависимости веток и изменения; затем предложить решение. Не закрывать PR без установленной причины.
3. **Не изменять production по умолчанию.** Никаких production writes, ingestion, миграций, секретов, DNS, деплоя, удаления Neon/Cloudflare или переключения трафика без отдельного явного разрешения.
4. **Не выдумывать успешные проверки.** Статический просмотр, локальный тест, CI и live read-only check — разные уровни доказательства; в отчёте указывать, какой именно был выполнен.
5. **Не считать старые данные актуальными только потому, что они есть.** Если последнее значение устарело или не имеет подтверждённого происхождения, не подменять его более старым значением молча.
6. **Не удалять дубликаты автоматически.** Сначала read-only отчёт, сверка payload и происхождения, согласованное правило, backup и проверка на disposable-копии.
7. **Не записывать состояние сценария автоматически.** До утверждения правил и готовности входов допустимы offline-расчёт и read-only проверки; не создавать искусственные scenario state/event ради зелёного теста.
8. **Не расширять охват активов раньше времени.** Сначала один полный путь BTC. SOL, CAKE и другие активы не должны отвлекать от завершения этого пути, кроме строго ограниченных read-only сравнений, если они необходимы для контракта.
9. **Каждое содержательное изменение — документировать и отправлять в GitHub.** Отдельно сообщать commit SHA, ветку/PR и фактический статус проверок.
10. **Не смешивать проект Crypto с `all-tracker` или другими проектами.** Все задачи этого плана относятся только к репозиторию Crypto.
11. **Не путать репозиторную архитектуру с live-инфраструктурой.** Удалённая из Git конфигурация не доказывает, что внешний сервис отключён; зелёная репетиция не доказывает, что VPS существует или production переключён.
12. **Если нет доступа к внешнему аккаунту или VPS, фиксировать это как блокер**, а не утверждать, что проверка завершена.

## 3. Текущая исходная точка (12 октября 2026)

### 3.1 Репозиторий и хостинг

- Репозиторий: https://github.com/olegsh247-stack/Crypto (Public).
- Целевая архитектура по документации: DNS → Caddy/HTTPS → Node.js API → self-hosted PostgreSQL 16; отдельный Node.js Worker; приватная сеть для БД/API/Worker; backup/restore; GitHub Actions для сборки и проверок.
- В `main` имеется `vps/`, `infrastructure/postgres/`, `scripts/migrate-postgres.sh`, `scripts/backup-postgres.sh` и workflow Release Gate для репетиции целевого стека.
- VPS пока не приобретён/не подтверждён как существующий. Развёртывание, DNS cutover и миграция production данных не завершены.
- По текущей репозиторной проверке Neon-specific migration runner и Cloudflare deploy configuration в inspected `main` не найдены. Это **не доказывает** отключение внешних сервисов, старого публичного endpoint или GitHub App integration.
- `main` зафиксирован как нез защищённая ветка на момент последней проверки. Нужно определить и настроить разумные правила защиты отдельным согласованным действием; этот план не делает это молча.
- `scripts/migrate-postgres.sh` запускает все неприменённые SQL-файлы из `infrastructure/postgres/migrations/` по лексикографическому порядку. Будущая дата в имени не откладывает выполнение. Всегда проверять весь pending migration set на disposable PostgreSQL.
- Существуют шаблоны backup/systemd, но фактический off-host backup и восстановление реального production dataset на VPS пока не подтверждены.

### 3.2 Product Contour v1

- Основные экраны и категории данных существуют; предмет аудита — не только наличие UI, но соответствие фактических данных контрактам и lineage.
- В предыдущем аудите были зафиксированы вопросы согласования completed/resolved progress, snapshot-scoping factors/scores, lineage scenario definitions/states, полноты evidence-linked sources и freshness payload. Часть последующих исправлений могла уже попасть в `main`; их реальный статус требуется проверить по актуальному коду, а не переносить старый статус без проверки.
- Нужен полный повторный аудит по фактическому `main` и текущим тестам; старый документ сам по себе не является подтверждением сегодняшней готовности.

### 3.3 BTC input readiness

Последний документированный read-only аудит BTC (12 октября) сообщал:

- `market.spot_price`: 2 строки, последнее наблюдение 2026-09-19, stale.
- `security.hashrate`: 2 строки, последнее наблюдение 2026-09-19, stale.
- `security.fee_subsidy_ratio`: 0 строк; нет подтверждённого значения.
- `macro.dxy`: 0 строк; нет подтверждённого значения.
- `institutional.etf_net_flow`: 8 строк, последнее наблюдение 2026-09-18, stale; нет достаточного количества distinct current source-linked days.
- Обнаружено 9 групп дубликатов логического ключа / 18 строк; в каждой группе payload совпадал, но это требует утверждённой процедуры reconciliation, а не автоматического удаления.
- Для circulating supply отсутствовал source URL.
- Candidate manifest и offline checker fee/reward reconciliation были подготовлены в PR #74, однако выполнение checker на исходных raw artifact и подтверждение единиц/семантики остаются отдельными воротами. Не объявлять ratio принятым без raw-unit contract и воспроизводимого прогона.
- Farside ETF source ранее возвращал 403 в runner; пустые ячейки/placeholder `0.0` не считать реальным нулевым потоком. TFTC mirror не становится canonical без утверждения источника. Для DXY нужен допустимый и воспроизводимый источник.

Это снимок на момент аудита, не гарантия неизменности live-данных после этой даты. Перед использованием входов надо повторить актуальную read-only проверку.

### 3.4 Открытые PR на момент подготовки

Ни один PR ниже не считается автоматически нужным, устаревшим или безопасным для merge. Все подлежат этапу 2 — сверке с текущим `main`.

| PR | Тема | Особое внимание при сверке |
|---|---|---|
| [#3](https://github.com/olegsh247-stack/Crypto/pull/3) | Product Contour v1 research data contracts | Проверить текущие контракты и что уже реализовано другими PR/коммитами. |
| [#6](https://github.com/olegsh247-stack/Crypto/pull/6) | Snapshot lineage and web build | Пересечения с API/Web contract fixes; актуальность build-исправлений. |
| [#9](https://github.com/olegsh247-stack/Crypto/pull/9) | Worker London schedule parity | Stacked on PR #3; не смешивать старую правку с focused DST fix. |
| [#10](https://github.com/olegsh247-stack/Crypto/pull/10) | BTC observation provenance/revision | Сверить с текущей схемой, natural key и PR #74. |
| [#11](https://github.com/olegsh247-stack/Crypto/pull/11) | Canonical project sequence | Документ должен быть согласован с настоящим Планом 100; не дублировать конкурирующий главный план. |
| [#13](https://github.com/olegsh247-stack/Crypto/pull/13) | Monitoring timestamps only on evaluation | Проверить, реализовано ли это в `main` и покрыто ли тестами. |
| [#14](https://github.com/olegsh247-stack/Crypto/pull/14) | Neon retirement plan | Сопоставить с текущей архитектурой и Планом 100. |
| [#39](https://github.com/olegsh247-stack/Crypto/pull/39) | Finalized daily candle contract | Проверить фактическую реализацию, tests и перекрытия с Worker/DST. |
| [#63](https://github.com/olegsh247-stack/Crypto/pull/63) | BTC live-input readiness blockers | Сверить с последними source audit и candidate manifest. |
| [#69](https://github.com/olegsh247-stack/Crypto/pull/69) | Opt-in BTC observation collectors | Проверить opt-in boundary, source contracts, idempotency и отсутствие production side effects. |
| [#70](https://github.com/olegsh247-stack/Crypto/pull/70) | Hosting dependency audit | Включает карту зависимостей; должен ссылаться на План 100 и не стать вторым конкурирующим планом. |
| [#71](https://github.com/olegsh247-stack/Crypto/pull/71) | Worker London daily candle boundaries across DST | Имеет шесть regression tests по описанию PR; проверить актуальные checks и реальное отличие от PR #9. |
| [#72](https://github.com/olegsh247-stack/Crypto/pull/72) | Product Contour v1 audit reconciliation | Проверить, что аудит соответствует нынешнему `main`, а не только старому снимку. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) | API/Web research response contract | Базовая ветка для PR #74; проверить build/typecheck и контракты. |
| [#74](https://github.com/olegsh247-stack/Crypto/pull/74) | BTC source contracts and candidate inputs | Stacked on #73; raw artifact checker execution remains required; do not merge before #73 decision. |

Этот список получен по GitHub на момент создания документа и должен быть обновлён на этапе 2. Если PR закрыт/слит или появились новые PR, отражать реальное состояние GitHub.

---

# 4. Исполнительный план по этапам

## Этап 1 — завершить hosting architecture audit

**Цель:** доказать, что именно осталось от Neon/Cloudflare и старого hosted runtime, а целевая архитектура может работать на собственном хостинге без скрытой зависимости.

### 1.1 Репозиторная карта зависимостей

Проверить `main`, все workflow, package manifests, scripts, environment examples, migrations, Docker/Compose, API, Worker, frontend, integrations, docs и GitHub Actions references.

Для каждой зависимости записать:
- имя и назначение;
- категория: runtime, database, build/CI, deploy, DNS/edge, auth/GitHub App, secret, migration, backup/restore, monitoring;
- конкретный файл/строка/настройка;
- используется ли сейчас в `main`, в PR, только в истории или только во внешнем аккаунте;
- риск удаления и требуемое доказательство;
- статус: подтверждено / не найдено в репозитории / требует проверки в аккаунте / завершено.

### 1.2 Neon

- Найти все упоминания, SDK, connection strings by name only, migration actions, database branches, workflows, secrets names, URLs и docs.
- Разделить: target PostgreSQL code, legacy Neon database/project, secret entries, CI references, migration history.
- Проверить, какой endpoint сейчас реально обслуживает public API и какая БД является его источником.
- Не удалять Neon project/database, пока не завершены source backup, target restore, row-count/data parity, API acceptance, rollback window и явное согласие пользователя.

### 1.3 Cloudflare

- Найти source/workflow/config references (Workers, Pages, Wrangler, build hooks, routes, DNS, environment bindings).
- Отдельно подтвердить в Cloudflare dashboard: есть ли Worker/Pages project, привязан ли он к GitHub, включены ли automatic builds, какие routes/domains ведут к старому runtime, какие secrets/bindings существуют.
- Не отключать DNS, route, Worker или GitHub integration без подтверждения текущего трафика и rollback.

### 1.4 GitHub App, CI/CD и branch protection

- В GitHub Settings проверить installed GitHub Apps, repository permissions, webhooks/integrations и их необходимость.
- Секреты проверять по имени и использованию; значения не выводить в логи/чат/документы.
- Отделить CI (build/test) от deploy. Проверить, что `release-gate.yml` не может случайно писать в production и что все вызываемые workflow тоже безопасны.
- Подготовить рекомендуемые правила защиты `main`: запрет force push/deletion, required checks после установления корректных стабильных check names, запрет обхода без явного решения. Изменять settings только после согласования пользователем.

### 1.5 PostgreSQL, migrations, backup

- Подтвердить, что `infrastructure/postgres/` — единственный canonical schema/migrations location.
- Проверить все migration files по порядку, включая файлы с будущей датой; прогнать clean bootstrap и rerun на disposable PostgreSQL.
- Проверить backup format, checksum, retention, off-host copy plan, restore procedure и таблицы/критичные строки.
- Зафиксировать, что тестовый backup/restore в CI не доказывает наличие реального VPS/off-host backup.

### 1.6 Выходные критерии этапа 1

- [ ] Репозиторная dependency map с точными путями и назначением.
- [ ] Состояние Cloudflare Git/Worker/Pages connection проверено в аккаунте или честно оставлено блокером из-за отсутствия доступа.
- [ ] Состояние GitHub Apps/permissions проверено или оставлено блокером.
- [ ] Runtime/DB/CI/deploy/secret boundaries определены.
- [ ] Clean bootstrap + migration rerun + backup/restore на disposable PostgreSQL подтверждены актуальным CI.
- [ ] Известно, что нужно сделать перед VPS, после покупки VPS и перед cutover.
- [ ] Документ обновлён и PR проверен; никаких внешних сервисов не удалено без разрешения.

**Запрет перехода:** если неясно, где обслуживается public endpoint или что делает workflow, нельзя удалять сервисы и нельзя выполнять production cutover.

## Этап 2 — полный PR audit против `main`

**Цель:** убрать неопределённость и не интегрировать устаревшие/пересекающиеся изменения.

### 2.1 Снять актуальный snapshot

- Получить текущий SHA `main`, все open PR, head/base SHA, state, draft, checks, changed files, merge base, зависимости/stacked PR.
- Обновить таблицу PR в `docs/PLAN-100.md`.
- Не использовать старый список PR как постоянный источник истины.

### 2.2 Сравнить каждый PR

Для каждого PR:
1. Прочитать title/body/diff и перечислить точные изменения.
2. Сравнить с текущим `main`: есть ли такой код/документ уже влит другим путём.
3. Проверить CI/statuses, тесты и фактические пути изменения.
4. Проверить stacked base. PR #74, например, зависит от решения по #73; нельзя оценивать/сливать их независимо от этого факта.
5. Определить категорию: `needed`, `partially superseded`, `duplicate`, `stale`, `blocked`, `ready for review`.
6. Для каждой рекомендации указать evidence, риск и безопасное действие.

### 2.3 Сначала аудит — потом интеграция

- Ничего автоматически не объединять и не закрывать.
- Если два PR решают один дефект, выбрать один узкий корректный patch после тестов; не объединять обе реализации вслепую.
- Для документационных PR устранить конкурирующие «главные планы»: План 100 — единственный master plan; остальные документы должны ссылаться на него и оставаться специализированными.
- Отдельно оценить PR #9 vs #71 (London/DST), #3/#6/#72/#73 (Product Contour/API-Web), #10/#63/#69/#74 (BTC inputs/collectors), #11/#14/#70 (project sequence/hosting), #13/#39 (monitoring/candle contracts).

### 2.4 Выходные критерии этапа 2

- [ ] Таблица каждого open PR с категорией и доказательствами.
- [ ] Порядок merge/retarget/rebase определён с учётом stacked branches.
- [ ] Для каждого PR есть решение-рекомендация, но действия выполняются только после явного согласования.
- [ ] В `main` не вносятся массовые или не связанные изменения.
- [ ] Ни один PR не закрыт и не слит автоматически.

## Этап 3 — Product Contour v1 audit

**Цель:** подтвердить, что фактический продукт согласован по API, UI, lifecycle и данным.

### 3.1 API и Web contracts

- Проверить list/detail payload, required/optional fields, HTTP statuses, errors, timestamps, freshness reasons, enums и backwards compatibility.
- Запустить Web build, TypeScript typecheck, API contract tests и route-level E2E на актуальном `main`/кандидатном интеграционном состоянии.
- Убедиться, что UI не подменяет серверные статусы своими несовместимыми расчётами.
- Проверить конфигурацию API base URL, same-origin/CORS, отсутствие старого endpoint fallback.

### 3.2 Research lifecycle и 15 блоков

- Проверить правила `complete`, `n_a`, unresolved и проценты: completed и resolved — разные понятия, подписи должны быть однозначны.
- Проверить published/current snapshot selection и следующий review date.
- Убедиться, что research snapshot не смешивает версии методологии и данных.

### 3.3 Domains, Factors, Scores

- Для каждого фактора и score подтвердить asset, snapshot ID, metric/input lineage, units, direction, thresholds, calculation time и methodology version.
- Проверить отсутствие смешивания исторических и текущих snapshot rows.
- Сверить API response с фактическими DB relations/foreign keys и тестами.
- Проверить null/missing/stale values и то, что UI не изображает неизвестное как ноль/норму.

### 3.4 Scenarios и scenario states

- Определить каноническую связь scenario definition ↔ scenario state ↔ snapshot.
- Проверить Bull/Base/Bear definitions, stable IDs, active published snapshot и source inputs.
- Не соединять state с definition из другой версии snapshot.
- До утверждения evaluation rules показывать отсутствие state как отсутствие state, не фабриковать его.

### 3.5 Monitoring и Events

- Подтвердить, что загрузка свечей/ingestion не обновляет timestamp оценки и не генерирует ложные события.
- Проверить различие `last_ingested_at`, `last_evaluated_at`, `last_event_at`.
- Проверить thresholds, direction, cooldown/deduplication, event provenance и snapshot lineage.
- Проверить, что monitoring signal может быть baseline/описательным и не должен выдаваться за live evaluation без доказательства.

### 3.6 Evidence и sources

- Проверить каждую evidence row: source ID/URL, observation ID, value, unit, period/date, retrieved/observed timestamps, snapshot ID и lineage.
- Проверить sources, ссылающиеся непосредственно из evidence, а не только из observations.
- Проверить недостающие source URLs и evidence без наблюдений.
- Проверить отображение значения и единиц в Web; никакие поля не должны теряться из-за слишком узких типов.

### 3.7 Read-only verification

- Сначала на BTC как основном активе; другие активы использовать только если это требуется для контракта и не превращается в расширение research scope.
- Зафиксировать API outputs, row counts, null rates, snapshot IDs, duplicate groups и lineage.
- Не писать в БД и не запускать ingestion для получения «зелёного» результата.

### 3.8 Выходные критерии этапа 3

- [ ] Матрица API ↔ Web ↔ DB contract завершена.
- [ ] Domains, Factors, Scores привязаны к правильному snapshot.
- [ ] Scenarios и scenario states имеют доказуемую lineage.
- [ ] Monitoring timestamps/events отражают оценку, а не ingestion.
- [ ] Evidence/sources полны и показывают provenance.
- [ ] Build/typecheck/API/Worker/Web E2E прошли на целевой disposable среде.
- [ ] Все остаточные дефекты записаны с приоритетом; критичные контракты закрыты до BTC evaluation.

## Этап 4 — входные данные BTC: контракт и доказательства

**Цель:** собрать один проверяемый набор входов BTC без принятия неподтверждённых значений.

### 4.1 Сформировать канонический реестр входов

Для каждого обязательного input определить:
- metric ID и бизнес-смысл;
- canonical unit и допустимую точность;
- источник и source URL;
- метод сбора/endpoint и ограничения доступа;
- observed timestamp, retrieval timestamp, reporting period, timezone;
- aggregation window и семантику (например, hashrate average period);
- revision/correction semantics;
- freshness TTL и правило stale handling;
- duplicate/natural-key policy;
- null/unknown handling и validation range;
- трансформацию из raw value в canonical value;
- способ независимого воспроизведения.

### 4.2 Минимальные inputs и blockers

- BTC spot price: зарегистрированный market source, `USD/BTC`, observed time и retrieval time, проверка расхождения с независимым источником.
- Hashrate: источник сети, `EH/s`, среднее окно, period end и timestamp. Не сравнивать суточное и недельное среднее как будто это одна метрика.
- Fee/subsidy ratio: зафиксировать точную формулу и raw-unit semantics; согласовать fee/reward rows по height/time; исключить дубликаты; проверить границы окна; выполнить checker на реальном raw artifact.
- US spot ETF net flow: использовать корректно опубликованные reporting days, `USD million/day` или иной явно утверждённый unit, source URL и revision; пустая ячейка не равна нулю; зеркало не считать canonical без решения.
- DXY: выбрать разрешённый/доступный источник и documented timestamp; если нет надёжного источника, вход остаётся blocked/unknown, не заполнять догадкой.
- Supply/subsidy: source lineage для supply; protocol constant и observed metric различать.

### 4.3 Freshness и provenance gate

- Проверить freshness по времени выполнения проверки, а не по времени написания документа.
- Последнее наблюдение stale означает blocker; нельзя fallback-нуться к старому значению, если новое не прошло валидацию.
- Проверить `observed_at` против `retrieved_at`, единицы, timezone, revision, source URL, source availability и plausibility.
- Хранить raw evidence/fingerprint для воспроизводимости.
- Любое преобразование документировать и тестировать.

### 4.4 Дубликаты и конфликтующие записи

- Снять read-only duplicate report по logical/natural key.
- Сравнить все payload/provenance fields; идентичные строки и конфликтные строки разделить.
- На disposable copy воспроизвести утверждённое reconciliation policy.
- Сохранять аудит удалённых/объединённых записей и исходный backup; не выполнять destructive cleanup на source production.
- Добавлять uniqueness constraints только после доказательства, что существующие данные совместимы с ними.

### 4.5 Fee/reward reconciliation

- Скачать оригинальный артефакт конкретного workflow run и подтвердить, что это тот же artifact, fingerprints и schema.
- Запустить `scripts/check-btc-fee-reward-reconciliation.mjs` на исходных JSON, не на вручную перепечатанных примерах.
- Зафиксировать stdout, количество строк, диапазон высот, timestamp alignment, исключённые записи и raw units.
- Независимо подтвердить единицы и формулу. Арифметический ratio не считается accepted input только потому, что программа рассчитала число.
- Обновить candidate manifest и audit docs только после проверки raw artifacts; сохранить candidate status до formal acceptance.

### 4.6 Выходные критерии этапа 4

- [ ] Все обязательные BTC inputs перечислены с контрактом.
- [ ] Каждый принятый input имеет source, unit, timestamps, period/revision и freshness pass.
- [ ] Fee/subsidy ratio воспроизводим из raw artifact и семантика единиц подтверждена.
- [ ] DXY и ETF flow не подменяются догадками/пустыми значениями.
- [ ] Duplicate groups либо устранены по утверждённой процедуре на target copy, либо явно блокируют evaluation.
- [ ] Manifest соответствует реальным raw evidence fingerprints.
- [ ] Незакрытых конфликтов, влияющих на сценарий, нет; иначе этап остаётся blocked.

## Этап 5 — воспроизводимая оценка одного сценария BTC

**Предусловия:** этапы 1–4 закрыты на уровне, необходимом для оценки; входы приняты; API/Worker/Evidence lineage подтверждены.

### 5.1 Зафиксировать evaluation contract

- Определить точный active published snapshot и methodology version.
- Определить сценарий, который оценивается (Base/Bull/Bear) и условия подтверждения/инвалидации.
- Записать формулы, thresholds, directionality, missing-data behavior, freshness cutoffs, weighting, rounding и deterministic tie-breaking.
- Установить входной snapshot/fingerprint и timestamp as-of.
- Зафиксировать версию evaluator и правила интерпретации.

### 5.2 Сначала offline/read-only

- Выполнить evaluation на зафиксированном input bundle без записи в production или целевую DB.
- Повторить запуск с теми же входами и версией; результаты должны совпасть.
- Изменить один input в тесте и проверить ожидаемое изменение/неизменность результата.
- Проверить stale/missing/conflicting inputs: evaluator обязан остановиться или вернуть явно blocked/unknown, а не делать ложную оценку.
- Проверить source lineage от итогового объяснения до raw observation/evidence.

### 5.3 Review результата

- Представить таблицу inputs, sources, timestamps, units, freshness, transforms, thresholds и derived values.
- Объяснить, почему сценарий поддержан/не подтверждён/инвалидирован, какие данные блокируют вывод и какие ограничения остаются.
- Не превращать исследовательскую оценку в инвестиционную гарантию или автоматическую торговую команду.

### 5.4 Persisted evaluation — только после отдельного разрешения

- Сначала тесты на disposable PostgreSQL и проверка идемпотентности.
- Сформировать transaction/rollback design и event deduplication key.
- Только после явного разрешения пользователя допускается отдельная запись scenario state/event в утверждённую среду.
- Ни загрузка источника, ни ingestion свечей не должны сами создавать оценку.

### 5.5 Выходные критерии этапа 5

- [ ] Evaluation воспроизводим и детерминирован.
- [ ] Каждое derived value имеет трассировку к input/source.
- [ ] Missing/stale/conflicting inputs блокируют неверную оценку.
- [ ] Версия snapshot, методики и evaluator записана в артефакте результата.
- [ ] Никакого непредусмотренного persisted state/event.
- [ ] Пользователь рассмотрел результат и ограничения.

## Этап 6 — полная сквозная приёмка BTC

- Проверить API detail payload и UI Asset Dashboard/Deep Research.
- Проверить 15 research blocks, Domains, Factors, Scores, Bull/Base/Bear definitions, Evidence и Monitoring.
- Проверить snapshot lineage на каждом слое.
- Проверить source links, value/units, observed/retrieved timestamps и stale badges.
- Проверить сценарный вывод и объяснение по принятому evaluation contract.
- Проверить, что отсутствие scenario state/event честно отображается до разрешённой записи.
- Выполнить Web build/typecheck, API/Worker contract tests, E2E на disposable PostgreSQL и регрессионные тесты.
- Подготовить приёмочный отчёт с commit SHA, run URLs, результатами и оставшимися ограничениями.

**Gate:** только после этой приёмки разрешено планировать расширение на другие активы/источники.

## Этап 7 — подготовка и запуск собственного VPS

**Предусловие:** реальный VPS предоставлен пользователем и согласован план его конфигурации. До этого не притворяться, что deployment готов.

### 7.1 Host security

- SSH key-only, отдельный deploy user с минимальными правами, firewall, обновления ОС, ограничение административного доступа.
- Не публиковать PostgreSQL/API/Worker напрямую; публично доступны только Caddy 80/443, если это подтверждено Compose и firewall.
- Секреты в файле вне Git с restrictive permissions; не печатать их в логах.
- Настроить домен/DNS/Caddy TLS только после согласования домена и готовности rollback.

### 7.2 Deploy rehearsal

- Сначала чистая PostgreSQL 16 и schema/migrations; проверить повторный запуск.
- Запустить API, Worker, Caddy и backup service; проверить health/readiness, CORS, admin auth, API routes и frontend.
- Проверить расписание Worker, London/UTC boundary, DST, отсутствие overlap и idempotency.
- Проверить логи, graceful shutdown, connection pool, failure/retry policy и отсутствие утечек секретов.

### 7.3 Backup/restore

- Определить RPO/RTO и retention, encryption, off-host destination и доступы.
- Выполнить consistent dump, checksum, encrypted off-host copy.
- Восстановить в отдельную БД и сравнить migration markers, schema, row counts и критичные сущности.
- Проверить автоматический таймер и alert при сбое; одного файла на том же VPS недостаточно.

### 7.4 Выходные критерии этапа 7

- [ ] Host hardening подтверждён.
- [ ] Production Compose публикует только согласованные порты.
- [ ] API/Worker/Web E2E прошли на реальном target VPS до переключения трафика.
- [ ] Backup off-host, checksum и restore проверены.
- [ ] Worker schedule/DST/idempotency проверены.
- [ ] Rollback procedure и доступы проверены.

## Этап 8 — data migration, cutover и стабилизация

- Перед экспортом зафиксировать источник истины, согласовать maintenance window и при необходимости остановить ingestion, чтобы получить согласованный снимок.
- Создать финальный backup/dump и checksum; обеспечить защищённую передачу.
- Restore на VPS; применить только проверенный набор migrations; сверить schema markers и row counts.
- Сравнить критичные данные: assets, sources, observations, candles/history, research snapshots, blocks, domains, factors, scores, scenario definitions/states, evidence, monitoring signals/events.
- Разрешить расхождения до cutover; не удалять дубликаты и не подменять данные молча.
- Проверить read-only parity, health, CORS, auth, API/UI, BTC scenario, Worker schedule, backups и rollback.
- Получить явное согласие пользователя на DNS/traffic switch.
- После переключения наблюдать agreed stabilization window; иметь готовый возврат к старому endpoint.
- Только после стабильного периода, проверенного backup и явного согласия удалять старые сервисы, secrets и интеграции.

## Этап 9 — операционная готовность

- Документировать процедуры: deploy, rollback, restore, migration, secret rotation, incident response, backup verification, health checks.
- Добавить мониторинг ошибок API/Worker, задержек ingestion, последнего успешного evaluation, freshness, backup status и дискового пространства.
- Установить alerting без утечки чувствительных данных.
- Проверить идемпотентность, повторный запуск после сбоя, concurrency/locking, rate limits и external source failures.
- Поддерживать security updates и review dependency changes.
- Проверять branch protection и required CI checks после каждого изменения workflow.
- Ввести релизный checklist и журнал решений.

## Этап 10 — расширение после успешного BTC

Только после подтверждённой сквозной приёмки BTC:

1. Выбрать следующий актив по критериям продуктовой ценности и доступности надёжных данных.
2. Повторить source-contract/freshness/provenance gate до research expansion.
3. Добавлять активы малыми партиями, каждый с собственным snapshot lineage и тестами.
4. Не копировать BTC-specific assumptions туда, где иные units, market structure или source semantics.
5. Расширять research domains/factors/scores/scenarios по утверждённой методике, не меняя silently methodology version.
6. Добавлять сравнительные dashboards только после того, как текущие per-asset contracts надёжны.

## Этап 11 — финальная приёмка проекта

Финальная приёмка проходит как единый review:

- [ ] Hosting audit закрыт; Neon/Cloudflare legacy state отключён только после успешного cutover и explicit approval.
- [ ] Все PR классифицированы; в `main` интегрированы только проверенные нужные изменения; устаревшие PR закрываются только по отдельному решению.
- [ ] Product Contour v1 contract audit закрыт.
- [ ] BTC source input bundle принят, reproducible evaluator проходит, UI объясняет результат.
- [ ] VPS runtime и migration/rollback готовы; data parity и backup/restore доказаны.
- [ ] CI, build, typecheck, contract tests, E2E и repository scan зелёные на соответствующем актуальном SHA.
- [ ] Документы и README соответствуют реальной архитектуре.
- [ ] Secrets inventory не содержит значений секретов; устаревшие secrets удалены после проверки использования.
- [ ] Главный План 100 отражает фактический финальный статус и ссылки на evidence.
- [ ] Пользователь явно подтвердил, что продукт готов.

---

# 5. Как вести работу по Плану 100

Для каждого шага исполнитель обязан сообщать:

1. **Что проверено** — точный scope, branch/SHA, файлы, endpoints или workflow.
2. **Что найдено** — факты и ссылки на доказательства.
3. **Что изменено** — файлы, commit SHA, branch/PR.
4. **Что проверено после изменения** — конкретные команды/checks/run URLs и результат; если не запускалось — прямо так и сказать.
5. **Что осталось** — блокеры, внешние доступы, неизвестные значения.
6. **Следующий шаг** — ровно следующий по порядку пункт плана.

Статусы задач:
- `NOT STARTED` — не начинали.
- `IN PROGRESS` — работа идёт, критерии не выполнены.
- `BLOCKED` — не хватает данных, доступа или решения.
- `READY FOR REVIEW` — доказательства подготовлены, требуется review/согласование.
- `DONE` — все выходные критерии выполнены и подтверждены.

Нельзя помечать `DONE` на основании обещания, документа без проверки, отсутствия ошибки в непроверенном пути или просто наличия PR.


## Current-main reconciliation — 2026-10-13

This addendum supersedes the older open-PR snapshot above where the live GitHub state differs. The initial audit baseline was `8135b6ca2f2e7fe6e458ef5a45634ce70e2b5fa9`; after restoring this plan and correcting the scanner's Markdown policy, the verified current `main` SHA is `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`.

### Stage 1 — hosting/dependency audit evidence

- The current tracked tree is guarded by `scripts/check-vps-only-repository.mjs`; the Build Rehearsal [#458](https://github.com/olegsh247-stack/Crypto/actions/runs/38309007906) on current `main` passed the scan and all subsequent jobs. The earlier run #455 passed before Plan 100 was restored; run #457 initially failed because the strict scanner treated governance Markdown references as active dependencies, which was corrected and then verified by run #458.
- The current target build uses VPS API + Worker + PostgreSQL 16 and production Compose network checks; the same run passed clean PostgreSQL bootstrap, rerun-safe migrations, backup/restore rehearsal, API contract E2E, Worker ingestion E2E and BTC snapshot/evidence lineage E2E.
- The scanner audits current repository paths and non-binary text, not historical Git objects. Git history remains unchanged intentionally.
- The current repository documentation says the VPS has not been purchased/provisioned and the existing public endpoint has not been switched. Therefore production runtime is **not proven self-hosted** and no traffic cutover is authorized.
- Open PR checks still expose external “Workers Builds: crypto-api” check runs (e.g. PRs #69, #71, #72 and #39); this proves a Cloudflare-linked GitHub check/integration remains active for those PRs, but does not by itself prove a deployment or that a particular account resource is still serving traffic.
- External account-level facts (Cloudflare services/routes, GitHub App installation/permissions, DNS/public endpoint ownership, legacy database/service state) remain **BLOCKED pending authorized direct account access**. No claim that external services are disabled.
- Secret inventory documents intended secret names/purposes, not actual repository/org secret values or presence. No secret values were inspected or changed.

### Stage 2 — current open PR inventory and disposition

The live GitHub query returned eight open PRs. Their ahead/behind counts below were computed against comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b` (the verified source tree before the final audit-document-only commits). These are audit dispositions only; no PR was merged or closed.

| PR | Current finding | Disposition |
|---|---|---|
| [#78](https://github.com/olegsh247-stack/Crypto/pull/78) — stale deployment gate docs | Its matrix wording correction is already present on current `main` (commits `968a62f` and `e677197`); branch base is stale. | Redundant as currently proposed (1 commit ahead / 8 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#77](https://github.com/olegsh247-stack/Crypto/pull/77) — repository hygiene workflow | Its workflow trigger change is superseded by current `main`, which now runs on every PR and every branch push; current main rehearsal passed. | Redundant as currently proposed (1 commit ahead / 8 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#76](https://github.com/olegsh247-stack/Crypto/pull/76) — scanner false positives | Uses an older, extension-limited scanner policy; current `main` scanner covers all non-binary text and paths and passed. | Superseded (1 commit ahead / 10 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) — API/Web response types | Its core `research_progress` type correction has been applied directly to current `main` and Web build passed. Its extra API/Web contract tests, scenario type additions, and ETF label change are not yet fully reconciled independently. | Partially superseded. Do not merge stale branch as-is; cherry-pick/reimplement only the useful test/contract pieces after focused review. |
| [#72](https://github.com/olegsh247-stack/Crypto/pull/72) — Product Contour audit reconciliation | Documentation-only reconciliation patch, based on stale `main`; its recorded external Workers build check failed. | Reconcile its claims with current code and current evidence (1 commit ahead / 10 behind; recorded external Workers build check failed); do not merge as-is. |
| [#71](https://github.com/olegsh247-stack/Crypto/pull/71) — London day boundary/DST | A genuine offset-regex defect was confirmed in current main and the focused fix plus six boundary regression cases have now been ported directly to main; current validation is running. | Partially superseded by direct main commits; after CI passes, compare remaining branch-only changes and leave the PR open until user reviews closure. External Workers check is not target-stack validation. |
| [#69](https://github.com/olegsh247-stack/Crypto/pull/69) — opt-in BTC observation collectors | Collector/parser checks and target rehearsal passed on its recorded head; scheduled persistence is documented as disabled by default. DXY remains a source blocker; branch base is stale. | Candidate only after current-main reconciliation and read-only candidate review (15 commits ahead / 25 behind); no production ingestion or merge yet. |
| [#39](https://github.com/olegsh247-stack/Crypto/pull/39) — finalized daily candle contract | Patch targets legacy `workers/crypto-api/src/index.ts`, not the current VPS API path; a Workers build check passed but does not validate target architecture. | Do not merge as-is (2 commits ahead / 187 behind); port/revalidate only if the behavior is still missing from current VPS API. Keep open until user reviews closure. |

### Stage 3 — Product Contour v1 audit evidence

**Update after main commits `b9f9b8d` and `db7e8a7`:** Web build #137 and VPS Build Rehearsal #468 passed for the Web/API response type correction. A separate current-main Worker defect was found during PR reconciliation: London offset parsing used an over-escaped regex. The fix and six regression tests are now on main and passed in [Build Rehearsal #476](https://github.com/olegsh247-stack/Crypto/actions/runs/38311361017) and subsequent [#477](https://github.com/olegsh247-stack/Crypto/actions/runs/38311428159). The initial failing rehearsal correctly exposed the defect; it was fixed and revalidated. The full contour audit remains open for metric-level freshness, live payload and evidence-backed data quality.

- Latest target-stack verification run [Build Rehearsal #462](https://github.com/olegsh247-stack/Crypto/actions/runs/38309250517) succeeded end-to-end after the Product Contour audit update. Its successful steps include: clean PostgreSQL bootstrap and migration rerun, canonical BTC input registry, read-only provenance audit, duplicate/idempotency rehearsal, backup/restore, API contract and mutation-contract E2E, Worker ingestion E2E, offline API invariants, BTC research evidence/snapshot lineage, persisted history/candle finalization and admin boundary E2E.
- This is CI against disposable PostgreSQL and current repository code. It is not a live production API/DB verification and does not refresh production BTC observations.
- Existing audit documentation still records BTC spot, hashrate and ETF flows as stale, fee/subsidy ratio and DXY as missing, and nine duplicate logical-key groups / eighteen rows from the 2026-10-12 read-only source audit. Those observations must be rechecked before use; duplicates are not authorized for deletion.
- The API/Web `research_progress` response type discrepancy was corrected on `main` in commit [`ee9614a`](https://github.com/olegsh247-stack/Crypto/commit/ee9614ab0f68ebde80fb9198f9c3b190fe63d5a7): Web declares `resolved` and `percentage`, matching the VPS API. The Web build passed in [Build Crypto Web #137](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894055); VPS API Build Rehearsal passed in [#468](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894021). This resolves the type/build check for this mismatch. Live public endpoint payload and UI against real serving data remain unverified; no VPS has been provisioned.
- No production writes, ingestion, migration, secret/DNS changes, deployments, traffic cutover, PR merge/closure, or history rewrite was performed by this reconciliation.


## Текущий статус верхнеуровневых этапов

| Этап | Статус на 2026-10-13 | Следующее действие |
|---|---|---|
| 1. Hosting architecture | `REPO AUDIT ACCEPTED; cutover facts deferred` | Self-hosted target stack and scanner verified in CI. Cloudflare/GitHub App/legacy endpoint account-level inspection is deferred and does not block BTC product development; it remains required before disabling legacy resources or switching traffic. No VPS provisioned. |
| 2. PR audit | `IN PROGRESS` | Eight open PRs were reviewed for scope; useful fixes from #73 and #71 are now ported to main and the relevant Web and Worker checks are green. No PR merged or closed. Finish remaining overlap/base-ancestry review; no need to spend further product time on the external Workers check itself. |
| 3. Product Contour v1 | `IN PROGRESS` | The relevant checks passed: [Web build #137](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894055), [Worker DST regression rehearsal #476](https://github.com/olegsh247-stack/Crypto/actions/runs/38311361017), [VPS Build Rehearsal #481](https://github.com/olegsh247-stack/Crypto/actions/runs/38311800274), and read-only source capture [#9](https://github.com/olegsh247-stack/Crypto/actions/runs/38311800272). The progress type/build mismatch and Worker London offset defect are fixed on main. Continue with remaining freshness/type/data lineage checks; live endpoint payload is not verifiable until the legacy endpoint is available through an approved read-only path or VPS is provisioned. |
| 4. BTC source contracts | `IN PROGRESS`, inputs not accepted | 14 Oct: readiness gate enforces approved source IDs and endpoint URL prefixes; registered TFTC cannot substitute for canonical Farside, and an unrelated HTTPS URL cannot pass as source provenance. DXY remains blocked until a specific feed is approved. Spot metric cadence is `event-driven`; 1h is the maximum freshness age, not the source update frequency. New fail-closed gates now also block hashrate until its daily-bucket/aggregation method is approved and fee/subsidy until its versioned calculation method is approved; the raw Mempool fees endpoint is not itself a ratio. Positive-value validation was added for spot/hashrate/DXY and nonnegative validation for the ratio. First CI run exposed a TypeScript empty-array inference error; fixed explicitly. [BTC Scenario Readiness Gate #180](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263731) passed (build + 23 tests). [VPS Build Rehearsal #38583263294](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263294) passed on code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`. [Crypto VPS Release Gate](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263908) remains queued; no release/deployment has occurred. ETF and DXY source blockers remain; no live data query or production DB write. |
| 5. BTC reproducible scenario | `BLOCKED` | Не начинать до закрытия входных blockers и contract audit. |
| 6. BTC end-to-end acceptance | `NOT STARTED` | После воспроизводимой оценки. |
| 7. VPS provisioning/deploy | `BLOCKED` до появления реального VPS | Только локальные/CI rehearsals пока хоста нет. |
| 8. Cutover | `BLOCKED` | Только после VPS, parity, backup/restore и явного разрешения. |
| 9. Operations | `IN PROGRESS` на уровне проектирования, не production-validated | Довести runbooks, alerts и реальные backup tests после provisioning. |
| 10. Asset/research expansion | `NOT STARTED BY DESIGN` | Запрещено до успешного BTC E2E. |
| 11. Final acceptance | `NOT STARTED` | После прохождения всех предыдущих gates. |


### BTC source-gate follow-up — 2026-10-14

- Corrected the spot metric contract: Kraken trades are event-driven; the one-hour gate is freshness, not a forced polling frequency.
- The read-only readiness gate checks the approved source ID and endpoint prefix, not generic registration/HTTPS alone. TFTC cannot silently replace Farside, and DXY remains blocked pending an explicitly reviewed feed and timestamp convention.
- Added fail-closed method gates for hashrate and fee/subsidy. Mempool documents its block-fees endpoint as average total block fees over a selected period ordered oldest-to-newest, but that does not by itself define the product's fee/subsidy ratio or prove the unit/window/denominator. No method ID is approved yet. See [Mempool REST API documentation](https://mempool.space/docs/api/rest).
- Added numeric validation for positive spot/hashrate/DXY values and a nonnegative ratio, plus regression tests. A first CI pass found a TypeScript inference issue in empty method allowlists; it was fixed and the readiness workflow then passed all 23 tests.
- Updated the BTC source contract, acceptance matrix and this Plan 100 status. Changes are repository-only. No live source capture, production database access/write, scenario evaluation, monitoring persistence, deployment or PR merge was performed by this work.
- VPS Build Rehearsal #38583263294 passed for code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`; the Crypto VPS Release Gate remains queued and has not deployed anything.
- **Next:** review the hashrate bucket method and fee/subsidy calculation contract without inventing a formula. ETF access and DXY source choice remain separate blockers.


---

# 6. Главный промт для дальнейшей работы с проектом

Использовать этот текст в начале любой новой сессии по Crypto или когда контекст нужно восстановить:

> Ты работаешь только над проектом Crypto: https://github.com/olegsh247-stack/Crypto. Главный план — «План 100», документ `docs/PLAN-100.md` в репозитории и файл «План 100» в Library проекта. Перед началом работы прочитай актуальную версию документа и проверь текущее состояние GitHub; не полагайся на старые SHA, PR статусы или предположения.
>
> Соблюдай последовательность без самовольных перестановок: (1) закончить hosting architecture audit, включая Neon/Cloudflare/runtime/database/secrets/GitHub Apps/CI/CD/migrations/backups и фактическое состояние legacy public endpoint; (2) сверить каждый открытый PR с текущим `main`, не сливать и не закрывать автоматически; (3) завершить Product Contour v1 audit по API/Web/Worker/sources/domains/factors/scores/scenarios/monitoring/evidence; (4) принять BTC inputs по source provenance, freshness, units, timestamps, aggregation windows, revisions и duplicate/conflict checks; (5) только после этого выполнить один воспроизводимый offline/read-only BTC scenario; (6) провести полную BTC E2E приёмку; (7) после появления VPS провести deploy rehearsal, backup/restore и controlled cutover; (8) только потом расширять активы и исследования.
>
> Не использовать Neon или Cloudflare как целевую runtime-зависимость; при этом не утверждать, что внешние сервисы отключены, пока это не подтверждено в аккаунтах. Не менять production, не запускать production ingestion/migrations, не менять secrets/DNS, не удалять сервисы и не переключать трафик без отдельного явного разрешения. Не создавать scenario state или monitoring event автоматически. Не принимать stale/unknown/missing values, не трактовать пустые значения как нули, не удалять дубликаты без аудита и утверждённой процедуры. Не расширять scope на другие активы до успешного полного BTC пути.
>
> Для каждого изменения: используй актуальный GitHub state, документируй findings, делай узкие изменения, запускай соответствующие проверки, фиксируй commit SHA и PR/run links, обновляй `docs/PLAN-100.md`, и отправляй изменения в GitHub. Чётко различай проверенное, предположение, блокер и то, что ещё не запускалось. Ничего не объявляй DONE без проверяемых критериев. После каждого завершённого шага переходи только к следующему пункту «Плана 100».

---

## 7. История изменений Плана 100

- **2026-10-12 — v1:** создан главный план на основании состояния `main` SHA `115e13995c4ba005545a78033bf4a638b3584c38`, доступной документации хостинга/Product Contour/BTC и списка открытых PR. Статусы — снимок на дату подготовки, а не вечные факты. Обновлять документ при каждом существенном изменении и не забывать синхронизировать Library-копию, когда меняется master prompt или ключевой порядок этапов.

## PR reconciliation follow-up — 2026-10-13

The current review of the eight open PRs is documented in [OPEN-PR-RECONCILIATION-2026-10-13.md](./OPEN-PR-RECONCILIATION-2026-10-13.md). The immediate code follow-up is the narrow API/Web contract gap from PR #73: the progress field names are already corrected in `main`, but the Web types still omit BTC `scenario_readiness` and scenario `snapshot_id`, and dedicated contract coverage should be ported without merging the stale branch wholesale. PR #69 remains blocked by source acceptance; PR #39 targets a legacy API path; PRs #71, #76 and #77 have their core fixes in current main. No PR was merged or closed in this review.

### PR #73 contract follow-up — 2026-10-13

The targeted API/Web contract gap has been ported to `main` in focused commits, rather than merging the stale PR branch wholesale. Web now declares BTC `scenario_readiness` and scenario `snapshot_id`; the API response-shape test and Web compile-time fixture are included in CI. VPS Build Rehearsal #491 and Web Build #139 passed. Release Gate #203 was still in progress at the time of this update. See [open PR reconciliation](./OPEN-PR-RECONCILIATION-2026-10-13.md) and [Product Contour audit](./PRODUCT-CONTOUR-V1-CONTRACT-AUDIT.md).


### BTC source methodology follow-up — 2026-10-14

- Reviewed the official Mempool REST endpoint descriptions against the saved 2026-10-12 raw-capture summary. No live API was queried in this step.
- **Hashrate remains blocked:** the endpoint reference describes figures over a trailing period but does not define the returned series timestamps as bucket start/end or establish the precise smoothing window. The historical 00:00 UTC labels alone do not settle that ambiguity. Do not approve a method ID or substitute the un-timestamped `currentHashrate` field.
- **Fee/subsidy remains blocked:** the aggregate endpoint returns average total block fees over a selected period; the captured 830 rows are not a verified block count and do not establish a matching subsidy denominator. No ratio was calculated.
- Added a candidate method for later review only: total transaction fees divided by protocol subsidy across the same 144 consecutive confirmed block heights, using documented block-level BTC values and preserving the exact height range/method version. It is not approved or implemented; first verify the provider payload supports it. No production source change is authorized.
- ETF/Farside HTTP 403 and DXY's unresolved provider/time convention remain separate blockers. No source substitution was made.
- [BTC source contract](./BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md) records the method review. [BTC Scenario Readiness Gate #180](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263731) passed 23 tests; [VPS Build Rehearsal #1095](https://github.com/olegsh247-stack/Crypto/actions/runs/38583617918) passed. [Crypto VPS Release Gate #207](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263908) also completed successfully as a disposable VPS/PostgreSQL rehearsal (build, migration bootstrap, read-only BTC provenance audit, duplicate rehearsal, backup/restore rehearsal and API E2E); it did not deploy or write to production. These workflows ran on code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`; later commits in this sequence are documentation-only.
- No production database was accessed or written in this step; no live inputs were refreshed, no scenario was evaluated, no monitoring was persisted, and published probabilities remain unchanged. BTC scenario status stays **`not_evaluable`**.
# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 14 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Последний проверенный BTC source-gate code SHA:** `4e6cf4856438437279fe45ac58b5a549a4f472ec`. BTC Scenario Readiness Gate #180 passed (23 tests); VPS Build Rehearsal and Crypto VPS Release Gate for this SHA were still running at the time of this update.  
**Документ в репозитории:** `docs/PLAN-100.md`  
**Назначение:** единый рабочий план от текущего состояния до полной готовности продукта, self-hosted hosting, безопасного cutover и операционной устойчивости.

---

## 0. Короткое решение: что строим и в каком порядке

Мы строим исследовательскую платформу для криптоактивов, которая в целевом состоянии работает на собственном VPS пользователя, использует PostgreSQL и позволяет получать воспроизводимые, проверяемые аналитические результаты с прозрачными источниками, единицами, временными метками, версиями и доказательствами.

**Обязательный порядок приоритетов:**

1. **Hosting architecture и зависимости** — закрепить self-hosted целевую архитектуру в репозитории и CI. Внешнюю проверку Cloudflare/GitHub App/DNS вести отдельно и не блокировать разработку продуктового пути BTC; закрыть её до отключения legacy-сервиса или cutover.
2. **Сверка всех открытых PR с `main`** — установить, что уже реализовано, что дублируется, что устарело, что действительно нужно; ничего автоматически не объединять и не закрывать.
3. **Полный Product Contour v1 audit** — проверить фактические контракты API, Web, Worker, источников, факторов, scores, сценариев, monitoring и Evidence на актуальном коде и доступных read-only данных.
4. **Один полный воспроизводимый сценарий BTC** — только после проверки происхождения, свежести, единиц, временных интервалов, revision/lineage и конфликтов входов. Сначала offline/read-only воспроизведение. Не создавать автоматически состояние сценария или monitoring event.
5. **Приёмка одного сквозного продуктового пути BTC** — пользовательский интерфейс, API-контракты, evidence, snapshot lineage, объяснимый результат и повторяемые тесты.
6. **Подготовка и развёртывание на собственном VPS** — только когда VPS будет реально приобретён/предоставлен. До этого — локальные и CI-репетиции на disposable PostgreSQL; не менять текущий публичный сервис.
7. **Контролируемая миграция и cutover** — backup, restore, parity, acceptance, явное разрешение пользователя, план отката и период наблюдения.
8. **Только после прохождения BTC-сценария** — расширять источники, исследования и активы; не начинать массовое расширение заранее.

План не означает, что все этапы уже сделаны. Статус каждого этапа меняется только на основании проверяемых доказательств, тестов, результатов команд или актуальных данных GitHub.

## 1. Цель и критерий полной готовности

Проект считается полностью готовым не потому, что сборка зелёная или страницы существуют, а когда одновременно выполнены все условия:

- Репозиторий и CI не зависят от Neon/Cloudflare как от обязательной части целевой runtime-архитектуры, и не содержат неучтённых устаревших deployment/migration/secret references.
- Публичный сервис переведён на собственный VPS только после явного согласования, проверки данных и готового rollback.
- PostgreSQL разворачивается с нуля воспроизводимо; миграции имеют проверенный порядок и безопасный повторный запуск; backup и restore реально проверены.
- API, Web и Worker имеют согласованные контракты и проверенную snapshot lineage; lifecycle/freshness и значения прогресса согласованы.
- Источники зарегистрированы и проверяемы; каждое значение имеет понятную метрику, единицы, период/дату наблюдения, время получения, URL/происхождение и, где применимо, revision/aggregation window.
- Дубликаты логических наблюдений исследованы и разрешены только по утверждённому правилу; конфликтные записи не удаляются автоматически.
- Сценарий BTC воспроизводим из зафиксированного набора входов, версии методики и активного published snapshot. Повторный запуск с теми же входами и версией даёт тот же результат.
- Scenario state и monitoring event создаются только явным, протестированным evaluation-процессом, а не обычной загрузкой свечей/данных.
- Сквозные тесты подтверждают API, Web, Worker, evidence, monitoring, безопасность административных операций, расписание, идемпотентность и отсутствие перекрёстного смешивания snapshot.
- Для VPS подтверждены доступность, безопасность сети, off-host backup, восстановление, мониторинг, эксплуатационные инструкции и процедура отката.
- Документация соответствует реальному состоянию. Главный план обновлён, изменения закоммичены и отправлены в GitHub.

## 2. Неприкосновенные правила выполнения

1. **Не менять порядок этапов без прямого решения пользователя.** Если более поздняя задача выглядит привлекательной, но блокирующий ранний этап не закрыт, сначала закрывается блокирующий этап.
2. **Не сливать PR автоматически.** Сначала сравнить с актуальным `main`, проверить CI, зависимости веток и изменения; затем предложить решение. Не закрывать PR без установленной причины.
3. **Не изменять production по умолчанию.** Никаких production writes, ingestion, миграций, секретов, DNS, деплоя, удаления Neon/Cloudflare или переключения трафика без отдельного явного разрешения.
4. **Не выдумывать успешные проверки.** Статический просмотр, локальный тест, CI и live read-only check — разные уровни доказательства; в отчёте указывать, какой именно был выполнен.
5. **Не считать старые данные актуальными только потому, что они есть.** Если последнее значение устарело или не имеет подтверждённого происхождения, не подменять его более старым значением молча.
6. **Не удалять дубликаты автоматически.** Сначала read-only отчёт, сверка payload и происхождения, согласованное правило, backup и проверка на disposable-копии.
7. **Не записывать состояние сценария автоматически.** До утверждения правил и готовности входов допустимы offline-расчёт и read-only проверки; не создавать искусственные scenario state/event ради зелёного теста.
8. **Не расширять охват активов раньше времени.** Сначала один полный путь BTC. SOL, CAKE и другие активы не должны отвлекать от завершения этого пути, кроме строго ограниченных read-only сравнений, если они необходимы для контракта.
9. **Каждое содержательное изменение — документировать и отправлять в GitHub.** Отдельно сообщать commit SHA, ветку/PR и фактический статус проверок.
10. **Не смешивать проект Crypto с `all-tracker` или другими проектами.** Все задачи этого плана относятся только к репозиторию Crypto.
11. **Не путать репозиторную архитектуру с live-инфраструктурой.** Удалённая из Git конфигурация не доказывает, что внешний сервис отключён; зелёная репетиция не доказывает, что VPS существует или production переключён.
12. **Если нет доступа к внешнему аккаунту или VPS, фиксировать это как блокер**, а не утверждать, что проверка завершена.

## 3. Текущая исходная точка (12 октября 2026)

### 3.1 Репозиторий и хостинг

- Репозиторий: https://github.com/olegsh247-stack/Crypto (Public).
- Целевая архитектура по документации: DNS → Caddy/HTTPS → Node.js API → self-hosted PostgreSQL 16; отдельный Node.js Worker; приватная сеть для БД/API/Worker; backup/restore; GitHub Actions для сборки и проверок.
- В `main` имеется `vps/`, `infrastructure/postgres/`, `scripts/migrate-postgres.sh`, `scripts/backup-postgres.sh` и workflow Release Gate для репетиции целевого стека.
- VPS пока не приобретён/не подтверждён как существующий. Развёртывание, DNS cutover и миграция production данных не завершены.
- По текущей репозиторной проверке Neon-specific migration runner и Cloudflare deploy configuration в inspected `main` не найдены. Это **не доказывает** отключение внешних сервисов, старого публичного endpoint или GitHub App integration.
- `main` зафиксирован как нез защищённая ветка на момент последней проверки. Нужно определить и настроить разумные правила защиты отдельным согласованным действием; этот план не делает это молча.
- `scripts/migrate-postgres.sh` запускает все неприменённые SQL-файлы из `infrastructure/postgres/migrations/` по лексикографическому порядку. Будущая дата в имени не откладывает выполнение. Всегда проверять весь pending migration set на disposable PostgreSQL.
- Существуют шаблоны backup/systemd, но фактический off-host backup и восстановление реального production dataset на VPS пока не подтверждены.

### 3.2 Product Contour v1

- Основные экраны и категории данных существуют; предмет аудита — не только наличие UI, но соответствие фактических данных контрактам и lineage.
- В предыдущем аудите были зафиксированы вопросы согласования completed/resolved progress, snapshot-scoping factors/scores, lineage scenario definitions/states, полноты evidence-linked sources и freshness payload. Часть последующих исправлений могла уже попасть в `main`; их реальный статус требуется проверить по актуальному коду, а не переносить старый статус без проверки.
- Нужен полный повторный аудит по фактическому `main` и текущим тестам; старый документ сам по себе не является подтверждением сегодняшней готовности.

### 3.3 BTC input readiness

Последний документированный read-only аудит BTC (12 октября) сообщал:

- `market.spot_price`: 2 строки, последнее наблюдение 2026-09-19, stale.
- `security.hashrate`: 2 строки, последнее наблюдение 2026-09-19, stale.
- `security.fee_subsidy_ratio`: 0 строк; нет подтверждённого значения.
- `macro.dxy`: 0 строк; нет подтверждённого значения.
- `institutional.etf_net_flow`: 8 строк, последнее наблюдение 2026-09-18, stale; нет достаточного количества distinct current source-linked days.
- Обнаружено 9 групп дубликатов логического ключа / 18 строк; в каждой группе payload совпадал, но это требует утверждённой процедуры reconciliation, а не автоматического удаления.
- Для circulating supply отсутствовал source URL.
- Candidate manifest и offline checker fee/reward reconciliation были подготовлены в PR #74, однако выполнение checker на исходных raw artifact и подтверждение единиц/семантики остаются отдельными воротами. Не объявлять ratio принятым без raw-unit contract и воспроизводимого прогона.
- Farside ETF source ранее возвращал 403 в runner; пустые ячейки/placeholder `0.0` не считать реальным нулевым потоком. TFTC mirror не становится canonical без утверждения источника. Для DXY нужен допустимый и воспроизводимый источник.

Это снимок на момент аудита, не гарантия неизменности live-данных после этой даты. Перед использованием входов надо повторить актуальную read-only проверку.

### 3.4 Открытые PR на момент подготовки

Ни один PR ниже не считается автоматически нужным, устаревшим или безопасным для merge. Все подлежат этапу 2 — сверке с текущим `main`.

| PR | Тема | Особое внимание при сверке |
|---|---|---|
| [#3](https://github.com/olegsh247-stack/Crypto/pull/3) | Product Contour v1 research data contracts | Проверить текущие контракты и что уже реализовано другими PR/коммитами. |
| [#6](https://github.com/olegsh247-stack/Crypto/pull/6) | Snapshot lineage and web build | Пересечения с API/Web contract fixes; актуальность build-исправлений. |
| [#9](https://github.com/olegsh247-stack/Crypto/pull/9) | Worker London schedule parity | Stacked on PR #3; не смешивать старую правку с focused DST fix. |
| [#10](https://github.com/olegsh247-stack/Crypto/pull/10) | BTC observation provenance/revision | Сверить с текущей схемой, natural key и PR #74. |
| [#11](https://github.com/olegsh247-stack/Crypto/pull/11) | Canonical project sequence | Документ должен быть согласован с настоящим Планом 100; не дублировать конкурирующий главный план. |
| [#13](https://github.com/olegsh247-stack/Crypto/pull/13) | Monitoring timestamps only on evaluation | Проверить, реализовано ли это в `main` и покрыто ли тестами. |
| [#14](https://github.com/olegsh247-stack/Crypto/pull/14) | Neon retirement plan | Сопоставить с текущей архитектурой и Планом 100. |
| [#39](https://github.com/olegsh247-stack/Crypto/pull/39) | Finalized daily candle contract | Проверить фактическую реализацию, tests и перекрытия с Worker/DST. |
| [#63](https://github.com/olegsh247-stack/Crypto/pull/63) | BTC live-input readiness blockers | Сверить с последними source audit и candidate manifest. |
| [#69](https://github.com/olegsh247-stack/Crypto/pull/69) | Opt-in BTC observation collectors | Проверить opt-in boundary, source contracts, idempotency и отсутствие production side effects. |
| [#70](https://github.com/olegsh247-stack/Crypto/pull/70) | Hosting dependency audit | Включает карту зависимостей; должен ссылаться на План 100 и не стать вторым конкурирующим планом. |
| [#71](https://github.com/olegsh247-stack/Crypto/pull/71) | Worker London daily candle boundaries across DST | Имеет шесть regression tests по описанию PR; проверить актуальные checks и реальное отличие от PR #9. |
| [#72](https://github.com/olegsh247-stack/Crypto/pull/72) | Product Contour v1 audit reconciliation | Проверить, что аудит соответствует нынешнему `main`, а не только старому снимку. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) | API/Web research response contract | Базовая ветка для PR #74; проверить build/typecheck и контракты. |
| [#74](https://github.com/olegsh247-stack/Crypto/pull/74) | BTC source contracts and candidate inputs | Stacked on #73; raw artifact checker execution remains required; do not merge before #73 decision. |

Этот список получен по GitHub на момент создания документа и должен быть обновлён на этапе 2. Если PR закрыт/слит или появились новые PR, отражать реальное состояние GitHub.

---

# 4. Исполнительный план по этапам

## Этап 1 — завершить hosting architecture audit

**Цель:** доказать, что именно осталось от Neon/Cloudflare и старого hosted runtime, а целевая архитектура может работать на собственном хостинге без скрытой зависимости.

### 1.1 Репозиторная карта зависимостей

Проверить `main`, все workflow, package manifests, scripts, environment examples, migrations, Docker/Compose, API, Worker, frontend, integrations, docs и GitHub Actions references.

Для каждой зависимости записать:
- имя и назначение;
- категория: runtime, database, build/CI, deploy, DNS/edge, auth/GitHub App, secret, migration, backup/restore, monitoring;
- конкретный файл/строка/настройка;
- используется ли сейчас в `main`, в PR, только в истории или только во внешнем аккаунте;
- риск удаления и требуемое доказательство;
- статус: подтверждено / не найдено в репозитории / требует проверки в аккаунте / завершено.

### 1.2 Neon

- Найти все упоминания, SDK, connection strings by name only, migration actions, database branches, workflows, secrets names, URLs и docs.
- Разделить: target PostgreSQL code, legacy Neon database/project, secret entries, CI references, migration history.
- Проверить, какой endpoint сейчас реально обслуживает public API и какая БД является его источником.
- Не удалять Neon project/database, пока не завершены source backup, target restore, row-count/data parity, API acceptance, rollback window и явное согласие пользователя.

### 1.3 Cloudflare

- Найти source/workflow/config references (Workers, Pages, Wrangler, build hooks, routes, DNS, environment bindings).
- Отдельно подтвердить в Cloudflare dashboard: есть ли Worker/Pages project, привязан ли он к GitHub, включены ли automatic builds, какие routes/domains ведут к старому runtime, какие secrets/bindings существуют.
- Не отключать DNS, route, Worker или GitHub integration без подтверждения текущего трафика и rollback.

### 1.4 GitHub App, CI/CD и branch protection

- В GitHub Settings проверить installed GitHub Apps, repository permissions, webhooks/integrations и их необходимость.
- Секреты проверять по имени и использованию; значения не выводить в логи/чат/документы.
- Отделить CI (build/test) от deploy. Проверить, что `release-gate.yml` не может случайно писать в production и что все вызываемые workflow тоже безопасны.
- Подготовить рекомендуемые правила защиты `main`: запрет force push/deletion, required checks после установления корректных стабильных check names, запрет обхода без явного решения. Изменять settings только после согласования пользователем.

### 1.5 PostgreSQL, migrations, backup

- Подтвердить, что `infrastructure/postgres/` — единственный canonical schema/migrations location.
- Проверить все migration files по порядку, включая файлы с будущей датой; прогнать clean bootstrap и rerun на disposable PostgreSQL.
- Проверить backup format, checksum, retention, off-host copy plan, restore procedure и таблицы/критичные строки.
- Зафиксировать, что тестовый backup/restore в CI не доказывает наличие реального VPS/off-host backup.

### 1.6 Выходные критерии этапа 1

- [ ] Репозиторная dependency map с точными путями и назначением.
- [ ] Состояние Cloudflare Git/Worker/Pages connection проверено в аккаунте или честно оставлено блокером из-за отсутствия доступа.
- [ ] Состояние GitHub Apps/permissions проверено или оставлено блокером.
- [ ] Runtime/DB/CI/deploy/secret boundaries определены.
- [ ] Clean bootstrap + migration rerun + backup/restore на disposable PostgreSQL подтверждены актуальным CI.
- [ ] Известно, что нужно сделать перед VPS, после покупки VPS и перед cutover.
- [ ] Документ обновлён и PR проверен; никаких внешних сервисов не удалено без разрешения.

**Запрет перехода:** если неясно, где обслуживается public endpoint или что делает workflow, нельзя удалять сервисы и нельзя выполнять production cutover.

## Этап 2 — полный PR audit против `main`

**Цель:** убрать неопределённость и не интегрировать устаревшие/пересекающиеся изменения.

### 2.1 Снять актуальный snapshot

- Получить текущий SHA `main`, все open PR, head/base SHA, state, draft, checks, changed files, merge base, зависимости/stacked PR.
- Обновить таблицу PR в `docs/PLAN-100.md`.
- Не использовать старый список PR как постоянный источник истины.

### 2.2 Сравнить каждый PR

Для каждого PR:
1. Прочитать title/body/diff и перечислить точные изменения.
2. Сравнить с текущим `main`: есть ли такой код/документ уже влит другим путём.
3. Проверить CI/statuses, тесты и фактические пути изменения.
4. Проверить stacked base. PR #74, например, зависит от решения по #73; нельзя оценивать/сливать их независимо от этого факта.
5. Определить категорию: `needed`, `partially superseded`, `duplicate`, `stale`, `blocked`, `ready for review`.
6. Для каждой рекомендации указать evidence, риск и безопасное действие.

### 2.3 Сначала аудит — потом интеграция

- Ничего автоматически не объединять и не закрывать.
- Если два PR решают один дефект, выбрать один узкий корректный patch после тестов; не объединять обе реализации вслепую.
- Для документационных PR устранить конкурирующие «главные планы»: План 100 — единственный master plan; остальные документы должны ссылаться на него и оставаться специализированными.
- Отдельно оценить PR #9 vs #71 (London/DST), #3/#6/#72/#73 (Product Contour/API-Web), #10/#63/#69/#74 (BTC inputs/collectors), #11/#14/#70 (project sequence/hosting), #13/#39 (monitoring/candle contracts).

### 2.4 Выходные критерии этапа 2

- [ ] Таблица каждого open PR с категорией и доказательствами.
- [ ] Порядок merge/retarget/rebase определён с учётом stacked branches.
- [ ] Для каждого PR есть решение-рекомендация, но действия выполняются только после явного согласования.
- [ ] В `main` не вносятся массовые или не связанные изменения.
- [ ] Ни один PR не закрыт и не слит автоматически.

## Этап 3 — Product Contour v1 audit

**Цель:** подтвердить, что фактический продукт согласован по API, UI, lifecycle и данным.

### 3.1 API и Web contracts

- Проверить list/detail payload, required/optional fields, HTTP statuses, errors, timestamps, freshness reasons, enums и backwards compatibility.
- Запустить Web build, TypeScript typecheck, API contract tests и route-level E2E на актуальном `main`/кандидатном интеграционном состоянии.
- Убедиться, что UI не подменяет серверные статусы своими несовместимыми расчётами.
- Проверить конфигурацию API base URL, same-origin/CORS, отсутствие старого endpoint fallback.

### 3.2 Research lifecycle и 15 блоков

- Проверить правила `complete`, `n_a`, unresolved и проценты: completed и resolved — разные понятия, подписи должны быть однозначны.
- Проверить published/current snapshot selection и следующий review date.
- Убедиться, что research snapshot не смешивает версии методологии и данных.

### 3.3 Domains, Factors, Scores

- Для каждого фактора и score подтвердить asset, snapshot ID, metric/input lineage, units, direction, thresholds, calculation time и methodology version.
- Проверить отсутствие смешивания исторических и текущих snapshot rows.
- Сверить API response с фактическими DB relations/foreign keys и тестами.
- Проверить null/missing/stale values и то, что UI не изображает неизвестное как ноль/норму.

### 3.4 Scenarios и scenario states

- Определить каноническую связь scenario definition ↔ scenario state ↔ snapshot.
- Проверить Bull/Base/Bear definitions, stable IDs, active published snapshot и source inputs.
- Не соединять state с definition из другой версии snapshot.
- До утверждения evaluation rules показывать отсутствие state как отсутствие state, не фабриковать его.

### 3.5 Monitoring и Events

- Подтвердить, что загрузка свечей/ingestion не обновляет timestamp оценки и не генерирует ложные события.
- Проверить различие `last_ingested_at`, `last_evaluated_at`, `last_event_at`.
- Проверить thresholds, direction, cooldown/deduplication, event provenance и snapshot lineage.
- Проверить, что monitoring signal может быть baseline/описательным и не должен выдаваться за live evaluation без доказательства.

### 3.6 Evidence и sources

- Проверить каждую evidence row: source ID/URL, observation ID, value, unit, period/date, retrieved/observed timestamps, snapshot ID и lineage.
- Проверить sources, ссылающиеся непосредственно из evidence, а не только из observations.
- Проверить недостающие source URLs и evidence без наблюдений.
- Проверить отображение значения и единиц в Web; никакие поля не должны теряться из-за слишком узких типов.

### 3.7 Read-only verification

- Сначала на BTC как основном активе; другие активы использовать только если это требуется для контракта и не превращается в расширение research scope.
- Зафиксировать API outputs, row counts, null rates, snapshot IDs, duplicate groups и lineage.
- Не писать в БД и не запускать ingestion для получения «зелёного» результата.

### 3.8 Выходные критерии этапа 3

- [ ] Матрица API ↔ Web ↔ DB contract завершена.
- [ ] Domains, Factors, Scores привязаны к правильному snapshot.
- [ ] Scenarios и scenario states имеют доказуемую lineage.
- [ ] Monitoring timestamps/events отражают оценку, а не ingestion.
- [ ] Evidence/sources полны и показывают provenance.
- [ ] Build/typecheck/API/Worker/Web E2E прошли на целевой disposable среде.
- [ ] Все остаточные дефекты записаны с приоритетом; критичные контракты закрыты до BTC evaluation.

## Этап 4 — входные данные BTC: контракт и доказательства

**Цель:** собрать один проверяемый набор входов BTC без принятия неподтверждённых значений.

### 4.1 Сформировать канонический реестр входов

Для каждого обязательного input определить:
- metric ID и бизнес-смысл;
- canonical unit и допустимую точность;
- источник и source URL;
- метод сбора/endpoint и ограничения доступа;
- observed timestamp, retrieval timestamp, reporting period, timezone;
- aggregation window и семантику (например, hashrate average period);
- revision/correction semantics;
- freshness TTL и правило stale handling;
- duplicate/natural-key policy;
- null/unknown handling и validation range;
- трансформацию из raw value в canonical value;
- способ независимого воспроизведения.

### 4.2 Минимальные inputs и blockers

- BTC spot price: зарегистрированный market source, `USD/BTC`, observed time и retrieval time, проверка расхождения с независимым источником.
- Hashrate: источник сети, `EH/s`, среднее окно, period end и timestamp. Не сравнивать суточное и недельное среднее как будто это одна метрика.
- Fee/subsidy ratio: зафиксировать точную формулу и raw-unit semantics; согласовать fee/reward rows по height/time; исключить дубликаты; проверить границы окна; выполнить checker на реальном raw artifact.
- US spot ETF net flow: использовать корректно опубликованные reporting days, `USD million/day` или иной явно утверждённый unit, source URL и revision; пустая ячейка не равна нулю; зеркало не считать canonical без решения.
- DXY: выбрать разрешённый/доступный источник и documented timestamp; если нет надёжного источника, вход остаётся blocked/unknown, не заполнять догадкой.
- Supply/subsidy: source lineage для supply; protocol constant и observed metric различать.

### 4.3 Freshness и provenance gate

- Проверить freshness по времени выполнения проверки, а не по времени написания документа.
- Последнее наблюдение stale означает blocker; нельзя fallback-нуться к старому значению, если новое не прошло валидацию.
- Проверить `observed_at` против `retrieved_at`, единицы, timezone, revision, source URL, source availability и plausibility.
- Хранить raw evidence/fingerprint для воспроизводимости.
- Любое преобразование документировать и тестировать.

### 4.4 Дубликаты и конфликтующие записи

- Снять read-only duplicate report по logical/natural key.
- Сравнить все payload/provenance fields; идентичные строки и конфликтные строки разделить.
- На disposable copy воспроизвести утверждённое reconciliation policy.
- Сохранять аудит удалённых/объединённых записей и исходный backup; не выполнять destructive cleanup на source production.
- Добавлять uniqueness constraints только после доказательства, что существующие данные совместимы с ними.

### 4.5 Fee/reward reconciliation

- Скачать оригинальный артефакт конкретного workflow run и подтвердить, что это тот же artifact, fingerprints и schema.
- Запустить `scripts/check-btc-fee-reward-reconciliation.mjs` на исходных JSON, не на вручную перепечатанных примерах.
- Зафиксировать stdout, количество строк, диапазон высот, timestamp alignment, исключённые записи и raw units.
- Независимо подтвердить единицы и формулу. Арифметический ratio не считается accepted input только потому, что программа рассчитала число.
- Обновить candidate manifest и audit docs только после проверки raw artifacts; сохранить candidate status до formal acceptance.

### 4.6 Выходные критерии этапа 4

- [ ] Все обязательные BTC inputs перечислены с контрактом.
- [ ] Каждый принятый input имеет source, unit, timestamps, period/revision и freshness pass.
- [ ] Fee/subsidy ratio воспроизводим из raw artifact и семантика единиц подтверждена.
- [ ] DXY и ETF flow не подменяются догадками/пустыми значениями.
- [ ] Duplicate groups либо устранены по утверждённой процедуре на target copy, либо явно блокируют evaluation.
- [ ] Manifest соответствует реальным raw evidence fingerprints.
- [ ] Незакрытых конфликтов, влияющих на сценарий, нет; иначе этап остаётся blocked.

## Этап 5 — воспроизводимая оценка одного сценария BTC

**Предусловия:** этапы 1–4 закрыты на уровне, необходимом для оценки; входы приняты; API/Worker/Evidence lineage подтверждены.

### 5.1 Зафиксировать evaluation contract

- Определить точный active published snapshot и methodology version.
- Определить сценарий, который оценивается (Base/Bull/Bear) и условия подтверждения/инвалидации.
- Записать формулы, thresholds, directionality, missing-data behavior, freshness cutoffs, weighting, rounding и deterministic tie-breaking.
- Установить входной snapshot/fingerprint и timestamp as-of.
- Зафиксировать версию evaluator и правила интерпретации.

### 5.2 Сначала offline/read-only

- Выполнить evaluation на зафиксированном input bundle без записи в production или целевую DB.
- Повторить запуск с теми же входами и версией; результаты должны совпасть.
- Изменить один input в тесте и проверить ожидаемое изменение/неизменность результата.
- Проверить stale/missing/conflicting inputs: evaluator обязан остановиться или вернуть явно blocked/unknown, а не делать ложную оценку.
- Проверить source lineage от итогового объяснения до raw observation/evidence.

### 5.3 Review результата

- Представить таблицу inputs, sources, timestamps, units, freshness, transforms, thresholds и derived values.
- Объяснить, почему сценарий поддержан/не подтверждён/инвалидирован, какие данные блокируют вывод и какие ограничения остаются.
- Не превращать исследовательскую оценку в инвестиционную гарантию или автоматическую торговую команду.

### 5.4 Persisted evaluation — только после отдельного разрешения

- Сначала тесты на disposable PostgreSQL и проверка идемпотентности.
- Сформировать transaction/rollback design и event deduplication key.
- Только после явного разрешения пользователя допускается отдельная запись scenario state/event в утверждённую среду.
- Ни загрузка источника, ни ingestion свечей не должны сами создавать оценку.

### 5.5 Выходные критерии этапа 5

- [ ] Evaluation воспроизводим и детерминирован.
- [ ] Каждое derived value имеет трассировку к input/source.
- [ ] Missing/stale/conflicting inputs блокируют неверную оценку.
- [ ] Версия snapshot, методики и evaluator записана в артефакте результата.
- [ ] Никакого непредусмотренного persisted state/event.
- [ ] Пользователь рассмотрел результат и ограничения.

## Этап 6 — полная сквозная приёмка BTC

- Проверить API detail payload и UI Asset Dashboard/Deep Research.
- Проверить 15 research blocks, Domains, Factors, Scores, Bull/Base/Bear definitions, Evidence и Monitoring.
- Проверить snapshot lineage на каждом слое.
- Проверить source links, value/units, observed/retrieved timestamps и stale badges.
- Проверить сценарный вывод и объяснение по принятому evaluation contract.
- Проверить, что отсутствие scenario state/event честно отображается до разрешённой записи.
- Выполнить Web build/typecheck, API/Worker contract tests, E2E на disposable PostgreSQL и регрессионные тесты.
- Подготовить приёмочный отчёт с commit SHA, run URLs, результатами и оставшимися ограничениями.

**Gate:** только после этой приёмки разрешено планировать расширение на другие активы/источники.

## Этап 7 — подготовка и запуск собственного VPS

**Предусловие:** реальный VPS предоставлен пользователем и согласован план его конфигурации. До этого не притворяться, что deployment готов.

### 7.1 Host security

- SSH key-only, отдельный deploy user с минимальными правами, firewall, обновления ОС, ограничение административного доступа.
- Не публиковать PostgreSQL/API/Worker напрямую; публично доступны только Caddy 80/443, если это подтверждено Compose и firewall.
- Секреты в файле вне Git с restrictive permissions; не печатать их в логах.
- Настроить домен/DNS/Caddy TLS только после согласования домена и готовности rollback.

### 7.2 Deploy rehearsal

- Сначала чистая PostgreSQL 16 и schema/migrations; проверить повторный запуск.
- Запустить API, Worker, Caddy и backup service; проверить health/readiness, CORS, admin auth, API routes и frontend.
- Проверить расписание Worker, London/UTC boundary, DST, отсутствие overlap и idempotency.
- Проверить логи, graceful shutdown, connection pool, failure/retry policy и отсутствие утечек секретов.

### 7.3 Backup/restore

- Определить RPO/RTO и retention, encryption, off-host destination и доступы.
- Выполнить consistent dump, checksum, encrypted off-host copy.
- Восстановить в отдельную БД и сравнить migration markers, schema, row counts и критичные сущности.
- Проверить автоматический таймер и alert при сбое; одного файла на том же VPS недостаточно.

### 7.4 Выходные критерии этапа 7

- [ ] Host hardening подтверждён.
- [ ] Production Compose публикует только согласованные порты.
- [ ] API/Worker/Web E2E прошли на реальном target VPS до переключения трафика.
- [ ] Backup off-host, checksum и restore проверены.
- [ ] Worker schedule/DST/idempotency проверены.
- [ ] Rollback procedure и доступы проверены.

## Этап 8 — data migration, cutover и стабилизация

- Перед экспортом зафиксировать источник истины, согласовать maintenance window и при необходимости остановить ingestion, чтобы получить согласованный снимок.
- Создать финальный backup/dump и checksum; обеспечить защищённую передачу.
- Restore на VPS; применить только проверенный набор migrations; сверить schema markers и row counts.
- Сравнить критичные данные: assets, sources, observations, candles/history, research snapshots, blocks, domains, factors, scores, scenario definitions/states, evidence, monitoring signals/events.
- Разрешить расхождения до cutover; не удалять дубликаты и не подменять данные молча.
- Проверить read-only parity, health, CORS, auth, API/UI, BTC scenario, Worker schedule, backups и rollback.
- Получить явное согласие пользователя на DNS/traffic switch.
- После переключения наблюдать agreed stabilization window; иметь готовый возврат к старому endpoint.
- Только после стабильного периода, проверенного backup и явного согласия удалять старые сервисы, secrets и интеграции.

## Этап 9 — операционная готовность

- Документировать процедуры: deploy, rollback, restore, migration, secret rotation, incident response, backup verification, health checks.
- Добавить мониторинг ошибок API/Worker, задержек ingestion, последнего успешного evaluation, freshness, backup status и дискового пространства.
- Установить alerting без утечки чувствительных данных.
- Проверить идемпотентность, повторный запуск после сбоя, concurrency/locking, rate limits и external source failures.
- Поддерживать security updates и review dependency changes.
- Проверять branch protection и required CI checks после каждого изменения workflow.
- Ввести релизный checklist и журнал решений.

## Этап 10 — расширение после успешного BTC

Только после подтверждённой сквозной приёмки BTC:

1. Выбрать следующий актив по критериям продуктовой ценности и доступности надёжных данных.
2. Повторить source-contract/freshness/provenance gate до research expansion.
3. Добавлять активы малыми партиями, каждый с собственным snapshot lineage и тестами.
4. Не копировать BTC-specific assumptions туда, где иные units, market structure или source semantics.
5. Расширять research domains/factors/scores/scenarios по утверждённой методике, не меняя silently methodology version.
6. Добавлять сравнительные dashboards только после того, как текущие per-asset contracts надёжны.

## Этап 11 — финальная приёмка проекта

Финальная приёмка проходит как единый review:

- [ ] Hosting audit закрыт; Neon/Cloudflare legacy state отключён только после успешного cutover и explicit approval.
- [ ] Все PR классифицированы; в `main` интегрированы только проверенные нужные изменения; устаревшие PR закрываются только по отдельному решению.
- [ ] Product Contour v1 contract audit закрыт.
- [ ] BTC source input bundle принят, reproducible evaluator проходит, UI объясняет результат.
- [ ] VPS runtime и migration/rollback готовы; data parity и backup/restore доказаны.
- [ ] CI, build, typecheck, contract tests, E2E и repository scan зелёные на соответствующем актуальном SHA.
- [ ] Документы и README соответствуют реальной архитектуре.
- [ ] Secrets inventory не содержит значений секретов; устаревшие secrets удалены после проверки использования.
- [ ] Главный План 100 отражает фактический финальный статус и ссылки на evidence.
- [ ] Пользователь явно подтвердил, что продукт готов.

---

# 5. Как вести работу по Плану 100

Для каждого шага исполнитель обязан сообщать:

1. **Что проверено** — точный scope, branch/SHA, файлы, endpoints или workflow.
2. **Что найдено** — факты и ссылки на доказательства.
3. **Что изменено** — файлы, commit SHA, branch/PR.
4. **Что проверено после изменения** — конкретные команды/checks/run URLs и результат; если не запускалось — прямо так и сказать.
5. **Что осталось** — блокеры, внешние доступы, неизвестные значения.
6. **Следующий шаг** — ровно следующий по порядку пункт плана.

Статусы задач:
- `NOT STARTED` — не начинали.
- `IN PROGRESS` — работа идёт, критерии не выполнены.
- `BLOCKED` — не хватает данных, доступа или решения.
- `READY FOR REVIEW` — доказательства подготовлены, требуется review/согласование.
- `DONE` — все выходные критерии выполнены и подтверждены.

Нельзя помечать `DONE` на основании обещания, документа без проверки, отсутствия ошибки в непроверенном пути или просто наличия PR.


## Current-main reconciliation — 2026-10-13

This addendum supersedes the older open-PR snapshot above where the live GitHub state differs. The initial audit baseline was `8135b6ca2f2e7fe6e458ef5a45634ce70e2b5fa9`; after restoring this plan and correcting the scanner's Markdown policy, the verified current `main` SHA is `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`.

### Stage 1 — hosting/dependency audit evidence

- The current tracked tree is guarded by `scripts/check-vps-only-repository.mjs`; the Build Rehearsal [#458](https://github.com/olegsh247-stack/Crypto/actions/runs/38309007906) on current `main` passed the scan and all subsequent jobs. The earlier run #455 passed before Plan 100 was restored; run #457 initially failed because the strict scanner treated governance Markdown references as active dependencies, which was corrected and then verified by run #458.
- The current target build uses VPS API + Worker + PostgreSQL 16 and production Compose network checks; the same run passed clean PostgreSQL bootstrap, rerun-safe migrations, backup/restore rehearsal, API contract E2E, Worker ingestion E2E and BTC snapshot/evidence lineage E2E.
- The scanner audits current repository paths and non-binary text, not historical Git objects. Git history remains unchanged intentionally.
- The current repository documentation says the VPS has not been purchased/provisioned and the existing public endpoint has not been switched. Therefore production runtime is **not proven self-hosted** and no traffic cutover is authorized.
- Open PR checks still expose external “Workers Builds: crypto-api” check runs (e.g. PRs #69, #71, #72 and #39); this proves a Cloudflare-linked GitHub check/integration remains active for those PRs, but does not by itself prove a deployment or that a particular account resource is still serving traffic.
- External account-level facts (Cloudflare services/routes, GitHub App installation/permissions, DNS/public endpoint ownership, legacy database/service state) remain **BLOCKED pending authorized direct account access**. No claim that external services are disabled.
- Secret inventory documents intended secret names/purposes, not actual repository/org secret values or presence. No secret values were inspected or changed.

### Stage 2 — current open PR inventory and disposition

The live GitHub query returned eight open PRs. Their ahead/behind counts below were computed against comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b` (the verified source tree before the final audit-document-only commits). These are audit dispositions only; no PR was merged or closed.

| PR | Current finding | Disposition |
|---|---|---|
| [#78](https://github.com/olegsh247-stack/Crypto/pull/78) — stale deployment gate docs | Its matrix wording correction is already present on current `main` (commits `968a62f` and `e677197`); branch base is stale. | Redundant as currently proposed (1 commit ahead / 8 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#77](https://github.com/olegsh247-stack/Crypto/pull/77) — repository hygiene workflow | Its workflow trigger change is superseded by current `main`, which now runs on every PR and every branch push; current main rehearsal passed. | Redundant as currently proposed (1 commit ahead / 8 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#76](https://github.com/olegsh247-stack/Crypto/pull/76) — scanner false positives | Uses an older, extension-limited scanner policy; current `main` scanner covers all non-binary text and paths and passed. | Superseded (1 commit ahead / 10 behind comparison baseline `dca1b3b78552b43246f05be8cf7c9c17b92bd56b`); do not merge as-is. Keep open until user reviews closure. |
| [#73](https://github.com/olegsh247-stack/Crypto/pull/73) — API/Web response types | Its core `research_progress` type correction has been applied directly to current `main` and Web build passed. Its extra API/Web contract tests, scenario type additions, and ETF label change are not yet fully reconciled independently. | Partially superseded. Do not merge stale branch as-is; cherry-pick/reimplement only the useful test/contract pieces after focused review. |
| [#72](https://github.com/olegsh247-stack/Crypto/pull/72) — Product Contour audit reconciliation | Documentation-only reconciliation patch, based on stale `main`; its recorded external Workers build check failed. | Reconcile its claims with current code and current evidence (1 commit ahead / 10 behind; recorded external Workers build check failed); do not merge as-is. |
| [#71](https://github.com/olegsh247-stack/Crypto/pull/71) — London day boundary/DST | A genuine offset-regex defect was confirmed in current main and the focused fix plus six boundary regression cases have now been ported directly to main; current validation is running. | Partially superseded by direct main commits; after CI passes, compare remaining branch-only changes and leave the PR open until user reviews closure. External Workers check is not target-stack validation. |
| [#69](https://github.com/olegsh247-stack/Crypto/pull/69) — opt-in BTC observation collectors | Collector/parser checks and target rehearsal passed on its recorded head; scheduled persistence is documented as disabled by default. DXY remains a source blocker; branch base is stale. | Candidate only after current-main reconciliation and read-only candidate review (15 commits ahead / 25 behind); no production ingestion or merge yet. |
| [#39](https://github.com/olegsh247-stack/Crypto/pull/39) — finalized daily candle contract | Patch targets legacy `workers/crypto-api/src/index.ts`, not the current VPS API path; a Workers build check passed but does not validate target architecture. | Do not merge as-is (2 commits ahead / 187 behind); port/revalidate only if the behavior is still missing from current VPS API. Keep open until user reviews closure. |

### Stage 3 — Product Contour v1 audit evidence

**Update after main commits `b9f9b8d` and `db7e8a7`:** Web build #137 and VPS Build Rehearsal #468 passed for the Web/API response type correction. A separate current-main Worker defect was found during PR reconciliation: London offset parsing used an over-escaped regex. The fix and six regression tests are now on main and passed in [Build Rehearsal #476](https://github.com/olegsh247-stack/Crypto/actions/runs/38311361017) and subsequent [#477](https://github.com/olegsh247-stack/Crypto/actions/runs/38311428159). The initial failing rehearsal correctly exposed the defect; it was fixed and revalidated. The full contour audit remains open for metric-level freshness, live payload and evidence-backed data quality.

- Latest target-stack verification run [Build Rehearsal #462](https://github.com/olegsh247-stack/Crypto/actions/runs/38309250517) succeeded end-to-end after the Product Contour audit update. Its successful steps include: clean PostgreSQL bootstrap and migration rerun, canonical BTC input registry, read-only provenance audit, duplicate/idempotency rehearsal, backup/restore, API contract and mutation-contract E2E, Worker ingestion E2E, offline API invariants, BTC research evidence/snapshot lineage, persisted history/candle finalization and admin boundary E2E.
- This is CI against disposable PostgreSQL and current repository code. It is not a live production API/DB verification and does not refresh production BTC observations.
- Existing audit documentation still records BTC spot, hashrate and ETF flows as stale, fee/subsidy ratio and DXY as missing, and nine duplicate logical-key groups / eighteen rows from the 2026-10-12 read-only source audit. Those observations must be rechecked before use; duplicates are not authorized for deletion.
- The API/Web `research_progress` response type discrepancy was corrected on `main` in commit [`ee9614a`](https://github.com/olegsh247-stack/Crypto/commit/ee9614ab0f68ebde80fb9198f9c3b190fe63d5a7): Web declares `resolved` and `percentage`, matching the VPS API. The Web build passed in [Build Crypto Web #137](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894055); VPS API Build Rehearsal passed in [#468](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894021). This resolves the type/build check for this mismatch. Live public endpoint payload and UI against real serving data remain unverified; no VPS has been provisioned.
- No production writes, ingestion, migration, secret/DNS changes, deployments, traffic cutover, PR merge/closure, or history rewrite was performed by this reconciliation.


## Текущий статус верхнеуровневых этапов

| Этап | Статус на 2026-10-13 | Следующее действие |
|---|---|---|
| 1. Hosting architecture | `REPO AUDIT ACCEPTED; cutover facts deferred` | Self-hosted target stack and scanner verified in CI. Cloudflare/GitHub App/legacy endpoint account-level inspection is deferred and does not block BTC product development; it remains required before disabling legacy resources or switching traffic. No VPS provisioned. |
| 2. PR audit | `IN PROGRESS` | Eight open PRs were reviewed for scope; useful fixes from #73 and #71 are now ported to main and the relevant Web and Worker checks are green. No PR merged or closed. Finish remaining overlap/base-ancestry review; no need to spend further product time on the external Workers check itself. |
| 3. Product Contour v1 | `IN PROGRESS` | The relevant checks passed: [Web build #137](https://github.com/olegsh247-stack/Crypto/actions/runs/38310894055), [Worker DST regression rehearsal #476](https://github.com/olegsh247-stack/Crypto/actions/runs/38311361017), [VPS Build Rehearsal #481](https://github.com/olegsh247-stack/Crypto/actions/runs/38311800274), and read-only source capture [#9](https://github.com/olegsh247-stack/Crypto/actions/runs/38311800272). The progress type/build mismatch and Worker London offset defect are fixed on main. Continue with remaining freshness/type/data lineage checks; live endpoint payload is not verifiable until the legacy endpoint is available through an approved read-only path or VPS is provisioned. |
| 4. BTC source contracts | `IN PROGRESS`, inputs not accepted | 14 Oct: readiness gate enforces approved source IDs and endpoint URL prefixes; registered TFTC cannot substitute for canonical Farside, and an unrelated HTTPS URL cannot pass as source provenance. DXY remains blocked until a specific feed is approved. Spot metric cadence is `event-driven`; 1h is the maximum freshness age, not the source update frequency. New fail-closed gates now also block hashrate until its daily-bucket/aggregation method is approved and fee/subsidy until its versioned calculation method is approved; the raw Mempool fees endpoint is not itself a ratio. Positive-value validation was added for spot/hashrate/DXY and nonnegative validation for the ratio. First CI run exposed a TypeScript empty-array inference error; fixed explicitly. [BTC Scenario Readiness Gate #180](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263731) passed (build + 23 tests). [VPS Build Rehearsal #38583263294](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263294) passed on code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`. [Crypto VPS Release Gate](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263908) remains queued; no release/deployment has occurred. ETF and DXY source blockers remain; no live data query or production DB write. |
| 5. BTC reproducible scenario | `BLOCKED` | Не начинать до закрытия входных blockers и contract audit. |
| 6. BTC end-to-end acceptance | `NOT STARTED` | После воспроизводимой оценки. |
| 7. VPS provisioning/deploy | `BLOCKED` до появления реального VPS | Только локальные/CI rehearsals пока хоста нет. |
| 8. Cutover | `BLOCKED` | Только после VPS, parity, backup/restore и явного разрешения. |
| 9. Operations | `IN PROGRESS` на уровне проектирования, не production-validated | Довести runbooks, alerts и реальные backup tests после provisioning. |
| 10. Asset/research expansion | `NOT STARTED BY DESIGN` | Запрещено до успешного BTC E2E. |
| 11. Final acceptance | `NOT STARTED` | После прохождения всех предыдущих gates. |


### BTC source-gate follow-up — 2026-10-14

- Corrected the spot metric contract: Kraken trades are event-driven; the one-hour gate is freshness, not a forced polling frequency.
- The read-only readiness gate checks the approved source ID and endpoint prefix, not generic registration/HTTPS alone. TFTC cannot silently replace Farside, and DXY remains blocked pending an explicitly reviewed feed and timestamp convention.
- Added fail-closed method gates for hashrate and fee/subsidy. Mempool documents its block-fees endpoint as average total block fees over a selected period ordered oldest-to-newest, but that does not by itself define the product's fee/subsidy ratio or prove the unit/window/denominator. No method ID is approved yet. See [Mempool REST API documentation](https://mempool.space/docs/api/rest).
- Added numeric validation for positive spot/hashrate/DXY values and a nonnegative ratio, plus regression tests. A first CI pass found a TypeScript inference issue in empty method allowlists; it was fixed and the readiness workflow then passed all 23 tests.
- Updated the BTC source contract, acceptance matrix and this Plan 100 status. Changes are repository-only. No live source capture, production database access/write, scenario evaluation, monitoring persistence, deployment or PR merge was performed by this work.
- VPS Build Rehearsal #38583263294 passed for code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`; the Crypto VPS Release Gate remains queued and has not deployed anything.
- **Next:** review the hashrate bucket method and fee/subsidy calculation contract without inventing a formula. ETF access and DXY source choice remain separate blockers.


---

# 6. Главный промт для дальнейшей работы с проектом

Использовать этот текст в начале любой новой сессии по Crypto или когда контекст нужно восстановить:

> Ты работаешь только над проектом Crypto: https://github.com/olegsh247-stack/Crypto. Главный план — «План 100», документ `docs/PLAN-100.md` в репозитории и файл «План 100» в Library проекта. Перед началом работы прочитай актуальную версию документа и проверь текущее состояние GitHub; не полагайся на старые SHA, PR статусы или предположения.
>
> Соблюдай последовательность без самовольных перестановок: (1) закончить hosting architecture audit, включая Neon/Cloudflare/runtime/database/secrets/GitHub Apps/CI/CD/migrations/backups и фактическое состояние legacy public endpoint; (2) сверить каждый открытый PR с текущим `main`, не сливать и не закрывать автоматически; (3) завершить Product Contour v1 audit по API/Web/Worker/sources/domains/factors/scores/scenarios/monitoring/evidence; (4) принять BTC inputs по source provenance, freshness, units, timestamps, aggregation windows, revisions и duplicate/conflict checks; (5) только после этого выполнить один воспроизводимый offline/read-only BTC scenario; (6) провести полную BTC E2E приёмку; (7) после появления VPS провести deploy rehearsal, backup/restore и controlled cutover; (8) только потом расширять активы и исследования.
>
> Не использовать Neon или Cloudflare как целевую runtime-зависимость; при этом не утверждать, что внешние сервисы отключены, пока это не подтверждено в аккаунтах. Не менять production, не запускать production ingestion/migrations, не менять secrets/DNS, не удалять сервисы и не переключать трафик без отдельного явного разрешения. Не создавать scenario state или monitoring event автоматически. Не принимать stale/unknown/missing values, не трактовать пустые значения как нули, не удалять дубликаты без аудита и утверждённой процедуры. Не расширять scope на другие активы до успешного полного BTC пути.
>
> Для каждого изменения: используй актуальный GitHub state, документируй findings, делай узкие изменения, запускай соответствующие проверки, фиксируй commit SHA и PR/run links, обновляй `docs/PLAN-100.md`, и отправляй изменения в GitHub. Чётко различай проверенное, предположение, блокер и то, что ещё не запускалось. Ничего не объявляй DONE без проверяемых критериев. После каждого завершённого шага переходи только к следующему пункту «Плана 100».

---

## 7. История изменений Плана 100

- **2026-10-12 — v1:** создан главный план на основании состояния `main` SHA `115e13995c4ba005545a78033bf4a638b3584c38`, доступной документации хостинга/Product Contour/BTC и списка открытых PR. Статусы — снимок на дату подготовки, а не вечные факты. Обновлять документ при каждом существенном изменении и не забывать синхронизировать Library-копию, когда меняется master prompt или ключевой порядок этапов.

## PR reconciliation follow-up — 2026-10-13

The current review of the eight open PRs is documented in [OPEN-PR-RECONCILIATION-2026-10-13.md](./OPEN-PR-RECONCILIATION-2026-10-13.md). The immediate code follow-up is the narrow API/Web contract gap from PR #73: the progress field names are already corrected in `main`, but the Web types still omit BTC `scenario_readiness` and scenario `snapshot_id`, and dedicated contract coverage should be ported without merging the stale branch wholesale. PR #69 remains blocked by source acceptance; PR #39 targets a legacy API path; PRs #71, #76 and #77 have their core fixes in current main. No PR was merged or closed in this review.

### PR #73 contract follow-up — 2026-10-13

The targeted API/Web contract gap has been ported to `main` in focused commits, rather than merging the stale PR branch wholesale. Web now declares BTC `scenario_readiness` and scenario `snapshot_id`; the API response-shape test and Web compile-time fixture are included in CI. VPS Build Rehearsal #491 and Web Build #139 passed. Release Gate #203 was still in progress at the time of this update. See [open PR reconciliation](./OPEN-PR-RECONCILIATION-2026-10-13.md) and [Product Contour audit](./PRODUCT-CONTOUR-V1-CONTRACT-AUDIT.md).


### BTC source methodology follow-up — 2026-10-14

- Reviewed the official Mempool REST endpoint descriptions against the saved 2026-10-12 raw-capture summary. No live API was queried in this step.
- **Hashrate remains blocked:** the endpoint reference describes figures over a trailing period but does not define the returned series timestamps as bucket start/end or establish the precise smoothing window. The historical 00:00 UTC labels alone do not settle that ambiguity. Do not approve a method ID or substitute the un-timestamped `currentHashrate` field.
- **Fee/subsidy remains blocked:** the aggregate endpoint returns average total block fees over a selected period; the captured 830 rows are not a verified block count and do not establish a matching subsidy denominator. No ratio was calculated.
- Added a candidate method for later review only: total transaction fees divided by protocol subsidy across the same 144 consecutive confirmed block heights, using documented block-level BTC values and preserving the exact height range/method version. It is not approved or implemented; first verify the provider payload supports it. No production source change is authorized.
- ETF/Farside HTTP 403 and DXY's unresolved provider/time convention remain separate blockers. No source substitution was made.
- [BTC source contract](./BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md) records the method review. [BTC Scenario Readiness Gate #180](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263731) passed 23 tests; [VPS Build Rehearsal #1095](https://github.com/olegsh247-stack/Crypto/actions/runs/38583617918) passed. [Crypto VPS Release Gate #207](https://github.com/olegsh247-stack/Crypto/actions/runs/38583263908) also completed successfully as a disposable VPS/PostgreSQL rehearsal (build, migration bootstrap, read-only BTC provenance audit, duplicate rehearsal, backup/restore rehearsal and API E2E); it did not deploy or write to production. These workflows ran on code SHA `4e6cf4856438437279fe45ac58b5a549a4f472ec`; later commits in this sequence are documentation-only.
- No production database was accessed or written in this step; no live inputs were refreshed, no scenario was evaluated, no monitoring was persisted, and published probabilities remain unchanged. BTC scenario status stays **`not_evaluable`**.


### BTC input-source semantics — 2026-10-14 (upstream implementation review)

- The latest VPS Build Rehearsal runs #1096 and #1097 passed on documentation commits: [#1096](https://github.com/olegsh247-stack/Crypto/actions/runs/38584432278), [#1097](https://github.com/olegsh247-stack/Crypto/actions/runs/38584463406). These are build/rehearsal checks, not live-source or production checks.
- Reviewed Mempool upstream code. Daily hashrate points are generated for the UTC day preceding their timestamp; the timestamp is the UTC-midnight **end boundary**. `currentHashrate` is a different estimate over the last 1,008 blocks. Hashrate remains blocked pending confirmation that the public service's deployed version matches the reviewed implementation and a fresh observation.
- The fees endpoint is confirmed by source code to return time-bucket averages (`avgFees`, `avgHeight`, `timestamp`), not one row per block. Do not treat 144 rows as a 144-block window.
- Next fee/subsidy candidate for investigation is Mempool's `/api/v1/mining/reward-stats/144`, which aggregates the latest 144 non-stale blocks in upstream code. It is not approved yet; validate public response units, height continuity, total-reward semantics, reorg behavior, and the exact subsidy denominator before adopting it.
- Updated [BTC source contract](./BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md) and [acceptance matrix](./BTC-SOURCE-ACCEPTANCE-MATRIX-2026-10-13.md). No live API queried, no database access/write, no input refresh, no scenario evaluation or monitoring persistence; ETF/Farside and DXY remain separate blockers; BTC remains `not_evaluable`.


### BTC reward-stats candidate review — 2026-10-14

- Rechecked VPS API Build Rehearsal runs: #1099 and #1100 completed successfully. See [#1099](https://github.com/olegsh247-stack/Crypto/actions/runs/38586353227) and [#1100](https://github.com/olegsh247-stack/Crypto/actions/runs/38586357044). These validate the documentation commits/build workflow only, not source freshness or production readiness.
- Reviewed Mempool's upstream `BlocksRepository.$getBlockStats`: `reward-stats/:blockCount` selects up to N rows where `stale = 0`, orders by height descending, then returns `MIN(height)`, `MAX(height)`, `SUM(reward)`, `SUM(fees)`, and `SUM(tx_count)`. The query does not itself prove that all heights in the requested interval are present and consecutive, and the public REST description does not document numeric units or fully define the meaning of `reward`.
- Decision: keep this endpoint as a candidate only. Do not infer that `totalReward` is a verified BTC-denominated total coinbase reward from the REST summary alone, do not calculate a ratio from it, and do not approve a methodology ID. Required next checks: deployed-version parity, response schema and units, reward-versus-fees semantics, exact selected-height continuity/canonicality, reorg handling, and a defensible subsidy denominator for the same exact heights.
- Hashrate timestamp semantics are clarified in source code but still need deployed-version parity and a fresh observation. ETF/Farside access and DXY source/time convention remain independent blockers.
- No live endpoint was called; no data was refreshed, staged or written to a database; no scenario or monitoring state was evaluated or persisted. BTC remains `not_evaluable`.


### Reward-stats response-schema follow-up — 2026-10-14

- Rechecked CI: VPS API Build Rehearsal #1101, #1102 and #1103 all completed successfully: [#1101](https://github.com/olegsh247-stack/Crypto/actions/runs/38586798822), [#1102](https://github.com/olegsh247-stack/Crypto/actions/runs/38586810854), [#1103](https://github.com/olegsh247-stack/Crypto/actions/runs/38586823731). These are repository build/rehearsal checks only.
- Reviewed Mempool's documented GET /v1/mining/reward-stats/:blockCount example. It returns startBlock, endBlock, and numeric-string fields totalReward, totalFee, totalTx; the documentation says it covers the past requested block count but does not state the units of the reward/fee sums. Example magnitudes are consistent with satoshis but are not an explicit unit contract, so do not hardcode that assumption.
- The upstream SQL selects the most recent N rows with stale = 0, but returns only min/max height and sums. It does not prove all heights in the selection are consecutive. The query alone also does not establish deployed-version parity or the exact subsidy denominator.
- Decision unchanged: endpoint remains a candidate, not an accepted source/method. No ratio calculated and no method ID approved. Next required evidence: explicit unit semantics from implementation/data model, public deployment parity, consecutive canonical heights, reorg/revision handling, and a protocol-subsidy schedule for those same heights. Hashrate, ETF/Farside and DXY blockers remain independent.
- No live endpoint was called; no data was refreshed or written; BTC remains not_evaluable.

### Reward-stats upstream field semantics — 2026-10-14
- Source-code review established the upstream model semantics: `backend/src/api/blocks.ts` calculates `extras.reward` as the sum of coinbase transaction outputs and populates `extras.totalFees` from Bitcoin Core block stats `totalfee`. `BlocksRepository` persists those fields; `reward-stats` sums `reward` and `fees` over rows marked `stale = 0`. Mempool's block UI renders both values through satoshi-aware amount components. References: [blocks.ts](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/backend/src/api/blocks.ts), [BlocksRepository.ts](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/backend/src/repositories/BlocksRepository.ts), [block display](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/frontend/src/app/components/block/block.component.html).
- For the reviewed upstream revision, `totalReward` is a satoshi-denominated sum of total coinbase payouts (subsidy + fees), not subsidy alone; `totalFee` is a satoshi-denominated sum of fees. This resolves the upstream model-level unit/meaning question, but does **not** prove the public service runs this exact revision.
- Decision: candidate remains unaccepted. Still require public deployed-version parity; proof the selected canonical heights are consecutive (the aggregate query returns min/max only, not the full height set); reorg/revision handling; and protocol subsidy for those same exact heights. No ratio calculated and no method ID approved. No live endpoint or database accessed.

### Reward-stats continuity review — 2026-10-14
- Rechecked CI: VPS API Build Rehearsal runs #1107, #1108 and #1109 all completed successfully. Latest doc-only commit currently has green rehearsal.
- Further source review confirms the aggregate query selects up to N non-stale rows sorted by height descending, but returns only minimum/maximum heights and sums. It does not return the selected-row count or the height list; therefore the aggregate response alone cannot prove exact consecutive coverage. Upstream repository code has a block-by-height lookup constrained to `stale = 0`, which is a stronger candidate for an auditable per-height capture, because each record can carry height, hash/timestamp, reward and fees. This remains a design candidate only; no live API request was made.
- Next method-design direction: prefer a block-level window with an explicit expected height list, one record per height, canonical hash/timestamp, reward/fees in sats, and a documented subsidy-by-height schedule. Verify gaps, duplicates, stale/canonical conflicts and reorg revisions before computing any aggregate. Do not adopt the aggregate `reward-stats/144` endpoint as the sole evidence for continuity. Public deployment parity remains unverified; fee/subsidy stays blocked and BTC remains not_evaluable. ETF/Farside and DXY blockers remain independent.


## BTC indicator utility decision — 2026-10-14

**Purpose:** keep only indicators that answer a defined research question for the first BTC scenario. An available metric is not automatically a useful scenario input. This is a research-scope decision; it does not approve any source capture, calculation method, live input, or scenario evaluation.

| Indicator | Research question / actual value | Decision for the first BTC scenario | Calculation decision |
|---|---|---|---|
| market.spot_price | What price level is the scenario anchored to, and what was the source-observed price at the evaluation time? | **Keep as required context/input.** It is the reference market state, but a spot quote by itself does not prove a bullish or bearish thesis. Preserve source time and retrieval time; respect the event-driven source cadence and 1-hour maximum age. | No new derived indicator. Use the verified source observation only after freshness/provenance validation. |
| institutional.etf_net_flow | Is there observable net institutional demand or withdrawal across completed reporting days? This directly relates to the current scenario's institutional-catalyst thesis. | **Keep as a core scenario factor.** Require the canonical Farside source unless a source-priority change is explicitly reviewed. A failed fetch, dash, missing cell, or placeholder is not zero. | Calculate only a clearly defined sum/trend over distinct completed reporting dates after canonical source, units, revisions and missing-day semantics pass. Currently blocked; do not substitute TFTC silently. |
| macro.dxy | Is broad US-dollar strength/weakness a relevant macro headwind or tailwind for the BTC thesis? | **Keep as a core macro factor, conditionally.** The current thesis explicitly has macro sensitivity, so leaving DXY unknown must be visible and can block a complete evaluation. DXY is contextual, not a standalone BTC price signal. | No calculation until a specific feed, observation convention, timezone and source ID/endpoint are approved. Do not substitute a different USD index. |
| security.hashrate | Is the network's estimated mining/security participation materially changing over its defined observation window? | **Keep as contextual network-health evidence, not a default directional score input.** It can flag a network/security regime change, but ordinary hashrate movement does not establish near-term price direction. It should block evaluation only if the scenario explicitly depends on network security/miner conditions. | No new derived score. First define the daily interval and verify source deployment parity/freshness; compare like-for-like periods only. |
| security.fee_subsidy_ratio | How much do transaction fees contribute relative to protocol issuance subsidy, as a long-horizon view of miner revenue/security-budget composition? | **Defer from the required input set for the first BTC scenario.** It is a legitimate network-economics research metric, but it is indirect for the current institutional/macro-catalyst scenario and a short window can be noisy. Do not keep it merely because a collector or endpoint exists. Revisit only if a documented mining-economics/security thesis needs it. | **Do not calculate now.** No ratio, window, method ID or denominator is approved. The per-block source contract work can be retained as research groundwork, but must not block the first scenario unless the thesis is deliberately expanded to include miner economics. |

### Resulting scope rule

For the first BTC scenario, prioritize a verified price anchor, canonical completed-day ETF flow evidence, and a specifically sourced DXY observation because the existing thesis explicitly includes institutional and macro catalysts. Keep hashrate as supporting network-health evidence unless the scenario rules explicitly make it decisive. Defer fee/subsidy ratio and its aggregation implementation until a concrete research question requires it.

This decision does **not** mean the scenario can be evaluated today: price data must be refreshed and validated through approved staging; ETF provenance/access and the DXY source contract remain blockers; and freshness, units, source lineage, reporting windows, duplicates and revision rules must pass. The scope change is implemented in the readiness gate, metric registry and tests; the VPS E2E assertion was also aligned with this scope. BTC remains not_evaluable. Do not alter published probabilities, persist scenario state, perform production ingestion or change database state as part of this work.


### BTC indicator scope implementation — 2026-10-14

- Implemented the scope decision in the shared read-only readiness gate: spot price and the existing ETF/DXY checks remain relevant; hashrate is no longer a mandatory directional input; fee/subsidy ratio is no longer a required readiness input.
- Updated tests to assert that missing hashrate or fee/subsidy data does not block the first scenario, while source-provenance validation still applies to required inputs.
- Updated the metric registry to mark fee/subsidy ratio as manual and on-demand, with no active freshness expectation while deferred. The metric definition and source research are retained for possible later miner-economics work.
- This is not a declaration that the scenario is ready: DXY source approval and ETF evidence gates remain. No probabilities, persisted scenario state, production data, ingestion, deployment or database state were changed.
- VPS API / PostgreSQL / backup / E2E rehearsals #1122, #1123, #1124, #1125 and #1126 passed after correcting the stale E2E assertion that still required fee/subsidy. The current main head `23e4232f` also passed VPS Build Rehearsal #1136; see [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38604493446).


### Exchange price-source review — 2026-10-14

- Binance, OKX and Bybit are accepted as candidates for independent market-data corroboration; do not blend their values into a synthetic BTC/USD quote.
- Kraken XBT/USD trades remain the canonical price candidate for now because the trade record has a source event timestamp and USD quote currency. Acceptance still requires a controlled raw capture.
- The other exchanges' common spot pairs are BTC/USDT. USDT must not be silently treated as USD; compare those records separately unless an explicit, timestamp-aligned conversion contract or distinct metric is approved. Preserve venue, pair, units, event time, retrieval time and raw-payload lineage.
- DXY remains blocked until a specific accessible provider endpoint and daily observation-time convention are approved. ICE is the index administrator, but no accessible project-ready feed has been accepted. Do not substitute a broad USD index.
- Next: complete the read-only multi-exchange staging contract, validate canonical ETF evidence/access and DXY feed options, then run source/freshness/unit/duplicate checks. Only after all mandatory gates pass may the reviewed offline BTC rule be evaluated. No production ingestion, state persistence, probability change or deployment is included.

### Read-only BTC exchange capture — 2026-10-14

- The public-source capture workflow passed at [run #61](https://github.com/olegsh247-stack/Crypto/actions/runs/38601923755); raw responses and the manifest are retained in [artifact 11912919926](https://github.com/olegsh247-stack/Crypto/actions/runs/38601923755/artifacts/11912919926).
- Kraken captured an XBT/USD trade at 81,826.70 USD/BTC, observed 16:53:33.584 UTC. OKX captured a BTC-USDT trade at 81,914.10 USDT/BTC, observed 16:53:33.741 UTC. These are separate observations with different quote units; no synthetic quote or cross-unit spread was calculated.
- Binance returned HTTP 451 and Bybit HTTP 403 from the GitHub runner; Farside returned HTTP 403. These are runner access results, not proof that the providers are universally unavailable. TFTC JSON returned HTTP 200 but remains an unapproved ETF mirror candidate.
- Permanent capture summary: [docs/data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json). Source-contract interpretation and caveats are recorded in docs/BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md.
- Still blocked: canonical ETF input (source access, lineage and observation-time contract), DXY provider/time convention, and acceptance of the actual current price observation through the input gate. BTC stays not_evaluable. No database ingestion, production write, scenario state, monitoring event, probability update or deployment was performed.


### DXY source boundary and exchange gate tests — 2026-10-14

- ICE is confirmed as administrator of DXY, and its published methodology defines the official close as the last calculated index level disseminated for the index business day. This establishes candidate observation semantics, but not project access to a licensed feed. Registry entry `macro.ice_dxy_candidate` is documentation-only and unapproved; it is not in `macro.dxy` source priority. DXY remains blocked until an accessible endpoint, access terms, actual response and timestamp contract are verified.
- FRED `DTWEXBGS` is the Nominal Broad U.S. Dollar Index, not DXY, so it must not be used as a silent substitute.
- Added readiness tests that explicitly reject registered Binance, OKX and Bybit trade observations as the canonical spot-price input. BTC Scenario Readiness Gate #186 passed (see [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38604259925)). These exchanges remain independent BTC/USDT cross-check candidates; Kraken XBT/USD remains the canonical candidate.
- Updated source registry descriptions and source-contract documentation. No production source-priority change, ingestion, database write, scenario evaluation, probability change or deployment occurred.
- Next in sequence: complete the current VPS rehearsal; then continue the canonical ETF source investigation (Farside access, TFTC lineage/reconciliation and a defensible source observation/publication timestamp). Keep DXY as a separate blocker. Only after both input contracts and the current spot observation pass their gates may the offline BTC rule be evaluated.


### ETF source investigation — SoSoValue API candidate — 2026-10-14

- In addition to Farside (canonical but HTTP 403 from the runner) and TFTC (reconciliation candidate with a material 7 Oct discrepancy and no exact publication timestamp), the source registry now records the official SoSoValue ETF Summary History API as a candidate.
- Documented endpoint: `GET https://openapi.sosovalue.com/openapi/v1/etfs/summary-history?symbol=BTC&country_code=US`. It requires an `x-soso-api-key`, provides daily `total_net_inflow` in USD and a trading-date label, and only supports the latest month. No API key was available or queried in this task.
- The API documentation does not yet prove an exact publication/finalization timestamp or complete/revision semantics. SoSoValue remains candidate-only and is not in metric `source_priority`; the readiness gate still rejects it until response shape, time convention, revisions, units and reconciliation against other sources are validated.
- Official docs: [SoSoValue/SoDEX ETF Summary History API](https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/summary-history). Source-registry and source-contract updates are committed. No source priority, production data or scenario state was changed.
- CI verified on current main head `23e4232f`: [BTC Scenario Readiness Gate #188 passed](https://github.com/olegsh247-stack/Crypto/actions/runs/38604442941) and [VPS Build Rehearsal #1136 passed](https://github.com/olegsh247-stack/Crypto/actions/runs/38604493446). The registry/documentation changes are build-green; this does not clear the ETF/DXY/data-acceptance blockers.


### ETF reporting-date contract — 2026-10-14

- Tightened the shared read-only BTC readiness gate: an ETF flow row must carry explicit `period_start` (provider trading/reporting date). The gate no longer falls back to `observed_at`, which represents observation/publication time and must not be used to invent a trading session.
- Historical ETF rows count toward the five-session minimum only when their explicit reporting dates are valid, non-future and within the 14-day window. The latest row must independently pass the existing 36-hour freshness gate.
- Added a regression test that removes `period_start` but leaves `observed_at` current; the row must fail readiness. Source-contract documentation now explains the distinction between reporting date, observation time and retrieval time.
- Files changed: `vps/shared/src/btc-scenario-readiness.ts`, `scripts/btc-scenario-readiness.test.mjs`, `docs/BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md`. Code commit: [`32d2bccb`](https://github.com/olegsh247-stack/Crypto/commit/32d2bccbc5828fe4610031f7fca68d0f639afd45); regression test commit: [`c37daddf`](https://github.com/olegsh247-stack/Crypto/commit/c37daddf9ab661b744267a70e0a72d67388b4193).
- This change is contract hardening only. It does not backfill or rewrite stored observations, access a database, approve Farside/TFTC/SoSoValue, change source priority, evaluate the scenario, or write scenario state. BTC remains `not_evaluable` until the canonical ETF evidence, DXY feed and current spot observation pass their independent gates.


### Persisted source-provenance metadata — 2026-10-14

- Audit found a gap between the documented observation contract and the PostgreSQL schema: the schema distinguished `observed_at` and the measurement period, but had no dedicated storage for retrieval time, provider update/publication time, provider row identity, raw-payload hash, or methodology version.
- Added nullable fields to `observations` in `infrastructure/postgres/schema-v1.sql` and forward migration `infrastructure/postgres/migrations/2026-10-14-observation-source-provenance.sql`: `source_updated_at`, `retrieved_at`, `source_row_key`, `source_payload_sha256`, and `methodology_version`. Payload hashes are constrained to 64 hexadecimal characters.
- Nullable fields preserve existing rows without fabricating old timestamps. No backfill, observation write, source-priority change, scenario evaluation, deployment or production database migration was performed.
- Remaining work: verify the migration on the disposable PostgreSQL rehearsal; then wire collector/adapter mapping and provenance acceptance to these fields before claiming runtime provenance is complete. The new columns alone do not mean data has started populating them.


## BTC provenance handoff — 2026-10-14 (continued)

**Implemented on `main`:**

- The BTC API's read-only readiness query now includes `period_start` plus the stored provenance fields `source_updated_at`, `retrieved_at`, `source_row_key`, `source_payload_sha256`, `methodology`, and `methodology_version`. This fixes the gap where the ETF reporting-date and new provenance contract existed in storage but were not passed to the readiness evaluator.
- Readiness now fails closed for core BTC inputs without a valid, non-future retrieval timestamp or a stable non-empty source-row key. If a payload SHA-256 is supplied, it must be a 64-character hexadecimal digest. The selected offline input includes the provenance values for human review. ETF historical rows also require retrieval/key metadata and still require the explicit `period_start`.
- BTC source capture now carries the raw-body SHA-256 under the storage-contract field name. The canonical Kraken trade capture also records the trade observation time, a deterministic row key, and versioned method identifier. Binance/OKX/Bybit remain quote-separated cross-check candidates; none becomes the canonical USD/BTC source by this change.
- All changes are repository/CI-only. The capture script remains read-only; no observation ingestion, database write, scenario evaluation, scenario-state persistence, or deployment was performed.

**Verification evidence:**

- BTC Scenario Readiness Gate #193 passed on `9ec55675`: https://github.com/olegsh247-stack/Crypto/actions/runs/38607339069
- VPS API Build Rehearsal #1155 passed on `7671a0ba`: https://github.com/olegsh247-stack/Crypto/actions/runs/38607351460
- Read-only BTC Public Source Staging #62 passed on `d69f6e43`: https://github.com/olegsh247-stack/Crypto/actions/runs/38607581037
- VPS API Build Rehearsal #1156 for `d69f6e43` was still running when this note was written; do not mark that exact head verified until it completes.
- The BTC scenario remains **`not_evaluable`**: a canonical DXY source is not approved and current ETF provenance/reporting-time acceptance is not yet complete.

**Next required work:** build and test a review-only mapping from captured source artifacts to the normalized observation contract, with no database writes. Do not start ingestion or change source priorities until that mapping, ETF reporting semantics, idempotency keys, and duplicate/revision rules have been reviewed.


## Review-only BTC candidate mapping — 2026-10-14

The next handoff from raw capture to normalized input has been implemented without creating an ingestion path:

- `scripts/prepare-btc-observation-candidates.mjs` maps the canonical Kraken XBT/USD capture into a normalized **review-only** candidate containing the source event time, retrieval time, stable row key, payload SHA-256, source identity/URL, unit and method/version.
- The candidate is explicitly marked `persistable: false`; the mapper has no PostgreSQL client and performs no writes.
- Binance/OKX/Bybit USDT captures are not promoted to canonical USD/BTC observations. ETF capture is explicitly held until row-level daily values, reporting dates and publication/observation timing can be normalized. DXY remains unapproved.
- Mapping tests cover successful Kraken mapping, missing row/hash rejection, quote-unit separation and the ETF hold. BTC Scenario Readiness Gate #194 passed: https://github.com/olegsh247-stack/Crypto/actions/runs/38607850897. VPS Build Rehearsal #1156 and read-only source capture #62 also passed on the source-capture commit: https://github.com/olegsh247-stack/Crypto/actions/runs/38607581397 and https://github.com/olegsh247-stack/Crypto/actions/runs/38607581037.

**Remaining before any ingestion:** verify the current-head CI after workflow path alignment; validate the candidate artifact against the capture produced by CI; define the ETF row-level parser/reporting-date semantics and the logical idempotency/revision key; review the resulting candidates read-only. No ingestion, source-priority change, scenario evaluation or scenario-state write is authorized by these steps.


## Capture-to-candidate CI rehearsal — 2026-10-14

The read-only staging workflow now runs `prepare-btc-observation-candidates.mjs` against each captured manifest and uploads the raw source responses, manifest, and normalized candidate artifact together. BTC Public Source Staging #63 passed and reported **1 normalized Kraken candidate, 2 blocked ETF source entries**, with explicit no-production-access/no-write flags: https://github.com/olegsh247-stack/Crypto/actions/runs/38608092736. VPS Build Rehearsal #1164 also passed on code head `53c4b38d`: https://github.com/olegsh247-stack/Crypto/actions/runs/38608092710.

The captured Kraken point was 81,735.9 USD/BTC at 2026-10-14T17:36:36.135Z. It is a review artifact only and was not inserted. OKX returned a BTC-USDT cross-check; Binance HTTP 451, Bybit HTTP 403 and Farside HTTP 403 were observed from the GitHub runner only, not treated as proof of global source unavailability. TFTC returned 707 JSON rows but remains an unapproved ETF candidate and was not normalized as canonical flow input.

**Next in Plan 100:** review the produced artifact's field-by-field mapping, then resolve ETF row-level reporting dates/publication semantics and source lineage. Define logical idempotency/revision behavior before any ingestion. BTC remains `not_evaluable`; no scenario or state was written.


## One-time TFTC ETF candidate audit — 2026-10-14

Inspected the raw JSON in the read-only staging artifact, rather than relying only on its 707-row count. The audit is saved at `docs/data-review/BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md`.

Findings: 707 unique dated rows (2024-01-11–2026-10-13), but no row-level observation/publication timestamp or explicit revision/finalization policy; 16 rows have zero aggregate flow and no per-fund breakdown/assets; and 33 rows have aggregate-vs-per-fund differences above $1 million, with a largest difference of $30.65 million. These are unresolved source-contract issues, not reasons to invent timestamps or silently treat missing/holiday rows as zero. The declared lineage is mixed across SoSoValue, Farside-tabulated disclosures and mempool.space.

**Decision:** TFTC remains a reconciliation candidate only. Do not promote it to canonical ETF source. The current mapper intentionally blocks its ETF rows. Next source work is to resolve these semantics and compare the material discrepancies against a defensible primary snapshot; only then consider a source-priority change. No database writes or scenario-state changes were made.


## Candidate artifact verification and explicit cross-check disposition — 2026-10-14

The latest read-only capture artifact was inspected field by field against its raw Kraken response. The SHA-256 matched across raw body, manifest and candidate; the selected price and source trade timestamp matched the raw trade row; and the stable source-row key was reproducible from that row. BTC Scenario Readiness Gate #197 passed: https://github.com/olegsh247-stack/Crypto/actions/runs/38608820923. Capture run #64 passed and produced one normalized canonical candidate plus five explicitly blocked entries: https://github.com/olegsh247-stack/Crypto/actions/runs/38608794818.

The blocked entries now explain why the other exchanges are not substituted: Binance/Bybit requests failed from the runner, while OKX succeeded but quotes BTC in USDT rather than USD. The two ETF feeds remain blocked until reporting-date/publication semantics and lineage are accepted. No production writes or scenario-state changes were made.


## ETF cross-snapshot comparison — 2026-10-14

Compared the TFTC capture with the repository's earlier Farside staging artifact. Four of five completed sessions differ only by roughly $0.03–$0.10 million at the displayed precision; 7 October differs by approximately **$2.17 million** (TFTC `-$487.067m` versus the staged Farside `-$484.9m`). The detailed comparison is recorded in `docs/data-review/BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md`.

The Farside artifact is a prior snapshot and the current endpoint was HTTP 403 from the GitHub runner, so this discrepancy remains unresolved. TFTC's internal aggregate/per-fund agreement on the recent five sessions does not make it authoritative. No source-priority change is justified yet; keep both feeds out of canonical ingestion until a comparable source snapshot and revision/reporting-time contract are established.


## DXY source-contract stage — 2026-10-14

Completed the repository-side contract work without pretending a feed is available:

- Removed generic `macro.primary` from `macro.dxy.source_priority`; there is currently no approved canonical DXY source.
- Kept `macro.ice_dxy_candidate` registered as a candidate only. ICE's official catalog describes intraday/daily data products and delivery methods, but the catalog page is not itself a public quote endpoint; actual access, license, payload schema and current close-time convention remain unverified.
- Defined the required candidate mapping: index business date in `period_start`, actual provider timestamp in `observed_at`, collector retrieval time in `retrieved_at`, plus exact feed URL, stable row key, payload hash and methodology version. No timestamp may be fabricated from retrieval time.
- Added a detailed review at `docs/data-review/BTC-DXY-SOURCE-CONTRACT-2026-10-14.md` and a test asserting the metric registry cannot advertise generic/unapproved DXY as canonical.

Official reference links are included in that review. A current methodology and real authorized sample payload are still required. FRED `DTWEXBGS` remains a different broad dollar index, and DX futures settlement is not the DXY cash index; neither is an acceptable silent substitute.

No production database access/write, source-priority promotion, scenario evaluation, probability change, state persistence or deployment occurred. BTC remains `not_evaluable`. Next: run the current-head gate, then continue ETF reconciliation and seek an actual authorized DXY feed/sample rather than inventing an endpoint.

### ETF discrepancy follow-up — 2026-10-14

- Re-reviewed the 7 October Farside/TFTC comparison at fund-component level. The captured TFTC row has BRRR at -$2.1m while the earlier Farside snapshot shows BRRR at $0.0m; this accounts for most of the -$2.167m total difference. The remaining amount is consistent with displayed precision.
- Recorded this as a **plausible explanation, not a resolved source discrepancy** in [the ETF audit](data-review/BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md). Snapshots are not time-aligned and the Farside capture has no provider publication timestamp or revision identity, so neither value is promoted and TFTC remains candidate-only.
- This was a one-time provenance/reconciliation check, not a recurring daily-sum calculation. No production ingestion, source-priority change, database/state write, scenario evaluation or probability update occurred.
- Next: obtain a comparable immutable Farside/authorized primary-source row-level capture with raw hash and available publication/revision metadata. If runner access remains blocked, preserve that as an explicit access blocker; do not treat a web-indexed display as an immutable raw source artifact. BTC remains `not_evaluable`.

### VPS rehearsal after ETF audit update — 2026-10-14

- VPS API Build Rehearsal #1182 passed on commit `14c3c5a3f6e1212a749374d9af53e95256bc60e3`: https://github.com/olegsh247-stack/Crypto/actions/runs/38611372091
- Successful checks included VPS-only repository guard, shared runtime/Worker/API builds, response-contract tests, Compose network-boundary validation, PostgreSQL migration/bootstrap rehearsal, canonical BTC input registry and read-only provenance audit, idempotency/duplicate reconciliation rehearsal, backup/restore, API/Worker E2E, offline invariants, evidence/snapshot lineage, persisted history/candle finalization and admin boundaries.
- This validates the repository's isolated rehearsal only. The temporary PostgreSQL instance was cleaned up by the workflow; this is not a production deployment or approval to ingest data.
- Current-head source capture is still the next evidence task. The staging workflow is explicitly read-only and supports manual dispatch, but this session's GitHub connector has no workflow-dispatch action; do not fake a new capture or label the older artifact as current. The latest reviewed capture remains run #64, where Farside was HTTP 403 and TFTC was candidate-only.
- BTC remains `not_evaluable` until ETF source provenance/reporting-time requirements and the other mandatory input gates are satisfied.

### Текущая проверка BTC Public Source Staging #65 — 2026-10-14

- Read-only workflow #65 завершился успешно на commit `5c981572ab10082a7e6b5ae5594cbc66c5945d7c`: https://github.com/olegsh247-stack/Crypto/actions/runs/38612551627. Артефакт `btc-public-source-review` (ID `11918642088`, SHA-256 `1b3bd45a2cc93633b33864e7ea614f0e277061c6173e14f49da4e7c0046c8ff0`) был скачан и проверен; хранится 7 дней.
- Kraken XBT/USD: HTTP 200; последняя сделка в снимке — 81,557.8 USD/BTC с event time `2026-10-14T18:08:05.265Z`; время получения `18:08:07.032Z`; сохранены ключ строки и SHA-256 raw payload. Это один review-only кандидат, а не принятое production-наблюдение.
- OKX BTC-USDT: HTTP 200, 81,640 USDT/BTC — только независимая сверка в другой котируемой единице. Binance HTTP 451 и Bybit HTTP 403; это ошибки доступа из GitHub runner, а не доказательство глобальной недоступности бирж.
- Farside вернул HTTP 403. TFTC JSON вернул HTTP 200, 707 строк и `updatedThrough=2026-10-13`; в HTTP-заголовке `Date` указано `2026-10-14T10:01:30Z`, но это метаданные HTTP-ответа, не row-level publication time и не доказательство финализации/ревизии. TFTC остаётся только reconciliation candidate; ETF-кандидаты не нормализуются в наблюдения.
- Mempool hashrate и block-fees сохранены как исходные исследовательские данные. Семантика окна hashrate ещё требует подтверждения; отношение fees/subsidy не рассчитывалось, поскольку это не обязательный вход первого BTC-сценария и единицы/знаменатель ещё не утверждены.
- Нормализатор завершился успешно: 1 кандидат (Kraken spot) и 5 заблокированных записей. Артефакт подтверждает `production_database_accessed=false`, `production_writes_performed=false`; поле кандидата `persistable=false`.
- Отдельно сохранены HTTP response URL/Date/Last-Modified/ETag/cache headers. Эти заголовки служат provenance evidence и не подменяют `observed_at`.
- Постоянный отчёт обновлён: [BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json). Новые данные не пересчитывались ежедневно: это одноразовая проверка источников и контракта.
- **Статус сценария без изменений: BTC `not_evaluable`.** Не выполнялись ingestion, production DB writes, смена source priority, сценарная оценка, изменение вероятностей, monitoring state или deployment.

**Следующий шаг по Плану 100:** не расширять список метрик. Закрыть оставшийся обязательный входной контракт — сначала получить сравнимую первичную ETF-запись с reporting date и проверяемой provenance/revision-семантикой (либо явно зафиксировать, что доступен только блокирующий ответ), затем отдельно разрешить DXY feed/time convention. После этого прогнать актуальный BTC readiness gate на текущем HEAD и только при успешном gate выполнить один offline/read-only сценарий BTC.

### Продолжение Плана 100 — проверка временной целостности и источников, 2026-10-14

- Исправлен review-only нормализатор BTC: если timestamp сделки позже времени получения ответа, кандидат блокируется как `source_observation_timestamp_after_retrieval`. Добавлены регрессионные тесты: HTTP `Date`/`Last-Modified`/`ETag` не подменяют `observed_at` и не превращаются автоматически в `source_updated_at`.
- BTC Scenario Readiness Gate #201 passed на commit `1c02a45033a3da5234bab2862ca7fcad0c509026`: https://github.com/olegsh247-stack/Crypto/actions/runs/38617442717
- BTC Scenario Readiness Gate #202 passed на commit `c17009d888c0cfcb6674ff1ffabf1c195a434e1a`, включая новые тесты: https://github.com/olegsh247-stack/Crypto/actions/runs/38617454516
- BTC Public Source Staging #66 passed и артефакт проверен: https://github.com/olegsh247-stack/Crypto/actions/runs/38617442716. SHA-256 ZIP: `3730e69a31ead29cec4fd33764e3af8feb81f12c0610d10067f0a359533ead20`.
- В capture #66 Kraken вернул сделку `81460.6 USD/BTC` с source event time `2026-10-14T18:42:41.878Z`, полученную в `18:42:44.521Z`. OKX вернул `81565.1 USDT/BTC`; это отдельная котируемая единица. Binance HTTP 451, Bybit HTTP 403, Farside HTTP 403. TFTC ответил HTTP 200, `updatedThrough=2026-10-13`, 707 строк; это всё ещё не даёт row-level reporting/publication timestamp или revision contract. Нормализатор подготовил один Kraken review candidate (`persistable=false`) и заблокировал пять записей.
- Поиск доступных DXY-вариантов не нашёл основания менять контракт: ICE подтверждает, что DXY — отдельный продукт с доступом через ICE Data API/Feed/Files и лицензируемой поставкой ([ICE product documentation](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices)). Finance Foundation прямо не предоставляет live level для индекса ([source note](https://finance.foundation/assets/dollar-index)); exchangerate.dev предлагает прозрачную реконструкцию шести валют, но явно указывает, что это не официальный ICE DXY и может отличаться по timing/methodology ([methodology](https://exchangerate.dev/indices/dollar-index-api)). Поэтому ни один из этих вариантов не повышается до canonical `macro.dxy`; никакая подмена метрики не сделана.
- Постоянный отчёт источников обновлён: [BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json).

**Следующий шаг:** продолжать только обязательные входы BTC. ETF остаётся заблокированным до доказуемой отчётной даты/происхождения и сверки расхождения; DXY — до доступного авторизованного feed либо отдельного утверждённого изменения исследовательского контракта. Не запускать сценарную оценку и не менять probabilities/state, пока readiness gate не проходит на подтверждённых входах. VPS Build Rehearsal #1188/#1189 ещё проверяются на момент записи; результат не заявлять до завершения.

### ETF blocker — official Farside all-data endpoint and parser verified (2026-10-14)

- The original Farside landing URL `https://farside.co.uk/btc/` returns HTTP 403 from GitHub Actions, but the official all-data page linked from that landing page — `https://farside.co.uk/bitcoin-etf-flow-all-data/` — returns HTTP 200 from the same runner. This is an endpoint correction within the existing `institutional.primary` (Farside) source identity; **source priority has not changed**.
- Added pure parser `scripts/parse-farside-etf-table.mjs` plus unit tests and wired them into the read-only source-staging workflow. The parser extracts reporting date, 12 fund columns, displayed daily total and canonical `USD million/day` unit; parentheses become negative numbers. Dashes stay `null`, not zero. The all-dash 14 Oct row with displayed total 0.0 is explicitly `UNREPORTED_PLACEHOLDER` and `observed_at` stays null.
- BTC Public Source Staging #68 passed; captured artifact ID `11919518954`, SHA-256 `70983d4d86d0c5462e2315a74c684ad4a5a0f42f64af04a25c3e255d11d5ae5b`: https://github.com/olegsh247-stack/Crypto/actions/runs/38617818435. Parser test step passed.
- Latest confirmed Farside reporting date in this capture is 13 Oct 2026, displayed total +175.7m; 12 Oct is -65.4m. TFTC JSON reports +175.617407245m and -65.401m respectively, differences consistent with Farside's 0.1m display precision.
- Cross-source comparison for 5–9 Oct remains unchanged: 5, 6, 8 and 9 Oct differences are consistent with displayed rounding; 7 Oct is -2.1674115m (TFTC minus Farside), with BRRR 0.0m in Farside versus -2.114298m in TFTC. This is a plausible explanation for most of the delta, not a proven revision history.
- Farside response HTTP `Date` is captured, but `Last-Modified` and `ETag` are absent. The reporting date is not the provider publication timestamp. Therefore, the endpoint-access blocker is resolved, but **ETF acceptance remains blocked** until observation/publication timestamp and revision/finalization semantics are defensible.
- The canonical readiness allowlist accepts both the official `/btc/` landing endpoint (for historical provenance) and the verified all-data endpoint. Gate #203 passed after this change: https://github.com/olegsh247-stack/Crypto/actions/runs/38617960879.
- Detailed source report: [BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json); TFTC review: [BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md](data-review/BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md).

**Next:** finish the ETF observation-time/revision contract and keep DXY blocked until an authorized, specific source is available or the research contract is explicitly changed. BTC remains `not_evaluable`; no ingestion, scenario evaluation, state write or probability change occurred.

### BTC exchange cross-check — Binance market-data endpoint verified (2026-10-14)

- BTC Public Source Staging #69 passed on commit `6dbe6b48a55afb60c3a8176483fbf9bb9d0dcf74`: https://github.com/olegsh247-stack/Crypto/actions/runs/38618817154. Artifact ID `11920754280`, SHA-256 `9ee840277935cd3423fb7c6970414d6a71e915098089da4e7be5a8a3a9af06f9`.
- Binance's regular public trades endpoint `api.binance.com` returns HTTP 451 from the GitHub runner, but the official market-data-only domain `data-api.binance.vision` returns HTTP 200. The second endpoint is now captured separately; this is an access-path correction for cross-checking, not a source-priority change.
- In this read-only capture, Binance BTCUSDT was 81,752 USDT/BTC at `2026-10-14T18:52:18.384Z`; OKX BTC-USDT was 81,749.9 USDT/BTC at `2026-10-14T18:52:17.813Z`. The near-simultaneous difference was 2.1 USDT/BTC (about 0.00257%). Kraken's separate BTC/USD trade was 81,670 USD/BTC at `2026-10-14T18:52:10.633Z`; because quote currencies and timestamps differ, it is not directly equated with or averaged into the USDT quotes.
- Bybit's public recent-trade endpoint still returns HTTP 403 from the runner. This is an environment-specific capture failure, not evidence that Bybit is globally unavailable. Keep the candidate visible as blocked rather than silently dropping it.
- These exchange rows remain review-only. Kraken is still the canonical USD/BTC candidate; Binance and OKX are USDT/BTC cross-checks. No observation was ingested, no source priority changed, and no scenario state or probability was changed.
- Detailed record: [BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json).

### BTC ETF reconciliation checkpoint — 2026-10-14

- Farside parser v2 now calculates the sum of all 12 fund values only when all are reported, records the delta against the provider's displayed aggregate, and flags `MATCHES_DISPLAY_ROUNDING`, `MATERIAL_DIFFERENCE`, `INCOMPLETE`, or `UNREPORTED`. It never adjusts source values to force reconciliation.
- The diagnostic rounding envelope is 0.65 USD million (12 fund values and one total each displayed to 0.1m). This is a screening threshold only, not an ingestion approval. Missing values stay null; all-dash rows remain placeholders.
- Added tests for aggregate reconciliation, material discrepancy, missing/dash placeholder and the one-decimal rounding envelope. The test step passed in BTC Public Source Staging #72; the newest code/test capture #73 is running and must be checked before claiming the final revision passed: https://github.com/olegsh247-stack/Crypto/actions/runs/38621215105.
- Capture comments now correctly distinguish the read-only readiness URL allowlist from approval to ingest ETF observations. Farside remains the preferred candidate, but ETF observations are blocked until reporting/session date, publication/observation-time policy, revision/finalization and source reconciliation are agreed.
- No production writes, observation ingestion, source-priority change, scenario-state change or probability update occurred.


### Продолжение Плана 100 — контракт времени и ревизий ETF, 2026-10-14

- Успешно завершена VPS Build Rehearsal #1205 на HEAD `de0a60bec122e876fb40d9115edfdfef8710ab6a`: https://github.com/olegsh247-stack/Crypto/actions/runs/38621298802.
- В `docs/BTC-SOURCE-CONTRACT-AND-INPUT-REFRESH.md` добавлен отдельный контракт для ETF: дата отчётной сессии, время наблюдения, время публикации/обновления поставщика, время получения ответа, HTTP-заголовки, SHA-256 тела, идентификатор строки, ревизия и статус финализации имеют раздельные значения.
- Важное ограничение: HTTP `Date` — метаданные HTTP-ответа, а не подтверждённое время публикации ETF-данных. Отсутствие `Last-Modified`/`ETag` не позволяет вывести номер ревизии или финальность строки. SHA-256 всего ответа доказывает идентичность захваченного тела, но не идентичность отдельной строки или время публикации.
- Для текущего Farside-кандидата `period_start` берётся из даты строки; `observed_at` и `source_updated_at` остаются неизвестными, `finalization_status` — `unknown`. Статус сверки суммы фондов с total — отдельный диагностический сигнал, он не закрывает временные и ревизионные блокеры.
- Следующий шаг — review-only нормализатор ETF-строк, который сохранит метаданные ответа, сформирует стабильный ключ строки и оставит отсутствующие временные/ревизионные поля пустыми. Кандидат должен явно оставаться `persistable: false`; никакой записи в PostgreSQL, изменения приоритета источника или оценки сценария не делать.
- BTC остаётся `not_evaluable`. Источники Binance/OKX — независимые USDT-кросс-проверки, Kraken — кандидат для канонического USD/BTC; DXY остаётся заблокирован до конкретного разрешённого feed и его временного контракта.


### ETF review-only row normalization implemented — 2026-10-14

- `scripts/prepare-btc-observation-candidates.mjs` now normalizes parsed rows from the official Farside all-data capture into a separate `etf_review_rows` collection. It preserves reporting date, displayed total, calculated fund sum, reconciliation status, retrieval time, HTTP response metadata, whole-response SHA-256 and raw-body filename.
- Each ETF review row explicitly has `candidate_state: REVIEW_ONLY_BLOCKED`, `persistable: false`, `observed_at: null`, `source_updated_at: null`, `provider_revision: null`, `revision_identity_status: provider_revision_unknown` and `finalization_status: unknown`. A page hash is labeled as a full-response hash, not a row hash or revision ID.
- Unreported placeholders (including an all-dash row with displayed total 0.0) are emitted with `value_numeric: null` and an explicit blocker. Rows with material/incomplete reconciliation are kept visible with blockers; the normalizer does not turn them into accepted observations.
- Added regression tests for reported and placeholder rows, timestamp/revision/finality separation and the non-persistable boundary. The BTC Public Source Staging workflow now runs these tests before source capture.
- BTC Public Source Staging #78 passed on HEAD `a2571301045878aacbbd21929f6ab74240ee0c81`: https://github.com/olegsh247-stack/Crypto/actions/runs/38621977995. BTC Scenario Readiness Gate #207 also passed on the same HEAD: https://github.com/olegsh247-stack/Crypto/actions/runs/38621977923. VPS Build Rehearsal #1212 was still running when this checkpoint was recorded; check its final status before reporting it as passed.
- An intermediate staging run failed because a date-validation regex was over-escaped; this was corrected on the next commit, and the successful #78 run includes the correction. No production writes or scenario evaluation occurred.


### Проверка реального ETF staging-артефакта и межисточниковая сверка — 2026-10-14

- Проверен скачанный артефакт BTC Public Source Staging #82 на HEAD `586527e3c51d2c42f07d5b7c5cde8d406c78f4d7`: исходные файлы для всех сохранённых ответов совпали с SHA-256 из манифеста; в нормализованном наборе ровно один review-only spot-кандидат Kraken, 14 ETF-строк и ни одной записи в production. Артефакт: https://github.com/olegsh247-stack/Crypto/actions/runs/38622549700.
- При первой проверке обнаружено, что нормализатор искал `recent_days`, а реальный манифест TFTC сохраняет `recent_days_in_last_14_days`. Поле исправлено; тест теперь использует точное имя поля реального манифеста. Успешный staging #82 предшествует этой последней корректировке; необходимо подтвердить следующую staging-версию #83 перед тем, как считать исправление проверенным на полном capture-артефакте.
- После исправления на артефакте #82 был выполнен повторный локальный разбор сохранённых значений: Farside и TFTC совпадают в пределах выбранной screening-полосы для 9 из 10 общих дат 30 Sep–13 Oct; 7 Oct имеет разницу TFTC − Farside = `−2.1674115 USD million`. По BRRR разница составляет `−2.114298 USD million` и объясняет основную часть расхождения. Это наблюдаемая межисточниковая разница, но без выравнивания происхождения/ревизий она не доказывает, какая сторона верна.
- Добавлен `etf_cross_source_comparisons` в review-only нормализатор: общие даты, суммы обоих источников, разница, SHA-256 обеих страниц, отличающиеся значения по фондам и явный `DIAGNOSTIC_ONLY_NOT_SOURCE_ACCEPTANCE`. Полоса 0.65m — только сигнал для ручной сортировки расхождений; она не является доказательством эквивалентности источников и не разрешает ingestion.
- Повторная проверка подтверждена на свежем staging #83: артефакт содержит 10 сравнений и флаг `DELTA_EXCEEDS_SCREENING_BAND` для 7 Oct. Все сохранённые response-body SHA-256 совпадают с манифестом; production-флаги остаются `false`. ETF остаётся заблокированным; TFTC — вспомогательный кандидат, не канонический источник.
- VPS Build Rehearsal #1213 на HEAD `8630fab` завершилась успешно: https://github.com/olegsh247-stack/Crypto/actions/runs/38622054889. Текущие staging #83 и readiness gate #212 уже прошли на HEAD `7c65e90`: https://github.com/olegsh247-stack/Crypto/actions/runs/38622568433 и https://github.com/olegsh247-stack/Crypto/actions/runs/38622568340. VPS Build Rehearsal #1218 на этом HEAD ещё выполнялась на момент фиксации.


- Подтверждение свежим артефактом BTC Public Source Staging #83: https://github.com/olegsh247-stack/Crypto/actions/runs/38622568433. Получены 10 сравнений дат, включая расхождение 7 Oct `−2.1674115 USD million` и отличие по BRRR `−2.114298 USD million`; все SHA-256 совпали, production DB/write flags — `false`.
- Readiness Gate #212 прошёл на том же HEAD, VPS Build Rehearsal #1218 также завершился успешно: https://github.com/olegsh247-stack/Crypto/actions/runs/38622568340 и https://github.com/olegsh247-stack/Crypto/actions/runs/38622568357. Rehearsal #1219 для последнего документационного коммита ещё выполняется.


### Следующий контрактный барьер BTC: ревизия spot-кандидата — 2026-10-14

- Обнаружена неоднозначность в поле `revision: 1` у review-only Kraken-кандидата: без явного пояснения его можно ошибочно прочитать как ревизию поставщика. Теперь объект содержит `revision_scope: local_candidate_observation_record` и `revision_identity_status: not_a_provider_revision`; ключ события остаётся `source_row_key` из конкретной сделки Kraken.
- Добавлен тест на эти поля. BTC Public Source Staging #85 и BTC Scenario Readiness Gate #214 прошли на HEAD `939b723fcbe1f0b1fb49e4e42ffda5d024d3b03e`: https://github.com/olegsh247-stack/Crypto/actions/runs/38622921057 и https://github.com/olegsh247-stack/Crypto/actions/runs/38622920906.
- VPS Build Rehearsal #1219 завершилась успешно для предшествующего документационного коммита `2f0a052`: https://github.com/olegsh247-stack/Crypto/actions/runs/38622673801. Новый коммит с уточнением контракта требует собственной проверки.
- Свежий staging #83 подтвердил 10 межисточниковых ETF-сравнений; 7 Oct остаётся материалным расхождением `−2.1674115m USD`, преимущественно BRRR `−2.114298m USD`. Все response-body hashes совпали с манифестом, production-флаги — `false`. См. [TFTC ETF audit](data-review/BTC-TFTC-ETF-JSON-AUDIT-2026-10-14.md).
- Следующий этап: дождаться сборки текущего HEAD; затем отдельно проверить freshness, регистрацию источника, дедупликацию и логический ключ Kraken-кандидата в контексте существующей модели наблюдений. ETF и DXY не обходить и не подменять: BTC остаётся `not_evaluable`, пока обязательные входы не пройдут контракт.


### BTC logical observation key: source-row identity — 2026-10-15

- Audit found that the existing BTC unique index used only metric/source/event timestamp/period/revision. It did not include source_row_key, so two different provider events with the same timestamp could collide.
- Added migration infrastructure/postgres/migrations/2026-10-15-btc-source-row-key-idempotency.sql: rows with a provider row key are unique by metric + source + source-row key; the local revision field does not create a new provider event; legacy rows without a row key retain the old natural-key rule. The migration refuses to proceed if either identity class already contains duplicate key groups, and performs no row rewrite.
- Updated the guarded exact-duplicate reconciliation to partition keyed events by source_row_key; distinct keyed events are no longer grouped merely because timestamps match. Legacy rows continue to use the old natural key.
- Expanded the disposable-database test to verify two distinct source row keys at the same timestamp coexist and replaying one source key does not add a duplicate, even if a local revision number differs.
- This is a repository migration/test change only. Do not apply it manually to any live database. Verify the disposable PostgreSQL workflow before treating the contract as validated; scenario remains not_evaluable while ETF publication/revision and DXY source contracts remain blocked.


- Follow-up identity audit: Kraken does not provide a dedicated trade ID in this response shape. The candidate key is therefore a derived composite of pair, source timestamp, price, volume, side, order type and misc fields, explicitly marked `derived_composite_key_not_provider_assigned`. The normalizer now blocks Kraken candidates if these identity semantics are absent. This is best-effort source-row identity, not a provider-issued ID; the capture remains review-only.


### BTC source freshness — 2026-10-15

- The Kraken candidate now carries measured source age in seconds, derived from `retrieved_at - observed_at`, while retaining both source timestamps unchanged.
- Audit found the metric registry already defines an event-driven spot input with a one-hour maximum age; this is an age limit, not a polling cadence.
- Added explicit policy ID `btc.market.spot_price.max-age.v1` to the metric registry and aligned the normalizer: age `<= 3600` seconds is `CURRENT`, older is `STALE`.
- Regression tests cover sub-second age calculation, the exact one-hour boundary, and a 24-hour-old event. All candidates remain review-only and non-persistable regardless of freshness label.
- Candidate remains review-only; no production DB operation or scenario evaluation is authorized.


### Observation freshness storage guard — 2026-10-15

Audit found that PostgreSQL defaulted omitted `observations.freshness` to `CURRENT`, while the BTC candidate correctly remained unclassified. Updated the clean-install schema and added forward migration `2026-10-15-observation-freshness-unclassified-default.sql`: new rows now default to `UNCLASSIFIED`; the allowed storage values include `CURRENT`, `STALE`, `EXPIRED`, and `UNCLASSIFIED`. Existing rows are not rewritten. `CURRENT` requires an explicit approved freshness decision. This is a repository change only; no production migration, ingestion, or scenario evaluation was performed. CI must validate compatibility before this item is considered verified.


### Freshness policy reconciliation — 2026-10-15

A follow-up audit corrected a documentation/implementation mismatch: `data/CryptoDataModel/registry/metric-registry.json` already declared `market.spot_price.freshness_window = 1h`, and the BTC readiness gate uses a one-hour maximum age. The candidate normalizer now applies that same policy and the registry names it `btc.market.spot_price.max-age.v1`. This does not require hourly polling. A source observation older than the limit is labelled `STALE`; the normalizer does not discard its age evidence. Candidate persistence and scenario evaluation remain blocked until the full source contract and remaining mandatory inputs pass.

## 23. BTC scenario readiness — current exit criteria (2026-10-15)

The first BTC research scenario remains **not evaluable** until all of these gates pass:

1. **Canonical spot input:** one BTC/USD observation from the approved Kraken XBT/USD path, with positive numeric value, `USD/BTC` unit, event timestamp, retrieval timestamp, registered source, accepted URL, stable source-row key, payload hash when available, and freshness no older than the registry's one-hour maximum. A review-only candidate is not by itself permission to persist it.
2. **ETF flow series:** approved source and row-level normalization; explicit provider reporting date; defensible observation-time convention; retrieval timestamp; deterministic row identity; source-body provenance; and clear revision/finality semantics. The latest daily row must meet the 36-hour freshness limit, and at least five distinct recent reporting days within the 14-day series window must pass validation. Reconciliation of displayed totals versus fund sums is diagnostic only.
3. **DXY input:** an actually accessible and authorized canonical feed, with a documented daily observation convention, timestamps, units, source identity and accepted endpoint. The runtime source allowlist is intentionally empty until this evidence exists; registering ICE product documentation as a candidate does not unblock DXY.
4. **Registry/runtime consistency:** source and metric registries validate, every source is seeded, and CI detects drift in readiness age limits, units and approved source IDs. BTC Scenario Readiness Gate #228 passed with this drift guard. This is currently a consistency check; it does not claim the runtime values are already loaded from a single registry source.
5. **Read-only readiness pass:** the readiness gate reports `ready_for_rule_evaluation` with no blockers and a fully traceable selected-input set. Missing, stale, future-dated, unregistered, unapproved or unit-inconsistent data must fail closed.
6. **Fixed offline rule evaluation:** evaluate the documented BTC research rule against a frozen input set and versioned methodology; record inputs, evidence, versions and result so the same inputs reproduce the same result.
7. **Separate acceptance:** review the result and evidence before any scenario state, probability, monitoring record, ingestion schedule or production deployment is changed. These are not implied by `evaluable`.

### Current blockers

- **ETF:** publication/observation-time convention and provider revision/finality semantics are unresolved; accepted canonical row observations are not ready.
- **DXY:** no approved canonical quote feed/endpoint; intentionally blocked.
- **Spot persistence:** the Kraken mapper emits review-only, non-persistable candidates. A controlled acceptance/ingestion path remains a separate task.
- **Scenario evaluation:** not run. No probability or scenario state is changed automatically.

Recent evidence: BTC Scenario Readiness Gate #228 passed on `296848097481126238ce0dca2198226c2bcd39e1` (https://github.com/olegsh247-stack/Crypto/actions/runs/38713564389). VPS API Build Rehearsal #1266 was pending at the time of this entry (https://github.com/olegsh247-stack/Crypto/actions/runs/38713564475). CI success proves the contract/tests build, not that live BTC inputs are accepted or the scenario is evaluable.


## 24. BTC readiness runtime registry source-of-truth — 2026-10-15

**Current work:** [Draft PR #83](https://github.com/olegsh247-stack/Crypto/pull/83), branch `fix/btc-readiness-registry-runtime-source`.

- [x] Readiness runtime loads per-metric requirements from `data/CryptoDataModel/registry/metric-registry.json` instead of maintaining duplicated freshness/unit/source/URL values.
- [x] Registry declares the canonical candidate endpoint for BTC spot, the fail-closed DXY policy, and ETF source URL prefixes plus freshness/history/minimum-session rules.
- [x] Registry validator checks the source-of-truth relationship and protects the explicit ETF/DXY safety gates.
- [x] BTC Scenario Readiness Gate passed on PR head `4550817fc10624e48e41d14911ace0ed88ed6f9c`: https://github.com/olegsh247-stack/Crypto/actions/runs/38715775250.
- [x] VPS API Build Rehearsal passed on PR head `ae4247dc65978986244262370ede51a1791ae01d`: https://github.com/olegsh247-stack/Crypto/actions/runs/38716465077.
- [x] VPS API and Worker Docker images built in CI; both successfully imported the shared runtime with the canonical registry bundled.
- [ ] Review/acceptance of the PR remains separate; no merge was performed.

**Effect on Plan 100:** this improves Stage 4's configuration integrity only. It does not accept source observations or close Stage 4. ETF timestamp/revision/finality semantics and approved DXY feed remain blockers; BTC remains `not_evaluable`. No production ingestion, database writes, scenario evaluation, scenario-state/probability/monitoring changes or deployment occurred.


Validation detail: the container-image rehearsal caught and fixed an existing package-layout issue before acceptance. The final image keeps the shared runtime in the expected location and includes `data/CryptoDataModel/registry/metric-registry.json`; no production deployment was performed. BTC Scenario Readiness Gate passed on `e3bd6d2008cd229ec8988f6d302a904a43756ba2`: https://github.com/olegsh247-stack/Crypto/actions/runs/38716461506. VPS API Build Rehearsal passed on `ae4247dc65978986244262370ede51a1791ae01d`: https://github.com/olegsh247-stack/Crypto/actions/runs/38716465077.


## 25. ETF source contract hardening — 2026-10-15

- [x] Formalize ETF `period_start` vs `observed_at` vs `retrieved_at` semantics in [BTC ETF observation contract](./data-review/BTC-ETF-OBSERVATION-CONTRACT-2026-10-15.md).
- [x] Mark date-derived ETF keys as logical session keys, not provider-assigned row IDs.
- [x] Set ETF `provider_revision` and `revision` to `null` while provider revision semantics remain unknown; retain full-response hash scope explicitly.
- [x] Add regression assertions protecting the provenance/revision fields in the review-only candidate mapper.
- [ ] Obtain a defensible provider publication timestamp or approve a source-specific publication-time convention.
- [ ] Establish revision/finality and correction policy; reconcile the material Farside/TFTC 7 October difference before any canonical source decision.

**Decision:** ETF remains HOLD and non-persistable. A reporting date is not a timestamp; HTTP Date and retrieval time are not row publication timestamps; same-date changed snapshots must not be auto-overwritten or auto-promoted. BTC remains `not_evaluable`. No ingestion, database writes, scenario evaluation, or deployment occurred.

## 26. 2026-10-15 — ETF public-source reconciliation evidence

- Rechecked the four CI runs triggered by the previous PR #83 changes: BTC Scenario Readiness Gate #38722320242, VPS Build Rehearsal #38722320268, Validate VPS Release Workflow #38722320256, and latest-head VPS Build Rehearsal #38722327674 all completed successfully.
- Added a read-only public-source spot check to `docs/data-review/BTC-ETF-OBSERVATION-CONTRACT-2026-10-15.md`.
- Farside vs TFTC for 2026-10-07: -484.9 vs -487.1 USDm, delta -2.2 USDm; visible BRRR discrepancy (Farside 0.0, TFTC -2.1) is part of the difference, but exact root cause is not established. Do not auto-correct either source.
- For 2026-10-13, displayed totals are +175.7 vs +175.6 USDm, a -0.1 USDm difference. This is consistent with displayed rounding/aggregation, but does not prove identical source lineage.
- On 2026-10-14, Farside displays -261.4 USDm while TFTC's current page had not yet published that session. The Farside row contains only some reported fund values, so a non-null aggregate must not be treated as proof that every fund has reported.
- Next contract work: add/verify an explicit per-fund completeness rule (numeric zero is distinct from missing/unreported), preserve immutable capture hashes, and keep changed historical rows review-only until source-specific correction/finality policy is approved. Keep TFTC diagnostic-only; do not change canonical source priority.
- Safety unchanged: no ingestion, database writes, scenario evaluation, state/probability/monitoring changes, deployment, or PR merge. BTC remains `not_evaluable`; ETF acceptance remains blocked on publication/observation timestamp, finality/revision/correction semantics, and reconciliation policy.

## 27. 2026-10-15 — ETF per-fund completeness guard

- The Farside parser now emits explicit completeness metadata: `fund_completeness_status`, reported/expected fund counts, and `missing_funds`.
- A numeric `0.0` remains a reported zero; a dash remains `null`. The candidate mapper now flags a reported aggregate with partial or unverified fund coverage and keeps it non-persistable.
- Added tests for a partially reported session (three of twelve funds present) and candidate-level blocking. The total remains available as review evidence; it is not accepted as a complete session.
- This closes the parser/mapper implementation gap identified by the public-source spot check, but does not resolve the separate -2.2 USDm Farside/TFTC discrepancy for 2026-10-07 or establish ETF publication time, provider revision, or finality.
- Next: verify CI on the latest branch head; then continue the source-time/revision policy review and DXY approved-source gate. BTC remains `not_evaluable`; no ingestion, DB writes, scenario evaluation, deployment, or PR merge.

## 28. 2026-10-15 — Reconcile ETF contract against captured read-only staging artifact

- Checked the actual artifact from [BTC Public Source Staging run #38729627587](https://github.com/olegsh247-stack/Crypto/actions/runs/38729627587), captured at approximately 11:45:48 UTC. The artifact includes the immutable raw Farside HTML, TFTC JSON, manifest and normalized review candidates.
- Correction to section 26: TFTC data **was** present through 2026-10-14 in this capture. The prior statement that TFTC had not yet published that session is superseded.
- For 2026-10-14, the captured Farside table contains numeric values for all 12 funds (explicit 0.0 cells count as reported), with total -261.4 USDm. TFTC total is approximately -261.4622 USDm; difference approximately -0.0622 USDm. This is within the screening band, but is not proof of source identity or finality.
- The 2026-10-07 delta remains approximately -2.1674 USDm in the raw TFTC data versus Farside -484.9 USDm. BRRR is a visible contributor; exact root cause remains unresolved.
- The staging artifact confirms that ETF candidate rows correctly retain `observed_at: null`, full-response SHA-256, reporting-date logical keys, unknown provider revision/finality, and `persistable: false`. The response receipt time and HTTP Date are not promoted to the ETF observation time.
- VPS Build Rehearsal #38729630921 and the prior rehearsal #38729627372 both completed successfully; BTC readiness gate and VPS release workflow validation on the same latest head also passed.
- Next: keep source-time/revision/finality as an explicit unresolved source limitation, then proceed with the approved-input acceptance matrix for BTC (spot, ETF, DXY and the required source provenance/freshness checks). No ingestion, database writes, scenario evaluation, deployment or PR merge. BTC remains `not_evaluable`.

## 29. 2026-10-15 — BTC scenario input acceptance matrix from captured artifact

Evidence source: immutable artifact `btc-public-source-review` from [read-only staging run #38729627587](https://github.com/olegsh247-stack/Crypto/actions/runs/38729627587). All values below describe that capture only; they are not claimed to be current at a later evaluation time.

| Required input | Captured evidence | Gate result | Remaining work |
|---|---|---|---|
| `market.spot_price` | Kraken XBT/USD trade: 80,989.8 USD/BTC at 2026-10-15T11:45:46.894Z; retrieved at 11:45:47.008Z; composite row key and full response SHA-256 present | Valid traceable review candidate in that capture; still `persistable: false` | Re-evaluate freshness at the actual evaluation time; complete duplicate/idempotency review; no persistence approved |
| `institutional.etf_net_flow` | Farside rows for five recent distinct reporting dates (8, 9, 12, 13, 14 Oct) parsed; latest displayed total -261.4 USDm; per-fund values and full-response hash present | Blocked: `observed_at` intentionally null; provider publication time, revision/correction identity and finality remain unknown | Source-time and correction/finality policy must be resolved or an alternative source with a valid contract must be approved. Retrieval time/HTTP Date cannot substitute |
| `macro.dxy` | No approved, accessible canonical DXY feed or sample payload in the staging manifest | Blocked | Obtain authorized feed access, exact endpoint, current methodology/calendar and source timestamp convention. Do not substitute a broad USD index or DX futures settlement |

Cross-check-only exchange captures:
- Kraken is the only currently approved canonical spot source in the registry.
- Binance/OKX/Bybit captures are diagnostic only. The available cross-checks use USDT-denominated pairs, not the canonical USD/BTC quote, and some endpoint captures failed. They must not be averaged with Kraken or used as a silent fallback. If useful later, add a separately defined FX/USDT basis normalization study; do not mix quote units into the canonical spot observation.
- Hashrate and fee-source captures in this artifact are diagnostic inputs for their own research blocks; they do not replace the three current mandatory runtime readiness requirements.

**Conclusion:** source ingestion readiness is not equivalent to scenario readiness. The Kraken candidate is a successful example of traceable provenance, but ETF timestamp/finality and DXY source approval still block the required input set. The scenario must remain `not_evaluable` until the readiness gate passes with approved, current observations for every required metric. No production database writes, scenario-state/probability/monitoring changes, deployment or PR merge.


## 30. BTC ETF runtime acceptance gate — 2026-10-15

**Change on PR #83:** the shared runtime readiness gate now fails closed on ETF rows unless all acceptance metadata is present:

- a defensible `observed_at` and a valid reporting/session date;
- all 12 fund values explicitly reported, `fund_completeness_status = ALL_FUNDS_REPORTED`, reported count equal to expected count, and an empty `missing_funds` list;
- a valid SHA-256 of the captured source response;
- either a provider revision identifier or a separately approved immutable-snapshot reconciliation policy;
- finality explicitly established as `final` or `reconciled_snapshot`.

These conditions are required both for the latest ETF observation and for rows counted toward the minimum five-session history. A displayed aggregate or retrieval timestamp alone cannot make an ETF row acceptable. Unknown provider revision/finality remains a blocker; this does not assume Farside currently exposes those fields.

**Validation:** BTC Scenario Readiness Gate passed on code SHA `64fd8a3ceffa69b206a15e139d6e715709ee32c6` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38731006123)). VPS API image/runtime rehearsal and VPS release-workflow validation were still running at the time of this update; do not mark them passed until their runs complete.

**Outcome:** this is a guardrail/test improvement, not a source acceptance decision. The currently captured Farside ETF rows still lack defensible observation/publication timestamps and provider revision/finality semantics, so BTC remains `not_evaluable`. DXY also remains blocked pending an approved source and documented daily observation convention. No database writes, ingestion, scenario evaluation, state/probability/monitoring changes, merge, or deployment were performed.


## 31. DXY source investigation — 2026-10-15

**Decision: keep `macro.dxy` blocked; do not silently replace it.** A public-source check confirms:

- ICE identifies the ICE U.S. Dollar Index as the DXY benchmark and lists intraday/daily frequency and delivery mechanisms including ICE Data API and ICE Data Files. This is a genuine source lead, but the public catalog is a product description, not a confirmed no-cost public quote endpoint. References: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices and https://www.ice.com/fixed-income-data-services/data-and-analytics/proprietary-data
- ICE says use/redistribution of its market data may require the appropriate agreement; derived-data permission is reviewed case by case. Therefore no endpoint, terms, publication-time convention, or self-hosted collection permission has yet been accepted for this project.
- FRED/Federal Reserve publishes a daily **Nominal Broad U.S. Dollar Index** (`DTWEXBGS`), but that is a different basket and methodology from ICE DXY. It may be a candidate for a separately named metric in a future decision, not a drop-in replacement for `macro.dxy`. Reference: https://fred.stlouisfed.org/series/DTWEXBGS

**Next required evidence for the existing DXY metric:** identify a source and endpoint available under acceptable terms; establish whether the value is spot index, delayed quote, end-of-day close, or futures settlement; define the observation date/time and holiday/session calendar; capture a sample with source hash and retrieval metadata; then review and register the source. Until those steps are complete, no DXY observation can pass the readiness gate.

No registry source was added, no metric semantics were changed, and no scenario or production data was touched during this investigation.


### DXY research follow-up — publication cadence clarified

The Federal Reserve/FRED documentation clarifies an important operational distinction: DTWEXBGS has daily-dated observations, but the Federal Reserve says these daily data are updated in FRED once each week to capture the previous week. Therefore “daily frequency” does not mean a same-day live/current observation feed. Any future use as a separately named broad-dollar metric must register the publication/retrieval cadence, release lag, vintage/revision handling, and holiday calendar; it cannot satisfy the existing macro.dxy contract by substitution. Source: https://alfred.stlouisfed.org/category?cid=94&ob=pv&od=desc&t=broad

ICE index platform terms also state that, absent a relevant agreement, access/use and redistribution of ICE index information are restricted. This reinforces that a public page/catalog is not enough to authorize scraping or unattended self-hosted ingestion. Source: https://indices.ice.com/termsAndDisclaimers


## 32. BTC readiness CI acceptance — 2026-10-15

The E2E assertion for the canonical ETF blocker was updated to recognize all three valid fail-closed outcomes: missing latest ETF observation, stale/untraceable observation, or unverified fund completeness/revision/finality metadata. This fixes the test contract; it does not relax the runtime readiness policy or accept the current Farside candidate.

**Verified on commit `40e1c6e4771490b435f8045c8e2da13112b83b73`:**
- [VPS API Build Rehearsal #1355](https://github.com/olegsh247-stack/Crypto/actions/runs/38750299165) — **success**, including build, container/runtime registry import, disposable PostgreSQL migrations, API/Worker E2E, and BTC research evidence/snapshot lineage checks.
- [VPS Release Workflow validation #165](https://github.com/olegsh247-stack/Crypto/actions/runs/38750299177) — **success**.
- [BTC Scenario Readiness Gate #265](https://github.com/olegsh247-stack/Crypto/actions/runs/38750299197) — **success**.

**What this proves:** the readiness implementation and CI contract are internally consistent, and the VPS rehearsal is green. It does not prove that live candidate data satisfy the source contract.

**Next Plan 100 step — read-only BTC acceptance review:** verify the gate's output for the current required inputs and preserve the exact blocker reasons. Spot has a canonical Kraken candidate contract but must be fresh at evaluation time; ETF remains blocked because provider observation time and revision/finality are not established; DXY remains blocked because no approved feed is registered. Do not manufacture or persist observations to make the gate green. Keep BTC `not_evaluable` until all required inputs pass. No production DB writes, live ingestion, scenario/probability/monitoring changes, merge, or deployment were performed.


## 33. ETF source follow-up — publication cadence vs observation contract

A fresh review of the public source descriptions found two useful clarifications:

- Farside's own homepage describes its Bitcoin ETF figures as daily USD-million data updated in real time, typically during the evening/night in U.S. time. This supports treating the table as a changing publication, not as a provider-supplied immutable daily final record. It does **not** provide a per-row publication timestamp, revision ID, or explicit finality marker. Reference: https://farside.co.uk/
- SoSoValue's official Market Data API documentation lists ETF summary/history endpoints at `https://openapi.sosovalue.com/openapi/v1`. Access requires an API key. This is a concrete alternative-source lead, but the public API overview alone does not establish the endpoint response's observation-time meaning, revision/finality behavior, data licensing for this project, or whether it exposes the complete per-fund breakdown required by our acceptance contract. References: https://sodex.com/documentation/for-developers/api-reference/market-data-api and https://sodex.com/documentation/for-developers/developers/data-api/getting-started

**Decision:** do not switch the canonical ETF source or loosen the gate on this evidence alone. Next source-review task is to obtain an authorized SoSoValue API key through the user's own account (never commit it), inspect the exact summary-history response fields and documented terms, then make a read-only capture with response hash/retrieval time and compare reporting dates, per-fund completeness, units, and revision behavior against Farside. If no authorized key is available, keep the alternative marked unverified and proceed with the remaining offline acceptance work. Farside remains blocked until a defensible observation-time and revision/finality contract is established.

Sources: Farside says its table is updated in real time, generally evenings/nights U.S. time; SoSoValue documents the ETF API domain and requires an API key for access. Neither statement by itself establishes an accepted immutable/final observation contract.

No source registry, metric registry, runtime policy, database, ingestion schedule, or scenario state was changed as part of this research.

## 34. SoSoValue ETF API — проверка фактической структуры данных

Проверены публичные страницы официальной документации SoSoValue Market Data API (15 октября 2026).

### Что подтверждает документация

- `GET /etfs/summary-history` возвращает дневную агрегированную запись по BTC/US с полями `date`, `total_net_inflow`, `total_value_traded`, `total_net_assets`, `cum_net_inflow`. Поток выражен в USD; отрицательное значение означает net outflow. Документация ограничивает диапазон последним месяцем и исключает неторговые дни. Это полезный независимый контроль общего итога, но не доказательство полноты отдельных фондов.  
  Источник: https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/summary-history
- `GET /etfs` принимает `symbol` и `country_code` и документирован как список ETF с `ticker`, `name` и `exchange`; `GET /etfs/{ticker}/history` отдаёт историю по отдельному тикеру с `date`, `ticker`, `net_inflow`, `cum_inflow`, `net_assets` и другими полями. История ограничена последним месяцем. Это потенциальный путь к независимой проверке per-fund данных, но документация сама по себе не гарантирует, что список включает все фонды, требуемые нашим контрактом, или что каждый день полностью заполнен.  
  Источники: https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/list и https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/history
- API требует одобренный ключ в заголовке `x-soso-api-key`; ключ следует хранить только в секретном хранилище/переменной окружения, не в Git и не в переписке. Документация указывает квоты 100 000 запросов в месяц и 20 запросов в минуту на ключ.  
  Источники: https://sodex.com/documentation/for-developers/developers/data-api/getting-started и https://sodex.com/documentation/for-developers/developers/data-api/authentication-and-limits

### Что пока НЕ доказано

1. Можно ли получить полный и стабильный список всех BTC ETF, требуемых нашим контрактом, и достаточно ли отдельных ticker-history ответов для подтверждения полноты на каждый торговый день.
2. Как API определяет исправления прошлых значений, финальность торгового дня и повторную публикацию: в просмотренных схемах не документированы row-level revision ID, finality marker или отдельное время публикации/наблюдения.
3. Семантика поля `date` в endpoint по тикеру требует проверки: описание на странице называет его timestamp/Long, а пример показывает календарную строку `YYYY-MM-DD`. До ответа провайдера или проверки реального payload нельзя выводить из этого точное время наблюдения.
4. Условия разрешённого использования и хранения данных для данного проекта не установлены одним лишь описанием endpoint.
5. Ответы API ещё не получены: доступ к ключу не предполагался и не имитировался.

### Решение и следующий шаг

SoSoValue **не принимается пока как канонический источник**. Его aggregate-history можно рассматривать как контроль общего дневного итога; per-ticker history — как кандидата для проверки полноты. Следующая безопасная проверка, если будет доступ к одобренному ключу, — read-only запрос короткого периода, сохранение сырого ответа с SHA-256 и временем получения, сверка общего итога с суммой per-ticker значений, списка фондов, единиц, торговых дат и поведения при повторном чтении. Никаких записей в БД и автоматического обновления канонических наблюдений.

Если ключа нет, работу не блокируем: фиксируем SoSoValue как документированный, но непроверенный кандидат и продолжаем офлайн-приёмку остальных BTC-контрактов. ETF остаётся блокером до доказанного контракта observation time и revision/finality; DXY остаётся блокером до утверждения источника. BTC остаётся `not_evaluable`.

**Границы изменений:** только документация Плана 100; metric/source registries, runtime, БД, ingestion, scenario state, probabilities, monitoring, merge и deployment не менялись.

## 35. DXY source review — official identity and permitted use

Проверены официальные страницы ICE Data Indices и ICE Futures U.S. (15 октября 2026).

- ICE определяет DXY как **ICE U.S. Dollar Index**, рассчитываемый по spot-ценам компонентов валютной корзины; для данных указаны intraday/daily частоты и варианты real-time, delayed, end-of-day и historical доставки через коммерческие продукты ICE. Это подтверждает, что метрика должна быть привязана к конкретному виду DXY-данных и режиму времени, а не к общему названию «USD index».  
  Источник: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices
- Страница спецификации DX futures описывает отдельный торгуемый фьючерсный контракт с квартальными экспирациями и settlement-методикой. Его значение нельзя автоматически подставлять вместо spot-index DXY: контракт и underlying index — связанные, но разные временные ряды.  
  Источник: https://www.ice.com/products/194/US-Dollar-Index-Futures/
- Официальная спецификация ICE заявляет исключительные proprietary rights на DXY, его значения, состав, веса и метод расчёта и ограничивает любое использование без письменного согласия ICE. Поэтому наличие общедоступной веб-страницы или стороннего символа не доказывает право на автоматический сбор, хранение и перераспространение данных в проекте.  
  Источник: https://www.ice.com/products/194/US-Dollar-Index-USDX-Futures?cat=204

### Решение

DXY остаётся заблокированным. Нельзя автоматически выбрать DX futures, сторонний публичный тикер или широкий индекс ФРС в качестве замены. Для принятия нужны конкретный endpoint/provider, подтверждённое право использования для self-hosted аналитики и хранения, тип ряда (spot DXY / delayed / EOD / futures), timezone/время наблюдения, календарь публикации и стабильная provenance-схема. Если ICE не предоставляет подходящий доступ на приемлемых условиях, следует отдельно решить, оставлять ли DXY обязательным для сценария или официально пересмотреть сам сценарный контракт — не менять его молча.

**Границы изменений:** только документация Плана 100. Metric/source registry, required-input policy, runtime, база данных, ingestion, scenario state/probability/monitoring, merge и deployment не менялись.

## 36. BTC readiness provenance hardening — raw payload hash required

Во время read-only review readiness runtime найдено несоответствие контракту provenance: проверка для обязательных не-ETF входов допускала отсутствие `source_payload_sha256`, хотя текущий collector/candidate contract сохраняет SHA-256 сырого ответа и результат readiness должен быть пригоден для воспроизводимой проверки происхождения.

**Исправление в PR #83:**
- `validObservation` теперь требует строковый 64-символьный hex SHA-256 для обязательного входа; отсутствующий, неверного формата или невалидный hash блокирует вход.
- Причина блокировки теперь явно отражается как `source_payload_hash_missing_or_invalid`.
- Добавлен regression test: свежая, иначе корректная spot-price запись без hash не должна пройти readiness.

**Commits:** runtime fix `da05df06c312f1f899084c0c8beb8772a4ab2515`; regression test `25a06f35d2deb17de513500eaa83073960558d11`.

**Проверка на момент записи:** предыдущие BTC Readiness Gate #268, VPS Build Rehearsal #1361 и VPS Release Workflow validation #168 завершились успешно на предыдущем commit/состоянии; они не подтверждают новый regression test. Для текущих commit отдельный workflow run пока не найден. Локальный запуск CI также невозможен в текущей среде из-за отсутствия сетевого доступа к GitHub. Поэтому новый тест и runtime fix считаются **ожидающими подтверждения CI**, а не уже проверенными.

**Безопасность:** только readiness validation и тест; не менялись source/metric registries, БД, ingestion, scenario state/probability/monitoring, merge или deployment. BTC остаётся `not_evaluable` до принятия ETF и DXY inputs и прохождения всех ворот.

## 37. Payload-hash regression coverage — missing and malformed hashes

В продолжение §36 добавлены два regression test в `scripts/btc-scenario-readiness.test.mjs`:

- обязательный spot input с некорректной строкой вместо SHA-256 должен блокироваться с `source_payload_hash_missing_or_invalid`;
- ETF-история с некорректным hash хотя бы у одной сессии не должна считаться принятой пятёркой сессий.

Commit: `6105ac61323bbe6334818c739c9a2cc3742a4d7b`.

**Проверка:** код runtime и тесты присутствуют в PR #83, но для новых коммитов отдельный CI run пока не появился. Предыдущие зелёные проверки относятся к более раннему коду; результат новых regression test не объявляется подтверждённым. Изменения остаются в Draft PR и не развёртываются.

**Границы:** только runtime validation/tests и документация. Нет изменений БД, источников/метрик, ingestion, scenario state, probabilities, monitoring, merge или deployment.

## 38. BTC candidate timestamps — require explicit normalized UTC

В read-only review `scripts/prepare-btc-observation-candidates.mjs` обнаружено, что `validIso` фактически принимал любые строки, которые понимает `Date.parse`, включая неоднозначные локальные даты и timestamp с часовым смещением. Это слабее контракта источника, где время наблюдения и retrieval должны быть представлены нормализованным UTC ISO-8601.

**Изменение:**
- валидатор теперь требует форму `YYYY-MM-DDTHH:mm:ss[.fraction]Z`;
- добавлены тесты, которые блокируют неоднозначную локальную дату и timestamp с `+03:00`;
- исходное UTC-время отдельной сделки Kraken по-прежнему используется как `observed_at`; время получения ответа остаётся `retrieved_at`.

Commits: initial runtime change `d10950c6242cf9d2a63078dbdca09f56f9585289`; regex escaping correction `fa8a65b19f6bc15c0a521a14d2b3f0f08027fc1b`; tests `42e9aa9915a9f3b2937c674349080cb093b41ecc`. The regex line was re-read from GitHub after the first update and its escaping corrected before closing this review.

**CI status:** новый код и тесты ещё ожидают автоматического подтверждения; успешные старые runs не считаются доказательством этой правки. Ничего не записывалось в БД, сборщик не запускался против live endpoint, candidate не стал persistable. PR #83 остаётся Draft.



## 39. Обязательный журнал работ — «Промт 100»

**Обязательное требование Плана 100 с 2026-10-15:** в отдельном документе **«Промт 100»** в Library проекта Crypto вести журнал только важных, содержательных результатов. Для каждой записи обязательны поля **Дата | Действие | Результат**. Фиксировать существенные решения, изменения архитектуры/контрактов, результаты проверок, значимые ошибки и блокеры, достигнутые этапы, важные commit/PR/CI. Не записывать каждое мелкое действие и повторную проверку без нового результата. Не записывать планы как выполненные; незавершённые проверки помечать как ожидающие результата. Журнал не заменяет План 100 и не меняет порядок этапов.

### Правила ведения журнала

1. Добавлять запись, когда есть важный новый результат, решение, изменение, блокер или завершённая значимая проверка; не дробить одну работу на множество мелких строк.
2. Использовать формат таблицы: `Дата | Действие | Результат`; даты указывать в `Europe/Riga`.
3. Отделять подтверждённые факты от предположений; добавлять SHA и ссылки на GitHub, когда они действительно важны для проверки результата.
4. Незавершённую проверку помечать как ожидающую результата; не объявлять её успешной заранее.
5. В начале сессии сверять актуальные План 100, Промт 100 и GitHub. В конце рабочего блока обновлять журнал, если появился значимый результат.
6. Сохранять актуальную копию Промта 100 в Library проекта Crypto; не создавать дополнительные файлы-дубликаты.
7. Фиксировать существенные отрицательные результаты, блокеры и решения не менять контракт; пропускать повторения без новой информации.


## 40. Проверка source-registry / PostgreSQL seed consistency

**Дата:** 2026-10-15.

После добавления `macro.fred_broad_usd_candidate` в source registry первый readiness gate упал не из-за сценарной логики, а потому что общий validator требует соответствующую запись в `infrastructure/postgres/seed-v1.sql`. Seed был исправлен коммитом `69045bc`, после чего все пять связанных CI runs завершились успешно. Затем notes кандидата уточнили weekly H.10 distribution cadence и revision/vintage handling: commits `a1a607a` и `777e53b`. На обоих SHA readiness gate, release validation, seed idempotency и VPS API build rehearsal завершились успешно; конкретные ссылки записаны в Library «Промт 100».

**Вывод:** registry/seed согласованы, тесты и сборки проходят. Но это не делает BTC `evaluable`: `macro.dxy` по-прежнему fail-closed; ICE feed access/licensing не подтверждены, а `DTWEXBGS` — отдельная недельно публикуемая broad-dollar series с возможными ревизиями, не эквивалент DXY и не тихая замена в существующем сценарии. Следующий шаг — продолжать контракт ETF source provenance/finality либо получить подтверждённый лицензированный ICE DXY feed. Никаких production/DB/ingestion changes не выполнялось.


## 41. ETF candidate contract — read-only review

**Дата:** 2026-10-15.

Read-only review of `scripts/capture-btc-public-sources.mjs`, `scripts/parse-farside-etf-table.mjs`, `scripts/prepare-btc-observation-candidates.mjs` and their tests confirms the intended safety boundary: raw HTTP response is hashed and retained; `Date`, `Last-Modified`, `ETag`, `Cache-Control` and `Expires` are preserved as transport metadata only; none is relabelled as the metric `observed_at`; Farside rows remain `REVIEW_ONLY_BLOCKED` with `provider_revision=null`, `finalization_status=unknown`, and a page-body hash explicitly scoped to the full response, not an individual row. Missing dashes remain null; all-dash placeholder rows are not zero observations; partial fund reporting and totals outside the display-rounding envelope are blocked.

The public Farside page says the table is generated automatically in real time, but it does not provide a stable row-level publication timestamp or provider revision/finality identifier in the parsed contract. The unresolved choice is therefore a contract/policy decision, not a parser bug: either obtain a documented provider publication/revision/finality contract, or explicitly approve an immutable-snapshot reconciliation policy that records capture time, payload hash, parser/version, reporting date, all-funds completeness, total reconciliation, and any later snapshot differences. Until one policy is approved and tested, ETF rows remain non-persistable and BTC remains `not_evaluable`. No source data were ingested, no DB writes occurred, and no scenario state/probabilities were changed.

CI on commit `9dc132849d75d4b6b84ffff4d04f49e22b7355d5`: BTC Scenario Readiness Gate, VPS release validation, seed idempotency rehearsal and both VPS API Build Rehearsal runs passed. See [readiness](https://github.com/olegsh247-stack/Crypto/actions/runs/38801450296), [release validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38801450260), [seed rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38801450265), [API rehearsal 1](https://github.com/olegsh247-stack/Crypto/actions/runs/38801450342), [API rehearsal 2](https://github.com/olegsh247-stack/Crypto/actions/runs/38801441022).


## 42. Proposed ETF immutable-snapshot policy — pending approval

**Status: proposal only; not approved for readiness acceptance or ingestion.**

The read-only audit indicates that Farside does not expose a stable row-level publication timestamp, provider revision ID or explicit finality flag in the captured table contract. A practical candidate is therefore to treat each captured full-page response as an immutable source snapshot, rather than infer an event timestamp or repeatedly recalculate the historical daily totals during development.

### Proposed snapshot record

- canonical source identity and exact source URL;
- retrieval timestamp in normalized UTC;
- SHA-256 of the exact raw response bytes and retained raw response;
- parser name/version and contract version;
- provider reporting date for each row, kept distinct from retrieval timestamp;
- all expected funds enumerated, reported-fund count, missing funds and displayed aggregate total;
- calculated sum only as a reconciliation check, with explicit display-rounding tolerance and result;
- snapshot identity and supersession link when a later capture changes a previously captured row;
- no inferred provider revision, no inferred publication timestamp, and no conversion of missing/placeholder cells to zero.

### Acceptance conditions

1. A snapshot is eligible for review only when the source URL is canonical, the raw body hash verifies, and parser/version are recorded.
2. A daily row is eligible only when all expected funds are present and the displayed aggregate reconciles within the explicitly documented rounding envelope.
3. Later captures that differ for the same reporting date must create a new snapshot/reconciliation record, not overwrite history silently; the diff and reviewer decision must be retained.
4. Freshness must be based on an explicitly chosen contract and source publication cadence; retrieval time must not be relabelled as observation time. Rows outside the freshness window remain blocked.
5. Only after the user explicitly approves this policy may the runtime readiness contract accept `reconciled_snapshot` as an alternative to provider-declared finality. Until then, `finalization_status=unknown` remains blocked and no ETF candidate becomes persistable.

**Why this is proposed:** it provides reproducible lineage even if the website silently edits historical cells, while acknowledging that it cannot prove provider finality. It is not equivalent to an authoritative provider revision timestamp. No code, database, ingestion, scenario state or probabilities were changed by documenting this proposal.


## 43. Dual-source ETF research mean implementation — 2026-10-16

The offline BTC candidate mapper now emits a separate `etf_research_derived_rows` collection using `arithmetic_mean_2_sources` when both Farside and TFTC provide numeric aggregates for the same date and the Farside row is complete and reconciled. Each derived row preserves both raw source values, source IDs/URLs, capture timestamps and full-response SHA-256 values, plus method version. The derived row is explicitly `RESEARCH_DERIVED`, `OFFLINE_RESEARCH_ONLY`, `persistable: false`, with `observed_at: null` and `finalization_status: unknown`.

Regression tests were added for the exact-precision mean and for refusing to derive a mean from incomplete Farside reporting. The 2026-10-07 example uses Farside `-484.9 USDm` and captured TFTC value `-487.0674115 USDm`, producing `-485.98370575 USDm` (displayed as `-486.0 USDm` to one decimal). Both source values remain unchanged.

Commits: implementation `7408a9a2e08de7f5159462122f6d78183decf974`; tests `0b3db0832a4a49423d561c408eb597a00232335a`. Validation completed: [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38814920750) — success; [BTC Public Source Staging (Read Only)](https://github.com/olegsh247-stack/Crypto/actions/runs/38814920503) — success, including parser/candidate tests and one read-only source capture. A second VPS Build Rehearsal for the Plan update also passed: [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38814979812). The staging artifact contains 10 `RESEARCH_DERIVED` means, including 2026-10-07 `-485.98370575 USDm`; all are non-persistable and preserve source provenance. No production database access/writes, ingestion, scenario evaluation, state/probability/monitoring changes or deployment were performed. BTC remains `not_evaluable` until the separate ETF production acceptance requirements and approved DXY source are satisfied.


## 44. Live BTC source capture is manual-only — 2026-10-16

The source-staging workflow was adjusted so every relevant code push runs parser/candidate unit tests, while public-source capture and artifact creation run only after explicit `workflow_dispatch`. This avoids recapturing changing public totals on every development commit while preserving a deliberate read-only capture path for review. The most recent one-off artifact is retained for validation only; it does not feed production data or scenario state.

Workflow change commit: `4f0c931ec4eb3291352bef575b659c16a7d01f27`. CI for this workflow-trigger change is pending; verify it before considering the change complete. No production database access/writes, ingestion, scenario evaluation, state/probability/monitoring changes or deployment were performed.


## Plan 100 checkpoint — BTC ETF source lifecycle contract (2026-10-16)

**Completed:** documented the public evidence available for Farside and TFTC publication cadence, lineage, revisions and reuse terms in [BTC ETF publication/revision/finality review](BTC-ETF-PUBLICATION-REVISION-FINALITY-REVIEW-2026-10-16.md), and linked it from the [BTC source acceptance matrix](BTC-SOURCE-ACCEPTANCE-MATRIX-2026-10-13.md).

**Evidence-based outcome:** Farside describes real-time updates, usually in the US evening/night, but the reviewed public material does not establish a per-row publication timestamp, provider revision identifier, correction-history mechanism or finality point. TFTC explicitly describes twice-daily synchronization, automatic revisions to recent and older dates, CC BY 4.0 reuse with attribution, and lineage that varies by period. This is enough to document provider behavior, not enough to assert finality or silently change canonical source priority.

**Still blocked:** ETF production acceptance. Keep provider observation/publication time and finalization unknown unless supported by explicit evidence. Preserve raw source values, source IDs/URLs, retrieval times, HTTP metadata and response hashes. The arithmetic mean of Farside and TFTC remains an offline research-derived value, not a provider-reported value and not persistable. A production policy must explicitly select either provider-backed lifecycle guarantees or an approved immutable project-snapshot/revision policy; any source-priority change requires explicit approval.

**Safety:** no registry change, production DB access/write, ingestion, deployment, scenario evaluation/state/probability change or monitoring write. BTC remains `not_evaluable`.


## Plan 100 checkpoint — ETF snapshot-policy feasibility (2026-10-16)

Static code review confirmed that the current manual-only capture workflow emits raw responses, manifest, normalized review-only candidates and response hashes, but uploads them as a GitHub Actions artifact retained for **7 days**. No common versioned snapshot identity, durable archive/retrieval guarantee, deterministic row-level diff against the prior capture, or project-owned revision/supersession relation is implemented. Therefore the immutable snapshot path remains a **design option, not a completed or approved policy**. Details: [ETF immutable snapshot policy feasibility review](BTC-ETF-SNAPSHOT-POLICY-FEASIBILITY-REVIEW-2026-10-16.md).

Next technical work after policy review: design and test an offline deterministic row-level diff and versioned snapshot manifest. Do not choose a permanent storage destination, change retention, or define production eligibility/finality silently. The source lifecycle review and this static audit do not authorize ingestion or production changes. BTC remains `not_evaluable`.


## Plan 100 checkpoint — offline ETF snapshot diff implemented (2026-10-16)

**Implemented on the PR branch:** `scripts/diff-btc-etf-snapshots.mjs` builds a deterministic review snapshot from an existing capture directory (`manifest.json` + `observation-candidates.json`) and compares a prior/current pair. It classifies changed/new/missing/incomplete/non-comparable rows; compares by source identity + reporting date; preserves both previous and current normalized row payloads in the diff; and distinguishes a repeated provider-payload hash set from a new capture time. It is offline-only and does not read/write a database or alter either source snapshot.

**Tests added:** `scripts/diff-btc-etf-snapshots.test.mjs` covers same-payload no-op across different retrieval times, deterministic comparison independent of row order, changed values preserving both versions, new dates, missing dates within source coverage, placeholder/null handling, failed-source non-comparability, truncated windows and explicit no-production-write flags. The push validation workflow now runs this test file.

**Not yet claimed:** tests have been committed but the CI result for the latest commit must be checked before calling them passed. This is a diagnostic comparison tool, not an archive/retention policy and not a provider-finality signal. Durable storage, eligibility rules, and source licensing remain unresolved; BTC remains `not_evaluable`. No workflow dispatch/live capture, DB operation, ingestion, deployment, scenario evaluation/state/probability or monitoring write was performed.


## Plan 100 checkpoint — ETF snapshot diff validation passed (2026-10-16)

**Verification:** BTC Public Source Staging run [#116](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520636) completed successfully on commit `4cf32759b9eb09f2e379c8408275ac9135ea2f64`. Its validation job passed Farside parser/placeholder tests, BTC candidate-normalization tests, and the offline ETF snapshot-diff tests. The live-capture job was **skipped**, as intended. [VPS API Build Rehearsal #1449](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520738) also passed all build, test, disposable-PostgreSQL, backup/restore and E2E steps.

**Correctness hardening:** the snapshot diff now validates real calendar dates, not merely strings parseable by JavaScript's date parser; an impossible date such as `2026-02-31` is rejected. Regression test added. This confirms the implemented checks passed in CI; it does not establish provider finality, durable snapshot retention, ETF production acceptance or BTC scenario readiness. BTC remains `not_evaluable`; PR #83 remains Draft/unmerged. No live capture, production database operation, ingestion, deployment or scenario-state change was performed.

## Plan 100 checkpoint — exportable ETF snapshot manifest (2026-10-16)

**Implemented on PR branch; CI pending:** the offline snapshot tool can now export a versioned JSON manifest from an existing capture directory using `--build <capture-dir> <snapshot.json>`. The comparison command accepts either capture directories or previously exported snapshot-manifest JSON files. The manifest contains `snapshot_id`, manifest/candidate hashes, source-payload fingerprint, per-source coverage and normalized ETF rows. This creates a portable, deterministic review artifact without choosing an archive destination or changing retention.

**Tests added:** assert the versioned ID/hash fields and captured source coverage; clarified that row-order invariance applies to the normalized row diff, while the snapshot identity remains tied to exact captured artifact bytes.

**Safety and remaining gates:** the new code/test CI result must be verified before this step is considered validated. No source capture was dispatched; no permanent storage, retention, provider finality, eligibility or supersession policy was selected. ETF production acceptance remains blocked and BTC remains `not_evaluable`.

## Plan 100 checkpoint — snapshot-manifest integrity verification (2026-10-16)

**Implemented; CI pending:** exported manifests now include a SHA-256 over the canonical serialized manifest content, explicit review-only mode, and no-production-access/write flags. When a saved manifest is loaded for comparison, its schema and content hash are validated; edits to normalized rows are rejected instead of being silently compared under the original snapshot ID. A tampering regression test was added.

**Next gate:** verify BTC Public Source Staging and VPS API Build Rehearsal results for the latest code/test commits. The portable manifest is still only a review artifact: this does not establish durable retention, provider finality, an approved revision/supersession policy, ETF production acceptance or BTC evaluability. No live capture was dispatched.

## Plan 100 checkpoint — snapshot manifest export and integrity tests passed (2026-10-16)

**Confirmed:** [BTC Public Source Staging #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38821070436) passed all validation steps on commit `31cc3188ff8b9a928f90cbcb93eb1ca04a3e2745`; the live-capture job was skipped. This includes the CLI end-to-end test that exports a snapshot manifest and compares saved manifests offline, plus content-tampering rejection and source-provenance assertions. [Run #118](https://github.com/olegsh247-stack/Crypto/actions/runs/38821054244) also passed the manifest integrity implementation tests.

**Current status:** the separate VPS API Build Rehearsal for the latest commit is still running; do not claim it passed until completed. The offline staging tests do not approve ETF production inputs, establish durable retention/finality, or make BTC evaluable. PR #83 remains Draft/open/unmerged; no live capture was dispatched.

## Plan 100 checkpoint — ETF revision/eligibility decision prepared (2026-10-16)

Created [BTC ETF snapshot revision and research eligibility proposal](BTC-ETF-SNAPSHOT-REVISION-ELIGIBILITY-PROPOSAL-2026-10-16.md). It separates immutable evidence capture from project revision links and from eligibility to use a row in an offline research scenario. It compares provider-declared finality, project-stabilized research snapshots, and leaving ETF blocked. Recommended direction is to keep production blocked and consider a separate research-only stability rule only after explicit approval.

This is a decision proposal, not an adopted policy. Archive location/retention, stability window, revision behavior, and research-scenario eligibility remain open. No source priority or production behavior changed.


## Plan 100 checkpoint — VPS snapshot-lineage rehearsal passed (2026-10-16)

**Confirmed:** [VPS API Build Rehearsal #1474](https://github.com/olegsh247-stack/Crypto/actions/runs/38821243278) completed successfully for commit `6ba7e09877d50109aba13220cb224755547830ba`. All job steps passed, including VPS-only guard, runtime/API/Worker builds, contract tests, PostgreSQL migrations/bootstrap, canonical BTC input registry, read-only provenance audit, idempotency/duplicate reconciliation, backup/restore, API/Worker E2E, offline contract invariants and BTC research evidence/snapshot lineage E2E. Combined with [BTC Public Source Staging #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38821070436), the latest branch has successful staging and VPS-rehearsal evidence.

**Scope limit:** these are CI/test-environment results, not production cutover or provider finality. PR #83 remains Draft/open/unmerged; BTC remains `not_evaluable`. No live capture, production DB operation, ingestion, deployment, scenario-state/probability change or monitoring write was performed.


## Plan 100 checkpoint — processing-artifact provenance bound into ETF snapshot identity (2026-10-16)

**Finding:** review of the exported manifest found a reproducibility gap: hashes covered the raw capture manifest/candidates, but those artifacts did not identify the exact capture/parser/normalizer/metric-registry code that produced them.

**Implemented on PR #83 branch:** capture manifest records SHA-256 of the capture script and Farside parser; normalized candidate output records SHA-256 of the candidate normalizer, Farside parser and metric registry, and carries capture provenance forward. Snapshot manifest schema/algorithm moved to version 2 and binds both provenance records into its ID and content integrity hash. Tests cover the new identity and provenance fields.

**Limits:** these hashes identify exact file bytes; they are not a signature, archive, workflow-run attestation or provider-finality proof. Durable retention and eligibility/revision policy remain unresolved. No live capture, production DB operation, ingestion, deployment, scenario evaluation or scenario-state/probability change was performed.


## Plan 100 checkpoint — v2 ETF provenance validation and VPS rehearsal passed (2026-10-16)

**Confirmed for commit `3b39f0db5a059ca091dffe04a83a85e070f577aa`:** [BTC Public Source Staging #38822111790](https://github.com/olegsh247-stack/Crypto/actions/runs/38822111790) and [VPS API Build Rehearsal #38822111807](https://github.com/olegsh247-stack/Crypto/actions/runs/38822111807) both completed successfully. Staging validated the v2 ETF snapshot/provenance tests; the live capture job was skipped as intended. VPS rehearsal passed all steps, including VPS-only architecture, API/Worker builds, PostgreSQL bootstrap/migrations, BTC registry/provenance audit, idempotency/duplicate reconciliation, backup/restore, and BTC snapshot-lineage E2E.

**Correction:** an earlier staging run exposed a stale v1 snapshot-ID prefix assertion after the v2 identity change; commit `3b39f0d` corrected the validator and the current staging run passed.

**Limits and next gate:** this is CI/test-environment evidence, not provider finality, durable archive/retention, production cutover, or scenario eligibility. PR #83 remains Draft/open/unmerged; BTC remains `not_evaluable`. Do not dispatch live capture or change production data, ingestion, scenario state, scores or probabilities without explicit authorization. Continue with the unresolved ETF retention/revision/eligibility decisions and BTC source-contract blockers.


## Plan 100 checkpoint — duplicate ETF snapshot rows rejected; audit aligned with readiness (2026-10-16)

**Implemented on PR #83 branch:** commit 7c284df62e1625b587239a03715dc99b44361742 makes the offline snapshot builder fail closed on duplicate ETF source identities and duplicate source/reporting-date keys; exported snapshot validation rejects duplicate normalized row keys instead of allowing JavaScript Map construction to silently overwrite one row. Regression tests were added. [BTC Public Source Staging #38851210312](https://github.com/olegsh247-stack/Crypto/actions/runs/38851210312) passed for that commit.

**Additional audit correction:** commit 226a3c77d8bd0ee53d4851dac5b502283bb2bdae updates the read-only PostgreSQL provenance audit so ETF history coverage uses explicit period_start reporting dates and the registered canonical Farside source/allowed URL patterns; it no longer substitutes observed_at for a missing reporting date or counts TFTC as canonical. Documentation now distinguishes the 14-day history-coverage diagnostic from the separate 36-hour latest-row and revision/finality gates. [VPS API Build Rehearsal #38851337098](https://github.com/olegsh247-stack/Crypto/actions/runs/38851337098) completed successfully, including PostgreSQL migrations, the read-only BTC provenance audit, backup/restore and all API/Worker E2E steps.

**Limits:** these are code/CI and disposable-PostgreSQL results only. No live capture, production DB write, ingestion, deployment, scenario-state/probability change or PR merge occurred. ETF remains blocked pending retention/revision/eligibility decisions; DXY remains blocked pending an approved metric/source choice; BTC remains not_evaluable.


## 2026-10-16 — DXY candidate list assessed; no source approved

Reviewed the user-supplied candidates against current public instrument and terms documentation. Yahoo Finance DX-Y.NYB is visibly labelled US Dollar Index / ICE Futures, but Yahoo terms restrict automated collection without prior permission and redistribution; yfinance is unofficial. Dukascopy's published XML-data license describes derivative index quotes as one-minute averages rather than exchange values and imposes declared-use/approval and non-commercial restrictions; the third-party download tool does not prove an authorized exact ICE cash-DXY feed. TradingView's terms restrict non-display processing. FRED DTWEXBGS remains a different broad-dollar index; Portara/CQG is a paid historical-futures lead, not proof of cash-index data rights. Full findings are in docs/BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md.

**Decision unchanged:** no candidate satisfies instrument identity + permitted automated collection/storage + stable endpoint/timestamp semantics + revision policy. Do not promote a source or relabel another metric as DXY. Keep macro.dxy blocked. Next paths: confirm an authorized ICE DXY product/feed and terms, or separately propose a new broad-dollar metric based on DTWEXBGS with an explicit product-contract change. BTC remains not_evaluable.


## Plan 100 decision — stop blocking BTC on DXY (2026-10-16)

**Decision:** DXY is optional macro context for the first BTC research scenario, not a required readiness input. The source hunt is closed for this stage.

- Primary visible/manual reference for ICE DXY: Yahoo Finance `DX-Y.NYB`; no automated Yahoo collection or redistribution without authorization.
- Backup context if useful: FRED `DTWEXBGS`, clearly named as the Federal Reserve Nominal Broad U.S. Dollar Index. It is not ICE DXY, has a different methodology, and is subject to release lag/revisions; do not substitute it into the DXY series.
- If neither is usable/current, omit the macro context and proceed. DXY absence or staleness must not block BTC readiness.
- The metric registry now marks `macro.dxy` as optional; its source priority remains empty, so no unapproved automated feed is implied.

**Next work:** continue BTC source-contract/readiness work, prioritizing the remaining ETF-flow revision/finality/eligibility blocker and then the reproducible offline scenario rule. Do not spend another research cycle on DXY unless a concrete failure materially affects the scenario. No production data, ingestion, scenario state, probabilities, or deployment changed.


## Plan 100 correction — DXY is optional through readiness and rule evaluation (2026-10-16)

The DXY source hunt is closed for the first BTC scenario. The readiness gate no longer requires DXY, and deterministic offline rule v2 no longer throws when DXY, supporting hashrate, or deferred fee/subsidy context is absent. Required rule inputs are price return and the five-session ETF-flow aggregate; missing optional signals are omitted, never treated as zero. The existing ±3 score threshold remains unchanged, so with only two required signals the outcome is Base. This changes neither published 30/50/20 probabilities nor any stored scenario state. Yahoo `DX-Y.NYB` remains a manual reference only; FRED `DTWEXBGS` is a distinct optional proxy, not DXY. ETF publication/revision/finality is the remaining source-acceptance blocker.


## Plan 100 checkpoint — optional-input rule and VPS rehearsal verified (2026-10-16)

**Confirmed:** [VPS API Build Rehearsal #38853001917](https://github.com/olegsh247-stack/Crypto/actions/runs/38853001917) passed for commit `d3df1e81f21e8af1ba0af2f511fb92abaca84e59`. The run completed the VPS-only guard, shared runtime/API/Worker builds, PostgreSQL migration/bootstrap, read-only BTC provenance audit, idempotency/duplicate rehearsal, backup/restore, and API/Worker E2E checks. The E2E assertion now confirms that missing DXY does not block readiness while ETF source acceptance can still block the live input gate.

**Scope:** this validates the read-only readiness contract and VPS test environment, not a production scenario evaluation. Rule v2 unit tests are configured to run on feature/fix-branch pushes so optional-input behavior can be checked independently. No production database, ingestion, scenario state, published probabilities, deployment, or PR merge was changed.


## Plan 100 checkpoint — optional-input unit tests and VPS rehearsal passed (2026-10-16)

**Confirmed for code commit `27a18a3d1434ac1298e42222c288c9560ce30950`:** [BTC Scenario Readiness Gate #38853311612](https://github.com/olegsh247-stack/Crypto/actions/runs/38853311612) passed, including registry validation and the readiness/directional-rule unit suite. [VPS API Build Rehearsal #38853311389](https://github.com/olegsh247-stack/Crypto/actions/runs/38853311389) also passed all build, PostgreSQL rehearsal, read-only provenance, idempotency, backup/restore and API/Worker E2E checks.

**Result:** DXY is optional in the canonical readiness registry and offline rule v2; missing DXY/hashrate/fee-ratio inputs are omitted rather than imputed. ETF source revision/finality/eligibility remains the independent blocker for current persisted observations. No production write, ingestion, deployment, scenario-state persistence, probability change, or PR merge occurred.


## Plan 100 decision and implementation — ETF project-stabilized research eligibility (2026-10-16)

**Decision accepted by the user:** use a project-stabilized snapshot for offline research when provider-declared finality is unavailable. Do not claim provider finality.

**Implemented on PR #83 branch:**
- Policy: `docs/BTC-ETF-PROJECT-STABILIZED-RESEARCH-POLICY-2026-10-16.md`.
- Evaluator: `scripts/evaluate-btc-etf-research-eligibility.mjs`.
- Dedicated tests: `scripts/evaluate-btc-etf-research-eligibility.test.mjs`, wired into the read-only source-staging workflow.
- Eligibility requires two valid distinct captures at least 24 hours apart; both Farside and TFTC captured in both; exactly one complete/reconciled row per source for the date; and unchanged per-source row fingerprints across captures. Output is `ELIGIBLE_FOR_REVIEW` only and requires explicit human approval.
- Changed rows are revision candidates; prior evidence is retained and affected offline research must be re-evaluated. Failed/incomplete/missing data never becomes zero.
- If official sources fail, non-official sources may be researched as clearly labelled corroboration, but cannot silently replace canonical sources. Instrument identity, metric meaning, coverage, terms/licensing and provenance require review before approval.
- The 7-day GitHub Actions artifact is not a durable archive. Until project-controlled retention and recovery are demonstrated, a date cannot pass review merely because a temporary artifact exists.

**Validation:** [BTC Public Source Staging #38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) passed, including the new eligibility-policy tests; live capture was skipped as intended. VPS API Build Rehearsal [#38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) is still running at the time of this note; do not mark it successful until completed.

**Boundary:** no live capture, production database writes, ingestion, scenario evaluation, scenario-state/probability/monitoring changes, deployment, or PR merge. This closes the policy/code gate only; it does not automatically make BTC `evaluable`.


### Validation completion update — 2026-10-16

The previously pending [VPS API Build Rehearsal #38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) has now completed successfully. Together with [BTC Public Source Staging #38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856), this confirms the policy unit tests and the VPS build/E2E rehearsal for the implementation commit. The VPS run is CI/test-environment evidence only; it does not validate live source availability or durable archive retention. PR #83 remains Draft/open/unmerged, and BTC is not automatically evaluable.


## Plan 100 — alternative BTC ETF source review (2026-10-16)

**Completed:** [BTC ETF alternative-source review](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md).

SoSoValue's documented API is the strongest next candidate for a manual, offline corroborating capture: it exposes ETF aggregate/per-fund history, requires an API key, and the documented per-fund history is limited to the most recent month. API terms, exact aggregate semantics, key access, timestamp/finality behavior, and actual date-level parity remain unverified. No API request or capture was performed.

**Critical lineage finding:** TFTC states that its current daily aggregates and ongoing per-fund flows come from SoSoValue, while historical per-fund history through mid-2026 is compiled from issuer disclosures tabulated by Farside. Therefore Farside and TFTC are different publishers but their current daily flow lineage overlaps. The already approved arithmetic mean remains a project-defined research comparison metric, **not an independent two-source consensus**. Adding SoSoValue would help verify lineage but must not be counted as a third independent vote. Any change to the metric itself requires a separate decision.

SatoshiMacro (Farside + SoSoValue with last-known-good fallback), CryptoETF.today (API key; terms/lineage not yet established), and Newhedge (BTC-denominated flow series with a seven-day revision window) were reviewed as alternatives; none is approved or promoted to canonical priority.

**Next safe gate:** inspect SoSoValue API terms and exact aggregate contract, confirm key access without exposing secrets, then implement a manual-only offline candidate adapter and compare the same reporting dates/fund universe. Do not commit raw payloads to the public repo until redistribution rights are established. Durable project-controlled evidence retention remains a blocker; BTC stays `not_evaluable`.


### Offline SoSoValue candidate adapter — 2026-10-16

Added `scripts/prepare-btc-sosovalue-etf-candidates.mjs` and dedicated tests, wired into `btc-public-source-staging.yml`. This adapter only normalizes an already captured response; it performs no network calls and reads no API key. It preserves the response-body SHA-256 and retrieval timestamp, converts documented USD totals to USD million/day, keeps provider observation time and finality unknown, and blocks malformed dates, duplicate dates, missing/non-numeric values, invalid endpoint URLs, invalid retrieval timestamps, and non-200 responses. Output is explicitly non-persistable and remains a candidate only.

No SoSoValue request was made because API access/terms and redistribution rights have not been verified. This is an offline adapter scaffold, not evidence that the provider returned any particular value. Latest policy tests are being validated in CI; do not report the new head as green until its run completes.


### BTC ETF evidence archive/recovery contract — 2026-10-16

Added [BTC ETF evidence archive and recovery contract](BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md). This is documentation/design only, not a deployed archive. It defines immutable per-capture snapshot directories, source and retrieval provenance, body hashes, normalized fingerprints, revision diff evidence, human review records, private storage, independent encrypted backup, checksum verification and restore rehearsal. It explicitly separates reporting date, retrieval time and provider observation time; forbids raw payloads/secrets in the public repo; and treats the seven-day Actions artifact as temporary transport only.

**Unresolved and still blocking:** VPS and independent backup destination are not provisioned; durable storage and restore have not been demonstrated; retention period/deletion eligibility and provider raw-data reuse terms are not approved. Therefore this document does not clear the ETF evidence-retention gate, does not approve any date, and does not make BTC `evaluable`.


## Plan 100 — ETF snapshot reproducibility gate rechecked (2026-10-16)

**1. CI / test completion.** The completed BTC Public Source Staging validation run [#38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) passed the Farside parser suite (6/6), observation-candidate normalization (16/16), snapshot diff suite (16/16), and ETF research-eligibility policy suite (6/6); the capture job was skipped. The VPS API build/E2E rehearsal [#38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) also passed. The manual source-capture workflow has now been made opt-in via `capture_sources=true`; the default manual dispatch is validation-only. A fresh CI run for this workflow safety change must still be confirmed before claiming that commit green.

**2. Snapshot reproducibility.** The offline snapshot tests cover identical payload hashes with different retrieval times (no-op), row-order independence, changed-value detection without replacing prior evidence, new/missing rows, absent coverage, incomplete placeholders, duplicate source/row identities, impossible dates, manifest tampering, and CLI export + offline re-comparison. The reviewed test run passed 16/16. This verifies the code-level offline comparison contract; it is not yet proof of repeated real-provider captures or permanent retention.

**3. Archive destination and recovery.** The archive contract remains design-only. Once the VPS is provisioned, the intended private path is `/srv/crypto-evidence/btc-etf/`, with a unique immutable directory per capture and an independent encrypted backup. Do not provision a VPS early or write raw provider responses to the public repository. Seven-day GitHub Actions artifacts are temporary transport only (the observed artifact expires 2026-10-22), not the project archive. Retention, restore rehearsal, and provider-specific raw-data storage/reuse rights remain unresolved.

**4. Scenario gate.** ETF values remain blocked until publication/revision/finality handling or an explicitly approved project-stabilized research-only policy is in force, and durable evidence retention/licensing gates are satisfied. The arithmetic mean remains a separate `RESEARCH_DERIVED` comparison; it does not replace either raw source value and is not an independent-source consensus. No production DB write, ingestion, live capture, scenario evaluation, probability/state/monitoring change, deployment, or merge was performed.

**Current disposition:** snapshot comparison is reproducible on deterministic fixtures; durable archival and eligibility are not complete. BTC remains `not_evaluable`.


## Plan 100 — offline evidence archive writer added (2026-10-16)

The next safe substage is implemented in `scripts/archive-btc-etf-evidence.mjs`, with tests in `scripts/archive-btc-etf-evidence.test.mjs` and a validation step added to `.github/workflows/btc-public-source-staging.yml`.

The writer consumes an existing local capture directory only. It makes no network requests, reads no API credentials, accesses no PostgreSQL, and does not evaluate the scenario. It requires an explicit reporting date/snapshot ID and a rights evidence file; every source whose raw body would be retained must be marked `CLEARED` with a non-empty evidence reference. It verifies source-body SHA-256, rejects incomplete manifests, unsafe body paths and credential-like URL query parameters or embedded URL credentials, writes a new snapshot with manifest/archive record/checksum file, and refuses to overwrite an existing snapshot ID.

**Validation state:** implementation and tests have been committed to the PR branch; a passing CI run has not yet been verified. The new test covers fixture success, unresolved rights, missing body, hash mismatch, overwrite, incomplete manifest, credential-like URL, invalid date and unsafe snapshot ID. This is not a real archive run: current Farside/SoSoValue raw-retention rights remain unresolved, no live capture was run, and no SSD/VPS is required for the CI fixture tests.

**Acceptance remains unchanged:** the archive writer does not verify independent backup/restore, source finality, or ETF scenario eligibility. BTC remains `not_evaluable`; no production writes, ingestion, scenario-state changes, deployment or merge were performed.


### Offline archive writer — дополнительная проверка provenance (2026-10-16)

Code review выявил и закрыл два пробела до допуска реальных данных: повторный `source_id` в manifest теперь отклоняется, а для каждого сохраняемого raw body обязателен URL источника; имена файлов с обратными косыми чертами также отклоняются. Добавлен регрессионный тест на duplicate source ID и отсутствующий source URL. Коммиты в PR #83: `d848aba559e20c7ac3efe10197fe63d878c521ae`, `440ebf30ae423774050465ba29bac27d74cd0669`, `39d8765bf919ff6e97d0796ebeb196de70c469e5`.

**Статус проверки:** CI после этих коммитов ещё не подтверждён. Не архивировать реальные raw-ответы, пока права конкретного источника не имеют проверяемого подтверждения; durable archive/independent restore не проверены. BTC остаётся `not_evaluable`.


### CI confirmation — ETF archive provenance hardening (2026-10-16)

The completed [BTC Public Source Staging run #38874163877](https://github.com/olegsh247-stack/Crypto/actions/runs/38874163877) passed on code commit `39d8765bf919ff6e97d0796ebeb196de70c469e5`. The full `validate` job succeeded, including `Test offline BTC ETF evidence archive safety gates`; the live-capture job was skipped. This confirms offline fixture tests for the archive writer changes, not real source rights, durable archive, or independent restore. VPS Build & E2E for documentation HEAD `47495e3755aa96ff7bd96d6a10c880f49f734697` was still in progress when checked. BTC remains `not_evaluable`.


### Archive integrity verifier — офлайн-проверка (2026-10-16)

Добавлены `scripts/verify-btc-etf-evidence-archive.mjs` и тесты. Верификатор сверяет SHA-256, длины файлов, archive record и checksum manifest; отклоняет path traversal, symlinks и неучтённые файлы. Staging workflow подключён к тестам верификатора. Коммиты: `b886ca97f4ded7473131a4944a52c1e7100f2d97`, `8b8bed9ff56643cc2435641d833032e476b6f80c`, `cd2bfd3ab5e8cfb08838f0bb3ee93dc06c5aee89`, `934b74505dd9c4067e9988a26e9ac1b632514884`.

На момент записи BTC Public Source Staging для HEAD `934b74505dd9c4067e9988a26e9ac1b632514884` находился в очереди; новый тестовый набор ещё не подтверждён CI. Верификация одного снимка не заменяет независимый backup/restore. Никаких live captures, реальных архивов, production writes или сценарных изменений; BTC остаётся `not_evaluable`.


### Verifier CI correction (2026-10-16)

The first staging run [#38876064841](https://github.com/olegsh247-stack/Crypto/actions/runs/38876064841) failed because recursive tree verification mistakenly treated the required `checksums.sha256` file as unmanifested. The other archive-writer tests and three of four verifier tests passed. Fixed the tree walker to allow the checksum manifest itself while continuing to reject other unmanifested files. Fix commit: `a51ae5b700c572fe076d8641b860f7022cee8d5a`. Repeat staging run [#38876188724](https://github.com/olegsh247-stack/Crypto/actions/runs/38876188724) was in progress when recorded; do not mark verifier tests green until the run completes.


**Follow-up CI correction:** staging run [#38876188724](https://github.com/olegsh247-stack/Crypto/actions/runs/38876188724) exposed a second issue: the archive writer always creates an empty `normalized/` directory when there is no normalized candidate file. The verifier now allows the writer's expected `source/` and `normalized/` directories while still rejecting unmanifested files. Fix commit: `9d8dd88a2e6e41965d05302e263a4fc3a46e396b`; the new staging result is pending.


### Offline archive verifier CI passed (2026-10-16)

[BTC Public Source Staging run #38876268169](https://github.com/olegsh247-stack/Crypto/actions/runs/38876268169) completed successfully on verifier code commit `9d8dd88a2e6e41965d05302e263a4fc3a46e396b`. Both the archive-writer safety tests and archive-integrity/recovery-verifier tests passed; live capture was skipped. This validates fixture-based local integrity checks, not a real independent backup/restore. PR #83 remains Draft; source retention rights and durable storage/restore remain blockers. BTC remains `not_evaluable`.


### Fixture restore rehearsal (2026-10-16)

Added a test that copies a generated fixture snapshot to a separate restore directory and runs the full verifier against the restored copy. Commit: `e236bc53d512824e825f6c81f7efab0a1d34e24d`. Staging result pending at the time of writing. This is a same-runner fixture rehearsal, not an independent backup/restore test; source retention rights and durable storage remain blockers, BTC remains `not_evaluable`.


The fixture restore rehearsal passed in [BTC Public Source Staging #38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752) on commit `e236bc53d512824e825f6c81f7efab0a1d34e24d`. Both archive-writer safety and archive-integrity/verifier test steps passed; live capture was skipped. This validates copying and verifying a fixture within one CI runner only, not an independent backup/restore.


### Source-rights refresh (2026-10-16)

Official terms review: TFTC explicitly permits quoting, charting and republishing its ETF-flow dataset under CC BY 4.0 with attribution/link. SoSoValue's published Website Terms prohibit automated/manual copying or monitoring absent authorization and restrict reproduction/redistribution; these terms do not settle separate API rights. Farside's official ETF-flow page still does not establish a clear license for long-term raw-response storage/redistribution. The source review was updated; no API calls or live captures were made. Use TFTC-derived research artifacts with attribution as the clearest candidate; keep raw SoSoValue and Farside retention blocked pending source-specific permission. BTC remains `not_evaluable`.


### ETF source rights — additional alternatives reviewed (2026-10-16)

Reviewed the official CoinGlass API terms and The Block Terms of Service in addition to the earlier TFTC, SoSoValue, Farside, CryptoETF.today, Newhedge, and SatoshiMacro review. The detailed disposition is in [BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md).

- **TFTC:** currently the clearest documented candidate for an attributed research archive because the publisher explicitly states CC BY 4.0 and requires credit/link. A separate [TFTC dataset archive contract](BTC-TFTC-ETF-DATASET-ARCHIVE-CONTRACT-2026-10-16.md) specifies attribution, license metadata, raw-body hash, retrieval time, reporting dates, units, schema/version where available, and lineage/revision handling.
- **CoinGlass:** the API provides daily USD flow and per-fund breakdown, but its public API terms restrict bulk storage for independent databases and redistribution without prior written consent. Not cleared for durable raw archive.
- **The Block:** public flow charts are useful for manual comparison, but terms restrict systematic/automated extraction and limit republication. Not cleared for automated capture/archive.
- **Independence:** TFTC's current daily flow lineage points to SoSoValue and its historical series overlaps issuer disclosures tabulated by Farside. Do not count these as three independent estimators.

**Acceptance impact:** none of these documentation reviews changes source registry, canonical priority, the approved research-only arithmetic_mean_2_sources rule, or readiness. No API calls, scraping, live capture, production writes, ingestion, scenario evaluation/state, deployment, or merge were performed. Durable archive and independent backup/restore remain unverified; BTC remains not_evaluable. Next, keep source selection frozen while checking current CI and finish the source-specific, offline-only evidence contract before any approved capture.


### Four follow-through gates — BTC ETF research evidence (2026-10-16)

The execution status is recorded in [Plan 100 ETF snapshot recheck](PLAN-100-ETF-SNAPSHOT-RECHECK-2026-10-16.md).

1. **Source candidate:** TFTC remains the clearest licensed option for an attributed research artifact under CC BY 4.0, not an automatic canonical-source replacement. Its current flow lineage overlaps SoSoValue and its historical series overlaps Farside. CoinGlass and The Block are not cleared for automated durable raw retention under the reviewed public terms.
2. **Offline contract:** TFTC-specific archive metadata, attribution, exact-byte hashes, retrieval/reporting timestamps, units, schema/normalizer metadata, upstream lineage and revision preservation are documented. Existing writer/verifier tests cover fixtures only; they do not certify durable storage or independent backup/restore.
3. **Real snapshot stability:** the approved research-only rule requires two distinct valid snapshots at least 24 hours apart; both configured sources must be captured in both; each target-date row must be unique, complete/reconciled and unchanged; rights and independent restore evidence must be reviewable. TFTC's stated twice-daily updates and corrections mean later changes must become revision candidates, not overwrites. Real-provider stability is **not verified** because no live capture was run, Farside raw-retention rights remain unresolved, and private archive/independent recovery are not operational.
4. **One BTC research scenario:** remains blocked until a real evidence set passes the evaluator, rights/archive evidence is independently reviewable, and a human approves the named snapshot IDs/date. `ELIGIBLE_FOR_REVIEW` is not approval. No scenario evaluation/state/probability changes occurred; BTC remains `not_evaluable`.

No API calls, scraping, live captures, database access/writes, ingestion, deployment, or merge were performed during this documentation follow-through. Do not change source priority or production readiness based on fixture tests alone.


### Дополнение к проверке ETF-источников — ByKaranteli (2026-10-16)

Проверен ещё один потенциальный источник ежедневных BTC ETF flows — ByKaranteli. Публичная страница описывает агрегаты и значения по отдельным фондам, а также отдельную сверку по данным эмитентов для IBIT/XRPC. Однако Terms of Service от 2026-10-15 разрешают личное/исследовательское использование с атрибуцией, но прямо запрещают систематически копировать API-архив в заменяющую базу/архив; для сторонних данных дополнительно действуют права исходных поставщиков. Полная независимость upstream lineage агрегата не подтверждена.

**Решение:** не считать ByKaranteli источником, допущенным к нашему долговременному raw-архиву, пока не получено письменное уточнение. Оставить в списке методологических/сравнительных кандидатов; не менять source registry, приоритет, `arithmetic_mean_2_sources` или readiness. Ссылки и подробности: `docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md`. API key не запрашивался, live endpoint не вызывался, захват данных не выполнялся. BTC остаётся `not_evaluable`.


### Дополнение: ByKaranteli и прямые данные эмитентов ETF — 2026-10-16

Уточнены условия ByKaranteli: live API разрешён для личного/исследовательского использования с атрибуцией, но систематическое копирование архива в заменяющую базу/архив запрещено; сторонние записи дополнительно остаются под условиями исходных поставщиков. Поэтому повторные снимки ByKaranteli нельзя использовать как долговременное evidence-хранилище проекта без письменного разрешения на конкретный сценарий.

Начат следующий безопасный путь исследования — официальные данные самих эмитентов и SEC. Проверенные материалы BlackRock IBIT и Fidelity FBTC содержат некоторые датированные NAV/share-count значения; SEC содержит point-in-time/periodic сведения. Пока не доказано наличие полного единого ежедневного исторического ряда для всех US spot BTC ETF. Изменение net assets не эквивалентно ETF net flow, поскольку включает движение цены BTC; любые расчёты на shares outstanding/NAV требуют отдельного контракта дат, охвата фондов и сверки.

**Следующий шаг:** offline fund-by-fund coverage matrix для полного актуального US spot BTC ETF universe (официальный источник, поля, cadence, history depth, terms, machine-readable access). Не запускать live capture и не менять source registry/priority/формулу до завершения этой проверки. Подробности — в `docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md`. BTC остаётся `not_evaluable`.


### Матрица официальных источников ETF по фондам — 2026-10-16

Создана `docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md` — первый инвентарь официальных issuer/SEC-страниц для текущего US spot BTC ETF universe. По ряду фондов видны датированные NAV, AUM, shares outstanding и/или holdings, но полный сопоставимый daily historical feed, дата действия shares outstanding, revision history и разрешение на систематический retention пока не подтверждены для всех фондов.

Важное уточнение universe: официальный Hashdex DEFI page сообщает delisting с NYSE Arca effective 2026-09-03. Не включать DEFI в текущий активный агрегат после этой даты, но сохранять историческую применимость до даты закрытия. Изменение net assets не является net flow, поскольку содержит изменение цены BTC; формулу на базе shares/NAV нельзя вводить без отдельного контракта и reconciliation.

**Следующий шаг:** продолжить fund-by-fund проверку официальной истории, полей shares outstanding/creation-redemption, даты оценки NAV, прав автоматизированного хранения и полноты universe. Не запускать capture, не менять реестр/формулу и не оценивать сценарий до прохождения этого контракта. BTC остаётся `not_evaluable`.


## 2026-10-16 — закрыта проверка офлайн-архиватора на текущем коде

1. Проверен VPS API Build Rehearsal [#38892524739](https://github.com/olegsh247-stack/Crypto/actions/runs/38892524739) для текущего HEAD `c1ea990a393580f92eb4bb1bd17451295b97e416`: job `build-and-e2e` завершился `success`; все 29 шагов успешны, включая VPS-only guard, сборки API/Worker, canonical BTC registry, read-only provenance audit, duplicate/idempotency rehearsal, PostgreSQL backup/restore rehearsal и API/E2E-контракты.
2. Отдельно проверен [BTC Public Source Staging #38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752): job `validate` завершился `success`; тесты парсера Farside, нормализации candidates, offline snapshot diff, eligibility policy, SoSoValue normalizer, archive safety gates и archive integrity/recovery verifier успешны. Job `capture` был `skipped`.
3. SHA файлов `scripts/archive-btc-etf-evidence.mjs`, `scripts/archive-btc-etf-evidence.test.mjs`, `scripts/verify-btc-etf-evidence-archive.mjs`, `scripts/verify-btc-etf-evidence-archive.test.mjs` и `scripts/diff-btc-etf-snapshots.test.mjs` сверены между tested HEAD `e236bc53d512824e825f6c81f7efab0a1d34e24d` и текущей веткой: все пять файлов идентичны по blob SHA. Следовательно, архиватор и verifier проверены staging-run, несмотря на более поздние документальные коммиты ветки.
4. Проверен контракт архива: snapshots immutable, raw-body hashes/bytes и attribution/rights evidence обязательны; архиватор offline-only, запрещает overwrite и требует `CLEARED` для raw-body retention. Проверка локальной копии/restore в CI — только fixture на том же runner, не независимый backup/restore в отдельном failure domain.
5. Повторно зафиксированы блокеры: TFTC — только с CC BY 4.0 attribution и lineage; raw SoSoValue и Farside не архивировать до отдельного подтверждения прав; приватное durable-хранилище, срок хранения и независимый encrypted backup/restore ещё не операционны. Не было live capture, ingestion, production writes, registry/evaluator изменений, scenario evaluation, deployment или merge.

**Решение:** CI для текущего API commit и текущих архиватор/verifier файлов подтверждён. Это закрывает проверку кода/тестов, но не source-rights gate, durable archive, независимое восстановление или ETF acceptance. PR #83 остаётся open Draft; BTC остаётся `not_evaluable`.


## 2026-10-16 — TFTC daily-series claim and BITB primary-source boundary

1. Rechecked the public TFTC ETF-flow page without downloading its JSON dataset. The publisher states that the open JSON contains a full daily per-fund record since launch, licensed for quotation/charting/republishing under CC BY 4.0 with credit/link; the page says issuer reports arrive after market close and the series runs about one day behind market activity.
2. Narrowed the evidence boundary: the TFTC page statement supports keeping TFTC as the first candidate for an attributed research series, but does not itself prove row-by-row completeness, row publication timestamps, revision IDs, finality, no later corrections, independent upstream confirmation, or durable archive operation. TFTC provenance includes SoSoValue and historical issuer disclosures tabulated by Farside.
3. Rechecked BITB/Bitwise's public primary page and materials index. Dated shares/NAV/net-assets/holdings snapshots and SEC filings support periodic reconciliation, but the review did not establish a complete machine-readable daily historical shares/creations/redemptions series, row-level revision semantics, or long-term raw-page retention rights.
4. Preserved the no-proxy rule: no daily flows inferred from AUM changes; periodic SEC creation/redemption totals and current dated snapshots are not a daily flow series. No source was promoted and no registry/formula/evaluator was changed.
5. No JSON dataset, issuer payload or raw page was captured; no live ingestion, production write, scenario evaluation, deployment or merge occurred. PR #83 remains open Draft; BTC remains `not_evaluable`. Next: settle archive retention owner/period and independent restore-check cadence; then design an offline bounded sample/revision-diff review under the TFTC license without copying upstream raw SoSoValue/Farside data.


## 2026-10-16 — formalized archive retention/recovery decisions (proposal only)

Создана [BTC ETF archive retention decision sheet](BTC-ETF-ARCHIVE-RETENTION-DECISION-SHEET-2026-10-16.md), commit `194633ea911cfe3db50b1e6a0af006d9e9611c48`. Она разделяет подтверждённое состояние и решения, которые нельзя выдумывать: владелец архива/восстановления, минимальный срок хранения, правило удаления, периодичность restore-check, независимый failure domain и права хранения для каждого raw payload. Временное безопасное правило — не выполнять pruning и не считать архив operational, пока решения не утверждены и независимый restore не пройден. Это не утверждает бессрочное хранение как финальную политику.

Новый документ не разрешает capture, ingestion, production writes, source promotion, registry/evaluator changes, scenario evaluation/state/probabilities, deployment или merge. SSD пользователя не подключён; реальный архив не создавался. PR #83 остаётся Draft, BTC остаётся `not_evaluable`.


## 2026-10-16 — найден кандидат Newhedge для независимой по издателю сверки ETF

Публичная документация Newhedge описывает отдельный fund-reported daily ETF flow ряд в USD с US trading-day calendar, семидневным окном пересмотра и собственным правилом задержки/финализации. Отдельные on-chain ETF flows имеют `full_replace` и не смешиваются с fund-reported creations/redemptions. Подробности и ограничения внесены в [альтернативный обзор источников](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md), commit `d869cf90e365eefa5a6760049c24c5173f127b61`.

**Решение:** Newhedge — только кандидат на отдельно маркированную сверку, не canonical source. Доступ к API требует token; запрос не выполнялся. Не подтверждены права хранения/повторного использования, покрытие нужных дат, состав universe, точное согласование агрегата с Farside/TFTC и response-level provenance. Время 00:00 UTC в API — метка торговой даты, не время публикации. Не менялись источники/реестр, формула среднего, база или сценарий; BTC остаётся `not_evaluable`.


## 2026-10-16 — Newhedge rights review blocks API comparison

Проверены официальные [Terms & Conditions Newhedge](https://newhedge.io/terms-and-conditions) (обновление страницы указано 2023-07-15) и публичная API-документация. Общие условия дают ограниченную personal/noncommercial лицензию, запрещают копирование/зеркалирование и распространение содержимого без разрешения, а также прямо запрещают автоматизированное извлечение/scraping/mining. Просмотренные страницы API не показали отдельной лицензии или явного исключения, разрешающего автоматические запросы и долговременное архивирование ответов.

**Решение:** права на автоматизированный доступ и raw-response archive не подтверждены. Newhedge остаётся технически перспективным, но заблокированным кандидатом до письменного разрешения провайдера или явных API-условий, покрывающих автоматизированное исследовательское использование, срок хранения, backup/restore и возможную публикацию производных значений. Сам по себе API token не считается лицензией. API-запрос не выполнялся; token не запрашивался и не сохранялся. Это консервативный проектный gate, не юридическое заключение.

Не менялись canonical source priority, реестр, arithmetic_mean_2_sources, evaluator, production data или scenario state. PR #83 остаётся open Draft; BTC остаётся not_evaluable. Следующий шаг: искать ещё один источник с явно допустимым лицензированием/условиями либо запросить у Newhedge письменное разрешение, прежде чем сравнивать API-данные.


## 2026-10-16 — CryptoETF.today added to candidate review; rights and independence remain blockers

Проверены публичная API-страница, API reference и Terms of Service CryptoETF.today: https://cryptoetf.today/en/api ; https://docs.cryptoetf.today/ ; https://cryptoetf.today/en/terms . API заявлен для приложений и скриптов, но общие условия запрещают воспроизводить/распространять содержимое и создавать производные работы без предварительного письменного разрешения. Явное API-разрешение на долговременное хранение raw responses, резервное копирование и дальнейшее использование производных значений в просмотренных документах не найдено.

**Техническая оценка:** есть дневные агрегаты и per-fund USD flow данные; заявлены публикация T+1 и возможность одного пересмотра последнего дня. Бесплатный API отдаёт только последние 30 дней. Документация указывает, что агрегаты BTC/ETH/SOL/XRP/HYPE строятся из daily issuer disclosures via aggregators; API reference отдельно указывает Farside для Fidelity funds. Независимость от Farside/TFTC/upstream не доказана. Потребуются проверка состава universe, семантики null/zero и сверка одинаковых дат. 30-дневное окно само по себе не покрывает более длинную историю.

**Решение:** только дополнительный кандидат, пока не разрешённый для сбора/архивирования. До письменного подтверждения прав API не вызывали, ключ не запрашивали и не сохраняли. Не менялись canonical priority, реестр, формула, evaluator или scenario state; BTC остаётся not_evaluable.


## 2026-10-16 — ByKaranteli terms review narrows permitted use

Проверены live ETF dataset и Terms of Service ByKaranteli (обновление 2026-10-15): https://bykaranteli.com/data ; https://bykaranteli.com/terms . Условия разрешают автоматизированный доступ через документированный API в пределах лимитов и личное/исследовательское использование собственных вычисляемых наборов с атрибуцией. Но запрещают систематически копировать архив в заменяющую базу/архив/сервис. Также отдельно сказано, что права ByKaranteli не распространяются на third-party data: данные провайдеров остаются под исходными условиями. Коммерческое использование требует Business, распространение производных данных — Scale.

Страница ETF заявляет BTC aggregate backfill с 2025-05-20 и per-fund записи с 2026-07-30; завершённые торговые дни, текущий день provisional до публикации всех фондов. Источники описаны как issuer pages и public flow tracker. Это может помочь для небольшой ручной сверки с атрибуцией, но не разрешает массовое копирование/долговременный raw archive; upstream lineage и права на исходные значения не подтверждены. Старый CC0 GitHub/Zenodo архив заморожен и больше не обновляется; CC0 не распространяется на third-party data.

**Решение:** только кандидат для ограниченной ручной сверки после проверки прав исходных источников; не canonical source и не feed для долговременного архива. API не вызывали, ключ не запрашивали, данные не сохраняли. Не менялись source priority, registry, formula/evaluator или scenario state; BTC остаётся not_evaluable.


### Plan 100 — ETF source candidates: XOOMAR and Bitcoin-data.com (2026-10-16)

- **XOOMAR:** documented only three BTC funds in its current coverage (IBIT, BITB, ARKB); incomplete coverage; history from 2026-08-20 (ARKB from 2026-09-15). USD flow is calculated as the change in issuer-file BTC holdings multiplied by XOOMAR's reference price, not an issuer-reported flow. Terms allow internal research/storage/model use with attribution but prohibit redistribution/competing datasets; ETF holdings remain subject to upstream terms. Candidate for bounded internal comparison only after calculation/source-specific rights checks; not canonical and not approved for public raw archive.
- **Bitcoin-data.com:** Swagger advertises per-fund daily net flow in BTC for 12 funds since 2024-01-11 and says values are flows, not holdings/AUM. Upstream lineage, method, timestamps/revisions and license/retention rights remain unverified; USD conversion requires a separate documented price source and timestamp. No API call or capture.
- **Gate:** do not promote either source or automate capture until provenance, metric semantics, revision/finality, permitted retention/restore, attribution and any USD conversion methodology are documented. XOOMAR values must remain labelled as computed; Bitcoin-data.com values must remain in BTC unless a separate conversion contract is accepted.
- No source priority, registry, formula/evaluator, production data, or scenario state changed. BTC remains not_evaluable; PR #83 remains Draft/open/unmerged.

### Plan 100 — BGeometrics / Bitcoin-data.com rights gate (2026-10-16)

- Reviewed the official BGeometrics terms (updated 2026-10-14) alongside the ETF endpoint documentation. The API advertises per-fund daily net flow in BTC for 12 funds from 2024-01-11, but terms restrict bulk harvesting without written permission and separate commercial publishing/redistribution rights.
- No explicit permission was found for systematic historical extraction and private durable raw archive/backup under research use. No API request, key request/storage or data capture.
- **Required before adoption:** obtain written confirmation of permitted automated access and frequency, retention, private backup/restore, use of derived values, and publication rights; verify fund-level lineage, calculation method, record timestamps, finality and revisions. Any USD conversion needs its own documented price source and valuation timestamp.
- Until gates are resolved, do not promote the source or implement ingestion. BTC remains not_evaluable; no registry/formula/evaluator or scenario-state change.


## Дополнение 2026-10-16 — вопросы поставщикам до допуска ETF-источников

- Подготовлен черновик `docs/BTC-ETF-PROVIDER-CLARIFICATION-QUESTIONS-2026-10-16.md` для BGeometrics/Bitcoin-data.com, XOOMAR, Farside и SoSoValue. Он отдельно проверяет автоматизированный доступ, частоту запросов, raw storage/retention, private backup/restore, использование производных значений, атрибуцию, lineage, units/sign, fund universe, timestamps, null/zero semantics и историю исправлений/finality.
- Для XOOMAR обязательны точный reference-price source и valuation timestamp: holdings-based USD estimate не приравнивается к опубликованному net flow. Для Bitcoin-data.com BTC values не конвертируются в USD без отдельного контракта цены/времени. Для SoSoValue общие условия сайта не заменяют API-specific разрешение.
- Документ только подготовлен: вопросы не отправлены, API не вызывались, ключи не запрашивались/не сохранялись, данные не захватывались. Молчание или общая формулировка «для исследований» не считаются разрешением на автоматический сбор и долговременный архив.
- VPS API Build Rehearsal [#38904095808](https://github.com/olegsh247-stack/Crypto/actions/runs/38904095808) успешно завершился для commit `4e3ea1964018b77f3443c99c4aaef360ce4f77a1`; новые документальные изменения требуют собственной проверки CI. Успех rehearsal не подтверждает фактический VPS или независимый durable archive.
- Gate остаётся закрытым: не менять registry, source priority, formula/evaluator, production observations или scenario state. BTC остаётся `not_evaluable`; PR #83 Draft/open/unmerged.


## Дополнение 2026-10-16 — SEC cross-check HODL / BRRR / BTCW внесён в матрицу

- Отдельный cross-check из `docs/PLAN-100-ETF-SEC-CROSSCHECK-HODL-BRRR-BTCW-2026-10-16.md` сверен с матрицей покрытия и добавлен в неё как отдельный датированный evidence section.
- HODL: SEC Q2 2026 показывает 57,425,000 shares, NAV/share $16.70, net assets $958,827,545, holdings 16,241 BTC на 2026-06-30; за квартал создано 3,200,000 и погашено 5,900,000 shares.
- BRRR: на 2026-06-30 — 20,795,000 shares, NAV/share $16.46, net assets $342,354,115, 5,864 BTC; cover page отдельно указывает 20,895,000 shares на 2026-07-30 — даты не смешиваются.
- BTCW: на 2026-06-30 — 2,185,000 shares, NAV/share $62.46, net assets $136,476,680; 2,310 BTC округлено в investment schedule, тогда как отдельная reference-rate методология даёт 2,309.689 BTC. Методологии сохранены раздельно.
- Это квартальные/точечные первичные сверки, не полный daily flow series и не разрешение на систематическое архивирование. AUM delta не используется для вывода flow; registry, formula/evaluator, production observations и scenario state не менялись; live capture не выполнялся.
- Следующий безопасный шаг — сверить оставшиеся фонды в матрице и явно отделить подтверждённые исторические snapshots от доступности ежедневной истории, прежде чем менять source contract.


## Дополнение 2026-10-16 — три проверки пройдены по всему активному BTC ETF-universe

В матрице `docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md` добавлена единая трёхступенчатая оценка для IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC, Grayscale Mini BTC и MSBT.

1. **Первичные источники:** по всем 12 фондам найдены официальные страницы эмитентов и/или SEC-отчётность, достаточные для отдельных датированных контрольных точек. Это не означает, что у каждого фонда есть полный daily flow feed.
2. **Воспроизводимая ежедневная история:** ни для одного фонда не подтверждён полный per-fund daily shares/creation-redemption ряд с однозначной семантикой дат и историей исправлений. Графики NAV/market price и daily-updated fact blocks сами по себе не являются таким рядом.
3. **Права на автоматизацию и долговременный архив:** для всех 12 фондов остаются неразрешёнными права на систематический сбор, raw retention, закрытые backup/restore и downstream publication. Публичность SEC/issuer-страницы не равна разрешению на автоматическое извлечение и архивирование.

**Итог gate:** первая проверка пройдена только на уровне датированных первичных evidence; вторая не пройдена для полного universe; третья остаётся unresolved. Поэтому issuer-primary route пока не может заменить текущий ETF source contract. Не выводить flow из AUM delta, не трактовать пропущенные даты как ноль и не смешивать quarterly transactions, holdings-based estimates и reported/compiled USD flows.

Нет API calls, capture, ключей, production writes, registry/source priority/formula/evaluator changes или scenario evaluation. BTC остаётся `not_evaluable`; PR #83 остаётся Draft/open/unmerged.


## Дополнение 2026-10-16 — проверен официальный доступ к SEC EDGAR

Официальная документация SEC подтверждает REST API без API key для истории подач и извлечённых XBRL-данных на `data.sec.gov`; публичные EDGAR filings можно скачивать, а scripted access разрешён при соблюдении Privacy and Security Policy, корректного User-Agent, умеренной частоты запросов и лимита не более 10 запросов/сек. Источники: [SEC Developer Resources](https://www.sec.gov/about/developer-resources), [Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces).

**Результат:** для SEC появился лучше документированный путь программного доступа, чем неописанный scraping issuer pages. Но это не закрывает ежедневный ETF gate: SEC filings/API не превращают квартальные отчёты в ежедневный ряд creations/redemptions, а доступ к filings сам по себе не означает автоматическое разрешение на любое downstream redistribution. SEC остаётся periodic primary cross-check route; дату подачи, период отчёта и amendments нужно сохранять отдельно.

**Ограничения:** в этой проверке SEC API не вызывался, данные не захватывались, архив не записывался. Автоматизированный сбор/архивирование не запускались. Third-party/provider rights gates остаются отдельными. BTC остаётся `not_evaluable`; registry, formula/evaluator и scenario state не менялись.
