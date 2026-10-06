# ПЛАН-ФИНАЛ — FULL AUDIT MATRIX

Дата: 2026-10-06
Репозиторий: olegsh247-stack/Crypto
Статус: FULL REPOSITORY AUDIT — BATCH 1+2 + E2E/UI REPAIR VERIFIED

> Важно: этот документ фиксирует то, что удалось доказать по текущему GitHub tree. Account-level Cloudflare/Neon состояние, live DB, live API и фактический UI runtime не считаются GREEN без прямой проверки. Они помечены YELLOW/MISSING там, где доказательств из репозитория недостаточно.

## Executive verdict

**Система уже имеет сильный Research/Asset foundation, но FULL AUDIT пока не GREEN.**

Главные найденные проблемы до repair (Batch 1+2 ниже уже закрыты в коде; live CI/DB verification pending):

1. **P1 — Market Pair model:** исправлено в Batch 1: identity теперь `(exchange, symbol)`, `exchange` обязателен.
2. **P1 — Dynamic Asset Engine:** исправлено в Batch 2: enabled asset требует валидный primary type; новый не классифицированный asset создаётся disabled.
3. **P1 — Migration reproducibility:** исправлено в Batch 1: добавлен marker-aware deterministic runner `scripts/migrate-neon.sh`.
4. **P1 — Deployment contract:** workflow уже существует и усилен в Batch 2; live deployment/health-check подтверждён GitHub Actions.
5. **P1 — Infrastructure:** Cloudflare + Neon dependencies подтверждены, но account-level inventory ещё не доказан.
6. **P2 — API error disclosure:** исправлено в Batch 2: raw exception details убраны из public responses.
7. **P2 — Runtime portability:** API жёстко привязан к Cloudflare Worker + Neon serverless driver.
8. **YELLOW — UI:** текущий GitHub audit не получил достаточного tree/runtime evidence для доказательства UI contract.
9. **YELLOW — Worker/ingestion:** canonical Worker architecture известна из истории проекта, но текущий tree не даёт достаточного доказательства полного scheduled ingestion E2E.

---

## 1. Unified matrix

| ID | Layer | Component | Status | Severity | Evidence | Root Cause | Required Fix | Dependencies |
|---|---|---|---|---|---|---|---|---|
| DB-01 | 1 Database | PostgreSQL schema | YELLOW | P1 | `schema-v1.sql` + additive migrations | Bootstrap и incremental migration paths разделены | Сделать canonical bootstrap + deterministic migration runner | CI, VPS migration |
| DB-02 | 1 Database | PK/FK/checks | GREEN | P2 | PK/FK/CHECK присутствуют в schema/migrations | — | Добавить automated schema invariant audit | CI |
| DB-03 | 1 Database | migration markers | YELLOW | P1 | `schema_migrations` существует; marker usage неполный | Migration execution model смешивает workflow order и markers | Единый migration registry/runner | CI |
| REG-01 | 2 Asset Registry | canonical IDs | GREEN | P2 | lowercase contract + canonicalization migration | — | Оставить CI invariant | — |
| REG-02 | 2 Asset Registry | asset type | GREEN/YELLOW | P1 | Batch 2 API contract + CI | — | Enabled assets require valid type; new unclassified assets disabled | API/DB |
| REG-03 | 2 Asset Registry | market identity | GREEN | P2 | binance_symbol/fallback fields + CI checks | — | Расширить contract to all actual assets | Data |
| REG-04 | 2 Asset Registry | completeness | YELLOW | P1 | 9 core assets + USDT expected by migrations | Live DB not directly proven in repo | Build registry inventory check | DB/live |
| MKT-01 | 3 Market Registry | pair FK | GREEN | P2 | 2026-10-07 FK migration | — | Keep | — |
| MKT-02 | 3 Market Registry | symbol uniqueness | GREEN | P1 | Batch 1 migration `2026-10-09-market-pair-identity.sql` | — | UNIQUE(exchange,symbol); live migration verified | DB/API/UI |
| MKT-03 | 3 Market Registry | symbol vs legs | YELLOW | P1 | format check only validates uppercase + slash | DB does not prove BTC/USDT matches btc/usdt | Add pair-symbol consistency CHECK/function or ingestion validation | DB |
| MKT-04 | 3 Market Registry | multi-exchange | GREEN | P1 | Batch 1 migration + API pair contract | — | Exchange required; same symbol can exist per exchange | DB/API |
| HIST-01 | 4 Market History | Binance history | GREEN | P2 | API klines path | — | Keep abstraction | — |
| HIST-02 | 4 Market History | fallback exchanges | GREEN/YELLOW | P1 | fallback_symbols stored; current API uses Binance directly | History resolves registered pair/exchange before adapter call; only Binance adapter is implemented | Add non-Binance adapters later | API/Worker |
| HIST-03 | 4 Market History | persistence | YELLOW | P1 | market_daily_candles exists | Runtime API reads history; ingestion proof incomplete | Prove scheduled DB ingestion and idempotency | Worker/CI |
| HIST-04 | 4 Market History | stablecoin quote | GREEN | P2 | USD/USDT/USDC handling in API | — | Add contract tests | CI |
| RES-01 | 5 Research | 15 blocks | GREEN | P2 | DB CHECK + ETH seed | — | Keep | — |
| RES-02 | 5 Research | N/A semantics | GREEN | P2 | shared contract | — | Keep | API/UI/CI |
| RES-03 | 5 Research | domain mapping | GREEN | P2 | FK + ETH mapping + CI | — | Keep | CI |
| RES-04 | 5 Research | evidence chain | YELLOW | P1 | schema supports evidence; ETH artifact documents chain | Runtime completeness across assets not proven | Add research completeness contract | DB/CI |
| RES-05 | 5 Research | snapshot lifecycle | YELLOW | P1 | snapshots + status | API takes latest version, not explicitly PUBLISHED-only | Define canonical published snapshot resolver | API |
| MON-01 | 6 Monitoring | signal uniqueness | GREEN | P2 | uniqueness migration | — | Keep | — |
| MON-02 | 6 Monitoring | block 15 transition | GREEN | P2 | shared lifecycle + API logic | — | Keep | — |
| MON-03 | 6 Monitoring | live refresh | YELLOW | P1 | status model exists | Actual scheduler/ingestion not proven | Add freshness/trigger worker contract | Worker |
| API-01 | 7 API | asset casing | GREEN | P2 | getAssetId lowercases path | — | Keep | — |
| API-02 | 7 API | admin auth | GREEN | P1 | requireAdmin on POST/DELETE/schema | — | Add tests | CI |
| API-03 | 7 API | error disclosure | GREEN/YELLOW | P2 | Batch 2 API cleanup | — | Raw exception details removed; deployment verified; API behavior tests still pending | API |
| API-04 | 7 API | POST asset contract | GREEN/YELLOW | P1 | Batch 2 API contract | — | Enabled assets require valid primary type; partial updates preserve state | Registry |
| API-05 | 7 API | pair/history contract | GREEN/YELLOW | P1 | Batch 2 history resolver | — | History resolves DB pair/exchange before Binance adapter | Market Registry |
| WRK-01 | 8 Workers | canonical entrypoint | YELLOW | P1 | prior architecture known; current worker tree incomplete | Runtime entrypoint not fully proven in current audit | Inventory worker files and schedule | Infra |
| WRK-02 | 8 Workers | idempotency/retry | YELLOW | P1 | no sufficient current evidence | ingestion guarantees not proven | Add explicit worker contract + tests | DB/CI |
| WRK-03 | 8 Workers | deployment | GREEN/YELLOW | P1 | `.github/workflows/deploy-crypto-api.yml` | Live run successful | CI |
| UI-01 | 9 UI | API/shared types | YELLOW | P1 | insufficient current tree evidence | UI contract cannot be proven from fetched files | Inventory UI and shared types | API |
| UI-02 | 9 UI | lifecycle/freshness | YELLOW | P1 | backend contract exists | UI mapping not proven | Add UI contract tests | API |
| UI-03 | 9 UI | history/empty/error | YELLOW | P2 | backend paths exist | rendering behavior not proven | Add states explicitly | UI |
| CI-01 | 10 CI/CD | DB contract checks | GREEN | P2 | apply-neon-v2 workflow | — | Expand | — |
| CI-02 | 10 CI/CD | API deployment | GREEN/YELLOW | P1 | `.github/workflows/deploy-crypto-api.yml` + Batch 2 verification | Live run successful; health contract verified | Infra |
| CI-03 | 10 CI/CD | clean DB bootstrap | GREEN/YELLOW | P1 | `scripts/migrate-neon.sh` + manual bootstrap workflow | Live clean DB run pending | Execute clean DB test | DB |
| SEC-01 | 11 Security | admin schema | GREEN | P1 | protected with ADMIN_TOKEN | — | Keep | — |
| SEC-02 | 11 Security | CORS | YELLOW | P2 | `Access-Control-Allow-Origin: *` | Broad public browser access | Restrict origin when UI domain is known | Infra/UI |
| SEC-03 | 11 Security | secrets | YELLOW | P1 | env-based secrets | account secret inventory unavailable | Inventory and rotate during infra migration | Infra |
| DATA-01 | 12 Data | canonical 9 assets | GREEN | P2 | migrations + CI expected set | Live DB not directly checked here | Add live inventory test | DB |
| DATA-02 | 12 Data | USDT system asset | GREEN | P2 | canonical USDT migration | — | Keep separate from research targets | Registry |
| DATA-03 | 12 Data | history coverage | YELLOW | P1 | candles table exists | per-asset actual coverage not proven | Coverage matrix | Worker |
| LEG-01 | 13 Legacy | old engine | GREEN | P2 | previous cleanup commits + current architecture | — | Final grep/inventory | — |
| LEG-02 | 13 Legacy | duplicate contracts | YELLOW | P1 | shared contract + API local helper | duplicated lifecycle calculation remains | Make shared contract sole authority | API/UI/CI |
| LEG-03 | 13 Legacy | hardcoded symbols | YELLOW | P2 | canonical pair migration contains explicit 9-asset seed | Seed is acceptable; runtime hardcoding must be checked | Separate canonical seed from runtime resolver | API/Worker |
| DOC-01 | 14 Docs | README | GREEN | P3 | current README matches Research v2 | — | Update after final architecture | — |
| DOC-02 | 14 Docs | infrastructure docs | GREEN | P2 | INFRASTRUCTURE-PLAN-FINAL created | — | Update after migration decision | Infra |
| DOC-03 | 14 Docs | API/Pair contracts | YELLOW | P2 | contracts partially implicit in code/CI | no single canonical API contract document | Create contracts | API |
| E2E-01 | 15 E2E | Asset→Market→History | YELLOW | P1 | pieces exist | full runtime chain not proven | Execute E2E on ETH + BTC | DB/API/Worker |
| E2E-02 | 15 E2E | Research→Monitoring | GREEN/YELLOW | P1 | ETH schema/seed + lifecycle | live trigger/update path not fully proven | Execute monitoring E2E | Worker |
| E2E-03 | 15 E2E | API→UI | YELLOW | P1 | API proven in source | UI runtime not proven | Execute browser/API contract E2E | UI |

---

# 2. Priority repair queue

## P0

**No new P0 confirmed by repository inspection.**

Admin schema endpoint is protected in current source.

## P1 — Batch 1 / Batch 2

**Batch 1 and Batch 2 implementation is committed. Live CI exposed one legacy uppercase `ETH` row left behind by the historical migration order; Batch 1 now includes `2026-10-10-remove-legacy-uppercase-eth.sql` to canonicalize that remaining data.**


### P1-01 — Market Pair identity

Current:
`UNIQUE(symbol)`

Target:
`UNIQUE(exchange, symbol)`

And exchange should become required for actual trading pairs.

This is the most important Market Registry defect.

### P1-02 — Dynamic Asset POST

Current endpoint can create:

```
asset_id
symbol
name
category
research_tier
enabled=true
primary_asset_type_id=NULL
```

That contradicts the strengthened Asset Registry contract.

Target options:
- require `primary_asset_type_id`;
- or create new assets disabled until classification;
- or have server-side deterministic classification.

Preferred: **new assets enter as `enabled=false` until Registry enrichment is complete**, unless a valid type is explicitly supplied.

### P1-03 — Market Pair ↔ Market Identity

Current history route constructs:

```
baseAsset + quoteAsset
```

and directly calls Binance.

Target:

```
Asset
 ↓
Market Identity
 ↓
Market Pair
 ↓
Exchange adapter
 ↓
History
```

The DB Registry must become the source of truth.

### P1-04 — Migration bootstrap

Current workflow applies later migrations against an already-existing DB.

Target:

```
schema-v1
 ↓
ordered migrations
 ↓
contract verification
```

A clean database test must run in CI.

### P1-05 — Deployment pipeline

Need explicit:

```
test
 ↓
migration validation
 ↓
build
 ↓
deploy API
 ↓
deploy Worker
 ↓
health check
 ↓
E2E
```

---

# 3. Infrastructure result

Current:
**Cloudflare Worker + Neon PostgreSQL**

Recommended target:
**VPS + Docker Compose + PostgreSQL 16 + Caddy**

The detailed migration plan is in:

`docs/INFRASTRUCTURE-PLAN-FINAL.md`

Infrastructure is **YELLOW**, not RED, because the current architecture works conceptually; the problem is complexity/vendor coupling and incomplete deployment inventory.

---

# 4. Research result

Research architecture is currently the strongest part of Crypto.

Confirmed:
- 15 standard blocks;
- explicit block status;
- N/A semantics;
- 6 research domains;
- domain mapping;
- evidence model;
- critical factors;
- scenarios;
- scores;
- monitoring signals;
- research status/freshness;
- ETH canonical Asset Card.

The main remaining issue is **contract centralization**: API contains local lifecycle calculation while shared contract also exists.

Target:
**shared contract = sole semantic authority.**

---

# 5. Market result

Market layer is currently the weakest architectural contract.

The intended model is correct:

```
Asset Registry
      ↓
Market Identity
      ↓
Market Pair
      ↓
Exchange
      ↓
History
```

But the current DB/API implementation still partially treats the pair symbol itself as the identity.

This must be repaired before scaling to multiple exchanges.

---

# 6. Data completeness result

Expected core registry:

```
BTC
DASH
ETH
SOL
CAKE
BCH
LTC
XRP
TRX
```

System quote asset:

```
USDT
```

ETH is the only asset currently proven as a full Research Card implementation.

Other assets should **not** be auto-promoted to full research.

---

# 7. Final audit state

| Area | Result |
|---|---|
| Database | YELLOW |
| Asset Registry | YELLOW |
| Market Registry | RED |
| Market History | YELLOW |
| Research Engine | GREEN/YELLOW |
| Monitoring | GREEN/YELLOW |
| API | RED/YELLOW |
| Workers | YELLOW |
| UI | YELLOW |
| CI/CD | RED/YELLOW |
| Security | GREEN/YELLOW |
| Data Completeness | YELLOW |
| Legacy | GREEN/YELLOW |
| Documentation | GREEN/YELLOW |
| E2E | YELLOW |

## Overall

**YELLOW — architecture is viable, but repair should happen before migration to VPS.**

---

# 8. Repair order

Do NOT start random fixes.

Execute exactly:

### Batch 1 — Core integrity
1. Market Pair identity.
2. Dynamic Asset Registry contract.
3. Market Identity → Pair → Exchange resolver.
4. Clean DB bootstrap.

### Batch 2 — API / Worker
5. API contract cleanup.
6. Shared lifecycle authority.
7. History resolver.
8. Worker ingestion/idempotency.
9. Deployment pipeline.

### Batch 3 — UI
10. UI contract audit.
11. lifecycle/freshness mapping.
12. history/error states.

### Batch 4 — Data
13. full registry inventory.
14. history coverage.
15. ETH E2E.
16. BTC E2E.

### Batch 5 — Legacy/docs
17. final duplicate-contract cleanup.
18. API/Pair contract docs.
19. infrastructure migration preparation.

### Batch 6 — Infrastructure
20. VPS build.
21. DB restore.
22. API/Worker migration.
23. backup/restore.
24. cutover.
25. rollback validation.
26. only then decommission Neon/Cloudflare.

---

# 9. Definition of Done for the next cycle

Before VPS migration:

- [ ] Market Pair contract GREEN
- [ ] Asset Registry POST contract GREEN
- [ ] Market Identity resolver GREEN
- [ ] clean DB bootstrap GREEN
- [ ] API contract GREEN
- [ ] Worker contract GREEN
- [ ] UI contract GREEN
- [ ] CI deploy GREEN
- [ ] ETH E2E GREEN
- [ ] BTC E2E GREEN
- [ ] no P0
- [ ] no unresolved P1 without decision

**Only after these checks should INFRA-BATCH-1 begin.**


### E2E/UI verification — 2026-10-06

- Live Worker endpoint: `https://crypto-api.olegsh247.workers.dev`
- API smoke: **SUCCESS**
- DB health: **SUCCESS**
- Asset Registry: BTC + ETH canonical IDs verified
- ETH Research Card: 15 resolved blocks verified
- Canonical market pairs: 9 verified
- BTC/USDT history: **SUCCESS**
- ETH/USDT history: **SUCCESS**
- Neon Engine contract verification after deployment: **SUCCESS**
- Next.js web build: **SUCCESS**
- UI mutation paths now use a server-side admin proxy instead of exposing admin credentials to the browser.
- Market history has exchange-provider fallback handling; Binance public market-data egress from the Worker was returning 403/451, so the runtime now falls back to Kraken public OHLC and then persistent/secondary sources. Kraken documents its public OHLC endpoints as unauthenticated market data. cite turn4search0 turn4search4 
