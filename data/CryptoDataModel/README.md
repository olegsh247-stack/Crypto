# CryptoDataModel v1

## Назначение

CryptoDataModel v1 — единая структура данных для исследовательской и мониторинговой системы Crypto.

Она отделяет:

**методологию → данные → исследование → API → сайт**

Модель рассчитана на Bitcoin как первый эталонный актив, но должна работать для ETH, SOL, NEAR и других криптоактивов.

## Архитектура

```
CryptoResearch v2
       │
       ▼
Research definitions
       │
       ▼
Data ingestion
       │
       ▼
Normalization
       │
       ▼
Validation
       │
       ├── observations
       ├── history
       ├── research snapshots
       ├── monitoring events
       └── sources
              │
              ▼
           API layer
              │
              ▼
            Website
```

## 1. Основные сущности

### Asset

Описывает сам актив.

Обязательные поля:

- `asset_id`
- `symbol`
- `name`
- `network`
- `consensus`
- `status`
- `created_at`
- `updated_at`

Пример:

```json
{
  "asset_id": "btc",
  "symbol": "BTC",
  "name": "Bitcoin",
  "network": "bitcoin",
  "consensus": "PoW",
  "status": "active"
}
```

### MetricDefinition

Описывает показатель, а не его текущее значение.

Поля:

- `metric_id`
- `asset_id`
- `name`
- `category`
- `description`
- `unit`
- `source_ids`
- `update_mode`
- `frequency`
- `freshness_window`
- `validation_rule`
- `trigger_rule`
- `research_blocks`

Примеры:

- `security.hashrate`
- `security.difficulty`
- `security.fee_subsidy_ratio`
- `monetary.circulating_supply`
- `institutional.etf_holdings`
- `institutional.etf_net_flow`
- `market.futures_open_interest`
- `market.perpetual_funding`
- `macro.real_yield_10y`

### Observation

Конкретное наблюдение показателя.

Поля:

- `observation_id`
- `metric_id`
- `asset_id`
- `value`
- `unit`
- `observed_at`
- `period_start`
- `period_end`
- `source_id`
- `source_url`
- `methodology`
- `status`
- `freshness`
- `revision`
- `created_at`

Правило:

**Observation никогда не должна перезаписывать историческое observation.**

Если источник пересмотрел данные, создаётся новая observation с новой revision.

### Source

Реестр источников.

Поля:

- `source_id`
- `name`
- `type`
- `url`
- `priority`
- `reliability`
- `access_method`
- `last_checked_at`

Типы:

- primary
- official
- blockchain
- analytics
- regulatory
- research
- media

### ResearchSnapshot

Версия исследования актива на конкретную дату.

Поля:

- `snapshot_id`
- `asset_id`
- `research_version`
- `methodology_version`
- `research_date`
- `blocks_completed`
- `key_facts`
- `analysis`
- `risks`
- `catalysts`
- `scenarios`
- `unknowns`
- `monitoring_ids`
- `source_ids`

Snapshot immutable после публикации. Исправление создаёт новую версию.

### MonitoringEvent

Событие, возникшее из мониторинга.

Поля:

- `event_id`
- `asset_id`
- `metric_id`
- `event_type`
- `severity`
- `detected_at`
- `trigger`
- `observed_value`
- `previous_value`
- `status`
- `research_required`
- `research_blocks`

Severity:

- NORMAL
- WATCH
- REVIEW

### ScenarioState

Текущее состояние сценария.

Поля:

- `scenario_id`
- `asset_id`
- `name`
- `state`
- `evidence`
- `supporting_metrics`
- `falsifiers`
- `last_reviewed_at`

Важно:

**ScenarioState не изменяется автоматически только потому, что изменился metric.**

Сначала возникает MonitoringEvent → затем research review → затем обновляется ScenarioState.

## 2. Категории metric_id

Единый namespace:

```
security.*
monetary.*
network.*
ecosystem.*
users.*
institutional.*
market.*
macro.*
technology.*
scenario.*
```

Это позволяет сайту строить страницы без знания конкретной монеты.

## 3. Bitcoin v1 metric registry

Минимальный эталонный набор:

### Security

- `security.hashrate`
- `security.difficulty`
- `security.block_time`
- `security.fee_subsidy_ratio`
- `security.miner_revenue`
- `security.hashprice`
- `security.mining_pool_concentration`

### Monetary

- `monetary.circulating_supply`
- `monetary.max_supply`
- `monetary.block_subsidy`
- `monetary.annual_issuance`
- `monetary.lth_supply`
- `monetary.exchange_supply`

### Network

- `network.transaction_count`
- `network.active_addresses`
- `network.active_entities`
- `network.mempool_size`
- `network.utxo_count`
- `network.lightning_capacity`

### Institutional

- `institutional.etf_btc_holdings`
- `institutional.etf_net_flow`
- `institutional.corporate_btc_holdings`
- `institutional.sovereign_btc_holdings`
- `institutional.custody_concentration`
- `institutional.btc_collateral_usage`

### Market

- `market.spot_price`
- `market.spot_volume`
- `market.futures_open_interest`
- `market.perpetual_open_interest`
- `market.perpetual_funding`
- `market.futures_basis`
- `market.options_open_interest`
- `market.options_implied_volatility`
- `market.liquidations`

### Macro

- `macro.dxy`
- `macro.us_10y_yield`
- `macro.us_10y_real_yield`
- `macro.us_2y_yield`
- `macro.m2`
- `macro.global_liquidity`
- `macro.gold`
- `macro.brent`
- `macro.nasdaq`

### Technology

- `technology.bitcoin_core_version`
- `technology.major_bip`
- `technology.critical_vulnerability`
- `technology.quantum_risk`

### Scenario

- `scenario.digital_gold`
- `scenario.reserve_collateral`
- `scenario.settlement`
- `scenario.independent_asset`

## 4. Update modes

Каждый metric получает:

- `AUTO`
- `SEMI_AUTO`
- `MANUAL`

Правило:

### AUTO

Можно обновлять без изменения research conclusions.

Примеры:

- price
- hashrate
- difficulty
- block count
- market volume

### SEMI_AUTO

Данные загружаются автоматически, но важные изменения требуют проверки.

Примеры:

- ETF flows
- ETF holdings
- corporate holdings
- network analytics

### MANUAL

Требует исследовательского подтверждения.

Примеры:

- sovereign reserve policy
- regulatory interpretation
- scenario state
- strategic role of Bitcoin

## 5. Freshness

Каждый metric должен иметь freshness window.

Пример:

| Metric | Frequency | Freshness |
|---|---:|---:|
| price | minutes | 15 min |
| funding | minutes | 1 h |
| ETF flow | daily | 36 h |
| hashrate | daily | 48 h |
| difficulty | retarget | 3 days |
| supply | daily | 48 h |
| LTH supply | daily/weekly | 7 days |
| macro CPI | monthly | until next release |
| scenario state | research | 30 days / event |

Freshness зависит от природы показателя, а не только от частоты обновления.

## 6. Status model

### NORMAL

Данные находятся в ожидаемом диапазоне.

### WATCH

Наблюдается устойчивое изменение, требующее внимания.

### REVIEW

Изменение может затронуть фундаментальную модель и требует нового исследования.

Важно:

**REVIEW не является торговым сигналом и не означает положительную или отрицательную оценку актива.**

## 7. Trigger model

Trigger связывает показатель с исследовательским блоком.

Пример:

```json
{
  "metric_id": "security.hashrate",
  "trigger": "30d_change <= -15%",
  "event": "REVIEW",
  "research_blocks": ["04", "11"]
}
```

Другой пример:

```json
{
  "metric_id": "institutional.sovereign_btc_holdings",
  "trigger": "official_policy_change",
  "event": "REVIEW",
  "research_blocks": ["07", "12", "13"]
}
```

Trigger создаёт событие, но **не пишет новый вывод автоматически**.

## 8. Website data contract

Сайт должен получать единый объект:

```json
{
  "asset": {},
  "metrics": [],
  "latest_observations": [],
  "history": [],
  "research_snapshot": {},
  "scenario_states": [],
  "monitoring_events": [],
  "sources": []
}
```

Это позволяет одному frontend-компоненту работать с BTC, ETH, SOL и NEAR.

## 9. Website rules

Сайт может:

- показывать current value;
- показывать timestamp;
- показывать source;
- строить history;
- показывать status;
- показывать research conclusions;
- показывать scenario dashboard;
- показывать monitoring events.

Сайт не должен:

- самостоятельно менять methodology;
- заменять source;
- скрывать дату данных;
- смешивать observations разных периодов;
- автоматически менять research conclusions;
- выдавать scenario за fact.

## 10. История

Для каждого metric должна быть доступна временная серия:

```
observation(t1)
observation(t2)
observation(t3)
...
observation(tn)
```

Это позволит строить:

- charts;
- 7d / 30d / 90d / 1y changes;
- regime changes;
- historical snapshots;
- before/after analysis.

## 11. Research ↔ Data связь

Каждый важный вывод должен ссылаться на:

- metric_id;
- observation(s);
- source(s);
- research block;
- research date.

Таким образом:

**вывод → данные → источник**

можно пройти в обратную сторону.

## 12. Multi-asset compatibility

BTC является reference implementation.

Для ETH/SOL/NEAR разрешается:

- использовать общие metric_id;
- добавлять asset-specific metric_id;
- сохранять общие категории.

Пример:

```
staking.*
validator.*
gas.*
blob.*
l2.*
defi.*
```

не должны насильно добавляться в BTC только ради симметрии.

## 13. Версионирование

Версионируются отдельно:

- CryptoResearch skill;
- DataModel;
- metric definitions;
- observations;
- research snapshots.

Изменение методологии:

```
CryptoResearch v2 → v3
```

Изменение структуры данных:

```
CryptoDataModel v1 → v2
```

Изменение значения показателя:

новая Observation, без изменения DataModel.

## 14. Эталонный принцип

**Research отвечает на вопрос «что это значит».**

**Data отвечает на вопрос «что происходит сейчас».**

**Website отвечает на вопрос «как это показать пользователю».**

Нельзя смешивать эти три слоя.

## 15. Следующий этап

После утверждения модели:

1. создать machine-readable registry metric definitions;
2. создать source registry;
3. создать BTC initial dataset;
4. создать API contract;
5. подключить ingestion;
6. построить первую BTC страницу;
7. только затем масштабировать модель на ETH/SOL/NEAR.
