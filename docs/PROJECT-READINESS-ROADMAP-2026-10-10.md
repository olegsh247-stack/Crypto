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


## Progress update — CAKE legacy pool contract-state investigation (2026-10-10)

- Inspected the verified BscScan source/ABI for the official legacy CakePool address and the official PancakeSwap integration documentation. The contract exposes totalLockedAmount, totalShares, available, balanceOf, and per-user userInfo lock fields, plus withdraw, withdrawAll and withdrawByAmount.
- This changes the working hypothesis: the pool is not simply an inaccessible burn wallet. It has user-level lock accounting and withdrawal paths, and BscScan shows withdrawal activity. Therefore the entire observed pool balance must not be subtracted from circulating supply as permanently irrecoverable.
- Added the source-backed finding and interpretation guardrails to [CAKE Legacy Pool Reconciliation](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md) in commit [c544476](https://github.com/olegsh247-stack/Crypto/commit/c54447643bd1cb7787c73890955e6b0607cc6f98).
- Source references: [verified CakePool contract](https://bscscan.com/address/0x45c54210128a065de780c4b0df3d16664f7f859e), [official PancakeSwap Cake Pool documentation](https://docs.pancakeswap.finance/welcome-to-pancakeswap/how-to-guides/v3-v2-migration/migration/cake-syrup-pool).
- **Not yet closed:** no new pinned RPC capture of pool accounting getters has been taken, no user-level lock expiry reconstruction has been completed, and no final circulating-supply formula/value is approved. The next implementation block is to add same-block read-only pool-state fields to the existing capture, with tests, then reconcile pool state and events at aligned month-end blocks.


## Progress update — CAKE pool getter capture implemented (pending CI evidence)

- Extended the read-only capture to query CakePool `totalLockedAmount()`, `totalShares()`, `available()`, and `balanceOf()` at the same pinned BSC block as token supply and balance observations. Selectors are pinned to Keccak-256 function signatures and covered by a unit test, avoiding any runtime dependency on RPC `web3_sha3` support.
- Extended normalization with separate pool-state observations and added fixture assertions to preserve the distinction between CAKE balances and pool-share units. No pool getter is automatically treated as burned supply.
- Added a normalizer unit-test step to the Research On-chain Capture workflow. **Pending:** this code has not yet been validated by the next GitHub Actions run; the actual capture and test results still need to be checked before accepting the new fields.
- The current CAKE methodology remains unresolved until a successful same-block capture and event/lock-state reconciliation are reviewed.


## CI verification checkpoint — 2026-10-10 18:10 UTC

- The Research On-chain Capture workflow is now triggered by commits to its unit-test files as well as the capture/normalizer scripts. This was committed as `87401ed5c0f5535b617239c6a661906caaddc9ca`.
- GitHub Actions run [#38074692658](https://github.com/olegsh247-stack/Crypto/actions/runs/38074692658) started on that commit. At the latest check, Python setup, syntax check, and the evidence-normalizer unit tests had all passed. The live read-only SOL + CAKE RPC capture step was still running; normalization, envelope validation, and artifact upload had not yet completed.
- **No pass is declared yet.** Do not accept the new CakePool getter values until the capture step finishes, the evidence envelope validates, and the artifact is inspected. If the public RPC calls hang/fail, review the job log and distinguish endpoint reliability from code/schema errors.


## CI result and verified on-chain values — 2026-10-10

- Research capture run [#38074692658](https://github.com/olegsh247-stack/Crypto/actions/runs/38074692658) **passed** end-to-end, including syntax check, normalizer tests, read-only RPC capture, normalization, evidence-envelope validation and artifact upload. Artifact name: `sol-cake-rpc-capture-38074692658`.
- At BSC block 126,873,367: CAKE total supply 5,543,692,995.751051; dead-address balance 5,168,552,286.608597; pool token balance and `available()` 13,393,658.357722; `totalLockedAmount()` 10,643,456.465049; `totalShares()` 190,019,229.888360; CakePool `balanceOf()` 203,751,102.981434. Raw capture SHA-256: `56e6997159580821126388613bc644209e661a3636b42a217bc5a08ade459da5`.
- The verified CakePool source defines `available()` as direct CAKE held by the pool and `balanceOf()` as direct CAKE plus `totalBoostDebt`. Therefore the apparent 190.357M CAKE difference is pool accounting debt, not a second wallet balance. Added a follow-up capture of `totalBoostDebt()` (selector `0xe73008bc`) with tests so the identity can be reconciled directly.
- SOL `getSupply` at finalized context slot 455,349,175 returned circulating 588,848,618.770245 SOL and non-circulating 46,750,203.227394 SOL; combined 635,598,821.997639 SOL. These are point-in-time values only.
- **Still open:** canonical CAKE circulating-supply treatment and historical mint/burn reconciliation; SOL historical activity series; Product Contour v1 full readiness audit. No production writes, migration, publication, merge or VPS cutover.


## CakePool accounting identity verified — 2026-10-10

- Latest read-only capture [#38075073697](https://github.com/olegsh247-stack/Crypto/actions/runs/38075073697) and paired evidence-envelope test run [#38075073757](https://github.com/olegsh247-stack/Crypto/actions/runs/38075073757) both passed.
- At pinned BSC block 126,874,122: `available()` = 13,393,658.357722 CAKE; `totalBoostDebt()` = 190,357,444.623712 CAKE; `balanceOf()` = 203,751,102.981434 CAKE. The identity `balanceOf() = available() + totalBoostDebt()` reconciles exactly (difference 0). `totalLockedAmount()` = 10,643,456.465049 CAKE; `totalShares()` = 190,019,229.888360 shares.
- Raw capture SHA-256: `8f1cad22f097456c76b59ef20ba47f6ffc70d70011d377a685167887ebc1d9f3`; normalized envelope SHA-256: `09c1a3734b1adf6473ace77b5162d23d15e2e5ac809bd06eb2981707b344f58a`.
- Added a normalizer invariant and negative test: inconsistent pool accounting is rejected. Full details are in [CAKE Legacy Pool Reconciliation](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md).
- **Closed:** read-only capture of current CakePool accounting getters and the source-backed balance identity. **Still open:** determining which, if any, pool-related amount belongs excluded from circulating supply; historical month-boundary supply/lock/event reconciliation; SOL historical activity; Product Contour v1 readiness.


## Next implementation block — CAKE historical month-boundary state capture

- Added a separate read-only workflow/script to select the last BSC block at or before each UTC boundary (2026-06-01, 2026-07-01, 2026-08-01, 2026-09-01, 2026-10-01) using binary search over block timestamps.
- Each selected block captures total supply, dead-address balance, legacy CakePool token balance, `available()`, `totalBoostDebt()`, `balanceOf()`, `totalLockedAmount()`, and `totalShares()`, preserving block number/hash/timestamp and boundary offset. No values are subtracted from circulating supply by this script.
- Unit tests cover timestamp parsing and at-or-before block selection. The new workflow must pass before these historical snapshots are treated as evidence; the next work is to inspect the artifact, then add bounded event history if the public RPC supports it.


## Historical CAKE snapshot blocker — 2026-10-10

- First historical capture run [#38075181911](https://github.com/olegsh247-stack/Crypto/actions/runs/38075181911): unit tests and boundary search passed, but all historical contract-state reads failed with RPC `-32000 missing trie node`. The selected block numbers are usable only as timestamp locators; no historical supply/pool state was obtained.
- The default `bsc-dataseed.binance.org` endpoint is therefore not archive-capable for these June–October 2026 state queries. Do not interpolate from current values or mark historical observations complete.
- Switched only the historical-capture workflow to the public BSC endpoint `https://bsc-rpc.publicnode.com` for a second read-only attempt. Run [#38075243537](https://github.com/olegsh247-stack/Crypto/actions/runs/38075243537) is pending/in progress; its artifact must be inspected before accepting any historical result. The ordinary current-state capture workflow remains unchanged.


## CAKE historical state series verified — 2026-10-10

- Historical capture [#38075610742](https://github.com/olegsh247-stack/Crypto/actions/runs/38075610742) passed using `https://rpc-bnb.blockmachine.io`, with verified block hashes and exact UTC boundary timestamps. Current-state capture [#38075606119](https://github.com/olegsh247-stack/Crypto/actions/runs/38075606119) and evidence-envelope tests [#38075557661](https://github.com/olegsh247-stack/Crypto/actions/runs/38075557661) also passed.
- Captured June 1, July 1, August 1, September 1, and October 1, 2026 state for CAKE total supply, dead address, pool balance, token-contract self balance, 0x1/0x2 balances, and CakePool getters. No RPC errors. Raw historical artifact SHA-256: `bc1a4a271f3b66d6bd1cd8ff9599795c9594b8ee36580e307359ac868980a2c6`.
- The tracker-style candidate `totalSupply - dead - token-contract self - 0x1 - 0x2` was 343.681M CAKE on June 1, 341.569M July 1, 340.458M August 1, 338.229M September 1, and 348.059M October 1. This is a comparison candidate, not the approved canonical metric.
- Boundary deltas show candidate net changes of −2.112M, −1.111M, −2.229M, then +9.830M CAKE. This differs from the issuer-reported June–September net-mint arithmetic of −7.403M CAKE. Treat it as an open reconciliation gap until exact issuer periods, burn-recognition timing, transfer/mint/burn events, and weekly-burn proration are aligned.
- CakePool accounting identity `balanceOf() = available() + totalBoostDebt()` reconciles exactly at every boundary. Full report: [CAKE Legacy Pool Reconciliation](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md).
- **Closed:** historical month-boundary state capture and source-backed current/historical pool accounting. **Next:** event-level mint/burn reconciliation. Still open: canonical circulating-supply formula, SOL historical activity series, Product Contour v1 readiness. No production writes, migration, publication, merge or VPS cutover.


## Issuer report reconciliation values recorded — 2026-10-10

- Recorded the official June–September 2026 CAKE reports and their stated mint/burn/net-mint values in the [CAKE reconciliation report](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md). Reported net mint totals −7,402,733 CAKE; the June report's displayed mint and burn arithmetic differs from its stated net by one CAKE, retained as reported.
- The issuer explicitly excludes mints that directly contribute to burning and prorates weekly burns across adjacent months. Raw `totalSupply()` deltas therefore cannot be interpreted as ordinary emission without separating mint-to-dead transfers.
- The historical state candidate changed +4,378,618.189132 CAKE between June 1 and October 1, while the four issuer reports sum to −7,402,733 CAKE. This is a reconciliation target, not a conclusion, because windows/methodology differ and September has a large sign discrepancy.
- Next block: event-level attribution of mint-to-dead versus regular emission mints and transfers into/out of the dead address, followed by checks against the official burn proration. No canonical circulating-supply value or scores may use the candidate until that bridge closes.


## CAKE event-level reconciliation — implementation added, result pending

- Added a read-only Transfer-log capture script and dedicated GitHub Actions workflow on `fix/product-contour-v1-contracts`: [capture script](../scripts/research/capture_cake_transfer_logs.py), [workflow](../.github/workflows/cake-transfer-log-reconciliation.yml).
- The script covers the four pinned boundary intervals from June 1 through October 1, 2026, includes logs from start block + 1 through the end block, and separately reports dead-address inflows, outflows, and mint-to-dead transfers.
- **Do not mark CAKE event reconciliation complete yet.** The workflow must finish and its raw artifact must be checked for RPC completeness and per-interval balance-delta identities before issuer figures can be reconciled.
- Product release, CAKE circulating-supply approval, publication, score/scenario creation, production writes and VPS cutover remain blocked pending their respective acceptance criteria and approvals.


## CAKE event-log provider blocker — 2026-10-10

- The read-only capture script and manual workflow are in the branch, but no event artifact has been produced. Attempts against Blockmachine (range limit, then HTTP 429), official BSC dataseed (`-32005 limit exceeded`), dRPC (HTTP 400), and PublicNode (HTTP 403) did not return usable logs. See the detailed run-by-run record in [CAKE Legacy Pool Reconciliation](../research/assets/CAKE-LEGACY-POOL-RECONCILIATION-2026-10-10.md).
- The independent burn tracker states that its historical log series uses an authenticated NodeReal archive node. The next valid CAKE attempt therefore needs an authorized archive/indexer endpoint; do not keep cycling unauthenticated endpoints or treat failures as zero events.
- The workflow is now manual-only until a suitable provider is configured, avoiding a repeated failing check on every push. CAKE event reconciliation and circulating-supply approval remain open.
- **Priority handoff:** return to Stage 1, ETH numeric evidence, as ordered in this roadmap. Do not publish CAKE/SOL research or jump to broad data expansion.
