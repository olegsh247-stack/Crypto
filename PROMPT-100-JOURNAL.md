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


### Reorg comparison gate added — 2026-10-17

- Added `scripts/compare-btc-fee-windows.mjs` and tests. The comparator requires the newer 144-block window to advance at least six heights, compares every overlapping height's block hash, parent hash and fee total, and reports any changed overlap as a reorg/revision review failure. It does not silently accept or normalize changed data.
- Added comparator tests to the read-only source-staging workflow. The first per-block capture is the baseline; the acceptance comparison must use a later capture at least six blocks ahead. This remains separate from the ETF 24-hour snapshot gate.


### Final source-staging baseline after comparator tests — 2026-10-17

- Final successful read-only source-staging run for this code batch: [#39057058042](https://github.com/olegsh247-stack/Crypto/actions/runs/39057058042). The new confirmed-window comparator tests and per-block validation tests passed; the 144-block fee audit reproduced the same verified window and ratio. Because the tip had not advanced by six blocks, this second capture does **not** satisfy the confirmation-interval comparison gate.
- Pin this run's Farside capture as the ETF 24-hour baseline: retrieved `2026-10-17T18:12:27.119Z`, latest session `2026-10-16`, payload SHA-256 `43ad1085683871d8a3bea755f1d700d843965487bb2298155bcea1a443a163a1`. Next ETF snapshot must be no earlier than `2026-10-18T18:12:27.119Z`.
- VPS API Build Rehearsal for the code commit `34e7f38a` passed: [#39057058047](https://github.com/olegsh247-stack/Crypto/actions/runs/39057058047). No production effects; BTC remains `not_evaluable`.


### Confirmed build-rehearsal results and API parity blocker — 2026-10-17

- Both documentation-only VPS API Build Rehearsal runs completed successfully: [#39057124564](https://github.com/olegsh247-stack/Crypto/actions/runs/39057124564) and [#39057135241](https://github.com/olegsh247-stack/Crypto/actions/runs/39057135241). These prove the repository build rehearsal passes; they do not prove that a live deployment runs the same commit.
- Added `docs/BTC-API-DEPLOYED-VERSION-PARITY-2026-10-17.md`. Inspection of `vps/api/src/app.ts` confirms the health response exposes only status/service, with no build identity or commit SHA. The database-health and BTC detail routes are not needed for version identification and were not called.
- **Decision:** deployed API version parity remains blocked until provider-side deployment metadata ties the actual target to the reviewed commit or immutable artifact. Do not infer parity from a health response, sample `api_version`, or successful build rehearsal.
- BTC protocol-supply semantics remain review-only: the reproducible integer-satoshi calculation measures total protocol-scheduled issuance, not economically spendable circulating supply. Do not map it to `monetary.circulating_supply` or alter registry/runtime without an explicit metric-contract decision.
- No production API/database queries, ingestion, registry/runtime changes, deployment, scenario evaluation/state changes, or probability changes occurred. BTC remains `not_evaluable`.


### Read-only source refresh and gate results — 2026-10-18

- Hardened `scripts/compare-btc-fee-windows.mjs`: it now rejects non-contiguous 144-block snapshots and snapshots with no overlapping heights. Added tests for parent-hash changes, per-block fee changes, and discontinuous heights. Read-only staging run [#39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890) and VPS API Build Rehearsal [#39160316806](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316806) both passed. A first staging attempt [#39160312789](https://github.com/olegsh247-stack/Crypto/actions/runs/39160312789) failed the moving-tip guard; its fee artifact was not accepted.
- Latest successful fee window: heights `971906–972049`, 144 contiguous blocks; fee sum `197,402,505 sats` matches Mempool aggregate exactly; subsidy `45,000,000,000 sats`; candidate ratio `0.438672%`. Evidence JSON SHA-256 `c7832cc123ffbcdee4e3e007e37e75f13dda2a0e385c1e4d220a534746b16962`. The previous window ended at 971896 and this window begins at 971906, so there is no overlap; **no reorg comparison has been claimed**. New baseline is 971906–972049; next comparable window must end at height 972055 or later and overlap this baseline, with stable-tip validation passing.
- Farside second snapshot in #39160316890 was retrieved at `2026-10-18T19:47:28.610Z`, more than 24 hours after baseline. All 14 overlapping dated rows were unchanged; no added/removed rows. Payload hash changed from `43ad1085683871d8a3bea755f1d700d843965487bb2298155bcea1a443a163a1` to `a8faace817cac24ab5a2cf98ee679608a1dbfe84cbaa46cfaa861fb8dfd60828`. Two-snapshot row-revision check is complete for this pair; source archival rights and session/publication-time freshness semantics remain blockers.
- Current protocol-derived total-issued supply candidate is `20,100,159.375 BTC` through height 972050, observed block timestamp `2026-10-18T19:47:01Z`, retrieved `2026-10-18T19:47:27.483Z`. This remains total scheduled issuance, not approved economically circulating supply; no registry change.
- API version parity remains unproven pending deployment-side commit/artifact identity. No production API/DB calls, ingestion, registry/runtime changes, deployment, scenario evaluation/state changes, or probability changes. BTC remains `not_evaluable`.

## 2026-10-18 — Supply metric semantic boundary

- Added `docs/BTC-SUPPLY-METRIC-SEMANTICS-2026-10-18.md` to separate protocol-scheduled cumulative issuance from economically defined circulating supply.
- Candidate `20,100,159.375 BTC` through height `972050` remains `REVIEW_ONLY_PROTOCOL_DERIVED_SUPPLY`; it must not be mapped to `monetary.circulating_supply` or used for BTC scenario evaluation.
- Documented provenance, reference height/block identity, methodology, reorg/finality, freshness and duplicate identity requirements. No metric registry, SQL seed, runtime mapping, production DB, ingestion, scenario state, monitoring event or deployment was changed.
- Registry/seed audit and metric-contract approval remain open. BTC remains `not_evaluable`.

## 2026-10-18 — BTC supply registry and seed audit

- Read-only inspection of `data/CryptoDataModel/registry/metric-registry.json` and `infrastructure/postgres/seed-v1.sql` found no separate `monetary.protocol_issued_supply` metric; only `monetary.circulating_supply` is registered/seeded.
- The registry describes circulating supply with source priority `network.primary` (Mempool.space), but the historical seed row (`20,086,198.00419505 BTC`, observed `2026-09-19`) has `source_url = NULL` and methodology naming Bitcoin Core `gettxoutsetinfo`. This is a source-ID/methodology provenance mismatch, and the row is stale; it is not accepted as source evidence.
- Updated `docs/BTC-SUPPLY-METRIC-SEMANTICS-2026-10-18.md` with this audit. No registry, SQL seed, runtime mapping, observation, production DB, ingestion, scenario state, monitoring event or deployment was changed.
- Next decision gate: establish whether Product Contour needs protocol issuance, UTXO-set amount, or provider-defined economic circulating supply, then define the matching source and contract before any registry changes. BTC remains `not_evaluable`.

## 2026-10-18 — Plan 100 checkpoint refreshed

- Updated `docs/PLAN-100.md` with a dated current checkpoint covering the verified 144-block fee window, completed Farside two-snapshot comparison, protocol-issued-supply semantic boundary, confirmed registry/seed provenance mismatch, DXY access/timestamp blocker, and deployed API version-parity blocker.
- The checkpoint distinguishes successful CI/staging from production verification and records that BTC remains `not_evaluable`. No production API/DB, ingestion, registry/runtime, scenario state, deployment, merge or traffic cutover was touched.

## 2026-10-18 — DXY optional-context and readiness implementation mismatch

- Reconciled the product decision: DXY is optional macro context for the first BTC scenario, not a mandatory readiness input. If a permitted, timestamp-verifiable DXY close is unavailable, omit it; do not substitute the Federal Reserve broad-dollar series or carry a stale value forward.
- Read-only inspection found that `main` still hard-codes `macro.dxy` in `vps/shared/src/btc-scenario-readiness.ts` as a required metric. Draft PR #83 contains the intended registry-driven approach marking DXY optional, but remains open/unmerged. This mismatch means the current main readiness gate can still block on DXY even though the product contract says it should not.
- Updated [Plan 100](https://github.com/olegsh247-stack/Crypto/commit/d4ea999d22fabf86e31c6f0900678d2c3785ea28) and the [DXY source contract](https://github.com/olegsh247-stack/Crypto/commit/b53889303f6c2b2bf62ae834633b6230d9488832) to distinguish optional source research from mandatory scenario readiness and record the implementation discrepancy.
- PR #83 branch review: registry sets `macro.dxy.scenario_readiness.required: false`; `scripts/btc-scenario-readiness.test.mjs` includes tests that missing/untraceable DXY does not block readiness. Current PR head is `56f0096061652ed05a2ea39c05dad62a48ec6738`; GitHub combined status returned no checks for that SHA, so these tests are present but a passing run is not confirmed.
- Next: review PR #83's registry-driven readiness changes and tests against current `main`; do not merge automatically. BTC remains `not_evaluable` because mandatory spot/ETF gates and other evidence requirements remain open. No runtime/registry/SQL/production changes, scenario evaluation/state changes, deployment or merge. Documentation-only commits; CI was not run.


## 2026-10-19 — Draft PR #83 review checkpoint

- Reviewed PR #83 at head `56f0096061652ed05a2ea39c05dad62a48ec6738`, including registry policy, shared readiness implementation, tests, changed-file inventory and review state.
- Registry confirms only `market.spot_price` and `institutional.etf_net_flow` are required for the first BTC scenario. DXY is optional context; hashrate and fee/subsidy remain optional. Branch tests cover missing/untraceable DXY and ETF completeness, revision/finality, duplicate dates/keys, timestamps and five-day minimum.
- Found a deterministic selection defect to address before approval: ETF rows are sorted primarily by `observed_at` and revision, then the selected history is truncated to seven rows without sorting by logical reporting date (`period_start`). Equal observation timestamps can therefore make selected sessions depend on input order. Add explicit reporting-date descending ordering and regression coverage.
- GitHub reports PR open/Draft/unmerged and `mergeable: false`; current head has no combined status checks and the workflow-run lookup returns no PR-triggered runs. Do not claim CI passed for this exact head. The PR also has a broad multi-area diff (readiness, source catalog, API/Worker/web build, DXY/SoSoValue probes, ETF archive and docs), so the full scope needs review.
- No code, registry, SQL seed, database, scenario, deployment or merge changes made in this review. No workflow dispatched. BTC remains `not_evaluable`; mandatory spot-price and ETF-flow acceptance gates remain open.
- Next step: correct deterministic ETF history ordering on the PR branch, add a regression test, verify CI for the exact new SHA, then re-review mergeability. No automatic merge.
