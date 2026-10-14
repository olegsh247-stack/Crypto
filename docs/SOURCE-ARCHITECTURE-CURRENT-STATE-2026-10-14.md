# Source Architecture — Current-State Audit and Next Steps

**Date:** 2026-10-14  
**Repository:** `olegsh247-stack/Crypto`  
**Scope:** repository configuration and code inspection only. No target database access, no data ingestion, no registry changes, and no scenario/monitoring writes.

## Decision

The project does **not** need a second source registry created from scratch. A shared source registry already exists. The correct next step is to strengthen the existing shared registry and its links to metric definitions, then prove the BTC path end to end before expanding metric coverage to other assets.

Keep three concerns distinct:

1. **Shared source catalog** — what a provider/source is, its stable `source_id`, official URL, access method, terms/permissions, reliability assessment, and operational status.
2. **Metric contract** — what is measured, unit, sampling cadence, freshness rule, observation/window semantics, validation, revision policy, and ordered source priority.
3. **Per-asset use** — which metric contracts an asset needs and which source adapters are used for those metrics. Assets reference shared IDs; they do not duplicate source definitions.

## What exists today

### 1. Shared source registry

File: `data/CryptoDataModel/registry/source-registry.json`  
Observed version on `main`: `1.0.2`.

The registry already contains shared IDs for protocol, network, market, institutional and macro sources, including `protocol.primary`, `network.primary`, `market.kraken`, `institutional.primary`, `institutional.tftc`, and `macro.primary`. Multiple market vendors are also listed.

This is a shared catalog in structure, but entries are not uniformly operationally complete. Some are generic placeholders (for example `market.primary` and `macro.primary`), and the registry does not consistently encode machine-checkable adapter identity/version, permitted-use status, authentication requirements, publication/observation semantics, health status, or revision behavior. Presence in this JSON file does not prove registration in the target database or a working adapter.

### 2. Metric registry

File: `data/CryptoDataModel/registry/metric-registry.json`  
Observed version on `main`: `1.0.0`.

The registry links metrics to sources through `source_priority` and defines units, update mode, frequency, freshness window, validation rules, and research blocks. However, its current `asset_scope` is only `["btc"]`. This is a BTC-focused metric contract, not yet a cross-asset catalog of every future metric.

The source catalog can be shared across assets while metric definitions remain asset-specific where semantics differ. Do not expand `asset_scope` merely to claim multi-asset readiness.

### 3. Runtime readiness gate

File: `vps/shared/src/btc-scenario-readiness.ts`.

The BTC readiness gate checks required input presence, observation age, `CURRENT` freshness, numeric values, HTTPS provenance, registered source, and canonical units. It fails closed and returns `can_persist_scenario_state: false`. This is a BTC-specific evaluation gate, not a general source-management service.

The code validates the timestamp supplied as `observed_at`, but cannot by itself prove that the upstream source assigned the timestamp with the intended meaning. That semantic contract must be established by the metric/source adapter and evidence.

## Current blockers / gaps

- The latest documented target-database source audit is old; no verified, least-privilege read-only route to the actual target database is available in this work session. Disposable CI PostgreSQL is not a substitute.
- `market.kraken` is present in the repository registry, but its registration and adapter mapping in the actual target runtime have not been freshly verified.
- `network.primary` is a broad provider entry. Exact endpoint, field mapping, time-window semantics and source version should be attached to each accepted adapter/metric contract.
- `institutional.primary` points at Farside, but the daily session row is not necessarily a publication timestamp; incomplete fund cells cannot be interpreted as zero. ETF freshness requires a reviewed session-lag/calendar/revision contract or a source-declared publication timestamp.
- `macro.primary` does not identify a canonical DXY feed. `macro.dxy` remains blocked; a different broad USD index must not be silently substituted.
- Fee/subsidy persisted window proposals conflict (completed UTC day versus rolling 144 blocks). The metric/source/monitoring contract must be aligned before activation.
- Source records, metric contracts, adapter implementations and target database rows are separate layers. A JSON registry entry alone does not prove the whole path works.

## Recommended implementation sequence

### Stage A — now: document and stabilize the shared model

- Keep one shared source registry; do not create a per-asset copy.
- Define the minimum source-entry contract: stable ID, canonical URL, provider/type, access method, adapter key/version, permissions/terms review, reliability/status, and provenance/limitations.
- Define the metric contract separately: metric ID, unit, cadence, freshness, observation timestamp meaning, aggregation window/time zone, revision behavior, validation, and source priority.
- Define the asset-to-metric mapping as references to metric IDs; source definitions remain shared.
- Add structural validation/tests for required fields, duplicate IDs, unresolved source references, and generic placeholders used as if they were concrete providers. These checks must not require live market data.

### Stage B — prove one BTC path

- Resolve the BTC required-input contracts without manual daily recapture as a development workflow.
- Make adapters fetch automatically according to metric cadence and produce immutable raw evidence plus normalized candidate observations.
- Test deterministic normalization, incomplete/missing data, stale values, revisions, retries/idempotency, and timestamp/window semantics with fixtures.
- Keep candidate capture and staging dry-run separate from production ingestion.
- Use a verified read-only target DB connection only when one is explicitly available; otherwise report the runtime-registration gate as blocked.
- Evaluate the BTC scenario offline/read-only from a frozen input manifest. Do not persist scenario state or monitoring events as part of readiness checks.

### Stage C — only after BTC end-to-end acceptance

- Add ETH and other assets by defining their required metrics and mapping them to existing shared source IDs where appropriate.
- Add a new source only when no existing source/adapter contract fits.
- Add asset-specific adapters or metric semantics where necessary; do not copy the shared catalog or assume every source serves every asset.

## What not to do

- Do not manually recalculate or re-audit a live daily total every day as a substitute for building an automated ingestion/validation contract.
- Do not treat page retrieval time as source publication/observation time.
- Do not treat blanks, dashes, unavailable rows, or failed requests as zero.
- Do not activate source priorities or write observations solely because a source is listed in JSON.
- Do not broaden to ETH/SOL/CAKE before the complete BTC path is reproducible.
- Do not merge or close existing PRs automatically.

## Acceptance criteria for this architecture step

1. The shared source catalog is the single source-definition location.
2. Metric contracts reference source IDs; asset scope is explicit and does not claim unimplemented assets.
3. Automated structural tests validate catalog integrity without depending on changing live values.
4. Each BTC required metric has an explicit observation/window and revision contract, exact adapter/source mapping, and deterministic fixtures.
5. The BTC no-write staging review is reproducible from a frozen manifest.
6. Actual target runtime registration is either verified via a least-privilege read-only path or explicitly marked blocked; disposable CI is never represented as live proof.
7. The offline BTC scenario can be reproduced from versioned inputs and methodology before any state persistence is considered.

**Current status:** shared catalog exists; cross-asset metric model and operational source contracts are incomplete; BTC scenario remains blocked. This audit changes documentation only and does not accept any input for production ingestion.


## Official Kraken documentation review — 2026-10-14

Reviewed the official [Kraken API Center — Post-Trade Data](https://docs.kraken.com/api/docs/rest-api/get-post-trade) before changing or relying on the spot-price source contract.

The reviewed current API reference documents `GET https://api.kraken.com/0/public/PostTrade`, with explicit `symbol`, `from_ts`, `to_ts`, and `count` parameters (maximum 1000); trade rows include price, symbol, matched-engine `trade_ts`, and `publication_ts`. It describes trades in ascending timestamp order and exposes a latest-trade cursor `last_ts`.

The existing repository candidate path instead targets the legacy `/0/public/Trades?pair=XBTUSD` response and normalizes its array-shaped rows. These are not assumed interchangeable. The current official page reviewed does not document the legacy endpoint's exact payload shape, so the existing parser is not considered fully documented by this review alone. Do not silently switch endpoints or rewrite the parser: first compare both response contracts and timestamp semantics with official docs and safe fixtures, then make a separately reviewed adapter decision.

The documented Post-Trade fields make an explicit distinction between trade-match time and publication time. Any future point-in-time BTC price candidate must retain which timestamp is used as `observed_at`, keep retrieval time separate, validate the requested BTC/USD symbol and price/unit, and record endpoint/version. The documentation review does not by itself establish a provider SLA, request quota for this workload, or permission to redistribute/retain raw payloads indefinitely; those remain open before hosted production reliance.

No live endpoint migration, source-priority change, registry update, database access/write, scheduled collection, or scenario-state change was performed. Kraken spot remains candidate-only until the endpoint and timestamp contract are explicitly accepted.


### Kraken spot-price adapter comparison — 2026-10-14

Official contract reviewed: [Kraken Spot Post-Trade API](https://docs.kraken.com/api/docs/rest-api/get-post-trade). It documents `GET /0/public/PostTrade`, optional `symbol`, `from_ts`, `to_ts`, and `count` (maximum 1000), a `result.trades` array ordered by timestamp, and `last_ts` cursor. Each trade exposes string `price`, `quantity`, `symbol`, unique `trade_id`, engine-match `trade_ts`, and market-data publication `publication_ts`.

The existing legacy `/0/public/Trades?pair=XBTUSD` adapter remains separate: its tuple contains a Unix-seconds trade timestamp and legacy pair key. The two contracts are not interchangeable. A new pure fixture-based `normalizeKrakenPostTrade` candidate adapter now validates the documented object schema and exact requested symbol, selects the newest trade by `trade_ts` rather than relying on array position, and preserves execution, publication, and retrieval times separately. The legacy adapter is unchanged.

This closes a **schema/normalization comparison only**. It does not prove live endpoint accessibility, pagination/cursor correctness over long windows, provider SLA/rate limits, data retention/redistribution rights, target-runtime registration, or canonical-source acceptance. No endpoint switch, source-priority change, registry edit, database write, or scenario-state change is authorized. Keep the existing capture on the legacy endpoint until an explicit reviewed decision is made.
