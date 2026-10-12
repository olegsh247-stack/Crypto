# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 12 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Зафиксированный SHA `main` на момент подготовки:** `115e13995c4ba005545a78033bf4a638b3584c38`  
**Документ в репозитории:** `docs/PLAN-100.md`  
**Назначение:** единый рабочий план от текущего состояния до полной готовности продукта, self-hosted hosting, безопасного cutover и операционной устойчивости.

---

## 0. Короткое решение: что строим и в каком порядке

Мы строим исследовательскую платформу для криптоактивов, которая в целевом состоянии работает на собственном VPS пользователя, использует PostgreSQL и позволяет получать воспроизводимые, проверяемые аналитические результаты с прозрачными источниками, единицами, временными метками, версиями и доказательствами.

**Обязательный порядок приоритетов:**

1. **Hosting architecture и зависимости** — завершить карту Neon/Cloudflare и связанных интеграций; отделить факты репозитория от внешнего состояния аккаунтов и работающего публичного endpoint.
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

## Текущий статус верхнеуровневых этапов

| Этап | Статус на 2026-10-12 | Следующее действие |
|---|---|---|
| 1. Hosting architecture | `BLOCKED` по внешним фактам; repo/CI pass завершён, Cloudflare dashboard evidence частично получено | Repo-side dependency map и VPS rehearsal подтверждены. Владелец увидел Cloudflare Worker `crypto-api`, `workers.dev` hostname, encrypted `DATABASE_URL`, Cron trigger и пять последних failed Builds; статус активного deployment, routes и цель DATABASE_URL не установлены. Secret names/usage в GitHub, installed Apps, live API-to-DB routing и branch protection требуют дальнейших проверок; не объявлять hosting audit закрытым. |
| 2. PR audit | `NOT STARTED` как полный сводный аудит | После этапа 1 снять актуальные PR/SHA/checks и сравнить каждый PR с `main`. |
| 3. Product Contour v1 | `IN PROGRESS` / требует повторной проверки current main | После PR audit сверить фактические контракты и провести read-only проверки. |
| 4. BTC source contracts | `IN PROGRESS`, inputs not accepted | Проверить raw artifact, источники, freshness, units, duplicates и manifest. |
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

## Verification closure update — 2026-10-12

- Repository-side hosting checks and the VPS rehearsal on PR #76 are complete for this pass. [Run #38302522671](https://github.com/olegsh247-stack/Crypto/actions/runs/38302522671) succeeded on commit `c60fc7651292f008ad06c2bb35d313801d7c4cb0`; this is branch CI evidence, not a merge or production deployment.
- Hosting audit remains `BLOCKED`, not `DONE`: Cloudflare dashboard state, GitHub secret names/usage, repository App permissions, live public API-to-database routing, and main branch protection are not authoritatively verified by current integration access. The branch-protection API returned 403; an empty ruleset response is not enough to claim the branch is unprotected.
- No production changes, resource removals, secret/DNS changes, migrations, database writes, merges, or deployments were made.
- Next step stays within Plan 100 stage 1: obtain the missing external evidence where dashboard/account access is available. Do not advance to the full PR audit or decommission legacy providers by assuming these facts.


### Cloudflare dashboard evidence — 2026-10-12

The owner-provided Cloudflare dashboard view has been documented in docs/HOSTING-DEPENDENCY-AUDIT-2026-10-12.md on the hosting-audit branch. Key facts: Worker crypto-api and its workers.dev hostname exist; Production has an encrypted DATABASE_URL secret; the dashboard shows a Cron trigger with a next run on 2026-10-13 00:30; and the five latest visible Cloudflare Builds listed for fix/api-web-research-response-contract-2026-10-12 failed in 5–9 seconds. Logs and Traces being disabled means observability is disabled, not necessarily the Worker itself. Failed Builds do not prove that an older deployment is not serving requests. Active deployment status, Domains & Routes, and the actual database target remain unverified.

No Cloudflare settings, secrets, DNS, deployments, or traffic were changed. Keep Plan 100 stage 1 BLOCKED; next obtain deployment status and Domains & Routes, then verify the public API/runtime/database mapping without revealing secret values. Do not delete or re-enable the Worker as part of this audit.
