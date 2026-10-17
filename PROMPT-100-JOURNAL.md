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


## 2026-10-17 — BTC input freshness recheck, supply source review, and offline rehearsal

- Latest read-only staging run [#39040928441](https://github.com/olegsh247-stack/Crypto/actions/runs/39040928441) passed and captured a fresh Kraken BTC/USD trade at `81,469.70 USD/BTC` (`2026-10-17T14:28:58.705Z`) and the latest daily Mempool hashrate bucket at `1009.5138912218121 EH/s` for `[2026-10-16T00:00Z, 2026-10-17T00:00Z)`.
- The 144-block Mempool aggregate returned blocks `971730–971873`, fees `230,958,590 sats`, reward `45,230,958,590 sats`, inferred subsidy `450 BTC`, and candidate ratio `0.0051324131111`. Because the aggregate has no per-block hashes and the deployed API version is not pinned, the parser now explicitly returns `BLOCKED_REORG_AND_DEPLOYED_VERSION_UNVERIFIED`; the numeric result is not production-accepted.
- Added a Blockchain.com total-bitcoins chart capture. Its latest point is `20,097,468.75 BTC` dated `2026-10-13T04:22:46Z`, about 106 hours old at retrieval. It is a total-issued/mined-supply candidate, not a direct spendable-supply measure, and its `analytics` source ID is not the current `network.primary` priority. It remains blocked; no registry/source-priority changes were made.
- Freshness recheck: Kraken and daily hashrate meet their time windows as captured; Yahoo Finance DXY close `101.84` for 2026-10-16 is within 48 hours but remains outside the canonical source allowlist; Farside's latest parsed reported date is 2026-10-09 and lacks provider observation/publication time, so the 36-hour ETF gate remains blocked. TFTC and SoSoValue remain cross-checks, not silent replacements.
- Added `fixtures/btc-offline-scenario-v1.json` and `scripts/run-btc-offline-scenario.mjs`; updated the BTC Scenario Readiness workflow to run this deterministic offline rehearsal. Gate run [#39040985262](https://github.com/olegsh247-stack/Crypto/actions/runs/39040985262) passed. Historical fixture result is Base, score -1, low confidence; no live data, DB writes, scenario-state persistence, monitoring writes, or probability changes.
- Detailed evidence and blockers are recorded in `docs/BTC-INPUT-RECHECK-AND-OFFLINE-REHEARSAL-2026-10-17.md`. BTC remains `not_evaluable`; the offline rehearsal does not override current input gates.


### Follow-up verification — final parser status and capture artifact

- Updated BTC Public Source Staging run [#39041045356](https://github.com/olegsh247-stack/Crypto/actions/runs/39041045356) passed after the fee/subsidy parser was changed to emit `BLOCKED_REORG_AND_DEPLOYED_VERSION_UNVERIFIED` rather than implying production acceptance. Artifact digest: `sha256:d36abc2acd66d1a3f31ffa2d078c45eb6cef56da2011460032175ba50b0aac62`.
- Latest Kraken trade in that artifact: `81,451.00 USD/BTC` at `2026-10-17T14:30:34.877Z`; hashrate remained `1009.5138912218121 EH/s` for the prior UTC day bucket.
- The captured Blockchain.com supply candidate remains dated 2026-10-13 and stale (>48 hours); it is not promoted. Farside remains stale for the latest-row gate. The scenario remains `not_evaluable`.
- Offline fixture runner passed in [BTC Scenario Readiness Gate #39040985262](https://github.com/olegsh247-stack/Crypto/actions/runs/39040985262). Detailed current results are in `docs/BTC-INPUT-RECHECK-AND-OFFLINE-REHEARSAL-2026-10-17.md`.


## 2026-10-17 — ETF primary-source freshness evidence and parser metadata

- Rechecked the live Farside Bitcoin ETF table on 2026-10-17. The page displays date 2026-10-17 and the latest completed trading-session row is 2026-10-16; all 12 fund values are present, with a displayed aggregate of -82.4 USD million and the fund-value sum also -82.4 USD million.
- Updated the read-only parser to preserve the page-generated date separately from the reporting/session date, expose the latest reported row and per-fund completeness, and retain reconciliation status. It deliberately does not invent an exact observation/publication timestamp from a date-only row or page footer.
- Added parser tests for page-date extraction, latest-session identification, complete fund coverage, aggregate reconciliation, and absent-footer behavior. The current live row is fresh relative to the latest completed U.S. trading session, but canonical ETF acceptance remains blocked pending two snapshots at least 24 hours apart, row-change/revision evidence, retention-rights review, and an approved session-aware freshness contract.
- Corrected the prior recheck document so the ETF status reflects this fresh live evidence. No registry/runtime changes, production DB access/writes, ingestion, or live scenario evaluation. BTC remains `not_evaluable`.


## 2026-10-17 — Farside two-snapshot acceptance tooling

- Read-only staging capture [#39056347133](https://github.com/olegsh247-stack/Crypto/actions/runs/39056347133) succeeded against the official Farside all-data page: HTTP 200 at `2026-10-17T18:02:33.561Z`; page date 2026-10-17; latest reported session 2026-10-16; 710 dated rows; all 12 latest-session fund values present; aggregate and fund sum both -82.4 USD million. Payload SHA-256: `9a0b79f6b9605d9b3a0bcbac04a1116da10784399e731dd13835c5d76235cfe3`. The regular Farside page endpoint returned HTTP 403, so the all-data page is the review capture endpoint; this does not change canonical priority.
- Added `scripts/compare-btc-etf-snapshots.mjs` and tests. The utility requires same-source chronological captures separated by at least 24 hours, compares overlapping per-fund/aggregate rows, and flags revisions without normalizing or silently substituting data. Integrated its tests into the read-only staging workflow.
- Added `docs/BTC-ETF-TWO-SNAPSHOT-ACCEPTANCE-2026-10-17.md` with snapshot provenance, comparison procedure, retention review, and the remaining gates. One successful snapshot is not enough; the second snapshot must be at least 24 hours later. Exact provider publication time and revision/finality policy remain unproven.
- No production DB access/writes, ingestion, live scenario evaluation, or runtime registry changes. BTC remains `not_evaluable`.


## 2026-10-17 — Fresh protocol-issued BTC supply candidate

- Added integer-satoshi issuance calculation through a captured Mempool tip height, inclusive, using the 210,000-block consensus halving schedule. Tests cover genesis, halving boundaries, the fourth halving, the historical Blockchain.com point, and a current-height vector.
- Read-only staging run [#39056549608](https://github.com/olegsh247-stack/Crypto/actions/runs/39056549608) captured a stable tip: height `971896`, block hash `0000000000000000000142a5ac84bd7c3f866ac84b97d56b1ec23a2267258cf5`, block timestamp `2026-10-17T18:03:12Z`, retrieval `2026-10-17T18:05:22.109Z`. Height and hash were rechecked around the block lookup. Derived total issuance is `2,009,967,812,500,000 sats = 20,099,678.125 BTC`; combined evidence SHA-256 `c62b776119cb8177804135945e4d620eb1db4b8fe0df40b8bfa1bbdb5ea75cab`.
- Staging run [#39056555560](https://github.com/olegsh247-stack/Crypto/actions/runs/39056555560) passed the new protocol-supply tests, Farside parser tests, ETF two-snapshot comparison tests, observation normalization tests, public-source capture, and candidate preparation.
- The source ID matches the current `network.primary` priority, and the tip timestamp is fresh under 48 hours. **Not promoted:** this is protocol-scheduled total issuance, not economically spendable supply/UTXO supply; metric semantics still require explicit approval. Blockchain.com’s 2026-10-13 point remains a stale historical cross-check. No registry/runtime changes, DB writes, ingestion, or scenario-state changes.
- Added `docs/BTC-PROTOCOL-ISSUED-SUPPLY-CANDIDATE-2026-10-17.md` and updated the BTC input recheck. BTC remains `not_evaluable`.


### ETF snapshot baseline pin — 2026-10-17

- Pin the latest successful source-staging capture [#39056555560](https://github.com/olegsh247-stack/Crypto/actions/runs/39056555560) as the baseline for the next two-snapshot check: Farside all-data page retrieved at `2026-10-17T18:05:44.360Z`, latest session `2026-10-16`, payload SHA-256 `b327bfaecf7ca85b1e9b7a0bb54c511fe10d7d4b91e5838b54212be0b5d42d19`. The next qualifying snapshot must be captured no earlier than `2026-10-18T18:05:44.360Z`.
- The same run passed Farside parser, two-snapshot comparator, protocol-supply calculation, observation normalization, and read-only source capture. The prior earlier snapshot remains historical evidence; it does not replace this pinned baseline for the next interval gate.


## 2026-10-17 — DXY remains optional context, not a mandatory BTC data gate

- Clarified the BTC input recheck: DXY is optional macro context, not a replacement for any mandatory BTC input. Because Yahoo Finance automated access/observation-time terms remain unapproved, DXY stays excluded from canonical scenario inputs until an approved access method and daily-close freshness contract exist.
- Current BTC readiness blockers remain the ETF two-snapshot/revision/retention gate, fee/subsidy reorg/deployed-version evidence, and explicit protocol-issued-supply metric semantics. No source registry/runtime changes or production effects.


## 2026-10-17 — Per-block BTC fee/subsidy audit implemented and captured

- Added `scripts/validate-btc-fee-window.mjs` plus tests, and `scripts/capture-btc-fee-subsidy-window.mjs`. The read-only capture retrieves Mempool's 144-block aggregate and per-block mining details, checks 144 distinct contiguous heights and parent links, sums per-block fees, derives subsidy from the protocol schedule over the identical heights, reconciles both aggregates, and rechecks canonical boundary hashes and tip height/hash before/after.
- [BTC Public Source Staging #39056926908](https://github.com/olegsh247-stack/Crypto/actions/runs/39056926908) passed all tests and the source capture. Captured window `971753–971896`; per-block fees `219,667,947 sats = 2.19667947 BTC`; protocol subsidy `45,000,000,000 sats = 450 BTC`; candidate ratio `0.0048815099333` (about `0.488151%`). Per-block fee sum and aggregate fee matched; aggregate reward minus fees and independently derived subsidy matched. The 144 parent links were contiguous; boundary hashes and tip hash/height were unchanged during capture. Evidence JSON SHA-256: `6895f032f24b2e0063b995b0b5331ae23ed8838cec8ab8d11e69947f3b13bb34`.
- **Not promoted:** current window ends at tip. Re-capture after at least six additional blocks and compare all overlapping block heights/hashes/fees for reorganization; independently pin deployed API implementation/version before production acceptance. No registry/runtime changes, production DB access/writes, ingestion, scenario-state changes or probability changes.
- Updated `docs/BTC-HASHRATE-FEE-SUBSIDY-ACCEPTANCE-2026-10-17.md` and the BTC input recheck. The latest successful Farside snapshot in [run #39056926908](https://github.com/olegsh247-stack/Crypto/actions/runs/39056926908) is now the ETF comparison baseline: captured `2026-10-17T18:10:41.812Z`, session `2026-10-16`, payload SHA-256 `a225f1b11ac1fa9d8a3ab0abe3108d26f27e41f3d58b9aa61f12c4c5a80a96cf`. Next qualifying ETF snapshot must be no earlier than `2026-10-18T18:10:41.812Z`.
- BTC remains `not_evaluable`.
