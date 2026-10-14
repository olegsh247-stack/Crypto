# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 13 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Последний проверенный code/CI baseline SHA `main`:** `f12ce13f41fe3fdca857dedf4bcdbfc70f7151cf` (VPS rehearsal #481 passed; subsequent commits through `d276dfe` only update audit documentation).  
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
| 4. BTC source contracts | `IN PROGRESS`, inputs not accepted | Read-only capture [#9](https://github.com/olegsh247-stack/Crypto/actions/runs/38311800272) succeeded; reviewed in [BTC source capture report](./BTC-SOURCE-CAPTURE-REVIEW-2026-10-13.md). Kraken and mempool responses are candidates only; Farside is HTTP 403, TFTC is stale/unapproved, fee/subsidy ratio and DXY remain blocked. No DB writes. |
| 5. BTC reproducible scenario | `BLOCKED` | Не начинать до закрытия входных blockers и contract audit. |
| 6. BTC end-to-end acceptance | `NOT STARTED` | После воспроизводимой оценки. |
| 7. VPS provisioning/deploy | `BLOCKED` до появления реального VPS | Только локальные/CI rehearsals пока хоста нет. |
| 8. Cutover | `BLOCKED` | Только после VPS, parity, backup/restore и явного разрешения. |
| 9. Operations | `IN PROGRESS` на уровне проектирования, не production-validated | Довести runbooks, alerts и реальные backup tests после provisioning. |
| 10. Asset/research expansion | `NOT STARTED BY DESIGN` | Запрещено до успешного BTC E2E. |
| 11. Final acceptance | `NOT STARTED` | После прохождения всех предыдущих gates. |

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


## Execution update — 2026-10-13 (PR #82 validation)

- PR [#82](https://github.com/olegsh247-stack/Crypto/pull/82), head `9b63a574829b96fc3bbc664c433a8455ebee1dc1`: VPS API Build Rehearsal #849 and BTC Block Window Validation #32 both completed successfully.
- Rehearsal #849 passed against disposable PostgreSQL and validates repository/runtime contracts only; it is not a current production/target-database audit.
- Validation #32 passed syntax and deterministic tests. Live capture and public-source capture were skipped because this run was triggered by `pull_request`; prior live capture evidence remains candidate-only and is separately documented.
- The completed UTC-day fee/subsidy calculation is reproducible, but the candidate is not accepted into canonical observations. Kraken spot and Mempool hashrate remain on hold until the actual target runtime/source-adapter mapping is verified. ETF freshness is unresolved; DXY remains blocked. No scenario state, monitoring event, score, probability, published snapshot, or production observation was changed.
- Current PR reconciliation remains a prerequisite before advancing to the offline BTC scenario. The ancestry comparison confirms substantial divergence: PR #80's branch compares as 152 commits ahead / 1 behind `main`; PR #69 compares as 15 ahead / 62 behind. Both touch `docs/BTC-MONITORING-READINESS-MATRIX.md` and the VPS build workflow, while #80 contains the isolated read-only Kraken parser/runtime-mapping work and #69 proposes broader opt-in collectors. These branch-level commit counts are not equivalent to unique product changes; compare file diffs and selectively port only needed work. Do not merge either branch wholesale or enable persistence while source contracts remain unresolved.
- Next action: finish the narrow open-PR overlap review, then close the remaining source/metric acceptance contracts and run a no-write staging diff. The BTC scenario stays `not_evaluable` until every required input passes.


## Targeted PR #80 / #69 code reconciliation — 2026-10-13

The file-level review is recorded in [OPEN-PR-RECONCILIATION-2026-10-13.md](./OPEN-PR-RECONCILIATION-2026-10-13.md). This is a selective review of branch-only implementation, not a merge or a current production/target-database audit.

- **PR #80:** Kraken point-in-time parser and fixture tests are a possible narrow future port. The code explicitly preserves `market.spot_price` / `market.kraken` / `USD/BTC`, returned pair key, observation time and raw-response hash. Do not port its migration or wire a runtime writer until a current read-only target source-registry/adapter audit confirms the mapping. Its live rehearsal is constrained to loopback PostgreSQL databases ending in `_test` and ends in `ROLLBACK`; it is not a production write.
- **PR #69:** do not port the combined collector or scheduler persistence. It combines Binance spot, Mempool hashrate, a rolling 144-block fee/reward ratio and Farside HTML parsing. The rolling ratio conflicts with the currently intended completed-UTC-day persisted cadence; ETF publication-time freshness and placeholder semantics remain unresolved; DXY remains blocked. Opt-in persistence does not waive source acceptance.
- **Current execution path:** keep the read-only source capture, raw provenance artifacts, block-window validator and staging dry-run. No source acceptance, production/target DB access, observation writes, scenario writes, monitoring events, merges or PR closures occurred in this review.

Next action: close the source/metric acceptance gates against the existing evidence, then run the no-write BTC staging diff. Do not expand to other assets or enable scheduled candidate persistence.


## Follow-up after successful BTC/stack CI — 2026-10-13

The targeted PR reconciliation is now documented, and its resulting head passed both checks: [VPS API Build Rehearsal #857](https://github.com/olegsh247-stack/Crypto/actions/runs/38447537476) and [BTC Block Window Validation #36](https://github.com/olegsh247-stack/Crypto/actions/runs/38447537716). The full rehearsal passed all steps, including disposable PostgreSQL migrations/bootstrap, source registry/provenance, idempotency and duplicate guards, backup/restore, API/Worker E2E, evidence/snapshot lineage, history/candle finalization and admin boundaries. Block-window validation passed syntax and deterministic tests; live capture was skipped in that PR-triggered run.

The current main-branch BTC readiness gate was inspected and remains fail-closed: it requires source registration, HTTPS provenance, exact units, current observation timestamps, a 36-hour latest ETF gate and five distinct ETF dates within 14 days. It returns not_evaluable on missing/invalid inputs and never authorizes scenario-state persistence. No implementation change is needed to preserve that safety boundary.

**Boundary:** CI uses disposable PostgreSQL. It is not a fresh read of the external target database. The last documented target audit remains 2026-10-12 18:20 UTC; no current target source registration/adapter audit was performed and no production/target data was read or written. All five BTC inputs remain unaccepted (four held, DXY blocked), and the scenario remains not_evaluable.

**Next practical step:** keep the product work focused on BTC and prepare the source acceptance/review bundle so that the remaining decisions are explicit: (1) target-runtime source registry/adapter check when a permitted read-only route exists, (2) ETF session-date/observation-time convention with no inferred timestamp or placeholder zero, (3) completed-UTC-day fee/subsidy contract acceptance, and (4) a specific permitted DXY feed or keep DXY blocked. Then rerun the no-write staging diff. Do not enable ingestion, write scenario/monitoring state, merge/close PRs, or expand to other assets.

## 2026-10-14 — target DB audit path and fee/subsidy contract reconciliation

### Target database: access-path finding

A repository-only inspection was performed against `main` and the BTC hardening branch:

- `.github/workflows/production-readonly-health.yml` is a manually dispatched GET-only API health check. It accepts an API base URL and runs `scripts/production-readonly-health.mjs`; it does not query the target PostgreSQL source registry or observations.
- `scripts/audit-btc-input-provenance.sql` is an available read-only SQL audit for BTC input freshness, source registration, and duplicate logical keys.
- No repository workflow was found that safely connects this SQL audit to the current target database, and the current session has no verified target DB connection/runtime credential. No secret values were read or exposed.

**Decision:** do not treat disposable CI PostgreSQL or an API health response as a fresh target database audit. The next valid proof must run the existing SQL audit through an explicitly configured, least-privilege read-only connection to the actual target database, with output limited to audit results. If that connection is not available, source registration/adapter acceptance remains blocked. No database access or writes were performed by this repository inspection.

### Fee/subsidy contract: resolve conflicting open proposals

The canonical metric registry uses `frequency: 1d`. The validated 2026-10-12 completed UTC-day calculation covers the half-open interval `[2026-10-12T00:00:00Z, 2026-10-13T00:00:00Z)`; the rolling 144-block ratio remains diagnostic-only. This is the current recommendation for the persisted metric because it aligns with the declared daily cadence and explicit calendar-day boundaries. It is not yet activated in canonical registries or runtime ingestion.

Open PR #81 proposes a rolling 144-consecutive-block observation and therefore conflicts with the completed-UTC-day recommendation in PR #82. Do not merge both contracts as-is. Keep both PRs open pending one explicit metric-contract decision; the current evidence favors completed UTC-day sampling for `frequency: 1d`, with rolling 144 blocks retained only as a diagnostic.

### ETF and DXY remain blocked

- ETF session date is not a publication timestamp. Do not infer `observed_at` from retrieval time, and do not convert an unreported placeholder to zero. A reviewed trading-session-lag contract or a source-declared publication timestamp is required before applying the 36-hour gate.
- DXY remains blocked until an exact, stable, permitted source and observation-time convention are approved. A broad trade-weighted USD index is not interchangeable with DXY.

**Current gate:** BTC remains `not_evaluable`; no candidate is approved for ingestion; no observation, scenario state, monitoring event, score, probability, or published snapshot was changed.

### 2026-10-14 — validation result and DXY source follow-up

- VPS API Build Rehearsal #863 passed on commit `29e619aeceb914efe8eaea9c50932d8eac494a1b`: build, migration bootstrap on disposable PostgreSQL, canonical BTC registry check, read-only provenance audit, idempotency/duplicate rehearsal, backup/restore, API/Worker E2E, BTC evidence lineage and admin boundary checks all passed. This is a disposable-environment rehearsal, not proof of current target-database contents.
- BTC Block Window Validation #39 passed on the same commit for syntax and deterministic tests. Its live block-window capture and public-source capture steps were skipped on the PR-triggered run; therefore it adds no new live source evidence.
- Official ICE materials were checked for DXY delivery and usage. ICE lists licensed data channels and states that DXY's formulation/values/methods are proprietary and require express written consent for use. No suitable public anonymous canonical API was established. Keep `macro.dxy` blocked unless an authorized feed and its terms are verified, or a distinct replacement metric is explicitly designed and reviewed. See [DXY source decision record](BTC-ETF-FRESHNESS-AND-DXY-SOURCE-DECISION-2026-10-13.md).

**Next executable gate:** a real target-runtime read-only SQL audit still needs a verified least-privilege connection path. Until then, source registration and adapter acceptance remain blocked. No target DB connection, ingestion, observation write, scenario-state write, monitoring-event write, or PR merge occurred in this step.

### 2026-10-14 — ETF row completeness recheck

A current read-only review of the public Farside page found that its 2026-10-13 total displays **+109.8 USD million**, but the IBIT constituent field is a dash while other fund columns are populated. The row is therefore held as incomplete/unconfirmed rather than accepted as a full daily ETF flow. The page's availability on 14 October proves retrieval date only, not the source-declared publication time required by the existing 36-hour gate. No zero is inferred, no fallback to TFTC is authorized, and no input is accepted.


## 2026-10-14 — shared source architecture audit

The repository inspection is documented in [Source Architecture — Current-State Audit and Next Steps](SOURCE-ARCHITECTURE-CURRENT-STATE-2026-10-14.md).

- A shared source catalog already exists at `data/CryptoDataModel/registry/source-registry.json`; do not create a second catalog or per-asset copies.
- The metric registry links metrics to sources, but its current `asset_scope` is only `btc`. Shared source definitions and asset-specific metric contracts must remain separate.
- `vps/shared/src/btc-scenario-readiness.ts` is a BTC-specific fail-closed readiness gate, not a universal source-management service. It validates supplied timestamps but cannot prove the upstream semantic meaning of `observed_at` on its own.
- Remaining source blockers include unverified target-runtime registration/adapter mapping, ETF publication/session timestamp semantics and incomplete rows, the unapproved fee/subsidy aggregation-window contract, and the lack of a concrete permitted DXY feed.
- Development should not revolve around manually rechecking daily changing totals. The next product work is to define and test stable source/metric/asset contracts, automate collection/normalization, and use deterministic fixtures plus a frozen no-write BTC manifest.
- Sequence: stabilize the shared catalog and metric contracts now; prove one complete BTC path; only after BTC end-to-end acceptance extend metric mappings to ETH and other assets. Do not claim multi-asset readiness or expand scope prematurely.
- Documentation-only change on PR #82 branch: commit `6430227ae56fed4882ee3e9995bc0bf806472cd0` adds the architecture audit. No registry/runtime code, database, ingestion, scenario state, monitoring state, or PR status was changed by that commit.


### 2026-10-14 — автоматическая проверка shared source/metric registries

Добавлены `scripts/validate-source-metric-registries.mjs` и `scripts/validate-source-metric-registries.test.mjs`; workflow `BTC Scenario Readiness Gate` теперь запускает их на PR при изменении реестров и проверок.

Проверки, которые блокируют CI:
- уникальность `source_id` и `metric_id`;
- наличие непустых ID и канонических единиц метрик;
- наличие `source_priority` у каждой метрики;
- разрешимость всех ссылок `source_priority` в общий source registry;
- корректность URL, если URL у источника задан.

Отдельно выводятся предупреждения, но пока не блокируется сборка, если конкретная метрика ссылается на общий placeholder или источник со статусом `to_validate`. Первый фактический результат текущего реестра выявил такие места:
- `market.primary` используется метриками `market.futures_open_interest`, `market.perpetual_funding`, `market.options_open_interest`;
- `macro.primary` используется метриками `macro.dxy` и `macro.us_10y_yield`.

Это реальные нерешённые контракты, а не доказательство работающих адаптеров. Я не заменял их догадкой и не активировал источники: `macro.dxy` остаётся заблокированным; рыночные метрики с `market.primary` требуют выбора и проверки конкретного провайдера до принятия данных.

Проверки не утверждают, что источник реально зарегистрирован в target DB или что адаптер доступен. Это структурный CI-контроль JSON-контрактов и раннее предупреждение о placeholder-источниках. Target DB не подключалась, записи/ingestion и scenario/monitoring state не менялись. Результат CI для нового HEAD ожидается отдельно; успешный прогон заранее не заявляется.


### 2026-10-14 — source-registry CI и fail-closed BTC candidate pipeline

На PR #82 добавлены автоматические проверки shared registry и frozen BTC staging manifest:

- `scripts/validate-source-metric-registries.mjs` проверяет уникальность source/metric IDs, обязательные единицы, заполненность `source_priority`, разрешимость ссылок и формат URL. Generic/unvalidated источники выводятся как предупреждения, а не выдаются за работающие адаптеры.
- `scripts/btc-candidate-staging.test.mjs` закрепляет `NO_INSERTS_AUTHORIZED`, нулевые счётчики записей и отсутствие сценарных/monitoring writes для frozen candidate manifest.
- Интеграционный тест пропускает этот manifest через настоящий BTC readiness gate и pure scenario evaluator. Текущий candidate набор корректно остаётся `not_evaluable`; сценарий не вычисляется, persistence запрещён.

**Проверки на commit `3a59cbb59a44061078e4538c3fefebe1e71175e2`:**
- [BTC Scenario Readiness Gate #38535709836](https://github.com/olegsh247-stack/Crypto/actions/runs/38535709836) — success, 27 тестов в сумме, включая staging guard и fail-closed интеграцию.
- [BTC Block Window Validation #38535709775](https://github.com/olegsh247-stack/Crypto/actions/runs/38535709775) — success; live capture/public-source capture не запускались PR-событием.
- [VPS API Build Rehearsal #38535709757](https://github.com/olegsh247-stack/Crypto/actions/runs/38535709757) — success на disposable PostgreSQL, включая build/E2E/миграционный rehearsal; это не аудит актуальной target DB.

Структурная проверка выявляет два семейства unresolved placeholder sources: `market.primary` для futures open interest/perpetual funding/options open interest; `macro.primary` для DXY и US 10Y yield. Не заменять их произвольными источниками. Target DB не подключалась; ingestion, production writes, scenario/monitoring writes и PR merge не выполнялись.

**Следующий продуктовый шаг:** строить детерминированную нормализацию BTC source captures в frozen candidate manifest с source-declared observation/window semantics, raw hash и revision handling. Сохранять candidate-only/no-write режим. Реальный BTC scenario остаётся заблокирован до свежего read-only target-runtime audit, решения по ETF publication/session time, принятия completed-UTC-day fee/subsidy контракта и выбора разрешённого DXY источника. Не расширять активы до сквозной приёмки BTC.


## 2026-10-14 — Deterministic BTC candidate normalization

- Added `scripts/normalize-btc-candidate-manifest.mjs`: an offline, pure normalization step over a frozen BTC candidate manifest. It does not fetch live data, read the clock, connect to a database, or authorize inserts.
- Normalized records preserve metric/source IDs, value and canonical unit, observation and retrieval timestamps, UTC window or session identity, source-row identity, raw evidence SHA-256, current dry-run classification, and a declared append-only revision policy.
- Candidate ordering is stable; duplicate logical keys fail closed instead of silently selecting a value. ETF remains blocked without defensible observation time; DXY remains blocked without an approved canonical source.
- Added deterministic tests against the frozen 2026-10-13 dry-run manifest and wired them into the BTC Scenario Readiness Gate.
- This is a repository/CI-only step. It does not change source or metric registries, database rows, scenario state, monitoring events, scores, probabilities, or published snapshots. No production data writes are authorized.
- Validation status at documentation time: implementation and workflow wiring committed to the working branch; CI result still pending. Do not mark the BTC scenario ready based on normalization alone.


### 2026-10-14 — official source documentation reviewed before adapter decisions

Reviewed the provider documentation instead of inferring timestamp or source behavior from retrieved values:

- Kraken's documented Spot Post-Trade API distinguishes trade execution time (`trade_ts`) from publication time (`publication_ts`). The existing capture script still uses the legacy `/0/public/Trades` tuple response; this is acceptable for candidate capture only, but the adapter contract must explicitly pin that response shape or migrate to the documented endpoint and test the field mapping.
- Mempool.space documents separate mining-hashrate, block-fee, and reward endpoints. The BTC candidate hashrate must remain a dated trailing-window average with its UTC bucket semantics, not be relabelled as instantaneous. Fee/subsidy remains based on validated block-level data over a completed UTC day, with the same block set used for fees and subsidy.
- Farside's published table includes dashes alongside numeric daily totals, including all-dash rows displaying `0.0`. A dash is missing/unreported data, not zero. The table page describes typical evening/night US updates but does not provide a row-level publication timestamp; ETF freshness therefore requires an explicit, tested session-lag/calendar/revision contract and complete constituent data.
- ICE's official catalog identifies DXY as its own six-currency benchmark and lists ICE delivery products, not a documented anonymous public endpoint. The Federal Reserve's broad trade-weighted USD series is a different index and cannot be used as `macro.dxy`.

**Resulting next step:** implement fixture-based source-contract tests and adapter mapping for the existing BTC candidates, beginning with Kraken and Farside completeness; keep source/metric registries unchanged until the contracts and terms are explicit. DXY stays blocked pending an authorized exact feed. No live target-database read-only path was available in this session, so runtime source registration remains unverified. No database writes, scenario/monitoring writes, or PR merge occurred.

Official references: [Kraken Post-Trade API](https://docs.kraken.com/api/docs/rest-api/get-post-trade); [Mempool.space REST API](https://mempool.space/docs/api/rest); [Farside all-data table](https://farside.co.uk/bitcoin-etf-flow-all-data/); [ICE DXY data catalog](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices); [Federal Reserve broad USD index](https://fred.stlouisfed.org/series/DTWEXBGS).


### 2026-10-14 — fixture-based BTC source-contract checks

Implemented on the PR branch:

- `scripts/btc-source-contracts.mjs` adds pure, offline normalizers for the existing Kraken legacy Trades tuple shape and already-parsed Farside rows. They do not fetch data, read the clock, connect to PostgreSQL, or persist anything.
- Kraken normalization validates price/volume/epoch fields, selects the latest source trade timestamp, and keeps `observed_at` separate from caller-supplied `retrieved_at`.
- Farside classification distinguishes complete numeric candidate rows, incomplete rows, all-unreported rows, and invalid rows. Dashes/blanks never become zero; even a numeric displayed total is rejected as a candidate if a constituent column is missing. The source publication time remains null.
- `scripts/btc-source-contracts.test.mjs` covers these cases and is wired into BTC Scenario Readiness Gate.

These tests enforce the source semantics found in official provider documentation and observed table structure; they do **not** certify a live adapter or target-database registration. The existing ETF candidate remains on hold until a versioned session-lag/calendar/revision contract is approved and implemented. DXY remains blocked pending an exact, permitted feed. No source/metric registry, database row, scenario/monitoring state, score, probability, or published snapshot was changed. PR #82 remains open and unmerged.


### 2026-10-14 — Kraken candidate capture now uses the tested contract

The read-only capture script now calls `normalizeKrakenLegacyTrades` instead of duplicating the tuple parsing logic. It retains the raw trade row and volume, maps the source epoch to `observed_at`, and records per-source `retrieved_at` after the response body has been read. The source capture remains candidate-only and still writes only local review artifacts; it does not connect to the database or persist product state.

The readiness workflow now watches the capture script as well as the pure contract module and tests. Verification must be reported only for the workflow run on the resulting latest HEAD.


### 2026-10-14 — ETF session-lag contract implemented as an explicit, non-activated policy

Added `evaluateFarsideSessionFreshness` to the pure BTC source-contract module. It requires the caller to supply an approved list of expected trading-session dates and an explicit `maxSessionLag`; it does not guess weekends/holidays, does not infer a publication timestamp, and does not set `observed_at`. It blocks rows outside the supplied calendar, incomplete rows, and rows older than the chosen session-lag limit. Strict date validation rejects impossible calendar dates.

Fixture tests now cover a complete row within an explicitly supplied lag limit, a stale row, an incomplete row, missing calendar input, and invalid dates. The limit is deliberately not defaulted: a policy owner must select it before operational use. This is a tested policy helper, not yet a production adapter or approval to activate ETF data. Runtime source registration and live DB state remain unverified. No DB or scenario/monitoring writes and no merge.


### 2026-10-14 — official U.S. equity calendar source selected for 2026

Checked the exchange-published calendars rather than guessing U.S. market holidays: [NYSE Holidays & Trading Hours](https://www.nyse.com/trade/hours-calendars) and [Nasdaq U.S. Market Holidays & Trading Hours](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule). The 2026 full-day closures agree for the dates used by this implementation. Early-close dates remain trading sessions; they are not excluded from the session sequence.

Added `scripts/us-equity-session-calendar.mjs`, a deterministic 2026-only session calendar. It generates weekdays minus the ten official full-day closures, rejects invalid dates, and fails closed outside 2026 rather than silently extrapolating a calendar. Fixture tests cover Independence Day observed (July 3), Thanksgiving and the following early-close session (November 27), invalid dates, reversed ranges, and unsupported years. The ETF freshness helper can now be supplied this calendar's session list, but it still requires an explicit `maxSessionLag`; no operational threshold is chosen implicitly.

Scope is deliberately limited: this calendar is a documented input to the contract, not yet connected to the Farside page parser or canonical runtime adapter. For 2027 onward the calendar must be extended from official exchange schedules and tested before those dates are eligible. No DB/source-registry/scenario writes and no merge.


### 2026-10-14 — Farside HTML parser connected to candidate capture

- Connected the read-only Farside capture to a header-driven HTML table parser. It identifies the Date, constituent-fund and Total columns by header, preserves raw HTML plus SHA-256, and records the newest dated row and raw cells.
- The newest row is classified with the existing source contract; dashes and blanks remain missing, and a displayed numeric total cannot override missing constituent values. Unknown headers, malformed dates and column-count drift fail closed or are explicitly reported.
- Session freshness is evaluated only for the supported 2026 calendar and only when `BTC_ETF_MAX_SESSION_LAG` is explicitly configured as a non-negative integer. Without that policy setting, candidate eligibility stays blocked. Retrieval time is never represented as source publication time; `observed_at` remains null.
- Added HTML fixture tests for header mapping, dash/zero ambiguity, and parser fail-closed behavior. This is a read-only candidate artifact change, not approval to activate the ETF metric; no registry, database, scenario or monitoring state was changed.


Follow-up live-capture finding (2026-10-14): the legacy `https://farside.co.uk/btc/` route returned HTTP 403 from the GitHub Actions runner, so it did not exercise the parser against live Farside HTML. The capture now targets Farside's published all-data table URL, `https://farside.co.uk/bitcoin-etf-flow-all-data/`, and the next read-only staging run must confirm whether that route is accessible and whether the header-driven parser matches its live table. A successful capture of the TFTC mirror does not make TFTC canonical; ETF remains blocked until live parsing, calendar freshness policy, source lineage and runtime acceptance are resolved.



### 2026-10-14 — mandatory documentation-first rule for external integrations

Added repository-wide `AGENTS.md`, GitHub Copilot instructions, and `docs/EXTERNAL-INTEGRATION-POLICY.md`. Before any external connection is implemented, changed, debugged, or relied upon, the official documentation, access model, terms/licensing, auth, limits, schema, units, timestamp semantics, freshness, errors/retries, versioning, secrets, and intended-runtime access must be reviewed and recorded. Undocumented behavior stays explicitly unverified; HTTP 403 must not be bypassed; mirrors cannot silently replace canonical sources. Readiness must distinguish fixture tests, live access, runtime registration, and end-to-end acceptance.

Farside review: the official [all-data page](https://farside.co.uk/bitcoin-etf-flow-all-data/) says the table is generated automatically in real time and disclaims errors/inaccuracies. The reviewed pages provide no public API specification or documented per-row publication timestamp contract. Both Farside routes returned HTTP 403 from the GitHub Actions read-only capture on 2026-10-14. The documented decision is to treat machine access/terms as unresolved, not bypass the restriction, not treat TFTC as canonical, and keep ETF flow blocked from scenario use until an authorized access method and full validation are confirmed.


Farside documentation review was extended to its official [team/contact page](https://farside.co.uk/team/) and [Privacy Policy](https://farside.co.uk/privacy-policy/). The privacy notice covers personal-data processing, not a license or technical specification for the ETF-flow table. No public API specification or explicit automated-access/data-licensing terms were found in the reviewed official pages/navigation. This remains a provider-clarification item, not an invitation to bypass the 403.


### 2026-10-14 — current open-PR reconciliation and CI

A fresh GitHub API check found four open PRs (#82, #81, #80, #69), all targeting `main`. No PR was merged or closed.

- PR #82 head `2047324a122345ab31736c3535a3ff99a333a14d` passed the latest-head [BTC Scenario Readiness Gate](https://github.com/olegsh247-stack/Crypto/actions/runs/38554431026), [BTC Block Window Validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38554431043), and [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38554431466). These are CI/disposable-environment results, not a fresh audit of the target database.
- PR #81 proposes persisting a rolling 144-block fee/subsidy ratio. That conflicts with the newer completed-UTC-day candidate contract aligned to the metric registry's `frequency: 1d`; 144 blocks remain diagnostic-only. Do not merge #81 as-is.
- PR #80 contains useful isolated Kraken parser/tests but also older capture assumptions and a migration; defer migration, scheduled collection and persistence until target-runtime source registration can be audited read-only and metric contracts are accepted.
- PR #69 remains dirty/non-mergeable and bundles unaccepted source/window/freshness assumptions. Do not port its persistence or scheduler path.
- Full rationale and safe dispositions: [Open PR reconciliation](OPEN-PR-RECONCILIATION-2026-10-13.md).

**Next actionable gate:** continue the single-asset BTC path using read-only/offline evidence; keep ETF blocked pending authorized provider access and defensible freshness semantics; keep DXY blocked until a canonical source with permitted-use terms is selected. The fresh target-database audit cannot be claimed until an approved target runtime is available. No PR merge/closure, production access/write, source activation, scenario-state change or deployment was performed.


### 2026-10-14 — Mempool official documentation-first review

Reviewed the official [Mempool REST API documentation](https://mempool.space/docs/api/rest) before continuing to rely on Mempool block data. The docs cover mining reward/fee endpoints, while the exact block-page response used by the candidate capture is not fully specified in the reference reviewed; field semantics are therefore cross-checked against the pinned upstream implementation recorded in [BTC UTC-Day Candidate Review](BTC-UTC-DAY-CANDIDATE-REVIEW-2026-10-13.md).

- Candidate access is unauthenticated HTTPS GET; retrieval timestamps remain distinct from observation/window timestamps.
- The candidate capture validates block heights/hashes/timestamps, fee/reward units, expected subsidy, continuity and stable tip anchor. Failures fail closed; there is no automatic fallback.
- Endpoint-specific quota, durable service-level availability, source publication timestamp and payload redistribution/retention rights are not established by the documentation reviewed. These remain explicit limits for any hosted/production reliance.
- The completed UTC-day ratio remains the proposed persisted contract for the registry's daily cadence; the rolling 144-block ratio remains diagnostic-only. No metric registry change, source activation, production database write, scenario/monitoring write, or deployment was performed.


### 2026-10-14 — Kraken official documentation-first review

Reviewed the official [Kraken Post-Trade API reference](https://docs.kraken.com/api/docs/rest-api/get-post-trade). It documents `/0/public/PostTrade`, with trade-match and publication timestamps, a latest-trade cursor, explicit symbol/time filters, and a 1000-row maximum. The current candidate parser instead uses legacy `/0/public/Trades?pair=XBTUSD`; the reviewed reference does not establish that legacy response's exact schema. The two endpoints must not be treated as interchangeable, and no silent endpoint migration is authorized.

Detailed finding recorded in [Source Architecture Current State](SOURCE-ARCHITECTURE-CURRENT-STATE-2026-10-14.md). Next narrow spot-price gate: compare the legacy and documented response contracts and timestamp meanings against official documentation and safe fixtures; choose an endpoint only after that comparison. Keep spot-price candidates unaccepted and do not change source priority or runtime wiring in this step.


### Next step — Kraken documented Post-Trade contract comparison (2026-10-14)

- Rechecked the latest PR #82 head `3568e64d4c8c924f0ba27e5274a7a16e42ef5cb3`: BTC Scenario Readiness Gate, BTC Block Window Validation, and VPS API Build Rehearsal all passed.
- Reviewed the official [Kraken Post-Trade API reference](https://docs.kraken.com/api/docs/rest-api/get-post-trade). Added a separate pure candidate normalizer and fixture tests for its documented object response; the existing legacy `Trades` adapter remains unchanged.
- Contract distinction: legacy `Trades` has tuple/Unix-seconds trade time; documented `PostTrade` has named `price`, `quantity`, `symbol`, `trade_id`, `trade_ts`, and `publication_ts` fields plus `last_ts` cursor. Keep execution, publication, and retrieval times distinct.
- Next verification is CI on the new HEAD. Then review whether the candidate contract has enough evidence for a source decision; do not silently switch endpoints. Live access, cursor/pagination behavior, limits/SLA, permitted data use, and target-runtime registration remain unverified.
- No database, registry, source-priority, scenario, monitoring, score, probability, or published-snapshot changes. PR #82 stays open/unmerged.


### Kraken 15-minute price bucket follow-up — 2026-10-14

- CI on commit `ab975f8dd9a5e97cb206730dab1c8dc351d1dd97` passed: [BTC Scenario Readiness Gate](https://github.com/olegsh247-stack/Crypto/actions/runs/38557072834), [BTC Block Window Validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38557072849), and [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38557072885).
- Added a pure selector for explicit UTC 15-minute buckets using `[start,end)`, selecting the last trade inside the bucket by source `trade_ts`; a bucket without a trade is blocked, not filled with an old value or zero. Added boundary and empty-window fixtures.
- This follows the metric registry's `market.spot_price` cadence (`15m`) without changing registry/source priority or the live capture endpoint. The helper requires caller-supplied bounds and does not claim to prove full API interval coverage.
- Next gate: run CI on the new HEAD; then review request pagination/cursor completeness and how aligned UTC bucket boundaries and the 1h freshness rule are supplied. Do not switch the collector or accept price observations yet.
- No production DB writes, source activation, scenario/monitoring changes, deployment, or PR merge. PR #82 remains open.


### Kraken Post-Trade pagination/cursor audit — 2026-10-14

Official API reference reviewed: https://docs.kraken.com/api/docs/rest-api/get-post-trade (reviewed 2026-10-14). The documented endpoint is `GET https://api.kraken.com/0/public/PostTrade`; `count` is 1–1000 (default 1000), `from_ts` filters trades **after** a timestamp, `to_ts` filters trades **before or at** a timestamp, and the response exposes `result.count`, `result.trades` in ascending timestamp order, and `result.last_ts` described as the latest trade timestamp and usable as the next request's `from_ts`.

**Decision: pagination is not yet accepted as a proof of complete 15-minute bucket coverage.** A cursor chain can be checked for advancement, ordering, count consistency, duplicates and the 1000-row ceiling, but the reviewed contract does not explain how a timestamp-only cursor handles multiple trades sharing the same `trade_ts` at a page boundary. Since `from_ts` is documented as strict (“after”), blindly using `last_ts` could omit same-timestamp rows. Do not claim that a successful cursor walk proves completeness until Kraken documentation/provider confirmation or a verified endpoint behavior contract resolves this edge case.

The interval contract also needs careful translation: the metric selector uses UTC half-open buckets `[start,end)`, while the API's `to_ts` filter is inclusive. The future caller must explicitly exclude trades at `windowEnd` after retrieval, retain raw pages/cursors and retrieval timestamps as permitted, stop safely on empty/short pages, and fail closed on non-advancing cursors, inconsistent counts, malformed ordering, duplicates, or a full final page without a verified continuation. No live Post-Trade request was made for this review.

- Registry remains unchanged: `market.spot_price` is `15m` with `freshness_window: 1h` and source priority `market.kraken`.
- The pure normalizer and bucket selector remain fixture-only candidate helpers. No collector endpoint switch, source acceptance, database write, or scenario-state change.
- Next action: add deterministic fixture tests for page-chain invariants only if the intended fail-closed behavior is explicit; separately resolve the timestamp-tie cursor limitation before representing Post-Trade capture as complete. If it cannot be resolved from official docs, retain the existing legacy capture and mark the documented Post-Trade path blocked rather than guessing.


### Kraken page-chain structural guard and cadence decision — 2026-10-14

Added fixture-only `auditKrakenPostTradePageChain` and tests. The helper checks page envelopes/counts/limits, ascending timestamps, duplicate trade IDs, `last_ts` consistency, cursor-chain alignment and cursor advancement. It deliberately returns `STRUCTURE_VALID_COMPLETENESS_UNPROVEN` for a structurally clean chain; it cannot prove that timestamp-tied trades were not skipped between pages. Invalid chains fail closed.

**Cadence clarification:** the current `15m` registry cadence is not a user requirement or a fixed product promise. A one-hour bucket or another source-supported observation interval may be acceptable if it produces a robust, reproducible and fresh-enough input for the research scenario. This is a product/metric-contract decision to evaluate later, not an instruction to change the registry now. Widening the bucket alone does not resolve cursor completeness; first establish whether the chosen retrieval method can produce a complete and defensible candidate window. The existing `1h` freshness window remains a separate policy from the sampling interval.

CI on the previous HEAD `119820bcb41fe5f969a0f95d205ee02610891750` is green for BTC Scenario Readiness Gate, BTC Block Window Validation, and VPS API Build Rehearsal. The new helper/tests are on the newer HEAD and require their own CI run before they can be treated as passing.
