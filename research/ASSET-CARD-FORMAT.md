# Asset Card — Canonical Storage Model

## Purpose

Every researched asset has its own logical Asset Card. The card is a database-backed entity identified by `asset_id`.

GitHub stores methodology, Structure 1, templates and research source artifacts. Neon stores the working asset card and its current/historical research state. The website reads Neon.

## Asset Card

```text
Asset
├── Identity
│   ├── symbol
│   ├── name
│   └── asset_type
├── Market Instruments
│   └── Pair(s) — separate from Asset identity
├── Research Snapshot(s)
│   └── Research Blocks 01–15
├── Six Research Domains
├── Critical Factors
├── Scores
├── Scenario States
├── Monitoring Events
├── Monitoring Signals
└── Evidence / Sources / Observations
```

## Rules

1. One asset = one canonical Asset Card.
2. Asset Cards are stored in Neon and addressed by `asset_id`.
3. Research belongs to the Asset, not to a Pair.
4. Multiple Pairs may provide market data for one Asset.
5. The 15 research blocks remain the canonical deep-research structure.
6. Research Domains aggregate the blocks; they do not replace them.
7. Monitoring updates the current state without rewriting historical snapshots.
8. Evidence remains traceable to observations and sources.
9. Asset-specific metrics are `N/A` when genuinely irrelevant or unavailable; never fabricate values.
10. The API and UI must be asset-generic. No asset-specific branches such as `if (ETH)` are permitted in the research engine.

## First implementation

ETH is the first complete Asset Card implementation. Its Markdown file in `research/assets/ETH/` is a source artifact / baseline, not the production database.

## Production flow

```text
GitHub methodology + research source artifact
                  ↓
              Asset Card
                  ↓
                Neon
                  ↓
        Dynamic Asset Engine
                  ↓
        Dashboard / Research / Monitoring
```

## Expansion

The same model must work without architectural changes for:

`ETH · SOL · CAKE · BCH · LTC · XRP · TRX`

Adding an asset means creating an Asset record and its research state; it must not require new hard-coded code paths.

**Status:** canonical storage and architecture rule for Asset Cards.
