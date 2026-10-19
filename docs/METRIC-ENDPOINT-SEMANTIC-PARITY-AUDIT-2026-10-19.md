# Metric-to-Endpoint Semantic Parity Audit — 2026-10-19

## Scope

Read-only inspection of `data/CryptoDataModel/registry/metric-registry.json`, `data/CryptoDataModel/registry/source-registry.json`, `data/CryptoDataModel/registry/source-catalog.v1.json`, `infrastructure/postgres/seed-v1.sql`, `scripts/validate-source-catalog.mjs`, and the VPS API/runtime readiness implementation on branch `fix/btc-readiness-registry-runtime-source`.

This audit checks whether source-ID presence is enough to demonstrate that a concrete endpoint supplies the metric's declared unit and meaning. It is not a live-source validation and does not inspect production data.

## Confirmed structural parity

- The metric registry contains 22 metrics.
- All source-registry IDs and all metric `source_priority` IDs have catalog coverage.
- SQL seed source IDs match the source registry in both directions; the validator already asserts both sets are equal.
- The source-catalog validator's current checks for BTC spot and ETF net flow bind those two metrics to explicit source IDs, units, and allowed URL prefixes.
- `macro.dxy` has no source priority and is optional for BTC readiness; no DXY endpoint is being approved by this audit.

These are ID/reference checks, not proof that every source priority is semantically compatible with its metric.

## Findings requiring resolution

### F-01 — ETF holdings metrics point to a flow endpoint

- `institutional.etf_btc_holdings` declares unit `BTC` but has `institutional.primary` in `source_priority`.
- `institutional.corporate_btc_holdings` also declares unit `BTC` and includes `institutional.primary`.
- The concrete catalog endpoint `institutional.farside.etf-all-data` for that source ID declares `USD million/day`, which is daily net flow, not BTC holdings.
- The catalog also has a Farside landing endpoint with the same flow unit; it is blocked.
- `analytics.glassnode` is described only as provider-metric-specific and is not a concrete, verified holdings endpoint in this catalog.

**Disposition:** source-ID presence must not be treated as approval for either holdings metric. Do not map the Farside flow endpoint to BTC holdings. No source-priority change was made because removing/replacing a registered source is a metric-registry decision that needs explicit approval. Until a concrete holdings endpoint and unit/semantics are documented, these metrics remain unverified and must not be treated as supported by the current catalog mapping.

### F-02 — Network metrics have source-level, not endpoint-level, mappings

Several metrics use `network.primary`, including hashrate, difficulty, block time, fee/subsidy ratio, circulating supply, transaction count, mempool size, UTXO count, and block subsidy. The catalog currently lists concrete Mempool.space endpoints for hashrate and block-fee statistics. Those entries do not individually establish the endpoint, response field, normalization, unit, observation-time semantics, and methodology for every metric in that list.

**Disposition:** this is a catalog completeness gap, not proof that Mempool.space cannot supply these values. Each metric needs its own endpoint/field contract (or a documented derived-metric contract with input endpoints, formula, units, and method version) before source eligibility can be considered proven.

### F-03 — Documentation endpoints appear in metric source priorities

`protocol.primary` is used by `monetary.max_supply`, `monetary.block_subsidy`, `technology.bitcoin_core_version`, and `technology.critical_vulnerability`. The catalog entry `protocol.bitcoin-developer-reference` is documentation-only, and therefore does not by itself prove a machine-readable observation endpoint or collection contract for those metrics.

**Disposition:** documentation can support manual research and methodology, but should not be mistaken for a concrete machine-readable endpoint. Define per-metric manual-evidence contracts or register the actual source endpoints before enabling automated capture.

### F-04 — Placeholder sources are not usable provider contracts

The catalog entries for `market.primary` and `macro.primary` are blocked placeholders with no concrete URL/provider contract. They are referenced by futures open interest, perpetual funding, options open interest, and US 10-year yield metrics.

**Disposition:** keep these metrics unverified for automated use until a concrete source is selected and its unit, timestamp, freshness, access terms, and endpoint are documented.

## What remains correctly bounded

- BTC scenario readiness currently treats BTC spot and ETF net flow as required inputs; the optional DXY context is not a blocker.
- The readiness gate is read-only and does not authorize scenario-state persistence.
- No live source capture, production DB read/write, ingestion, registry change, scenario evaluation/state change, deployment, or merge was performed.
- BTC remains `not_evaluable`.

## Next controlled actions

1. Obtain explicit approval before changing source priorities for the ETF holdings metrics.
2. For each network metric, bind a specific endpoint/response field or derived calculation to its metric ID, unit, observation semantics, normalization method, and freshness rule.
3. Separate documentation/manual-evidence references from machine-readable source endpoints in the source catalog.
4. Replace generic blocked placeholders only after a provider and contract are selected.
5. Extend automated validation to check metric-to-catalog endpoint identity and semantic unit compatibility, not merely source-ID presence. Add negative fixtures for a flow endpoint incorrectly linked to a holdings metric and for a documentation-only endpoint linked as an automated data source.
6. Re-run the BTC readiness gate and VPS Build Rehearsal on the resulting commit. Do not close the stage until the exact-head results are confirmed.
