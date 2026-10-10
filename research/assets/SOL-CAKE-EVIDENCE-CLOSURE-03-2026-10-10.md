# SOL / CAKE — Evidence closure pass 03: normalized evidence contract

**Date:** 2026-10-10  
**Branch:** `fix/product-contour-v1-contracts`  
**Purpose:** Establish a tested, source-provenance-preserving envelope before adding a live provider adapter.

## Implemented

1. `scripts/research/normalize_sol_cake_rpc_capture.py` — deterministic normalizer from the existing raw RPC capture format to one metric per envelope record. It preserves the SOL context slot, CAKE block number, raw artifact reference, source and methodology URLs, units and timestamp provenance. It converts Solana `getSupply` integer lamports to SOL by dividing by 1e9, rejecting ambiguous non-integer values. It fails closed on missing required reads, unpinned CAKE block, or a chain ID other than BSC (56). It deliberately reports contract supply and supply-minus-burn-address separately; it does not subtract candidate locked balances or declare canonical circulating supply.
2. `scripts/research/validate_evidence_envelope.py` — dependency-free validator for normalized JSON evidence records.
3. `scripts/research/tests/test_validate_evidence_envelope.py` — five unit tests covering a valid decimal-string record, missing provenance, timezone-naive timestamps, inverted windows, and booleans masquerading as numeric values.
4. `scripts/research/tests/test_normalize_sol_cake_rpc_capture.py` — fixture tests for normalized values, context preservation, wrong chain and unpinned block.
5. `.github/workflows/research-evidence-envelope-tests.yml` — Python 3.12 compile + unit-test workflow, triggered by relevant pushes and pull requests.
6. `docs/RESEARCH-EVIDENCE-ENVELOPE-V1.md` — contract definition, field semantics and guardrails.
7. `.github/workflows/research-onchain-capture.yml` — runs the read-only RPC capture, then the normalizer/validator on successful capture, and uploads both JSON files in one seven-day artifact. The workflow also runs on pushes to this working branch when capture-related paths change.

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
- Workflow run #186 captured fresh RPC state and uploaded both JSON files: https://github.com/olegsh247-stack/Crypto/actions/runs/38061956090. Raw-vs-normalized comparison exposed a units bug: `getSupply` lamport counts had initially been labeled as SOL. The normalizer and fixture tests were corrected to divide by 1e9 and reject non-integer `getSupply` values.
- Corrected live run: https://github.com/olegsh247-stack/Crypto/actions/runs/38062042855 — **success**. Raw capture reports no RPC errors; both raw and normalized JSON artifacts were uploaded. Seven normalized metrics were cross-checked against raw values using exact decimal arithmetic: SOL circulating and non-circulating supply (lamports → SOL), CAKE `totalSupply`, burn-address balance and derived subtraction; BSC chain ID is 56 and all CAKE reads use pinned block `0x78d...` (exact block is recorded in the raw artifact). All seven reconciliation checks passed.
- Corrected unit-test workflow: https://github.com/olegsh247-stack/Crypto/actions/runs/38062050577 — **success**, including compile and unit tests.
- No evidence was written to Neon; no scores, scenarios, monitoring events or published snapshots were created.
- No deployment or merge to `main` occurred.

## Next step

Next, use the verified capture as evidence input for the separate semantic/source-quality review. Do not promote SOL/CAKE to published product signals until historical SOL activity/provider evidence and CAKE same-window supply/economics reconciliation are completed. Keep publication and database writes out of the capture workflow.
