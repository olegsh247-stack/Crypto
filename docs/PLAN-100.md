# ПЛАН 100 — главный план проекта Crypto

> **СТАТУС ДОКУМЕНТА: ГЛАВНЫЙ ПРИОРИТЕТ ПРОЕКТА.** Этот документ задаёт обязательную последовательность работ. При конфликте с отдельными старыми задачами, комментариями, ветками или PR приоритет имеет актуальная версия «План 100», кроме случаев, когда пользователь явно изменил план.

**Актуальность снимка:** 14 октября 2026 года (Europe/Riga)  
**Основной репозиторий:** https://github.com/olegsh247-stack/Crypto  
**Основная ветка:** `main`  
**Последние проверенные CI-свидетельства (27 октября 2026):** BTC Public Source Staging [#40471108936](https://github.com/olegsh247-stack/Crypto/actions/runs/40471108936), BTC Scenario Readiness Gate [#40471113390](https://github.com/olegsh247-stack/Crypto/actions/runs/40471113390), Source Catalog Contract Validation [#40471113428](https://github.com/olegsh247-stack/Crypto/actions/runs/40471113428), seed idempotency rehearsal [#40471113348](https://github.com/olegsh247-stack/Crypto/actions/runs/40471113348), Validate VPS Release Workflow [#40471113415](https://github.com/olegsh247-stack/Crypto/actions/runs/40471113415), and VPS API Build Rehearsal [#40471108869](https://github.com/olegsh247-stack/Crypto/actions/runs/40471108869) passed on code SHA `8ed46df441285a5341b1d0a346bf006083bd698b`. Duplicate VPS API Build Rehearsal [#40471113337](https://github.com/olegsh247-stack/Crypto/actions/runs/40471113337) was still running when recorded. Latest capture report: `docs/BTC-READONLY-CAPTURE-RESULT-2026-10-27-0805Z.md`. DXY is optional; ETF publication-time/revision/finality and durable retention remain production-ingestion gates.
**Документ в репозитории:** `docs/PLAN-100.md`  
**Назначение:** единый рабочий план от текущего состояния до полной готовности продукта, self-hosted hosting, безопасного cutover и операционной устойчивости.

---

## 0. Короткое решение: что строим и в каком порядке

Мы строим исследовательскую платформу для криптоактивов, которая в целевом состоянии работает на собственном VPS пользователя, использует PostgreSQL и позволяет получать воспроизводимые, проверяемые аналитические результаты с прозрачными источниками, единицами, временными метками, версиями и доказательствами.

**Обязательный порядок приоритетов:**

1. **Self-hosted hosting architecture** — закрепить собственную инфраструктуру пользователя (VPS + PostgreSQL) в репозитории и CI. VPS покупаем/предоставляем позже, когда дойдём до этапа развёртывания. До этого готовим архитектуру, конфигурацию, миграции, backup/restore и CI-репетиции; покупку VPS не форсируем и не делаем её блокером текущей работы над BTC. Старые внешние платформы не являются целевой архитектурой и не требуют дальнейших проверок в рамках Плана 100.
2. **Сверка всех открытых PR с `main`** — установить, что уже реализовано, что дублируется, что устарело, что действительно нужно; ничего автоматически не объединять и не закрывать.
3. **Полный Product Contour v1 audit** — проверить фактические контракты API, Web, Worker, источников, факторов, scores, сценариев, monitoring и Evidence на актуальном коде и доступных read-only данных.
4. **Один полный воспроизводимый сценарий BTC** — только после проверки происхождения, свежести, единиц, временных интервалов, revision/lineage и конфликтов входов. Сначала offline/read-only воспроизведение. Не создавать автоматически состояние сценария или monitoring event.
5. **Приёмка одного сквозного продуктового пути BTC** — пользовательский интерфейс, API-контракты, evidence, snapshot lineage, объяснимый результат и повторяемые тесты.
6. **Подготовка и развёртывание на собственном VPS** — только когда VPS будет реально приобретён/предоставлен. До этого — локальные и CI-репетиции на disposable PostgreSQL; не менять текущий публичный сервис.
7. **Контролируемая миграция и cutover** — backup, restore, parity, acceptance, явное разрешение пользователя, план отката и период наблюдения.
8. **Только после прохождения BTC-сценария** — расширять источники, исследования и активы; не начинать массовое расширение заранее.

План не означает, что все этапы уже сделаны. Статус каждого этапа меняется только на основании проверяемых доказательств, тестов, результатов команд или актуальных данных GitHub.

## Обязательное решение по хостингу — НЕ ПЕРЕОТКРЫВАТЬ БЕЗ ЗАПРОСА ПОЛЬЗОВАТЕЛЯ

**Целевая инфраструктура — собственный VPS пользователя и собственный PostgreSQL. Покупку/аренду VPS намеренно откладываем до этапа развёртывания (этап 6 ниже); это уже согласованное решение, а не открытый вопрос.**

- Не возвращаться к Cloudflare или Vercel: не проверять их deployment/аккаунты/endpoints, не пытаться восстанавливать parity старого Worker, не предлагать их как вариант хостинга и не делать их доступность блокером Плана 100.
- Не тратить время на старый публичный сервис и его версию. Он не является целевой инфраструктурой; перенос/отключение старого сервиса будет отдельным действием только при достижении согласованного этапа и с явным разрешением пользователя.
- До покупки VPS продолжать работу над BTC и подготовку self-hosted контура через репозиторий, документацию, локальные/CI-репетиции и disposable PostgreSQL. Не покупать и не разворачивать VPS самостоятельно.
- На этапе развёртывания: пользователь приобретает/предоставляет VPS, после чего выполняются проверка окружения, развёртывание, миграция, backup/restore и acceptance по отдельным воротам.
- **Правило против повторного открытия решения:** если в будущем ассистент снова предлагает проверять Cloudflare/Vercel или утверждает, что это блокирует текущий этап, считать это ошибкой следования плану. Свериться с этим разделом и продолжить текущий приоритет без повторного обсуждения.
- Это решение заменяет более старые формулировки о внешней проверке Cloudflare/GitHub App/DNS как обязательном условии перед отключением legacy-сервиса. Никаких действий с внешними платформами в рамках текущего этапа не требуется.

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


## 2026-10-17 — runtime API source path: найдено отличие от research registry

- Трассирован `vps/api/src/app.ts`: runtime ticker fallback идёт Binance → Kraken → CoinGecko, а research `market.spot_price` source priority указывает только `market.kraken`. Не считать эти контуры идентичными и не смешивать runtime price с canonical research BTC/USD автоматически.
- Runtime ticker cache установлен на 60 секунд; HTTP cache headers max-age 30 / s-maxage 60. Это может вызывать upstream-запросы чаще целевого диапазона 15–60 минут. Время `timestamp` присваивается приложением после fetch, а не подтверждённым source observation time.
- Runtime CoinGecko simple/price вызывается без ключа; текущий `vps/.env.production.example` не содержит provider API keys. Новые ключи пока не нужны; сначала рассмотреть кэш/частоту и проверить provider limits.
- Фактические расхождения добавлены в аудит и polling policy. Код, TTL, API response, canonical source priority, SQL seed и scenario state не менялись. Следующий этап — проверить UI/consumers и тесты перед изменением cache TTL/timestamp contract.


## 2026-10-17 — снижена частота runtime ticker cache на рабочей ветке

- На `fix/btc-readiness-registry-runtime-source` (commit `3da2ffba02a1aa3307066038bb6da2eda5dc6c78`) изменён ticker cache TTL 60 секунд → 15 минут; Cache-Control max-age/s-maxage 900 секунд. Это согласует нижнюю границу кэширования с целью не создавать upstream запрос на каждый refresh UI.
- Изменение только в рабочей ветке; не merge/deploy. Требуется успешный VPS API Build Rehearsal/E2E до рассмотрения дальнейшего шага. Источники/fallback, source priority, SQL seed и scenario state не менялись. Runtime `timestamp` всё ещё означает время получения приложением, не source trade time.

## 2026-10-18 — актуальная контрольная точка Plan 100

Дата этого блока — контрольная точка после повторной read-only проверки; исторические снимки и прежние статусы выше не переписываются задним числом.

### Подтверждено

- **BTC fee/subsidy:** staging run [#39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890) прошёл. Проверено 144 последовательных блока `971906–972049`; сумма комиссий по блокам совпала с aggregate endpoint: `197,402,505 sats` (`1.97402505 BTC`), субсидия `450 BTC`, отношение `0.438672%`. Предыдущее окно не перекрывается с новым, поэтому reorg/revision comparison не заявляется. Новое окно закреплено как baseline; следующее сравнимое окно должно перекрываться с ним и пройти stable-tip проверки, ориентир по конечной высоте — `972055` или выше.
- **ETF:** второй Farside snapshot снят более чем через 24 часа после baseline. Сравнены 14 пересекающихся датированных строк: изменений значений, добавления или удаления строк не обнаружено. Это закрывает только сравнение данной пары снимков, но не права на архивирование/хранение и не контракт session-aware freshness/publication time.
- **Supply semantics:** документированно разделены протокольная эмиссия и экономический circulating supply. Кандидат `20,100,159.375 BTC` через высоту `972050` остаётся `REVIEW_ONLY_PROTOCOL_DERIVED_SUPPLY`; в реестр и runtime не добавлялся.
- **Registry/seed audit:** отдельного `monetary.protocol_issued_supply` нет. `monetary.circulating_supply` в реестре ссылается на `network.primary`, однако исторический seed содержит значение `20,086,198.00419505 BTC` от `2026-09-19`, `source_url = NULL`, а методология называет Bitcoin Core `gettxoutsetinfo`. Это установленное несоответствие source ID и описания происхождения; строка stale и не считается подтверждённым источником.
- **DXY:** Yahoo Finance `DX-Y.NYB` ранее удалось прочитать как review-кандидат (`Close 101.84`, сессия `2026-10-16`), но это не доказывает время фактического закрытия/публикации или разрешение на автоматизированный сбор. Источник остаётся заблокированным для canonical ingestion; не подменять DXY широким trade-weighted USD индексом.
- **CI:** [BTC Public Source Staging #39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890) и [VPS API Build Rehearsal #39160316806](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316806) прошли для соответствующего кода. Это CI/staging, не production verification.

### Открытые блокеры

1. Закрыть контракт `monetary.circulating_supply`: выбрать и доказать точную семантику (UTXO-set amount, protocol-issued supply или provider-defined economic circulating supply), затем устранить source/provenance mismatch только после согласования.
2. Доказать source timestamp/session freshness и допустимое хранение для ETF, а не повторять уже успешное сравнение той же пары снимков.
3. DXY: это необязательный контекст первого BTC-сценария, поэтому поиск автоматического источника не является блокером сценария. Отдельно закрыть обнаруженное несоответствие реализации: текущий `main` всё ещё считает DXY обязательным, тогда как контракт и Draft PR #83 задают его как optional; сверить тесты/изменения PR #83 с `main`, без автоматического merge.
4. API deployed-version parity: нет подтверждённого deployment-side commit SHA или immutable image/artifact digest. VPS deployment skeleton документирован как prepared/not deployed; production routes/DB не проверялись.
5. Получить следующее перекрывающееся 144-блочное fee window после достаточного продвижения tip; не запускать повторные captures до подходящего окна.

**Статус сценария BTC:** `not_evaluable`. Не выполнялись production API/DB запросы, ingestion, production writes, registry/runtime changes, scenario evaluation/state changes, monitoring-event writes, deploy, merge или traffic cutover. Следующие активы не расширяем до закрытия полного BTC пути.

## 2026-10-18 — DXY optional-context contract reconciliation

Decision: DXY is optional macro context, not a mandatory readiness input for the first BTC scenario. If a permitted, correctly timestamped observation is unavailable, omit DXY; do not substitute FRED `DTWEXBGS` or carry forward a stale close.

Read-only code check found a mismatch: current `main` still includes `macro.dxy` in the hard-coded `REQUIRED` list in `vps/shared/src/btc-scenario-readiness.ts`, so a missing DXY row can still force `not_evaluable`. Open Draft [PR #83](https://github.com/olegsh247-stack/Crypto/pull/83) contains the intended registry-driven approach with DXY marked optional, but remains unmerged. Resolve this contract/code mismatch through PR review; do not merge automatically or change runtime/registry on `main` in this documentation step.

This does not make BTC evaluable: spot-price and ETF-flow readiness gates remain mandatory. No runtime, registry, database, scenario, deployment or merge changes were made. Documentation-only; CI not run.


## 2026-10-19 — Draft PR #83 readiness review

Read-only review of PR #83 at head `56f0096061652ed05a2ea39c05dad62a48ec6738` confirms the intended registry contract: only `market.spot_price` and `institutional.etf_net_flow` are marked required; DXY is optional; hashrate and fee/subsidy remain optional context. The branch includes explicit DXY-optional tests and ETF fail-closed checks for fund completeness, revision/finality, duplicate reporting dates/row keys, timestamps and five distinct recent reporting days.

**Review findings / merge blockers:**
1. GitHub reports the PR open, Draft, unmerged, and `mergeable: false`. The combined commit status has no status checks and the workflow-run lookup returns no PR-triggered runs for the current head. Tests in the branch are therefore not confirmed passing at this head.
2. In `vps/shared/src/btc-scenario-readiness.ts`, ETF history is filtered and initially ordered by `observed_at`/revision, but selected history is then truncated with `.slice(0, 7)` without explicitly sorting by the logical reporting date (`period_start`) descending. When multiple rows share publication/observation timestamps, the chosen five-to-seven sessions can depend on input order rather than the newest reporting dates. Add a deterministic reporting-date sort and a regression test before approval.
3. The PR combines the readiness contract with a broad set of source catalog, API/Worker image, web-build, DXY-probe, SoSoValue, ETF archive and documentation changes. Review and CI need to validate the complete changed-file set; passing older runs on earlier SHAs is not evidence for the current head.
4. The implementation remains fail-closed on ETF revision/finality and complete-fund evidence. This is intentional: current public data candidates do not automatically become accepted scenario inputs.

No files in runtime, registry, SQL seed, database, scenario state or deployment were changed by this review. PR #83 was not merged and no workflow was dispatched. BTC remains `not_evaluable`; mandatory current spot-price and ETF-flow evidence is still not accepted. Next: fix deterministic ETF reporting-date selection on the PR branch, run/verify CI for the resulting exact head, then review mergeability and the full PR scope without auto-merging.


## 2026-10-19 — ETF reporting-date selection hardened on PR #83

On `fix/btc-readiness-registry-runtime-source`, changed `vps/shared/src/btc-scenario-readiness.ts` so ETF rows sort by valid logical reporting date (`period_start`) descending first; observation/publication time and revision are tie-breakers. The selected history is explicitly sorted by reporting date descending before the seven-row cap. Added a regression test with eight ETF sessions sharing the same `observed_at`, supplied in reverse order, to assert that the newest seven reporting dates are selected deterministically.

Commits: implementation `68a46c4ce6453d27faf0c0e571d2337d545a4294`; regression test `9621ad9f8642de0e2e2f78b5e758f33ffd3c11fd`. The current PR head is `9621ad9f8642de0e2e2f78b5e758f33ffd3c11fd`.

Verification boundary: GitHub combined status returned no checks and the available commit-workflow lookup returned no PR-triggered runs for this exact head. Therefore CI is **not yet confirmed**; do not treat the new test as passing until a completed run for this SHA is inspected. PR #83 remains Draft, open, unmerged, and `mergeable: false`. No workflow was manually dispatched. No production DB, ingestion, source registry, SQL seed, scenario state, deployment or merge changes. BTC remains `not_evaluable` pending accepted current spot and ETF-flow evidence and the remaining Plan 100 gates.


## 2026-10-19 — PR #83 source-probe safety review

- Continued the review of Draft PR #83. Found two external-request workflows whose triggers did not adequately express the required opt-in boundary: SoSoValue could make an authenticated API request on matching pushes, and the DXY probe included Yahoo Finance despite the unresolved automated-access terms.
- Hardened `.github/workflows/sosovalue-btc-etf-api-check.yml`: it now runs only through manual dispatch with `run_request=true`; the default is false, and a normal push no longer makes an external API request.
- Hardened `.github/workflows/dxy-public-source-probe.yml`: it now requires manual dispatch with `probe_public_sources=true`, defaults to no request, and no longer queries the blocked Yahoo Finance endpoint. This does not approve any DXY source or make DXY a required BTC input.
- Commits on `fix/btc-readiness-registry-runtime-source`: SoSoValue opt-in `529d2bdd26e259e9fea118355c7eb66079564675`; DXY probe guard `77c0f1f1e81cda9c5b5061c6acafa6ed9a7becc5` (current PR head at review time).
- No workflow was dispatched and no live source request was made. Exact-head CI remains unconfirmed: combined status has no checks and the available workflow-run lookup returned no PR-triggered runs. PR #83 remains Draft/open/unmerged with `mergeable: false`; no merge or deployment. BTC remains `not_evaluable`.


## 2026-10-19 — ETF latest-publication date guard

- Read-only review found a fail-open edge case: ETF rows were ordered by reporting date before choosing the latest row, so a newer publication missing `period_start` could be sorted behind older dated rows and escape the latest-row blocker.
- Added a fail-closed guard: if the newest ETF publication by `observed_at` lacks a valid reporting date, readiness adds `latest_observation_missing_reporting_date`. Added a regression test with a malformed newer publication alongside otherwise complete history.
- Commits on `fix/btc-readiness-registry-runtime-source`: implementation `a54b62a4fd9f33c36acdc9cd1680aafeb24fa1a5`; regression test/current head `392caf5dd219b29e231ae5bb51af73754726260a`.
- CI for the exact head remains unconfirmed: combined status empty and available PR-run lookup returned no runs. The readiness workflow is still configured for automatic code-change validation; the two manually gated workflows are only live external-source probes, not the normal CI tests. No external request, workflow dispatch, deployment or merge. BTC remains `not_evaluable`.

## 2026-10-20 — План 100: единая контрольная точка по четырём BTC-пунктам

### 1. Supply semantics — решение зафиксировано, реестр пока закрыт для изменения

- `monetary.circulating_supply` означает provider-defined economic circulating supply; протокольная эмиссия и сумма UTXO не считаются взаимозаменяемыми значениями.
- Mempool/protocol-derived total issuance остаётся отдельным review-only кандидатом. Не переименовывать и не подменять им существующую метрику без отдельного согласования Product Contour и проверки downstream-потребителей.
- Текущая seed-строка circulating supply остаётся непригодной: она устарела, имеет `source_url = NULL`, а описание методологии Bitcoin Core `gettxoutsetinfo` не совпадает с source ID `network.primary`. Документное решение не меняет реестр, SQL seed или runtime.

### 2. Контракты входов — состояние после повторной проверки

- **Spot:** контракт — Kraken XBT/USD → BTC/USD (`USD/BTC`), source trade timestamp отдельно от retrieval timestamp, возраст не более 1 часа, exact pair/endpoint, raw payload checksum и idempotent identity. Последний доступный capture устарел для оценки «сейчас»; требуется новый read-only capture в разрешённом staging-контуре перед live readiness.
- **Hashrate:** только дневная оценка с явными UTC границами `[period_start, period_end)`, `EH/s`, source timestamp, retrieval time, checksum и versioned method. Не смешивать с `currentHashrate` или weekly rolling average.
- **Fee/subsidy:** формула — сумма fees / сумма protocol subsidy по одному и тому же набору 144 канонических блоков. Перекрытие двух последних захваченных окон прошло без расхождений; это ограниченное evidence pair, а не доказательство отсутствия будущих reorg. Метрика остаётся review-only/context-only, пока не будет свежего подходящего recapture и принятого правила reorg/finality.
- **ETF:** Farside — приоритетный исследовательский источник, TFTC — контрольный. Два снимка ≥24 часов и 14 пересекающихся строк сравнивались, изменений не было. Этот результат не делает данные свежими сегодня: последняя строка остаётся сессией 2026-10-16. Не разрешены fallback, усреднение, dash-to-zero или выдуманный publication timestamp. Долговременное хранение/reuse rights и US-session freshness contract остаются блокерами; 7-дневный CI artifact не является постоянным backup.
- **DXY:** необязательный контекст; не задерживает BTC. В `main` остаётся несогласованность контракта с readiness implementation, поэтому нужно ревью кода, а не новый поиск поставщика.

### 3. Draft PR #83 — проверен, объединять нельзя

- Текущий PR остаётся Draft/open. После последнего push GitHub API возвращает `mergeable: null` / `mergeable_state: unknown` (до push сообщал `false`), поэтому mergeability не подтверждена. После добавления явного regression test на optional context текущий head: `89dd103b87eb750d4afb121f5c655975844065eb`.
- Изменён широкий набор файлов (readiness/runtime, source catalog, ETF archive/SoSoValue, workflows, web/API и документация). Это не узкий PR, поэтому проверять его как один большой пакет без автоматического merge.
- Для текущего exact head BTC Scenario Readiness Gate [#39382019171](https://github.com/olegsh247-stack/Crypto/actions/runs/39382019171) **успешен**: shared readiness build/test, registry/readiness/directional/candidate tests прошли, включая новый regression test, что supply/hashrate/fee/DXY не являются обязательными входами для базового rule-v1 gate. VPS API Build Rehearsal [#39382019208](https://github.com/olegsh247-stack/Crypto/actions/runs/39382019208) также **успешно завершён** на том же exact head; build/E2E включая disposable PostgreSQL, backup/restore rehearsal и API/Worker contract checks прошли.
- Следующий шаг по PR: получить readiness/test CI на актуальном head, затем устранить mergeability/base divergence и повторно проверить полный diff. PR не объединять автоматически.

### 4. Офлайн-воспроизводимость — контракт закреплён, CI-подтверждение ожидается

- `fixtures/btc-offline-scenario-v1.json` — исторический тестовый fixture, а не актуальный рыночный снимок.
- `scripts/run-btc-offline-scenario.mjs` пересчитывает derived values из provenance и проверяет ожидаемый результат; это проверка детерминизма, не доказательство свежести текущих данных.
- Документация контракта обновлена в `docs/BTC-SCENARIO-V1.md`. BTC Scenario Readiness Gate [#39381872449](https://github.com/olegsh247-stack/Crypto/actions/runs/39381872449) **успешно завершён** для commit `606c3c2dac992f849a770cf29c723b42d8ffeddc`; shared runtime build, registry/readiness/directional/candidate tests и offline runner прошли. В логе fixture `btc-offline-rehearsal-2026-10-17` выдал `scenario_type=base`, `directional_score=-1`, `confidence_band=low`, `baseline_probabilities_changed=false`, `can_persist_scenario_state=false`; `live_data_used=false`, `database_accessed=false`. Это подтверждает только историческую детерминированность, не live readiness.
- **Общий статус BTC:** `not_evaluable`. Не выполнялись production DB writes, ingestion, registry/runtime changes, scenario-state/monitoring writes, deployment или merge. Для актуальной оценки нужны свежий spot, разрешённый/свежий ETF вход и закрытие оставшихся contract gates.

### Следующая последовательность

1. Проверить завершение BTC Scenario Readiness Gate для commit документации и зафиксировать реальный результат офлайн-прогона.
2. Не запускать live source capture повторно до явного разрешения; после разрешения выполнить свежий read-only capture spot и проверить, что ETF сессия действительно свежа.
3. Довести PR #83 до exact-head readiness CI и reviewable/mergeable состояния; не merge автоматически.
4. Дождаться результата VPS API Build Rehearsal #39382019208 на текущем PR head. После этого повторно проверить mergeability/base divergence и решить, нужно ли разделить 94-файловый PR на меньшие reviewable части. Registry/runtime/seed изменения остаются отдельным reviewed этапом.

## 2026-10-20 — Branch reconciliation audit

- PR #83 (`fix/btc-readiness-registry-runtime-source`) is still open/Draft, non-mergeable, and diverged from current `main`: 617 commits ahead, 141 behind, 98 changed files. Do not merge or rebase it as a whole.
- The branch's `scripts/capture-btc-public-sources.mjs` is an older, shorter variant (24.6 KB) than current `main` (39.0 KB). Current `main` already contains more extensive Mempool tip consistency/reorg checks, SoSoValue capture, and fee-window tooling. Replacing it with the PR branch version would lose existing capabilities.
- PR #3 for Product Contour v1 is closed; its branch is also heavily diverged (374 ahead/594 behind). `fix/asset-dashboard-confidence-score-build` is 17 ahead/584 behind and should not be merged blindly either.
- Created `fix/btc-readiness-mainline-2026-10-20` from current `main` at `03f4a08ec6c533556b655319e358d476359b4cf4`; verified comparison initially identical (0 ahead / 0 behind). This is the safe reconciliation branch.
- The old PR #83 is retained as a reference until its useful changes are ported selectively. No branches deleted, PR closed, merge/rebase, production write, deployment, or scenario-state change. Next branch work must compare each PR change against current `main`, preserve newer mainline code, and port only reviewed changes into the clean branch.


## 2026-10-20 — Mainline compatibility checks for source catalog

- Ported the source endpoint catalog and validator from legacy PR #83 without replacing current-main BTC capture or staging workflow files.
- Compared catalog entries with current-main source registry, metric registry, SQL seed, API runtime endpoints, BTC capture script, and candidate-normalization script. The first parity pass found the legacy catalog's FRED broad-dollar candidate incorrectly marked registered even though current main has no matching source-registry ID; changed it to candidate-unregistered/review-only. Confirmed Yahoo DXY candidate is present in the current source registry and catalog, but remains operationally blocked and excluded from metric source priority.
- Adjusted the validator to current mainline: removed its dependency on a SoSoValue candidate-preparation script that does not exist on main, and made the readiness URL-prefix check optional when the current metric registry does not define that field. The catalog does not approve sources or change scenario readiness.
- Added .github/workflows/source-catalog-validation.yml to run the catalog validator on relevant pull-request/push changes. GitHub Actions results are not yet available; do not call this validation passed until a run completes.
- The source catalog's structural endpoint parity check found no missing runtime endpoint families, capture endpoint families, or current candidate-normalization endpoint families in the isolated comparison. A broader semantic-unit audit surfaced expected legacy mismatches (for example, the shared network.primary source covers multiple endpoint families, while ETF holdings metrics currently point at a flow-unit endpoint); these remain audit findings and must not be silently fixed by changing source priority in this branch.
- No runtime readiness, source priority, scenario state/probabilities, SQL seed, production data, deployment, or merge changed.


## 2026-10-20 — Catalog CI confirmed; legacy readiness changes reviewed

- Source Catalog Contract Validation run [#39490935414](https://github.com/olegsh247-stack/Crypto/actions/runs/39490935414) completed successfully on corrected commit `ee6fbedee98085907a3d6a710ccdf704f45ae548`. The `validate-source-catalog` job passed. This closes the catalog validator's negative-test failure; it does not certify source freshness or BTC readiness.
- VPS API Build Rehearsal [#39490935376](https://github.com/olegsh247-stack/Crypto/actions/runs/39490935376) also completed successfully on that corrected code commit. All listed steps passed, including shared runtime build, Worker/API build and contract tests, disposable PostgreSQL setup, BTC registry/provenance checks, duplicate/idempotency rehearsal, backup/restore rehearsal, and API E2E checks. This is a test-environment rehearsal, not a production deployment or live BTC evaluation.
- The branch was subsequently updated with documentation-only commits; these run results are for the corrected code commit, not a claim that CI ran on the latest docs-only head.
- Continued file-by-file review of PR #83: its readiness implementation contains substantive improvements over current `main` (registry-driven required metrics; mandatory payload hashes and retrieval-after-observation checks; explicit ETF fund-completeness/revision/finality gates; deterministic reporting-date ordering and malformed-latest-publication blocking). However, the PR's readiness implementation and metric-registry contract differ from `main`, and the old branch also carries broad workflow, API/Worker, archive and registry changes. Do not port runtime/registry changes without a separately reviewed compatibility plan and CI on the exact resulting head.
- The PR #83 candidate normalizer is older/smaller than current `main` and introduces a research-only two-source arithmetic-mean output; it must not replace the current-main normalizer. Review or port individual behaviors only after confirming they are absent from current `main` and covered by regression tests.
- No production writes, live source capture, source-priority change, scenario state/probability change, deployment, or merge occurred. BTC remains `not_evaluable`.


### PR #83 branch audit — additional file-by-file findings (2026-10-20)

- Compared the old-branch versions of `vps/shared/src/btc-scenario-readiness.ts`, `scripts/prepare-btc-observation-candidates.mjs`, `scripts/validate-crypto-registries.mjs`, and `data/CryptoDataModel/registry/metric-registry.json` with current `main`.
- Readiness gate: PR #83 has stricter hash requirements (hash must be present, not merely valid when supplied), registry-driven required metrics/freshness, and ETF completeness/revision/finality checks. Those are worthwhile behaviors to preserve, but the implementation depends on a different registry contract and differs materially from current main; do not copy the whole file or change runtime readiness until a small compatibility patch and exact-head tests exist.
- Observation candidate normalizer: current `main` is newer and contains additional session-date/freshness handling for ETF candidates. PR #83 is not a safe replacement. Any candidate-only behavior to retain must be ported as a targeted change against current main and remain review-only.
- PR #83 also introduces isolated offline ETF archive/verification and snapshot-diff/eligibility scripts, plus protocol-issuance calculation. These files are absent from current main; they are potential standalone transfers, not automatically production-ready. Before adding them, inspect their tests, package/workflow integration, path safety, and whether they require any files that are absent on main.
- Registry validator in PR #83 expects the new `scenario_readiness` contract and asserts no hard-coded runtime freshness thresholds. Current main instead checks that existing registry `freshness_window` values match runtime constants. This confirms the registry and runtime changes must be reviewed as one compatibility unit, not cherry-picked independently.
- Branch decision: no merge/rebase of PR #83. Next safe review target is the isolated offline scripts and their tests; only add a self-contained, tested subset to the current-main branch if dependencies and contracts are satisfied. No production data/state, source priority, deployment, or merge was changed. BTC remains `not_evaluable`.


### Follow-up verification and transfer decision (2026-10-20)

- GitHub Actions VPS API Build Rehearsal run `39492543987` completed with `success`. All listed steps passed, including VPS Worker/API builds, API response contracts, production Compose network boundary validation, PostgreSQL migration bootstrap, canonical BTC input registry, read-only provenance audit, idempotency/duplicate reconciliation, PostgreSQL backup/restore, API and Worker E2E, offline invariants, BTC evidence/snapshot lineage, persisted history/candle finalization, and admin boundary. This is a rehearsal/test result only; it does not authorize production writes/deployment and does not make BTC evaluable.
- Additional comparison found the old PR's standalone snapshot diff and protocol-issuance scripts overlap existing current-main tools (`scripts/compare-btc-etf-snapshots.mjs`, `scripts/btc-protocol-supply.mjs`) that are already wired into the staging workflow. A temporary transfer of duplicate legacy files was immediately reverted; the final branch does not contain those duplicates.
- Decision: no runtime or registry code from PR #83 is transferred yet. Its readiness checks are valuable but require a coordinated schema/contract change and regression coverage; its old candidate normalizer is superseded. Continue with current-main tools and real review-only API captures; inspect the existing ETF compare/parser test coverage for any narrow missing regression before changing code.
- Current branch comparison remains 0 commits behind `main`; PR #84 remains draft and mergeable. No merge/deploy/production mutation occurred. BTC remains `not_evaluable` pending fresh required observations and readiness acceptance.

## 2026-10-22 — обязательное правило приоритета ETF-источников

**Приоритет при расхождении дневных агрегированных потоков BTC spot ETF: Farside Investors.** Farside остаётся основным исследовательским источником: у него есть прозрачная таблица с итогом и разбивкой по фондам, исторические строки и проверяемый parser. SoSoValue используется для контрольной сверки, а TFTC — только как дополнительный контроль с учётом возможного пересечения lineage с Farside/SoSoValue.

- Если валидные значения за одну отчётную дату различаются, для исследовательского набора выбирать значение Farside; не усреднять значения и не спрашивать пользователя повторно.
- Сохранять само расхождение, дату отчётной сессии, время получения, идентичность/хэш снимка и доступные детали по фондам. Не пытаться автоматически «исправить» значения одного источника под другой.
- Если Farside недоступен, строка неполная, содержит dash/placeholder или не проходит проверку, **не переключаться молча на SoSoValue/TFTC**: оставить вход заблокированным до нового валидного снимка Farside.
- Это правило определяет выбор исследовательского значения, но само по себе не разрешает production ingestion. Временная семантика, свежесть последней завершённой US-сессии, revision/finality и условия долговременного хранения остаются отдельными воротами.
- Приоритет не отменяет проверок свежести относительно завершённой US-сессии, полноты строки, retrieval timestamp, происхождения, исправлений и повторяемости снимков. До прохождения этих ворот значение остаётся review-only.
- Это документированное исследовательское правило; оно само по себе не меняет runtime registry, production source priority, ingestion или состояние BTC-сценария.

## 2026-10-22 — текущий read-only BTC recapture

- Latest successful BTC Public Source Staging run #39499686294, attempt 4; artifact 12447343991, capture time 2026-10-22T18:07:06Z. The artifact explicitly confirms read-only staging with no production database access or production writes.
- Kraken XBT/USD latest trade was 81,004.30 USD/BTC at 2026-10-22T18:07:05.599Z; retrieval 18:07:06.955Z. It was fresh at capture, not a promise of freshness at a later scenario calculation.
- Fee window 972497–972640: 144 blocks, 303,418,820 sats (3.03418820 BTC) fees, 450 BTC subsidy, fee/subsidy ratio 0.674264%. Tip/boundary hashes were stable during capture. Compared with window 972485–972628, all 132 overlapping blocks had identical block hash, parent hash and per-block fees.
- При сравнении за 2026-10-21 SoSoValue сообщает +528.40023714 USDm, Farside показывает +524.8 USDm; по закреплённому правилу приоритета исследовательским значением является Farside (+524.8 USDm). Разница около 3.60023714 USDm сохраняется в аудите, не усредняется и не разрешает автоматически менять исходные значения. SoSoValue за 2026-10-20 (+23.16242251 USDm) и 2026-10-19 (+526.59599803 USDm) остаётся контрольной сверкой с округлёнными строками Farside.
- The latest Blockchain.com supply-chart point is 20,101,440.625 BTC at 2026-10-21T11:11:52Z. Protocol-scheduled maximum issuance at captured tip height 972640 calculates to 20,102,003.125 BTC, a difference of 562.5 BTC. These are not interchangeable metrics: keep provider-defined economic/circulating supply separate from protocol-scheduled issuance and do not blend them. The chart point is not a live tip observation.
- DXY remains optional and was blocked by the staging workflow's access-terms gate. BTC remains not_evaluable until required inputs pass readiness; no production ingestion, registry/runtime source-priority change, scenario evaluation, deployment or merge.


## 2026-10-23 — supply candidate metadata correction

The read-only capture now keeps total-issued-supply candidates separate from the canonical `monetary.circulating_supply` metric: Blockchain.com and the Mempool protocol calculation are marked as review candidates with no canonical `metric_id`; the proposed `monetary.protocol_issued_supply` is recorded separately and is not registered or production-approved. This avoids conflating total protocol issuance with economic circulating supply. The change is pending the current source-staging run and CI validation; no registry, seed, production observation, or runtime readiness rules were changed.


## 2026-10-23 — свежий read-only BTC source recapture

- BTC Public Source Staging run [#39921382976](https://github.com/olegsh247-stack/Crypto/actions/runs/39921382976) completed successfully; artifact 12487067719; capture started 2026-10-23T07:58:44Z. Manifest explicitly says read-only staging, no production database access/writes.
- Kraken XBT/USD: 81,449.40 USD/BTC observed 2026-10-23T07:58:43.968Z, retrieved 07:58:44.683Z. Fresh only at capture time; recheck before any calculation.
- Farside all-data page HTTP 200; page date 2026-10-23; latest reported session 2026-10-22, complete 12-fund row total -635.6 USDm. The separate Farside landing page returned HTTP 403; the all-data endpoint remains the captured candidate.
- Compared Farside baseline retrieved 2026-10-20T21:21:46.598Z to new snapshot retrieved 2026-10-23T07:58:54.536Z (58.62 h): 712 historical dated rows in baseline vs 714 in new; one overlapping row changed (2026-10-20 placeholder displayed as zero became reported +23.2 USDm), two rows were added (21 Oct +524.8 USDm, 22 Oct -635.6 USDm), no row removals in the overlapping date range. The prior placeholder is not a confirmed zero.
- SoSoValue aggregate for 2026-10-22 is -635.492639395 USDm; Farside displays -635.6 USDm. Difference is about 0.107361 USDm; retain both raw values and select Farside by the established priority rule. The difference is not averaged. SoSoValue 21 Oct +528.40023714 USDm still differs from Farside +524.8 USDm by about 3.600237 USDm.
- Fee window 972593–972736: 144 contiguous block rows, fees 260,209,124 sats (2.60209124 BTC), subsidy 450 BTC, ratio 0.5782425%. Against the previous window 972497–972640, all 48 overlapping heights have identical block hash, parent hash and per-block fees; current window tip and boundaries remained stable during capture. This is pairwise reorg-consistency evidence, not proof of finality or deployed API parity.
- Mempool protocol-issued supply at verified tip height 972736: 20,102,303.125 BTC, block timestamp 2026-10-23T07:54:35Z; old height 972640 candidate was 20,102,003.125 BTC (delta +300 BTC for 96 blocks). Blockchain.com chart remains at 20,101,440.625 BTC, last point 2026-10-21T11:11:52Z, now 862.5 BTC below the protocol issuance calculation; keep these as distinct metrics.
- The capture code now leaves both protocol-issued supply candidates without canonical `metric_id`, recording the proposed candidate ID separately; this avoids mislabelling total issuance as economic circulating supply. No registry/seed/runtime or production observation changes.
- DXY remains blocked by its access-terms gate and optional. BTC remains `not_evaluable` pending ETF session-aware freshness/finality/retention contract and remaining input acceptance checks.


## 2026-10-23 — follow-up capture after supply metadata correction

The follow-up read-only staging run [#39921752769](https://github.com/olegsh247-stack/Crypto/actions/runs/39921752769) succeeded; artifact 12486659972. It confirms the corrected manifest now carries `metric_id: null` and `candidate_metric_id: monetary.protocol_issued_supply` for both the Mempool-derived issuance and Blockchain.com total-issued-supply candidates. This is a candidate label only; no metric registry entry was created. Latest Kraken XBT/USD in this follow-up capture: 81,503.90 USD/BTC observed at 2026-10-23T08:01:43.812Z, retrieved at 08:01:45.702Z. Fee window, Farside latest session and supply tip matched the preceding capture. BTC remains review-only/not_evaluable.


## 2026-10-23 — ETF session-aware freshness contract formalized

Added [docs/BTC-ETF-SESSION-FRESHNESS-CONTRACT-2026-10-23.md](docs/BTC-ETF-SESSION-FRESHNESS-CONTRACT-2026-10-23.md). It separates ETF session date from exact observation/publication time, forbids substituting retrieval time/HTTP Date/midnight UTC for `observed_at`, records the Farside-first/no-silent-fallback rule, and defines the remaining acceptance gates: versioned US ETF session calendar and publication window, revision/finality treatment, and durable snapshot retention/restore. The current timestamp-based readiness gate is intentionally unchanged; ETF remains blocked and BTC remains `not_evaluable` until a tested session-aware policy exists. No runtime/registry/source-priority or production changes.

Latest CI on PR #84 head `b0b1d57edc4dd44de024f3275edad40c1897c2a2` completed successfully: BTC Scenario Readiness Gate, Source Catalog Contract Validation, VPS API Build Rehearsal, and Validate VPS Release Workflow. The readiness workflow's unit-test job explicitly passed the deterministic offline BTC fixture step. This confirms test reproducibility only, not current-data readiness.


## 2026-10-23 — следующий кандидат экономического circulating supply

Добавлен документ `docs/BTC-ECONOMIC-CIRCULATING-SUPPLY-CANDIDATE-2026-10-23.md`: CoinGecko `/coins/markets?vs_currency=usd&ids=bitcoin` выбран следующим кандидатом для реального read-only API теста, потому что предоставляет отдельное поле `circulating_supply` и публикует методологию supply для PoW-активов. На момент создания заметки это был план теста; позднее кандидат был захвачен в read-only staging. Фактические значения, hash и время получения записаны в следующем разделе этого документа. Ключевой вопрос — означает ли `last_updated` время обновления supply или всего market-data объекта; до доказательства семантики оно не принимается как `observed_at`. Никаких registry/seed/runtime/source-priority изменений нет. Официальные ссылки и проверочные шаги зафиксированы в документе кандидата.


## 2026-10-23 — CoinGecko supply API captured in read-only staging

- Added the CoinGecko candidate endpoint to the source catalog as `review_only` / `candidate_unregistered`, and added a bounded capture to `scripts/capture-btc-public-sources.mjs`. No canonical metric link was added: capture uses `metric_id: null`, `candidate_metric_id: monetary.circulating_supply`, and leaves `observed_at: null` until timestamp semantics are verified.
- BTC Public Source Staging [run #39922803413](https://github.com/olegsh247-stack/Crypto/actions/runs/39922803413), artifact 12487238469, succeeded in read-only mode. CoinGecko HTTP 200; circulating supply 20,102,221 BTC; total supply 20,102,234 BTC; max supply 21,000,000 BTC; provider `last_updated` 2026-10-23T08:08:54Z; retrieval 08:10:46.889Z; response SHA-256 `721d8f022a9c5444c4cb12b1274cecff064124ae9071b7aef14b8e5ef67aa379`. The parser checks basic numeric supply ordering. The manifest identity collision (provider `name` overwriting capture `name`) was fixed; latest artifact now preserves `coingecko-bitcoin-circulating-supply` as the capture name and `asset_name: Bitcoin` separately.
- Same capture's Mempool protocol-scheduled issuance: 20,102,312.5 BTC at height 972739, block time 08:06:59Z. It exceeds CoinGecko total supply by 78.5 BTC and circulating supply by 91.5 BTC. Blockchain.com chart is 20,101,440.625 BTC at 2026-10-21T11:11:52Z and is stale. Preserve these values as distinct methods; reconcile the gap (scheduled subsidy vs actually claimed issuance and provider methodology) rather than average/substitute.
- `last_updated` is not yet proven to be the supply field's own observation timestamp; the candidate remains review-only and the 48-hour freshness contract is not accepted. The existing `network.primary`/Bitcoin Core seed provenance mismatch remains open. No metric registry, SQL seed, runtime, production observation, or source priority was changed.


## 2026-10-23 — fee/subsidy re-capture and overlap comparison

The new read-only staging run [#39922803413](https://github.com/olegsh247-stack/Crypto/actions/runs/39922803413), artifact 12487238469, captured the 144-block fee window 972596–972739: 258,009,739 sats fees (2.58009739 BTC), 450 BTC protocol subsidy, ratio 0.573355%. Tip height/hash were stable during capture. Compared with the prior window 972593–972736 from run #39921752769, all 141 overlapping heights (972596–972736) matched block hash, parent hash and per-block fees; no overlap differences. Window JSON hashes are recorded in `docs/BTC-HASHRATE-FEE-SUBSIDY-ACCEPTANCE-2026-10-17.md`. This supports pairwise consistency but does not prove permanent finality or deployed API version parity. Fee/subsidy remains review-only.


## 2026-10-24 — календарь ETF-сессий и семантика времени CoinGecko

- Для календарной части ETF-контракта выбраны официальные календари NYSE Group/NYSE Arca и Nasdaq U.S. Equity Markets на 2026–2028 годы. В `docs/BTC-ETF-SESSION-FRESHNESS-CONTRACT-2026-10-23.md` зафиксированы источники, праздничные даты и ранние закрытия; раннее закрытие остаётся торговой сессией. Календарь определяет только дату сессии, но не публикационное время Farside. Публикационное окно пока не подтверждено, поэтому freshness gate не реализуется и не ослабляется.
- Уточнена CoinGecko timestamp-семантика: официальная схема описывает `last_updated` как время обновления market-data объекта, а не как доказанное время наблюдения supply. Исторический `circulating_supply_chart` документирован, но отмечен CoinGecko как endpoint семейства Enterprise-plan; доступность в текущем публичном плане не предполагается. Кандидат остаётся review-only.
- Исправлена историческая формулировка в supply-документе, которая после успешного захвата CoinGecko продолжала говорить, что ответа ещё нет. Фактические числа и hash сохранены без изменений.


## 2026-10-24 — versioned ETF calendar fixture added to read-only workflow

- Added `data/CryptoDataModel/calendars/us-etf-equity-session-calendar-2026-2028.json` with official NYSE Group/NYSE Arca and Nasdaq full-session holidays and published early closes. Early-close dates count as sessions; unscheduled closures fail closed. Fixture metadata explicitly says upstream raw-payload hashes are not yet captured and that the calendar is not wired into runtime readiness.
- Added `scripts/validate-us-etf-session-calendar.mjs` to check schema/version, source URLs, date validity, duplicate dates, weekday-only holiday/early-close dates, no overlap between full closures and early closes, and the rule that early closes remain sessions.
- Wired the validator and fixture into `.github/workflows/btc-public-source-staging.yml`. This workflow-file change also triggers a fresh read-only public-source capture, so the next artifact can refresh BTC spot, ETF, supply and fee evidence using the current code. The new run was queued as #40103950724 at the last check; final capture and test status still pending.
- This calendar fixture does not define Farside's publication window and is not used to pass readiness. ETF and BTC remain blocked until publication semantics, upstream hashes, revision/finality, and durable retention/restore are resolved.


## 2026-10-24 — fresh BTC capture and ETF partial-row blocker

Read-only staging run [#40103950724](https://github.com/olegsh247-stack/Crypto/actions/runs/40103950724) completed successfully, artifact 12563807727. All source-capture tests and the new ETF calendar validator passed. Manifest confirms no production DB access/writes.

- Kraken XBT/USD: **80,123.20 USD/BTC**, observed at `2026-10-24T14:45:57.375Z`, retrieved at `14:45:59.579Z`, raw response SHA-256 `37cb0fbdc05ee5744a46458f7fd7c2201ffc5c3b03f3c61a148ebfddb41f4f5b`. Binance main endpoint remains HTTP 451; Binance market-data-only endpoint HTTP 200 but is BTC/USDT; OKX BTC-USDT HTTP 200; Bybit HTTP 403. These USDT quotes are cross-checks only and are not blended with Kraken USD.
- Farside all-data endpoint HTTP 200, generated date 2026-10-24, raw response SHA-256 `0d9c31742ed7eb5bfed9bae07a9be17d3a23b49e27edc2afaf412cff5be23b2d`. Latest complete session remains 22 Oct **-635.6 USDm**. A new 23 Oct row is present with displayed total **-137.9 USDm**, but HODL is null. The known fields happen to sum to -137.9, but the 12-fund total cannot be reconciled with one missing fund value. SoSoValue and TFTC are only updated through 22 Oct. Do not accept the partial row or silently fall back; ETF and BTC readiness remain blocked.
- CoinGecko HTTP 200: circulating **20,102,809 BTC**, total **20,102,871 BTC**, max **21,000,000 BTC**, raw response SHA-256 `5ec3caa54e124381db673ef244e336a3469d20ffa750ceeeb293513ecdce770b`, retrieved `14:46:07.221Z`, `last_updated=14:44:58Z`. Mempool protocol-scheduled issuance **20,102,921.875 BTC** at height **972934**, block time 14:41:03Z. Protocol-scheduled issuance is 50.875 BTC above CoinGecko total supply and 112.875 BTC above circulating supply. Blockchain.com chart remains 20,101,440.625 BTC at 21 Oct and is stale. The gap remains unexplained; preserve separate series and do not average/substitute. CoinGecko `last_updated` is not accepted as supply `observed_at`.
- Fees: 144 contiguous blocks, heights **972791–972934**; fees **202,056,851 sats / 2.02056851 BTC**, subsidy **450 BTC**, ratio **0.449015%**. Independently checked all 144 parent links and sum of per-block fees; zero continuity errors and aggregate matched. Tip and boundary hashes stable before/after at height 972934. Window JSON SHA-256 `e897c849cb22dc5a2b5cd92b52213a1deee113ef4af3d2336283b34eac949f7a`. Previous window ended at 972739, so no overlap comparison is claimed. Fee remains review-only pending reorg/finality and deployed API-version parity.
- Calendar fixture and validator passed in the same run. Exact upstream calendar payload hashes and Farside publication-window semantics remain open. No readiness policy, registry, seed, runtime, production observation, or scenario state changed.


## 2026-10-24 15:10 UTC — повторный read-only BTC capture и проверка перекрытия блоков

Повторно запущен job `capture` существующего BTC Public Source Staging run #40103950724; повторный захват завершился успешно, новый artifact **12564682048** (SHA-256 архива `938e11c3ca4a0786543ed27784e157273e36ce27f124371c327b857d1a9b0ac5`). Manifest: `read-only-staging-only`, production DB не использовалась, production writes отсутствуют.

- **Комиссии / реорганизация:** новое окно 972796–972939, 144 блока; fees **200,015,244 sats**, subsidy **45,000,000,000 sats (450 BTC)**, ratio **0.44447832%**. Сравнили с предыдущим окном 972791–972934: пересекаются **139 блоков (972796–972934)**; все block hash, parent hash и per-block fees совпали (**0 различий**). Tip до/после стабилен на 972939. SHA-256 нового JSON: `284fa965027b39e1ff8b8ffd3b7cc9f94500bc487d8d65311ea9659fbefe25a5`. Это закрывает pairwise overlap check для этой пары, но не доказывает вечную финальность и не подтверждает deployed API-version parity; metric остаётся review-only.
- **Spot:** Kraken XBT/USD **79,703.10 USD/BTC**, trade observation `2026-10-24T15:09:57.321Z`, retrieval `15:09:57.722Z`, payload SHA-256 `989acceed442865d5f0f70d9ccc3a8103d0459bd70c138c673222fadb18e59e9`. BTC/USDT quotes остаются только cross-check и не смешиваются с USD.
- **ETF:** Farside all-data payload обновлён (SHA-256 `9727806f6b7dc287234082b329bcfca820d2c54db8736c6c5d012ad228fa890f`), но строка **23 Oct** по-прежнему неполная: displayed total **−137.9 USDm**, HODL value отсутствует, aggregate reconciliation = `INCOMPLETE`. Последняя полная строка — **22 Oct −635.6 USDm**; SoSoValue и TFTC по-прежнему обновлены только по 22 Oct. Не принимать 23 Oct, не подставлять ноль и не делать fallback. Publication/observation time и provider revision/finality неизвестны.
- **Supply:** CoinGecko снова HTTP 200: circulating **20,102,809 BTC**, total **20,102,871 BTC**, max **21,000,000 BTC**, `last_updated=2026-10-24T15:08:57Z`; payload SHA-256 `acf0bc881526e8cb48199dc3439aca50ce8bbd2f7b4e3eb330dc77fd9b8e0b7b`. Mempool protocol-scheduled issuance **20,102,937.5 BTC** на height **972939**. Gap теперь **66.5 BTC** к CoinGecko total и **128.5 BTC** к circulating. Значения и методы сохраняются отдельно; причина gap и supply-specific timestamp не подтверждены.
- Capture/tests прошли успешно. BTC остаётся `not_evaluable`; нет ingestion, production DB writes, registry/seed/runtime changes, scenario-state/probability changes, deployment или merge.


## 2026-10-24 — принято правило для расхождения supply: Mempool protocol issuance

- Решение пользователя: если значения CoinGecko и Mempool расходятся, **основой для протокольной эмиссии BTC считаем Mempool**. Не усреднять значения и не подменять ими друг друга.
- На capture height **972939** Mempool protocol-scheduled issuance = **20,102,937.5 BTC**. CoinGecko сообщает total supply **20,102,871 BTC** и circulating supply **20,102,809 BTC**. Разницы: **66.5 BTC** к CoinGecko total и **128.5 BTC** к circulating.
- Это решение фиксирует приоритет для метрики **protocol-issued/scheduled supply**, а не утверждает, что Mempool заменяет экономическую метрику circulating supply. CoinGecko остаётся отдельным review-only кандидатом на economic circulating supply; last_updated не подтверждён как supply-specific observation timestamp.
- Протокольная эмиссия пока не допущена в production: candidate ID monetary.protocol_issued_supply остаётся незарегистрированным/неутверждённым. Нужны дальнейшая проверка вычисления и acceptance/provenance; readiness не ослабляется.


## 2026-10-24 — повторный read-only BTC capture и проверка ETF incomplete-row regression

- BTC Public Source Staging [run #40107313213](https://github.com/olegsh247-stack/Crypto/actions/runs/40107313213), artifact **12565600908**, завершился успешно. Архив SHA-256 `e0eee123c2e361696df3a9da444f269a3224fbabf4fd404055d123cd73502e34`; manifest: read-only staging, production DB access/writes = false.
- Kraken XBT/USD: **79,308.30 USD/BTC**, trade observation `2026-10-24T15:30:55.481Z`, retrieval `15:30:56.565Z`, payload SHA-256 `aab5ba1eef7455d03dbe4c2f8a05409bfd567f61b3917b17d6e8d322af596820`.
- Fee window **972797–972940**, 144 blocks, fees **197,993,884 sats**, subsidy **450 BTC**, fee/subsidy ratio **0.4399864089%**. Compared with previous window 972796–972939, **143 overlapping blocks** (972797–972939) matched by block hash, parent hash and per-block fees; **0 differences**. Tip stable at 972940. Fee JSON SHA-256 `e1063c76e96f45caa804865af70106ea94237a7ff06e8b2ac8933bcb516d362b`. This is pairwise consistency evidence, not permanent finality or deployed API parity.
- Supply: Mempool tip height **972940**, block hash `00000000000000000000a1b61ecc31c0fb0b0814aa3b1174c4b398f741deb2e0`, block timestamp `2026-10-24T15:19:01Z`; protocol-scheduled issuance **20,102,940.625 BTC**. CoinGecko reports circulating **20,102,809 BTC**, total **20,102,878 BTC** (`last_updated=2026-10-24T15:29:49Z`, generic market-data timestamp). Difference is **62.625 BTC** to total and **131.625 BTC** to circulating. Per user's decision, Mempool is the basis for protocol issuance; economic circulating supply remains a separate metric. No averaging/substitution; protocol-issued candidate remains unregistered/unapproved.
- Farside all-data HTTP 200, payload SHA-256 `40e211b691f06495f3a34cd290252b829b030687075a21c7b9ec43c044fff41e`. Latest complete session remains **22 Oct −635.6 USDm**; **23 Oct −137.9 USDm** still misses HODL, aggregate reconciliation `INCOMPLETE`. SoSoValue/TFTC snapshots are still through 22 Oct. No zero inference/fallback; provider publication timestamp/revision/finality remain unresolved.
- Added regression test `keeps a partially missing fund field incomplete even when the remaining fields equal the displayed total`: it verifies missing HODL remains null and a partial sum equal to −137.9 does not become a complete/reconciled row. Commit `f147699b21c0d6194ba9c56fccd115b0edaeb31c`. Source capture, source-catalog validation, BTC readiness gate, release workflow validation, and VPS API Build Rehearsal passed on this head. This does not clear the live-data readiness blockers.
- No production DB access/writes, ingestion, registry/seed/runtime changes, scenario state/probability changes, deployment, or merge. BTC remains `not_evaluable`.


## 2026-10-24 — ETF timing/revision semantics: public-source review

**Scope:** read-only review of Farside's own description and the TFTC methodology/changelog; no new live capture, credentials, DB access, or source/runtime changes.

**Evidence:**
- Farside's official page describes the table as daily US spot Bitcoin ETF flows in USD millions, updated in real time, with updates typically in the evening/night US time: https://farside.co.uk/ . This is a broad update window, **not** a per-row publication timestamp or a finality guarantee.
- Farside's own public explanation says its backend polls multiple sources each minute, processes them, calculates an implied flow in USD, and pushes values to the live table: https://www.linkedin.com/posts/farsideinvestors_farside-investors-has-produced-a-bitcoin-activity-7159188203738906624-iOG1 . Therefore the published value should not be represented as a timestamped issuer-confirmed final observation without additional evidence.
- TFTC methodology says daily aggregates and ongoing per-fund flows are sourced from SoSoValue, while Farside is used for archived per-fund history only through mid-July 2026; it also states that SoSoValue revisions flow into later syncs automatically: https://www.tftc.io/bitcoin-etf-flows/methodology . TFTC is consequently not independent confirmation of current Farside values and is only a diagnostic cross-check here.
- Current capture still has Farside 2026-10-23 displayed aggregate −137.9 USDm but HODL missing; row stays INCOMPLETE. Latest fully reconciled session is 2026-10-22 at −635.6 USDm. HTTP retrieval time and HTTP Date are not substitutes for provider publication time.

**Contract decision:** retain Farside as the chosen priority source; retain SoSoValue and TFTC only as cross-checks, never average values. Store session_date separately from retrieved_at. Until a source-level publication timestamp and a documented revision/finality marker are actually exposed, set provider_published_at=null and finality/revision_status=UNKNOWN; keep raw payload hash and retrieval time as provenance only. Treat any later change to a historical row as a revision detected by comparing immutable snapshots (session date + fund/aggregate values + raw hash); do not overwrite earlier evidence. A complete daily total requires every expected fund field to be explicitly reported and the fund sum to reconcile with the displayed aggregate within the parser's stated rounding tolerance. Missing is not zero.

**Disposition:** this review narrows the blocker but does not clear it: Farside's public documentation does not establish an authoritative per-row publication time or a formal finality/revision contract. ETF remains not accepted for canonical/production ingestion; BTC remains not_evaluable. No runtime/registry/DB/scenario changes, ingestion, deployment, or merge.


## 2026-10-24 — Farside repeat-snapshot revision comparison (>24h)

**Snapshots compared (read-only artifacts):**
- Older capture: `btc-public-source-review-2026-10-23-final.zip`; capture time `2026-10-23T08:01:55.335Z`; Farside raw payload SHA-256 `a96032a3d9f4c881201ecc79654210afa6a992faa76937e9562eabcffa102f57`; archive SHA-256 `c204535e252842ec037abd3ca46ebf7bab60f30ef9713f49c92512fbe4debefb`.
- Newer capture: `btc-public-source-review-2026-10-24-next.zip`; capture time `2026-10-24T15:31:08.713Z`; Farside raw payload SHA-256 `40e211b691f06495f3a34cd290252b829b030687075a21c7b9ec43c044fff41e`; archive SHA-256 `e0eee123c2e361696df3a9da444f269a3224fbabf4fd404055d123cd73502e34`.
- Interval **31.487 hours**, so the minimum 24-hour gate passes. There are **13 overlapping reporting dates** (2026-10-06 through 2026-10-22); all 13 parsed row signatures are unchanged. No historical row revision was detected in the overlap. New capture adds 2026-10-23 and no longer includes 2026-10-05 due to the rolling 14-row window.
- Raw payload hashes differ, as expected when the table/page changes; payload change alone is not evidence of a historical row revision.

**Disposition:** this is a successful two-snapshot, >24h comparison for the 13 shared dates, not proof that Farside rows are final forever or that provider publication timestamps exist. The 2026-10-23 row remains incomplete (HODL missing), so it is not accepted as a complete daily fund panel. Preserve both immutable artifacts/hashes; never overwrite old evidence. No production DB access/writes, ingestion, registry/runtime/scenario changes, deployment, or merge. BTC remains `not_evaluable`.


## 2026-10-24 20:28 UTC — повторный read-only BTC capture и сравнение fee-window overlap

BTC Public Source Staging [run #40107313213, attempt 2](https://github.com/olegsh247-stack/Crypto/actions/runs/40107313213) успешно завершился; artifact **12574657927**. Архив SHA-256: `af34b85f7f7de7d99b932f4a30ab5f9e994c4be98d5b1040efbd0d6c51c45dfb`. Manifest подтверждает `read-only-staging-only`, production DB access = false и production writes = false. Все capture, parser, calendar, fee-window и candidate-preparation шаги прошли.

- **Spot:** Kraken XBT/USD **80,454.80 USD/BTC**; trade observation `2026-10-24T20:28:16.209Z`, retrieval `20:28:17.616Z`, response SHA-256 `d52982b74f598f711665918c0f41b6827e6028183f8035c7b42850b057c3139e`. Binance primary по-прежнему HTTP 451; Binance market-data-only и OKX доступны только как BTC/USDT cross-checks, не смешивать с USD. Bybit по-прежнему HTTP 403.
- **ETF:** Farside all-data HTTP 200, page generated date 2026-10-24, payload SHA-256 `368a6a8c9e1c4ebf68de93921057512588f9ea855ccddff3b9923b01e0528efd`. Строка 2026-10-23 всё ещё показывает `-137.9 USDm`, но HODL = null; статус `INCOMPLETE`, не принимать и не считать missing нулём. SoSoValue API успешно отвечает HTTP 200 (raw SHA-256 `d3666d105e0eb460996b11437c62d9d974f94cc3e578a63338876b06c981ff8b`), но последняя дата в нём всё ещё **2026-10-22**; TFTC также не подтверждает полную строку 23 Oct. Farside остаётся приоритетом, SoSoValue/TFTC — только cross-check; не усреднять и не делать fallback.
- **Protocol supply:** Mempool tip height **972970**, hash `00000000000000000000f641a993b3f589150f30bc15f155d33d86c7448979b3`, block timestamp `2026-10-24T20:26:44Z`; protocol-scheduled issuance **20,103,034.375 BTC**, payload SHA-256 `4f2d7d7e3aa2d10a6a17ddb784e79a58ff8c308eab08b86b652a66518f6d71b6`. CoinGecko HTTP 200 сообщает circulating **20,102,953 BTC**, total **20,103,015 BTC**, max **21,000,000 BTC**, `last_updated=2026-10-24T20:26:48Z`, raw SHA-256 `5398f4f0c88d49d6540768e5007db95563a75253a858f8bba5483ead66ba3fe6`. Mempool выше CoinGecko total на **19.375 BTC** и circulating на **81.375 BTC**. По принятому решению Mempool — основа только для protocol-issued/scheduled supply; CoinGecko circulating остаётся отдельной economic метрикой, а `last_updated` не принят как supply-specific `observed_at`.
- **Fees/subsidy:** новое окно **972827–972970**, 144 блока; fees **204,356,274 sats = 2.04356274 BTC**, subsidy **450 BTC**, ratio **0.4541250533%**. Сравнили с предыдущим окном **972797–972940**: **114 общих блоков (972827–972940)** совпали по block hash, parent hash и per-block fees; **0 различий**. Tip до/после захвата стабилен на 972970. JSON SHA-256 `758da0a6abcd29324c8eec5ae04e6aa5c1733d4a61ca75a15e3944f648fd35d5`. Это усиливает pairwise consistency, но не доказывает вечную finality или parity с deployed API.

**Disposition:** свежие данные получены, fee overlap проверен, но ETF остаётся неполным и supply timestamp/семантика экономического circulating supply не приняты. BTC остаётся `not_evaluable`; ни production DB, ingestion, registry/seed/runtime, scenario state/probability, deployment, ни merge не менялись. Сохранить артефакт и hashes как отдельное evidence; не менять прежние снимки.


## 2026-10-24 — cross-source check for the incomplete 2026-10-23 ETF row

Inspected the raw response bodies in read-only staging artifact **12574657927** (run #40107313213, attempt 2); no new source call or production access was needed for this comparison.

- **Farside all-data** is current through 2026-10-23 and reports aggregate **−137.9 USDm**, but at least one fund value (HODL) is missing; parser correctly returns `fund_values_complete=false` / reconciliation `INCOMPLETE`. The separate Farside `/btc/` page returned HTTP 403; the all-data page is the captured endpoint used for the panel.
- **CryptoETF.today** returns aggregate `netFlowUsdM=-137.9` for 2026-10-23, matching Farside only at displayed 0.1 USDm precision. It exposes aggregate daily flow only in this response, not the missing per-fund HODL value; it therefore cannot repair or independently reconcile the panel. Its 2026-10-24 value is 0, which is treated as a future/unreported placeholder, not an observed zero flow.
- **SoSoValue** latest row is 2026-10-22 (−635,492,639.395 USD); it does not yet cover 2026-10-23.
- **TFTC** metadata says `updatedThrough=2026-10-22` and `dateModified=2026-10-22T22:00:00Z`; latest day is 2026-10-22. It also does not confirm 2026-10-23.

**Decision:** no ETF source supplies independent, complete per-fund evidence for 23 Oct. Keep Farside as the priority source; SoSoValue/TFTC/CryptoETF.today remain cross-checks. Do not fill HODL with zero, do not infer missing values from an aggregate, do not average sources, and do not promote 23 Oct to a complete daily observation. The last complete, reconciled date remains 2026-10-22. Continue with the next required BTC input-quality blocker; no production ingestion or runtime change.


## 2026-10-24 — read-only artifact retrieval/restore integrity check

Independently re-downloaded the two GitHub Actions artifacts via their artifact IDs and tested extraction and raw-body integrity locally:

| Artifact | Retrieval time in manifest | Archive bytes | Archive SHA-256 | Raw payload hashes checked | Mismatches |
|---|---|---:|---|---:|---:|
| Prior snapshot, artifact 12565600908 | 2026-10-24T15:30:56.565Z | 232,848 | `e0eee123c2e361696df3a9da444f269a3224fbabf4fd404055d123cd73502e34` | 16 | 0 |
| New snapshot, artifact 12574657927 | 2026-10-24T20:28:17.616Z | 234,556 | `af34b85f7f7de7d99b932f4a30ab5f9e994c4be98d5b1040efbd0d6c51c45dfb` | 16 | 0 |

Both ZIP integrity checks passed; each archive contains 19 files, 17 manifest source entries, and manifest mode `read-only-staging-only` with `production_database_accessed=false` and `production_writes_performed=false`. All 16 available raw payload hashes matched their manifest values in both archives. This proves that these artifacts can currently be independently retrieved and restored without raw-body corruption.

**Boundary:** GitHub Actions artifact retention is only 7 days, so this is a successful short-term retrieval/restore rehearsal, **not** proof of durable archival, long-term retention, or backup outside GitHub Actions. The durable retention/recovery gate remains open until the future self-hosted environment and its backup/restore procedure exist and are tested. Do not change production or runtime state.


## 2026-10-25 07:53 UTC — fresh BTC source capture and fee-window overlap

Read-only staging was rerun via [BTC Public Source Staging #40107313213, attempt 3](https://github.com/olegsh247-stack/Crypto/actions/runs/40107313213), successful. Artifact ID **12591299886**, archive SHA-256 `a49a52197dc68708ae15a406305bbafa329bd2436b0e001c56424d05458ad76c`. Manifest: `read-only-staging-only`; production database accessed = false, production writes = false.

- **Spot:** Kraken XBT/USD **80,594.80 USD/BTC**, source trade time `2026-10-25T07:52:51.193Z`, retrieved `07:52:51.438Z`, payload SHA-256 `f94a5326626140ab18a6655c55b15e5a93e6183c82790341a2097fe4c41d5ca7`. Binance primary remains HTTP 451; market-data-only Binance and OKX are BTC/USDT cross-checks only; Bybit HTTP 403. Do not equate USDT with USD.
- **ETF:** Farside all-data page HTTP 200, retrieved `07:53:01.410Z`, payload SHA-256 `277d557b576239cd0e8340b6cec9b680d848db8ea859546872477035767ebaef`. The 2026-10-23 total remains **−137.9 USDm**, but HODL is shown as `-`; fund sum remains null and reconciliation status `INCOMPLETE`. Do not treat dash/missing as zero. SoSoValue HTTP 200 still ends at **2026-10-22** (payload SHA `7d81728ebe0bd4e0f21b9cfeae0bc7bfc1fe68b50c31b95fb13b182eb302ffd7`). CryptoETF.today returns 23 Oct −137.9 and 24 Oct 0, but this does not complete the missing Farside fund cell or prove independent row finality. Farside remains priority; SoSoValue/TFTC/CryptoETF.today are cross-checks only, no averaging or fallback.
- **Protocol issuance:** Mempool tip **973037**, block hash `00000000000000000000451e69200db693df2f17639f28b979cfef7a1c949556`; protocol-scheduled issuance **20,103,243.75 BTC**; capture `07:52:59.462Z`, raw response SHA-256 `fcf5fc42a3b8070701e3b2310106e12f2061f49605903db8c8d469b4d14e5e46`. CoinGecko reports circulating **20,103,187 BTC** and total **20,103,187 BTC**, provider `last_updated=2026-10-25T07:51:47Z`, raw SHA-256 `c322ce265dec23580a876ca52e8b50aea95de4e5e5529ba9ff35b8244c46afcd`. Mempool issuance is **56.75 BTC** above CoinGecko total/circulating. Keep protocol issuance and economic circulating supply separate; CoinGecko timestamp semantics remain unaccepted for a supply observation.
- **Fees/subsidy:** new 144-block window **972894–973037**; total fees **193,815,563 sats = 1.93815563 BTC**, subsidy **450 BTC**, fee/subsidy ratio **0.4307012511%**. Compared with the previous window 972827–972970, the **77 overlapping blocks** (972894–972970) match block hash, parent hash, and per-block fees; **0 differences**. Tip before/after remained 973037 with the same hash. The full fee evidence is retained in artifact 12591299886.
- **Access:** direct Farside /btc page returned HTTP 403 challenge; the all-data page still returned 200 and is the parsed evidence. Yahoo DXY was not requested; remains optional and excluded from BTC blocking requirements.

**Disposition:** fresh evidence captured and cross-window checks passed, but the ETF row is still incomplete and economic-supply timestamp semantics remain unaccepted. BTC remains `not_evaluable`; no production DB, ingestion, registry/runtime/scenario-state/probability changes, deployment, or merge.


## 2026-10-26 — расширен реестр публичных ETF flow и holdings источников

- Зарегистрированы как **кандидаты для исследования/cross-check**, без добавления в активный `metric-registry.json`/source priority: CryptoETF.today (`institutional.cryptoetf_today`), CoinPulseHQ (`institutional.coinpulse`), Bitcoin Almanack (`institutional.bitcoin_almanack`), BitTradeScanner (`institutional.bittradescanner`), Bitbo (`holdings.bitbo`) и BitcoinTreasuries.net (`holdings.bitcointreasuries`).
- Farside остаётся приоритетным исследовательским источником flows; SoSoValue и TFTC — сверка. CryptoETF.today, CoinPulseHQ и BitTradeScanner — дополнительные cross-check; Bitcoin Almanack — проверка статуса сессии. Bitbo и BitcoinTreasuries.net — только holdings, отдельно от flows.
- Уточнено: включение источника в реестр не подтверждает качество, полноту, права повторного использования, timestamp/revision/finality или пригодность для production. Не усреднять источники; не считать пропуски нулями; не подменять flows значениями holdings.
- Добавлен единый рабочий промт `docs/SOURCE-REGISTRY-PROMPT.md`; следующий шаг — проверить source-catalog validation на exact head, затем продолжить BTC review-only capture/входы по Плану 100.
- Без изменений runtime, metric source priority, production DB/ingestion, readiness или состояния/вероятностей сценария. BTC остаётся `not_evaluable`.


### 2026-10-26 — seed parity corrected after source-catalog CI finding

- Initial Source Catalog Contract Validation and BTC registry/readiness workflow failed because the six newly registered ETF flow/holdings candidates were not yet present in `infrastructure/postgres/seed-v1.sql`. This was a repository seed/contract mismatch; no database was touched.
- Added the same six candidate source IDs to the versioned PostgreSQL seed. Manual parity check against the current branch now finds 22 source-registry IDs and 22 seeded IDs, with no missing IDs, extra seed IDs, or duplicate IDs; the catalog has 40 unique endpoint IDs. The six new source IDs are absent from every active metric `source_priority`.
- **Exact-head CI after the seed fix is not confirmed:** the available workflow-run lookup returned no runs for the corrected head, and local clone/testing was unavailable. Do not report the earlier failed run as passed or claim the validator rerun succeeded.
- No production DB write, live ingestion, runtime/readiness or metric-priority change, scenario state/probability change, deployment, or merge. BTC remains `not_evaluable`.


## 2026-10-26 — решение пользователя: fallback источников и практическая свежесть BTC

- Пользователь разрешил заменять недоступные, устаревшие или неполные значения данными новых зарегистрированных источников того же показателя. Farside больше не единственный допустимый источник ETF flows: SoSoValue, CryptoETF.today, CoinPulseHQ, BitTradeScanner и TFTC могут быть fallback для той же сессии при явном числе, корректных единицах и provenance. Bitcoin Almanack — только статус сессии; Bitbo/BitcoinTreasuries — holdings, не flows.
- Для BTC spot readiness окно увеличено с 1 до 6 часов. Перед реальным запуском сценария котировку нужно обновлять; BTC/USD и BTC/USDT не смешивать.
- ETF readiness выбирает самую новую доступную сессию и допускает fallback на пригодную запись той же сессии. Явно неполная панель не выбирается поверх пригодной альтернативы. Не считать пропуск нулём, не усреднять и не откатываться молча на старую сессию.
- Код readiness и регрессионные тесты изменены; CI на итоговом head ещё не подтверждён. BTC не объявлять evaluable до проверки.
- Не менялись production source priority, ingestion/DB, scenario state/probabilities, deployment или merge.


## 2026-10-26 — offline BTC readiness впервые проходит на свежем capture

**Read-only capture:** [BTC Public Source Staging run #40388837927](https://github.com/olegsh247-stack/Crypto/actions/runs/40388837927), artifact **12682068022**, capture time **2026-10-26T19:41:02.631Z**, archive SHA-256 `269e689b2ee2171cb00daa0a3aa2daf265744df121c56ac130e13b54457d1412`. Manifest подтверждает `read-only-staging-only`, production DB access = false, production writes = false.

- **BTC spot:** Kraken XBT/USD **79,900.90 USD/BTC**; trade observation `2026-10-26T19:40:59.182Z`, retrieval `19:41:02.631Z`, raw response SHA-256 `22f311f8f966ae4a42fff5106f31e5ea044ef379c6b752fe2e3c140ab042f9fd`. Для readiness принят шестичасовой предел; фактический снимок был получен за секунды до оценки.
- **ETF flows:** Farside all-data row за **2026-10-23** теперь полностью числовой: IBIT −110.3, FBTC −31.8, MSBT +4.2, остальные перечисленные фонды — явно опубликованные нули; сумма **−137.9 USDm**, `fund_values_complete=true`, `MATCHES_DISPLAY_ROUNDING`. Строка 26 Oct — `UNREPORTED_PLACEHOLDER`, не считается нулём и не подменяет последнюю опубликованную сессию.
- **Fallback cross-check:** SoSoValue за 23 Oct **−137.93636481 USDm**, CryptoETF.today **−137.9 USDm**. Значения согласуются с Farside на показанной точности; источники не усреднялись. TFTC остаётся вспомогательным зеркалом с известной зависимостью от SoSoValue.
- **Session handling:** выходные/рыночные не-сессии из aggregate tracker не засчитываются как нулевые ETF flows. Readiness выбрал семь последних подтверждённых сессий (23, 22, 21, 20, 19, 16, 15 Oct); выходные не попали в selected inputs.
- **Actual offline result:** `scripts/evaluate-btc-review-capture.mjs` вернул `ready_for_rule_evaluation`, blockers = `[]`, selected inputs = `market.spot_price` и `institutional.etf_net_flow`. ETF provider publication timestamp остаётся неизвестным (`observed_at=null`); для research readiness используется недавнее время получения вместе с явной reporting date, без выдумывания provider timestamp.
- **CI on this head:** BTC Scenario Readiness Gate [#40388841506](https://github.com/olegsh247-stack/Crypto/actions/runs/40388841506), Source Catalog Contract Validation [#40388841517](https://github.com/olegsh247-stack/Crypto/actions/runs/40388841517), VPS API Build Rehearsal [#40388841410](https://github.com/olegsh247-stack/Crypto/actions/runs/40388841410), Seed idempotency [#40388841444](https://github.com/olegsh247-stack/Crypto/actions/runs/40388841444), release workflow validation [#40388841511](https://github.com/olegsh247-stack/Crypto/actions/runs/40388841511) and review-only capture [#40388837927](https://github.com/olegsh247-stack/Crypto/actions/runs/40388837927) passed on code head `2feff18655d6314d4d9669635cc0468b254095c8`.

**Disposition:** the fresh review-only inputs now pass the readiness gate and are ready for rule evaluation. This does **not** mean scenario direction/probabilities were evaluated, that a scenario state was persisted, or that production ingestion was approved. No production DB writes, runtime source-priority change, deployment, or merge.

## 2026-10-27 — BTC Rule v1 offline scenario completed

**Decision/status:** The single-asset BTC review-only scenario is complete for the current Rule v1 research scope. Do not keep it open merely because production ETF-ingestion acceptance and future self-hosted operations are separate workstreams.

**Fresh read-only capture:** BTC Public Source Staging [run #40465835072](https://github.com/olegsh247-stack/Crypto/actions/runs/40465835072), artifact **12715849495**, captured at `2026-10-27T07:14:12.101Z`. Latest Kraken XBT/USD trade was **79,487 USD/BTC** at `2026-10-27T07:14:08.537Z`; raw trade response SHA-256 `0a103e9a55e46ef4d3b3c1430b56841cfea75625892159eb6c9ea1afe641f592`. The seven-day closed-hourly-candle return was **−2.670356%**, using closes **81,708.20** and **79,526.30 USD/BTC** exactly 604,800 seconds apart.

**ETF input:** Farside remains the primary research source. The five latest distinct sessions used were 20 Oct **+23.2m**, 21 Oct **+524.8m**, 22 Oct **−635.6m**, 23 Oct **−137.9m**, and 26 Oct **+110.3m USD**; sum **−115.2m USD**. The captured all-data page includes numeric per-fund values for 23 Oct; do not carry forward the older 24 Oct note that treated HODL as missing. Raw Farside payload SHA-256 `48438a5f1b0326d783695aa4da11270eef73a4d106781471301d81b455b61d74`. Provider publication timestamp and provider-declared finality/revision semantics remain unknown.

**Rule output:** BTC price score **0**; ETF score **0**; directional score **0**; scenario **`base`**; confidence **low**. The input readiness assessment returned **`ready_for_rule_evaluation` with zero blockers**. Recalculating the same captured inputs produced a byte-identical report. This is a completed offline/review-only evaluation, not a trade recommendation and not a published/persisted scenario state.

**Exact-head CI:** on code SHA `ad90cd781537484167f70a33562899a12df5ef94`, BTC Public Source Staging [#40465835072](https://github.com/olegsh247-stack/Crypto/actions/runs/40465835072), BTC Scenario Readiness Gate [#40465836705](https://github.com/olegsh247-stack/Crypto/actions/runs/40465836705), Source Catalog Contract Validation [#40465836776](https://github.com/olegsh247-stack/Crypto/actions/runs/40465836776), VPS API Build Rehearsal [#40465836700](https://github.com/olegsh247-stack/Crypto/actions/runs/40465836700), seed idempotency rehearsal [#40465836741](https://github.com/olegsh247-stack/Crypto/actions/runs/40465836741), and VPS release-workflow validation [#40465836713](https://github.com/olegsh247-stack/Crypto/actions/runs/40465836713) all passed.

**Only remaining BTC-related acceptance outside this completed offline scope:** before production ingestion, define/test the ETF provider timestamp and revision/finality policy, plus durable retention/restore on the future self-hosted infrastructure. DXY is optional. Hashrate, fee/subsidy ratio, circulating supply and protocol-issued supply are not required by Rule v1 and must not be used to hold this base scenario open. Product Contour/API/Web/Evidence end-to-end acceptance remains a separate Plan 100 stage.

**Safety:** no production database access/writes, live ingestion, source-priority or runtime change, scenario-state/probability/monitoring persistence, deployment, or merge. PR #84 remains open/draft pending explicit approval.



## 2026-10-27 08:05 UTC — latest BTC recapture supersedes earlier spot/return snapshot

- Fresh Kraken XBT/USD latest trade: **79,795.50 USD/BTC**, observed 08:05:19.523Z, retrieved 08:05:22.106Z; payload SHA-256 `7876552d26eec37cac58bf1ac7cabdf4004fc6fa3ee4fc82c8a6902747fbb2af`.
- Latest completed hourly candle close-to-close 7-day return: **−2.199510%**. This is a different declared method from the prior current-trade-based return (−2.670356%); do not compare them as if they were the same calculation.
- Farside priority five-session ETF sum remains **−$115.2m**: 20 Oct +23.2m, 21 Oct +524.8m, 22 Oct −635.6m, 23 Oct −137.9m, 26 Oct +110.3m. New all-data payload SHA-256 `13e13f1589ad21913a667bfdf6ceb274d40151bb1447d8fec56110014f91705e`. Provider publication timestamp and revision/finality semantics remain unknown; review-only, not approved for production ingestion.
- Fresh 144-block fee window 973226–973369: fees 227,281,372 sats, subsidy 45,000,000,000 sats, ratio **0.505070%**; boundary and tip hashes matched before/after capture. Context only, not a Rule v1 gate.
- Offline Rule v1 output remains **Base / score 0 / low confidence**; review readiness has zero blockers, and same-input recalculation is byte-identical. This is not a persisted/live scenario state.
- Binance primary spot endpoint returned HTTP 451; Binance market-data-only and OKX returned USDT quotes, used only as cross-checks; Bybit returned HTTP 403. No USDT quote was blended into canonical Kraken USD/BTC.
- Artifact `12718750633`, staging workflow [#40471108936](https://github.com/olegsh247-stack/Crypto/actions/runs/40471108936). Staging, readiness, source-catalog validation, seed idempotency, release-workflow validation and VPS rehearsal #40471108869 passed on the exact head. Duplicate VPS rehearsal #40471113337 was still running at note time.
- No production DB access/writes, ingestion, registry/source-priority change, scenario-state/probability/monitoring persistence, deployment or merge. DXY remains optional; ETF timestamp/revision and durable-retention gates remain production-only blockers.

### 2026-10-27 — ETF session freshness and revision evidence checkpoint

- Added `scripts/assess-btc-etf-session-freshness.mjs` and deterministic tests. The helper uses the versioned U.S. session calendar, New York local close, weekends, full closures and early closes. It explicitly fails closed while Farside publication-window semantics remain unreviewed; no `observed_at` is fabricated.
- Extended snapshot revision evidence to retain old/new row key, completeness state and enclosing payload SHA-256, with a regression test. Added these tests to the read-only BTC staging workflow.
- ETF remains research-only / blocked from production ingestion. Remaining external/operational evidence: exact upstream NYSE/Nasdaq payload hashes; reviewed Farside publication-window policy; a real provider revision example (synthetic test is not a substitute); durable archive/read-back/backup-restore on the user's own infrastructure.
- No production DB write, live ingestion, registry/runtime priority change, scenario-state/probability persistence, deployment, or merge. Farside remains priority; SoSoValue cross-check only; no averaging or silent fallback.

### 2026-10-27 — ETF freshness CI verification

- BTC Public Source Staging run [#40531601122](https://github.com/olegsh247-stack/Crypto/actions/runs/40531601122): Farside snapshot revision tests, calendar validator, and all six session-freshness tests passed after the date-regex fix.
- The full staging workflow still ended blocked at the independent BTC fee/subsidy audit: `BLOCKED_PER_BLOCK_FEE_SUBSIDY_AUDIT`, reason `tip changed or behind window`. This is not an ETF test failure and no ingestion occurred; recapture/recheck the fee window separately when continuing the broader BTC capture.
- ETF production ingestion remains blocked on the documented publication-window policy, upstream calendar payload hashes, real revision evidence, and self-hosted durable retention/restore.

### 2026-10-27 — ETF publication policy and upstream hash capture

- Reviewed Farside's public explanation: ETF flow data is updated in real time and updates typically occur in the evening/night US time. This is typical timing, not a guaranteed deadline or exact observation timestamp.
- Added `data/CryptoDataModel/calendars/btc-etf-publication-freshness-policy.json`: 12-hour post-close grace period across midnight, then a complete reconciled Farside row may be at most one scheduled US trading session behind. Missing/incomplete values never become zero. Farside remains priority; SoSoValue cross-check only; TFTC supplemental; no averaging or auto-substitution.
- Added read-only CI capture of raw response-body SHA-256 and provenance for the official NYSE calendar page, Nasdaq calendar page, and Farside ETF page. CI artifact must be inspected to confirm actual hashes; capture errors are non-fatal to the separate BTC workflow and remain explicit in the artifact/logs.
- Added tests for policy invariants and overnight grace. Production ETF approval remains blocked on actual CI hash evidence, a real observed provider revision, and durable archive/read-back/restore on self-hosted infrastructure. No production writes, registry/runtime changes, deployment, or merge.

### 2026-10-27 — ETF upstream calendar hash evidence captured

- Read-only CI run [#40535074201](https://github.com/olegsh247-stack/Crypto/actions/runs/40535074201) captured HTTP 200 responses and exact response-body SHA-256 hashes for official NYSE hours page, Nasdaq U.S. equity calendar page, and NYSE 2026 trading-calendar PDF. Values and retrieval time are stored in `data/CryptoDataModel/calendars/us-etf-equity-session-calendar-2026-2028.json`; the calendar validator now checks the hash metadata.
- Nasdaq page body hash changed between two captures three minutes apart while body size remained 54,629 bytes. This is recorded as byte-level response volatility, not evidence of changed trading dates.
- The separate direct Farside URL request returned HTTP 403. Its response hash is explicitly marked as an access-denial response, not as a hash of ETF data. Do not use it as provider payload evidence.
- The dedicated ETF policy/calendar tests passed in staging. Full workflow still separately stops at the BTC fee/subsidy window audit (`tip changed or behind window`); no production ingestion occurred.
