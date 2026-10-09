# Product Contour v1 — Crypto

**Status:** Product contract / architecture baseline  
**Scope:** Information architecture, user journey, responsibilities, data contracts, dependencies and acceptance criteria.  
**Out of scope:** Visual redesign, new database migrations, production deployment, changes to VPS or billing.  
**Compatibility baseline:** Current Next.js Web app, canonical Crypto API, Dynamic Asset Engine, CryptoDataModel v1, and the v2 research-layer design documents.

## 1. Product promise

Crypto is a research and decision-support platform for crypto assets. It brings together:

1. a registry of assets;
2. a concise Asset Dashboard for the current thesis and decision context;
3. a full 15-block Deep Research document;
4. explainable domains, factors and scores;
5. explicit bull/base/bear scenarios;
6. ongoing monitoring;
7. evidence and source traceability.

The dashboard is the concise decision layer. Deep Research is the detailed reading layer. Monitoring updates current signals without silently overwriting historical research snapshots.

## 2. Canonical user journey

The product-level sequence is:

**Home → Assets → Asset Dashboard → Deep Research → Domains → Factors → Scores → Scenarios → Monitoring → Evidence**

This is the conceptual reading order, not a requirement to create ten separate top-level routes. In v1, the Asset Dashboard and Deep Research are the primary asset-specific destinations; Domains, Factors, Scores, Scenarios, Monitoring and Evidence are sections/panels linked from those destinations. Avoid creating redundant pages unless a later usability review proves they are needed.

### 2.1 Home

**Purpose:** Explain the product and provide an immediate entry point to the asset registry.

**Must provide:**
- a clear product statement;
- a live asset count and high-level research/monitoring status, where the API supplies the data;
- a direct path to Assets;
- a direct path to Deep Research status.

**Current implementation:** `/` in `web/app/page.tsx`. It reads `GET /api/assets` and currently contains an Assets list on the home page. Treat this as Home plus the initial Assets entry surface; do not create a competing static asset catalogue.

### 2.2 Assets

**Purpose:** Let the user find and open an asset without asset-specific hardcoding.

**Must provide:**
- canonical symbol, name and asset type/category;
- research lifecycle and freshness when available;
- a stable link to the selected asset dashboard.

**Rules:**
- the Asset Registry/API is the source of truth;
- the UI must render assets dynamically;
- no BTC/ETH/SOL/CAKE-specific UI implementations;
- disabled assets are not presented as enabled registry items.

**Current implementation:** the registry list is embedded in `/` under `#assets`; `MarketTabs` links to this anchor. The canonical detail route is `/assets/{assetId}`.

### 2.3 Asset Dashboard

**Purpose:** Answer, quickly: “What is this asset, what is the current thesis, what supports or challenges it, and what should I watch?”

**Must organize, where data exists:**
- asset identity and type;
- current research status, freshness and progress;
- a concise research conclusion;
- latest market context;
- key domains;
- the most material critical factors;
- explainable scores;
- current scenario context;
- important monitoring signals/events;
- access to the full research and evidence.

**Rules:**
- missing information is shown as unavailable/not populated, not fabricated;
- every score must retain its methodology version and explanation;
- the UI must not calculate or override authoritative research lifecycle/freshness independently of the server;
- market direction and thesis assessment must remain distinguishable.

**Current implementation:** `/assets/{assetId}` in `web/app/assets/[assetId]/page.tsx`. It consumes the Dynamic Asset Engine response and already reads domains, factors, scores, scenarios, monitoring, sources and evidence.

### 2.4 Deep Research

**Purpose:** Provide the complete, readable analytical case behind the concise dashboard.

**Must provide:**
- a clear link back to the dashboard;
- the canonical Structure 1 research document;
- progress/status for all 15 blocks;
- block summaries and analysis when present;
- explicit missing/partial/not-applicable states;
- links between relevant claims and evidence where the API supports the relationship.

**Canonical 15 blocks:**
1. Essence and current role
2. Technology
3. Tokenomics
4. Network and on-chain state
5. Ecosystem
6. Users and activity
7. Institutional use and capital
8. Development and adoption
9. Macroeconomic context
10. Competitors and positioning
11. Risks
12. Catalysts
13. Scenarios
14. Conclusion
15. Monitoring

The canonical order and numbering must be stable across assets. Asset Type determines applicability; it must not lead to invented values for non-applicable concepts.

**Current implementation:** `/research` lists research status by asset; `/assets/{assetId}/research` renders the 15-block document.

### 2.5 Domains

**Purpose:** Group research into a small set of user-facing analytical dimensions, rather than forcing users to navigate only by the 15 research blocks.

**Canonical domains:**
1. `foundation` — Foundation
2. `technology_infrastructure` — Technology & Infrastructure
3. `economics_ecosystem` — Economics & Ecosystem
4. `adoption_capital` — Adoption & Capital
5. `competition_environment` — Competition & Environment
6. `thesis_outlook` — Thesis & Outlook

**Rules:**
- a research block may contribute to multiple domains;
- domain membership/order comes from the data contract, not asset-specific frontend conditions;
- a domain is a navigation/interpretation layer over research, not a duplicate research store.

### 2.6 Factors

**Purpose:** Surface the few variables that materially change the asset thesis.

**Contract:**
- target 3–7 critical factors per research snapshot;
- each factor should have a name, explanation, current state/trend, thesis impact, confidence and monitoring priority where known;
- factors should link to supporting evidence and monitoring signals where available;
- missing or weak support must remain visible.

Factors are not generic tags; they represent thesis-driving variables.

### 2.7 Scores

**Purpose:** Summarize defined analytical dimensions without hiding the reasoning.

**Initial score types:**
- `health`
- `thesis`
- `value_accrual`
- `confidence`
- `competitive_position`

**Rules:**
- every score must include a methodology version and explanation;
- preserve scale bounds and confidence where supplied;
- qualitative competitive position may be categorical; do not force a numeric score;
- do not display an empty/missing score as zero;
- do not present a score as an investment instruction or guaranteed prediction.

### 2.8 Scenarios

**Purpose:** Make the conditional paths of the thesis explicit.

**Canonical types:** `bull`, `base`, `bear`.

Each scenario should expose assumptions, supporting evidence, invalidation conditions, thesis impact and confidence where available. Probability is optional and must remain absent when the methodology does not support a defensible estimate.

Scenarios are conditional analytical states, not promises or forecasts.

### 2.9 Monitoring

**Purpose:** Track changes that may strengthen, weaken or invalidate the thesis after the baseline research.

**Must distinguish:**
- current signal state;
- direction/trend;
- threshold or trigger, when configured;
- thesis impact and confidence;
- last update time;
- historical monitoring events.

Monitoring must not silently rewrite an immutable Research Snapshot. A material change may mark research freshness as update-recommended/outdated according to the server lifecycle contract.

### 2.10 Evidence

**Purpose:** Make important analytical claims inspectable and traceable.

**Evidence chain:**

`DATA → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS`

Evidence should distinguish:
- fact;
- calculation;
- assessment;
- hypothesis.

Where available, expose the linked research block/domain, observation, source, as-of time, claim, signal, assessment, confidence, thesis impact and status. Do not imply that a claim is verified if the source or supporting observation is missing.

## 3. Canonical data and API boundaries

### Source of truth

- **Asset Registry and lifecycle:** Crypto API / Dynamic Asset Engine.
- **Research lifecycle and freshness:** server Engine, normalized by the shared lifecycle contract.
- **Asset detail:** `GET /api/assets/{asset_id}`, returning the versioned Dynamic Asset Engine payload.
- **Asset list:** `GET /api/assets`.
- **Pair data:** existing Pair API and Pair domain; it is not part of the Asset research engine.
- **Web contracts:** `shared/api-contract.ts` and `web/lib/api.ts`.
- **Research lifecycle contract:** `shared/research-status-contract.ts`.
- **Research methodology:** `skills/CryptoResearch/SKILL.md` and `docs/RESEARCH_METHOD.md`.

The Web layer must never write directly to Neon or expose `ADMIN_TOKEN` to browser code. Mutations go through the server-side API/admin proxy and must not claim success until the server confirms it.

### Asset detail payload expected by the product

The current documented Engine payload includes:
- asset metadata and lifecycle/freshness;
- metrics and market history;
- latest research snapshot;
- research blocks and domains;
- critical factors and scores;
- scenarios and scenario states;
- monitoring signals and events;
- sources and evidence.

The product must degrade honestly when optional sections are empty or unavailable.

## 4. Storage and migration boundary

The CryptoDataModel v2 documents are design specifications, not authorization to migrate production data. In particular:
- keep existing v1 tables as the foundation;
- preserve immutable observations and research snapshots;
- do not silently overwrite historical records;
- reconcile `scenario_states` with the proposed v2 `research_scenarios` before any migration;
- do not create a v2 Neon migration until the documented validation set BTC, ETH, SOL and CAKE has passed.

This Product Contour document does not authorize schema changes or production migrations.

## 5. Compatibility findings and unresolved items

1. **The product sequence is not the same as the current route tree.** Home/Assets are combined at `/`; Dashboard and Deep Research have separate routes; the remaining analytical blocks are data sections, not yet separate canonical top-level routes. Preserve this arrangement for v1 unless an explicit product decision changes it.
2. **v2 schema is not yet migrated.** The UI must only depend on fields that the deployed API actually returns; proposed schema fields are not assumed to exist in Neon.
3. **Legacy and proposed scenario representations coexist.** The dashboard currently has compatibility logic for `research_scenarios` and `scenario_states`; their semantic mapping needs to remain explicit until reconciliation is documented.
4. **Evidence/source completeness varies.** Empty arrays or absent links must be represented honestly; do not manufacture provenance.
5. **Runtime release verification is temporarily blocked by GitHub Actions account billing.** Static repository review can continue, but it is not a substitute for build, database or live-runtime proof.
6. **Visual design is frozen for this phase.** This document fixes product responsibilities and compatibility boundaries only; it does not authorize visual redesign.

## 6. Acceptance criteria for Product Contour v1

The contour is considered documented when all the following are true:

- [x] The canonical user journey and responsibilities of each product section are defined.
- [x] The 15-block Deep Research structure is explicitly fixed.
- [x] The six Dashboard domains are explicitly fixed.
- [x] Factors, Scores, Scenarios, Monitoring and Evidence have clear roles and minimum data semantics.
- [x] The source-of-truth and API boundaries are explicit.
- [x] The v1/v2 storage and migration boundary is explicit.
- [x] Current routes and known compatibility gaps are recorded.
- [ ] Each screen/section has been checked against the actual live API payload and representative asset data.
- [ ] BTC, ETH, SOL and CAKE have passed the v2 research-data validation required before any v2 schema migration.
- [ ] Build and runtime E2E checks have passed when the CI/billing blocker is resolved or a safe alternative verification path is available.

The unchecked items are verification gates, not claims of completion.

## 7. Implementation order after contour approval

1. **Contract audit:** compare every dashboard section with actual API payloads for representative assets; record field availability and gaps.
2. **Data completeness audit:** check domains, factors, scores, scenarios, monitoring, evidence and sources without changing the schema.
3. **Behavioral consistency:** ensure lifecycle/freshness, empty states, score scales and scenario compatibility are consistent across Dashboard and Deep Research.
4. **Navigation and traceability:** ensure a user can move from summary → domain/factor/score/scenario → monitoring/evidence → source/research context.
5. **Verification:** run available static/build checks and, when safe, database/runtime E2E. Never rerun a migration workflow blindly against the live Neon database.

Only after these steps should visual redesign or a new data-model migration be considered.
