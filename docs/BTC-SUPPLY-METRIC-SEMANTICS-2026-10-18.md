# BTC Supply Metric Semantics — Protocol Issuance vs Circulating Supply

**Status:** contract decision proposal; no metric-registry/runtime admission  
**Date:** 2026-10-18  
**Scope:** distinguish the protocol-derived issuance candidate captured during BTC public-source staging from an economically defined circulating-supply metric.

## Decision

The Mempool-derived value `20,100,159.375 BTC` at block height `972050` is **protocol-scheduled cumulative issuance**, not a verified estimate of economically circulating BTC. It must not be published as `monetary.circulating_supply`, used as a substitute for a market-data provider's circulating-supply field, or used to evaluate a BTC scenario.

Until the canonical metric contract is explicitly selected and its evidence gates pass, keep the candidate review-only and keep BTC `not_evaluable`.

## Distinct concepts

| Concept | Meaning | What it can establish | What it cannot establish |
|---|---|---|---|
| Protocol cumulative issuance | Sum of block subsidies scheduled by consensus through a stated height, subject to chain/finality rules | Reproducible protocol accounting from block height and subsidy schedule | Whether every issued coin is spendable, accessible, or economically circulating |
| Circulating supply (economic metric) | A provider-defined estimate of supply considered in circulation at an observation time | Only the definition, exclusions, method and evidence published by the selected provider | A protocol-exact count unless the provider's method actually establishes one |
| Maximum supply | Protocol issuance ceiling under the consensus schedule | The scheduled upper bound under the assumed protocol rules | Current issued or circulating supply |

## Review-only candidate provenance

- Value: `20,100,159.375 BTC`.
- Source: Mempool.space public block data plus protocol subsidy schedule; candidate captured in BTC Public Source Staging run [#39160316890](https://github.com/olegsh247-stack/Crypto/actions/runs/39160316890).
- Reference height: `972050`.
- Referenced block timestamp: `2026-10-18T19:47:01.000Z`.
- Retrieved at: `2026-10-18T19:47:27.483Z`.
- Payload SHA-256: `ba93f8ed90ec76cb32baeabab30a7d78457a84ae9cc1c48b1e161a5b29a7b096`.
- Status: `REVIEW_ONLY_PROTOCOL_DERIVED_SUPPLY`.

The height and timestamp are part of the observation identity. A later capture is a new observation, not an in-place rewrite. A reorg/finality policy must be applied before treating the reference height as stable.

## Admission contract if protocol issuance is retained as its own metric

Use a separately named metric such as `monetary.protocol_issued_supply` only after the metric registry owners approve its definition and unit. Required fields:

1. `value`: BTC, finite and nonnegative.
2. `observed_at`: referenced block timestamp; never substitute retrieval time.
3. `retrieved_at`: capture time in UTC.
4. `source_id` and source URL; raw response/artifact checksum.
5. `reference_height` and block hash, plus confirmation/finality status.
6. `methodology_version`: subsidy schedule and parser/calculation version.
7. Explicit method statement: cumulative consensus-scheduled subsidies through the reference height; state how genesis issuance, subsidy reductions, reorgs, and any non-subsidy issuance categories are handled.
8. Freshness threshold and duplicate identity based on metric + source + reference height/block identity + methodology version.

This proposal does not assert that a new metric ID already exists. Do not add a registry entry, SQL seed, runtime mapping, or scenario input as part of this documentation decision.

## Evidence gates

- [ ] Inspect the current metric registry and SQL seed to confirm whether a protocol-issuance metric already exists and avoid duplicate IDs.
- [ ] Confirm the implementation counts the subsidy schedule correctly from genesis through the stated height, with explicit handling for chain reorganizations.
- [ ] Preserve a reproducible fixture and raw artifact/checksum.
- [ ] Decide whether Product Contour actually needs protocol issuance, provider-defined circulating supply, or both; do not conflate them.
- [ ] If economic circulating supply is needed, select a separate source with a documented definition, exclusions, observation timestamp, revision policy, access/retention terms and freshness limit.
- [ ] Add contract tests and readiness-gate coverage before any registry/runtime admission.

## Safety boundary

This document does not authorize production API or database queries, database writes, ingestion, registry/runtime changes, scenario evaluation, scenario-state or monitoring-event writes, or deployment.

## Current result

- Protocol-derived candidate: captured and checksummed; review-only.
- Economic circulating-supply definition: not selected/verified.
- Canonical metric ID/registry mapping: not approved by this document.
- BTC scenario eligibility: unchanged; remains `not_evaluable`.
