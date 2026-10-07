# Crypto — Product Contour v1

**Status:** FROZEN PRODUCT CONTOUR  
**Scope:** product structure and responsibilities only  
**Design:** explicitly out of scope for this pass  
**Infrastructure/VPS:** explicitly out of scope

## 1. Product principle

Crypto is a decision-oriented research platform for cryptoassets.

The primary user path is:

```
HOME
  ↓
ASSETS
  ↓
ASSET DASHBOARD
  ├── Domains
  ├── Critical Factors
  ├── Scores
  ├── Scenarios
  ├── Monitoring
  └── Evidence
  ↓
DEEP RESEARCH
  └── Structure 1 · 01 → 15
```

The dashboard is the short decision layer. Deep Research is the detailed analytical layer. Monitoring explains what has changed after the research snapshot.

## 2. Frozen top-level contour

The product consists of these canonical blocks:

1. **Home**
2. **Assets**
3. **Asset Dashboard**
4. **Deep Research**
5. **Domains**
6. **Critical Factors**
7. **Scores**
8. **Scenarios**
9. **Monitoring**
10. **Evidence**

These are product concepts, not ten independent database objects or ten independent routes.

## 3. Home

**Purpose:** explain the product and provide the entry point to the asset universe.

Home must provide:
- product positioning;
- loaded asset count;
- high-level research state;
- entry to Assets;
- entry to Research;
- no reconstruction of Deep Research;
- no asset-specific hard-coded logic.

Home is not the main analytical workspace.

## 4. Assets

**Purpose:** canonical asset registry.

Each asset entry must identify:
- `asset_id`;
- ticker/symbol;
- name;
- asset type;
- research lifecycle;
- research freshness.

Rules:
- one asset = one canonical Asset Card;
- research belongs to the Asset, not a Pair;
- adding an asset must not require a new code branch;
- the UI must use canonical identifiers.

The current primary entry is the Assets section on Home. The existing Pair and Commodities areas remain secondary market sections and are not part of the frozen research contour.

## 5. Asset Dashboard

**Purpose:** answer the decision question quickly:

> What is the current state of this asset, what is the thesis, and what should I watch?

The dashboard must expose, where available:
- Asset / Ticker / Asset Type;
- Research Lifecycle;
- Research Freshness;
- research progress;
- Health Score;
- Thesis Score;
- Value Accrual Score;
- Confidence;
- Current Scenario;
- Main Catalyst;
- Main Risk;
- Six Research Domains;
- Critical Factors;
- Scores;
- Scenario States;
- Monitoring Signals;
- Evidence / Sources.

The dashboard reads aggregated state. It does not rebuild the 15-block research logic.

The dashboard must link to the complete Deep Research view.

## 6. Deep Research

**Purpose:** complete analytical reading layer.

Canonical methodology:
**CryptoResearch v2 / Structure 1**

The research remains exactly 15 canonical blocks:

01. Essence / current role
02. Technology
03. Tokenomics
04. Network / on-chain
05. Ecosystem
06. Users / activity
07. Institutions / capital
08. Development / adoption
09. Macro
10. Competition
11. Risks
12. Catalysts
13. Scenarios
14. Conclusion
15. Monitoring

Rules:
- the 15 blocks are the canonical research structure;
- Domains aggregate the blocks and never replace them;
- block statuses are `not_started / partial / complete / n_a`;
- lifecycle is separate from freshness;
- historical snapshots are not silently overwritten.

Primary deep-research route:
`/assets/:assetId/research`

## 7. Domains

Domains are dashboard-level aggregation views.

They answer:
> Which major area of the asset's thesis is strong, weak, improving, or uncertain?

Domains do not replace Structure 1.

They must remain mapped to canonical research blocks through the existing DB mapping model.

## 8. Critical Factors

Critical Factors are asset-specific thesis drivers.

They answer:
> Which few factors can materially change the thesis?

Each factor may carry:
- current state;
- trend;
- confidence;
- thesis impact.

Critical Factors are not generic global KPIs and must not be hard-coded by asset.

## 9. Scores

Scores are analytical summaries, not standalone truth.

The product must show scores together with:
- score type;
- value;
- explanation/methodology where available;
- confidence;
- calculation/research context where available.

Required dashboard concepts:
- Health Score;
- Thesis Score;
- Value Accrual Score;
- Confidence.

A missing score is displayed as unavailable; it is never fabricated.

## 10. Scenarios

Scenario States describe conditional future states.

The contour supports:
- Bull;
- Base;
- Bear;
- assumptions;
- probability/confidence where available;
- thesis impact;
- invalidation conditions.

The current scenario is surfaced on the Asset Dashboard.

## 11. Monitoring

Monitoring is the current-state layer after research.

It answers:
> What changed, and does that change the thesis?

Monitoring must keep:
- current signals;
- direction;
- current value where available;
- thesis impact;
- monitoring events;
- historical research snapshots

conceptually separate.

Monitoring updates current state without rewriting historical research.

## 12. Evidence

Evidence is the provenance layer.

The intended analytical chain is:

```
DATA
  ↓
METRIC
  ↓
SIGNAL
  ↓
ASSESSMENT
  ↓
CONFIDENCE
  ↓
THESIS IMPACT
  ↓
STATUS
```

Evidence must remain traceable to observations and sources.

Relevant metrics may be `N/A` when genuinely irrelevant or unavailable. The system must never invent a value to fill a card.

## 13. Navigation contract

The intended primary navigation is:

```
Home
Assets
Research
```

Asset navigation:

```
Assets
  → Asset Dashboard
      → Deep Research
      → Domains
      → Factors
      → Scores
      → Scenarios
      → Monitoring
      → Evidence
```

Domains/Factors/Scores/Scenarios/Monitoring/Evidence are sections of the Asset Dashboard in v1, not separate primary routes.

Secondary existing market areas:
- Pair
- Commodities

They remain outside the core research contour.

## 14. Data and architecture contract

The product uses the existing architecture:

```
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

Canonical storage remains:
- assets
- asset_types
- market_pairs
- market_daily_candles
- observations
- sources
- research_snapshots
- research_blocks
- research_domains
- research_block_domains
- critical_factors
- research_scores
- scenario_states
- monitoring_events
- monitoring_signals
- research_status

The `/api/assets/:assetId` payload remains the integration point for the Asset Dashboard.

## 15. Status contracts

### Research block status
`not_started / partial / complete / n_a`

### Research lifecycle
`not_started / in_progress / complete / monitoring`

### Research freshness
`current / update_recommended / outdated`

Lifecycle and freshness are independent.

## 16. Non-negotiable invariants

1. No asset-specific UI/engine branches such as `if (ETH)`.
2. No Pair becomes the Asset identity.
3. No Dashboard reconstruction of Deep Research.
4. No replacement of Structure 1 by Domains.
5. No fabricated metrics, scores or evidence.
6. No silent rewriting of historical research snapshots.
7. Canonical DB identifiers are used by the Web.
8. `block_number` is the canonical research-block number.
9. Asset-specific metrics may be `N/A`.
10. Expansion to ETH, SOL, CAKE, BCH, LTC, XRP, TRX must require no architectural redesign.

## 17. v1 acceptance test

The contour is considered structurally complete when a user can:

1. Open Home.
2. See the asset universe.
3. Open an Asset.
4. Understand its current decision state from the Dashboard.
5. Inspect Domains.
6. Inspect Critical Factors.
7. Inspect Scores.
8. Inspect Scenarios.
9. Inspect Monitoring.
10. Inspect Evidence.
11. Open Deep Research.
12. Read all 15 Structure 1 blocks.
13. Return to the Dashboard without losing context.

The first real end-to-end validation target is ETH, followed by BTC as the first additional asset scenario.

## 18. Explicitly deferred

The following are **not part of this freeze**:
- visual redesign;
- colors, typography and visual identity;
- card beauty/polish;
- new animation;
- VPS deployment;
- infrastructure redesign;
- new research methodology;
- replacing Structure 1;
- large-scale new feature work.

The next work after this freeze is **functional/product validation**, not design.
