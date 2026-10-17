# Pair & Commodity Engine

The top-level navigation remains:

`Assets | Pair | Commodities | + | −`

## Pair

Pairs are independent from Asset research entities. A pair identifies a tradable market such as `BTC/USDT` or `ETH/USDT` and carries exchange/market context. Pair selection must not create a duplicate Asset.

The Pair Engine normalizes base/quote symbols, rejects empty legs, and rejects identical base/quote symbols.

## Commodities

Commodities use the same dynamic navigation pattern but their data model is intentionally separate from crypto Assets and trading Pairs. A commodity has an id, symbol, name, optional unit, and enabled state.

## Shared behavior

`+` and `−` are interpreted from the active tab. Removing an item disables/hides it rather than deleting historical observations or research.

No named item such as BTC, ETH, SOL, CAKE, Gold, or a particular pair is hard-coded into the engine.
