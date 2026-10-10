# Crypto — Master Roadmap to Project Readiness

**As of:** 2026-10-10  
**Canonical branch:** `fix/product-contour-v1-contracts`  
**Purpose:** One ordered plan from the current evidence-closure stage to a verifiably complete Crypto product. This document supersedes scattered informal continuation plans; detailed technical specs and task issues remain authoritative for their own domains.

## 1. Current position — do not restart completed work

### Architecture
- The target architecture is decided: Caddy + Node.js API + separate Node.js worker + PostgreSQL 16.
- This is a documented target, not a deployed environment. No VPS has been purchased/provisioned.
- Cloudflare Workers and Neon remain the current operational environment until an explicitly approved cutover.
- Hosting decision: [Hosting Architecture Decision](HOSTING-ARCHITECTURE-DECISION-2026-10-10.md).

### Product contour and live API
- The product journey and data responsibilities are documented in [Product Contour v1](PRODUCT-CONTOUR-V1.md).
- Live API E2E run #4 passed for the tested endpoint and payload contract: [run #4](https://github.com/olegsh247-stack/Crypto/actions/runs/38061014765).
- This proves API contract availability for BTC, ETH, SOL and CAKE, not equal research completeness.
- Captured payloads show BTC and ETH populated; SOL and CAKE have `not_started`, 0 research blocks, 0 factors, 0 scores, 0 scenarios, 0 signals and 0 evidence.
- Browser-level verification of the deployed Web dashboard is still pending; the deployed Web URL must first be established from repository/deployment configuration.

### ETH observation pipeline
- Work is tracked in [Issue #5](https://github.com/olegsh247-stack/Crypto/issues/5).
- Read-only capture and disposable-PostgreSQL rehearsal have passed on the recorded PR head. A 578-row candidate artifact reconciled the net-flow equation across 48/48 sampled intervals; an independent RPC cross-check matched base-fee and blob-fee burn exactly for one complete 957-block interval.
- This is strong partial evidence, not universal validation of every interval/provider. Four capture gaps remain; independent source checks need expansion; numeric monitoring thresholds are not approved.
- No production writes/migrations, signal evaluations, scenario-state publication, deployment or merge have occurred.

### SOL / CAKE evidence
- Work is tracked in [Issue #7](https://github.com/olegsh247-stack/Crypto/issues/7).
- CAKE issuer reports for June–September 2026 sum to **-7,402,733 CAKE** in reported net-mint arithmetic. This is not yet a verified on-chain `totalSupply()` delta or independently confirmed circulating-supply change.
- SDA is identified as a candidate SOL data path, but provider access/terms and credentials are not established; no historical SOL daily series has yet been captured.
- Read-only RPC capture run [#38038663458](https://github.com/olegsh247-stack/Crypto/actions/runs/38038663458) succeeded and captured SOL supply at finalized slot 455,192,578 and CAKE at BSC block 126,797,363; see [Verified RPC Capture](../research/assets/SOL-CAKE-VERIFIED-RPC-CAPTURE-2026-10-10.md). A follow-up capture [#38063027247](https://github.com/olegsh247-stack/Crypto/actions/runs/38063027247) and evidence-envelope tests [#38063038809](https://github.com/olegsh247-stack/Crypto/actions/runs/38063038809) passed after adding a same-block legacy CAKE Pool balance read. At BSC block 126,850,417, raw `totalSupply()` was 5,543,692,995.751051, burn-address balance 5,168,552,286.608597, subtraction 375,140,709.142454, and legacy pool balance 13,393,669.234197 CAKE. See [CAKE Legacy Pool Reconciliation](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md). The large raw `totalSupply()` is not an error by itself; the unresolved question is which legacy-pool balance is permanently irrecoverable under the canonical circulating-supply methodology. Do not subtract the entire pool balance by assumption.
- SOL and CAKE remain unpublished research drafts. Do not fabricate scores, factors, scenarios, signals or evidence.

## 2. Ordered roadmap and exit criteria

### Stage 0 — Plan and execution control (active)
- [x] Record current state and non-negotiable constraints.
- [x] Establish this file as the canonical roadmap.
- [ ] Keep one GitHub issue per substantive workstream and link evidence/commits/run IDs back here.
- [ ] At each stage closure, update this roadmap with status, evidence, remaining gaps and next stage.

**Exit:** next work is selected by priority and measurable acceptance criteria, not by ad hoc edits.

### Stage 1 — Close the ETH numeric evidence vertical slice (Issue #5)
1. Re-read the source contracts and canonical schema before code or migration changes.
2. Independently cross-check issuance, burn, queue and supply-flow fields; expand beyond the one verified RPC interval.
3. Resolve and document the four remaining capture gaps. For unavailable metrics, record a reasoned blocker or a reviewed alternative source—never synthesize data.
4. Keep L2 TVS/activity, validator/client concentration, comparable alternative-L1 share and official milestone status as distinct gaps unless independently sourced.
5. Confirm the idempotent capture/ingestion contract, provenance, Worker/VPS parity and signal timestamp semantics on disposable PostgreSQL.
6. Define monitoring thresholds only when source definition, window, freshness, minimum sample and rationale are defensible. No arbitrary thresholds.
7. Reconcile candidate metrics to the published ETH snapshot and record what can/cannot support each signal.

**Exit:** reproducible dated numeric observations with source lineage; independent checks and caveats documented; replay is idempotent; signal evaluation tests prove values/timestamps only change on actual successful evaluation. Do not publish a scenario state until separately reviewed and explicitly authorized.

### Stage 2 — Capture and verify historical SOL activity (Issue #7)
1. Select a provider/API adapter only after checking provider terms, credentials, rate limits, historical depth and coverage.
2. If SDA requires an unavailable credential or unsuitable terms, record the blocker and assess an alternative approved source; do not scrape the dashboard as a substitute for an approved data path.
3. Capture a UTC-aligned 30-day daily series of successful non-vote transactions, failed non-vote transactions, transaction fees, fee payers, and application/program activity where attribution is verified.
4. Keep vote/non-vote counts separate; distinguish transactions, instructions, fee payers and human users.
5. Preserve provider, retrieval time, time/slot boundaries, raw artifact/hash, parser version, missingness and coverage.
6. Independently reconcile a sample against raw chain/RPC data and document deviations.

**Exit:** complete or explicitly qualified historical series, reproducible parser, independent reconciliation and reviewed source terms. No claims of unique human users or validator-client diversity from unsuitable proxies.

### Stage 3 — Reconcile CAKE on-chain supply and issuer reports (Issue #7)
1. Confirm current CAKE contract and tokenomics methodology, including the 400M policy hard cap, dead address, and legacy CAKE Pool address `0x45c54210128a065de780C4B0Df3d16664f7f859e`.
2. Resolve the methodology difference: official docs say permanently locked legacy-pool CAKE is burned, while the observed pool balance is 13.394M and the official 2025 article cites about 5.29M delegated/locked at that time. Do not treat the entire current pool balance as irrecoverable without contract-state/transaction evidence.
3. Select explicit start/end blocks for June–September reporting windows; preserve block number/hash and UTC timestamp.
4. Capture `totalSupply()`, dead-address balance, verified locked balances, legacy pool state and relevant `Transfer` mint/burn events at both pinned blocks; inspect pool migration/withdrawal history and avoid double-counting.
5. Reconcile monthly issuer-reported mint/burn arithmetic to on-chain event data, documenting weekly-burn prorations and definition differences.
6. Compare independent sources and clearly separate contract total supply, burned/locked amounts and estimated circulating supply.

**Exit:** a reproducible month-by-month reconciliation with explained residuals. The -7,402,733 figure remains issuer-reported arithmetic unless block-pinned contract data independently supports a stronger claim.

### Stage 4 — Evidence quality and asset research completeness
1. Freeze metric definitions, units, windows, source quality, source timestamps and methodology version for each usable signal.
2. Build SOL and CAKE Deep Research only from verified evidence; keep all 15 canonical blocks with explicit complete/partial/not-applicable/missing states.
3. Populate domains/factors/scores only where definitions and evidence justify them. Every claim must trace to evidence; every score must retain method/version and explanation.
4. Ensure the published snapshot remains separate from new candidate research until reviewed.
5. Refresh volatile external metrics at capture time; do not reuse stale values as current.

**Exit:** research completeness is honest and auditable; no fabricated rows, sources, scores or inferred publication states. BTC/ETH baselines remain intact unless a reviewed change is explicitly authorized.

### Stage 5 — Product Contour contract and user journey audit
Use [Product Contour v1](PRODUCT-CONTOUR-V1.md) and [API/UI contract audit](PRODUCT-CONTOUR-V1-CONTRACT-AUDIT.md).
1. Resolve the known P1 consistency risks: factor/score lineage to the latest published snapshot; scenario-state/definition lineage; shared progress semantics for completed vs resolved blocks.
2. Resolve or explicitly define evidence-linked source registry semantics and API/Web freshness contract.
3. Verify navigation/traceability from Dashboard → domain/factor/score/scenario → monitoring/evidence → source/Deep Research.
4. Verify honest empty, partial, stale and not-applicable states; no UI-invented lifecycle/freshness.
5. Keep visual redesign frozen until functional contracts and data correctness are accepted.

**Exit:** every product section maps to real API fields and valid snapshot lineage; missing information is shown honestly; no stale/new research is mixed.

### Stage 6 — Live product and browser verification
1. Identify the actual deployed Web URL from repository/deployment configuration, without guessing.
2. Run the no-deploy live API E2E suite and inspect run logs/artifacts.
3. Verify Dashboard and Deep Research in a real browser for BTC, ETH, SOL and CAKE; inspect console/network failures, loading/error/empty states and navigation.
4. Verify registry, market history, observations, evidence and monitoring data remain consistent across repeated reads.
5. If browser access or the URL is unavailable, record this as an open gate—not as a pass.

**Exit:** API E2E and browser/runtime checks pass on the candidate version, with reproducible evidence for all four assets.

### Stage 7 — Product release gate
1. Run repository tests, type/lint/build checks and Product Contour Gate.
2. Run VPS API Build Rehearsal and data-capture validation against disposable PostgreSQL; do not point CI at production for migrations or writes.
3. Validate canonical contracts, source/evidence lineage, idempotency, repeat requests, missing-data behavior and Worker/VPS parity.
4. Review every open blocker and attach run links, commit SHA and artifact references.
5. Keep the PR unmerged until the gate is green and the change set is reviewed.

**Exit:** all required checks pass on the exact candidate commit; no unresolved P0/P1 correctness or security issue; documented release decision exists. Passing a gate is necessary but does not authorize production publication or deployment by itself.

### Stage 8 — Hosting migration readiness and cutover (separate authorization)
The target is documented, but this stage is **not active until the product gates are met and the user explicitly authorizes server provisioning/cutover**.
1. Complete account-level Cloudflare and Neon inventory; repository inspection alone cannot prove account settings.
2. Provision VPS only after approval; configure Docker Compose, PostgreSQL 16, Node API, separate worker, Caddy, admin auth and backups.
3. Prove backup/restore, migration rehearsal, schema/row-count/registry/history/research/observation/signal/API parity.
4. Test security, HTTPS, monitoring, rollback and worker scheduling.
5. Perform controlled final sync and traffic cutover only after explicit authorization; retain old environment for an agreed rollback window.
6. Decommission Cloudflare/Neon only after stable operation and verified rollback window.

**Exit:** the VPS version passes the same product and data gates, restore and rollback are proven, and old services are decommissioned only after explicit approval.

## 3. Definition of “project ready”

Crypto is considered **product-ready** only when all of the following are evidenced on the same candidate version:
- [ ] The canonical journey Home → Assets → Dashboard → Deep Research → Domains → Factors → Scores → Scenarios → Monitoring → Evidence works.
- [ ] BTC and ETH remain valid baselines; SOL and CAKE research is either evidence-complete or explicitly withheld with a documented blocker—not falsely marked complete.
- [ ] Every published numeric observation has metric definition, unit, source, source URL, observed time/window, methodology and reproducible lineage.
- [ ] Scores, scenarios and monitoring are explainable, snapshot-consistent and not inferred from data arrival alone.
- [ ] API contracts, browser checks, build/test suite and Product Contour Gate pass.
- [ ] No P0/P1 data-integrity, provenance, auth or runtime defect remains.
- [ ] Docs, issue state, test runs, commit SHA and release decision agree.

**Hosting-migrated** is a separate status requiring all Stage 8 criteria. Do not conflate “product-ready on current hosting” with “VPS cutover complete.”

## 4. Non-negotiable safety and scope rules

- Work on `fix/product-contour-v1-contracts`; do not merge to `main` without explicit approval.
- Read the relevant docs/contracts before each implementation change.
- No production DB writes or migrations, deployment, secret/DNS changes, scenario publication, or VPS provisioning without explicit approval.
- No new schema migration unless current canonical schema cannot represent the requirement and disposable-DB rehearsal proves the migration.
- No fabricated evidence, metrics, scores, thresholds, monitoring events or scenario states.
- Do not use public dashboard scraping as a replacement for approved source access.
- No visual redesign until the functional/data contracts and acceptance gates are complete.
- Every meaningful code change must include tests, documentation, a commit and verified GitHub Actions evidence where applicable.
- Deliver work in coherent blocks, not repeated one-line micro-edits. Report what changed, evidence, blockers and the next concrete step.

## 5. Reusable continuation prompt

> Continue the Crypto project from the current state in `docs/PROJECT-READINESS-ROADMAP-2026-10-10.md` on branch `fix/product-contour-v1-contracts`. First inspect the latest commit, open PR/issues, relevant source contracts, and latest GitHub Actions runs; do not assume this document's run status is still current. Follow the roadmap in order. The immediate work is Stage 1 (ETH evidence gaps) and Stages 2–3 (SOL historical activity and CAKE on-chain reconciliation), using Issues #5 and #7. Before code changes, read the relevant docs and inspect existing scripts/workflows to avoid duplicate tooling. Use read-only captures and disposable PostgreSQL for rehearsals. Record source, timestamps/windows, hashes, methodology, independent checks and unresolved gaps. Update the roadmap and linked issue with commit/run/artifact evidence after each coherent block. Do not fabricate data or scores; do not write production DB, run production migrations, deploy, merge to main, publish scenario states, provision VPS or decommission Cloudflare/Neon without explicit authorization. When evidence stages close, continue through product-contract audit, browser verification, release gate and only then hosting cutover readiness. Work in complete blocks and report verified outcomes plus the next action.
