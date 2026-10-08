# Market Data Contract v1

**Status:** FROZEN PRODUCT CONTRACT  
**Scope:** market price, chart intervals, persistence and source fallback  
**Product contour:** Asset Dashboard market block  
**Design:** out of scope  
**VPS:** out of scope

## 1. Purpose

Market Data is the market-context layer of the Asset Dashboard.

It must provide:
- one current asset price;
- canonical market pair identity;
- four user-facing chart presets;
- clear distinction between temporary intraday data and persisted daily history;
- deterministic source/fallback behavior;
- source and observation context.

Market data does not become the Asset identity. Research remains attached to the Asset.

## 2. User-facing presets

| UI | Interval | Window | Storage |
|---|---|---:|---|
| 1 час | 1h | up to 7 days | temporary |
| 4 часа | 4h | up to 7 days | temporary |
| 1 День | 1d | up to 30 days | persisted |
| 7 дней | 1d | 7 days | persisted |

## 3. Current price

Current price is the latest available market price for the canonical Asset's primary registered pair.

API endpoint: `GET /api/pairs/:symbol/ticker`.

Response exposes `status`, `pair`, `price`, `timestamp`, and `source`.

Default source: **Binance**.

For the live ticker, the canonical fallback chain is the registered asset fallback symbols: **Binance → OKX → Bybit → MEXC**. This keeps the quote in the registered `USDT` pair and avoids inventing a separate ticker mapping.

The API must expose the source used for the returned value. A fallback value must never be presented as Binance data.

Current price is read-only temporary market state. It is not written to the database. If automatic UI refresh is introduced, the product default is **60 seconds**; this affects request cadence only and does not create stored ticker history.

## 4. Pair identity

Market data resolves through the canonical `market_pairs` registry.

Identity is `(exchange, symbol)`.

The API must resolve the registered pair, verify base and quote assets, use the registered exchange adapter, and return normalized market data.

A pair must never silently become a different Asset identity.

## 5. Intraday data: 1h / 4h

1h and 4h data are **temporary market data**.

Rules:
- fetched from the live market-data provider;
- not written to `market_daily_candles`;
- not treated as historical research observations;
- no permanent intraday table is introduced in v1;
- source and interval are returned with the response;
- provider failure may use the existing fallback chain where compatible.

## 6. Daily data: 1d / 7d

1d and 7d views use **persisted daily candles**.

Canonical storage: `market_daily_candles`.

Rules:
- daily candles are ingested by the scheduled worker;
- primary source is Binance;
- existing Kraken and CoinGecko fallbacks remain available;
- stored rows record `source_id` and `source_symbol`;
- Dashboard reads persisted daily history for 1d/7d;
- daily history is not silently replaced by a live provider on every read.

## 7. Daily candle boundary

The product requirement is one daily observation per calendar day using the product's canonical day boundary.

Canonical boundary: **00:00 Europe/London**.

The scheduled worker may wake hourly, but performs the daily market snapshot only during the London 00:00 hour. The persisted daily row is the idempotency boundary, and DST is handled through `Europe/London` rather than a fixed UTC offset.

Provider timestamps must be normalized to this product boundary before persistence or comparison.

## 8. Persistence model

v1 keeps the existing table: `market_daily_candles`.

No separate 1h/4h persistence table is introduced.

The existing primary key remains `(asset_id, candle_open_at)`.

Daily rows are upserted idempotently by the worker.

## 9. Source fallback

Source priority depends on the market-data operation:
- live ticker: Binance → registered OKX → Bybit → MEXC;
- daily history ingestion/read: Binance → Kraken → CoinGecko → stored market history where applicable to a read fallback.

Fallback rules:
- source changes must be visible in the API response;
- fallback does not change pair identity;
- fallback does not overwrite research evidence;
- daily persistence records the actual source used;
- no fabricated price or candle is allowed.

## 10. API response contract

The existing endpoint remains:

`GET /api/pairs/:pairId/history?days=...&interval=...`

Response remains compatible with:
- `status`
- `source`
- `pair`
- `interval`
- `days`
- `rows`
- `normalized`
- optional `interpretation`

A market-data response must make it possible for the UI to distinguish live temporary data from persisted daily history.

Implementation adds an explicit `storage_mode` field:
- `temporary`
- `persisted`

`1h`/`4h` return `temporary`; `1d` returns `persisted` when serving stored daily candles.

The ticker endpoint is live temporary market state and is not persisted as a daily candle.

## 11. Asset Dashboard contract

The market block is contextual, not a replacement for the Decision View.

It must show:
- pair;
- latest price;
- selected interval;
- selected window;
- source;
- observation count;
- price change for the selected window where calculable.

Market context remains separate from Research Snapshot, Scores, Critical Factors, Monitoring Signals and Evidence.

## 12. Research boundary

Market data may support:

`DATA → METRIC → SIGNAL → ASSESSMENT`

but the chart itself does not rewrite Research Snapshot conclusions.

A market price is not automatically a thesis signal.

## 13. Non-negotiable invariants

1. Asset identity remains canonical.
2. Pair identity is resolved from `market_pairs`.
3. 1h/4h are temporary and not persisted.
4. 1d/7d read persisted daily history.
5. Daily persistence is idempotent.
6. Source is always identifiable.
7. Fallback never masquerades as primary source.
8. No fabricated market values.
9. Market data does not rewrite research.
10. No new intraday database model in v1.
11. UI remains generic for all Assets.
12. VPS deployment is not part of this contract.

## 14. Acceptance test

For BTC and ETH:

### Current price
- canonical pair resolves;
- Binance is used when available;
- registered exchange fallback is explicit when used;
- current price is not persisted.

### 1h
- response interval = `1h`;
- data is temporary;
- no `market_daily_candles` write occurs.

### 4h
- response interval = `4h`;
- data is temporary;
- no `market_daily_candles` write occurs.

### 1d
- response interval = `1d`;
- rows come from persisted daily history;
- source is preserved.

### 7d
- response interval = `1d`;
- seven-day view reads persisted daily history.

### Generic behavior
The same contract works without asset-specific frontend branches for:

BTC, DASH, ETH, SOL, CAKE, BCH, LTC, XRP, TRX.

## 15. Implementation boundary

The next implementation pass is limited to:
1. document the contract;
2. align API read behavior with the storage rule;
3. align worker daily persistence with the London-day boundary;
4. add contract/E2E assertions;
5. update Dashboard only where the API contract requires it.

No design redesign, no new research model, no VPS work.
