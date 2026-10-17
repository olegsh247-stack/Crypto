# Source Catalog v1 — design and safe migration plan

Date: 2026-10-17  
Status: design only; no runtime source selection changes authorized by this document.

## Decision

Introduce one machine-readable Source Catalog as the canonical location for source identity, endpoint definitions, access mode, credential *names*, polling constraints, attribution, and operational status. Do not make it the owner of metric semantics or scenario eligibility. Keep the metric registry as the owner of units, validation rules, freshness windows, metric-to-source eligibility, and research-block mapping.

The catalog must not contain secret values, API tokens, cookies, account identifiers, or copied credentials. It may contain an environment variable name such as `SOSOVALUE_API_KEY`.

## Why this is needed

Current source facts are spread across:
- `data/CryptoDataModel/registry/source-registry.json`: provider identity and broad access notes;
- `data/CryptoDataModel/registry/metric-registry.json`: metric source priority, units, cadence/freshness, validation and research blocks;
- `scripts/capture-btc-public-sources.mjs`: endpoint URLs, HTTP capture, source-specific parsing and evidence;
- `scripts/prepare-btc-observation-candidates.mjs`: endpoint/allowlist assumptions and candidate normalization;
- `infrastructure/postgres/seed-v1.sql`: seeded runtime source/metric records;
- GitHub Actions workflow configuration and secrets;
- runtime API endpoints in `vps/api/src/app.ts`;
- source contracts, audit documents, and Plan 100.

This creates a risk of URL, source status, timestamp semantics, units, or secret-name drift. A single catalog should centralize shared source facts while preserving the distinction between a provider being reachable and a metric being approved for evaluation.

## Proposed structure

Recommended initial file: `data/CryptoDataModel/registry/source-catalog.v1.json`.

Top-level fields:
- `catalog_version`: schema/catalog version;
- `updated_at`: UTC timestamp for catalog maintenance, not an observation timestamp;
- `sources[]`: provider/source endpoint records;
- `policy`: safe defaults and status vocabulary.

Each source record should include:
- `source_id`: stable unique identifier;
- `provider`, `name`, `source_type`;
- `endpoint_id`: unique endpoint identity when a provider has multiple endpoints;
- `base_url` and optional path template, without credentials or signed query strings;
- `access_mode`: `public`, `api_key`, `licensed`, `manual`, or `documentation`;
- `credential_env`: optional environment-variable name only;
- `data_role`: `canonical_candidate`, `cross_check`, `review_only`, `documentation_only`, or `blocked`;
- `operational_status`: `verified`, `candidate`, `blocked`, `retired`, or `unknown`;
- `polling`: `mode` (`interval`, `daily`, `event_driven`, `on_demand`, `manual`), `preferred_interval_minutes` where applicable, `minimum_interval_minutes` if known, and provider limits/backoff notes;
- `timestamp_contract`: fields/meaning for source observation time, period/date, retrieval time, and timezone;
- `data_contract`: supported assets/markets, units, endpoint-specific notes, finality/revision behavior;
- `provenance`: documentation URL, license/terms review status, last evidence reference/date;
- `secret_policy`: never store secret values; indicate only the environment variable name and whether required.

Do not duplicate metric-level `source_priority`, unit, validation rule, freshness window, or research-block membership in this catalog. Those belong to the metric registry. If a source can serve several unrelated data products, model each materially different endpoint as a separate endpoint record while keeping the provider identity linked.

## Polling and freshness are different

- Polling interval controls how often the application asks a provider for new data.
- Freshness window controls how old an observation may be before a metric is considered stale.
- A 15-minute UI cache does not imply a 15-minute source observation or canonical research refresh.
- Intraday market prices may use 15–60 minute polling based on purpose, provider limits and cache load.
- Mempool/network metrics may use 15–60 minute polling where useful; daily aggregates should be captured after their period is defined and available.
- ETF flows and macro daily series should be daily/event-driven, not polled every 15 minutes.
- Protocol constants/releases are static or event-driven.
- Provider-specific rate limits override preferred intervals. Failures should use bounded backoff and should not trigger tight retry loops.

## Current source dispositions that must survive migration

- `market.kraken`: public BTC/USD canonical *candidate* for research; preserve trade observation timestamp separately from retrieval timestamp. Metric eligibility still comes from the metric registry.
- Binance market-data-only endpoint and OKX: BTC/USDT cross-check only; never silently convert USDT into USD or blend with Kraken BTC/USD.
- Bybit: currently blocked from the capture environment (HTTP 403); do not try to bypass the restriction by creating credentials.
- Mempool.space: public endpoints; endpoint-level unit, aggregation-window and methodology contracts must be explicit before a metric is considered ready.
- Farside: daily ETF flow review-only until observation/publication time, revisions/finality and row reconciliation are resolved.
- TFTC and CryptoETF.today: ETF cross-check only, not canonical ingestion.
- SoSoValue: keyed cross-check only; `SOSOVALUE_API_KEY` already exists as a GitHub Actions secret. Do not create more keys merely to repeat a check; no source promotion until terms, history coverage, time semantics and revision/finality are reviewed.
- DXY: no approved source. Yahoo Finance is blocked pending access-terms decision; ICE remains an unconfirmed/licensed candidate; FRED broad USD index is not ICE DXY. Keep DXY ineligible until a suitable contract is confirmed.
- Glassnode, derivatives data and additional macro providers: future candidates only; create credentials only after a documented provider/endpoint is selected and terms and metric contracts have passed review.

## Migration phases

### Phase 0 — documentation and schema
1. Add the catalog design and a JSON Schema or equivalent validation contract.
2. Validate uniqueness of `source_id` and `endpoint_id`, allowed enums, URL hygiene, polling constraints and secret-name-only policy.
3. Keep all existing registries and runtime behavior unchanged.

### Phase 1 — inventory/parity checker (read-only)
Build a deterministic check that compares:
- source IDs referenced by metric registry against catalog entries;
- source IDs/endpoints used by capture and candidate-preparation scripts against catalog entries;
- known runtime provider endpoints against catalog entries, with runtime UI endpoints explicitly labelled non-canonical unless linked to a metric contract;
- seed SQL source identities against registry/catalog identities;
- secret references in workflows against catalog credential names without reading or printing secret values.

Report missing, unused, duplicate, conflicting, or unverified entries. Initial mode should report findings without failing builds for known legacy discrepancies; once baseline findings are documented, turn agreed invariants into CI failures.

### Phase 2 — read-only adoption by scripts
Refactor the public-source staging/capture script to read endpoint and access metadata from the catalog, keeping response parsing and provider-specific normalization in adapters. Preserve artifact structure and hashes/manifest expectations where feasible. Do not change canonical source eligibility.

### Phase 3 — candidate preparation and tests
Read endpoint allowlists and source identities from the catalog. Add fixtures proving:
- retrieval time is never substituted for provider observation time;
- cross-check sources cannot become canonical by being reachable;
- BTC/USD and BTC/USDT are not mixed;
- DXY remains blocked without an approved source;
- missing timestamp, unit, provenance, finality or revision semantics fail readiness.

### Phase 4 — runtime and seed parity
Only after separate review, map runtime endpoint configuration and SQL seed references to catalog identities. Do not silently change the UI ticker fallback order, API response shape, database data, metric priorities, scenario state or scoring. Runtime UI market-data sources and research-canonical sources must remain distinct where their contracts differ.

### Phase 5 — controlled activation
Any change that alters source priority, ingestion, registry state, scenario evaluation, production database behavior, or deployment requires a separate explicit approval and a reviewed PR. No automatic promotion from `candidate` or `cross_check` to canonical.

## Acceptance criteria

- Every source reference used by an active metric or capture script resolves to a catalog record or is explicitly documented as legacy/blocked.
- Every endpoint record has an owner, purpose, access mode, timestamp contract, units/market identity, polling mode, and evidence/terms status.
- No secret value is committed or emitted in logs/artifacts.
- CI can identify source-registry/metric-registry/seed/script/runtime drift deterministically.
- The report distinguishes missing catalog entries from intentionally blocked or cross-check-only sources.
- Existing source priorities, production data and scenario state are unchanged by the catalog-only stages.

## Immediate next action

Implement Phase 0 plus a read-only Phase 1 checker. Do not begin Phase 2–5 until the baseline checker results are reviewed. Keep BTC `not_evaluable` while its input contracts remain incomplete.
