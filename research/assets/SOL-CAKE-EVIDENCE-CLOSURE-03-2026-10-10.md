# SOL / CAKE — Evidence closure pass 03: normalized evidence contract

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Purpose:** Establish a tested, source-provenance-preserving envelope before adding a live provider adapter.

## Implemented

1. `scripts/research/normalize_sol_cake_rpc_capture.py` — deterministic normalizer from the existing raw RPC capture format to one metric per envelope record. It preserves the SOL context slot, CAKE block number, raw artifact reference, source and methodology URLs, units and timestamp provenance. It fails closed on missing required reads, unpinned CAKE block, or a chain ID other than BSC (56). It deliberately reports contract supply and supply-minus-burn-address separately; it does not subtract candidate locked balances or declare canonical circulating supply.
2. `scripts/research/validate_evidence_envelope.py` — dependency-free validator for normalized JSON evidence records.
3. `scripts/research/tests/test_validate_evidence_envelope.py` — five unit tests covering a valid decimal-string record, missing provenance, timezone-naive timestamps, inverted windows, and booleans masquerading as numeric values.
4. `scripts/research/tests/test_normalize_sol_cake_rpc_capture.py` — fixture tests for normalized values, context preservation, wrong chain and unpinned block.
5. `.github/workflows/research-evidence-envelope-tests.yml` — Python 3.12 compile + unit-test workflow, triggered by relevant pushes and pull requests.
6. `docs/RESEARCH-EVIDENCE-ENVELOPE-V1.md` — contract definition, field semantics and guardrails.

## Validation history

- Initial run: https://github.com/olegsh247-stack/Crypto/actions/runs/38061615010 — failed one test because the decimal-string regular expression was over-escaped.
- Fix commit: `261e688d87d104549ed0eb8dee773e711e0b91be`.
- Re-run: https://github.com/olegsh247-stack/Crypto/actions/runs/38061638525 — **success**. Python compilation and all five unit tests passed.

The first failure was retained as transparent CI history; the corrected validator run is green. The extended pipeline, including the normalizer and its three fixture tests, also compiled and passed in run https://github.com/olegsh247-stack/Crypto/actions/runs/38061693644.

## Contract guardrails

Every metric requires an asset and stable metric ID, a finite numeric value or exact decimal string, an explicit unit, source ID and HTTPS source URL, timezone-aware observation and retrieval timestamps, and a declared evidence kind. Optional windows must be supplied as a pair and be ordered. The validator does not decide whether a source is credible or whether a metric is publishable.

The envelope explicitly separates direct on-chain observations, provider metrics, issuer reports and derived metrics. It does not authorize converting provider addresses into retained-user counts, conflating fees with revenue, or inferring CAKE circulating supply from unreviewed candidate balances.

## Scope deliberately not yet implemented

- No live provider adapter has been added: SDA providers may require API keys, and data access/terms have not been configured or reviewed.
- No new SOL or CAKE RPC capture was executed in this pass.
- No evidence was written to Neon; no scores, scenarios, monitoring events or published snapshots were created.
- No deployment or merge to `main` occurred.

## Next step

Next, wire the tested normalizer into the read-only capture workflow so each successful run validates and uploads both the raw capture and normalized envelope. Keep publication and database writes out of that workflow. Fresh RPC execution still requires a new workflow run; no fresh capture is claimed here. Historical SOL activity-provider integration and CAKE same-window supply/economics reconciliation remain separate evidence tasks.
