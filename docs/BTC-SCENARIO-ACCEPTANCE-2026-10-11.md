# BTC Scenario Acceptance — Read-only validation and next gate

**Date:** 2026-10-11  
**Repository branch:** `fix/vps-worker-london-schedule-parity`  
**Scope:** Read-only API parity and disposable-environment CI verification. No production writes.

## Gate results

- [VPS API Build Rehearsal #283](https://github.com/olegsh247-stack/Crypto/actions/runs/38124230210): **PASS**.
- [Product Contour Gate #257](https://github.com/olegsh247-stack/Crypto/actions/runs/38124230276): **PASS**.
- VPS API parity: `VPS_API_PARITY_OK`, seven endpoints checked; scenario definitions/states and snapshot lineage checks included.
- BTC row-level preflight: `BTC_SCENARIO_PREFLIGHT_OK` and `BTC_SCENARIO_ROW_AUDIT`; no mismatches reported in the complete metric comparison.

## BTC parity confirmed

Live Worker and disposable VPS API agree on:

- Published snapshot `BTC-2026-10-07-v1`, lifecycle `monitoring`.
- 15 research blocks; 6 domains; 6 factors; 5 scores; 15 Evidence rows.
- 7 monitoring signals; 0 monitoring events; 3 scenario definitions; 0 scenario-state rows.
- 21 metric rows (15 qualitative research baseline + 6 market metrics) and 9 registered sources.
- All 21 metrics match by metric ID, value, unit, observation timestamp, source ID, source URL, status and freshness. No `match:false` results were present in the preflight output.
- Evidence rows expose the expected evidence/source/observation/metric/as-of chain in both API projections.

The six market observations are still historical and stale (ETF net flow and spot price dated 2026-09-18; other market observations dated 2026-09-19). Matching stale data is a portability/parity pass, not current-market validation.

## Scenario acceptance remains blocked

Technical parity does not make the BTC scenario decision-ready. The following blockers remain:

1. **No observed scenario state:** the payload has three definitions but zero persisted scenario-state rows. Base 50%, Bull 30%, Bear 20% are definitions, not an observed current state.
2. **Evidence mapping is not reproducible:** each definition has a generic `supporting_evidence` summary, not explicit Evidence row IDs or a machine-verifiable set of evidence references. The 50/30/20 probabilities and confidence values cannot be independently reconstructed from the exposed payload.
3. **Monitoring is qualitative only:** all seven signals have descriptive values, but zero metric links, factor links or thresholds. They should not be presented as functioning quantitative threshold-based monitoring.
4. **Live definition lineage is incomplete:** the VPS response exposes `snapshot_id` on definitions, but the live Worker response does not. The shared snapshot ID is known from the enclosing payload; definition-level lineage cannot be independently verified from the live definition rows.
5. **Source specificity needs improvement:** the spot-check found relevant official sources, but several general claims use broad Bitcoin.org pages rather than claim-specific evidence. The SEC custody item is a proposal, not proof of realized adoption or measured institutional demand.

## Next work — BTC only

Before creating or writing any scenario state, inspect the canonical schema/migrations and API contract for scenario definitions, Evidence, factors and monitoring. Then define and implement a reproducible evidence-to-scenario contract with these acceptance conditions:

- Each Bull/Base/Bear definition references explicit existing Evidence IDs (or another canonical stable key that resolves unambiguously to Evidence rows).
- Each referenced Evidence row resolves to an observation and source; its claim, `as_of`, source URL and status are exposed for review.
- The rationale for each scenario's probability and confidence is explicit and reviewable; do not invent numeric probabilities from generic prose.
- Invalidation conditions are expressed as observable conditions where data exists, or clearly labeled qualitative conditions where it does not.
- Monitoring signals are labeled as qualitative until they have a defined metric/factor mapping, units, update cadence and threshold semantics. Do not fabricate thresholds.
- Definition-level snapshot lineage is available and checked consistently on both API implementations.
- Scenario-state creation remains a separate, explicitly authorized step after read-only acceptance; do not seed a state merely to make the product look complete.

Only after these conditions are implemented and validated should the BTC scenario be accepted. Do not expand research to SOL/CAKE or broaden the data/research scope before this single-asset gate passes.

## Change and safety record

This note records CI and read-only output only. No production migration was applied; no production database row, scenario state, deployment, VPS provisioning, DNS or account setting was changed. PR #9 remains unmerged.
