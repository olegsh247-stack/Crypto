# План 100 — дополнение по universe BTC ETF (2026-10-16)

Это дополнение фиксирует существенную поправку к составу активных фондов. Оно не меняет runtime registry, приоритет источников, формулу или evaluator.

## Решение

- **MSBT (Morgan Stanley Bitcoin Trust)** должен входить в active universe с даты начала торгов **2026-04-08**. Его отсутствие в исходном перечне обнаружено при проверке официальных страниц и SEC.
- **Hashdex DEFI** исключается из active aggregate после delisting **2026-09-03**; исторические строки до закрытия сохраняются.
- Universe проверяется по датам запуска/закрытия перед любым будущим capture; исходный набор из 2024 года нельзя считать полным.

## Первичная сверка MSBT

SEC Q2 2026 10-Q сообщает на 2026-06-30: 17,650,000 shares, Principal Market NAV/share $16.94, net assets $298,979,473, 5,059.30771216 BTC. На обложке отдельно указано 21,740,000 shares as of 2026-07-31. За период с запуска по 2026-06-30 раскрыты 17,900,000 выпущенных и 250,000 погашенных акций. Это данные за период/точечные наблюдения, а не полноценный daily flow series.

Источники: [SEC 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm), [официальная страница Morgan Stanley](https://www.morganstanley.com/im/en-us/institutional-investor/products/etfs/digital-assets/morgan-stanley-bitcoin-trust.html), [объявление запуска](https://www.morganstanley.com/press-releases/msim-enters-with-launch-of-morgan-stanley-bitcoin-trust).

## Уточнение BITB

Официальная страница Bitwise показывает 68,780,000 shares и AUM $3,047,421,621 на 2026-10-13; NAV $45.11 на 2026-10-12; holdings 37,317.87 BTC на 2026-10-13. Хотя график NAV/market price охватывает 2024-01-10—2026-10-13, полная daily shares/creation-redemption history и права на систематическое архивирование не подтверждены. Источник: [Bitwise BITB](https://bitbetf.com/).

## Что это значит для сценария BTC

- Периодические отчёты и ежедневные NAV/holdings пригодны для cross-check, но не доказывают полный ежедневный net-flow ряд.
- Не вычислять flow из изменения net assets без утверждённого контракта: цена BTC меняет AUM независимо от потоков.
- Не менять source registry, source priority, `arithmetic_mean_2_sources` или evaluator на основании этих сведений.
- Не выполнять capture, production writes, ingestion, scenario evaluation/state/probability changes, deployment или merge без отдельного разрешения.
- BTC остаётся `not_evaluable`; PR #83 остаётся Draft.

Связанные документы: [матрица источников](BTC-ETF-ISSUER-SOURCE-COVERAGE-MATRIX-2026-10-16.md), [журнал «Промт 100»](PROMPT-100-JOURNAL.md).


## Дополнение 2026-10-16 — SEC Q2 cross-check для IBIT, FBTC и BITB

Проверены официальные 10-Q за 2026-06-30:
- IBIT: 1,296,040,000 акций, NAV/share $33.48, net assets $43.386012125 млрд, 734,261 BTC; за Q2 раскрыты 187,360,000 погашенных акций с помесячной разбивкой. [SEC](https://www.sec.gov/Archives/edgar/data/1980994/000143774926026004/bit20260630c_10q.htm)
- FBTC: 200,328,476 акций, NAV/share $51.44, net assets $10.304103 млрд, 174,383 BTC. На обложке отдельно указано 197,403,476 акций на 2026-07-31 — это другая дата. [SEC](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm)
- BITB: 66,690,000 акций, NAV/share $31.87, net assets $2.125612 млрд, 36,207.6919 BTC. Официальная страница отдельно показывает более поздние значения: 68,780,000 акций и 37,317.87 BTC на 2026-10-13, NAV $45.11 на 2026-10-12. [SEC](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm); [Bitwise](https://bitbetf.com/).

Это периодические контрольные точки, не ежедневный flow series. Не вычислять потоки из изменения AUM, не менять registry/formula/evaluator, не запускать capture или сценарную оценку. Матрица и «Промт 100» обновлены; BTC остаётся `not_evaluable`.


## Связанный макро-контекст DXY — необязательный контекст (2026-10-16)

Проверка официальных методологий подтвердила, что ICE U.S. Dollar Index (DXY) и Fed/FRED nominal broad dollar index `DTWEXBGS` — разные метрики. ICE DXY использует шесть валют с фиксированными весами (EUR 57.6%, JPY 13.6%, GBP 11.9%, CAD 9.1%, SEK 4.2%, CHF 3.6%). Fed broad index — daily trade-weighted index на базе Jan 2006=100 с более широкой корзиной торговых партнёров и пересматриваемыми весами. Нельзя подменять один другим без явного reviewed решения. Подробный контрактный обзор: [BTC DXY source-contract review](BTC-DXY-SOURCE-CONTRACT-REVIEW-2026-10-16.md).

Для первого сценария дополнительное расследование DXY не требуется. Yahoo `DX-Y.NYB` — только ручной research/display reference; FRED `DTWEXBGS` можно использовать только под собственным названием и не записывать в `macro.dxy`. Если контекст недоступен, пропустить его и продолжать сценарий. ETF gate остаётся отдельным блокером. Runtime registry и scenario logic не менялись; capture не выполнялся.


## SEC cross-check — EZBC / Franklin Bitcoin ETF (2026-10-16)

The official SEC Q2 2026 Form 10-Q reports EZBC at 2026-06-30: 9,800,000 shares outstanding, NAV/share $34.15, net assets $334,694,929 and 5,664.0163 BTC. During Q2 the fund issued 150,000 shares and redeemed 1,250,000. Source: [SEC Form 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm). The [Franklin product page](https://www.franklintempleton.com/investments/options/exchange-traded-funds/products/39639/SINGLCLASS) exposes dated fund facts marked updated daily, but a complete daily machine-readable share-creation/redemption history, correction semantics and durable-retention permissions have not been verified.

**Plan decision:** retain EZBC as a periodic primary-source cross-check candidate only. Quarterly activity is not a daily series; changes in AUM are not flows. No capture, source promotion, registry/formula/evaluator change or scenario evaluation. BTC remains `not_evaluable` pending the separate ETF snapshot/source-rights/archive gate.
