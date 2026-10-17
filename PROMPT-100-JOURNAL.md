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


## 2026-10-17 — Real Mempool capture confirms hash-rate schema and fee/subsidy candidate

- BTC Public Source Staging run [#39039830874](https://github.com/olegsh247-stack/Crypto/actions/runs/39039830874) passed the parser/normalization tests and captured the real public payloads; artifact SHA-256 `5d2d0537a883bc65c69caea9d443c1980dc297367373ef9acfefd6903cdd1971` (temporary artifact, expires 2026-10-24).
- Hashrate payload returned HTTP 200 with seven daily points. Latest captured daily UTC bucket was `[2026-10-16T00:00:00Z, 2026-10-17T00:00:00Z)`, estimated value `1009.5138912218121 EH/s`, raw SHA-256 `7554dafd3425d7d52ee717dd446d76ccfd68146a5b70f90705f325b0b8cf9856`. The code now emits explicit period boundaries and does not conflate this with `currentHashrate`.
- The real `reward-stats/144` payload returned HTTP 200 for blocks 971728–971871, with `totalReward=45,231,274,297` and `totalFee=231,274,297` (raw SHA-256 `92dfedfd15be72e738a7b628a31a7e3cd32b9071cbf0c6352f0f78000e922fe6`). Reviewed public backend code sums reward and fees across latest N non-stale blocks. The inclusive range is 144 blocks; total reward less fees is 45,000,000,000 sats = 450 BTC, matching 144 × 3.125 BTC.
- Research candidate formula: `sum(fees)/sum(subsidy) = 231274297/45000000000 = 0.0051394288222` (approximately 0.513943%). The capture parser now calculates this only if the inclusive height window is exactly 144 and the inferred subsidy matches the protocol schedule.
- **Boundary:** aggregate endpoint does not provide block hashes, so chain-reorg/finality handling and deployed-version parity remain open before production acceptance. No database writes, ingestion, scenario evaluation or scenario-state/monitoring writes were performed.
- Contract and evidence are documented in `docs/BTC-HASHRATE-FEE-SUBSIDY-ACCEPTANCE-2026-10-17.md`. The next staging run must verify the new ratio parser against this real response and preserve the acceptance boundary.


## 2026-10-17 — 144-block fee/subsidy parser verified on second live capture

- Updated BTC Public Source Staging run [#39039925329](https://github.com/olegsh247-stack/Crypto/actions/runs/39039925329) passed after adding guarded ratio calculation; artifact digest `sha256:81d972ffb86ee7bf183a7fe48dbc7ba5adaaebc159d778d7fa8ebf6b3a4e76a2`.
- The captured 144-block window again satisfied the range and subsidy checks. Parser output: `fee_subsidy_ratio=0.005139428822222222`, `fee_share_of_subsidy_percent=0.5139428822222223`, `acceptance_status=RESEARCH_CANDIDATE_RATIO_COMPUTED`.
- The ratio is reproducible from the raw response, but remains a research candidate because the aggregate lacks per-block hashes and does not itself preserve a reorg/finality proof. Do not mark the metric production-accepted or change BTC scenario readiness from this result alone.
- Hashrate staging again returned HTTP 200 and the expected seven-point daily series with explicit UTC window boundaries. No database writes or scenario evaluation occurred.
