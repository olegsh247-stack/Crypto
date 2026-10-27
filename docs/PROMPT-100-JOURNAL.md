# Промт 100 — журнал существенных работ проекта Crypto

## 2026-10-17 — ETF duplicate source-row key guard

**Finding:** The readiness gate required a source row key but did not detect a key reused across different ETF reporting dates. Such a fixture could satisfy the distinct-day count without proving distinct provider rows.

**Change:** Added a fail-closed blocker `duplicate_source_row_key_across_reporting_days` after selecting one ETF row per reporting date, plus a regression test. Revisions for the same reporting date remain consolidated into one session.

**Verification:** BTC Scenario Readiness Gate [#39022454551](https://github.com/olegsh247-stack/Crypto/actions/runs/39022454551) passed. VPS Build Rehearsal [#39022454542](https://github.com/olegsh247-stack/Crypto/actions/runs/39022454542) was still running when this entry was prepared; its result will be recorded separately after it completes.

**Boundary:** No live capture, production DB write, source-priority change, scenario-state persistence, deployment, or merge.


## 2026-10-17 — API/Web metric freshness enum aligned and CI verified

**Finding:** The Asset Detail API passes observation freshness through from PostgreSQL. The schema and migration permit exactly `CURRENT`, `STALE`, `EXPIRED`, and `UNCLASSIFIED`, while the new Web shared contract initially described lowercase `fresh/stale/unknown`. This was a real API/Web contract mismatch, not merely a documentation difference.

**Change:** Updated `shared/api-contract.ts` to use the persisted enum and extended `web/lib/api-contract.test.ts` with compile-time fixtures for all four states. Updated `.github/workflows/web-build.yml` so feature-branch pushes touching Web/shared contracts also run the Web build.

**Verification:** [Web Build #39021673480](https://github.com/olegsh247-stack/Crypto/actions/runs/39021673480) and [VPS Build Rehearsal #39021673493](https://github.com/olegsh247-stack/Crypto/actions/runs/39021673493) both completed successfully. The VPS rehearsal included API/Worker builds, PostgreSQL migration bootstrap, registry/provenance checks, backup/restore and API/Worker E2E. These are isolated CI checks, not live endpoint or production data validation.

**Boundary:** No live capture, production DB write, source/runtime registry change, scenario evaluation/state/probability change, deployment, or merge. BTC remains `not_evaluable`; freshness contract parity does not remove the actual input freshness/provenance blockers.

## 2026-10-16 — структурный аудит ежедневного ETF-кандидата выявил подозрительные серии

**Действие:** проверены даты, типы и значения всех 162 строк публичного `akpasz/btc-data/data/etf_holdings.json` по IBIT, ARKB, BITB, HODL и OBTC.

**Результат:** дубликатов дат, нарушения порядка, нечисловых и неположительных значений не найдено. При этом обнаружены длинные серии одинаковых значений: OBTC — 28 наблюдений подряд (2026-09-02–2026-10-12) на 934 BTC; HODL — 7 наблюдений (2026-09-23–2026-10-01) на 14,726 BTC; ARKB — 6 наблюдений (2026-10-09–2026-10-16) на 32,024 BTC; у BITB есть повторяющиеся серии по 4 наблюдения. Это признак возможного carry-forward/застывшего скрейпера, но не доказательство ошибки: необходима проверка первоисточника и точной методики округления. Подробности внесены в матрицу источников ETF.

**Решение:** все 162 строки остаются неподтверждённым кандидатом; не исправлять и не заполнять значения автоматически. Для принятия нужны source URL, дата/время наблюдения и независимое подтверждение по issuer snapshots. Daily holdings по всем 13 фондам остаётся **NOT DONE**.

**Граница безопасности:** только чтение публичного JSON и изменение документации в ветке `fix/btc-readiness-registry-runtime-source`; runtime, registry, БД, сценарии, оценки, ingestion, deployment и merge не менялись.
 

## 2026-10-16 — проверен дополнительный архивный кандидат BuildWithData

**Действие:** прочитаны публичные README и дерево исходников [BuildWithData/BTC-ETF-Tracker](https://github.com/BuildWithData/BTC-ETF-Tracker), а также открытые issues по BTCW, BTCO, FBTC и ARKB.

**Результат:** README ссылается на внешний Google Drive архив снимков, который, по заявлению автора, обновляется не реже раза в неделю. В исходниках есть scrapers для 10 американских фондов, но нет BTCW, MSBT и OBTC. Сам архив с данными в этой проверке не удалось подтвердить по содержимому, поэтому его покрытие/даты не засчитаны. В публичном дереве репозитория не обнаружен LICENSE, поэтому права на повторное использование и распространение не установлены. Открытые issues: BTCW scraper (#15), BTCO holdings (#14), FBTC загрузка holdings Excel (#99), ARKB изменившийся HTML (#87). Issue BTCO прямо предлагает оценку holdings через AUM / reference price; такой метод отклонён, поскольку не даёт точное количество BTC.

**Решение:** кандидат оставлен только как направление для дальнейшей проверки фактических архивных файлов. Не принимать оценку AUM/цена, не переносить данные без проверки дат, provenance, исправлений и прав. Daily holdings по всем 13 фондам остаётся **NOT DONE**.

**Граница безопасности:** только чтение публичного репозитория/issues и документационные изменения в ветке `fix/btc-readiness-registry-runtime-source`; сторонний репозиторий не менялся, production/runtime/DB/registry/scenario не затрагивались.


## 2026-10-16 — SEC XBRL extractor compared against 13 filing-verified ETF controls

**Действие:** read-only повторно получены публичные `etf_quarterly.json` и `etf_holdings.json` из [akpasz/btc-data](https://github.com/akpasz/btc-data); квартальные значения сопоставлены с прямыми SEC 10-Q controls за 2026-06-30 по всем 13 текущим spot BTC trust тикерам.

**Результат:** 6/13 квартальных значений совпадают с filing-verified controls (для GBTC и Grayscale Mini BTC — на доступной в extractor точности 6 знаков после запятой). У 7/13 тикеров нет значения на 2026-06-30: FBTC, BITB, HODL, BTCO, BRRR, BTCW и MSBT. FBTC помечен в extractor как `status=ok`, хотя требуемая квартальная строка отсутствует; значит, один лишь статус extractor нельзя считать доказательством полноты. В daily-файле всего 162 наблюдения по пяти тикерам (IBIT, ARKB, BITB, HODL, OBTC), диапазон — конец августа/сентябрь–16 октября 2026; контрольной даты 2026-06-30 нет. В daily payload не обнаружены per-row URL, время публикации/получения или семантика исправлений, а повторяющиеся даты/значения нельзя независимо подтвердить только по этой схеме. Подробная таблица сверки и ограничения добавлены в [матрицу источников ETF](BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md).

**Решение:** SEC/XBRL файл остаётся неполным кандидатом квартальной сверки, не заменяет первичные filing controls. Daily holdings stage остаётся **NOT DONE** до фактического сбора и проверки истории всех 13 фондов. Не восстанавливать ежедневные holdings из квартальных точек, USD flows или AUM/BTC price. Только публичные источники на текущем этапе; никаких платных API/ключей/подписок.

**Граница безопасности:** только чтение публичных файлов и изменение документации в ветке `fix/btc-readiness-registry-runtime-source`. Не изменялись runtime, registry, база данных, сценарий, оценки/вероятности; ingestion, deployment и merge не выполнялись. PR #83 остаётся Draft.


Журнал фиксирует только существенные решения, изменения контрактов/архитектуры, проверки с подтверждённым результатом, блокеры и связанные коммиты/PR. Мелкие действия, повторные проверки без нового результата и планы как выполненные работы не записываются.

Запись означает только указанный результат. Исследовательские кандидаты не считаются принятыми production-данными; успешная CI-проверка не означает деплой или разрешение на запись в production.

## 2026-10-16 — дополнена первичная сверка Grayscale Bitcoin Mini Trust

**Действие:** изучен официальный SEC 10-Q Grayscale Bitcoin Mini Trust за 2026-Q2; добавлены данные в матрицу источников.

**Результат:** на 2026-06-30 в отчёте указаны 122,749,963 акции, principal-market NAV/share $25.98, net assets $3.189 млрд и 54,280.40050138 BTC. На обложке того же отчёта отдельно указан более поздний share count 133,199,963 на 2026-07-30; даты не смешиваются. Это периодическая первичная сверка, не ежедневный поток. Матрица обновлена commit `512ee36d39ad968a1a86ca8ffc4a45cb0d4500b1`.

**Ограничения:** ежедневная история и права на систематическое архивирование не подтверждены; сбор не выполнялся, registry не менялся, BTC остаётся `not_evaluable`.

## 2026-10-16 — исправлена ссылка и актуальная дата отчётности ARKB

**Действие:** повторно проверена строка ARKB в матрице после синхронизации с последним квартальным SEC отчётом.

**Результат:** строка ARKB приведена к SEC 10-Q за 2026-Q2: 97,015,000 акций, NAV/share $19.47 и net assets $1.889 млрд на 2026-06-30. Матрица исправлена commit `1d88209b7bb1a4654132fcb1be753ba4ac4b5c72`. Ежедневный ряд потоков и права на систематическое архивирование по-прежнему не подтверждены.

## 2026-10-16 — уточнены последние квартальные данные SEC для ARKB и BTCO

**Действие:** проверены официальные SEC 10-Q за 2026-Q2 для ARKB и BTCO; уточнены строки матрицы первичных ETF источников.

**Результат:** ARKB на 2026-06-30: 97,015,000 акций, NAV/share $19.47, net assets $1.889 млрд. BTCO на 2026-06-30: 5,370,000 акций, NAV/share $58.81, net assets $315.789 млн, holdings 5,345 BTC; квартальные операции BTCO — покупки 140,000 акций и погашения 1,510,000 (net -1,370,000 акций). SEC документы дают полезную квартальную сверку, но не полный ежедневный ряд потоков. Матрица обновлена commit `899ea29554f2502ce783f31ae64a8f4c3052d287`.

**Проверки CI:** VPS Build Rehearsal для commits `630f3dc`, `c0edbf6`, `f0efac5`, `b74bebb` завершились успешно (runs [#38885834201](https://github.com/olegsh247-stack/Crypto/actions/runs/38885834201), [#38885861743](https://github.com/olegsh247-stack/Crypto/actions/runs/38885861743), [#38885892752](https://github.com/olegsh247-stack/Crypto/actions/runs/38885892752), [#38885971999](https://github.com/olegsh247-stack/Crypto/actions/runs/38885971999)). Последний run включал уже завершившийся полный build-and-E2E job.

**Ограничения:** живой сбор данных не выполнялся, права на систематическое архивирование и ежедневная история не подтверждены. Источники/формула runtime не менялись; BTC остаётся `not_evaluable`.

## 2026-10-16 — уточнение первичных источников ARKB и BTCO

**Действие:** продолжена документальная проверка первичных issuer/SEC источников для ETF ARKB и BTCO; обновлена матрица покрытия.

**Результат:** ARKB: 21shares показывает датированные NAV/market price/AUM, а SEC Q1 2026 сообщает число акций на дату, но ежедневный исторический ряд shares/creation-redemption не подтверждён. BTCO: Invesco заявляет ежедневную публикацию NAV; SEC отчётность даёт периодические данные об акциях и капитальных операциях, но не подтверждает полный ежедневный ряд flow. Оба фонда оставлены как кандидаты для периодической сверки, не как принятые источники ежедневного потока. Матрица изменена commit `b74bebb3b9963b0a71539dfeab2bc0acb2bb677d`.

**Ограничения:** live endpoints не запрашивались, данные не снимались; условия систематического архивирования и ежедневная история остаются неподтверждёнными. Источники/формула в registry не менялись, BTC остаётся `not_evaluable`.

## 2026-10-16 — CI и дополнительная проверка первичного источника GBTC

**Действие:** перепроверены GitHub Actions для HEAD `9523d7be7031e92014f6281ba34579458bfcaf1a` и расширена матрица покрытия ETF по первичным источникам SEC для Grayscale GBTC.

**Результат:** VPS build-and-E2E run [#38884351373](https://github.com/olegsh247-stack/Crypto/actions/runs/38884351373) завершился успешно: проверены VPS-only ограничения, сборка API/Worker, контракты, BTC registry/provenance, идемпотентность/сверка дублей, PostgreSQL backup/restore rehearsal и E2E. Это CI rehearsal, не доказательство работающего VPS или независимого долговременного восстановления. SEC 10-Q GBTC за 2026-Q2 и Q1 подтверждают периодические NAV, активы, BTC holdings и изменения количества акций; ежедневный полный ряд flow не установлен. Страница продукта Grayscale вернула HTTP 403, поэтому неизвестные endpoint/условия хранения не предполагались. Матрица обновлена отдельным commit `630f3dc58eec170e2cb33c6143d309682db24ed6`.

**Ограничения:** live capture не выполнялся; ETF source contract/rights, долговременный архив и независимое восстановление не подтверждены. PR #83 остаётся Draft и не слит; BTC остаётся `not_evaluable`.

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

**Результат реализации:** writer принимает уже существующую локальную capture-директорию; не выполняет сетевые запросы, не читает API-ключи, не обращается к PostgreSQL и не оценивает сценарий. Требует явные reporting date/snapshot ID и отдельный файл прав; для каждого сохраняемого raw body требует `CLEARED` и непустой evidence reference. Проверяет SHA-256 тела, отклоняет неполный manifest, небезопасные пути/ID, credential-подобные URL-параметры и встроенные URL-учётные данные и повторное использование snapshot ID; создаёт новую директорию с manifest, архивной записью и SHA-256 checksum manifest.

**Проверки:** добавлены тесты на успешный fixture, неразрешённые права, отсутствующее тело, hash mismatch, перезапись, неполный manifest, credential-подобный URL, некорректную дату и небезопасный ID. На момент записи подтверждённый результат CI для новых тестов ещё не получен; нельзя считать этап прошедшим до проверки запуска.

**Ограничения/статус:** это реализация и тесты, а не архив реальных данных. Права на хранение сырых данных Farside/SoSoValue остаются неразрешёнными; live capture не запускался, SSD/VPS не требуются для fixture-тестов. Архив, независимый backup/restore и ETF допуск не сертифицированы; BTC остаётся `not_evaluable`. Без production-записей, ingestion, сценарных изменений, деплоя и merge.


## 2026-10-16 — усилены проверки целостности архива ETF

**Действие:** при повторном review offline archive writer выявлены два пробела в provenance-контракте: manifest мог повторять один `source_id`, а raw body мог быть сохранён без URL источника. Добавлены fail-closed проверки уникальности `source_id`, обязательного URL для каждого архивируемого raw body и отклонения обратных косых черт в имени файла; добавлен регрессионный тест на повтор источника и отсутствие URL.

**Результат:** изменения закоммичены в PR #83 (коммиты `d848aba559e20c7ac3efe10197fe63d878c521ae`, `440ebf30ae423774050465ba29bac27d74cd0669`, `39d8765bf919ff6e97d0796ebeb196de70c469e5`). Проверка CI именно для этих изменений ещё не подтверждена; не считать новые тесты пройденными до завершённого staging run.

**Ограничения:** live capture, реальный архив, production DB, ingestion, scenario evaluation/state, deployment и merge не выполнялись. Права на долговременное хранение raw Farside/SoSoValue, постоянное хранилище и независимый backup/restore остаются блокерами; BTC — `not_evaluable`.


## 2026-10-16 — подтверждён staging для усиленного ETF archive writer

**Действие:** проверен завершённый GitHub Actions run для последней версии кода archive writer с duplicate-source, обязательным source URL и защитой пути.

**Результат:** [BTC Public Source Staging #38874163877](https://github.com/olegsh247-stack/Crypto/actions/runs/38874163877) — `success`. Все шаги `validate`, включая `Test offline BTC ETF evidence archive safety gates`, завершились успешно; live-capture job был `skipped`. Это подтверждает fixture-тесты и staging-набор для commit `39d8765bf919ff6e97d0796ebeb196de70c469e5`. VPS Build & E2E для последнего документального HEAD `47495e3755aa96ff7bd96d6a10c880f49f734697` на момент проверки ещё выполняется.

**Ограничения:** CI не подтверждает права на хранение данных, реальный архив или независимое восстановление. Live capture, production writes, ingestion, scenario evaluation/state, deployment и merge не выполнялись. BTC остаётся `not_evaluable`.


## 2026-10-16 — добавлен офлайн-верификатор целостности ETF-архива

**Действие:** добавлен `scripts/verify-btc-etf-evidence-archive.mjs` и набор тестов `scripts/verify-btc-etf-evidence-archive.test.mjs`; проверка подключена к `BTC Public Source Staging (Read Only)`. Верификатор сверяет SHA-256 и длины файлов с archive record/checksum manifest, проверяет path traversal, symlink и неучтённые файлы.

**Результат на момент записи:** код и тесты закоммичены в PR #83: `b886ca97f4ded7473131a4944a52c1e7100f2d97`, `8b8bed9ff56643cc2435641d833032e476b6f80c`, `cd2bfd3ab5e8cfb08838f0bb3ee93dc06c5aee89`, `934b74505dd9c4067e9988a26e9ac1b632514884`. GitHub Actions staging для последнего commit при проверке ещё был в очереди; новые тесты пока не считать прошедшими. Обновлён контракт архива с командой проверки.

**Ограничения:** верификатор проверяет целостность одной локальной копии; он не создаёт независимую резервную копию и не доказывает восстановление с другого failure domain. Реальные источники не захватывались, архив не создавался, права Farside/SoSoValue не подтверждены, BTC остаётся `not_evaluable`. Без production writes, ingestion, scenario changes, deployment и merge.


## 2026-10-16 — исправлена ошибка первого прогона verifier

**Проверка и результат:** первый staging run `#38876064841` завершился `failure`: рекурсивная проверка дерева ошибочно классифицировала обязательный `checksums.sha256` как неучтённый файл. По журналу job выяснено, что остальные проверки archive writer прошли, а 3 из 4 новых verifier-тестов прошли; упал только тест валидного снимка из-за этой ошибки верификатора.

**Исправление:** отдельное исключение добавлено для самого `checksums.sha256` при обходе дерева; все остальные неучтённые файлы по-прежнему запрещены. Коммит `a51ae5b700c572fe076d8641b860f7022cee8d5a`. Повторный staging run `#38876188724` запущен и на момент записи ещё выполняется — исправление не считать подтверждённым до его результата.


**Дополнительная проверка CI:** повторный run `#38876188724` также завершился `failure`: после исправления `checksums.sha256` верификатор обнаружил, что writer всегда создаёт каталог `normalized/`, даже когда в нём нет нормализованного файла. Это ожидаемая структура текущего writer, а не лишний файл. Верификатор скорректирован и теперь разрешает предусмотренные каталоги `source/` и `normalized/`, сохраняя проверку всех файлов внутри них. Fix commit: `9d8dd88a2e6e41965d05302e263a4fc3a46e396b`. Новый staging run ожидается; успех ещё не подтверждён.


## 2026-10-16 — подтверждён CI для offline archive verifier

**Результат:** [BTC Public Source Staging #38876268169](https://github.com/olegsh247-stack/Crypto/actions/runs/38876268169) — `success` для кода verifier `9d8dd88a2e6e41965d05302e263a4fc3a46e396b`. Успешны оба шага — archive writer safety tests и archive integrity/recovery verifier tests; job `capture` пропущен. Это подтверждает локальные fixture-сценарии целостности/повреждения/отсутствующего файла/path traversal, но не реальный backup/restore.

**Статус:** verifier теперь проходит staging. PR #83 остаётся Draft. Права на raw-retention, фактическое частное хранилище и независимый encrypted backup/restore не закрыты; live capture не запускался, BTC остаётся `not_evaluable`.


## 2026-10-16 — добавлена fixture-репетиция восстановления архива

**Действие:** в verifier tests добавлен сценарий, который копирует сформированный fixture-снимок в отдельный каталог восстановления и запускает полный verifier уже на восстановленной копии. Используется только временная директория CI; реальные данные, сеть, VPS и SSD не задействуются.

**Результат на момент записи:** тест добавлен коммитом `e236bc53d512824e825f6c81f7efab0a1d34e24d`. Staging run для нового теста ожидается; пока он не завершится успешно, тест не считать подтверждённым.

**Ограничения:** это репетиция копирования и checksum-проверки в рамках одного CI runner, не независимый backup/restore в отдельном failure domain. Права на хранение raw-источников остаются блокером; BTC остаётся `not_evaluable`.


**Подтверждение CI:** [BTC Public Source Staging #38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752) завершился `success` для коммита `e236bc53d512824e825f6c81f7efab0a1d34e24d`. Успешны archive writer safety tests и полный набор verifier tests, включая копирование fixture-снимка в отдельный каталог и проверку восстановленной копии. Live capture пропущен. Подтверждена только тестовая репетиция в рамках одного CI runner, не независимый backup/restore.


## 2026-10-16 — обновлена проверка прав источников ETF

**Действие:** повторно проверены публичная лицензия TFTC и официальные условия SoSoValue; повторно проверена официальная страница ETF Farside.

**Результат:** TFTC явно разрешает цитирование, графики и повторную публикацию набора под CC BY 4.0 с атрибуцией/ссылкой. Официальные условия SoSoValue запрещают автоматическое и ручное копирование/мониторинг материалов сайта без разрешения и ограничивают воспроизведение/распространение; это не заменяет отдельные API-условия, которые пока не подтверждены. Страница Farside не устанавливает явную лицензию на долговременное хранение/распространение raw-ответов. Поэтому для архива наиболее чистый кандидат — TFTC с атрибуцией; SoSoValue raw и Farside raw остаются заблокированы до подтверждения применимых прав. Зафиксировано в source review.

**Ограничения:** никаких API-запросов, ключей и live captures не было. Это проектная проверка рисков, не юридическое заключение. BTC остаётся `not_evaluable` до стабильности снимков, проверки хранилища/восстановления и человеческого решения.


## 2026-10-16 — проверены альтернативные источники потоков BTC ETF

**Действие:** дополнительно изучены официальные условия CoinGlass API и The Block, помимо ранее рассмотренных TFTC, SoSoValue, Farside, CryptoETF.today, Newhedge и SatoshiMacro. Результат записан в [обновлённый обзор альтернативных источников](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md). Для TFTC оформлен отдельный [контракт архивирования набора данных](BTC-TFTC-ETF-DATASET-ARCHIVE-CONTRACT-2026-10-16.md).

**Результат:** CoinGlass документирует ETF history API с дневным USD flow и разбивкой по фондам, но условия запрещают без предварительного письменного согласия массовое хранение для независимой базы и распространение данных/производных данных. The Block публикует дневной USD-график, однако его условия запрещают систематический автоматизированный сбор и ограничивают перепубликацию. Ни один из них не разрешён для автоматического долговременного raw-архива на основании рассмотренных публичных условий. TFTC остаётся самым ясно лицензированным кандидатом для атрибутированного исследовательского артефакта по CC BY 4.0, но текущая lineage пересекается с SoSoValue, а историческая — с Farside; независимым третьим голосом TFTC не становится.

**Статус и ограничения:** изменены только документация и source review; source registry, canonical priority, формула arithmetic_mean_2_sources и BTC readiness не менялись. Не выполнялись API-запросы, scraping, live capture, production writes, ingestion, scenario evaluation/state, deployment или merge. BTC остаётся not_evaluable; durable archive и independent backup/restore не готовы.


## 2026-10-16 — четыре следующих ETF-гейта по Плану 100

**Действие:** зафиксирован порядок дальнейшей работы: (1) TFTC остаётся лицензированным исследовательским кандидатом, не заменой канонического источника; (2) завершён контракт метаданных/атрибуции и офлайн-архива; (3) проверка публикаций, ревизий и стабильности выполняется через два снимка минимум с интервалом 24 часа и неизменные полные строки; (4) один BTC research-сценарий допускается только после успешного eligibility-отчёта и отдельного одобрения человека. Подробности записаны в `docs/PLAN-100-ETF-SNAPSHOT-RECHECK-2026-10-16.md`.

**Результат:** документальные и fixture-проверки подтверждают воспроизводимость офлайн-сравнения, но реальная стабильность данных ещё не проверена. TFTC сообщает о двукратном ежедневном обновлении и исправлении недавних/старых строк, но не даёт гарантированного row-level revision ID или точки финализации. Farside raw-retention rights не подтверждены; частный долговременный архив и независимое восстановление не развернуты; реальный capture в этом шаге не запускался. Поэтому гейт 3 остаётся заблокирован на реальных снимках, гейт 4 не выполнялся, BTC остаётся `not_evaluable`.

**Безопасность:** не было API-запросов, scraping, live capture, DB-доступа/записей, ingestion, оценки сценария, изменения реестра/сценарного состояния/вероятностей, deployment или merge. Не считать fixture restore доказательством независимого резервного восстановления.


## 2026-10-16 — подтверждён VPS Build & E2E для текущего ETF-документального HEAD

**Действие:** повторно проверен завершённый GitHub Actions run для commit `3e1e733b5c217d948358d8b3eee21de8112b641a`.

**Результат:** [VPS Build & E2E #38878927759](https://github.com/olegsh247-stack/Crypto/actions/runs/38878927759) — `success`. Успешно завершились VPS-only архитектурная проверка, сборки shared runtime/API/Worker и контейнеров, контрактные E2E API/Worker, проверка канонического BTC input registry, read-only provenance audit, репетиция idempotency/duplicate reconciliation и PostgreSQL backup/restore в CI.

**Границы доказательства:** это успешная CI-репетиция, не подтверждение работы на предоставленном пользователю VPS, не реальный долговременный ETF-архив и не независимое восстановление в другом failure domain. ETF live capture не запускался; права на raw-retention Farside/SoSoValue, частное хранилище и независимый restore остаются блокерами. BTC остаётся `not_evaluable`; scenario state/probability, production DB, ingestion, deployment и merge не менялись.


## 2026-10-16 — проверены условия ещё одного кандидата ETF flows

**Действие:** изучены текущая страница датасетов ByKaranteli и Terms of Service, обновлённые 2026-10-15; результат добавлен в обзор альтернативных ETF-источников.

**Результат:** ByKaranteli публикует дневные агрегированные и per-fund ETF flows, указывает закрытые US trading days как finalized и отдельно показывает issuer-derived сравнение IBIT/XRPC. Однако условия разрешают личное/исследовательское использование с атрибуцией, одновременно запрещая систематически копировать API-архив в заменяющую базу/архив; права на сторонние provider records остаются у соответствующих источников. Upstream lineage агрегированных строк также не полностью установлен. Поэтому источник не cleared для требуемого долговременного raw-архива без письменного уточнения; он остаётся методологическим кандидатом, а не заменой текущей пары.

**Ограничения:** API key не запрашивался, endpoint не вызывался, capture и архивирование не выполнялись. Источник не меняет реестр, приоритет, формулу `arithmetic_mean_2_sources` или readiness; BTC остаётся `not_evaluable`.


## 2026-10-16 — уточнён блокер лицензии ByKaranteli и проверен issuer-primary путь

**Действие:** дополнительно сопоставлены Terms of Service/API-лицензия ByKaranteli с моделью долговременного архива проекта; просмотрены официальная страница IBIT BlackRock, котировка FBTC Fidelity и SEC quarterly report Fidelity Wise Origin Bitcoin Fund. Обновлён [обзор ETF-источников](BTC-ETF-ALTERNATIVE-SOURCE-REVIEW-2026-10-16.md).

**Результат:** ByKaranteli допускает personal/research use с атрибуцией, но запрещает систематически копировать API-архив в заменяющее хранилище; third-party records отдельно остаются под условиями исходных поставщиков. Для планируемой пары сохранённых снимков этого недостаточно, поэтому durable capture остаётся заблокированным без письменного разрешения. Официальные страницы BlackRock/Fidelity показывают некоторые dated NAV/share-count поля, а SEC — периодические сведения, но пока не подтверждён полный единообразный daily historical feed для всего ETF-universe. Это направление для fund-by-fund coverage matrix, не готовая замена агрегатору.

**Ограничения:** только исследование публичной документации. API не вызывались, данные не захватывались, права/источники/формула в реестре не менялись. BTC остаётся `not_evaluable`.


## 2026-10-16 — создана первичная матрица официальных ETF-источников

**Действие:** проведён первый проход по публичным страницам эмитентов и SEC; создана [матрица покрытия official issuer sources](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md) для ETF universe.

**Результат:** по IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC и Grayscale Mini BTC найдены отдельные официальные страницы/документы с частью NAV, AUM, shares-outstanding или holdings полей, но полный одинаковый daily historical series и разрешённый автоматизированный retention ещё не подтверждены для всего universe. Важная коррекция состава: SEC filings establish 2026-08-17 as Hashdex DEFI's last trading day; DEFI must not be included in the active trading aggregate after that date. The 2026-09-03 Form 15 is a later reporting-termination filing, но исторические строки до закрытия требуют сохранения.

**Решение:** матрица — исследовательский инвентарь, не утверждённый источник и не готовый расчёт net flows. Изменение net assets не считать net flow без approved methodology; реестр и формула не менялись. Следующий шаг — уточнить точные официальные ежедневные поля/историю для оставшихся фондов и правила даты/creation-redemption. Live capture и сценарий не запускались; BTC остаётся `not_evaluable`.


## 2026-10-16 — исправлен активный universe BTC ETF: добавлен MSBT

**Действие:** проверены официальный запуск Morgan Stanley Bitcoin Trust, его SEC Q2 2026 10-Q и официальный BITB product page; обновлена матрица ETF issuer-source coverage.

**Результат:** обнаружен пропущенный активный фонд MSBT, торгуется с 2026-04-08. SEC сообщает на 2026-06-30: 17,650,000 акций, NAV/share $16.94, net assets $298,979,473 и 5,059.30771216 BTC; cover отдельно сообщает 21,740,000 акций на 2026-07-31. За период с запуска до конца Q2 раскрыты 17,900,000 выпущенных и 250,000 погашенных акций. Это периодические сведения, не ежедневный flow series. Для BITB зафиксированы 68,780,000 shares и AUM $3,047,421,621 на 2026-10-13, NAV $45.11 на 2026-10-12 и 37,317.87 BTC на 2026-10-13; полная ежедневная история shares/creation-redemption и права систематического хранения не подтверждены.

**Решение:** включать MSBT с даты запуска, исключать DEFI из active trading aggregate после 2026-08-17, сохраняя исторические данные до delisting. Реестр, приоритет источников, формула и evaluator не менялись. Не выполнялись API-запросы, live capture, production writes, ingestion, scenario evaluation/state/probabilities, deployment или merge. BTC остаётся `not_evaluable`; PR #83 Draft.

**Ссылки:** [матрица источников](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md); [Morgan Stanley SEC 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm); [Bitwise BITB](https://bitbetf.com/).


## 2026-10-16 — усилена первичная сверка ETF по SEC Q2: IBIT, FBTC, BITB

**Действие:** проверены официальные SEC 10-Q за квартал, завершившийся 2026-06-30, для IBIT, FBTC и BITB; матрица issuer-primary source coverage обновлена.

**Результат:** IBIT на 2026-06-30 — 1,296,040,000 акций, NAV/share $33.48, net assets $43.386012125 млрд, 734,261 BTC; отчёт отдельно раскрывает 187,360,000 погашенных акций за Q2 с помесячной разбивкой. FBTC на 2026-06-30 — 200,328,476 акций, NAV/share $51.44, net assets $10.304103 млрд и 174,383 BTC; cover отдельно указывает 197,403,476 акций на 2026-07-31. BITB на 2026-06-30 — 66,690,000 акций, NAV/share $31.87, net assets $2.125612 млрд и 36,207.6919 BTC; официальный сайт отдельно показывает более поздние значения на 2026-10-12/13. Даты наблюдений не смешивать.

**Решение:** первичные квартальные отчёты усиливают reconciliation, но не закрывают daily flow series для полного active universe. Не считать изменение AUM потоком; не менять registry, priority, формулу или evaluator. Capture, production writes, ingestion, scenario evaluation/state/probabilities, deployment и merge не выполнялись. BTC остаётся `not_evaluable`.

**Источники:** [матрица](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md); [IBIT SEC Q2](https://www.sec.gov/Archives/edgar/data/1980994/000143774926026004/bit20260630c_10q.htm); [FBTC SEC Q2](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm); [BITB SEC Q2](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm).


## 2026-10-16 — уточнён блокер DXY: ICE DXY не равен индексу ФРС

**Действие:** проверены официальная документация ICE по DXY и методология Федеральной резервной системы по nominal broad dollar index. Создан [обзор контракта DXY](BTC-DXY-SOURCE-CONTRACT-REVIEW-2026-10-16.md).

**Результат:** ICE DXY — фиксированный геометрический индекс шести валют (EUR 57.6%, JPY 13.6%, GBP 11.9%, CAD 9.1%, SEK 4.2%, CHF 3.6%); ICE перечисляет дневную/внутридневную историю, но условия и разрешённый путь для durable retention проекта ещё не подтверждены. Fed/FRED `DTWEXBGS` — ежедневный broad trade-weighted index на базе 2006=100 с более широким набором торговых партнёров и пересматриваемыми весами; это не DXY и не может быть тихой заменой.

**Решение:** сначала проверить, какой именно индекс уже определён каноническим BTC metric contract. Если ICE DXY — нужно подтвердить легальный/доступный feed, retention rights, close timestamp и revision semantics. Если нужен Fed broad index, смена метрики требует отдельного reviewed решения. Registry и scenario logic не менялись; capture, DB writes, ingestion, scenario evaluation, deployment и merge не выполнялись. BTC остаётся `not_evaluable`.

**Источники:** [ICE DXY](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices); [Fed methodology](https://www.federalreserve.gov/econres/notes/feds-notes/revisions-to-the-federal-reserve-dollar-indexes-20190115.html); [FRED DTWEXBGS](https://alfred.stlouisfed.org/series?seid=DTWEXBGS).


## 2026-10-16 — коррекция: DXY не блокирует первый BTC-сценарий

**Уточнение:** при сверке действующей документации обнаружено, что прежнее решение о DXY как optional context уже принято в `BTC-DXY-CANONICAL-SOURCE-REVIEW-2026-10-16.md`. Новая исследовательская заметка не должна переоткрывать этот вопрос. Обновлён `BTC-DXY-SOURCE-CONTRACT-REVIEW-2026-10-16.md` и создано [дополнение к Плану 100](PLAN-100-DXY-OPTIONAL-CONTEXT-CORRECTION-2026-10-16.md), которое явно фиксирует приоритет канонического решения.

**Результат:** DXY — необязательный контекст; если недоступен, пропускаем его и продолжаем первый BTC-сценарий. Yahoo `DX-Y.NYB` — только ручной reference; Fed `DTWEXBGS` — отдельная метрика, не DXY. ETF gate остаётся отдельным блокером. Registry, source priority и сценарий не менялись; capture, DB writes, ingestion, evaluation, deployment и merge не выполнялись.


## 2026-10-16 — найдены квартальные SEC контрольные точки HODL, BRRR и BTCW

**Действие:** проверены SEC Q2 2026 10-Q для VanEck HODL, CoinShares BRRR и WisdomTree BTCW. Подготовлено отдельное дополнение к Плану 100: [ETF SEC cross-check HODL/BRRR/BTCW](PLAN-100-ETF-SEC-CROSSCHECK-HODL-BRRR-BTCW-2026-10-16.md).

**Результат:** HODL на 2026-06-30 — 57,425,000 акций, NAV/share $16.70, net assets $958,827,545, 16,241 BTC; за Q2 создано 3,200,000 и погашено 5,900,000 акций. BRRR — 20,795,000 акций, NAV/share $16.46, net assets $342,354,115 и 5,864 BTC на 2026-06-30; cover отдельно сообщает 20,895,000 акций на 2026-07-30. BTCW — 2,185,000 акций, NAV/share $62.46, net assets $136,476,680 на 2026-06-30; SEC отдельно показывает округлённые holdings 2,310 BTC и 2,309.689 BTC в контексте другого метода оценки, поэтому эти значения нельзя схлопывать без сохранения методики.

**Решение:** отчёты полезны для периодической сверки, но не доказывают полный daily creations/redemptions feed и права долговременного архива. Не вычислять flows из изменения AUM, не менять registry/formula/evaluator; capture и сценарная оценка не выполнялись. BTC остаётся `not_evaluable` до закрытия отдельного ETF gate.


## 2026-10-16 — усилена SEC-сверка ETF для EZBC (Franklin Bitcoin ETF)

**Действие:** проверен SEC Q2 2026 Form 10-Q Franklin Bitcoin ETF и сопоставлен с официальной продуктовой страницей; уточнена строка EZBC в матрице официальных источников и дополнение к Плану 100.

**Результат:** на 2026-06-30 раскрыты 9,800,000 акций, NAV/share $34.15, net assets $334,694,929 и 5,664.0163 BTC. За Q2 выпущено 150,000 и погашено 1,250,000 акций. Это периодическая первичная контрольная точка, но не полный daily creations/redemptions series. Маркировка страницы “Updated Daily” сама по себе не доказывает полную машинно-читаемую ежедневную историю, семантику исправлений или право долговременного хранения.

**Решение:** EZBC остаётся кандидатом для периодической сверки, не источником ежедневных flows. Не рассчитывать flows из изменения AUM, не менять registry/formula/evaluator и не запускать capture. BTC остаётся `not_evaluable`; live capture, ingestion, production writes, scenario evaluation/state/probabilities, deployment и merge не выполнялись.

**Источники:** [SEC Q2 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm); [Franklin product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS); [матрица источников](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md).


## 2026-10-16 — повторно проверены две BTC/ETF CI-репетиции

**Действие:** проверены фактические job/step-результаты GitHub Actions для [ETF-сверки HODL/BRRR/BTCW #38890141384](https://github.com/olegsh247-stack/Crypto/actions/runs/38890141384) и [синхронизации матрицы #38890191351](https://github.com/olegsh247-stack/Crypto/actions/runs/38890191351).

**Результат:** обе проверки завершились со статусом `completed / success`. В каждой успешно выполнен `build-and-e2e`, включая VPS-only guard, сборки API/Worker, проверку реестра BTC inputs, read-only provenance audit, репетицию идемпотентности/дубликатов, PostgreSQL backup/restore rehearsal и API/E2E-контракты. Это CI-репетиции; они не доказывают восстановление реального production-набора или готовность постоянного внешнего архива.

**Текущее решение:** PR #83 по-прежнему открыт Draft и не объединён. По его актуальному описанию, новая проверка архива имеет отдельное ограничение: source rights, долговременное хранилище и независимое восстановление остаются незакрытыми. Данные источников в runtime-реестре не принимались; live capture, production writes, ingestion, scenario evaluation/state/probabilities и deployment не выполнялись. BTC остаётся `not_evaluable`.

**Следующий шаг по Плану 100:** продолжить проверку оставшихся первичных источников по каждому фонду, отдельно фиксируя ежедневную полноту, дату наблюдения против времени публикации/получения, историю исправлений/finality и разрешение на долговременное хранение. Не вычислять flows из изменения AUM и не считать квартальные SEC-отчёты заменой ежедневному ряду.


## 2026-10-16 — подтверждены API rehearsal и offline ETF archive tests

**Действие 1 — проверка актуального CI.** Проверен [VPS API Build Rehearsal #38892524739](https://github.com/olegsh247-stack/Crypto/actions/runs/38892524739) на HEAD `c1ea990a393580f92eb4bb1bd17451295b97e416`. Job `build-and-e2e` — `completed / success`; все 29 шагов прошли, включая VPS-only guard, сборки API/Worker, canonical BTC input registry, read-only provenance, idempotency/duplicate reconciliation, PostgreSQL backup/restore rehearsal и API/E2E-контракты.

**Действие 2 — проверка staging-тестов архива.** Проверен [BTC Public Source Staging #38876362752](https://github.com/olegsh247-stack/Crypto/actions/runs/38876362752): `validate` — `success`; успешно выполнены тесты Farside parser, BTC candidates, ETF snapshot diff, eligibility policy, SoSoValue normalizer, archive safety и archive integrity/recovery verifier; live `capture` — `skipped`. Blob SHA пяти связанных файлов архиватора/verifier/diff-test сопоставлены между tested HEAD `e236bc53d512824e825f6c81f7efab0a1d34e24d` и текущей веткой — идентичны.

**Действие 3 — проверка ограничений архива.** Подтверждено, что writer работает офлайн, требует явную reporting date/snapshot ID и rights evidence со статусом `CLEARED`, проверяет raw-body SHA-256 и отказывается перезаписывать существующий snapshot. Verifier проверяет контрольную запись, checksum manifest, хеши/размеры файлов, symlinks и посторонние файлы. Fixture copy/restore тест выполняется внутри CI runner и не является доказательством независимого backup/restore.

**Действие 4 — повторная проверка source rights и lineage.** TFTC dataset можно рассматривать для атрибутированного исследования по CC BY 4.0 с сохранением upstream lineage; это не независимый источник SoSoValue/Farside. Raw SoSoValue и Farside payloads не архивировать без отдельного подтверждения прав на долговременное хранение. Публичность страницы не считается лицензией.

**Действие 5 — статус и дальнейший барьер.** Обновлён План 100 с результатами CI и границей доказательств. Ни durable private archive, ни независимый encrypted backup/restore ещё не операционны; retention policy не утверждена. Не выполнялись live capture, ingestion, production writes, source registry/evaluator изменения, scenario evaluation/state/probabilities, deployment или merge. PR #83 остаётся open Draft; BTC остаётся `not_evaluable`. Следующий этап: определить минимальный срок хранения/владельца/частоту restore-check, закрыть права источников и спроектировать проверяемый независимый failure-domain restore — без создания live архива до выполнения gate.


## 2026-10-16 — продолжена проверка TFTC и первичного источника BITB

**1. TFTC — повторная проверка публичной страницы.** Просмотрена страница https://www.tftc.io/bitcoin-etf-flows без загрузки JSON и без capture. TFTC заявляет открытый JSON с полной ежедневной историей по каждому фонду с момента запуска и разрешает цитирование, графики и повторную публикацию по CC BY 4.0 при указании источника и ссылки. На странице указано, что данные отстают примерно на день, поскольку эмитенты публикуют отчёты после закрытия рынка; credit line на момент проверки указывала данные по 2026-10-14.

**2. Граница доказательств TFTC.** Это подтверждает заявленный доступ к daily series и лицензионную основу для атрибутированного исследования, но не доказывает полноту каждой строки, время публикации конкретной строки, immutable revision ID, точку finality или отсутствие поздних исправлений. TFTC указывает upstream lineage, включающий SoSoValue и исторические раскрытия эмитентов, сведённые Farside; TFTC не является независимым источником против этих upstream.

**3. BITB — первичная страница Bitwise.** Проверены публичная страница фонда и materials index: присутствуют датированные снимки shares outstanding/NAV/net assets/holdings и ссылки на SEC filings, включая Q2 2026. В рамках проверки не установлена полная воспроизводимая ежедневная историческая серия shares/creations/redemptions, семантика исправлений по строкам или разрешение на долговременное автоматизированное хранение raw page. Датированный текущий блок не считается ежедневным историческим рядом.

**4. Решение по данным.** TFTC сохраняется кандидатом для атрибутированного research series, BITB — для периодической сверки. Ни один источник не повышен до canonical daily net-flow source; flows из изменений AUM не вычисляются; реестр, формула и evaluator не менялись.

**5. Безопасность и следующий блокер.** Не скачивались JSON/issuer payloads, не создавался реальный архив, не выполнялись live ingestion, production writes, scenario evaluation, deployment или merge. Следующий этап: определить владельца архива, минимальный срок хранения и периодичность restore-check; после закрытия этих условий — спроектировать ограниченную офлайн-проверку покрытия/исправлений TFTC без помещения сырых SoSoValue/Farside данных в TFTC-архив. PR #83 open Draft; BTC остаётся `not_evaluable`.

**Источники:** https://www.tftc.io/bitcoin-etf-flows ; https://bitbetf.com/ ; https://bitbetf.com/materials


## 2026-10-16 — оформлена матрица решений по хранению архива BTC ETF

**Действие:** создан документ `docs/BTC-ETF-ARCHIVE-RETENTION-DECISION-SHEET-2026-10-16.md`, commit `194633ea911cfe3db50b1e6a0af006d9e9611c48`; План 100 обновлён commit `0ce795d56d2237677259be9f114162bdb9577919`.

**Результат:** отделены подтверждённые факты от неутверждённых решений: владелец архива и восстановления, минимальный срок хранения, правила удаления с учётом ссылок на snapshots, cadence проверки восстановления, независимое место backup и source-specific права. Без этих решений нельзя называть архив операционным или удалять доказательства автоматически. Это decision sheet, а не утверждённая эксплуатационная политика; срок хранения и cadence не придуманы.

**Границы:** реальный архив не создавался, SSD не предполагался доступным, live capture/ingestion/production writes не запускались. Не менялись registry, source priority, formula/evaluator, scenario state/probabilities; deployment и merge не выполнялись. PR #83 остаётся Draft; BTC остаётся `not_evaluable`.


## 2026-10-16 — документирован Newhedge как дополнительный ETF-flow кандидат

**Действие:** изучены публичные API-описания Newhedge для fund-reported ETF flows в USD, on-chain flows и общие правила revision/publication. Обзор источников обновлён commit `d869cf90e365eefa5a6760049c24c5173f127b61`; План 100 обновлён commit `0b978e67a25ac14d200e1b371f2927c03ce7f66e`.

**Результат:** у fund-reported ряда документированы USD, US trading-day calendar, семидневное окно возможных пересмотров и заявленное Newhedge правило задержки/финализации. On-chain flows явно отделены: их `full_replace` допускает пересмотр любой даты, поэтому они не являются тем же показателем. Это полезный дополнительный кандидат для сверки и изучения семантики, но не доказательство времени публикации Farside/TFTC.

**Ограничения/следующий шаг:** API требует token; live запрос не выполнялся. Права на хранение/повторное использование, coverage, universe, точная сверка и полный provenance ещё не проверены. 00:00 UTC — метка торговой даты, не publication timestamp. Token не запрашивался и в репозиторий не помещался. Canonical priority, реестр, метод `arithmetic_mean_2_sources`, production data и scenario state не менялись; PR #83 остаётся Draft, BTC — `not_evaluable`.


## 2026-10-16 — Newhedge API terms checked; rights gate remains blocked

**Действие:** проверены официальные Newhedge Terms & Conditions и общая API-документация: https://newhedge.io/terms-and-conditions ; https://docs.newhedge.io/api .

**Результат:** общие условия описывают personal/noncommercial доступ, запрещают копирование/зеркалирование и распространение контента без разрешения, а также запрещают автоматизированное извлечение/scraping/mining. В просмотренных материалах не найдено отдельного API-разрешения на автоматический сбор и длительное хранение raw responses. Поэтому наличие API token само по себе не закрывает права.

**Решение/границы:** Newhedge — технически подходящий кандидат для отдельно маркированной сверки, но юридико-договорный gate не пройден. Не вызывали API, не запрашивали и не сохраняли token, не архивировали данные. Нужны явные API-условия или письменное разрешение на automated research access, retention, backup/restore и использование производных значений. Не менялись source priority, registry, arithmetic_mean_2_sources, evaluator, production data или scenario state. PR #83 остаётся open Draft; BTC остаётся not_evaluable.


## 2026-10-16 — проверен CryptoETF.today как ещё один ETF API-кандидат

**Действие:** изучены API-страница, reference и Terms of Service: https://cryptoetf.today/en/api ; https://docs.cryptoetf.today/ ; https://cryptoetf.today/en/terms .

**Результат:** API заявляет daily aggregate и per-fund USD flows, T+1 публикацию и возможность пересмотра последнего дня; free API ограничен 30 днями. Условия запрещают воспроизводить/распространять содержимое и создавать derivative works без предварительного письменного разрешения. Явное разрешение на архив raw responses и downstream use не установлено. BTC-агрегат строится через aggregators; независимость от Farside/TFTC не доказана.

**Границы:** CryptoETF.today добавлен только как кандидат. API не вызывали, ключ не запрашивали, данные не архивировали. Требуется письменное подтверждение rights + bounded reconciliation состава фондов, null/zero и upstream lineage. Не менялись source priority, registry, formula/evaluator, production data или scenario state. PR #83 open Draft; BTC not_evaluable.


## 2026-10-16 — ByKaranteli reviewed as bounded manual comparison candidate

**Действие:** изучены live ETF dataset и Terms of Service ByKaranteli (last updated 2026-10-15): https://bykaranteli.com/data ; https://bykaranteli.com/terms .

**Результат:** documented API automation is allowed within rate limits, but systematic copying of its archive into a substitute database/archive/service is prohibited. Its research-use licence covers ByKaranteli's own computed data, not third-party source values; those remain under original-source terms. ETF page reports aggregate backfill from 2025-05-20 and per-fund recording since 2026-07-30, but identifies issuer pages and a public flow tracker as inputs. The frozen CC0 mirror is stale and CC0 does not cover third-party values.

**Решение/границы:** possible small manual comparison with attribution only after checking upstream rights and lineage; not canonical, not approved for bulk download or durable archive. No API request/key/capture. No source promotion, registry/formula/evaluator or scenario-state change. PR #83 remains open Draft; BTC remains not_evaluable.


## 2026-10-16 — XOOMAR and Bitcoin-data.com ETF candidate review

**Action:** reviewed public ETF dataset/API documentation and terms pages; documented source semantics, coverage, rights and remaining blockers in the alternative-source review and Plan 100.

**Findings:** XOOMAR currently lists BTC ETF holdings-derived data for IBIT, BITB and ARKB only, with incomplete coverage and short history. Its USD flow is computed from day-over-day BTC holdings changes times its own reference price, so it is not equivalent to a fund-reported USD flow; terms allow internal research/storage with attribution but prohibit redistribution/competing dataset use, and third-party issuer-data terms remain applicable. Bitcoin-data.com Swagger advertises daily per-fund flow in BTC for 12 funds since 2024-01-11, but upstream lineage, method, publication/finality/revision fields, and license/retention/backup rights could not be verified from the reviewed documentation.

**Outcome:** neither source promoted to canonical or automated ingestion. XOOMAR may be considered only for bounded internal comparison after unresolved method/upstream-rights checks. Bitcoin-data.com remains blocked pending provenance, methodology, revision and license/retention clarification; no USD conversion made. No API endpoint was called, no key requested/stored, and no data captured.

**Guardrails preserved:** no source-priority, registry, formula/evaluator, production data, or scenario-state changes; BTC remains not_evaluable. PR #83 remains Draft/open/unmerged. CI for prior head aea7a5242f8c88dfa2ce40e06415d3b16ecf34b3 passed build-and-e2e; this new documentation commit requires its own CI confirmation.

## 2026-10-16 — BGeometrics / Bitcoin-data.com rights review

**Action:** reviewed the official BGeometrics terms and the public ETF endpoint description; added the rights and technical gates to the alternative-source review and Plan 100.

**Result:** the API advertises daily per-fund ETF flows in BTC for 12 funds since 2024-01-11, but the terms describe the free API as intended for personal/research/evaluation, prohibit bulk scraping/harvesting without written permission, and apply separate commercial publishing/redistribution restrictions. The reviewed terms do not explicitly authorize systematic historical capture and private durable raw-response archiving/restore for this use case. Upstream lineage, calculation methodology, publication timestamps and revision/finality behavior also remain unverified.

**Decision:** do not call the API, request/store a key, capture data, promote the source or automate ingestion until written rights clarification and technical contract details are obtained. No USD conversion. No registry/formula/evaluator, production data or scenario-state change. BTC remains not_evaluable; PR #83 remains Draft/open/unmerged.


## 2026-10-16 — подготовлены вопросы поставщикам ETF-данных

**Действие:** подготовлен внутренний документ `docs/BTC-ETF-PROVIDER-CLARIFICATION-QUESTIONS-2026-10-16.md` с адресными вопросами BGeometrics/Bitcoin-data.com, XOOMAR, Farside и SoSoValue.

**Результат:** вопросы покрывают разрешённую частоту автоматических запросов, хранение raw responses и metadata/hash, retention, закрытый backup/restore, права на производные значения, upstream lineage, единицы и знак, universe фондов, timestamp публикации, null/zero semantics и revisions/finality. Для XOOMAR отдельно запрошены точный ценовой источник и timestamp оценки holdings-based USD flow; для Bitcoin-data.com — отдельный контракт конвертации BTC в USD.

**Статус:** только подготовка — вопросы не отправлены. Ни API не вызывался, ни ключи не запрашивались/не сохранялись, ни данные не захватывались. Нет автоматического допуска источников, изменений registry/формулы/evaluator/production observations или scenario state. BTC остаётся `not_evaluable`; PR #83 остаётся Draft/open/unmerged.

**CI:** VPS API Build Rehearsal [#38904095808](https://github.com/olegsh247-stack/Crypto/actions/runs/38904095808) завершился успешно на commit `4e3ea1964018b77f3443c99c4aaef360ce4f77a1`. Это подтверждение CI для того снимка, не для последующих документальных изменений и не доказательство развёрнутого VPS или независимого долговременного архива.


## 2026-10-16 — SEC cross-check HODL / BRRR / BTCW включён в матрицу покрытия

**Действие:** результаты отдельной SEC Q2 2026 сверки HODL, BRRR и BTCW внесены в `docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md` отдельным evidence section (commit `e7490e47167fa91038975995bf23277752648de6`).

**Результат:** HODL: quarter-end shares/NAV/net assets/BTC holdings и квартальные выпуски/погашения отражены отдельно; BRRR: share count на 2026-06-30 отделён от cover-page count на 2026-07-30; BTCW: округлённые holdings investment schedule отделены от значения по reference-rate методологии. Ни один показатель не объявлен ежедневным потоком.

**Ограничения:** ежедневная полная история, публикационные timestamps/revision semantics и права на долговременное raw-архивирование/независимое восстановление не подтверждены. AUM delta не используется для вывода flow; live capture, registry/formula/evaluator changes, production writes и scenario evaluation не выполнялись. BTC остаётся `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — три критерия проверены по всем 12 активным BTC ETF

**Действие:** в матрицу `docs/BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md` добавлена таблица Gate 1/2/3 для IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC, Grayscale Mini BTC и MSBT (commit `7fc19fff9246ab86d361f61c3544da0b3aba46d8`).

**Результат:**
- Gate 1 (первичная датированная evidence): официальные страницы эмитентов и/или SEC-отчёты найдены по всем 12 фондам.
- Gate 2 (полная воспроизводимая ежедневная история shares/creation-redemption с семантикой дат и revision handling): ни один фонд пока не прошёл строгую проверку; графики NAV/market price и текущие daily-updated snapshots недостаточны.
- Gate 3 (права на automated capture, raw retention, private backup/restore и downstream publication): не подтверждены для всех 12 фондов; публичная доступность не является разрешением на систематическое извлечение/архивирование.

**Решение:** issuer-primary route пока не заменяет daily ETF source contract. Не выводить flows из AUM delta, не считать пропуски нулями и не смешивать квартальные транзакции, holdings-based estimates и reported/compiled USD flows. Никаких API calls/capture/ключей/production writes/registry/formula/evaluator/scenario changes не было. BTC остаётся `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — проверен путь SEC EDGAR для первичных контрольных данных

**Действие:** сверена официальная документация SEC по API и программному доступу; вывод внесён в матрицу (commit `a724f1bee49b1a65c519c0aaf4cbb7638e147f27`) и План 100 (commit `785e675142464de12489ff76859a8f8f8ff58823`).

**Результат:** SEC предоставляет публичные REST API для submissions/XBRL без API key и разрешает scripted access при соблюдении Privacy and Security Policy, declared User-Agent, умеренной частоты и лимита 10 запросов/сек. Это более чётко документированный путь доступа к SEC filings, но не полный daily ETF creations/redemptions feed и не blanket permission для downstream redistribution.

**Решение:** SEC использовать как periodic primary-source cross-check route, не как замену ежедневному ETF flow series. В будущем для SEC-проверок отдельно хранить filing date, reported period, observation date и amendment/version. Сейчас API не вызывался, данные не захватывались, архив не записывался; production/registry/formula/evaluator/scenario state не менялись. BTC остаётся `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — BITB / HODL / BTCW: проверка daily-series gate

**Действие:** сопоставлены официальные страницы эмитентов с SEC Q2 2026 для BITB, HODL и BTCW; вывод внесён в матрицу покрытия и План 100 (matrix commit `627251ef286816971e7491004c1285d193a42a53`, Plan 100 commit `238608c7b57d2637db9bad898293d1ca414c9d01`).

**Результат:** BITB имеет датированные issuer facts/price chart и квартальные share transactions в SEC filing; HODL показывает dated shares/BTC snapshots; BTCW имеет dated fund facts и SEC quarterly cross-check. Для ни одного из трёх источников не доказан полный воспроизводимый per-fund daily creations/redemptions ряд с публикационными timestamps и revision/correction semantics. Snapshots и квартальные транзакции остаются только периодическими первичными сверками.

**Решение:** не выводить daily flows из AUM/NAV delta, не считать пропущенные даты нулём, не смешивать quarterly transactions с reported/compiled daily USD flows. Права на automated capture/raw retention/private backup-restore остаются unresolved. API не вызывались, data capture/production writes не выполнялись; registry/source priority/formula/evaluator/scenario state не менялись. BTC остаётся `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — IBIT / ARKB historical daily-flow contract review

**Действие:** проверены официальная iShares-страница IBIT, страница ARKB и SEC 2025 10-K; результаты внесены в матрицу покрытия и План 100 (matrix commit `b4def53b9c53f765b0d66d49cfac6ff904d1eb82`, Plan 100 commit `954942c090d4332d93a27b8e13f3c400c9ec1572`).

**Результат:** IBIT предоставляет dated shares-outstanding facts и текущий holdings CSV; ARKB — holdings snapshots, premium/discount chart и годовые/квартальные SEC capital-activity totals. Ни один из этих признаков не подтверждает полную воспроизводимую ежедневную историю creations/redemptions с publication timestamps и revision/correction semantics.

**Решение:** оставить оба маршрута periodic primary cross-check only. Не выводить daily flows из AUM/NAV/holdings deltas; не считать missing observations нулями и не смешивать annual/quarterly activity с daily reported/compiled USD flows. No API calls, downloads/capture or archive writes. No registry/source-priority/formula/evaluator/production/scenario-state changes. BTC remains `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — FBTC / BTCO daily-flow evidence review

**Действие:** сверены официальные материалы Fidelity и Invesco с SEC Q2 2026 FBTC, SEC 2025 10-K BTCO и SEC Q1 2026 BTCO; результаты добавлены в матрицу покрытия и План 100 (matrix commit `02de8907b0157172299e718fece8359836fadbb9`, Plan 100 commit `8fb67610daa98e13a0b7b345865bb6706ba04ce5`).

**Результат:** FBTC публикует ежедневные holdings и предыдущий business-day NAV/closing price, однако полный historical creations/redemptions feed и метод, позволяющий выводить flow из holdings changes, не подтверждены. BTCO SEC reports подтверждают annual/quarterly capital-activity totals, не ежедневный ряд. Publication timestamps, correction/revision contract and systematic capture/raw retention/private restore rights remain unresolved.

**Решение:** оба источника остаются periodic primary cross-check only. Не выводить flow из AUM/NAV/holdings deltas, не считать missing observations нулями и не смешивать period totals с daily reported/compiled USD flows. No API calls/downloads/capture or archive writes. No registry/source-priority/formula/evaluator/production/scenario-state changes. BTC remains `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — EZBC / Grayscale Mini BTC / MSBT SEC source review

**Действие:** сверены SEC Q2 2026 filings для Franklin Bitcoin ETF (EZBC), Grayscale Bitcoin Mini Trust и Morgan Stanley Bitcoin Trust (MSBT); результаты внесены в матрицу покрытия и План 100.

**Результат:** SEC подтверждает только периодические capital-activity totals: EZBC — 150,000 issued / 1,250,000 redeemed за Q2 2026; Grayscale Mini BTC — 9,410,000 / 3,470,000 за Q2 и 22,950,000 / 9,740,000 за первое полугодие; MSBT — 17,900,000 / 250,000 от начала операций 2026-04-07 до 2026-06-30. Ни один filing не устанавливает полную ежедневную историю flows с row-level publication timestamps и correction/finality contract.

**Решение:** оставить все три маршрута periodic primary cross-check only. Не распределять period totals по дням, не выводить flows из holdings/AUM/NAV deltas и не считать missing observations нулями. API/download/capture/archive writes не выполнялись; registry/formula/evaluator/production/scenario state не менялись. BTC remains `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — Osprey Bitcoin Trust (OBTC): active-universe correction

**Действие:** проверены официальная страница спонсора и SEC Q2 2026 10-Q Osprey Bitcoin Trust. Обнаружено, что ранее зафиксированный active-universe список пропустил OBTC. В матрицу покрытия и План 100 добавлено включение OBTC с даты конверсии в биржевой ETF 2025-12-19; предшествующая OTCQX-история не приравнивается к ETF-периоду.

**Результат:** SEC сообщает 2,940,535 shares на 2026-06-30; за первое полугодие 2026 погашено 1,920,000 shares, за Q2 отдельно указано нулевое создание/погашение. Это периодические данные, не ежедневная flow-series. Daily sponsor snapshots не доказывают полную историю creations/redemptions или разрешённую методику daily USD flows.

**Решение:** исправить universe, но оставить OBTC periodic-primary-cross-check only. Не выводить flows из holdings/NAV/AUM deltas и не распределять периодические итоги по дням. No API/download/capture/archive writes; no registry/formula/evaluator/production/scenario-state changes. BTC remains `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — ETF universe: DACFP cross-check and BITA boundary

**Действие:** проверен сторонний Spot Bitcoin ETF Investor Guide DACFP и SEC Q2 2026 filing iShares Bitcoin Premium Income ETF (BITA), чтобы проверить пропущенные продукты и границы определения spot-Bitcoin cohort.

**Результат:** DACFP (страница обозначена как обновлённая 2026-09-17) перечисляет 12 продуктов, включая MSBT, но не OBTC; в строке Morgan Stanley повторно указан тикер BTCW, совпадающий с WisdomTree. Список пригоден только как дополнительный cross-check, не как полный реестр. SEC filing показывает, что BITA держит BTC и IBIT и использует covered-call опционы преимущественно на IBIT; он не включён в основной plain spot-ETF cohort, чтобы не смешивать отдельную premium-income стратегию и базовые IBIT shares без явного правила агрегирования.

**Решение:** рабочий активный core cohort остаётся предварительно равным 13 продуктам на 2026-10-16 (MSBT с 2026-04-08; OBTC с 2025-12-19; Hashdex DEFI вне active trading cohort после 2026-08-17). Не замораживать universe до окончательной сверки effective dates, delisting/closure/conversion по официальным источникам для каждого фонда. API/download/capture/archive writes не выполнялись; source/metric registry, formula, evaluator, production/scenario state не менялись. BTC remains `not_evaluable`; PR #83 Draft/open/unmerged.


## 2026-10-16 — correction: Hashdex DEFI final trading date

**Действие:** проверены SEC Form 8-K/A, SEC filing о завершении реализации активов и Form 15 Hashdex Commodities Trust.

**Результат:** последний торговый день Hashdex DEFI — **2026-08-17**; торги были приостановлены после закрытия в этот день. Реализация активов завершена 2026-08-24. Form 15 от 2026-09-03 — более поздний документ о прекращении отчётности и не определяет последний торговый день.

**Решение:** исправить дату конца active trading cohort на 2026-08-17. Ликвидационный период учитывать отдельно, не как обычные daily ETF-flow observations. Источники: https://www.sec.gov/Archives/edgar/data/1985840/000121390026087992/ea0301660-8ka1_hashdex.htm ; https://www.sec.gov/Archives/edgar/data/1985840/000121390026093020/ea0303094-8k_hashdex.htm ; https://www.sec.gov/Archives/edgar/data/1985840/000121390026096933/ea0304221-1512g_hashdex.htm.


## 2026-10-16 — provisional effective-date ledger for spot-BTC cohort

**Действие:** сверены первичные SEC/issuer filings для определения дат включения продуктов в spot-Bitcoin trading cohort и даты выхода DEFI.

**Результат:** ledger: 2024-01-11 — IBIT, FBTC, ARKB, BITB, BTCO, HODL, BRRR, EZBC, BTCW, GBTC; 2024-03-27 — DEFI после конверсии из futures в spot; 2024-07-31 — Grayscale Mini BTC; 2025-12-19 — OBTC после конверсии в ETF; 2026-04-08 — MSBT; 2026-08-17 — последний торговый день DEFI. Count reconciliation: 10 → 11 → 12 → 13 → 14 → 13 active products.

**Решение:** добавить в матрицу coverage и План 100 даты применимости с первичными ссылками. Ledger пока provisional: до окончательной фиксации нужен последний поиск иных US spot BTC products, прямого владения BTC и событий listing/closure/conversion. BITA не включать в core plain spot-ETF cohort без отдельного определения broader BTC-linked ETP aggregate. Ledger не одобряет источники ежедневных flows; source rights/completeness/publication/revision/finality/retention/restore gates остаются открытыми. BTC remains not_evaluable; PR #83 Draft/open/unmerged.


## 2026-10-16 — scope scan for adjacent BTC-linked ETFs

**Действие:** выполнен дополнительный поиск SEC/sponsor records на предмет новых продуктов, которые могли быть ошибочно смешаны с direct-holding spot-Bitcoin cohort.

**Результат:** BTCU — daily 2x exposure к reference Bitcoin ETPs с ежедневной ребалансировкой; 7RCC — mixed Bitcoin + carbon-credit futures; BITA — premium-income/options strategy с BTC и IBIT. По текущему определению ни один из этих продуктов не включается в core plain spot-BTC cohort. В этом pass других plain direct-holding US spot-BTC products сверх provisional 13-product cohort не найдено. Sources: https://www.sec.gov/Archives/edgar/data/1424958/000119312526239876/d110971d497k.htm ; https://www.sec.gov/Archives/edgar/data/1471824/000143774926027963/R65.htm ; https://www.sec.gov/Archives/edgar/data/2089969/000143774926027004/bitp20260630_10q.htm.

**Решение:** сохранить явную границу cohort; не смешивать leveraged/reference-ETP exposure, mixed carbon-credit strategy и premium-income/options strategy с plain spot ETF flows без отдельного aggregate contract and double-counting controls. Перед любым будущим capture перепроверить official listings/status. BTC remains not_evaluable; no source/registry/formula/evaluator/production/scenario-state changes.


## 2026-10-16 — official filing check: Franklin EZBC and Hedgeye HBIT

**Действие:** проверены SEC filings и официальный сайт Franklin после обнаружения дополнительных Bitcoin-названий в документах.

**Результат:** Franklin Bitcoin ETF — это уже учтённый фонд EZBC с inception 2024-01-11, а не отдельный новый продукт. Hedgeye Hedged Bitcoin ETF (HBIT) в prospectus от 2026-08-24 прямо указывает, что не инвестирует непосредственно в Bitcoin; экспозиция строится через другие BTC ETF/ETP и опционы. HBIT не включается в core direct-holding spot-BTC cohort, чтобы не смешивать продукт-обёртку с базовыми фондами и не допускать double-counting.

**Решение:** count core cohort не меняется в этом pass. Перед любым будущим capture нужен повторный dated official listing-status check. Источники: https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS/franklin-bitcoin-etf/EZBC ; https://www.sec.gov/Archives/edgar/data/1992870/000199287026000002/posam.htm ; https://www.sec.gov/Archives/edgar/data/1771146/000177114626001708/ck0001771146-20260824.htm.


## 2026-10-16 — confirmation of latest build and next snapshot gate

**Действие:** проверены workflow runs по ветке PR #83 после официальной сверки universe и статически просмотрены offline snapshot diff script/test.

**Результат:** VPS API Build Rehearsal для последнего на тот момент docs-head `41d05983158cda6916360875596ed3824bafb03f` завершился success: [run #38910865157](https://github.com/olegsh247-stack/Crypto/actions/runs/38910865157). Это подтверждает VPS build/rehearsal, но не live ETF data, archive durability или права на источники. На текущем docs-only head отдельного BTC Public Source Staging run нет; поэтому не заявлять новый успешный staging run для этого head. Ранее задокументированные fixture tests остаются подтверждением только указанной в соответствующем разделе версии кода.

Статически проверены `scripts/diff-btc-etf-snapshots.mjs` и тесты: сравнение офлайн по source ID + URL + reporting date, различает new/changed/missing/incomplete/not-comparable и не пишет в production. Сам diff не доказывает provider finality, rights clearance или durable restore.

**Следующий gate:** сравнивать только уже существующие local snapshots с подтверждёнными правами; live capture/archive write не выполнять без отдельного разрешения и закрытия source-rights/retention blockers. BTC remains `not_evaluable`.


## 2026-10-16 — подтверждён CI для актуального документационного HEAD

**Действие:** повторно проверены GitHub Actions для двух последовательных документационных коммитов на PR #83.

**Результат:** VPS API Build Rehearsal завершился успешно для актуального HEAD `e45626332fa6b020a1be2a76b6a5b0e48ffcd81c` — [run #38911150759](https://github.com/olegsh247-stack/Crypto/actions/runs/38911150759). Предыдущий документальный HEAD `ba9af4919f69e4b8bd6effafb7550d9006ccbb9b` также прошёл [run #38911143573](https://github.com/olegsh247-stack/Crypto/actions/runs/38911143573). PR #83 остаётся Draft/open/unmerged.

**Ограничения и следующий шаг:** успешный VPS Build Rehearsal не подтверждает отдельный BTC Public Source Staging run для актуального HEAD, права на raw retention, реальный долговременный архив или независимое восстановление. В дереве репозитория обнаружен только JSON staging-документ `docs/data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json`; наличие двух независимых локальных снимков с подтверждёнными правами этим не доказано. Поэтому реальное сравнение снимков не запускалось, live capture и архивная запись не выполнялись. Продолжаем только с уже имеющимися разрешёнными доказательствами; при их отсутствии следующий gate — получить/проверить права и подтверждения хранения/восстановления. BTC остаётся `not_evaluable`; production inputs, registry, formula, evaluator и scenario state не менялись.


## 2026-10-16 — TFTC offline inspector and CI gate

- Corrected the offline TFTC JSON inspector's ISO date validation and CLI newline output in commit [89b2c14](https://github.com/olegsh247-stack/Crypto/commit/89b2c14dac88cca75d3c1340b7df5ea27216b974).
- Added the inspector's test file to BTC Public Source Staging validation in commit [abf4cbf](https://github.com/olegsh247-stack/Crypto/commit/abf4cbf45fc1a61de6afeedec2f37c2809b55566).
- BTC Public Source Staging [#38914138558](https://github.com/olegsh247-stack/Crypto/actions/runs/38914138558) passed: all validation steps including TFTC inspector tests succeeded; the capture job was skipped and no artifacts were produced.
- VPS API Build Rehearsal [#38914137831](https://github.com/olegsh247-stack/Crypto/actions/runs/38914137831) passed: build, disposable PostgreSQL migration, registry/provenance/idempotency checks, backup/restore rehearsal, API/Worker E2E, and BTC evidence lineage E2E succeeded. This is CI-local rehearsal evidence, not proof of an operational VPS or independent off-host archive recovery.
- Test fixtures are synthetic only. No real TFTC JSON payload has been captured or inspected. Source rights/handling approval and durable private storage with independent backup/restore remain blockers; BTC remains `not_evaluable`.
- No live capture, production DB write, ingestion, source registry or scenario state change, deployment, or PR merge was performed. PR #83 remains Draft.


## 2026-10-16 — ETF source-rights review and archive gate

**Действие:** повторно проверены завершившиеся CI runs и документально разделены лицензия опубликованного набора TFTC, происхождение данных и права на хранение сырых ответов upstream-провайдеров.

**Результат:** VPS API Build Rehearsal [#38914477952](https://github.com/olegsh247-stack/Crypto/actions/runs/38914477952) и [#38914504318](https://github.com/olegsh247-stack/Crypto/actions/runs/38914504318) завершились успешно. BTC Public Source Staging [#38914138558](https://github.com/olegsh247-stack/Crypto/actions/runs/38914138558) прошёл validation; capture был skipped, артефактов нет. TFTC указан как опубликованный набор под CC BY 4.0 и раскрывает lineage: текущие ежедневные агрегаты связаны с SoSoValue, исторические строки фондов — с Farside. Поэтому TFTC — кандидат на отдельно атрибутированную офлайн-копию, но не независимый третий источник измерения и не автоматическое подтверждение корректности каждой строки.

**Ограничения и решение:** до сохранения реальной копии TFTC проверить точную версию набора, атрибуцию/лицензионное уведомление, дату получения, hash и применимые условия на фактически полученном файле. Права на долговременное хранение сырых SoSoValue API responses и Farside responses остаются неподтверждёнными; не архивировать их без source-specific evidence. SEC/issuer filings и квартальные наборы годятся для периодической сверки, но не заменяют ежедневный flow ряд. Предложения по владельцу, retention/deletion, private storage, independent encrypted backup и restore cadence не утверждены; VPS/storage не развёрнуты.

**Безопасность:** реальный payload не захватывался, архив и БД не изменялись, снимки не сравнивались, registry/formula/evaluator/scenario state не менялись. Нет deployment или merge. PR #83 остаётся Draft/open/unmerged; BTC остаётся `not_evaluable`. Следующий gate — разрешённая копия TFTC для офлайн-инспекции и документальное закрытие прав/архивных решений.


## 2026-10-16 — подтверждены CI для archive-gate документации

**Действие:** повторно проверены оба VPS API Build Rehearsal после обновления Plan 100 и описания прав источников/архивного gate.

**Результат:** run [#38933624118](https://github.com/olegsh247-stack/Crypto/actions/runs/38933624118) завершился `success` для commit `d3feae2f3440e3cc63cafbd8677710518793089d`; run [#38933630022](https://github.com/olegsh247-stack/Crypto/actions/runs/38933630022) завершился `success` для commit `8b7a3495309a8150c850fc51eea04aaaf3394a9f`.

**Ограничения:** CI success не доказывает наличие VPS, долговременного архива или независимого восстановления. Правила retention/deletion не отмечены как утверждённые без явного согласования пользователя. Raw SoSoValue/Farside retention rights остаются неподтверждёнными. Live capture, archive writes, database/registry/scenario changes, deployment и merge не выполнялись; BTC остаётся `not_evaluable`.


## 2026-10-16 — матрица первичных источников BTC ETF holdings

**Действие:** завершён документальный обзор доступных issuer/SEC путей для ежедневных BTC holdings по 12 потенциально действующим US spot Bitcoin ETF; добавлена [матрица источников holdings](BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md).

**Результат:** для IBIT подтверждён официальный Holdings CSV; для EZBC — официальный XLS и маркировка ежедневного обновления; для BRRR — датированная таблица holdings. Для BTCO, BTCW и MSBT подтверждены квартальные SEC контрольные точки (соответственно 5,345 BTC, 2,310 BTC и 5,059.30771216 BTC на 2026-06-30). Для FBTC есть подтверждение ежедневного раскрытия holdings в документации фонда, но машиночитаемая история не проверена. Для остальных фондов полная ежедневная историческая глубина не доказана. DEFI отнесён к историческому, а не текущему охвату после ликвидации в августе 2026 года.

**Решение:** ни один источник не одобрен этой проверкой для production ingestion или бессрочного хранения raw payload. Нужны точные условия хранения/backup каждого конкретного файла; публичный доступ не трактуется как архивная лицензия. Полное same-date сравнение всех фондов не выполнено, поскольку live capture и загрузка наборов не проводились.

**Граница безопасности:** только документация и исследование публичных страниц/SEC filings. Не выполнялись live capture, API requests, bulk downloads, DB writes, source registry changes, scenario evaluation, deployment или merge. BTC остаётся `not_evaluable`.

### 2026-10-16 — Проверка условий хранения holdings BTC ETF

**Проверено:** официальные публичные страницы iShares/IBIT, Franklin Templeton/EZBC и CoinShares/BRRR, а также руководство SEC EDGAR по доступу к filing data. Работа ограничена просмотром публичной документации; файлы не скачивались, API не вызывались.

**Существенный результат:** SEC разрешает бесплатный публичный доступ к filing data и устанавливает правила fair access (в том числе умеренную частоту запросов и ограничение до 10 запросов/сек.), но одна доступность EDGAR не доказывает безусловное право на массовое зеркалирование/перераспространение каждого встроенного стороннего материала. Для iShares подтверждена ссылка на Holdings CSV, для EZBC — официальный XLS с ежедневным обновлением, для BRRR — датированная таблица; явные права на бессрочное хранение raw snapshots, независимый backup и перераспространение не установлены. Общие условия другого продукта Franklin и privacy policy CoinShares не трактуются как разрешение или запрет для конкретного holdings-файла.

**Решение:** до уточнения конкретных применимых условий разрешено фиксировать ссылку и библиографические метаданные; бессрочное хранение raw CSV/XLS/HTML, резервное копирование и перераспространение не считать одобренными. Статус прав — unverified, а не автоматически prohibited или permitted. Детали внесены в [матрицу источников holdings](BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md).

**Граница безопасности:** не менялись БД, реестр источников, сценарий, оценки или вероятности; не выполнялись capture, загрузка файлов, deployment или merge. BTC остаётся not_evaluable.

### 2026-10-16 — Решение по полной исторической матрице BTC ETF

**Найдено:** Bitbo документирует date-range endpoint ежедневных BTC holdings для всех 12 действующих тикеров матрицы и исторического DEFI; CoinGlass документирует исторический endpoint с `btc_holdings`; Bitcoin ETF Data подтверждает текущий JSON с датой источника и признаками ошибки/устаревания, но не полную историю. Источники: https://bitbo.io/api/docs/endpoints/etf-holdings ; https://bitbo.io/api/docs/mcp/chatgpt ; https://docs.coinglass.com/reference/etf-history ; https://www.coinglass.com/api-terms ; https://www.btcetfdata.com/.

**Решение:** текущие условия не дают основания использовать Bitbo для публичного набора/публичного вывода (его API-гайд ограничивает применение внутренним/частным использованием), а условия CoinGlass запрещают bulk storage для независимой базы и распространение данных/производных результатов без письменного согласия. Ни один из них не одобрен для bulk historical archive. Bitcoin ETF Data — только кандидат на current-value cross-check, не исторический архив. Базовый разрешённый путь на этом этапе — issuer-first ссылки/метаданные и SEC filing controls; он не закрывает ежедневную историческую глубину по всем фондам.

**Условие снятия блокера:** получить письменную лицензию/разрешение, покрывающее требуемые внутреннее хранение, независимый backup, производные исследования и возможную публичную публикацию, либо отдельно подтвердить применимые условия каждого issuer-файла. После этого, в отдельно одобренном retrieval run, проверить полный диапазон дат, одинаковые даты и количественную сверку с доступными SEC квартальными точками. Само описание API не считается доказательством качества ряда.

**Граница безопасности:** никакие API не вызывались, файлы не скачивались; не было DB writes, registry/scenario/probability changes, ingestion, deployment или merge. Матрица обновлена в `docs/BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md`. BTC остаётся `not_evaluable`.

### 2026-10-16 — Историческая ETF-матрица: фактическая глубина по тикерам

**Проверены реальные опубликованные файлы, а не только описания endpoint:** `akpasz/btc-data/data/etf_holdings.json` и `data/etf_quarterly.json`, а также лицензированный квартальный набор Satoshi Gazette Data Desk (CC BY 4.0 для компиляции/аннотаций). В daily-файле фактически только 162 наблюдения за короткое окно с 2026-08-31/09-01 по 2026-10-14/15/16 для пяти тикеров: IBIT, ARKB, BITB, HODL, OBTC; это не полная история с запуска фондов. В SEC/XBRL extraction есть квартальные ряды для IBIT (6), FBTC (2, неполный относительно существующих filings), GBTC (22), BTC Mini (8), ARKB (10), EZBC (2), OBTC (2); extractor не распознал количество BTC у BITB, HODL, BTCO, BRRR, BTCW и MSBT. Ручные SEC-контрольные точки для BTCO/BTCW/MSBT ранее были установлены, поэтому ошибка автоматического извлечения не равна отсутствию раскрытия.

**Исправление охвата:** ранее рабочий список из 12 активных тикеров пропускал OBTC. SEC-linked quarterly dataset подтверждает его листинг на Nasdaq с декабря 2025 и даёт квартальные holdings; включён в исследовательскую матрицу как 13-й текущий прямой BTC-trust кандидат. DEFI — historical-only (Form 25-NSE filed 2026-08-24). BITA исключён из чистого spot-trust набора из-за владения IBIT shares/опционов, BTCK — из-за смешанного мандата bitcoin + carbon-credit futures.

**Результат:** историческая матрица теперь показывает реальные периоды/количество наблюдений, квартальную доступность и конкретные extractor gaps по каждому тикеру; источники и лицензии указаны в `docs/BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md`. Ни один пропуск не трактуется как ноль. Glassnode public chart указывает на daily series и CSV/JSON/API controls, но доступность полной выгрузки и применимые права использования пока не подтверждены, поэтому он не включён как загруженный ряд.

**Граница безопасности:** не изменялись БД, реестр источников, сценарий, оценки или вероятности; не было production ingestion, deployment или merge. BTC остаётся `not_evaluable`.


### 2026-10-16 — Повторная проверка альтернатив для полной ежедневной ETF holdings-истории

**Причина:** ранее этап был назван завершённым при отсутствии главного результата — полной ежедневной матрицы holdings по всем 13 фондам. Исправляем статус: source-coverage audit завершён, фактический historical data panel — **NOT DONE**.

**Дополнительно проверено:** CoinLaw публикует компиляцию под CC BY 4.0, но заявленная cadence — weekly snapshots, перепроверяемые раз в 30 дней; это не ежедневная история с inception. Newhedge предоставляет historical API только с токеном; условия ограничивают использование личными некоммерческими исследованиями и запрещают публичное представление/зеркалирование без разрешения; его on-chain flow series не подменяет reported holdings. Glassnode документирует daily API, но требуется API key/T1 access, а полный охват всех 13 тикеров и фактический payload не подтверждены. BitcoinETFdb показывает daily flows для 11 тикеров, но это не проверенная полная holdings-история по 13 фондам, и права на архив/перераспространение не установлены. Bitcoin ETF Data — текущий JSON, не исторический экспорт.

**Решение:** не восстанавливать holdings через forward-fill квартальных значений и не называть кумулятивные USD flows точными holdings. Ни один проверенный открытый источник не закрывает одновременно полноту по 13 фондам, ежедневную глубину с запуска и разрешённое хранение/публикацию. Для завершения требуется доступ к источнику, который реально предоставляет полную ежедневную историю и условия использования под нужный режим хранения; если значения будут публиковаться в публичном репозитории, права должны разрешать публичное распространение. Raw panel без таких прав не коммитить.

**Изменения:** в docs/BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md добавлена повторная проверка альтернатив и исправлен статус: historical data stage **NOT DONE**. БД, source registry, scenario state, scores/probabilities, ingestion, deployment и merge не менялись. BTC остаётся not_evaluable.


### 2026-10-16 — Собран SEC quarter-end контроль по всем 13 BTC-фондам

**Результат:** в репозитории добавлен `docs/BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md`: 13 из 13 активных тикеров, единая дата наблюдения 2026-06-30, BTC quantity в точности с сохранением точности исходного отчёта и прямая ссылка на SEC Form 10-Q для каждого фонда. Это позволяет вручную проверить quarterly XBRL extraction, в котором были пропуски по ряду фондов.

**Граница результата:** это квартальный контрольный срез, не ежедневная история. Daily-history gate остаётся **NOT DONE**: исследованный daily-файл содержит только короткий недавний период по пяти тикерам и не имеет пересечения с датой 2026-06-30. Нельзя восстанавливать ежедневные значения через forward-fill или кумулятивное преобразование USD flows.

**Изменения в GitHub:** добавлен SEC-контрольный документ; в `docs/BTC-ETF-FUND-HOLDINGS-SOURCE-MATRIX-2026-10-16.md` зафиксирован результат и сохранён статус NOT DONE. Изменения находятся в ветке `fix/btc-readiness-registry-runtime-source` / PR #83 Draft; не мержились.

**Безопасность:** БД, source registry, scenario state, scores/probabilities, production ingestion и deployment не менялись. BTC остаётся `not_evaluable`.


### 2026-10-16 — Повторная проверка SEC-контрольных значений

Повторно открыты первичные SEC Form 10-Q и проверены значения holdings на 2026-06-30 для 8 фондов: IBIT 734,261; FBTC 174,383; GBTC 138,505.75680424; Grayscale Mini BTC 54,280.40050138; ARKB 32,178.2280; BITB 36,207.6919; BTCO 5,345; EZBC 5,664.0163 BTC. В документе `docs/BTC-ETF-SEC-QUARTERLY-CONTROLS-2026-06-30.md` исправлена неверная ссылка IBIT на фактический SEC document filename `bit20260630c_10q.htm` и добавлен явный recheck log.

Ограничение: в этом проходе независимо не переоткрыты HODL, BRRR, BTCW, MSBT и OBTC; их строки не считаются заново подтверждёнными этим recheck. Для BTCW отдельно сохранена методологическая оговорка: schedule quantity 2,310 BTC округлён, а reference-rate quantity в примечании 2,309.689 BTC — отдельное значение. Полная daily-history задача не закрыта; квартальные значения не подставляются в дневной ряд.

Изменения только в документации ветки `fix/btc-readiness-registry-runtime-source` / PR #83 Draft. Не менялись ingestion, БД, source registry, scenario state, scores/probabilities, deployment или merge.


### 2026-10-16 — Завершена проверка SEC-среза 13/13

Продолжение повторной проверки закрыло оставшиеся пять строк SEC-контрольной таблицы: HODL 16,241.00 BTC, BRRR 5,864 BTC, BTCW 2,310 BTC по investment schedule, MSBT 5,059.30771216 BTC, OBTC 945.07 BTC. Вместе с ранее проверенными IBIT, FBTC, GBTC, BTC (Grayscale Mini), ARKB, BITB, BTCO и EZBC теперь **все 13/13 значений на 2026-06-30 сверены с первичными SEC Form 10-Q**.

Особая семантика BTCW сохранена: SEC schedule показывает округлённые 2,310 BTC, а reference-rate расчёт — 2,309.689 BTC. Это разные поля методологии, не ошибка округления, которую следует скрывать. Исправленная ссылка IBIT также внесена в контрольный документ.

Это закрывает только квартальный SEC контрольный срез. Ежедневная holdings-история с момента запуска всё ещё не собрана; ежедневный gate остаётся NOT DONE. Не менялись БД, ingestion, source registry, сценарий, scores/probabilities, deployment или merge.

## 2026-10-16 — проверен код парсера ETF: BITB dates asserted, HODL quantity округлена

**Действие:** read-only изучен исходный парсер [`akpasz/btc-data/fetch/etf.py`](https://github.com/akpasz/btc-data/blob/main/fetch/etf.py) и сопоставлены HODL holdings-table значения с индексируемыми официальными снимками VanEck.

**Результат:**
- **BITB:** парсер получает количество BTC со страницы Bitwise, но дату не извлекает из раскрытия; вызывает `_assert_date('BITB')`, которая ставит дату последнего буднего дня. Следовательно, даты в ряду BITB — asserted/fallback dates, а не подтверждённые даты наблюдения. Повторяющиеся значения могут быть повторной датировкой текущего значения при ежедневном запуске. Ряд нельзя считать независимо наблюдаемой ежедневной историей.
- **HODL:** парсер использует `Shares` из таблицы holdings VanEck, которая округлена. Официальная статистика VanEck показывает более точные значения: 2026-10-08 — 14,637.900 BTC; 2026-10-12 — 14,665.859 BTC; 2026-10-15 — 14,665.617 BTC. В таблице holdings соответствующие количества — 14,639 / 14,667 / 14,667. Это подтверждает, что кандидат не сохраняет точный BTC balance.
- **IBIT** парсер читает дату “Fund Holdings as of” из файла; **ARKB** обычно читает дату CSV, но имеет fallback на последний будний день; **OBTC** извлекает дату “As of” и количество из страницы эмитента. Для остальных повторяющихся значений одной структурной проверки недостаточно, чтобы доказать carry-forward или ошибку.
- Историческое накопление строк в JSON не сохраняет per-row URL, время публикации/получения, версию парсера или fingerprint исходного значения; поэтому provenance и независимое воспроизведение недостаточны.

**Решение:** BITB даты считаются неподтверждёнными asserted dates; HODL значения — округлённым кандидатом, не точным рядом BTC. Не исправлять и не интерполировать данные автоматически. Матрица источников дополнена. Ежедневная история всех 13 фондов остаётся **NOT DONE**.

**Граница безопасности:** только чтение публичного исходного кода и индексируемых официальных снимков, затем документационные изменения в ветке `fix/btc-readiness-registry-runtime-source`. Не менялись runtime, registry, БД, сценарии, оценки/вероятности; capture, ingestion, deployment и merge не выполнялись. PR #83 остаётся Draft.


## 2026-10-16 — найден дополнительный публичный кандидат ежедневной истории: Bitbo Charts

**Действие:** проверены индекс ETF-графиков Bitbo и отдельные страницы IBIT, FBTC, MSBT и BTCW; прочитана страница документации Bitbo API.

**Результат:** Bitbo публикует страницы исторических holdings-графиков для 12 из 13 фондов в нашем scope: IBIT, FBTC, GBTC, BTC (Grayscale Mini), BITB, ARKB, HODL, BTCO, BRRR, EZBC, MSBT и BTCW. На страницах указаны экспорты CSV/XLSX/JSON, а описание утверждает, что значения отражают BTC holdings эмитента по дням. OBTC в списке отсутствует. Фактический payload экспорта в текущей проверке не удалось получить/разобрать, поэтому длина истории, полнота, точность и provenance строк не подтверждены. Публичные страницы Bitbo по отдельным фондам дают некоторые датированные, но местами разреженные и округлённые значения; это контрольные подсказки, не ежедневная панель.

**Ограничения и решение:** документация Bitbo API требует API access и разрешает API только для внутреннего/частного использования; публичный сайт/воспроизведение графиков запрещены. Поэтому API не принимается как источник для публичного Crypto output, и права на массовую загрузку/архивирование графиков не предполагаются. Bitbo добавлен в матрицу как высокоприоритетный кандидат для ручной проверки условий и реального экспорта, но не как принятый источник. Платный доступ не приобретался; никаких данных не загружали, runtime/registry/DB/scenario не меняли.

**Ссылки:** [Bitbo ETF chart index](https://charts.bitbo.io/index/), [IBIT chart](https://charts.bitbo.io/ibit-holdings/), [FBTC chart](https://charts.bitbo.io/fbtc-holdings/), [MSBT chart](https://charts.bitbo.io/msbt-holdings/), [BTCW chart](https://charts.bitbo.io/btcw-holdings/), [Bitbo API terms](https://charts.bitbo.io/btc-api/).


## 2026-10-16 — закрыта проверка TradingView / Yahoo Finance; найден приоритет официальных daily holdings files

**Действие:** проверены публичная страница списка BTC ETF TradingView, страница holdings IBIT в Yahoo Finance, BitcoinETFdb, документация и график Bitbo, а также официальные страницы BlackRock IBIT и ARKB.

**Подтверждённый результат:**
- TradingView даёт AUM/цену/торговые показатели, но не историю количества BTC в фонде. AUM нельзя переводить в BTC через цену как замену holdings.
- Yahoo Finance для IBIT явно сообщает, что holdings data unavailable; Yahoo оставляем для цены/рыночного контекста, не для BTC balances.
- BitcoinETFdb показывает 11 тикеров и только пять датированных дневных flow-значений (12–16 октября 2026); MSBT и OBTC отсутствуют, полного ежедневного holdings-архива в доступном содержимом нет.
- Bitbo показывает графики 12 продуктов, но выгрузка не доступна как обычная ссылка в читаемом содержимом; API требует ключ и имеет ограничения для публичного использования. API не используется.
- На официальной странице BlackRock IBIT есть загрузка holdings CSV; quantity определена как общее количество BTC фонда. На официальной странице ARKB также доступен Full Holdings CSV. Это прямые источники для проверки и будущего ежедневного архивирования, но наличие файла за текущий день не доказывает историческую доступность за предыдущие даты.

**Решение:** популярные рыночные страницы больше не рассматриваются как замена ежедневному ряду holdings. Следующий этап — адресная инвентаризация официального daily file для каждого из 13 тикеров и проверка законно доступного исторического архива; для каждого файла фиксировать URL, дату наблюдения, время получения и hash исходного файла. Значения без явной даты/количества BTC не принимать.

**Ссылки:** [TradingView BTC ETFs](https://www.tradingview.com/symbols/BTCUSD/etfs/), [Yahoo IBIT holdings](https://finance.yahoo.com/quote/IBIT/holdings/), [BitcoinETFdb](https://bitcoinetfdb.com/), [BlackRock IBIT](https://www.blackrock.com/us/individual/products/333011/ishares-bitcoin-trust-4), [ARKB](https://www.ark-funds.com/funds/arkb), [Bitbo ETF API docs](https://bitbo.io/api/docs/endpoints/etf-holdings).

**Граница безопасности:** только публичная read-only проверка и документация в ветке `fix/btc-readiness-registry-runtime-source`. Не менялись runtime, source registry, БД, ingestion, scenario state, scores/probabilities; не выполнялись capture, deployment или merge. PR #83 остаётся Draft.


## 2026-10-16 — адресная инвентаризация официальных ETF holdings-файлов и ежедневного захвата

**Действие:** добавлен [план проверки официальных holdings-файлов и возможности ежедневного захвата](BTC-ETF-OFFICIAL-HOLDINGS-FILE-CAPTURE-PLAN-2026-10-16.md) для всех 13 активных тикеров. Для IBIT, ARKB, HODL, EZBC и BRRR зафиксированы конкретные официальные маршруты, где опубликованы CSV/XLS/PDF или датированная таблица; для остальных отдельно отмечено, что точный файл с количеством BTC и датой наблюдения ещё не верифицирован.

**Результат:** выявлены критичные различия между полями и источниками: у ARKB доступный PDF показывает округлённое количество; у HODL точная метрика “Bitcoin in Trust” отличается от округлённого Quantity в holdings-таблице; у BTCW открытая таблица показывает 100% веса, а не количество BTC; для IBIT и EZBC наличие CSV/XLS-кнопки ещё не доказывает наличие исторического архива. Датированные SEC filing controls на 2026-06-30 остаются отдельными квартальными контрольными точками, не ежедневным рядом.

**Решение:** ежедневный сбор проектировать как перспективное накопление неизменяемых наблюдений с issuer-provided observed date, retrieval timestamp, source URL, hash, parser version и версиями исправлений. До подтверждения прав конкретного файла не включать бессрочное хранение/резервное копирование raw payload. Исторический backfill допускается только из реально существующих датированных снимков/официальных filing controls; никакой реконструкции через AUM/цену, forward-fill или нулевые значения.

**Граница безопасности:** публичная read-only проверка и документация. В рамках этого этапа файлы эмитентов не скачивались, live capture/workflow не запускался, runtime, registry, БД, ingestion, scenario state и scores/probabilities не менялись. PR #83 остаётся Draft и не объединён.


## 2026-10-16 — закрыт расчёт по имеющемуся ETF holdings набору

**Действие:** повторно прочитан актуальный публичный akpasz/btc-data/data/etf_holdings.json; рассчитаны строки и даты по каждому тикеру, календарное пересечение пяти рядов и сумма только на общих датах. Результаты записаны в [BTC-ETF-AVAILABLE-DATA-CALCULATION-2026-10-16.md](BTC-ETF-AVAILABLE-DATA-CALCULATION-2026-10-16.md).

**Результат:** 162 строки по IBIT (31), FBTC (0), GBTC (0), BTC (0), ARKB (33), BITB (34), HODL (33), BTCO (0), EZBC (0), BRRR (0), BTCW (0), MSBT (0), OBTC (31): фактически покрыто **5/13** тикеров. У пяти рядов есть 29 общих дат; последняя — 2026-10-14. Частичная сумма на эту дату — **888383.5954 BTC**. Полный SEC контрольный срез содержит **13/13** тикеров на 2026-06-30; арифметическая сумма — **1,211,244.47121778 BTC**. В квартальном JSON-кандидате на эту дату есть значения только для **6/13** тикеров.

**Решение:** этап поиска/сводного подсчёта закрыт в корректной формулировке: «имеющиеся данные подсчитаны, покрытие и ограничения зафиксированы». Не продолжать широкий поиск поставщиков в этом же подразделе. Частичный daily total не называть полным рынком; не использовать его как подтверждённый flow/сценарный сигнал без отдельного согласования качества. Полная daily panel 13/13 остаётся не достигнутой; это ограничение не маскируется.

**Граница безопасности:** только read-only чтение публичного JSON и документационные изменения. Runtime, registry, БД, сценарий, оценки/вероятности, ingestion, deployment и production не менялись; PR #83 остаётся Draft, merge не выполнялся.


## 2026-10-16 — BTC Rule v2: контракт обязательных входов и офлайн-прогон

**Действие:** сверены canonical metric registry, readiness implementation и pure Rule v2 evaluator после закрытия расчётного ETF holdings подраздела. Добавлен input-readiness report и отдельный offline historical rehearsal.

**Подтверждённый контракт:** обязательны `market.spot_price` (USD/BTC, максимум 1h) и `institutional.etf_net_flow` (USD million/day, latest максимум 36h плюс не менее пяти разных reporting dates и complete-fund/revision/finality evidence). Hashrate и DXY — optional context; fee/subsidy ratio — optional non-directional context. Пропущенные optional inputs не заполняются догадками.

**Результат офлайн-прогона исторического fixture:** price return −3.2383%; ETF five-session sum −678.9 USD million; hashrate +1%; DXY +0.1467%; fee/subsidy 0.004128. Rule v2 возвращает Base, directional score −1, confidence low. Это подтверждает только детерминированное поведение правила на историческом fixture, не свежую оценку рынка.

**Блокеры остаются:** last audited spot and ETF candidate are stale; ETF observation/publication timestamp, completeness, revision/finality and rights are not cleared. BTC remains `not_evaluable`; no state persistence or probability change. Runtime, registry, DB, live capture, deployment, VPS/storage and PR merge untouched. PR #83 remains Draft.

**Следующий шаг:** завершить offline contract/test review одного сценария; актуальные реальные входы собирать только отдельным разрешённым действием. Daily ETF holdings search не возобновлять как блокер.


## 2026-10-16 — завершена сверка офлайн-контракта BTC-сценария

**Действие:** сверены обязательные/необязательные метрики в canonical registry, read-only readiness gate и pure Rule v2 evaluator. Результат: `market.spot_price` и `institutional.etf_net_flow` остаются обязательными; hashrate, DXY и fee/subsidy — optional context, причём fee/subsidy не влияет на directional score. Пороговые значения и runtime-поведение не менялись.

**Важное ограничение тестового покрытия:** доступный `scripts/btc-scenario-direction.test.mjs` проверяет детерминированное правило, optional-input omission и fail-closed поведение при статусе readiness, но напрямую не покрывает матрицу source-quality readiness (fresh/stale, source allowlist, будущие timestamps, ETF completeness/revision/finality и дубли). Зафиксировано в [BTC-SCENARIO-OFFLINE-CONTRACT-REVIEW-2026-10-16.md](BTC-SCENARIO-OFFLINE-CONTRACT-REVIEW-2026-10-16.md). Наличие иных readiness-тестов не утверждается: искомый файл по первому проверенному пути не найден.

**Статус:** исторический офлайн-прогон остаётся fixture rehearsal (Base, score −1, low confidence), не текущей оценкой рынка. Фактический сценарий BTC остаётся `not_evaluable` до прохождения freshness/provenance gate. Live capture, БД, ingestion, runtime/registry, вероятности, deployment и merge не выполнялись; PR #83 остаётся Draft.

**Следующее действие:** добавить/проверить специализированные regression tests readiness gate в существующем тестовом harness; не ослаблять gate ради прохождения старых candidate данных. Обновление текущих обязательных входов — только отдельным явно разрешённым действием.


## 2026-10-16 — добавлены regression tests для BTC readiness gate

**Действие:** добавлен `vps/shared/test/btc-scenario-readiness.test.mjs`; в `vps/shared/package.json` добавлена команда `npm test` (сборка runtime + Node test runner). Сценарии: валидные входы, устаревшая цена, неразрешённый источник, будущий timestamp, неполный ETF coverage, дубли reporting dates, отсутствие подтверждения revision/finality.

**Статус проверки:** тесты закоммичены, но ещё не исполнены в доступной среде. Результат PASS не заявляется. См. [BTC offline contract review](BTC-SCENARIO-OFFLINE-CONTRACT-REVIEW-2026-10-16.md).

**Граница безопасности:** только код тестов, npm script и документация. Текущие данные не загружались; live capture, БД, ingestion, production, deployment и merge не выполнялись. PR #83 остаётся Draft.


## 2026-10-17 — CI readiness gate и fail-closed регрессия

**Подтверждено:** GitHub Actions [#298](https://github.com/olegsh247-stack/Crypto/actions/runs/38965974798) — success на `bb5ad42`; тесты readiness-матрицы и сценарного правила прошли. Старое утверждение в предыдущей записи о том, что тесты ещё не запускались, заменено этим более поздним подтверждённым результатом.

**Сделано:** в `scripts/btc-scenario-direction.test.mjs` добавлена регрессия для отсутствующего/неизвестного `readiness_status`: evaluator обязан отказать без scenario type, directional score и разрешения persistence. Новый commit: `9d50d4d5caedca54f3003e0eec85435ddfc50309`. Для этой дополнительной регрессии CI ещё не подтверждён.

**Граница безопасности:** только офлайн-тест и журнал/план. Нет live capture, сетевого сбора данных, DB/registry writes, ingestion, изменения scenario state/probabilities, deployment или merge. PR #83 остаётся Draft.


**Итог проверки нового теста:** GitHub Actions [BTC Scenario Readiness Gate #299](https://github.com/olegsh247-stack/Crypto/actions/runs/38966644329) — **success** на `9d50d4d5caedca54f3003e0eec85435ddfc50309`. Обе ключевые ступени — shared readiness tests и input-quality/directional rules — завершились успешно. Статус предыдущей записи «ожидает CI» закрыт результатом #299. Реальные входы не обновлялись; BTC остаётся `not_evaluable`.


## 2026-10-17 — read-only preflight обязательных BTC inputs

**Результат:** создан [BTC-REQUIRED-INPUT-PREFLIGHT-2026-10-17.md](BTC-REQUIRED-INPUT-PREFLIGHT-2026-10-17.md). Kraken API endpoint из утверждённого allowlist не удалось прочитать текущим каналом; цена и доказательства наблюдения не получены. Farside показывает последнюю заполненную дату 15 октября; строка 16 октября содержит прочерки и total 0.0, что не считается подтверждённым finalized zero-flow. Историческая сумма за 5–9 октября (−678.9 USD million) не подходит как свежий вход.

**Решение:** входы не подменять альтернативными источниками или нулями. BTC остаётся `not_evaluable`; нужны свежая проверяемая цена из разрешённого источника и финализированный ETF flow с provenance/completeness/revision evidence. Это была read-only проверка, не production capture: raw payload не архивировался, БД/ingestion/state/probabilities/deployment/merge не затрагивались. PR #83 остаётся Draft.


## 2026-10-17 — GitHub Runner успешно получил обязательный market source

После первоначальной недоступности Kraken через прямой канал выполнен read-only [BTC Public Source Staging run #156](https://github.com/olegsh247-stack/Crypto/actions/runs/38967487610) на `main`. Workflow завершился success, artifact [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38967487610/artifacts/12075551423) загружен (SHA-256 `7be48d15498a71319c72ab5e0f8825deb28dc0ad7bb0dd7f1be35bd9d390dca0`, retention до 2026-10-23).

- Kraken allowlisted endpoint: HTTP 200; captured 81,574 USD/BTC, trade observed_at `2026-10-16T21:10:30.066Z`, retrieved_at `2026-10-16T21:10:31.607Z`, payload SHA-256 `47b214e44d915913a9f83a95146d1e8017d52229a9c88888e4e582809e2c7569`. Доступ подтверждён, но наблюдение уже не проходит 1-hour freshness gate.
- Binance market-data-only и OKX дали независимые BTC/USDT cross-checks; не считать USDT равным USD и не менять canonical source. Binance primary API вернул 451, Bybit — 403.
- Mempool hashrate/fees получены, но пока не используются до проверки окон и единиц. Farside main page вернула 403, all-data page — 200; ETF rows распарсены только как review candidates, blocked из-за неподтверждённых publication/observation time и revision/finality.
- Workflow подтвердил `production_database_accessed=false`, `production_writes_performed=false`. Warning Node.js 20 deprecation и notice Ubuntu migration не блокируют успешный run.

**Решение:** доступ Kraken через runner восстановлен; требуется новый capture для свежей цены. ETF flow остаётся блокером, BTC — `not_evaluable`. Ни ingestion, ни БД, ни scenario state/probabilities, deployment или merge не менялись.


## 2026-10-17 — отсев ETF-flow альтернатив по требованию доступа без ключа

**Проверено:** документация SoSoValue подтверждает обязательный `x-soso-api-key`; документация Newhedge указывает обязательный `api_token`; ByKaranteli сообщает, что программные вызовы требуют бесплатный Bearer key с 2026-09-10, а репозиторий CSV-наборов заморожен на 2026-09-10. Ссылки: https://sodex.com/documentation/for-developers/developers/data-api/getting-started ; https://prod-docs.newhedge.io/api/spot-bitcoin-etf-flows ; https://bykaranteli.com/developers ; https://github.com/bykarantelicom/crypto-datasets.

**Решение:** эти варианты не считаются готовым источником для текущего автоматического захвата без ключа; замороженный CSV не закрывает актуальную свежесть. Не менялись canonical registry, evaluator, формула или правила readiness; нет ingestion, DB writes, scenario-state/probability changes, deployment или merge. ETF flow остаётся blocked, BTC — `not_evaluable`; PR #83 остаётся Draft/open/unmerged.


## 2026-10-17 — Подготовлен повторный read-only capture после добавления ключа SoSoValue

**Действие:** пользователь подтвердил, что разрешения настроены и секрет `SOSOVALUE_API_KEY` добавлен в GitHub Actions. Проверен staging workflow: секрет передаётся только как переменная окружения шага capture; он не печатается и не сохраняется в репозитории. Доступный ранее артефакт создан до настройки секрета и не мог подтвердить авторизацию SoSoValue.

**Изменение:** в `.github/workflows/btc-public-source-staging.yml` добавлена группа concurrency `btc-public-source-staging` с `cancel-in-progress: false`, чтобы read-only захваты не пересекались. Commit: `7d29e5ff3e91099b7eae58ccd8949b16089e556e`. Workflow-файл входит в push-фильтр запуска.

**Статус:** новый ответ SoSoValue пока не подтверждён доступным результатом запуска. До получения свежего артефакта нельзя утверждать, что ключ работает, API возвращает ожидаемую схему или история сверена по датам. SoSoValue остаётся кандидатом только для cross-check; CryptoETF.today — только cross-check, Farside/TFTC — review-only из-за незакрытых временных и финальных семантик. Yahoo DXY остаётся заблокированным. BTC остаётся `not_evaluable`.

**Граница безопасности:** только конфигурация CI для read-only staging; production DB, ingestion, scenario evaluation/state/probability, deployment и merge не затрагивались.


## 2026-10-17 — Первичная документальная проверка альтернатив DXY

**FXMacroData:** документация подтверждает бесплатный доступ без ключа к части USD macro announcements/calendar/catalogue за последние 90 дней; документированные FX pair history endpoints требуют ключ. В изученном каталоге нет подтверждённого endpoint именно ICE DXY. Статус: пока не источник DXY; нужен явный DXY instrument в официальном каталоге. Источник: https://fxmacrodata.com/documentation/reference

**Alpha Vantage:** есть INDEX_DATA и INDEX_CATALOG для поддерживаемых индексов, но INDEX_DATA помечен как premium endpoint и требует API key. Наличие именно ICE DXY в каталоге и entitlement бесплатного тарифа не подтверждены. Статус: blocked pending proof; не считать бесплатным DXY источником. Источник: https://www.alphavantage.co/documentation/

**Live-Rates.com:** документация заявляет 170+ инструментов, включая индексы, но без ключа /rates ограничен 3 запросами/час/IP; исторические endpoints требуют ключ. В terms указано, что данные лицензируются для использования по активной подписке, а redistribution требует письменного согласия. Присутствие именно DXY в бесплатном списке и права использования не подтверждены. Статус: candidate only. Источник: https://github.com/Live-Rates/live-rates.com

**Разграничение метрики:** FRED DTWEXBGS — Nominal Broad U.S. Dollar Index, не ICE DXY. Подмена запрещена. Источник: https://alfred.stlouisfed.org/series?seid=DTWEXBGS

**Решение:** source_priority/registry/runtime не менялись; ни один из этих кандидатов не допущен в macro.dxy. Следующий этап — получить точное подтверждение символа DXY из каталога/ответа провайдера и проверить права на автоматический сбор, архивирование и использование в проекте.


## 2026-10-17 — подтверждён SoSoValue API с секретом; источник-каталог документирован

**Проверка:** GitHub Actions [BTC Public Source Staging #168](https://github.com/olegsh247-stack/Crypto/actions/runs/39009940767) — success, commit `7d29e5ff3e91099b7eae58ccd8949b16089e556e`. Artifact `btc-public-source-review` (ID `12092660830`, SHA-256 `81aff80f468acb45a8d07f210c6b5cbf162889d2aadbaf36f3dd977c70e234dd`) был скачан и проверен. Manifest подтвердил `read-only-staging-only`, `production_database_accessed=false`, `production_writes_performed=false`.

**SoSoValue:** запрос `/openapi/v1/etfs/summary-history?symbol=BTC&country_code=US&limit=300` с секретом `SOSOVALUE_API_KEY` вернул HTTP 200 и 22 записи. API передаёт trading date и daily aggregate `total_net_inflow` в USD, но не даёт точного publication/observation time и явной finality/revision гарантии; выборка в данном ответе охватывает только 22 торговые даты. Дата 2026-10-16: −82.3893051m USD vs Farside −82.4m (около −0.010695m разницы, совместимо с округлением отображения). Дата 2026-10-07: −487.0674115m vs −484.9m (около −2.167412m; существенное расхождение, совпадение источников не доказано). Статус SoSoValue — keyed cross-check candidate, не canonical и не разрешён для ingestion. Предыдущая запись о непроверенном ключе была верна на тот момент; теперь технический доступ подтверждён.

**Прочие capture outcomes:** Kraken XBT/USD HTTP 200; capture 81,473.1 USD/BTC с source trade timestamp и отдельным retrieval timestamp. Binance primary HTTP 451, Binance market-data-only HTTP 200 (USDT cross-check), OKX HTTP 200 (USDT cross-check), Bybit HTTP 403. Mempool hashrate/fees HTTP 200, но window/unit/methodology checks остаются обязательными. Farside all-data HTTP 200, landing HTTP 403; ETF rows blocked по publication/observation time и revision/finality. TFTC JSON HTTP 200 и CryptoETF.today MCP HTTP 200 — cross-check only. Yahoo DXY capture не выполнял сетевой запрос и остаётся blocked by access terms; ICE DXY endpoint/licence не подтверждены.

**Документация:** добавлен [CRYPTO-SOURCE-INVENTORY-AND-CENTRAL-CONFIG-AUDIT-2026-10-17.md](CRYPTO-SOURCE-INVENTORY-AND-CENTRAL-CONFIG-AUDIT-2026-10-17.md), содержащий mapping metric→research block IDs, provider/endpoint usage roles, current blockers и проект централизованного Source Catalog. Предложение: отдельный endpoint catalog для URL/auth secret reference/adapter/terms/timestamp and revision semantics; metric registry остаётся владельцем units, freshness, source priority и research block mapping. Это документационный вывод, не миграция кода.

**Безопасность/решение:** не менялись registry priorities, SQL seed, production DB, ingestion, evaluator, scenario state/score/probability, deployment или PR state. BTC остаётся `not_evaluable`; следующий безопасный шаг — проверить source-catalog design against all runtime call sites and SQL seed parity before implementation. Не трактовать SoSoValue HTTP 200 как source acceptance.


## 2026-10-17 — политика частоты запросов и ключей API

**Решение:** не использовать глобальный 15-минутный опрос. Целевой диапазон 15–60 минут применяется только к оперативным метрикам, если этого требует потребитель и позволяет провайдер. Для spot возможны 15 минут при необходимости, иначе 30–60 минут; ETF daily flows/holdings, macro daily series и corporate holdings — daily/event-driven; протокольные события — по релизу/событию. Poll interval не равен freshness window; учитывать rate limit, cache, backoff и доступность новой публикации.

**Ключи:** `SOSOVALUE_API_KEY` уже настроен и проверен HTTP 200 в staging, только cross-check. Другие ключи пока не создавать. Glassnode, derivatives data, official macro source и DXY не имеют подтверждённого принятого endpoint/потребности; сначала документация, тариф/ToS, timestamp/revision semantics и право хранения, затем решение о ключе. Публичные Kraken/Mempool/Binance market-data/OKX/Farside/TFTC endpoints в текущем staging использовались без отдельного API key (Bybit заблокирован 403 — ключ не добавлять ради обхода отказа).

Создан [SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md](SOURCE-API-KEYS-AND-POLLING-POLICY-2026-10-17.md); polling/key requirements добавлены в source audit и отдельный audit prompt. В этом шаге расписания автоматических задач и runtime config не менялись.


## 2026-10-17 — runtime API trace выявил короткий cache и различие источников

Проверен `vps/api/src/app.ts`: runtime ticker использует fallback Binance → Kraken → CoinGecko; Binance пытается три host endpoint-а. Research metric `market.spot_price` при этом указывает `market.kraken` как единственный source priority. CoinGecko simple/price вызывается без ключа. Текущий ticker cache — 60 секунд, Cache-Control max-age=30/s-maxage=60; это может создавать лишние upstream calls относительно целевого poll interval 15–60 минут. В ответе `timestamp` — время приложения после получения, не гарантированный provider observation time. В `vps/.env.production.example` ключей внешних market data нет.

Решение: оставить контуры раздельными; не менять provider fallback и canonical research source в рамках аудита. Зафиксировать необходимость отдельного решения по cache TTL и timestamp semantics после проверки UI consumers/тестов. Код не менялся.


## 2026-10-17 — ticker cache TTL увеличен до 15 минут на рабочей ветке

В `vps/api/src/app.ts`, commit `3da2ffba02a1aa3307066038bb6da2eda5dc6c78` на `fix/btc-readiness-registry-runtime-source`, изменён in-process cache TTL с 60 секунд на 15 минут и Cache-Control с max-age 30/s-maxage 60 на max-age 900/s-maxage 900. Цель — уменьшить повторные upstream calls при частых UI refresh. Изменение не merge/deploy; ожидается VPS API Build Rehearsal/E2E. Provider fallback не менялся; response timestamp по-прежнему является временем получения приложением, а не гарантированным observation timestamp.


## 2026-10-17 — Source Catalog v1: проектирование и первая read-only проверка

Создан [SOURCE-CATALOG-V1-DESIGN-AND-MIGRATION-PLAN-2026-10-17.md](SOURCE-CATALOG-V1-DESIGN-AND-MIGRATION-PLAN-2026-10-17.md) и первоначальный [source-catalog.v1.json](../data/CryptoDataModel/registry/source-catalog.v1.json). Каталог описывает endpoint-level идентичность, доступ, статус, роль данных, интервалы опроса, семантику observation/period timestamps, единицы, finality/revision и имя env-переменной без секретного значения. Включены фактически проверенные кандидаты и явно заблокированные/непринятые DXY/ETF источники; SoSoValue остаётся cross-check only. Два кандидата, отсутствующих в существующем source registry (Yahoo Finance DXY и CryptoETF.today), помечены как `candidate_unregistered`, не как принятые registry IDs.

Добавлен `scripts/validate-source-catalog.mjs` и шаг в VPS API Build Rehearsal. Проверка read-only: уникальность catalog IDs, формат URL, допустимые статусы/роли/режимы опроса, отсутствие credential-like query parameters, использование только имён env vars, проверка зарегистрированных source IDs и вывод legacy gaps как отчёта без автоматического продвижения источников. Это начальный baseline, не полная трассировка всех runtime consumers. CI run для интеграции проверки: [#39015488714](https://github.com/olegsh247-stack/Crypto/actions/runs/39015488714) — на момент записи queued; более ранние runs на промежуточных commits ещё выполняются, итог проверки нужно подтвердить по последнему run.

**Границы изменений:** не менялись metric source priorities, SQL seed, production DB, runtime provider fallback, ingestion, scenario evaluator/state/score/probability и deployment. Catalog пока инвентаризация и не является runtime source of truth; BTC остаётся `not_evaluable`. Следующий шаг — получить CI result, исправить только структурные/валидационные проблемы и оценить отчёт о непокрытых source IDs перед любым refactor runtime/capture scripts.


## 2026-10-17 — Source Catalog baseline validated; runtime endpoint parity added

Первый полный VPS API Build Rehearsal после исправления проверки заглушек завершился **success**: [run #39015601136](https://github.com/olegsh247-stack/Crypto/actions/runs/39015601136). Последующая проверка расширенного runtime inventory прошла шаг `Validate source catalog inventory (read-only)` с результатом **success** в [run #39015715464](https://github.com/olegsh247-stack/Crypto/actions/runs/39015715464); полный build/E2E этого run на момент записи ещё выполняется.

Каталог теперь содержит 30 endpoint records. Сверка по данным ветки показала: все 16 source IDs из `source-registry.json` покрыты каталогом; все source IDs из `metric-registry.json` также покрыты; duplicate `catalog_id` отсутствуют. Три provisional/unregistered IDs — `institutional.cryptoetf_today`, `macro.yahoo_finance_candidate`, `market.coingecko` — не входят в metric `source_priority` и не получают допуска к canonical ingestion.

В каталог отдельно внесены фактические runtime UI endpoints из `vps/api/src/app.ts`: Binance ticker/klines для всех трёх fallback hosts, Kraken Ticker/OHLC и CoinGecko simple/price/market_chart. Добавлена проверка, что каждый ожидаемый runtime host/path присутствует в каталоге и помечен `review_only`. Это фиксирует отличие runtime UI fallback от research-canonical input. Runtime endpoint order, API contract, registry priorities и SQL seed не менялись.

Промежуточный CI run #39015548603 упал только на URL-less placeholder (`new URL(null)`); валидатор исправлен и subsequent full run #39015560940 завершился success. Ошибка не была runtime/source failure и не затрагивала production DB. Следующий шаг — дождаться полного E2E для нового runtime parity checker, затем перейти к более полному source-reference parity report по capture/candidate-preparation scripts; не рефакторить adapters до просмотра этого отчёта.


Полный read-only parity checker для catalog с capture/candidate-preparation endpoint families завершился успешно в [VPS API Build Rehearsal #39015830480](https://github.com/olegsh247-stack/Crypto/actions/runs/39015830480). Финальный catalog содержит 33 endpoint records, покрывает 16/16 зарегистрированных source IDs и все metric source IDs; duplicate catalog IDs отсутствуют. Проверяются 10 runtime endpoint families, 10 capture endpoint families и 4 candidate-preparation endpoint families. В каталоге уточнён exact SoSoValue URL `https://openapi.sosovalue.com/openapi/v1/etfs/summary-history`; output identity `institutional.sosovalue.candidate` изолирован как unregistered cross-check. TFTC landing page и `data.json` теперь отдельные endpoint records.

В процессе parity-проверки CI выявил duplicate `catalog_id` после добавления TFTC JSON endpoint; исправлено переименованием landing page record в `institutional.tftc.etf-landing`. Повторный полный VPS build/E2E после исправления завершился success. Текущая проверка — read-only; это не approval источников для ingestion. Следующий этап: более широкий report о рассинхронизации candidate-preparation/capture/SQL seed, затем review отчёта до любого adapter refactor. Никаких runtime source priorities, SQL seed, production DB, scenario state/score/probability или deployment изменений не было.


## 2026-10-17 — source catalog parity расширен до SQL seed и документации

Read-only validator дополнен проверкой явных `source_id/sourceId` в capture/candidate-preparation scripts, coverage SQL seed относительно source registry и обязательной ссылки `documentation_url` для каждого source endpoint (кроме явно blocked/unknown placeholder). В каталоге для SoSoValue разделены provider docs URL и exact API URL `openapi.sosovalue.com/openapi/v1/etfs/summary-history`; TFTC landing page и JSON endpoint имеют разные catalog IDs.

Full VPS API Build Rehearsal с проверками source ID ↔ catalog ↔ SQL seed и script endpoint parity завершился **success**: [run #39015982729](https://github.com/olegsh247-stack/Crypto/actions/runs/39015982729). Последний run после добавления обязательных documentation links прошёл шаг `Validate source catalog inventory (read-only)` с **success** в [run #39016053890](https://github.com/olegsh247-stack/Crypto/actions/runs/39016053890); полный VPS build/E2E ещё выполняется на момент записи.

Итог текущей инвентаризации: 33 endpoint records, все 16 source-registry IDs и все metric source IDs покрыты; source IDs из SQL seed и явных script references проверяются; четыре provisional IDs остаются вне metric `source_priority`. Это всё ещё read-only validation. Следующее изменение — только после окончания полного CI: оформить оставшиеся runtime/seed semantic gaps как report и review, не подключать каталог к runtime adapters без отдельного безопасного этапа.


## 2026-10-17 — полный CI завершён; parity report зафиксировал ограничения проверки

Полный VPS API Build Rehearsal #39016053890 завершился **success**: [CI run](https://github.com/olegsh247-stack/Crypto/actions/runs/39016053890). Успешны source-catalog inventory, сборки VPS shared runtime/worker/API, PostgreSQL rehearsal, проверка canonical BTC input registry, read-only BTC provenance audit, idempotency/duplicate reconciliation, backup/restore rehearsal и VPS API/Worker E2E. Run выполнен на code commit `ede585333fe757682bbcd2665900ab6ab736c47b`; после него ветка продвинулась документационными изменениями.

Добавлен [отчёт о расхождениях и ограничениях parity-проверки](SOURCE-CATALOG-RUNTIME-CAPTURE-SEED-PARITY-REPORT-2026-10-17.md). В текущем сравнении не найдено set-level mismatch: 33 endpoint records, 16/16 source IDs из registry покрыты, metric source IDs покрыты, SQL seed содержит 16 уникальных IDs и совпадает с registry, явные script source references покрыты каталогом. Выявлены ограничения автоматического доказательства: проверка runtime в основном основана на наличии host/path в исходнике, script endpoints и source IDs проверяются раздельно, SQL проверяется только в направлении registry → seed, а списки проверяемых endpoint families поддерживаются вручную. Это gaps в строгости checker, не подтверждённые поломки runtime.

Следующий контролируемый этап до adapter refactor: узко усилить тесты/валидатор — equality registry↔seed в обе стороны и точную связку request → catalog ID/source ID/metric/unit/quote pair для runtime, capture и candidate-preparation; добавить negative tests на неверный source ID/unit и незарегистрированный endpoint. Затем выполнить полный VPS build/E2E и вернуться к BTC input readiness. Не выполнять live capture, production DB writes, registry/source-priority changes, scenario evaluation/state/probability changes, deployment или merge. BTC остаётся `not_evaluable`.

## 2026-10-17 — SoSoValue: документирован следующий проверочный этап

Подтверждено по официальной панели разработчика и документации API: Demo API доступен пользователям бесплатно; документированы лимиты 100 000 запросов в месяц и 20 запросов в минуту. Пользователь подтвердил, что лимитов более чем достаточно. Для ETF-истории выбран ежедневный/event-driven опрос, а не 15-минутный; 15–60 минут остаются целевым диапазоном только для рыночных источников, которые действительно поддерживают такую частоту.

Добавлен [SoSoValue BTC ETF API Candidate Check](SOSOVALUE-BTC-ETF-API-CANDIDATE-CHECK-2026-10-17.md): зафиксированы endpoint `/etfs/summary-history`, заголовок `x-soso-api-key`, безопасная схема секрета `SOSOVALUE_API_KEY`, проверки глубины истории, ≥5 недавних торговых дней, единиц, дат/часовых поясов, пропусков/дубликатов, изменений исторических строк и условий хранения данных.

**Результат:** документационный этап завершён; фактическая глубина истории, единицы и revision/finality не подтверждены без авторизованного ответа. SoSoValue остаётся только cross-check candidate; metric `source_priority` и runtime не менялись. Ключ не публиковать в чате или репозитории — для следующего read-only теста он должен быть передан через secret/environment. Не выполнялись live BTC capture, production DB writes, scenario evaluation/state changes, deployment или merge.

## 2026-10-17 — SoSoValue API проверен реальным запросом

Добавлены read-only checker `scripts/check-sosovalue-btc-etf-api.mjs` и workflow [SoSoValue BTC ETF API Check #39019097937](https://github.com/olegsh247-stack/Crypto/actions/runs/39019097937). Workflow подтвердил наличие секрета `SOSOVALUE_API_KEY` без раскрытия значения и выполнил один запрос к официальному `/etfs/summary-history`; HTTP 200, workflow **success**. Проверка не обращалась к БД, не выполняла production writes и не меняла состояние сценариев.

Получены 21 уникальная торговая дата за период 2026-09-18—2026-10-16; все 21 значения `total_net_inflow` числовые. Официальная документация задаёт единицу USD, отрицательное значение означает net outflow, даты — торговые даты; endpoint ограничен последним одним месяцем. Для 2026-10-07 значение SoSoValue `-487.067m USD` совпадает с ранее зафиксированным TFTC `-487.1m` на отображаемой точности, но отличается от Farside `-484.9m`. Последние пять сессий (12–16 октября) суммарно составляют `-228.580m USD`; это только наблюдение кросс-проверки, не каноническое значение.

Добавлен отчёт [SOSOVALUE-BTC-ETF-API-CANDIDATE-CHECK-2026-10-17.md](SOSOVALUE-BTC-ETF-API-CANDIDATE-CHECK-2026-10-17.md) с диапазоном, полями, хешем ответа и ограничениями. Сырой ответ сохранён только во временном Actions artifact с retention 3 дня; в Git он не добавлялся.

**Решение:** доступ, схема краткосрочной истории и единицы подтверждены; SoSoValue остаётся daily cross-check candidate. Полный исторический архив, timestamp публикации, revision/finality и условия долговременного хранения/перераспространения не подтверждены. Нужен повторный снимок в следующий торговый день для проверки изменений истории. Registry, metric `source_priority`, runtime и сценарии не менялись; BTC остаётся `not_evaluable`.

## 2026-10-17 — VPS API Build Rehearsal и отрицательные тесты семантики Source Catalog

**Действие:** проверен полный GitHub Actions run [#39019423207](https://github.com/olegsh247-stack/Crypto/actions/runs/39019423207) для commit `c25c4fc58d8302d37f9c52f92aae22a16a37eb61` в ветке `fix/btc-readiness-registry-runtime-source`. В `scripts/validate-source-catalog.mjs` добавлены in-memory отрицательные тесты на несовпадающий `source_id`, неверные единицы котировки, неверную торговую пару и отсутствующий endpoint.

**Результат:** полный job `build-and-e2e` завершился `success`. Успешно прошли проверка Source Catalog, сборки VPS shared runtime/API/Worker, response contracts, сетевые границы, PostgreSQL bootstrap, аудит provenance BTC, проверка идемпотентности/дубликатов, PostgreSQL backup/restore и API/Worker E2E, включая историю и финализацию свечей и административные границы.

**Вывод:** rehearsal подтверждает прохождение CI/E2E, но не означает готовность BTC-сценария. BTC остаётся `not_evaluable`; DXY/ETF/spot и строгая связка «запрос → source ID → metric ID → единицы» должны проходить собственные readiness-контракты.

**Граница безопасности:** проверка была rehearsal/read-only в отношении production. Не выполнялись production-записи, live BTC capture, изменения приоритетов источников или runtime registry, оценка/изменение состояния сценария, merge либо deploy.

## 2026-10-17 — строгая связка BTC metric/source/unit прошла полный VPS rehearsal

**Действие:** для commit `11d2561a40a0fbb53fde455685caf78e9b72eeca` усилен `scripts/validate-source-catalog.mjs`: обязательная метрика связывается с разрешённым `source_id`, допустимым URL prefix, зарегистрированным endpoint и единицей `data_contract.unit`. Добавлены проверки spot `market.spot_price → market.kraken → USD/BTC` и ETF `institutional.etf_net_flow → institutional.primary → USD million/day`, а также отрицательные случаи для неразрешённого источника, mismatch units и отсутствующего endpoint.

**Результат:** полный VPS API Build Rehearsal [#39019979461](https://github.com/olegsh247-stack/Crypto/actions/runs/39019979461) завершился `success`. Все 27 основных шагов успешны: Source Catalog, canonical metric registry, сборки API/Worker, PostgreSQL bootstrap, BTC provenance, идемпотентность/дубликаты, backup/restore и API/Worker E2E.

**Вывод:** каталог теперь проверяет связность контракта метрики с источником и единицами на этапе CI; это не подтверждает, что ETF/DXY/spot уже проходят freshness, revision/finality и полную provenance-проверку. BTC остаётся `not_evaluable`.

**Граница безопасности:** изменения ограничены тестами и CI rehearsal. Production DB, live capture, runtime source priority/registry, сценарные оценки/состояния, merge и deploy не затрагивались.

## 2026-10-17 — BTC ETF contract discovery stage closed

**Decision:** closed the repeated source-search/design loop and recorded the final boundary in [BTC-ETF-CONTRACT-CLOSEOUT-2026-10-17.md](BTC-ETF-CONTRACT-CLOSEOUT-2026-10-17.md), linked from Plan 100. Farside + TFTC remain the configured research comparison pair; SoSoValue remains a previously verified API cross-check, not an independent third vote. The existing snapshot builder/diff, archive writer/verifier, and fail-closed eligibility evaluator are the final technical contract for this stage.

**Operational acceptance is not falsely marked complete:** no qualifying real capture pair ≥24 hours apart has been evidenced; source-specific long-term retention/reuse rights for Farside and SoSoValue are not established; and the private ETF archive plus independent backup/restore are not operational. These are concrete external evidence prerequisites, not permission to repeat source discovery. If rights cannot be cleared, leave ETF blocked rather than promoting a fallback implicitly. BTC remains `not_evaluable`.

**Safety:** no new capture/API request, raw-data retention, production DB writes, ingestion, source-priority/registry change, scenario evaluation/state change, merge, or deployment occurred in this closeout.


## 2026-10-17 — создан воспроизводимый disposable ETF test store

**Действие:** добавлен `scripts/btc-etf-test-storage.test.mjs` и документ `docs/BTC-ETF-TEST-STORAGE.md`. Тест создаёт синтетический ETF capture, проводит его через существующий offline archive writer, проверяет SHA-256, копирует архив в отдельный временный backup-каталог, восстанавливает в чистый каталог и повторно проверяет. Затем изменяет файл восстановленной копии и ожидает отказ проверки целостности.

**Граница результата:** тест использует только синтетические данные и тестовую запись о правах, которая явно не является реальным подтверждением прав. Он доказывает работоспособность программного пути архивации/копирования/восстановления/обнаружения порчи, но не подтверждает постоянное хранилище или независимый production failure domain. Временные файлы удаляются после теста.

**Решение Plan 100:** разработка не блокируется отсутствием купленного VPS/постоянного хранилища. Эти вопросы остаются частью pre-production operational acceptance для реальных данных, а не препятствием для офлайн-разработки и тестирования. См. обновление `docs/PLAN-100.md`.

**Безопасность:** не запрашивались провайдеры, реальные payloads не архивировались, production DB, runtime registry/source priorities, scenario evaluation/state/probabilities, merge и deploy не затрагивались.


## 2026-10-17 — ETF test storage test now runs in CI and passes

Added the disposable archive/backup/restore/tamper test to the existing VPS API test command. Full VPS Build Rehearsal [#39021289109](https://github.com/olegsh247-stack/Crypto/actions/runs/39021289109) completed **success**. The new test is no longer merely present in the repository; it is executed by CI. Scope remains synthetic/offline only and does not certify real provider rights, real snapshots, permanent archive operations, or BTC evaluability. No live provider capture, production writes, runtime source-priority changes, scenario evaluation, merge, or deployment.


## 2026-10-17 — Combined BTC readiness guard hardening

**Change:** The shared BTC readiness gate now rejects observations where source observation/publication time is later than retrieval time. It also blocks duplicate/conflicting ETF rows for one reporting date and excludes the date from selected inputs rather than silently taking the first row. Added regression tests for spot/ETF timestamp chronology and a conflicting ETF revision when five other dates exist.

**Why:** Retrieval time is provenance, not observation time; chronology must be coherent. Multiple eligible rows for a date require explicit revision review rather than automatic deduplication.

**Boundary:** Offline/read-only contract hardening only. No provider finality is inferred, no timestamps/rights/archive attestations are fabricated, and no live capture, production write, source-priority change, scenario evaluation/state change, deployment, or merge occurred. BTC remains `not_evaluable` pending real evidence gates.


## 2026-10-17 — Combined BTC gate CI and SoSoValue cross-check result

**Live read-only check:** [SoSoValue BTC ETF API Check #39022606386](https://github.com/olegsh247-stack/Crypto/actions/runs/39022606386) returned HTTP 200 and 21 unique daily reporting dates from 2026-09-18 to 2026-10-16; all 21 totals were numeric, no duplicate dates were found. Response size was 3,689 bytes and response SHA-256 was `6fe2f5e5c57b6d9a30ca28ccd698c2011d593ea8c496c0df9d2c413ef9b2cfb5`. Dates are trading dates (`yyyy-MM-dd`), latest month only. Revision/finality remains unknown; repeat capture/hash and row comparison is required. SoSoValue remains a cross-check only and is not counted as an independent third source because TFTC data lineage overlaps.

**Combined code verification:** [BTC Public Source Staging #39022606383](https://github.com/olegsh247-stack/Crypto/actions/runs/39022606383), [Web Build #39022606410](https://github.com/olegsh247-stack/Crypto/actions/runs/39022606410), [BTC Scenario Readiness Gate #39022659932](https://github.com/olegsh247-stack/Crypto/actions/runs/39022659932), and [VPS Build Rehearsal #39022659927](https://github.com/olegsh247-stack/Crypto/actions/runs/39022659927) passed. Readiness regression coverage now rejects capture-before-observation chronology and duplicate/conflicting ETF rows even when five other sessions exist.

**Still not attested:** The SoSoValue response artifact has 7-day retention only and does not qualify as durable archive evidence. This run does not prove a fresh Kraken capture, two qualifying Farside/TFTC captures at least 24 hours apart, source-specific raw-retention rights, or independent archive restore. It does not certify provider finality or make BTC evaluable. No production DB writes, source-priority changes, scenario evaluation/state/probability changes, deployment, or merge.


## 2026-10-17 — first live BTC spot and ETF capture completed

**Action:** Enabled an explicit one-off read-only capture trigger on the BTC public-source staging workflow and ran [BTC Public Source Staging #39023003456](https://github.com/olegsh247-stack/Crypto/actions/runs/39023003456) on commit `3803d624c3f6e767b3f665a8ec18e8d10d53dc76`. Both validation and capture jobs passed. Full evidence: [BTC-LIVE-SOURCE-CAPTURE-2026-10-17.md](BTC-LIVE-SOURCE-CAPTURE-2026-10-17.md).

**BTC spot:** Kraken XBTUSD returned **81,612.50 USD/BTC**; source trade time `2026-10-17T09:56:37.159Z`, retrieval `09:56:42.077Z`, age 4.918s, HTTP 200, SHA-256 `74e6b6414f9f27861312c69b69b54735d47aeb3f657ea88dfac74a556327ea9d`. Candidate freshness is CURRENT under the 1-hour policy, but remains `REVIEW_ONLY` and non-persistable.

**ETF:** Farside all-data HTTP 200, 14 parsed rows (2026-09-29–2026-10-16); TFTC JSON HTTP 200, 709 rows, updated through 2026-10-15, CC BY 4.0 attribution returned. Response hashes are recorded in the evidence report. Five latest overlapping trading dates (Oct 9, 12–15) fall within the $0.65m diagnostic band. Oct 7 still differs materially: Farside −$484.9m vs TFTC −$487.067m (−$2.167m), primarily BRRR; values are preserved separately. No canonical averaging/ingestion is approved.

**Artifacts:** Raw source responses, manifest, and review-only normalized candidates were uploaded as temporary artifact `btc-public-source-review` (ZIP SHA-256 `aa749adb9341e7f2037775c5dceb952da2ade10954cf8fca2d45f0727b737710`, expires 2026-10-24 09:56:45 UTC). Raw responses were not committed to Git or written to a database.

**Remaining real blockers:** second qualifying pair capture ≥24h later and row-level diff; provider publication/revision/finality semantics; Farside long-term retention/reuse rights; real durable private archive plus independent restore; human snapshot review. BTC remains `not_evaluable`.

**Safety:** no production DB access/writes, ingestion, registry/source-priority change, scenario evaluation/state/probability changes, deployment, or merge.


## 2026-10-17 — DXY source verification and credential decision

**Finding:** Compared Yahoo Finance `DX-Y.NYB`, Alpha Vantage, FXMacroData, Live-Rates.com, FRED `DTWEXBGS`, ICE, and TradingView against the actual requirement: a lawful, free automated feed for ICE US Dollar Index (DXY). None of the reviewed candidates is currently approved for that role. Yahoo's terms prohibit automated collection without express prior permission; Alpha Vantage documents the relevant major-index endpoint as premium; FXMacroData's public docs do not offer DXY; Live-Rates does not document DXY coverage and requires a key for instrument discovery/history; FRED's `DTWEXBGS` is a different broad-dollar index; TradingView is a visual reference only. ICE is the authoritative licensing route, but a free public feed was not verified.

**Decision:** No new DXY keys requested. DXY remains blocked/optional. Do not substitute `DTWEXBGS` under the DXY identity. Daily data does not require 15-minute polling. Evidence and future data contract are in [DXY source verification](DXY-SOURCE-VERIFICATION-2026-10-17.md).

**Boundary:** Documentation only; no provider credentials were created, no automated DXY collector/source-priority change was made, and no BTC runtime/scenario state was changed.


## 2026-10-17 — Direct DXY source probe: actual provider responses

**Execution:** [DXY Public Source Probe (Read Only) #39029711852](https://github.com/olegsh247-stack/Crypto/actions/runs/39029711852) completed successfully. Six public endpoints were queried from a GitHub runner without credentials or database writes; response hashes and raw response files are in the temporary [probe artifact](https://github.com/olegsh247-stack/Crypto/actions/runs/39029711852/artifacts/12099577539), expiring 2026-10-24. Full result: [DXY-SOURCE-PROBE-2026-10-17.md](DXY-SOURCE-PROBE-2026-10-17.md).

**Actual results:** Yahoo Finance `DX-Y.NYB` chart endpoint HTTP 200; `regularMarketPrice=101.779` at source time `2026-10-16T20:59:59Z`, last daily candle close about 101.84 for 2026-10-16. Alpha Vantage demo query returned its demo-key information message; public index catalog returned no DXY/Dollar Index matches. FXMacroData USD catalogue returned distinct Fed/BIS dollar-index series and explicitly says they are not ICE DXY. Live-Rates `/api/rates` without a key returned HTTP 200 with body `Invalid Authentication`, no quote. FRED public CSV returned `DTWEXBGS=121.6023` for 2026-10-09; this is not DXY.

**Decision/boundary:** Yahoo is the only technically successful direct DXY retrieval among the five services in this test, but technical access does not clear permission for automated collection or raw retention. No source promoted; no key created; no production collector, runtime source-priority change, DB write, scenario evaluation/state change, deployment, or merge.


## 2026-10-17 — Plan 100 stage review and Yahoo Finance DXY decision

**Review:** Rechecked the current Plan 100 and the latest VPS Build Rehearsal [#39029846540](https://github.com/olegsh247-stack/Crypto/actions/runs/39029846540), which completed successfully. CI confirms repository-side build, PostgreSQL migration rehearsal, canonical registry/provenance checks, duplicate/idempotency checks, backup/restore rehearsal, and API/Worker E2E. It does not certify a provisioned VPS, independent production backup, complete Product Contour audit, or BTC scenario readiness.

**Stage disposition:** Hosting architecture is ready for repository/CI rehearsal but not real VPS cutover; PR reconciliation and full Product Contour audit remain open; BTC input contracts are substantially hardened but real spot/ETF evidence and hashrate/fee-subsidy semantics remain incomplete; BTC scenario and end-to-end acceptance are not complete; VPS, migration/cutover, operations, and final acceptance remain future gates. SOL/CAKE remain deferred until BTC E2E.

**DXY decision:** User selected Yahoo Finance `DX-Y.NYB` as the available DXY reference. The actual read-only probe returned HTTP 200, regular-market quote 101.779 at `2026-10-16T20:59:59Z`, and daily close about 101.84 for 2026-10-16. This authorizes using the retrieved value for manual/offline research, not assuming permission for automated collection or durable raw retention. No collector, registry/source-priority change, DB write, scenario evaluation/state change, deployment, or merge was performed. DXY remains optional for BTC readiness; do not substitute FRED `DTWEXBGS`.

**Next:** close real evidence gates for BTC spot/ETF, confirm hashrate aggregation and fee/subsidy calculation contracts, then perform offline/read-only scenario replay. Do not wait for a full 13-fund daily ETF holdings panel if the available dataset is used with explicit coverage and limitations.


## 2026-10-19 — Metric-to-endpoint semantic parity audit

**Finding:** The source registry, metric registry, catalog, and SQL seed have set-level ID coverage, and the SQL source-ID parity assertion already checks both directions. That does not establish endpoint-level semantic compatibility.

**Confirmed gaps:** (1) ETF BTC holdings and corporate BTC holdings metrics declare BTC, while the catalog's concrete `institutional.primary` endpoint is a Farside daily flow endpoint declared as USD million/day; (2) multiple network metrics rely on `network.primary` without a metric-specific endpoint/field/normalization contract in the catalog; (3) several `protocol.primary` metrics reference a documentation-only catalog entry; (4) futures/funding/options and US 10-year yield use blocked placeholder source contracts.

**Artifact:** Added [Metric-to-Endpoint Semantic Parity Audit](METRIC-ENDPOINT-SEMANTIC-PARITY-AUDIT-2026-10-19.md), separating confirmed structural parity from semantic-contract gaps and defining the next controlled actions.

**Decision/boundary:** No source-priority or metric-registry change was made; changing ETF holdings eligibility requires explicit approval. No live source capture, production DB read/write, ingestion, scenario evaluation/state change, deployment, or merge. BTC remains `not_evaluable`. The latest readiness and VPS build runs were still queued when checked; no pass is claimed.


## 2026-10-19 — Non-blocking semantic-contract audit added to source-catalog validator

**Change:** Extended `scripts/validate-source-catalog.mjs` to report metric/source pairs whose registered catalog endpoints do not declare an exact unit match, including pairs with no concrete endpoint. Added regression assertions requiring the audit to flag ETF BTC holdings and corporate BTC holdings when only the Farside flow endpoint is registered for `institutional.primary`. Findings are deliberately non-blocking and do not alter source priorities.

**Verification status:** The updated file is present on the branch at commit `35ccee491a6f6d901ff5093ae8ab148e96b1734f`. VPS API Build Rehearsal [#39284356487](https://github.com/olegsh247-stack/Crypto/actions/runs/39284356487) was queued at the last check; no CI pass is claimed until it completes.

**Boundary:** No registry/source-priority edits, live capture, production DB access/write, ingestion, scenario evaluation/state change, deployment, or merge. BTC remains `not_evaluable`.


## 2026-10-19 — Metric-to-endpoint contract detail

**Change:** Added [Metric-to-Endpoint Contract Detail](METRIC-ENDPOINT-CONTRACT-DETAIL-2026-10-19.md), the next read-only pass after the semantic parity audit. It records per-metric units/freshness, current source mapping, what the catalog concretely proves, and the remaining endpoint/field/methodology gaps.

**Key finding:** The BTC spot metric registry approves Kraken Trades with provider trade timestamps, but the API's separate display ticker helper uses a Ticker endpoint and stamps retrieval time as its timestamp. This may be acceptable for display, but it must not be silently reused as a canonical readiness observation. The report also specifies the reproducible realized-fees/subsidy ratio contract and keeps the cumulative-issuance candidate separate from circulating supply.

**Verification:** VPS API Build Rehearsal [#39284388890](https://github.com/olegsh247-stack/Crypto/actions/runs/39284388890) completed successfully for the preceding semantic-validator journal commit. The new report is documentation-only; no code/runtime contract changed in this commit.

**Boundary:** No source-priority/registry change, live provider capture, production DB access/write, ingestion, scenario evaluation/state change, deployment, or merge. BTC remains `not_evaluable`. Next work should align the BTC spot readiness contract with actual provider trade timestamps and separately document the display ticker, then continue the ETF and network-metric contract gaps.


## 2026-10-20 — BTC read-only hashrate API probe

- `mempool.space/api/v1/mining/hashrate/1m` returned timestamped daily hashrate values and difficulty fields. Latest visible point: 2026-10-20 00:00 UTC, about 1,065.92 EH/s; top-level `currentHashrate` about 1,058.35 EH/s. Timestamped point falls within the optional 48h freshness window.
- This is only an endpoint/shape probe: full body/headers, client retrieval time and response SHA-256 were not captured, so it is not yet an accepted provenance-grade observation. Evidence: `docs/BTC-READONLY-API-PROBE-2026-10-20.md`.
- Next practical steps: fresh Kraken trade capture, second ETF snapshot and row-level diff, fee/reward capture, then offline BTC rule replay. No production DB writes, scheduled capture, scenario evaluation/state/probability changes, deployment or merge; BTC remains `not_evaluable`.


## 2026-10-20 — BTC read-only API capture actually executed

- Triggered and inspected GitHub Actions [BTC public-source capture #39457095319](https://github.com/olegsh247-stack/Crypto/actions/runs/39457095319) and [SoSoValue ETF API check #39457111161](https://github.com/olegsh247-stack/Crypto/actions/runs/39457111161); both capture jobs succeeded. Review artifacts were downloaded and inspected.
- Kraken returned a fresh trade-based quote **82,253.70 USD/BTC** (trade timestamp 16:24:17.416Z, captured 16:24:20.543Z; raw SHA-256 `62bfcd07f6cb795fa8df988dbdbd8555b8fd7c3dee1d5de4c9c51effed7cbb1e`). Binance market-data and OKX returned 82,372.47 and 82,369.40 **USDT/BTC**; Binance main API was HTTP 451 and Bybit HTTP 403. USDT cross-checks are not canonical USD inputs.
- mempool.space returned 7 hashrate points (latest 1,065.922 EH/s at 2026-10-20 00:00Z) and 831 block-fee rows (heights 971273–972351 over approximately seven days). Fee units/window semantics are not yet accepted; no ratio was computed.
- SoSoValue returned HTTP 200 with 21 unique trading dates (2026-09-21–2026-10-19), all 21 net-flow values numeric, no duplicate dates; newest daily net flow +526.595998m USD. Publication timestamp and revision finality remain unspecified. 2026-10-07 differs from Farside: −487.067412m vs −484.9m USD, driven primarily by BRRR (−2.114298m in TFTC/SoSoValue vs 0 displayed by Farside). TFTC identifies SoSoValue as a source of its current aggregates, so it is not independent corroboration.
- Farside direct page returned HTTP 403; alternate all-data page returned HTTP 200 and parsed historical rows. 2026-10-20 is unreported, not zero. All artifacts are review-only; no production DB access/write or scenario-state changes.
- **Next:** confirm fee units/subsidy semantics; test circulating supply; repeat ETF capture to compare response hashes/rows for revisions. BTC remains `not_evaluable`.


## 2026-10-20 — BTC fee/reward and circulating-supply probes

- Extended the review-only API capture; GitHub Actions [#39457465132](https://github.com/olegsh247-stack/Crypto/actions/runs/39457465132) succeeded. Artifact ID `12280533381`, SHA-256 `5835f2af227ef1ceac8942d253d1a909876ae52b40a7931eb7b9658cd1613419`.
- Mempool.space exact recent-block endpoints returned 175 fee rows and 174 reward rows; 174 matched heights (972178–972351). On every matched height, reward minus fees equals 312,500,000 raw units (3.125 BTC subsidy). The 144-block aggregate returned total fees 181,863,392 and total rewards 45,181,863,392; both exactly equal sums from per-block rows for heights 972208–972351. Implied 144-block fee/subsidy ratio: **0.40414%**. Latest block fee/subsidy ratio: **1.75953%**. These are research calculations pending formal metric/methodology and reorg contract.
- Blockchain.com total-bitcoins chart returned HTTP 200, unit BTC, daily period; latest point **20,098,862.5 BTC at 2026-10-15 23:52:59Z**, ~4.7 days old at retrieval. Response SHA-256 `55b46101fae5e30946b6b7051d632fc9105bb888ea8bb4004171e03e4ca0cec8`. Treat as dated theoretical issuance candidate, not current canonical supply.
- Next: formalize fee/subsidy calculation and reorg handling; seek a fresher supply observation or define a versioned issuance-derived supply method; repeat ETF capture for revision comparison. BTC remains `not_evaluable`; no production writes or scenario-state changes.


## 2026-10-20 — Current-tip BTC issuance candidate

- Staging capture [#39457704558](https://github.com/olegsh247-stack/Crypto/actions/runs/39457704558) succeeded. Mempool tip-height endpoint returned **972351** at 16:28:32.916Z; response SHA-256 `3984b19cee165f8b20184dc86722d65e90964e4ef6321e5d9de83408ba02a988`.
- Versioned subsidy schedule calculation through inclusive height returned **20,101,100 BTC**. This is a research-only theoretical issuance candidate; tip endpoint supplies no block hash/timestamp, so height identity and reorg handling remain required. No registry/source-priority change or production write.
- Next: capture tip hash/timestamp with the height, test subsidy halving boundaries, then run offline BTC readiness replay. BTC remains `not_evaluable`.


## 2026-10-20 — Corrected BTC capture semantics

- Commit [b649e252786675199b77e54d55b4ced3a35815e0](https://github.com/olegsh247-stack/Crypto/commit/b649e252786675199b77e54d55b4ced3a35815e0) corrected two misleading staging-manifest statements: Yahoo Finance DX-Y.NYB had already been retrieved in separate source verification, so DXY is described as optional/not part of the required BTC capture gate; the 24h fee/reward endpoints are now explicitly treated as recent-window diagnostics unless individual-block identity/granularity is verified.
- This is a capture-contract/documentation correction only. It does not change source priorities, ingest data, evaluate the scenario, or change BTC's `not_evaluable` state.
- Current-head CI result is not confirmed: the GitHub workflow-run lookup returned no PR-triggered runs for this commit. Prior successful capture and offline checks belong to earlier commits and are not represented as validation of this change.


## 2026-10-20 — Kraken freshness guard added

- Commits [3dd6da6](https://github.com/olegsh247-stack/Crypto/commit/3dd6da6e6bd0b299dbbc93ae96bbc133b9f513e2) and [bcdcf49](https://github.com/olegsh247-stack/Crypto/commit/bcdcf493e9b2b227cf991775de2219f34a6dbe31) add a capture-time freshness result for the latest Kraken XBT/USD trade (1-hour limit, explicit future-timestamp rejection) and reject non-finite/non-positive prices. The capture output now reports age and freshness status; this is a probe-level guard, not scenario acceptance.
- The latest commit message requests the repository's read-only staging capture workflow. The available commit-status lookup currently returns no status checks, and the workflow-run connector does not expose push-triggered runs; therefore neither execution nor pass/fail is confirmed here. Do not treat this as a successful capture or CI pass.
- No production write, registry/source-priority change, scenario evaluation/state change, deployment, or merge. BTC remains `not_evaluable`.


## 2026-10-20 — BTC tip identity and exact issuance arithmetic

- Added `scripts/bitcoin-protocol-issuance.mjs` with integer-satoshi (`BigInt`) arithmetic for theoretical protocol issuance through an inclusive block height, plus six tests covering genesis, first/second halving boundaries, height 972351, invalid heights and the zero-subsidy cap. Ran the isolated test file locally under Node 22: **6/6 passed**.
- Added the read-only Mempool.space `/api/blocks` endpoint to the source catalog and BTC staging capture. The new candidate requires block height, 64-hex hash and block timestamp, and binds the issuance estimate to that identity. The existing height-only endpoint is retained as a cross-check, not as sufficient block identity.
- Wired the issuance tests into BTC Public Source Staging and added the endpoint to the source-catalog semantic coverage check. Relevant files were re-fetched after writes and confirmed to contain the expected implementation and workflow wiring.
- Current GitHub Actions status for the latest branch head remains unconfirmed through the available run/status lookup; the isolated local unit tests do not substitute for the full staging workflow. The staging commit requested a read-only capture; no production DB or scenario state was touched.
- PR #83 remains Draft/non-mergeable with a diverged history (main is 141 commits ahead of the PR branch's merge base direction; branch is hundreds of commits ahead). Do not merge or rebase the 96-file PR blindly. BTC remains `not_evaluable` pending fresh capture and remaining spot/ETF acceptance gates.


## 2026-10-20 — BTC staging workflow coverage fix

- Fixed `.github/workflows/btc-public-source-staging.yml`: source catalog and its validator are now included in path triggers, the catalog contract validator runs in the staging validation job, and the read-only capture job timeout is 8 minutes rather than 3 to avoid prematurely cutting off the bounded multi-source probe. Commit: `beffc512c7cd42a566ad979c488ba6ea0b5cddb1`.
- The commit message requests the staging capture. The connected GitHub run/status lookup still returns no run/status data for the current head, so execution and pass/fail are not confirmed. Local isolated issuance tests passed 6/6; full staging validation remains pending.
- PR #83 remains Draft and non-mergeable due to history divergence; do not merge blindly. No production writes, source-priority changes, scenario evaluation/state changes or deployment.


## 2026-10-20 — Direct Mempool tip endpoint probe

- A fresh read-only fetch of `https://mempool.space/api/blocks` returned a block list whose first row included height **972366**, hash `000000000000000000015c59b038d71458c626b4d3e5de251a20f7fcba08f77d`, and block timestamp **2026-10-20 18:40:29 UTC**. This confirms the endpoint response shape needed by the new capture parser.
- The versioned inclusive-height subsidy calculation gives a research-only theoretical issuance candidate of **20,101,146.875 BTC** at height 972366 (15 blocks after the previously reviewed height 972351). This is not economic circulating supply and does not pass the full provenance gate: this direct probe did not produce a saved raw artifact, exact retrieval timestamp, or response SHA-256. The staging capture remains the route to a provenance-grade record.

## 2026-10-20 — Branch divergence review and fresh read-only source check

- Rechecked PR #83 and branch comparison against current `main`: PR remains open/Draft and `mergeable=false`; compare reports `diverged`, **615 commits ahead / 141 behind**. The change set touches 98 files. Do not merge or rebase blindly; branch reconciliation requires a controlled file-level comparison and fresh checks.
- The latest commit `6d360e6b4cd510c887661095e3c574216cd2ec50` has no combined status checks reported by the connected lookup, and its workflow-run lookup is empty. This is an observability limitation, not evidence of success or failure. The staging workflow request on `beffc512c7cd42a566ad979c488ba6ea0b5cddb1` is not confirmed as executed.
- Fresh read-only Mempool API response now shows tip height **972369**, hash `00000000000000000000c786ec5fc0200b8e96179ba2b71e0e442655d2ef3922`, timestamp **2026-10-20 19:31:27 UTC**. The inclusive-height protocol issuance calculation is **20,101,156.25 BTC**. As with the earlier probe, this browser fetch did not save a raw artifact, retrieval timestamp, or response digest; it confirms current endpoint shape/value only and is not provenance-grade evidence.
- Farside's all-data page currently displays **19 Oct 2026: +526.7 USD million** as the latest complete daily total. The row for **20 Oct 2026** contains dashes for all fund fields and displays total 0.0; those dashes are placeholders, **not a confirmed zero-flow observation**. This is a fresh page read, not an archived snapshot with response hash and publication/revision metadata. Source: https://farside.co.uk/bitcoin-etf-flow-all-data/
- Next practical gate remains the repository's read-only staging capture artifact: verify Kraken USD/BTC trade freshness, Mempool tip identity/issuance, fee/reward payload semantics, and ETF raw-response capture; keep unresolved metrics blocked. No production writes, source-priority changes, scenario evaluation/state/probability changes, deployment, or merge. BTC remains `not_evaluable`.

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

## 2026-10-20 — BTC read-only API capture inspected and cross-source discrepancies confirmed

- BTC Public Source Staging [#39493460506](https://github.com/olegsh247-stack/Crypto/actions/runs/39493460506) completed successfully; review artifact `btc-public-source-review` (ID `12295314834`, SHA-256 `9278bb6cc40cdefc5df17da7c8fa1ad5438685429e97cb5fa711963a9321cbd1`) was downloaded and inspected. Manifest retrieval time: 2026-10-20T20:36:52Z. The run used review-only mode and confirms no production DB access/writes.
- Kraken XBT/USD latest trade: **82,646.40 USD/BTC**, observed at 20:36:47.579Z and retrieved at 20:36:52.623Z (5.044 seconds old); payload SHA-256 `fa78221bafdbcf0ae31e22fcfa92593c1d2cf7920bb9634bf86d19a28511275b`. Fresh at capture time; candidate only, not persisted.
- Mempool fee window covers 144 contiguous blocks, heights 972232–972375. Total fees **222,607,994 sats (2.22607994 BTC)**, protocol subsidy **45,000,000,000 sats (450 BTC)**, ratio **0.494684%**. Start/end hashes and tip height/hash matched before and after collection. Compared with the earlier 18:01 capture, the 144-block window advanced by 13 blocks, but prior artifact lacks matching per-block fee/hash rows for the full overlap; a strict overlap comparison is still outstanding. Aggregate source status remains blocked for reorg/finality and deployed API-version verification.
- Supply discrepancy: Mempool tip identity at height **972375** supports protocol-scheduled total issuance of **20,101,175 BTC**; Blockchain.com chart reports **20,097,468.75 BTC** with latest chart point dated **2026-10-13**, a difference of **3,706.25 BTC**. Treat the chart point as stale/semantics-unresolved; do not blend or replace protocol issuance with an economic circulating-supply measure. Metric meaning and source priority remain unresolved.
- ETF latest completed session **2026-10-19**: Farside **+526.7 USDm**, SoSoValue **+526.595998 USDm**, CryptoETF.today **+526.7 USDm**; TFTC remains a mirror/candidate, not independent corroboration. Farside row-level fund sum reconciles to its displayed total. **2026-10-20 is unreported**, not zero. Reporting/publication time, revisions and finality remain unverified, so ETF candidates remain blocked from canonical ingestion. The earlier 2026-10-07 disagreement remains documented as research-only and is not reopened.
- Source access results: Kraken 200; Binance primary endpoint 451 with market-data-only BTC/USDT fallback 200; OKX BTC/USDT 200; Bybit 403; direct Farside page 403 while all-data page 200. USDT quotes are not treated as USD. Yahoo DXY was not requested in this run and remains unrefreshed.
- All staging tests completed successfully in the run, including reorg comparison, fee-window validation, ETF parsing/snapshot tests, protocol issuance and candidate normalization. These tests validate tooling, not production readiness. BTC remains `not_evaluable`; no registry/source-priority changes, ingestion, scenario-state changes, deployment or merge.
- Next checks: (1) compare overlapping per-block fee/hash rows after a later window advances by at least six blocks; (2) resolve the 3,706.25 BTC supply discrepancy by aligning timestamps and metric semantics; (3) obtain a second ETF snapshot at least 24 hours after the previous one and compare row revisions. 


## 2026-10-24 — ETF timing/revision semantics review

**Checked:** Farside's official description says daily US spot BTC ETF flows are in USD millions and update in real time, usually evening/night US time; its public explanation describes minute-level polling of multiple inputs and calculation of implied USD flows. Neither source gives a per-row publication timestamp or formal finality/revision marker. TFTC's methodology says its current daily aggregates and ongoing per-fund flows come from SoSoValue, with Farside used for archived per-fund history through mid-July 2026; TFTC is therefore not independent current confirmation of Farside.

**Decision:** Farside remains priority; SoSoValue/TFTC are cross-checks only, no averaging. Store session_date separately from retrieved_at; provider_published_at remains null and revision/finality UNKNOWN unless provider evidence is present. Keep immutable snapshots and detect revisions by comparing historical rows/payload hashes. Missing fund fields remain missing, not zero; incomplete rows cannot be accepted even if remaining values happen to sum to the displayed aggregate.

**Result:** the public-source review establishes the current contract limitation, not finality. The 2026-10-23 Farside row (−137.9 USDm, HODL missing) remains INCOMPLETE; 2026-10-22 (−635.6 USDm) is the latest fully reconciled session. ETF remains blocked from canonical/production ingestion and BTC remains not_evaluable. No runtime, registry, DB, scenario, ingestion, deployment, or merge changes.


## 2026-10-24 — Farside >24h repeat-snapshot comparison executed

Compared the read-only Farside captures from 2026-10-23T08:01:55.335Z and 2026-10-24T15:31:08.713Z (**31.487h apart**, 24h gate passed). Raw payload hashes: older `a96032a3d9f4c881201ecc79654210afa6a992faa76937e9562eabcffa102f57`, newer `40e211b691f06495f3a34cd290252b829b030687075a21c7b9ec43c044fff41e`. Archive hashes: older `c204535e252842ec037abd3ca46ebf7bab60f30ef9713f49c92512fbe4debefb`, newer `e0eee123c2e361696df3a9da444f269a3224fbabf4fd404055d123cd73502e34`.

**Result:** 13 overlapping sessions (2026-10-06–2026-10-22), **0 changed row signatures**. The newer rolling 14-row view adds 2026-10-23 and drops 2026-10-05; the raw payload changed but that is not itself a historical revision. The 2026-10-23 row still has missing HODL and remains INCOMPLETE. This confirms no revision was detected for the 13 overlapping dates during this interval; it does not establish permanent finality or source publication timestamps.

Both artifacts/hashes are retained as evidence in the local review workspace; no production DB, ingestion, registry/runtime/scenario state, deployment, or merge changes. BTC remains not_evaluable.


## 2026-10-24 20:28 UTC — BTC recapture attempt 2 and fee overlap

- Re-ran the existing read-only staging job [#40107313213, attempt 2](https://github.com/olegsh247-stack/Crypto/actions/runs/40107313213); success. Artifact **12574657927**, archive SHA-256 `af34b85f7f7de7d99b932f4a30ab5f9e994c4be98d5b1040efbd0d6c51c45dfb`. Manifest confirms no production DB access/writes.
- Kraken XBT/USD **80,454.80 USD/BTC**, observation `20:28:16.209Z`, retrieval `20:28:17.616Z`, payload SHA `d52982b74f598f711665918c0f41b6827e6028183f8035c7b42850b057c3139e`.
- Farside payload SHA `368a6a8c9e1c4ebf68de93921057512588f9ea855ccddff3b9923b01e0528efd`; 23 Oct still `-137.9 USDm` with HODL null, `INCOMPLETE`. SoSoValue API HTTP 200, SHA `d3666d105e0eb460996b11437c62d9d974f94cc3e578a63338876b06c981ff8b`, but latest date remains 22 Oct. No fallback/averaging; Farside priority, SoSoValue/TFTC cross-check only.
- Mempool tip **972970**, issuance **20,103,034.375 BTC**, hash `00000000000000000000f641a993b3f589150f30bc15f155d33d86c7448979b3`; CoinGecko circulating **20,102,953**, total **20,103,015 BTC**, last_updated `2026-10-24T20:26:48Z`. Gap: Mempool +19.375 BTC vs total and +81.375 BTC vs circulating. Keep protocol issuance and economic circulating supply separate; timestamp still not accepted as supply-specific.
- Fee window **972827–972970**: 204,356,274 sats fees, 450 BTC subsidy, ratio **0.4541250533%**. Compared with prior window 972797–972940, **114 overlapping blocks** (972827–972940) match hash, parent hash and per-block fees; **0 differences**. JSON SHA `758da0a6abcd29324c8eec5ae04e6aa5c1733d4a61ca75a15e3944f648fd35d5`.
- All capture/parser/calendar/fee/candidate steps passed. BTC remains `not_evaluable`; no production DB, ingestion, registry/runtime/scenario changes, deployment or merge. Plan 100 updated in commit `4e7fd73b0b47e7c413a324d925d579ec376c0e58`.


## 2026-10-24 — ETF 23 Oct cross-source resolution

Reviewed raw responses in read-only artifact 12574657927 (run #40107313213). Farside all-data says 2026-10-23 aggregate −137.9 USDm but HODL is null, so row remains incomplete. CryptoETF.today repeats −137.9 at 0.1 USDm precision but supplies only aggregate flow; its 24 Oct zero is a placeholder, not an observed zero. SoSoValue and TFTC stop at 22 Oct (`updatedThrough=2026-10-22` for TFTC). None supplies independent per-fund evidence to fill HODL. Keep Farside priority; other sources cross-check only; no averaging, no missing-to-zero conversion, no promotion of 23 Oct. Plan 100 updated in `efb40cad069250c4060e231ff21d4e5b9054a350`. BTC remains `not_evaluable`; no production writes or runtime changes.


## 2026-10-24 — staging artifact retrieval/restore rehearsal

Re-downloaded and extracted artifacts 12565600908 and 12574657927. ZIP integrity passed for both; each archive had 19 files / 17 source entries, and all 16 available raw payload hashes matched the manifest (0 mismatches). Archive SHA-256: prior `e0eee123c2e361696df3a9da444f269a3224fbabf4fd404055d123cd73502e34`; newer `af34b85f7f7de7d99b932f4a30ab5f9e994c4be98d5b1040efbd0d6c51c45dfb`. Both manifests confirm read-only staging and no production DB access/writes. This proves current artifact retrieval/restore integrity only; 7-day CI retention is not durable archive/backup. Long-term retention/restore remains blocked pending self-hosted infrastructure and its backup test. Plan 100 updated in `40b688e4b64b1fc67736a8e0f3ae74996b235979`.


## 2026-10-25 07:53 UTC — BTC staging recapture

- Re-ran read-only capture [BTC Public Source Staging #40107313213, attempt 3](https://github.com/olegsh247-stack/Crypto/actions/runs/40107313213): success. Artifact **12591299886**, ZIP SHA-256 `a49a52197dc68708ae15a406305bbafa329bd2436b0e001c56424d05458ad76c`. Production DB access/writes both false.
- Kraken XBT/USD **80,594.80 USD/BTC**, trade `2026-10-25T07:52:51.193Z`, retrieved `07:52:51.438Z`, SHA `f94a5326626140ab18a6655c55b15e5a93e6183c82790341a2097fe4c41d5ca7`.
- Farside 23 Oct total remains **−137.9 USDm**, HODL is `-`, calculated fund sum null, status `INCOMPLETE`; payload SHA `277d557b576239cd0e8340b6cec9b680d848db8ea859546872477035767ebaef`. SoSoValue latest date remains 22 Oct. CryptoETF.today's −137.9 for 23 Oct is a cross-check only; it does not fill the missing fund value. No averaging/fallback.
- Mempool tip 973037, issuance **20,103,243.75 BTC**; CoinGecko circulating/total both **20,103,187 BTC**, `last_updated=2026-10-25T07:51:47Z`. Gap 56.75 BTC; keep metrics separate and timestamp unresolved. Mempool payload SHA `fcf5fc42a3b8070701e3b2310106e12f2061f49605903db8c8d469b4d14e5e46`; CoinGecko SHA `c322ce265dec23580a876ca52e8b50aea95de4e5e5529ba9ff35b8244c46afcd`.
- Fee window **972894–973037**: fees 193,815,563 sats (**1.93815563 BTC**), subsidy 450 BTC, ratio **0.4307012511%**. Compared with prior 972827–972970 window, **77 overlapping blocks** match block hash, parent hash and fees; zero differences; tip stable before/after.
- BTC remains `not_evaluable`; no production DB/ingestion/registry/runtime/scenario changes, deployment or merge. Plan 100 updated in commit `5589e90c737b4b8ed5f40203943c99972ead8d36`.


## 2026-10-26 — ETF source list expanded; source prompt added

- Added source-registry entries for CryptoETF.today, CoinPulseHQ, Bitcoin Almanack, BitTradeScanner, Bitbo and BitcoinTreasuries.net; updated the existing CryptoETF.today catalog candidate to reference its registered source ID.
- Added five source-catalog endpoints for CoinPulseHQ flow cross-check, Bitcoin Almanack session-status cross-check, BitTradeScanner flow cross-check, Bitbo holdings, and BitcoinTreasuries.net holdings. The catalog now contains 40 endpoint entries; source registry contains 22 source entries.
- Added `docs/SOURCE-REGISTRY-PROMPT.md` with source-selection rules, ETF flow versus BTC holdings distinction, source roles, provenance requirements, and next-step sequence. The prompt does not approve any source for canonical ingestion or alter metric source priority.
- Source policy retained: Farside primary research source for flows; SoSoValue/TFTC cross-check; CryptoETF.today/CoinPulseHQ/BitTradeScanner auxiliary flow cross-checks; Bitcoin Almanack session-status cross-check; Bitbo/BitcoinTreasuries.net holdings-only.
- **Verification pending:** source-catalog validation and exact-head CI must be checked after these commits. No claim that a new API capture has run. No runtime/readiness, metric source priority, production DB, ingestion, scenario state/probabilities, deployment, or merge changes. BTC remains `not_evaluable`.


### 2026-10-26 — corrected source-registry/SQL seed parity

- First CI run after expanding source registry failed: six new candidate IDs were missing from the static `infrastructure/postgres/seed-v1.sql` source block. The BTC registry/readiness job stopped at the same registry validator before running the test suite; this was not a scenario-rule regression.
- Added matching seed entries for `institutional.cryptoetf_today`, `institutional.coinpulse`, `institutional.bitcoin_almanack`, `institutional.bittradescanner`, `holdings.bitbo`, and `holdings.bitcointreasuries`.
- Manual current-branch consistency check: 22 registry sources, 22 seed source IDs, no missing/extra/duplicate IDs; 40 unique catalog endpoint IDs; none of the six new sources appears in active metric source priority.
- Exact-head CI after this correction is **unconfirmed** because the workflow-run lookup returned no run for the corrected SHA. The previous failure remains a real historical result, not a passing check. No database was modified; no runtime/readiness, metric priority, scenario state, deployment, or merge changes.


## 2026-10-26 — разрешён fallback между источниками BTC/ETF

**Решение пользователя:** разрешено заменять недоступные, устаревшие или неполные данные новыми источниками того же показателя. Farside больше не единственный допустимый источник flows, а свежесть котировки не должна делать работу бесконечной.

**Изменение:** spot readiness допускает наблюдение BTC/USD до 6 часов; перед реальным запуском нужно обновить котировку. ETF flows может использовать Farside, SoSoValue, CryptoETF.today, CoinPulseHQ, BitTradeScanner или TFTC при зарегистрированном источнике, допустимом URL, нормализованных USD million/day, валидной сессии/provenance и явном числовом значении. Bitcoin Almanack — статус сессии; holdings не заменяют flows. Для самой новой сессии разрешён fallback на пригодную альтернативу, а явно неполная панель не выбирается поверх неё.

**Проверка:** добавлены regression tests для SoSoValue fallback, альтернативы при неполной Farside-панели и отказа status-only tracker. CI на итоговом commit ещё не подтверждён; BTC не объявляется evaluable до проверки.

**Граница:** только readiness, тесты и документация; production source priority, ingestion, DB, scenario state/probabilities, deployment и merge не менялись.


## 2026-10-26 — BTC review-only capture passes input readiness

**Evidence:** BTC Public Source Staging [run #40388837927](https://github.com/olegsh247-stack/Crypto/actions/runs/40388837927), artifact 12682068022, captured at 2026-10-26T19:41:02.631Z; archive SHA-256 `269e689b2ee2171cb00daa0a3aa2daf265744df121c56ac130e13b54457d1412`. Production DB access/writes both false.

**Data:** Kraken BTC/USD 79,900.90, trade time 19:40:59.182Z, retrieval 19:41:02.631Z, raw SHA-256 `22f311f8f966ae4a42fff5106f31e5ea044ef379c6b752fe2e3c140ab042f9fd`. Farside 23 Oct ETF total −137.9 USDm is complete and reconciled; latest 26 Oct placeholder is excluded. SoSoValue −137.93636481 and CryptoETF.today −137.9 USDm corroborate the aggregate; no averaging. Weekend/market non-session zero placeholders are excluded.

**Result:** offline readiness assessment returned `ready_for_rule_evaluation`, blockers empty, selected inputs contain spot price and ETF flows. The ETF provider publication timestamp remains unknown and is kept null; readiness freshness uses recent retrieval plus explicit session date. All relevant CI checks passed on head `2feff18655d6314d4d9669635cc0468b254095c8`: readiness gate, source catalog, VPS API build rehearsal, seed idempotency, release workflow validation and read-only capture.

**Boundary:** this establishes readiness for rule evaluation only; no scenario direction/probabilities, persisted scenario state, production ingestion, DB writes, deployment or merge.

## 2026-10-27 — BTC review-capture stability checks

**Change:** Added a read-only comparison tool for two BTC review reports. It separately identifies BTC price input changes, ETF session/value/source revisions, and scenario-output changes. The staging workflow now tests the comparator and recalculates the same captured inputs a second time, requiring byte-identical output.

**Purpose:** distinguish genuine market/source revisions from calculation instability; preserve the prior report as an optional input for an explicit two-capture comparison. No prior capture is silently inferred or substituted.

**Safety boundary:** artifact-only and deterministic local calculation. No database access/write, scenario-state persistence, baseline probability change, production ingestion approval, deployment, or merge. Multi-capture comparison is available when a prior report is supplied; the current workflow's default run only proves same-input determinism.

## 2026-10-27 — BTC Rule v1 offline scenario completed

- Fresh read-only capture: BTC spot **79,487 USD/BTC**; 7-day closed-hourly return **−2.670356%**; latest five distinct Farside sessions sum **−115.2m USD** (20, 21, 22, 23, 26 Oct).
- Offline Rule v1 output: **`base`**, directional score **0**, confidence **low**. Readiness **`ready_for_rule_evaluation`**, zero blockers. Same-input recalculation produced a byte-identical report.
- Exact-head SHA `ad90cd781537484167f70a33562899a12df5ef94`: staging, readiness gate, source catalog validation, VPS build rehearsal, seed idempotency, and release workflow validation all passed.
- **Scope decision:** BTC Rule v1 review-only scenario is complete. ETF provider publication timestamp and revision/finality policy remain required for production ingestion only; durable retention/restore belongs to future self-hosted operations. DXY, hashrate, fee/subsidy and supply are not blockers for Rule v1.
- No production DB access/write, ingestion, runtime/source-priority change, scenario state/probability/monitoring persistence, deployment or merge. PR #84 remains open/draft.



## 2026-10-27 — latest BTC public-source recapture and rule-v1 verification

- Triggered read-only BTC Public Source Staging [#40471108936](https://github.com/olegsh247-stack/Crypto/actions/runs/40471108936), artifact `12718750633`, exact head `8ed46df441285a5341b1d0a346bf006083bd698b`. Raw responses and provenance are preserved in the artifact; detailed report: `docs/BTC-READONLY-CAPTURE-RESULT-2026-10-27-0805Z.md`.
- Kraken latest trade: **79,795.50 USD/BTC** (observed 08:05:19.523Z, retrieved 08:05:22.106Z). Latest closed-hourly-candle method gives 7-day return **−2.199510%**. This replaces the earlier current-trade-based return as the declared candle methodology; the two calculations are not directly comparable.
- Farside priority ETF sessions (20, 21, 22, 23, 26 Oct) sum to **−$115.2m**. New payload hash, same five-session values. Provider publication time and revision/finality semantics remain unknown; the series remains review-only for production ingestion.
- New 144-block fee window 973226–973369: fees 227,281,372 sats, subsidy 45,000,000,000 sats, ratio 0.505070%; boundaries and tip matched before/after. Optional context only.
- Offline Rule v1 remains **Base, directional score 0, low confidence**. Review readiness has zero blockers; repeat calculation is byte-identical. No scenario state is persisted and no probabilities changed.
- Passed on exact head: staging #40471108936, readiness #40471113390, source catalog #40471113428, seed idempotency #40471113348, release workflow validation #40471113415, and VPS rehearsal #40471108869. Duplicate VPS rehearsal #40471113337 was still running at the time of this entry.
- Remaining production acceptance: ETF publication-time/revision/finality policy and durable retention/restore on future self-hosted infrastructure. DXY is optional. No production DB access/write, ingestion, source priority/registry change, scenario-state/probability/monitoring persistence, deployment or merge.

## 2026-10-27 — ETF session freshness evaluator and revision provenance

**Change:** Added a calendar-backed session freshness evaluator and tests for New York close, weekends, full closures, early close, incomplete rows, and fail-closed behavior while Farside's publication window is undefined. The snapshot comparator now includes old/new row keys, completeness, and enclosing payload hashes in revision evidence. Staging CI runs the new tests.

**Result:** Calendar/session mechanics are now testable, but this is not production freshness approval. The evaluator intentionally blocks until publication-window semantics are reviewed; no synthetic `observed_at` is created. Synthetic revision tests do not replace evidence of an actual provider revision.

**Remaining blockers:** hash exact upstream NYSE/Nasdaq calendar payloads; review Farside publication-window convention; retain evidence for an actual provider revision; prove durable archive, independent retrieval and backup/restore on self-hosted infrastructure.

**Boundary:** No production DB writes, live ingestion, source-priority/runtime changes, scenario state/probability persistence, deployment, or merge. Farside remains priority; SoSoValue is cross-check only; no averaging or silent fallback.

## 2026-10-27 — ETF freshness CI verification

**Verification:** BTC Public Source Staging [#40531601122](https://github.com/olegsh247-stack/Crypto/actions/runs/40531601122) passed the Farside snapshot revision tests, calendar validator, and all six new session-freshness tests after fixing an over-escaped date regex.

**Unrelated full-workflow blocker:** The run then stopped at the BTC fee/subsidy audit with `BLOCKED_PER_BLOCK_FEE_SUBSIDY_AUDIT` / `tip changed or behind window`. ETF tests themselves passed; no ingestion occurred. Recheck that fee window as a separate BTC capture task.

**ETF status:** Still blocked from production ingestion pending reviewed Farside publication timing, hashes of exact upstream exchange-calendar payloads, evidence from a real provider revision, and durable self-hosted archive/read-back/restore.

## 2026-10-27 — ETF publication freshness policy and calendar source hashes

**Decision:** Farside's public page says data is updated in real time, typically in the evening/night US time. This is not a guaranteed deadline. Added an explicit local operational threshold: 12-hour post-close grace (including overnight), then accept only a complete reconciled row no more than one scheduled US trading session behind. Do not synthesize `observed_at`; never treat missing/incomplete rows as zero.

**Changes:** Added `data/CryptoDataModel/calendars/btc-etf-publication-freshness-policy.json`, added policy/grace regression tests, and added a read-only script that captures exact HTTP response-body SHA-256 plus retrieval metadata for official NYSE/Nasdaq calendar pages and Farside's ETF page into the CI artifact.

**Still blocked:** Verify the CI artifact contains successful upstream hashes; obtain evidence from an actual provider revision; prove durable storage, independent read-back and backup restore on self-hosted infrastructure. Synthetic tests do not replace real revision evidence. ETF remains unapproved for production ingestion.

**Safety:** No production DB writes, live ingestion, registry/runtime source-priority changes, scenario state/probability persistence, deployment, or merge. Farside priority; SoSoValue cross-check only; TFTC supplemental; no averaging or automatic substitution.

## 2026-10-27 — ETF upstream calendar hashes captured

**Result:** Read-only CI run [#40535074201](https://github.com/olegsh247-stack/Crypto/actions/runs/40535074201) captured successful HTTP 200 response hashes for NYSE hours page, Nasdaq equity calendar page, and NYSE 2026 calendar PDF. The calendar fixture now stores hashes, retrieval timestamp and run reference; its validator checks these fields.

**Caveat:** Nasdaq's exact-response hash differed between two captures three minutes apart at the same body size. This is byte-level volatility, not proof that the calendar itself changed. The dedicated direct Farside request returned HTTP 403; that denial response's hash is explicitly excluded as ETF source-payload evidence.

**Verification/boundary:** ETF policy/calendar tests passed. The overall staging workflow failed later at the separate BTC fee/subsidy audit (`tip changed or behind window`). No ingestion or production changes. ETF remains blocked on real provider-revision evidence and durable self-hosted archive/read-back/restore.

## 2026-10-27 — Correction: actual ETF row revision already exists

The existing two-snapshot acceptance report already contains a real Farside row transition: 2026-10-20 changed from an unreported placeholder to +23.2 USDm between snapshots. This is sufficient as the real revision-policy example; do not repeat the same two-snapshot task. The direct landing page can return HTTP 403, so source-hash capture was corrected to target the canonical all-data endpoint `https://farside.co.uk/bitcoin-etf-flow-all-data/`. The denial response is not valid ETF payload evidence.

Remaining blockers: verify successful canonical all-data capture/hash and prove durable self-hosted archive/read-back/restore. Production ingestion remains disabled.

## 2026-10-27 — Canonical Farside capture verified

The standard read-only source capture succeeded for the canonical Farside all-data endpoint: retrieved `2026-10-27T15:56:53.261Z`, HTTP 200, SHA-256 `403a10014b89c99d41bfc2be4e1b17cfd4a5e0bc714f4d7cd153d04c8c2be7ff`, latest reported session 2026-10-26, +110.3 USDm, reconciliation `MATCHES_DISPLAY_ROUNDING`. The 27 Oct US session had not yet closed at capture time, so this is the latest completed session row.

Official NYSE/Nasdaq calendar response hashes and NYSE PDF hash are recorded in the calendar fixture. A direct probe can get HTTP 403 while the established source-capture workflow succeeds; do not use the probe's denial-body hash as source evidence. Actual Farside row revision evidence already exists (2026-10-20 placeholder -> +23.2 USDm).

**Remaining ETF production blockers:** durable self-hosted archive/read-back/restore and reviewed allowed-retention approach. Broader BTC staging separately fails its offline scenario test because `hashrate_change_7d_pct` is not finite; ETF parser, session freshness and calendar hash checks passed. No production ingestion or merge.


## 2026-10-27 — BTC rule fails closed; exact seven-day hashrate candidate

- Fixed the scenario rule's missing-input path: missing/non-finite required inputs now return `not_evaluable` with named blockers instead of throwing and stopping CI. Added regression coverage; negative fee ratios still reject.
- Changed Mempool hashrate capture from the one-week endpoint (which only recorded the latest point) to the one-month daily series. It now derives a 7-day change only when two positive finite points are exactly 604,800 seconds apart and records both timestamps, bucket boundaries, values and payload hash. This remains a review candidate until freshness/methodology are accepted.
- The scenario calculator records the hashrate evidence but does not use it for scoring unless explicitly accepted. Fee/subsidy remains excluded until the reorg/confirmation and deployed-version gates pass. Missing required values must produce `not_evaluable`; no directional score is emitted.
- Changes are on `fix/btc-readiness-mainline-2026-10-20`; latest code commits include `1845a55` (fail-closed rule), `5d97305` (hashrate series), and `affed8d` (calculator evidence/gating). CI verification of the resulting workflow is pending.
- Safety: no production DB writes, ingestion, registry/source-priority changes, scenario state/probability persistence, deployment, or merge. ETF remains blocked on durable self-hosted archive/read-back/restore and reviewed retention.


**Verification update (2026-10-27):** BTC Scenario Readiness Gate run [#40552827526](https://github.com/olegsh247-stack/Crypto/actions/runs/40552827526) passed, including the new fail-closed calculation test. The live Mempool 1-month series was inspected: daily points at 2026-10-20 00:00 UTC and 2026-10-27 00:00 UTC are exactly 604,800 seconds apart; the candidate change is +5.4843% (about 1.0659 to 1.1244 EH/s). This is evidence for the calculation path only, not accepted production input. The full BTC Public Source Staging capture has not yet been rerun against the latest code; fee/subsidy confirmation and ETF durable archive/retention remain blockers.


## 2026-10-27 — Latest BTC readiness CI verification

The latest associated CI set passed: BTC Scenario Readiness Gate [#40558426044](https://github.com/olegsh247-stack/Crypto/actions/runs/40558426044), Source Catalog Contract Validation [#40558426081](https://github.com/olegsh247-stack/Crypto/actions/runs/40558426081), VPS API Build Rehearsal [#40558426026](https://github.com/olegsh247-stack/Crypto/actions/runs/40558426026), seed idempotency rehearsal [#40558426087](https://github.com/olegsh247-stack/Crypto/actions/runs/40558426087), and release-workflow validation [#40558426112](https://github.com/olegsh247-stack/Crypto/actions/runs/40558426112). Readiness tests confirm missing hashrate/fee-subsidy inputs return `not_evaluable` without score or scenario persistence; source catalog validation passes with the corrected Mempool `/api/v1/mining/hashrate/1m` endpoint. No readiness artifact was attached, so this is not proof of a new live-source capture or BTC evaluability. Remaining blockers: fee/subsidy confirmation/reorg and deployed-version gates; ETF durable archive/read-back/restore and retention review on future self-hosted infrastructure. No production changes, deployment, or merge.

## 2026-10-27 — BTC Rule v1 input contract reconciled

Rule v1 now requires only the 7-day spot return and accepted ETF flow. Hashrate is optional supporting evidence; fee/subsidy is optional context and not a directional vote; DXY remains optional. The review calculator still fails closed because current spot/ETF candidates are not readiness-approved and ETF publication-time/finality/revision acceptance is incomplete, rather than because optional metrics are missing. Readiness Gate [#40561116902](https://github.com/olegsh247-stack/Crypto/actions/runs/40561116902) and Source Catalog validation [#40561116787](https://github.com/olegsh247-stack/Crypto/actions/runs/40561116787) passed; VPS API rehearsal [#40561116781](https://github.com/olegsh247-stack/Crypto/actions/runs/40561116781) was still running at note time. No production changes, deployment, merge, scenario persistence or probability changes.


## 2026-10-27 — Spot freshness corrected; final capture status

Aligned the branch's spot freshness window from 6h to 1h in the metric registry and readiness gate; changed the test so a 3h-old observation is rejected. Updated the read-only BTC source-staging workflow trigger. The previously available manifest timestamped 06:44 UTC is stale under the 1h contract. The connector did not expose the push-triggered staging run/artifact, so current capture outcome is unverified. Remaining gate: inspect one fresh capture artifact for a spot observation <=1h and five traceable ETF sessions; use the already allowed registered fallback when primary data are unusable. Do not repeat historical ETF comparisons. No production changes, merge or scenario persistence.
