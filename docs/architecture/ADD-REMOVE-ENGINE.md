# Add / Remove Engine

The `+` and `−` controls always act on the currently selected top-level tab.

- `Assets` → `+` opens Add Asset; `−` removes/hides the selected Asset.
- `Pair` → `+` opens Add Pair; `−` removes/hides the selected Pair.
- `Commodities` → `+` opens Add Commodity; `−` removes/hides the selected Commodity.

The UI must not contain separate hard-coded add/remove implementations for BTC, ETH, SOL, CAKE, or any other named item. The active tab determines the operation and the Dynamic Asset Engine supplies the item model.

Removal is a user-facing disable/hide operation unless a future explicit administrative delete workflow is introduced. Historical research, observations, evidence, and monitoring data are preserved.
