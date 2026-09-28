# Dynamic Asset Engine

## Goal

The site must render Assets from database data rather than hardcoded BTC/ETH/SOL/CAKE components.

## Canonical flow

`Neon → Asset API → Dynamic Asset Engine → UI`

An Asset is a database entity. A card, detail page, research panel, score panel, and monitoring panel are UI components that render an Asset.

## API contract

### `GET /api/assets`

Returns enabled Assets with:

- identity
- category
- research tier
- exchange symbols
- Asset Type
- Research Status

### `GET /api/assets/{asset_id}`

Returns the complete Asset Engine payload:

- asset metadata
- latest metrics
- market history
- latest Research Snapshot
- Research Blocks 01–15
- Research Domains
- Critical Factors
- Scores
- Monitoring Signals
- Scenario States
- Monitoring Events
- Sources

The response includes `engine: DynamicAssetEngine` and is versioned as API `1.1.0`.

## UI rule

Do not create asset-specific frontend components such as `BitcoinCard`, `EthereumCard`, or `SolanaCard`.

Use generic components:

- `AssetCard`
- `AssetHeader`
- `AssetResearch`
- `AssetScores`
- `AssetFactors`
- `AssetScenarios`
- `AssetMonitoring`

The same components render every Asset.

## Navigation rule

The existing top-level navigation remains:

`Assets | Pair | Commodities | + | −`

The `+` and `−` actions are scoped to the active tab.

- Assets → add/remove tracked Assets.
- Pair → add/remove tracked Pairs.
- Commodities → add/remove tracked Commodities.

The Dynamic Asset Engine owns the Assets tab only; Pair and Commodities remain separate domain engines.

## Asset Type behavior

Asset Type controls which metrics and research questions are applicable. It does not create separate frontend implementations.

Examples:

- BTC → Monetary Asset
- ETH → L1 Settlement Asset
- SOL → L1 Execution Asset
- CAKE → DeFi Protocol Token

Non-applicable metrics are represented as `N/A`; they are not fabricated.

## Research / Monitoring relationship

Research creates the analytical baseline. Monitoring updates current signals and Research Status. Monitoring does not overwrite historical Research Snapshots.

## Extensibility

Adding a new Asset should require database configuration and data population, not new frontend code.

Target capacity: approximately 50 significant Assets.
