# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 14 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Последние проверенные CI-свидетельства (14 октября 2026):** BTC Scenario Readiness Gate #203 passed on code SHA `ffeff5686dda5df6f4e5a4dae859671be6a0ec91` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38617960879)); BTC Public Source Staging #69 passed on code SHA `6dbe6b48a55afb60c3a8176483fbf9bb9d0dcf74`, including the official Binance market-data-only endpoint ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38618817154)); VPS Build Rehearsal #1194 passed on documentation commit `7338953755c3714e5a13a84f4e70101d70fd4610` ([run](https://github.com/olegsh247-stack/Crypto/actions/runs/38618134185)). Rehearsals triggered by the newer cross-check/documentation commits are tracked separately and must not be called passed until complete. ETF timestamps/revision semantics and DXY remain blockers.  
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

## 41. Правило ведения «Промт 100»: фиксировать результаты, а не каждое действие (2026-10-15)

**Обязательное уточнение по запросу пользователя от 2026-10-15.**

«Промт 100» — журнал итогов выполненной работы, а не пошаговый лог процесса.

1. Сначала выполнить весь доступный объём конкретной задачи: проверить исходное состояние, внести необходимые изменения, завершить проверки и разобрать результаты.
2. После завершения рабочего блока внести в «Промт 100» только подтверждённые результаты этой задачи. Не записывать каждое промежуточное действие, рассуждение, повторный просмотр или незавершённый шаг как отдельную запись.
3. Если задача остановилась на блокере, записать только установленный результат, конкретный блокер и то, что действительно остаётся незавершённым. Не выдавать запущенную проверку за завершённую.
4. Формат каждой записи неизменен: **Дата | Действие | Результат**; дата по Europe/Riga. Ссылки на commit, PR и CI добавлять, когда они доступны.
5. Ассистент самостоятельно обновляет «Промт 100» после завершения задачи/рабочего блока и **не запрашивает отдельное разрешение на каждое обычное обновление журнала**. Это постоянное разрешение на ведение журнала, а не разрешение на production-изменения, merge PR, деплой, миграции, ingestion, изменение секретов/DNS или переключение трафика.
6. После записи проверить, что обновление сохранено в предназначенном месте. Если синхронизация с Library не удалась, явно отметить её как незавершённую; не заявлять об успешном сохранении без подтверждения.
7. Сохранять этот порядок и в репозитории, и в библиотечной копии Плана 100, чтобы инструкция не расходилась между местами хранения.

### Проверка CI по последнему сообщённому коммиту (2026-10-15)

- [Readiness Gate](https://github.com/olegsh247-stack/Crypto/actions/runs/38801994803) — **success**; job `unit-tests` завершён успешно.
- [Release Workflow Validation](https://github.com/olegsh247-stack/Crypto/actions/runs/38801994976) — **success**; job `Static validation (no production access)` завершён успешно.
- Повторная проверка завершена: [Seed observation idempotency rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38801994751) и [VPS API Build Rehearsal](https://github.com/olegsh247-stack/Crypto/actions/runs/38801994763) также завершились **success**. Все четыре проверенных run этого набора изменений завершены успешно; CI не снимает ETF/DXY-блокеры и не делает BTC evaluable.
- ETF source contract остаётся блокером BTC-сценария: требуется завершить проверку надёжной конвенции observation/publication time и семантики revisions/finality. BTC остаётся `not_evaluable`; DXY также остаётся заблокированным до утверждения канонического источника.

## 42. ETF dual-source mean rule — 2026-10-16

- Approved research-only reconciliation for a session where both Farside and TFTC provide valid numeric daily aggregates: `arithmetic_mean_2_sources`.
- For 2026-10-07: Farside `-484.9 USDm`, TFTC `-487.1 USDm`, research mean `-486.0 USDm`.
- Preserve both raw source values, source identities and capture provenance. Do not alter source values to force agreement. The derived mean is not a claim that either source is wrong or that the result is a provider-reported value.
- The ETF observation contract in PR #83 was updated at commit `551cbd20043e9d719351aca394c1aa12cad76632`: [contract document](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/data-review/BTC-ETF-OBSERVATION-CONTRACT-2026-10-15.md).
- This rule is for the offline research dataset only. Production persistence remains blocked until timestamp and revision/finality policy requirements are satisfied. No database writes, ingestion, scenario evaluation, scenario-state/probability/monitoring changes, or deployment were performed.
- CI for this latest contract commit has not yet been confirmed. Do not mark it green until a run for the commit completes.


## Plan 100 decision — ETF project-stabilized research eligibility (2026-10-16)

**Decision accepted by the user:** use a project-stabilized snapshot for offline research when provider-declared finality is unavailable. This is not a claim of provider finality.

**Implementation on PR #83 branch:** [policy](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-PROJECT-STABILIZED-RESEARCH-POLICY-2026-10-16.md), [eligibility evaluator](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/scripts/evaluate-btc-etf-research-eligibility.mjs), and [dedicated tests](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/scripts/evaluate-btc-etf-research-eligibility.test.mjs). The read-only source-staging workflow now runs the policy tests.

**Fail-closed criteria:** two valid distinct captures at least 24 hours apart; both Farside and TFTC captured in both; exactly one complete/reconciled row per source for the target date; and unchanged per-source row fingerprints across captures. The evaluator returns `ELIGIBLE_FOR_REVIEW` only; explicit human approval is required. A changed row is a revision candidate, earlier evidence is retained, and affected offline research must be re-evaluated. Missing, failed, incomplete or duplicate data never becomes zero.

**Source fallback rule:** if official sources are unavailable, non-official sources may be investigated as separately labelled corroboration. They cannot silently replace canonical sources. Instrument identity, metric meaning, coverage, terms/licensing and provenance must be reviewed before approval.

**Retention caveat:** the seven-day GitHub Actions artifact is not a durable archive. Until project-controlled retention and recovery are demonstrated, a date cannot be approved solely on the basis of a temporary artifact.

**Validation:** [BTC Public Source Staging #38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) passed, including the new eligibility-policy tests; live capture was skipped as intended. [VPS API Build Rehearsal #38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) was still running when this entry was prepared.

**Boundary:** no live capture, production database writes, ingestion, scenario evaluation, scenario-state/probability/monitoring changes, deployment, or PR merge. This does not automatically make BTC `evaluable`.


### Validation completion update — 2026-10-16

The previously pending [VPS API Build Rehearsal #38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) has completed successfully. Together with [BTC Public Source Staging #38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856), this confirms the policy unit tests and VPS build/E2E rehearsal for the implementation commit. This is CI/test-environment evidence only; it does not validate live source availability or durable archive retention. PR #83 remains Draft/open/unmerged, and BTC is not automatically evaluable.


## Plan 100 — alternative BTC ETF source review (2026-10-16)

**Completed on PR #83 branch:** [BTC ETF alternative-source review](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md).

SoSoValue's documented API is the strongest next candidate for a manual, offline corroborating capture: it exposes ETF aggregate/per-fund history, requires an API key, and the documented per-fund history is limited to the most recent month. API terms, exact aggregate semantics, key access, timestamp/finality behavior, and actual date-level parity remain unverified. No API request or capture was performed.

**Critical lineage finding:** TFTC states that its current daily aggregates and ongoing per-fund flows come from SoSoValue, while historical per-fund history through mid-2026 is compiled from issuer disclosures tabulated by Farside. Farside and TFTC are different publishers but current daily lineage overlaps. The approved arithmetic mean remains a project-defined research comparison metric, **not an independent two-source consensus**. SoSoValue can help verify lineage but must not be counted as a third independent vote. Changing the metric requires a separate decision.

SatoshiMacro (Farside + SoSoValue with last-known-good fallback), CryptoETF.today (API key; terms/lineage not established), and Newhedge (BTC-denominated series with a seven-day revision window) were reviewed as alternatives; none is approved or promoted to canonical priority.

**Next safe gate:** inspect SoSoValue API terms and exact aggregate contract, confirm key access without exposing secrets, then implement a manual-only offline candidate adapter and compare the same reporting dates/fund universe. Do not commit raw payloads to the public repo until redistribution rights are established. Durable project-controlled evidence retention remains a blocker; BTC stays `not_evaluable`.


### Offline SoSoValue candidate adapter — 2026-10-16

Added on PR #83 branch: `scripts/prepare-btc-sosovalue-etf-candidates.mjs` and dedicated tests wired into `btc-public-source-staging.yml`. This adapter only normalizes an already captured response; it performs no network calls and reads no API key. It preserves the response-body SHA-256 and retrieval timestamp, converts documented USD totals to USD million/day, keeps provider observation time and finality unknown, and blocks malformed dates, duplicate dates, missing/non-numeric values, invalid endpoint URLs, invalid retrieval timestamps, and non-200 responses. Output is explicitly non-persistable and remains a candidate only.

No SoSoValue request was made because API access/terms and redistribution rights have not been verified. This is an offline adapter scaffold, not evidence that the provider returned any particular value. Latest policy tests are being validated in CI; do not report the new head as green until its run completes.


### BTC ETF evidence archive/recovery contract — 2026-10-16

Added on PR #83 branch: [BTC ETF evidence archive and recovery contract](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md). This is documentation/design only, not a deployed archive. It defines immutable per-capture snapshot directories, source and retrieval provenance, body hashes, normalized fingerprints, revision diff evidence, human review records, private storage, independent encrypted backup, checksum verification and restore rehearsal. It separates reporting date, retrieval time and provider observation time; forbids raw payloads/secrets in the public repo; and treats the seven-day Actions artifact as temporary transport only.

**Unresolved and still blocking:** VPS and independent backup destination are not provisioned; durable storage and restore have not been demonstrated; retention period/deletion eligibility and provider raw-data reuse terms are not approved. This does not clear the ETF evidence-retention gate, approve any date, or make BTC `evaluable`.


### Live BTC ETF source verification — 2026-10-16

Implemented and ran a read-only capture of the keyless CryptoETF.today MCP source in [BTC Public Source Staging run #161](https://github.com/olegsh247-stack/Crypto/actions/runs/38969684249). Commit: [`413ff95`](https://github.com/olegsh247-stack/Crypto/commit/413ff95220fc2bb55d8a2bae5ce8b66170d10acc). Capture returned HTTP 200 and a 31-row BTC daily-flow series (reported windowDays=30); raw response, manifest, hashes and normalized review output are in the temporary [7-day Actions artifact](https://github.com/olegsh247-stack/Crypto/actions/runs/38969684249/artifacts/12076710152). Source staging completed successfully; the VPS build rehearsal for the same commit was still running when this entry was prepared.

**Important quality result — do not approve this source for canonical ingestion:** CryptoETF.today returned zeroes for weekend dates (e.g. 2026-10-10 and 2026-10-11) and a zero for 2026-10-16 even though its own site describes flows as T+1 and the same-day record is not established as final. Treat these as suspicious zero placeholders, not verified zero-flow observations. For the four overlapping reported dates, CryptoETF.today differs from Farside by -3.5m USD on 2026-10-12 (-61.9 vs -65.4), -4.1m on 2026-10-13 (+171.6 vs +175.7), and +4.0m on 2026-10-14 (-257.4 vs -261.4); 2026-10-15 matches at +5.1m. TFTC's precise daily aggregates round to Farside's displayed totals for these dates, but TFTC lineage overlaps with Farside/SoSoValue and is not an independent third vote.

SoSoValue remains key-gated and was not called; no API key or secrets were used. ByKaranteli weekly CSV archives are not suitable as the primary daily refresh feed. CoinGlass/CryptoQuant/Glassnode require keys and do not replace the need to verify exact ETF-flow lineage; Glassnode's described ETF balance metric is not the same as daily net flow. Farside and TFTC captures remain review evidence, not ingestion approval, because provider observation/publication/finality and durable archive rights remain unresolved.

**Decision:** CryptoETF.today is a useful automated cross-check candidate, but **blocked from canonical ETF-flow input** pending explanation/reconciliation of its daily deltas, zero-placeholder behavior, revision/finality semantics and source terms. No production DB access/writes, ingestion, scenario evaluation, state/probability changes, deployment or merge occurred. BTC remains `not_evaluable`.


### DXY source contract and SoSoValue access path — 2026-10-17

**DXY contract recorded:** the intended metric is the U.S. Dollar Index (DX-Y.NYB), unit index_points, daily completed-session **Close** (not Adj Close and not the live/intraday quote). The provider's candle/session date is distinct from UTC timestamps. Yahoo's chart timestamp is treated only as a candle label; it is not evidence of the actual close time or publication time. The metric registry's 48-hour freshness limit remains the target, but it cannot be evaluated honestly from a candle label alone. The observation therefore remains blocked until a reliable close/publication timestamp or explicitly approved session-age rule is available.

**Access restriction discovered:** Yahoo's general Terms of Service prohibit automated data collection from its services without express prior permission. The Yahoo chart endpoint is undocumented and is not an approved API. The scheduled/read-only staging script has therefore stopped requesting this endpoint and now emits a BLOCKED_ACCESS_TERMS candidate record without a network request. Yahoo is not approved as a canonical source; the source registry labels it blocked. A licensed/official DXY feed or explicit Yahoo permission is required before automated refresh. This does not substitute a broad trade-weighted USD series for DXY.

**SoSoValue:** current official developer documentation confirms a free/demo API access path but requires a developer-dashboard application/key and the x-soso-api-key header. ETF aggregate history is documented at GET /openapi/v1/etfs/summary-history; its values are candidate daily aggregates, not approved observations. No API key can be created from this repository session because it requires signing into the user's external account and submitting the application. Do not put a key in Git or in a public workflow log. The source remains a candidate until the user creates/retrieves the free key and provides it through a GitHub Actions secret or other secure environment, after which a read-only request and same-date reconciliation can run. No source priority or production state changed.

**Safety and status:** read-only repository change only. No production database, ingestion, scenario evaluation, probability/state, deployment or merge was touched. BTC remains not_evaluable.


### SoSoValue keyed capture wired into read-only staging — 2026-10-17

Added an optional read-only request to the official SoSoValue ETF aggregate history endpoint. It reads only the environment variable `SOSOVALUE_API_KEY`, sends it via the documented `x-soso-api-key` header, never prints the key, stores raw response/hash in the temporary review artifact, preserves the provider's reverse-chronological order, and converts USD net inflow to USD million/day for comparison. When the secret is absent, it records `BLOCKED_NO_API_KEY` and makes no request; an API failure is recorded as a source failure and does not change canonical source priority. The staging workflow now passes the GitHub Actions secret into the capture step without exposing it in logs.

**Remaining external-account step:** the API key must be created/retrieved in the user's SoSoValue Developer Dashboard and saved in repository Actions secrets as `SOSOVALUE_API_KEY`. This session cannot authenticate to that external account or create a key on the user's behalf. Once the secret exists, the next path-filtered staging run will automatically capture and compare the provider response. Until then, the SoSoValue candidate is correctly blocked and no ETF source is accepted.


### DXY registry parity correction — 2026-10-17

The first BTC Scenario Readiness Gate after registering `macro.yahoo_finance_candidate` failed at the repository consistency validator because the new source-registry entry was not yet present in the PostgreSQL seed. This was a repository validation failure, not a production database failure. Added the same access-blocked candidate to `infrastructure/postgres/seed-v1.sql` so registry and clean-database seed remain consistent. Re-running the gate and source staging is required before calling the changes verified.


### Verification after DXY / SoSoValue input-check changes — 2026-10-17

- BTC Public Source Staging passed on commit `932194e54729ff01f40083e75433e1c63fff9673`: [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38970404567). All 13 observation-normalizer tests passed, including new tests that keep DXY explicitly blocked and compare SoSoValue aggregates with Farside by reporting date without promoting either source.
- BTC Scenario Readiness Gate passed after the source registry/seed parity fix on commit `461eaa027e5bab242850edf0302dd6396553aa9f`: [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38970454012). The earlier failure was the missing PostgreSQL seed row for the newly registered blocked Yahoo candidate; the seed correction resolved the validator failure.
- Seed observation idempotency rehearsal passed: [run](https://github.com/olegsh247-stack/Crypto/actions/runs/38970453948).
- The staging artifact/log confirms DXY status `BLOCKED_ACCESS_TERMS` and SoSoValue status `BLOCKED_NO_API_KEY`; no Yahoo HTTP request was made by the updated script and no SoSoValue request was made without a key.
- The later VPS API build rehearsals and Crypto VPS Release Gate were still running at the time of this entry; do not label them green until completed.
- DXY is now present in normalized BTC input review as a blocked row with unverified observation time and uncomputable freshness. This does **not** make it an accepted input and does not change the BTC scenario state/probability.


### Read-only BTC source staging re-triggered after SoSoValue secret setup — 2026-10-17

- User confirmed repository permissions are in place and that `SOSOVALUE_API_KEY` has been added as a GitHub Actions secret. The secret value was not read or exposed in this session.
- Reviewed the current staging workflow and confirmed it passes the secret only through the capture step's environment. The previously available artifact predates the secret setup and cannot validate SoSoValue authentication.
- Added a workflow concurrency group (`btc-public-source-staging`, no cancellation of an in-progress capture) to avoid overlapping read-only captures and ambiguous artifact ownership. Commit: `7d29e5ff3e91099b7eae58ccd8949b16089e556e`. The workflow file is included in its push path filter, so this change should initiate a fresh read-only capture.
- **Verification pending:** the resulting run/artifact has not yet been retrieved in this session. SoSoValue HTTP status, response shape, historical row count and date-by-date reconciliation remain unconfirmed. Do not mark the source accepted just because the secret is configured.
- Safety unchanged: no production database, ingestion, scenario state/probability, deployment or merge was touched. BTC remains `not_evaluable`; Yahoo DXY remains blocked by access terms.


### DXY public-source alternatives — documentation verification — 2026-10-17

- FXMacroData documentation confirms that its keyless USD access covers recent USD macro announcements/catalogue/calendar and a 90-day window, while its documented FX pair history endpoints require an API key. The reviewed API catalogue does not document an ICE DXY index endpoint. **Status: NOT VERIFIED AS DXY; do not use for macro.dxy without a specific DXY instrument in the official catalogue.** [API reference](https://fxmacrodata.com/documentation/reference)
- Alpha Vantage documents INDEX_DATA and INDEX_CATALOG for supported market indices, but INDEX_DATA is explicitly marked a premium endpoint and requires an API key. The documentation search did not establish that ICE DXY is in its supported index catalogue. **Status: BLOCKED PENDING SYMBOL-CATALOGUE PROOF AND FREE-TIER ENTITLEMENT; not a confirmed free DXY source.** [Documentation](https://www.alphavantage.co/documentation/)
- Live-Rates.com documents a keyless /rates endpoint capped at 3 requests/hour/IP, a feed of 170+ instruments including indices, but its historical endpoints require a key and its published terms say data is licensed for use via an active subscription, with redistribution requiring written consent. The reviewed documentation does not identify DXY explicitly in the no-key instrument list. **Status: CANDIDATE ONLY; exact DXY membership and use/redistribution rights unresolved.** [API reference](https://github.com/Live-Rates/live-rates.com)
- FRED DTWEXBGS remains a broad nominal trade-weighted U.S. dollar index, not ICE DXY; it must not be substituted into macro.dxy. [FRED/ALFRED](https://alfred.stlouisfed.org/series?seid=DTWEXBGS)
- No DXY candidate is promoted into source_priority or canonical runtime. Need next verify exact instrument coverage from provider's own catalogue/response and source terms before implementation.


## 2026-10-17 — подтверждён SoSoValue keyed staging и выполнен первичный аудит каталога источников

- GitHub Actions [BTC Public Source Staging #168](https://github.com/olegsh247-stack/Crypto/actions/runs/39009940767) завершился success; artifact `btc-public-source-review` получен и проверен. В manifest: read-only staging, production DB не открывалась, production writes не выполнялись.
- Секрет `SOSOVALUE_API_KEY` работает: SoSoValue summary-history ответил HTTP 200, в payload 22 дневные записи. Это подтверждает техническую доступность keyed API из runner, но не права на автоматизированное использование/архивирование и не готовность к ingestion.
- Cross-check: за 2026-10-16 SoSoValue −82.3893051 млн USD vs Farside −82.4 млн (разница ≈0.010695 млн); за 2026-10-07 SoSoValue −487.0674115 млн vs Farside −484.9 млн (разница ≈2.167412 млн). Последнее расхождение существенное; SoSoValue остаётся cross-check only, Farside rows остаются review-only до подтверждения observation/publication timestamp и revision/finality.
- Создан первичный [аудит источников и централизации конфигурации](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/CRYPTO-SOURCE-INVENTORY-AND-CENTRAL-CONFIG-AUDIT-2026-10-17.md): роли endpoint-ов, метрики/blocks из registry, результаты capture, placeholder-ы, DXY/ETF blockers и проект Source Catalog. Отдельный [PROMPT для расширенного аудита](https://github.com/olegsh247-stack/Crypto/blob/fix/btc-readiness-registry-runtime-source/docs/PROMPT-SOURCE-INVENTORY-AND-CONFIGURATION-AUDIT.md) остаётся самостоятельным заданием для дальнейшего трассирования.
- Вывод по архитектуре: источники стоит централизовать в `data/CryptoDataModel/registry/source-catalog.json` (endpoint, auth secret reference, adapter, terms/status, timestamp/revision/freshness semantics); metric registry сохраняет units, freshness, research block IDs и допустимые source IDs. Сначала документация и tests/parity, затем отдельная безопасная миграция; в этом шаге runtime config не менялся.
- BTC остаётся `not_evaluable`. Не изменялись source priorities, SQL seed, production DB, ingestion, evaluator, scenario state/score/probability, deployment или merge.


## 2026-10-17 — политика частоты опроса и перечень ключей

- Добавлен [SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md](SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md). Целевой диапазон 15–60 минут относится только к оперативным данным и зависит от потребителя и лимитов провайдера; дневные ETF/macro/holdings и событийные данные получают daily/event-driven cadence. Poll interval отделён от freshness window.
- Единственный подтверждённо нужный ключ на текущем этапе — `SOSOVALUE_API_KEY`, уже настроенный в GitHub Actions для read-only cross-check. Новые ключи сейчас создавать не требуется. Glassnode, derivatives provider, официальный macro source и DXY остаются кандидатами; ключи откладываются до выбора endpoint, подтверждения тарифов/ToS и необходимости.
- В аудит источников и отдельный prompt добавлено требование фиксировать для каждого endpoint poll interval, provider rate limit, freshness policy, backoff и секретную переменную (без значения ключа).
- Runtime cadence/registry/source priorities не менялись. Производственная БД, ingestion и scenario evaluation не затрагивались; BTC остаётся `not_evaluable`.
