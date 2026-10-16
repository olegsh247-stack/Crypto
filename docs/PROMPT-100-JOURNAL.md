# Промт 100 — журнал существенных работ проекта Crypto

Журнал фиксирует только существенные решения, изменения контрактов/архитектуры, проверки с подтверждённым результатом, блокеры и связанные коммиты/PR. Мелкие действия, повторные проверки без нового результата и планы как выполненные работы не записываются.

Запись означает только указанный результат. Исследовательские кандидаты не считаются принятыми production-данными; успешная CI-проверка не означает деплой или разрешение на запись в production.

## 2026-10-15 — ETF BTC: согласованный исследовательский расчёт

**Действие:** реализован отдельный выход `etf_research_derived_rows` для исследовательского сопоставления агрегатов Farside и TFTC методом `arithmetic_mean_2_sources`.

**Результат:** обе исходные величины, идентификаторы/URL источников, время получения и SHA-256 исходных ответов сохраняются отдельно. Производная строка маркируется `RESEARCH_DERIVED` и `OFFLINE_RESEARCH_ONLY`; `persistable: false`, `observed_at: null`, `finalization_status: unknown`. Расчёт допускается только при числовых агрегатах обоих источников и полном/согласованном отчёте Farside. Это исследовательское согласованное значение, а не заявление об ошибке одного из источников.

**Контрольный пример за 2026-10-07:** Farside = −484.9 USDm; TFTC = −487.0674115 USDm; среднее = −485.98370575 USDm (для отображения −486.0 USDm). Исходные значения не заменяются средним.

**Проверка:** тесты кандидатов и read-only staging прошли: https://github.com/olegsh247-stack/Crypto/actions/runs/38814920503. VPS API Build Rehearsal прошёл: https://github.com/olegsh247-stack/Crypto/actions/runs/38814920750.

## 2026-10-15 — отключение повторного live-capture на каждом push

**Действие:** workflow BTC Public Source Staging изменён так, чтобы push запускал проверки парсера/кандидатов, а фактический сбор изменяющихся публичных данных и создание артефакта запускались только вручную через `workflow_dispatch`.

**Результат:** проверка после изменения прошла; на push job live-capture был пропущен, как и задумано: https://github.com/olegsh247-stack/Crypto/actions/runs/38815249232. VPS API Build Rehearsal для изменения workflow прошёл: https://github.com/olegsh247-stack/Crypto/actions/runs/38815248344. Это предотвращает ненужное повторное получение меняющихся источников при каждом коммите; разовый read-only capture не является ежедневным пересчётом или production-записью.

## 2026-10-15 — статус BTC и оставшиеся блокеры

**Действие:** сохранён fail-closed подход к готовности BTC; реестр метрик используется как источник требований к метрикам, единицам, свежести, источникам и допустимым URL-префиксам.

**Результат:** BTC по-прежнему `not_evaluable`. Для принятия ETF-потока в production всё ещё нужна подтверждённая политика времени публикации и исправлений/финализации источника либо отдельно утверждённая политика неизменяемого снимка. Для DXY канонический источник не утверждён; широкий индекс доллара DTWEXBGS не подменяет ICE DXY автоматически.

**Связанный PR:** [#83 — refactor: make metric registry the BTC readiness source of truth](https://github.com/olegsh247-stack/Crypto/pull/83). На момент записи PR открыт и находится в Draft; не слит.

**Граница безопасности:** в рамках этих работ не выполнялись production-записи, ingestion, изменения базы данных, деплой, оценка сценария, изменения `scenario_state`, вероятностей или событий мониторинга.

## 2026-10-16 — проверка канонического источника DXY

**Действие:** изучены официальные материалы ICE по индексу DXY и условиям доступа, а также описание серии Федерального резерва `DTWEXBGS`.

**Результат:** ICE подтверждён как администратор DXY, но не подтверждены одновременно стабильный разрешённый endpoint и условия автоматического получения/хранения для проекта. `DTWEXBGS` — другой, широкий trade-weighted индекс доллара; автоматически подменять им DXY нельзя. Добавлена [запись проверки источника DXY](BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md) и ссылка в [матрице приёмки источников BTC](BTC-SOURCE-ACCEPTANCE-MATRIX-2026-10-13.md). Канонические реестры не менялись; DXY остаётся заблокированным.

**Граница безопасности:** только исследование и документация. Нет production-записей, ingestion, изменений реестров, деплоя или оценки сценария.

## Порядок продолжения

Продолжать строго по Плану 100: закрыть контракты происхождения/свежести и блокеры входов BTC, затем провести один воспроизводимый офлайн-сценарий. Не считать BTC оцениваемым до прохождения обязательных проверок. Не выполнять production-записи, ingestion, деплой или merge без отдельного явного разрешения.


## 2026-10-16 — контракт публикации и исправлений ETF BTC

**Действие:** сопоставлены публичные описания Farside и TFTC по cadence, lineage, исправлениям и повторному использованию данных; добавлена [отдельная запись проверки](BTC-ETF-PUBLICATION-REVISION-FINALITY-REVIEW-2026-10-16.md), обновлена [матрица приёмки](BTC-SOURCE-ACCEPTANCE-MATRIX-2026-10-13.md).

**Результат:** Farside заявляет real-time обновления, обычно вечером/ночью по времени США, но изученные описания не дают per-row publication timestamp, provider revision ID, полной correction history или finality point. TFTC документирует синхронизацию дважды в день, автоматические исправления последних и более старых дат, CC BY 4.0 с атрибуцией и смешанную lineage (текущие daily aggregates/per-fund flows — SoSoValue; исторические ряды до середины 2026 — в том числе Farside). Эти сведения документируемы, но не подтверждают окончательность и не разрешают автоматически менять canonical priority на TFTC.

**Статус:** ETF production acceptance остаётся заблокированной; BTC остаётся `not_evaluable`. Двухисточниковое среднее остаётся исследовательским и неперсистируемым. Реестры, production-данные, сценарий и monitoring не менялись; ingestion, deployment и merge не выполнялись.


## 2026-10-16 — проверка готовности к неизменяемым ETF-снимкам

**Действие:** статически проверены workflow staging, скрипт захвата и нормализация кандидатов; добавлена [оценка готовности snapshot policy](BTC-ETF-SNAPSHOT-POLICY-FEASIBILITY-REVIEW-2026-10-16.md) и ссылка в матрице приёмки.

**Результат:** текущий manual-only workflow сохраняет raw responses, manifest, нормализованные кандидаты и SHA-256 в артефакте GitHub Actions с retention 7 дней. Этого недостаточно для заявления о долговременном неизменяемом архиве: нет общего versioned snapshot ID и детерминированного row-level diff между новым и предыдущим снимком. Не реализованы project revision/supersession semantics и правило eligibility для offline-сценария. Это подтверждённый gap анализа кода, а не результат live-захвата.

**Статус:** production ETF input остаётся заблокированным; BTC остаётся `not_evaluable`. Не менялись retention, место хранения, workflow, реестры или production; workflow не запускался.


## 2026-10-16 — реализовано офлайн-сравнение ETF-снимков

**Действие:** добавлен `scripts/diff-btc-etf-snapshots.mjs`, набор тестов `scripts/diff-btc-etf-snapshots.test.mjs` и тестовый шаг в push validation workflow.

**Результат реализации:** сравнение двух существующих каталогов снимков выполняется офлайн по ключу источник + отчётная дата; различает новые, изменённые, пропавшие в пределах покрытия, неполные и несопоставимые строки. В diff остаются оба нормализованных значения — прежнее и текущее. Совпадающие хеши payload ETF-источников определяются как same-payload no-op, даже если время захвата различается. Пустые/тире-плейсхолдеры не становятся нулями; проваленный источник и даты вне окна покрытия не объявляются нулём/пропажей.

**Проверки и ограничения:** тесты добавлены, но CI для последнего commit ещё не подтверждён; до получения результата не отмечать тесты как прошедшие. Инструмент не запускает сбор источников и не создаёт долговременный архив; не доказывает финальность данных и не открывает production-допуск. BTC остаётся `not_evaluable`. DB, ingestion, deploy, scenario state/probability и monitoring не менялись.


## 2026-10-16 — подтверждена CI-проверка офлайн-сравнения ETF-снимков

**Действие:** устранена возможность принять невозможную календарную дату (например, `2026-02-31`) в офлайн-diff; добавлен регрессионный тест.

**Подтверждённый результат:** [BTC Public Source Staging #116](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520636) — success: прошли тесты парсера Farside, нормализации BTC-кандидатов и ETF snapshot diff. Live-capture job пропущен, как задумано. [VPS API Build Rehearsal #1449](https://github.com/olegsh247-stack/Crypto/actions/runs/38820520738) — success: сборки, тесты, disposable PostgreSQL, backup/restore и E2E-проверки завершились успешно.

**Ограничения:** это подтверждает кодовую/CI-проверку, но не окончательность данных провайдеров, долговременное хранение снимков, приёмку ETF для production или готовность BTC-сценария. BTC остаётся `not_evaluable`; PR #83 — Draft, не слит. Live capture, production DB, ingestion, deployment и scenario state не затрагивались.

## 2026-10-16 — экспортируемый versioned manifest ETF-снимка

**Действие:** расширен `scripts/diff-btc-etf-snapshots.mjs`: добавлен режим `--build <capture-dir> <snapshot.json>`, а сравнение теперь может принимать как каталоги захвата, так и экспортированные JSON-манифесты снимков. Добавлен тест на versioned `snapshot_id`, SHA-256 входных manifest/candidates, payload fingerprint и границы покрытия источника; уточнено описание теста независимости diff от порядка строк.

**Результат реализации:** можно сохранить переносимый manifest конкретного исследовательского снимка и использовать его позднее для офлайн-сравнения, не меняя исходные capture-файлы. Постоянное место хранения и retention не выбраны; манифест сам по себе не доказывает финальность провайдера.

**Проверка:** CI для новых изменений ожидает подтверждения. Live capture не запускался; production DB, ingestion, deploy, scenario state и вероятности не менялись.

## 2026-10-16 — контроль целостности экспортированного ETF snapshot manifest

**Действие:** добавлен `snapshot_content_sha256`, рассчитываемый по каноническому содержимому экспортированного манифеста; при повторном чтении проверяются schema, review-only режим, запрет production-доступа/записей и совпадение хеша. Добавлен регрессионный тест, изменяющий нормализованную строку и проверяющий отказ валидации.

**Результат реализации:** изменения сохранённых нормализованных строк теперь обнаруживаются при загрузке манифеста, а не маскируются неизменным `snapshot_id`. CI для последних коммитов ожидает подтверждения. Никакие live capture, архив/retention, production DB, ingestion, deployment или scenario state не затрагивались.

## 2026-10-16 — подтверждены тесты экспортируемого ETF snapshot manifest

**Действие:** завершена проверка export/compare CLI, проверки целостности сохранённого манифеста и provenance source artifacts.

**Подтверждённый результат:** [BTC Public Source Staging #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38821070436) — success: все тестовые шаги прошли, live-capture был пропущен. [Run #118](https://github.com/olegsh247-stack/Crypto/actions/runs/38821054244) — success для проверки реализации content-hash/identity. VPS API Build Rehearsal для последнего коммита на момент записи ещё выполняется.

**Ограничения:** это проверка офлайн-инструмента, а не решение о хранении, финальности или production-допуске ETF. BTC остаётся `not_evaluable`; PR #83 не слит. Live capture, production DB, ingestion, deployment и scenario state не менялись.

## 2026-10-16 — подготовлено предложение по revisions и eligibility ETF-снимков

**Действие:** создан документ [BTC ETF snapshot revision and research eligibility proposal](BTC-ETF-SNAPSHOT-REVISION-ELIGIBILITY-PROPOSAL-2026-10-16.md).

**Результат:** раздельно описаны неизменяемые исходные снимки, review-кандидаты на revision/supersession и правило допуска ETF-строки в offline research-сценарий. Сопоставлены три варианта: provider-declared finality, project-stabilized research snapshot и сохранение блокировки. Рекомендация — не открывать production-допуск; вариант research-only стабилизации рассматривать только после явного решения.

**Статус:** это предложение, не утверждённая политика. Место/срок хранения, stability window, revision handling и research eligibility остаются нерешёнными. Никакие реестры, production-данные, scenario state или probabilities не менялись.


## 2026-10-16 — подтверждена полная VPS-репетиция для snapshot lineage

**Действие:** проверен завершившийся VPS API Build Rehearsal для последнего коммита PR #83 `6ba7e09877d50109aba13220cb224755547830ba`.

**Подтверждённый результат:** [VPS API Build Rehearsal #1474](https://github.com/olegsh247-stack/Crypto/actions/runs/38821243278) — success. Все шаги прошли: проверка VPS-only архитектуры, сборки runtime/API/Worker и образов, контрактные тесты, PostgreSQL migration/bootstrap, BTC input registry и provenance audit, idempotency/duplicate reconciliation, backup/restore, API/Worker E2E, offline invariants и BTC research evidence/snapshot lineage E2E. Сочетание этого прогона с [BTC Public Source Staging #121](https://github.com/olegsh247-stack/Crypto/actions/runs/38821070436) подтверждает тесты offline snapshot export/compare и VPS rehearsal на актуальном коде ветки.

**Ограничения:** это успешная тестовая репетиция, а не production cutover и не подтверждение окончательности ETF-источников. PR #83 остаётся Draft/open/unmerged; BTC остаётся `not_evaluable`. Live capture не запускался; production DB, ingestion, deployment, scenario state/probabilities и monitoring не менялись.


## 2026-10-16 — устранен пробел provenance в идентичности ETF-снимка

**Действие:** при ревью экспортируемого snapshot manifest обнаружено, что предыдущая версия хешировала manifest/candidates, но не связывала снимок с точными версиями capture script, Farside parser, normalizer и metric registry. Добавлены SHA-256 этих файлов в capture/candidate provenance; snapshot manifest и алгоритм сравнений переведены на version 2, provenance включён в snapshot ID и контроль целостности.

**Результат реализации:** снимок теперь несёт проверяемую связь с точными байтами кода захвата, парсера, нормализатора и реестра метрик. Это улучшает воспроизводимость, но не является цифровой подписью, долговременным архивом, подтверждением финальности источника или допуском ETF в сценарий. CI для этой правки ожидает проверки.

**Граница безопасности:** live capture не запускался; production DB, ingestion, deployment, scenario state/probabilities и monitoring не менялись.


## 2026-10-16 — подтверждены staging и полная VPS-репетиция после provenance v2

**Действие:** проверены завершённые GitHub Actions для commit `3b39f0db5a059ca091dffe04a83a85e070f577aa`.

**Подтверждённый результат:** [BTC Public Source Staging #38822111790](https://github.com/olegsh247-stack/Crypto/actions/runs/38822111790) — success; тесты ETF snapshot/provenance прошли, live-capture job пропущен штатно. [VPS API Build Rehearsal #38822111807](https://github.com/olegsh247-stack/Crypto/actions/runs/38822111807) — success; прошли все шаги, включая VPS-only guard, сборки API/Worker, PostgreSQL bootstrap/migrations, BTC registry/provenance audit, duplicate/idempotency rehearsal, backup/restore и BTC evidence/snapshot-lineage E2E.

**Исправление в ходе проверки:** первый staging-прогон выявил оставшуюся проверку префикса snapshot ID версии v1. Она исправлена в commit `3b39f0d`; следующий staging-прогон прошёл.

**Ограничения:** это CI/test-environment evidence, не доказательство provider finality, долговременного хранения или допуска ETF в сценарий. PR #83 остаётся Draft/open/unmerged; BTC остаётся `not_evaluable`. Live capture, production DB, ingestion, deployment, scenario state и probabilities не менялись.


## 2026-10-16 — закрыты два дефекта воспроизводимости/аудита BTC

**Действие 1:** commit 7c284df62e1625b587239a03715dc99b44361742 добавил fail-closed проверки для повторяющейся идентичности ETF-источника и дублирующихся строк с одинаковыми source + reporting date; валидация экспортированного snapshot также отвергает повторяющиеся ключи строк, которые иначе могли бы молча перезаписываться при построении Map. Добавлены регрессионные тесты.

**Результат проверки:** [BTC Public Source Staging #38851210312](https://github.com/olegsh247-stack/Crypto/actions/runs/38851210312) — success; capture job штатно пропущен.

**Действие 2:** commit 226a3c77d8bd0ee53d4851dac5b502283bb2bdae исправил read-only SQL-аудит ETF history coverage: считаются только явные period_start даты в 14-дневном окне, с числовым значением и каноническим зарегистрированным Farside source ID/URL. observed_at не используется как замена reporting date, TFTC не засчитывается как canonical source. Документация разделяет покрытие истории и отдельный gate последней строки в 36 часов плюс revision/finality.

**Результат проверки:** [VPS API Build Rehearsal #38851337098](https://github.com/olegsh247-stack/Crypto/actions/runs/38851337098) — success. Успешно прошли миграции PostgreSQL, read-only BTC provenance audit, duplicate/idempotency rehearsal, backup/restore и API/Worker E2E.

**Ограничения:** проверки выполнены в CI/disposable PostgreSQL; production не менялся. Live capture, ingestion, deployment, scenario state/probabilities и merge не выполнялись. ETF и DXY остаются заблокированными; BTC остаётся not_evaluable.


## 2026-10-16 — DXY public-candidate/licensing review

**Действие:** проверены предложенные Yahoo Finance DX-Y.NYB, Dukascopy dollaridxusd, TradingView TVC:DXY/INDEX:DXY, FRED DTWEXBGS и исторические данные Portara/CQG по идентичности инструмента и опубликованным условиям.

**Результат:** Yahoo отображает DX-Y.NYB как US Dollar Index / ICE Futures, но условия Yahoo ограничивают автоматический сбор без предварительного разрешения и запрещают перераспространение; yfinance не является официальным разрешением. Документация Dukascopy для derivative index quotes описывает минутное статистическое усреднение, не биржевое значение, и требует согласования объявленного способа использования. Условия TradingView ограничивают non-display обработку. DTWEXBGS — отдельный широкий индекс ФРС. Portara/CQG — кандидат на платную историю фьючерсов, но фьючерсную settlement-серию нельзя выдавать за cash DXY.

**Решение:** канонический источник не выбран; реестры и source priority не менялись. DXY остаётся blocked, BTC — not_evaluable. Следующие варианты: получить условия/доступ к авторизованному ICE DXY feed либо отдельно предложить новую макрометрику широкого доллара на базе DTWEXBGS.


## 2026-10-16 — DXY removed as a first-scenario blocker

**Decision:** close the extended DXY vendor search for the first BTC scenario. DXY is optional macro context, not a required readiness input.

**Source handling:** Yahoo Finance `DX-Y.NYB` is the primary manual/display reference for the ICE DXY quote, not an approved automated collector absent permission. FRED `DTWEXBGS` is the backup only for separately labelled broad-dollar context; it is not ICE DXY, must not be written into `macro.dxy`, and must not be merged into a DXY series. If neither is usable/current, omit the context rather than block BTC.

**Implemented:** metric registry marks `macro.dxy` optional; readiness tests assert that missing/untraceable/unapproved DXY cannot block otherwise valid inputs. Source priority remains empty, so this does not silently approve automated data collection. Documentation and Plan 100 updated.

**Boundary:** ETF publication/revision/finality remains a separate blocker. This change does not create observations, evaluate/persist a scenario, alter scores/probabilities, touch production data, run ingestion, deploy, or merge PR #83.


## 2026-10-16 — DXY removed from both readiness and offline-rule hard requirements

**Finding:** the first VPS rehearsal after the readiness change exposed an outdated E2E assertion that still expected missing DXY to block readiness. Review also found the offline direction prototype still threw on missing DXY, hashrate and fee/subsidy ratio despite their optional/deferred status.

**Implemented:** updated the VPS E2E contract to assert that DXY does not block; introduced deterministic `BTC-Scenario-Rule-v2`, requiring only price-return and ETF-flow inputs, treating hashrate/DXY as optional directional signals and fee/subsidy as optional context. Missing optional values are omitted, not imputed. The existing score thresholds and published probabilities are unchanged; with only the two required signals, the result remains Base unless further valid signals are present.

**Source decision:** Yahoo Finance `DX-Y.NYB` is the primary manual/display reference for ICE DXY; FRED `DTWEXBGS` is the fallback only for separately labelled broad-dollar context. If neither is usable, omit DXY. Neither is silently approved for automated ingestion; DXY is no longer a blocker.

**Boundary:** CI run for commit `5d2fb0b` failed only because of the stale assertion `missing DXY metric must block readiness`. The correction is now included in the follow-up code commit; its CI result is pending. No production data, ingestion, scenario state, probabilities, deployment, or PR merge changed.


## 2026-10-16 — VPS rehearsal passed after removing the DXY blocker

**Confirmed result:** [VPS API Build Rehearsal #38853001917](https://github.com/olegsh247-stack/Crypto/actions/runs/38853001917) — success for commit `d3df1e81f21e8af1ba0af2f511fb92abaca84e59`. This confirms the VPS build/E2E path and the corrected readiness assertion: DXY is optional; the ETF-flow acceptance gate remains independent.

**Follow-up validation:** enabled the BTC readiness/directional-rule unit-test workflow on `fix/**` pushes so rule-v2 optional-input tests can run before PR merge. That dedicated unit-test result is pending and must not be described as passed until the run completes.

**Boundary:** CI uses a disposable test environment. No production observation writes, ingestion, scenario-state persistence, probability changes, deployment, or PR merge occurred.


## 2026-10-16 — optional-input change fully validated

**Confirmed for code commit `27a18a3d1434ac1298e42222c288c9560ce30950`:** [BTC Scenario Readiness Gate #38853311612](https://github.com/olegsh247-stack/Crypto/actions/runs/38853311612) — success. Registry consistency checks and all 58 readiness/candidate tests passed, including the updated optional DXY, hashrate, and fee/subsidy behavior plus deterministic rule v2.

**Confirmed:** [VPS API Build Rehearsal #38853311389](https://github.com/olegsh247-stack/Crypto/actions/runs/38853311389) — success. VPS-only guard, runtime/API/Worker builds, PostgreSQL migration/bootstrap, read-only BTC provenance audit, duplicate/idempotency rehearsal, backup/restore, API/Worker E2E, and research snapshot-lineage checks passed.

**Current blocker:** ETF latest-row revision/finality/eligibility remains unresolved. DXY is no longer a blocker. No production data writes, ingestion, scenario-state persistence, probability changes, deployment, or PR merge occurred.


## 2026-10-16 | Утверждена и реализована политика стабильного исследовательского снимка ETF | Результат

**Действие:** после согласования с пользователем реализованы политика допуска ETF-строки к offline research и fail-closed evaluator: два независимых валидных снимка с интервалом не менее 24 часов; оба источника Farside/TFTC должны быть доступны в обоих снимках; по целевой дате нужна ровно одна полная строка каждого источника, Farside должен пройти проверку полноты и сверки; нормализованные отпечатки строк обоих источников должны совпадать между снимками.

**Подтверждённый результат:** evaluator возвращает только `ELIGIBLE_FOR_REVIEW`, не самовольное разрешение; требуется явное подтверждение исследователя. Изменение значения создаёт revision candidate, прошлые свидетельства сохраняются. Отсутствующие, неуспешные и неполные данные не превращаются в ноль. Неофициальные источники разрешено изучать как отдельно обозначенные подтверждающие данные, но нельзя молча подменять ими канонические источники; обязательны проверка идентичности метрики, семантики, покрытия, условий использования и происхождения данных.

**Проверки:** [BTC Public Source Staging #38854319856](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319856) — success, включая новые тесты политики; live capture штатно пропущен. [VPS API Build Rehearsal #38854319826](https://github.com/olegsh247-stack/Crypto/actions/runs/38854319826) — success, включая сборку, репетицию PostgreSQL, аудит происхождения BTC, backup/restore и E2E. Код и тесты находятся в PR #83; PR остаётся Draft/open/unmerged.

**Ограничения:** артефакт GitHub Actions хранится 7 дней и не является долговременным архивом. Пока сохранность набора свидетельств и восстановление не обеспечены в контролируемом проектом хранилище, конкретная дата остаётся заблокированной. Политика не утверждает финальность провайдера и сама по себе не делает BTC `evaluable`. Не запускались live capture, production ingestion, production DB writes, оценка сценария, изменение state/probabilities/monitoring, деплой или merge.


## 2026-10-16 | Проверены альтернативные источники BTC ETF flows | Результат

**Действие:** проведён документальный анализ SoSoValue API и альтернативных агрегаторов; добавлен `docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md`, обновлён План 100.

**Подтверждённый результат:** SoSoValue — пригодный кандидат для ручной offline-проверки дневных агрегатов и потоков по отдельным ETF, но нужен API key; документация для per-fund history ограничивает историю последним месяцем. Условия повторного использования данных, точный контракт aggregate endpoint, timestamp/finality/revision и фактическое совпадение значений ещё не проверены. Live API не вызывался, ключи не запрашивались, данные не загружались.

**Важная находка по происхождению:** TFTC указывает, что текущие дневные агрегаты и текущие потоки по фондам идут из SoSoValue, а исторический ряд до середины 2026 собран из disclosures, сведённых Farside. Значит Farside и TFTC — разные издатели, но их текущая дневная lineage пересекается. Согласованное среднее остаётся проектной исследовательской метрикой сравнения, но не независимым консенсусом двух источников. SoSoValue нельзя считать третьим независимым голосом.

**Граница:** альтернативный источник не добавлялся в source registry и не становился каноническим; метрика среднего не менялась. Сырые ответы не публиковались из-за непроверенных прав на распространение. Долговременный архив по-прежнему блокирует допуск ETF-строки; BTC остаётся `not_evaluable`.


## 2026-10-16 | Подготовлен offline normalizer для SoSoValue ETF summary | Результат

**Действие:** добавлены `scripts/prepare-btc-sosovalue-etf-candidates.mjs` и тесты; тесты подключены к read-only `btc-public-source-staging.yml`.

**Результат кода:** adapter нормализует только заранее сохранённый ответ, не делает сетевых запросов и не читает API key. Сохраняет SHA-256 тела ответа и retrieval timestamp; переводит документированную сумму USD в USD million/day; оставляет provider observation time и finality неизвестными. Fail-closed проверки покрывают невалидный календарный день, дубликаты дат, отсутствующие/нечисловые значения, неверный endpoint, timestamp и HTTP status. Выход помечен non-persistable, research candidate only.

**Проверка и границы:** SoSoValue API не вызывался: доступ к ключу, terms/licensing и права распространения не подтверждены. Адаптер — подготовленная офлайн-обработка, а не подтверждение конкретных рыночных значений. На момент записи CI для самого последнего коммита ещё выполнялся; результат не отмечать зелёным до завершения. Никаких изменений source priority/registry, БД, scenario state, probabilities, monitoring, deployment или merge.


## 2026-10-16 | Зафиксирован контракт архива ETF-доказательств и восстановления | Результат

**Действие:** создан `docs/BTC-ETF-EVIDENCE-ARCHIVE-AND-RECOVERY-CONTRACT-2026-10-16.md`; План 100 обновлён.

**Результат:** определён проектный контракт для неизменяемых снимков по каждому захвату: manifest с source lineage и временем получения, исходные тела ответов, нормализованные строки, SHA-256, diff изменений, отдельное решение проверяющего, приватное хранилище и независимая зашифрованная резервная копия с проверкой checksum и репетицией восстановления. Разведены reporting date, retrieval time и provider observation time. Запрещено помещать исходные payloads и секреты в публичный репозиторий. Семидневный CI artifact классифицирован только как временный транспорт.

**Ограничения:** документ описывает будущую схему, не работающий архив. VPS и независимое резервное хранилище пока не развернуты; восстановление не проверено; срок хранения/условия удаления и права на долговременное хранение сырых данных не утверждены. Блокер сохранности доказательств остаётся. BTC остаётся `not_evaluable`; production и scenario state не менялись.


## 2026-10-16 | Повторно проверена воспроизводимость ETF-снимков | Результат

**Действие:** проверены завершённые GitHub Actions для offline snapshot diff и VPS build/E2E; внесено безопасное изменение workflow, чтобы ручной запуск проверки не выполнял live capture по умолчанию.

**Подтверждённый результат:** BTC Public Source Staging #38854319856 — parser 6/6, normalization 16/16, snapshot diff 16/16, research-eligibility policy 6/6; capture job пропущен. VPS API build/E2E #38854319826 — success. Snapshot-тесты подтверждают no-op при одинаковых хешах payload при разных retrieval timestamp, независимость от порядка строк, выявление изменённого значения без замены прежнего доказательства, классификацию новых/пропавших/неполных строк и отказ на дубликатах/подмене манифеста.

**Изменение workflow:** `.github/workflows/btc-public-source-staging.yml` теперь требует явного `capture_sources=true` для сетевого захвата и загрузки артефакта; manual dispatch по умолчанию должен выполнять только валидацию. Коммит: `bded4a270b526f9007480f5a7cc6670a0771a59a`. Проверка CI для этого нового коммита ещё ожидается; не считать её зелёной до подтверждения.

**Архив и ограничения:** семидневный artifact — временный транспорт, не долговременный архив (текущий проверенный artifact истекает 2026-10-22). Постоянный путь `/srv/crypto-evidence/btc-etf/` остаётся проектным планом до появления VPS и независимой зашифрованной копии; восстановление не репетировалось, retention и права хранения сырых ответов не утверждены. Live capture, production DB writes, scenario evaluation, deployment и merge не выполнялись. BTC остаётся `not_evaluable`.


**Связанный раздел Плана 100:** `docs/PLAN-100-ETF-SNAPSHOT-RECHECK-2026-10-16.md` фиксирует четыре пункта проверки, границы долговременного архива и текущий блокер BTC. Он является дополнением к основному `docs/PLAN-100.md`; production и сценарные данные не менялись.


## 2026-10-16 | Подтверждён CI после opt-in защиты capture и проверены права источников ETF | Результат

**Действие:** повторно проверены push-triggered workflow runs после коммита `bded4a270b526f9007480f5a7cc6670a0771a59a`; уточнён документальный статус прав на ETF-данные; обновлены source review и дополнение к Плану 100.

**Подтверждённый CI:** [BTC Public Source Staging #38857256853](https://github.com/olegsh247-stack/Crypto/actions/runs/38857256853) — success; parser, normalization, snapshot diff, ETF eligibility policy и SoSoValue offline normalizer прошли; capture job skipped. [VPS API Build Rehearsal #38857256836](https://github.com/olegsh247-stack/Crypto/actions/runs/38857256836) — success. Таким образом, новый workflow с обязательным явным `capture_sources=true` для live capture подтверждён CI.

**Права источников (публичная документация, без live capture):** TFTC на странице ETF flows явно указывает открытый JSON и лицензию CC BY 4.0 с атрибуцией/ссылкой на TFTC. TFTC сообщает, что текущие дневные агрегаты и текущие потоки по фондам происходят из SoSoValue, а исторические данные до середины 2026 составлены по disclosures, сведённым Farside; поэтому TFTC остаётся не независимым голосом относительно этих источников. Для Farside на просмотренной странице не обнаружено ясного разрешения на долговременное хранение/распространение сырых ответов. Документация SoSoValue API описывает endpoint и ключ, но не подтверждает API-specific права хранения/повторного использования. Условия сайта SoSoValue не приравниваются автоматически к лицензии API.

**Изменения документации:** обновлены `docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md` и `docs/PLAN-100-ETF-SNAPSHOT-RECHECK-2026-10-16.md`. TFTC dataset признан кандидатом для повторного использования при соблюдении CC BY 4.0 и сохранении атрибуции/lineage; Farside и SoSoValue raw-payload rights остаются блокерами до прояснения. Архив и независимое восстановление не готовы: VPS/backup не развернуты, срок хранения/удаление не утверждены. ETF-строки не допущены к сценарию; BTC остаётся `not_evaluable`.

**Границы:** не выполнялись live capture/API-запросы, не использовался API key, не менялись source priority/registry, production DB, scenario state, score/probabilities/monitoring; не было deploy или merge. PR #83 остаётся открытым Draft.



## 2026-10-16 | Усилен fail-closed допуск ETF-данных | Результат

**Действие:** при проверке контракта допуска обнаружено, что evaluator проверял 24-часовую стабильность и полноту строк, но не требовал подтверждения постоянного архива/восстановления и прав на хранение/повторное использование каждого источника. Это не соответствовало записанному в Плане 100 правилу допуска. Исправлены evaluator и тесты.

**Изменение:** `scripts/evaluate-btc-etf-research-eligibility.mjs` теперь возвращает `BLOCKED_DURABLE_ARCHIVE`, если не передано подтверждение проверенного независимого восстановления, и `BLOCKED_SOURCE_RIGHTS`, если для каждого настроенного источника отсутствует явное `CLEARED` и непустая ссылка на основание. Добавлена проверка реальной календарной даты. Тесты проверяют оба новых блокера и некорректную дату. Исправлен вывод идентификатора источника, права которого не подтверждены.

**Проверка:** [BTC Public Source Staging #38865711852](https://github.com/olegsh247-stack/Crypto/actions/runs/38865711852) — success после изменений, включая тесты eligibility policy. VPS Build/E2E для этого изменения выполняется отдельно; результат не объявлять до завершения.

**Фактическое состояние:** проверенный архив восстановления не существует, права Farside на долговременное хранение/повторное использование не подтверждены; поэтому реальные ETF-данные по-прежнему заблокированы и BTC остаётся `not_evaluable`. В тесте с искусственно переданными положительными control-полями показан только путь к статусу review-кандидата, а не фактическое разрешение данных. Никаких live capture/API-запросов, production DB writes, сценарной оценки, изменения source priority, deploy или merge не выполнялось.


## 2026-10-16 — добавлен офлайн CLI-отчёт допуска ETF BTC

**Действие:** проверено, что строгий evaluator ранее запускался только как unit-test policy; добавлен CLI для оценки двух экспортированных versioned snapshot manifest и создания отдельного JSON-отчёта. Отчёт фиксирует snapshot IDs и SHA-256 входных манифестов, а при передаче controls-файла — и его SHA-256. Добавлен интеграционный тест: без controls evaluator должен блокировать допуск; даже при fixture-controls итог остаётся `ELIGIBLE_FOR_REVIEW`, требует отдельного review и не запускает сценарий.

**Результат реализации и проверки:** проверку можно воспроизводимо запускать локально офлайн без live capture и без базы данных. Controls-файл является ручной записью проверок, а не самостоятельным доказательством архива/прав; ссылки на подтверждающие документы должны быть проверяемыми. Первый staging-прогон выявил дефект экранирования перевода строки в JSON-отчёте; исправление внесено, после чего [BTC Public Source Staging #38867336990](https://github.com/olegsh247-stack/Crypto/actions/runs/38867336990) прошёл все проверки, включая CLI-интеграционный тест; live-capture был пропущен. VPS Build & E2E для актуального кода ещё выполняется, его результат не засчитывать до завершения.

**Граница безопасности:** live capture не запускался; production DB, ingestion, реестры, scenario state, probabilities, monitoring, deployment и merge не менялись. BTC остаётся `not_evaluable`.


## 2026-10-16 — усилен аудит допуска ETF: доказательство восстановления архива

**Действие:** gate допуска дополнен обязательной ссылкой `archive_restore_evidence_ref`; одного флага `archive_restore_verified: true` недостаточно. В отчёт включены ссылка на доказательство независимого восстановления и ссылки на доказательства прав для каждого источника. Добавлены регрессионные тесты на отсутствие ссылки и на сохранение ссылок в результате.

**Результат проверки:** промежуточный staging выявил дефект контракта результата: внутренние evidence references не доходили до возвращаемого отчёта. Исправлено; [BTC Public Source Staging #38867526986](https://github.com/olegsh247-stack/Crypto/actions/runs/38867526986) — success, включая полный набор тестов ETF eligibility/CLI. VPS Build & E2E для commit `d28bff70139873c88fbf1a8b4dab02239fe06c31` ещё выполняется; до завершения не считать проверку VPS законченной.

**Ограничения:** тестовые controls — фиктивные fixtures, а не доказательство, что реальный архив восстановлен или права Farside подтверждены. Реальный допуск ETF остаётся заблокированным; BTC — `not_evaluable`. Live capture, production DB, ingestion, deployment, scenario state/probabilities, monitoring и merge не выполнялись.


## 2026-10-16 — подтверждена VPS-сборка для офлайн ETF eligibility CLI

**Действие:** повторно проверен результат VPS Build & E2E для актуального HEAD PR #83 после прохождения staging CLI-тестов.

**Результат:** [VPS API Build Rehearsal #38867561274](https://github.com/olegsh247-stack/Crypto/actions/runs/38867561274) завершился `success` на HEAD `a92b717833a99d87775619075e7e7ac9c1ad33b5`. Следовательно, CLI и обновлённый контракт допуска прошли staging и VPS-сборку/E2E. Документация Plan 100 дополнена точным итогом.

**Ограничения:** это CI-репетиция, не подтверждение реально развёрнутого VPS, работающего архива/backup restore или очищенных прав на источники. Live capture, production DB, ingestion, scenario evaluation/state, deployment и merge не выполнялись. BTC остаётся `not_evaluable`.


## 2026-10-16 — зафиксирован порядок подготовки постоянного архива доказательств

**Действие:** согласован поэтапный подход к тестовому хранилищу: сейчас использовать фикстуры и временные CI-артефакты только для проверок; постоянный архив и восстановление подготовить к локальному SSD/будущему VPS, не требуя покупать или подключать оборудование заранее.

**Результат:** контракт архива уже отделяет приватные исходные доказательства от PostgreSQL backup: неизменяемые снимки с manifest и SHA-256, без секретов и сырых payload в публичном репозитории; отдельная зашифрованная резервная копия на независимом failure domain; восстановление в изолированную директорию и сверка checksum. CI-артефакты с retention 7 дней не считаются постоянным архивом. Размеры и срок хранения не объявляются подтверждёнными до измерений и отдельного решения по лицензиям источников.

**Следующий этап:** SSD пока не нужен. Сначала продолжить offline-проверки и закрывать блокеры контракта/прав источников. Когда потребуется проверить реальные байты архива и восстановление, заранее сообщить пользователю и дать точную инструкцию по подключению. Реальный ETF допуск остаётся заблокированным; BTC — `not_evaluable`.


## 2026-10-16 — дополнительный ETF API-кандидат проверен по документации

**Действие:** проверена документация CryptoETF Public API как возможного дополнительного источника дневных потоков BTC ETF.

**Результат:** бесплатный доступ ограничен последними 30 днями, требуется API key; документация описывает расчёт на основе issuer filings (shares outstanding × NAV), при этом данные Fidelity берутся из Farside. Источник может пригодиться для отдельного недавнего сопоставления, но не является независимой заменой текущей пары. Условия долговременного хранения/перераспространения сырых API-ответов не подтверждены.

**Ограничения:** ключ не запрашивался, endpoint не вызывался, данные не собирались; реестр источников и утверждённый `arithmetic_mean_2_sources` не менялись. Подробности внесены в `docs/BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md`. ETF остаётся заблокированным, BTC — `not_evaluable`.


## 2026-10-16 — добавлен офлайн writer для архива доказательств ETF BTC

**Действие:** реализован `scripts/archive-btc-etf-evidence.mjs`, добавлены тесты безопасности и шаг в BTC Public Source Staging workflow. Обновлён контракт архива и План 100.

**Результат реализации:** writer принимает уже существующую локальную capture-директорию; не выполняет сетевые запросы, не читает API-ключи, не обращается к PostgreSQL и не оценивает сценарий. Требует явные reporting date/snapshot ID и отдельный файл прав; для каждого сохраняемого raw body требует `CLEARED` и непустой evidence reference. Проверяет SHA-256 тела, отклоняет неполный manifest, небезопасные пути/ID, credential-подобные URL-параметры и повторное использование snapshot ID; создаёт новую директорию с manifest, архивной записью и SHA-256 checksum manifest.

**Проверки:** добавлены тесты на успешный fixture, неразрешённые права, отсутствующее тело, hash mismatch, перезапись, неполный manifest, credential-подобный URL, некорректную дату и небезопасный ID. На момент записи подтверждённый результат CI для новых тестов ещё не получен; нельзя считать этап прошедшим до проверки запуска.

**Ограничения/статус:** это реализация и тесты, а не архив реальных данных. Права на хранение сырых данных Farside/SoSoValue остаются неразрешёнными; live capture не запускался, SSD/VPS не требуются для fixture-тестов. Архив, независимый backup/restore и ETF допуск не сертифицированы; BTC остаётся `not_evaluable`. Без production-записей, ingestion, сценарных изменений, деплоя и merge.
