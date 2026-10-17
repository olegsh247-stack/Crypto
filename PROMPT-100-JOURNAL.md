# Prompt 100 — журнал существенных решений

## 2026-10-17 — ETF-блокер: приоритет источника и запрет повторного обсуждения одного расхождения

- **Решение:** при наличии повторно обсуждавшегося расхождения без установленной причины не блокировать весь ETF-набор бесконечным расследованием. Выбирать приоритетное значение по заранее определённому правилу источника и фиксировать решение в журнале.
- **Для текущего исследовательского набора:** использовать Farside как приоритетный источник дневных агрегированных потоков BTC spot ETF; TFTC сохранять как контрольный источник. Не усреднять два источника автоматически и не возвращаться к уже многократно рассмотренному отдельному дневному расхождению.
- **Ограничение:** выбор Farside как приоритетного — рабочее исследовательское решение, а не утверждение о безусловной истинности данных. Хранить происхождение, дату потока, время получения, исходное значение/артефакт в пределах разрешённого хранения и SHA-256. Если приоритетный источник недоступен или данные неполны, помечать значение как отсутствующее/неподтверждённое, а не молча переключаться на TFTC.
- **Правило процесса:** если пользователь поручает выбрать приоритет, ассистент выбирает разумный вариант, записывает решение и продолжает работу. Не повторять и не поднимать снова уже рассмотренное расхождение, если не появилось новое существенное доказательство или прямой запрос пользователя.
- **Следующие действия по ETF:** подтвердить два снимка с интервалом не менее 24 часов; проверить построчные изменения и ревизии; закрепить разрешённое хранение; выполнить восстановление архива и проверки на реальных артефактах. Полная матрица всех 13 фондов не является условием продолжения, если покрытие доступной истории явно указано.
- **Статус:** решение о приоритетном источнике записано; технические проверки второго снимка, хранения и восстановления архива остаются незавершёнными. Production DB не затрагивать; live-сценарий не запускать; BTC не переводить в `evaluable` до прохождения обязательных проверок.


## 2026-10-17 — BTC hashrate and fee/subsidy source contracts

- Added a read-only Mempool.space `reward-stats/144` capture candidate alongside the existing fee time-bucket endpoint. The capture records response shape/field evidence only and explicitly does not calculate or persist a ratio.
- Updated the hashrate staging capture to preserve the daily 24-hour UTC interval boundaries and the converted `EH/s` value, while distinguishing the daily estimate from `currentHashrate` and weekly rolling metrics.
- Added `docs/BTC-HASHRATE-FEE-SUBSIDY-ACCEPTANCE-2026-10-17.md` defining units, windows, provenance, freshness, the fee/subsidy formula and acceptance gates.
- Fee/subsidy proposed formula is `sum(transaction fees) / sum(protocol subsidy)` across the exact same verified block-height window; total miner reward must not be used as the numerator. Calculation remains blocked until the real endpoint schema, units, contiguous block coverage and reorg/finality semantics are confirmed.
- **Status:** repository changes committed; staging workflow result and real captured payload still need inspection. No production DB access/writes, ingestion, scenario evaluation, scenario-state writes or monitoring-event writes were performed by these changes.
