# SOL / CAKE — Evidence closure pass 03: normalized evidence contract

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Purpose:** Establish a tested, source-provenance-preserving envelope before adding a live provider adapter.

## Implemented

1. `scripts/research/validate_evidence_envelope.py` — dependency-free validator for normalized JSON evidence records.
2. `scripts/research/tests/test_validate_evidence_envelope.py` — five unit tests covering a valid decimal-string record, missing provenance, timezone-naive timestamps, inverted windows, and booleans masquerading as numeric values.
3. `.github/workflows/research-evidence-envelope-tests.yml` — Python 3.12 compile + unit-test workflow, triggered by relevant pushes and pull requests.
4. `docs/RESEARCH-EVIDENCE-ENVELOPE-V1.md` — contract definition, field semantics and guardrails.

## Validation history

- Initial run: https://github.com/olegsh247-stack/Crypto/actions/runs/38061615010 — failed one test because the decimal-string regular expression was over-escaped.
- Fix commit: `261e688d87d104549ed0eb8dee773e711e0b91be`.
- Re-run: https://github.com/olegsh247-stack/Crypto/actions/runs/38061638525 — **success**. Python compilation and all five unit tests passed.

The first failure was retained as transparent CI history; the corrected run is the current result.

## Contract guardrails

Every metric requires an asset and stable metric ID, a finite numeric value or exact decimal string, an explicit unit, source ID and HTTPS source URL, timezone-aware observation and retrieval timestamps, and a declared evidence kind. Optional windows must be supplied as a pair and be ordered. The validator does not decide whether a source is credible or whether a metric is publishable.

The envelope explicitly separates direct on-chain observations, provider metrics, issuer reports and derived metrics. It does not authorize converting provider addresses into retained-user counts, conflating fees with revenue, or inferring CAKE circulating supply from unreviewed candidate balances.

## Scope deliberately not yet implemented

- No live provider adapter has been added: SDA providers may require API keys, and data access/terms have not been configured or reviewed.
- No new SOL or CAKE RPC capture was executed in this pass.
- No evidence was written to Neon; no scores, scenarios, monitoring events or published snapshots were created.
- No deployment or merge to `main` occurred.

## Next step

Add a small, deterministic normalizer from the existing raw SOL/CAKE RPC capture format into this envelope, with fixture-based tests that prove source timestamps, slot/block identifiers, units and raw-artifact references survive conversion. Only after that conversion passes tests should the collection workflow validate and upload both the raw capture and normalized envelope. Historical SOL activity-provider integration and CAKE same-window supply/economics reconciliation remain separate evidence tasks.
