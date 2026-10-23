# BTC ETF Two-Snapshot Acceptance — 2026-10-17

## Current Farside primary-source snapshot

Baseline for the next ≥24-hour comparison: [BTC Public Source Staging run #39057058042](https://github.com/olegsh247-stack/Crypto/actions/runs/39057058042). This is the latest successful capture after adding and passing the fee-window reorg-comparison tests. Artifact is named `btc-public-source-review` and is retained for 7 days by the workflow.

- Official all-data URL: https://farside.co.uk/bitcoin-etf-flow-all-data/
- HTTP: `200`; captured at `2026-10-17T18:12:27.119Z`; HTTP Date header: `Sat, 17 Oct 2026 18:05:45 GMT`.
- Page-generated date: `2026-10-17`; latest reported session date: `2026-10-16`.
- Parsed dated rows: `710`; latest row has all 12 fund values present.
- Latest total: `-82.4 USD million/day`; calculated sum of fund rows: `-82.4 USD million/day`; reconciliation: `MATCHES_DISPLAY_ROUNDING`.
- Exact source payload SHA-256: `43ad1085683871d8a3bea755f1d700d843965487bb2298155bcea1a443a163a1`.
- HTTP `Last-Modified` and `ETag` were absent. The page date is not an exact publication or observation timestamp.

The regular Farside page endpoint returned HTTP 403 from the staging runner, but the official all-data page succeeded. The all-data URL is the captured canonical review endpoint for this gate; no source-priority or runtime registry was changed.

## Comparison procedure

The read-only utility `scripts/compare-btc-etf-snapshots.mjs` compares two saved `manifest.json` files. It validates source identity and capture chronology, enforces at least 24 hours between captures, compares overlapping dates per fund and aggregate, and reports added/removed rows and detected revisions. It never changes the raw values or silently substitutes TFTC/SoSoValue.

Example:

```bash
node scripts/compare-btc-etf-snapshots.mjs /path/to/older/manifest.json /path/to/newer/manifest.json
```

Expected report statuses:
- `BLOCKED_INTERVAL_UNDER_24H`: wait for a valid interval.
- `ROW_REVISIONS_DETECTED_REVIEW_REQUIRED`: inspect changed dates and retain both source payloads.
- `TWO_SNAPSHOT_COMPARISON_COMPLETE_NO_ROW_REVISIONS_DETECTED`: no overlapping-row changes were detected in the captured window.

A changed page hash without row changes is not a row revision. An unchanged row comparison does not prove the provider never revises data; it only describes the two observed snapshots. The comparison always remains review-only.

## Remaining acceptance gates

1. Capture a second successful Farside all-data snapshot no earlier than `2026-10-18T18:12:27.119Z` (24 hours after this baseline).
2. Compare the two snapshots and review every changed row, including any changes to older overlapping rows.
3. Confirm archival/retention permissions for source payloads; keep source hashes and allowed evidence regardless of whether raw-page retention is permitted.
4. Approve a session-aware freshness rule based on U.S. trading sessions; do not invent `observed_at` from the reporting date or HTTP Date.
5. Keep TFTC as a control source only. No silent fallback or averaging.

**Status:** latest-session freshness evidence is now present, but canonical ETF acceptance remains blocked until the two-snapshot/revision/retention gates pass. BTC remains `not_evaluable`. No production DB access/writes, ingestion, scenario-state changes, or runtime registry changes occurred.


## Second snapshot result — 2026-10-18

The second successful snapshot was captured by [BTC Public Source Staging #39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890).

- Retrieval time: `2026-10-18T19:47:28.610Z`; interval from baseline: `25.5837 hours`, so the 24-hour gate passes.
- Latest reported session remains `2026-10-16`; 14 parsed rows overlap with the baseline.
- Baseline payload SHA-256: `43ad1085683871d8a3bea755f1d700d843965487bb2298155bcea1a443a163a1`.
- Second payload SHA-256: `a8faace817cac24ab5a2cf98ee679608a1dbfe84cbaa46cfaa861fb8dfd60828`.
- All 14 overlapping dated rows are unchanged; no dated rows were added or removed. The latest complete row remains `2026-10-16`, total `-82.4 USD million/day`, with fund sum matching the displayed total. Page payload changed, but no row revision was detected in the compared fields.
- Review-only comparison result: `TWO_SNAPSHOT_COMPARISON_COMPLETE_NO_ROW_REVISIONS_DETECTED`. This establishes only that these two captures match; it does not prove the provider never revises data or settle archival rights/publication-time semantics.

The two-snapshot/row-revision gate is complete for this pair. Remaining blockers for canonical ETF acceptance are archival/retention permissions and an approved U.S.-session-aware freshness/publication-time contract. TFTC remains a control source only; no fallback or averaging.


## 2026-10-19 — ETF retention review and session-aware freshness proposal

### Public-page review

- Reviewed the official Farside Investors landing page and its linked privacy-policy page. The landing page describes ETF flow data as updated in real time, typically during the evening/night US time, and displays a site-wide copyright notice. The privacy policy concerns personal-data processing; it does not grant a data-archiving or redistribution license for ETF tables.
- No explicit public permission for retaining full historical page payloads in this project was located in the pages reviewed. This is **not** a legal conclusion that retention is prohibited; it means permission remains unconfirmed.
- Until permission is confirmed, do not promote long-term retention of full raw Farside HTML as an accepted production requirement. Keep the existing CI review artifact on its configured seven-day expiry, retain capture timestamps and SHA-256 evidence, and do not redistribute source pages. Obtain written clarification from Farside before enabling long-term raw-page archiving. Any long-term retention of normalized row data should also be covered by the same source-rights review.

### Proposed session-aware freshness contract (review required)

- Keep three distinct fields: Farside reporting/session date, local retrieval timestamp (`retrieved_at`), and any provider-supplied publication/observation timestamp. Never synthesize the third from the page date, HTTP `Date`, or retrieval time.
- Determine the latest completed US trading session using an explicit US market calendar, including holidays and weekends. A snapshot is session-current only when its latest complete, numeric ETF row matches that session. An older row is stale; a missing/placeholder row or an absent reporting date for the newest observation fails closed.
- Preserve per-fund completeness and the displayed-total reconciliation check. A matching session date does not establish an exact publication time or prove that the provider will never revise older rows.
- This is a proposal for approval, not a runtime/registry change. The current pair of snapshots passed the ≥24-hour and overlapping-row comparison gates, but the full canonical ETF gate remains blocked pending source-rights clarification and acceptance of the session-calendar contract.

Official pages reviewed:
- https://farside.co.uk/
- https://farside.co.uk/privacy-policy/

## 2026-10-23 — установленный приоритет при конфликте источников

По итогам оценки стабильности и проверяемости **Farside Investors остаётся приоритетным источником** агрегированного дневного потока BTC spot ETF (institutional.etf_net_flow). Это согласуется с действующим metric registry и readiness contract; runtime-приоритет менять не требуется.

- При валидных, но различающихся значениях за одну отчётную дату выбирать Farside. Не усреднять значения и не спрашивать пользователя повторно.
- SoSoValue использовать как контрольную сверку; TFTC — только как дополнительный контроль, учитывая возможное пересечение происхождения данных с SoSoValue/Farside.
- Если Farside недоступен или последняя строка неполна/является placeholder, не подменять значение SoSoValue/TFTC автоматически: оставить вход заблокированным до нового валидного Farside-снимка.
- Расхождение 2026-10-21: Farside +524.8 USDm, SoSoValue +528.40023714 USDm, разница около +3.60023714 USDm (SoSoValue минус Farside). Для выбранного исследовательского значения используется +524.8 USDm; обе исходные цифры и разница остаются в аудите. Для 2026-10-20 SoSoValue +23.16242251 USDm согласуется с округлённым Farside +23.2 USDm; для 2026-10-19 +526.59599803 USDm согласуется с округлённым Farside +526.7 USDm.
- Выбор приоритета не снимает отдельных блокеров: timestamp/finality/revision contract, freshness относительно последней завершённой US-сессии и правила долговременного хранения/reuse.

## 2026-10-22 — обновлённый ETF-снимок и контрольная сверка SoSoValue

Сравнение Farside all-data snapshots: baseline retrieved_at 2026-10-20T21:21:35.339Z и новый snapshot retrieved_at 2026-10-22T16:21:07.086Z; интервал около 42.99 часа, то есть больше 24 часов.

- Совпали 712 датированных строк; добавлены строки за 21 Oct 2026 и 22 Oct 2026; удалённых строк нет.
- В строке 20 Oct 2026 старый снимок содержал placeholder (пустые значения фондов и отображаемый ноль), а новый содержит заполненную строку с итогом +23.2 USDm. Это изменение полноты/публикации строки, а не основание считать предыдущий placeholder подтверждённым нулём.
- За 21 Oct 2026 SoSoValue сообщает +528.40023714 USDm, Farside +524.8 USDm. По закреплённому правилу приоритета выбирается Farside; расхождение ~3.60023714 USDm сохраняется как контрольное наблюдение. TFTC совпадает с SoSoValue, но его заявленная lineage использует SoSoValue и потому не считается независимым подтверждением.
- Снимок SoSoValue за 20 Oct 2026: +23.16242251 USDm, согласуется с округлённой строкой Farside +23.2 USDm. За 19 Oct 2026 SoSoValue: +526.59599803 USDm, Farside: +526.7 USDm.
- Это read-only research comparison. Оно не утверждает, что источник никогда не пересматривает историю, и не снимает оставшиеся требования к session-aware freshness, timestamp semantics и source lineage. Не выполнять production ingestion.
