# Crypto — Структура 1

## Назначение

Структура 1 — резервный скелет аналитической архитектуры Crypto. Она фиксирует согласованную модель на случай, если последующие изменения интерфейса, Research Engine или API потребуют отката.

## 1. Архитектурное ядро

`CryptoResearch v2` — методология.

`Research Engine` — механизм проведения исследования и структурирования результата.

`Research Dashboard` — компактное представление результата.

`Monitoring` — отслеживание изменений после полного исследования.

`Deep Research` — полный доступ к исследованию 01–15.

`Timeline` — история изменений исследования и сигналов.

## 2. Asset ≠ Pair

Asset и Pair являются разными сущностями.

Примеры Asset: BTC, ETH, SOL, CAKE.

Примеры Pair: BTC/USDT, ETH/USDT.

Research относится к Asset. Рыночные данные и графики могут относиться к Pair.

## 3. Asset Type

Перед исследованием определяется тип Asset. Возможные категории:

- Monetary Asset
- L1 / Settlement Asset
- L1 / Execution Asset
- L2 / Scaling Asset
- DeFi Protocol Token
- Infrastructure Token
- Stablecoin
- Privacy Asset
- Governance Token
- Exchange / Platform Token
- RWA-related Asset
- Other

Asset Type определяет релевантные вопросы, метрики и Critical Factors. Нерелевантные показатели получают `N/A`, а не искусственное значение.

## 4. Полное исследование 01–15

1. Essence & Role
2. Technology & Architecture
3. Tokenomics
4. Network / Protocol State
5. Ecosystem
6. Users & Activity
7. Institutions & Capital
8. Governance / Protocol Economics
9. Macro
10. Competition & Alternatives
11. Risks
12. Catalysts
13. Scenarios
14. Conclusion
15. Monitoring

Эти 15 разделов не заменяются Dashboard-блоками и остаются полноценным Deep Research.

## 5. Шесть Research Domains

### 1. Foundation

Питает: Essence, Role, Origin, Architecture, Monetary/Protocol Function, Maturity.

### 2. Technology & Infrastructure

Питает: Technology, Security, Network/Protocol, Scaling, Development, Infrastructure.

### 3. Economics & Ecosystem

Питает: Tokenomics, Supply Dynamics, Value Accrual, Ecosystem, Liquidity, Economic Model.

### 4. Adoption & Capital

Питает: Users, Usage, Adoption, Institutions, Capital, Growth.

### 5. Competition & Environment

Питает: Competition, Market Position, Macro, Regulation, External Threats.

### 6. Thesis & Outlook

Питает: Thesis, Risks, Catalysts, Scenarios, Confidence, Monitoring Priorities.

## 6. Mapping BTC-01…BTC-15 → Domains

| BTC | Основной Domain | Дополнительное питание |
|---|---|---|
| BTC-01 | Foundation | — |
| BTC-02 | Technology & Infrastructure | — |
| BTC-03 | Economics & Ecosystem | — |
| BTC-04 | Technology & Infrastructure | Adoption & Capital; Economics & Ecosystem |
| BTC-05 | Economics & Ecosystem | Technology & Infrastructure |
| BTC-06 | Adoption & Capital | — |
| BTC-07 | Adoption & Capital | Economics & Ecosystem |
| BTC-08 | Economics & Ecosystem | Thesis & Outlook |
| BTC-09 | Competition & Environment | Thesis & Outlook |
| BTC-10 | Competition & Environment | Thesis & Outlook |
| BTC-11 | Thesis & Outlook | — |
| BTC-12 | Thesis & Outlook | — |
| BTC-13 | Thesis & Outlook | — |
| BTC-14 | Thesis & Outlook | — |
| BTC-15 | Monitoring | Thesis & Outlook |

Один Deep Research раздел может питать несколько Dashboard Domains.

## 7. Evidence Model

Каждый существенный вывод проходит цепочку:

`DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS`

Факт и интерпретация не смешиваются.

Signal:
- ↑ Improving
- → Stable
- ↓ Deteriorating

Thesis Impact:
- Positive
- Neutral
- Negative
- Mixed

Status:
- 🟢 Strong
- 🟡 Watch
- 🔴 Weak

## 8. Critical Factors

Для каждого Asset определяется 3–7 Asset-specific Critical Factors.

Примеры:

BTC:
- Monetary Demand
- Scarcity
- Network Security
- Institutional Adoption

ETH:
- Network Adoption
- Settlement Demand
- Value Accrual
- Ecosystem Growth

SOL:
- Network Adoption
- Performance
- Ecosystem Growth
- Value Accrual
- Competitive Position

CAKE:
- Protocol Usage
- Trading Volume
- Liquidity
- Token Utility
- Value Accrual

Critical Factors имеют больший вес при формировании Thesis Score.

## 9. Value Accrual

Value Accrual — сквозной аналитический вопрос, а не отдельный шестнадцатый раздел.

Главный вопрос:

> Как экономическая активность системы превращается в ценность именно для Asset?

Обязательно разделять:

`Protocol / Network Success ≠ Token Success`

Оценка:
- Strong
- Moderate
- Weak
- Unclear

## 10. Scores

Используются:

- Health Score — текущее состояние Asset/ecosystem.
- Thesis Score — насколько текущие данные поддерживают основную thesis.
- Value Accrual Score — насколько убедительно экономическая активность превращается в ценность для Asset.
- Confidence — надёжность аналитической оценки.
- Competitive Position — качественная позиция относительно альтернатив.

Не использовать ложную математическую точность. Scores всегда сопровождаются объяснением.

## 11. Research Status

Каждый Domain получает:

- Status
- Trend
- Confidence
- Last Updated
- Key Finding

Общий Research Status:

- 🟢 Current
- 🟡 Update Recommended
- 🔴 Outdated

Причина изменения статуса должна быть указана.

## 12. Research Snapshot vs Monitoring State

`Research Snapshot` — полное исследование на конкретную дату.

`Monitoring State` — текущее состояние сигналов после исследования.

Monitoring не переписывает исторический Deep Research автоматически.

Если появляется существенный новый сигнал:

`NEW DATA → SIGNAL → affected Research section → Domain → Critical Factor → Thesis Impact → Score/Status update`

При необходимости создаётся новый Research Snapshot.

## 13. Dashboard

Dashboard показывает:

- Asset / Ticker / Asset Type
- Health Score
- Thesis Score
- Value Accrual Score
- Confidence
- Current Scenario
- Main Catalyst
- Main Risk
- шесть Research Domains
- Key Signals
- Research Status

Основной интерфейс не показывает пользователю ETH-01, ETH-02 и т. п. как основную навигацию.

## 14. Deep Research

Deep Research раскрывает полный результат 01–15:

01 Essence & Role
02 Technology & Architecture
03 Tokenomics
04 Network / Protocol State
05 Ecosystem
06 Users & Activity
07 Institutions & Capital
08 Governance / Protocol Economics
09 Macro
10 Competition & Alternatives
11 Risks
12 Catalysts
13 Scenarios
14 Conclusion
15 Monitoring

Каждый раздел содержит analysis, key findings, data, charts/tables when useful, sources, confidence и связи с Dashboard Domains.

## 15. Временная модель

Полное Research не обязано запускаться при каждом изменении данных.

- Full Research — периодически или при существенном изменении thesis.
- Monitoring — постоянно.
- Research Refresh — когда накопилось достаточно значимых изменений.

Пример:

`Research Status: 🟢 Current`

`Research Status: 🟡 Update Recommended — Major protocol change detected`

## 16. Основная схема

```text
ASSET
  ↓
Asset Type
  ↓
Research 01–15
  ↓
DATA / ANALYSIS / SOURCES
  ↓
6 Research Domains
  ↓
Critical Factors
  ↓
Health / Thesis / Value Accrual / Confidence
  ↓
Scenarios
  ↓
Monitoring
  ↓
Dashboard
```

## 17. Резервная точка

Структура 1 считается контрольной версией архитектуры. Последующие изменения могут развивать её, но не должны незаметно разрушать следующие инварианты:

1. Asset и Pair различаются.
2. 15 исходных Research-разделов сохраняются.
3. Dashboard агрегирует Research, а не заменяет его.
4. Monitoring связан с Research, но не уничтожает исторические snapshots.
5. Asset Type определяет релевантные метрики.
6. Нерелевантные метрики не выдумываются.
7. Value Accrual рассматривается отдельно от общего успеха сети/протокола.
8. Critical Factors являются Asset-specific.
9. Facts, calculations, analysis и hypotheses различаются.
10. Существенные выводы имеют evidence и confidence.

---

**Статус:** контрольная архитектурная версия — Structure 1.
