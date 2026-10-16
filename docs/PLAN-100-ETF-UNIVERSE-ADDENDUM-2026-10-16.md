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
