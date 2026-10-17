# Source Catalog / Runtime / Capture / SQL Seed Parity Report — 2026-10-17

## Scope and evidence

Read-only inspection of branch `fix/btc-readiness-registry-runtime-source`, source-catalog validator, canonical registries, capture and candidate-preparation scripts, VPS API runtime, and SQL seed. Full VPS API build/E2E run #39016053890 completed successfully on commit `ede585333fe757682bbcd2665900ab6ab736c47b`; the branch subsequently advanced with documentation/journal commit `33fe68db3bcdef6be14e65526b2ef998a8bdd9ba`. The run validates the tested code head and must not be described as running on the later docs-only commit.

## Confirmed parity

- Catalog contains 33 endpoint records; catalog IDs are unique.
- All 16 IDs from `source-registry.json` have registered catalog coverage.
- All source IDs referenced by `metric-registry.json` have catalog coverage.
- SQL seed has 16 unique source IDs; all registry IDs are present and no extra seed IDs were found.
- Explicit source IDs extracted from capture/candidate-preparation scripts have catalog records.
- Validator checks 10 runtime endpoint families, 10 capture endpoint families and 4 candidate-preparation endpoint families.
- Candidate/provisional identifiers including `market.coingecko`, `macro.yahoo_finance_candidate`, `institutional.cryptoetf_today`, and `institutional.sosovalue.candidate` remain outside metric `source_priority`.

## Remaining gaps — review before any adapter refactor

1. **The validator proves reference presence, not complete semantic parity.** Runtime checks first search for host/path text anywhere in `vps/api/src/app.ts`, then find a catalog URL matching the expected host/path. This does not prove that the actual route, fallback ordering, quote unit, timestamp semantics, or runtime use maps to that catalog record.
2. **Capture/candidate-preparation parity is endpoint-family based.** The checker verifies each listed host/path appears in the script and catalog, and separately verifies explicit source-ID strings exist somewhere in the catalog. It does not bind every individual request call to its exact catalog ID, source ID, metric ID, role, and unit. In particular, a source ID can be present in the catalog while being semantically mismatched to a request.
3. **SQL parity is one-way.** The validator proves registry IDs are in the seed and the seed has no duplicates. Current read-only comparison found no extra seed IDs, but the automated assertion does not fail if a future seed adds an ID absent from the source registry. Add a reverse-set assertion.
4. **Catalog/source registry status is not source approval.** Some registered IDs are not metric-priority IDs, and catalog roles such as `canonical_candidate` or `cross_check` do not authorize ingestion. Keep eligibility governed by the metric registry and evidence gates.
5. **Coverage lists are manually maintained in the validator.** New runtime/capture/preparation endpoints can be omitted from the expected-family arrays without detection. A later hardening pass should derive inventories from structured declarations or add an explicit completeness inventory; do not attempt a broad adapter refactor as part of this report.

No confirmed current set-level mismatch was found in the inspected registry/catalog/seed IDs. The gaps above are limitations in the strength of the automated proof, not evidence that current runtime behavior is broken.

## Next controlled step

Before changing adapters, make the checker stricter in a narrow, test-first change: (a) assert seed IDs equal registry IDs in both directions; (b) bind each capture/preparation request and each runtime fallback to an explicit catalog record/source identity; (c) add tests that fail on wrong source IDs, wrong units/quote pairs, or an unlisted endpoint. Review the diff and run the full VPS build/E2E. Then resume BTC input readiness using current evidence.

## Safety boundary

Read-only inspection only. No live source capture, production DB writes, registry or metric-priority changes, scenario evaluation/state/probability changes, deployment, or merge. BTC remains `not_evaluable`.
