# alt-tracker integration

## Role

alt-tracker is an existing application that will become a consumer and future source adapter for the Crypto project.

Repository: https://github.com/olegsh247-stack/alt-tracker

## What we found

The repository is a public Next.js 14 application with Supabase-backed user/pair storage and direct market-data adapters.

It currently provides:
- crypto pair tracking;
- exchange adapters for Binance, Bybit, OKX and MEXC;
- current price endpoints;
- historical kline endpoints;
- ratio/pair calculations;
- sparkline calculations;
- commodity tracking via Yahoo Finance;
- user registration/login and pair persistence in Supabase;
- 15-second in-process price cache;
- 5-minute chart/sparkline cache.

## Integration strategy

Do not merge the repositories or copy the application wholesale.

Keep Crypto as the methodology, canonical data model, source/metric registries, observations, research snapshots and monitoring layer.

Keep alt-tracker as the existing UI/application and market-data functionality.

The integration boundary should be:

alt-tracker adapters -> normalized observations -> Crypto data/API contract -> website

Initially alt-tracker remains a separate application while its market-data adapters are evaluated for reuse.

## Required normalization

Existing pair price data is exchange-specific and pair-oriented: exchange + asset -> price.

CryptoDataModel expects: asset + metric_id -> observation.

Future adapters should emit asset_id, metric_id, value, unit, observed_at, source_id, methodology, revision and status.

## Important distinction

The existing 15-second cache is an application cache, not canonical observation history. It must not replace immutable observations.

## Security note

SUPABASE_SERVICE_KEY is a server-side secret and must never be exposed to browser/client code or committed to Git.

## Next integration stages

1. Map alt-tracker market adapters to Crypto metric IDs.
2. Define source IDs for Binance, Bybit, OKX and MEXC.
3. Add a normalized ingestion adapter.
4. Decide whether alt-tracker remains the UI or becomes one module of the future Crypto website.
5. Connect the first normalized market observations to BTC and altcoin pages.
