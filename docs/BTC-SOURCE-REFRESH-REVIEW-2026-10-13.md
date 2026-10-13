# BTC Source Refresh and Candidate Manifest Review — 2026-10-13

**Capture workflow:** [BTC Public Source Staging #14](https://github.com/olegsh247-stack/Crypto/actions/runs/38352861553)  
**Capture commit:** `56e1d0782b3e59325a732941e29a63be53cc1e03`  
**Artifact:** `btc-public-source-review`, ID `11791756806`, SHA-256 `962047e48981cc3def5e9ffd49bca72c9716c9af96d49ff16c64f010c196d8e6`, retention through 2026-10-20.  
**Mode:** read-only public source capture. No production database access, observation writes, historical cleanup, scenario persistence, monitoring writes, or probability changes.

## Capture findings

| Input | New capture evidence | Freshness / definition gate | Decision |
|---|---|---|---|
| BTC spot price — Kraken | 83,501.30 USD/BTC; source trade time 2026-10-13 05:43:34.168 UTC; retrieved 05:43:36.457 UTC; raw payload SHA-256 `adce3dfa5f59f5723ea6207f9b92e92cd77d74ff6c57b38f1621a1e463d04f0a` | Age 2 seconds at capture; 1-hour gate **PASS** at capture time | **Candidate only.** Still needs source-registry/runtime-adapter confirmation and logical-key comparison before ingestion. |
| Hashrate — Mempool.space | Latest daily point 999.342298838022 EH/s at 2026-10-13 00:00 UTC; retrieved 05:43:36.882 UTC; 7 series points; raw payload SHA-256 `fe47b1bb6dd96cb5507cde7f945fcb3493f7e0a3ca9ee2a856024ce89e8c6bde` | Age 20,324 seconds (about 5h 39m); 48-hour gate **PASS** at capture time | **Candidate only.** Bucket/aggregation semantics still need acceptance; do not treat this as instantaneous hashrate. |
| Fee/subsidy — Mempool.space | 835 records from each of the fees and rewards endpoints; both series match on all 835 `avgHeight` values. Latest matched point: height 971198 at 2026-10-13 05:29:20 UTC; `avgFees=929,443`, `avgRewards=313,429,443`, candidate denominator `312,500,000`, diagnostic ratio `0.0029742176`. Fees payload SHA-256 `97a18a42b555fb96f645f2a53674acc8331a68f8474fbd28cc9637f29df29c7b`; rewards payload SHA-256 `777c561ca223fada12e39eb73ad7b7c8c94f246354a5bbfefab8c2f4956695d8` | **Blocked.** Six paired timestamps differ and derived reward-minus-fee values vary across the series. The latest point's arithmetic is diagnostic only and does not validate the historical series. | Raw evidence only; do not ingest or use as a scenario factor. |
| ETF flows — Farside | HTTP 403 at 05:38:45.026 UTC; response hash `2e8f98d028b1e992517e4d35d55f0eec9eb91ce1354c06df71fb892bb0d22f63` | No usable flow observation returned | Blocked. HTTP failure is not zero flow. |
| ETF flows — TFTC mirror | HTTP 200; 705 rows; `updatedThrough=2026-10-09`; retrieved 05:42:22.010 UTC; raw payload SHA-256 `dd2168e41af07cbeab4bc263bf3cbfd88152a5312486f20d4a6fa3ba3230b87e` | Too old for the 36-hour latest-row gate; mixed lineage/revision semantics unresolved | Unapproved fallback candidate only; do not promote it silently. |
| DXY | No capture | No approved specific DXY endpoint and daily-close timestamp convention | Blocked; no substitute value used. |

## Candidate manifest and duplicate comparison

The companion file [`BTC-CANDIDATE-MANIFEST-2026-10-13.json`](./data-review/BTC-CANDIDATE-MANIFEST-2026-10-13.json) records the candidates and decisions in machine-readable form. **Zero candidates are approved for production ingestion.**

A fresh database dry-run diff was not produced: that requires a separately authorized read-only comparison against current production observation rows and source registry. The previous audit's nine exact-duplicate groups / eighteen rows remain historical classification evidence only; this capture neither rechecks nor modifies those rows. No UPDATE/DELETE or ingestion was attempted.

## Next action

1. Resolve source semantics and revise the fee/subsidy approach as specified in the addendum below; do not infer individual-block facts from averaged time-series rows.
2. Select a specific DXY source and timestamp convention.
3. Resolve ETF canonical-source access/lineage without turning unavailable or missing values into zero.
4. Confirm the Kraken and hashrate candidates against the repository's source/metric contracts, then run a separately approved read-only production registry/duplicate audit and candidate-vs-existing logical-key dry-run diff.
5. Only after the required scenario inputs pass acceptance, run the BTC scenario deterministically in offline/read-only mode. No scenario or monitoring writes are authorized by this review.

## Endpoint contract references

- [Mempool REST API — GET Block Fees](https://mempool.space/docs/api/rest#get-block-fees) describes average total fees for blocks in a trailing time period, ordered oldest to newest.
- [Mempool REST API — GET Block Rewards](https://mempool.space/docs/api/rest#get-block-rewards) describes average block rewards for blocks in a trailing time period, ordered oldest to newest.
- [Mempool REST API — GET Block (v1)](https://mempool.space/docs/api/rest#get-block-v1) and [GET Blocks (v1)](https://mempool.space/docs/api/rest#get-blocks-v1) are the documented paths to inspect individual block records and their mining details.
- [ICE U.S. Dollar Index product information](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices) identifies ICE as the DXY administrator and lists licensed delivery channels; it does not establish a free public API endpoint.
- [TFTC ETF flow tracker and methodology](https://www.tftc.io/bitcoin-etf-flows) states that the latest session can be revised and older days corrected automatically. This is useful lineage evidence, but does not cure the current freshness failure or make TFTC canonical automatically.

## Review addendum — endpoint semantics and next implementation

The public Mempool REST contract confirms that both `/mining/blocks/fees/1w` and `/mining/blocks/rewards/1w` return **averaged series**, not a guaranteed one-to-one series of individual blocks. Equal `avgHeight` values alone therefore do not prove that the two values represent the same block set or time window. The six timestamp mismatches and seven distinct derived subsidy values are sufficient to keep the series blocked.

**Decision:** do not repair this series by joining on height alone, interpolating timestamps, or accepting the latest point because its arithmetic happens to equal the current subsidy. For the next read-only implementation, capture a bounded sample of individual block records using the documented block endpoints, preserve each block height/hash/timestamp/fees/reward and raw response hash, and verify the exact field names and units against the actual payload before defining a per-block fee-to-subsidy calculation. If the intended metric is instead a rolling average, define the exact block window and compute it from validated individual-block records; version that calculation separately from the raw observations. Do not change the production metric registry or ingest any candidate until this sample passes review.

**DXY decision:** ICE is the authoritative administrator, but the public product documentation lists licensed delivery channels rather than a confirmed free API. Keep DXY blocked until a usable, permitted feed and its timestamp convention are explicitly established. Do not substitute a broad trade-weighted USD series and label it DXY.

**Current acceptance status:** Kraken and hashrate pass only their capture-time freshness checks; they remain candidates pending source/runtime mapping and duplicate dry-run. Fee/subsidy, ETF flow, and DXY remain blocked. This review authorizes no production writes.


## Individual-block sample review — 2026-10-13

The latest read-only staging artifact `btc-public-source-review` (run [#17](https://github.com/olegsh247-stack/Crypto/actions/runs/38353759368), artifact SHA-256 `b9f5d31c26eeed7acbe6aca8dfd0178e04cc42c7a637a96c52c246755f511a37`) contains the raw response from `GET /api/v1/blocks/{tip-height}`. The captured sample has 15 consecutive blocks, heights **971185–971199**, with a raw response SHA-256 of `c6936234d6b3af353a9283b7dbee6c75769a1834dfe362c3a6569eb87d325b38`.

### Field and arithmetic check

- Individual-block fields are present as `extras.totalFees` and `extras.reward`.
- In all 15 rows, `extras.reward - extras.totalFees = 312,500,000` raw units, matching the current 3.125 BTC subsidy when the raw unit is interpreted as satoshis.
- The reproducible candidate formula is **fee-to-subsidy ratio = totalFees / (reward − totalFees)**. This avoids mixing the total coinbase reward (subsidy plus fees) into the subsidy denominator.
- Across this bounded sample, the diagnostic ratios range from **0.0010287968** to **0.0074590496** (about 0.103%–0.746%). These are per-block sample diagnostics, not accepted production factor values.

### Decision

**Sample arithmetic check: PASS (15/15); production acceptance: NOT APPROVED.** The raw fields and arithmetic are internally consistent, and the staging script now emits the normalized per-block fields, derived subsidy, ratio, sample validation status and provenance hash. This does not by itself replace confirmation of the endpoint's field/unit contract, testing across a larger historical range and edge cases, matching the repository's metric/source registry, or a read-only duplicate dry-run. No production data or scenario state was changed.

### Next gate

1. Run the updated staging workflow and verify the new summary reports 15 valid rows and zero subsidy mismatches.
2. Inspect repository metric/source contracts for `security.fee_subsidy_ratio`, `security.hashrate`, and `market.spot_price`; resolve source IDs, units, and stored-method mapping.
3. Keep ETF flow and DXY blocked until auditable, fresh sources and timestamp conventions are accepted.
4. Only after the input contract is accepted, run the separately scoped read-only duplicate comparison; then execute one deterministic, offline/read-only BTC scenario.


## Registry contract cross-check — 2026-10-13

A read-only repository comparison found a source-ID mismatch that must be resolved before accepting the Kraken candidate:

- `data/CryptoDataModel/registry/source-registry.json` uses **`market.kraken`**.
- `infrastructure/postgres/migrations/2026-10-11-market-data-sources.sql` registers **`market_kraken`**.
- `data/CryptoDataModel/registry/metric-registry.json` assigns `market.spot_price` to `market.kraken`, but the current registry does not spell out the exact normalization method for trade price to the product's point-in-time spot-price observation.
- `security.fee_subsidy_ratio` is declared as a daily ratio in the JSON metric registry; its exact calculation window and aggregation method are not defined there. The later SQL migration describes a documented rolling block window, so those contracts need to be reconciled explicitly.

**Decision:** do not silently alias source IDs or write new observations. First reconcile JSON registry, SQL registry, and runtime adapter to one canonical source identifier; specify whether the ratio is per-block or a rolling average and define its exact window. The individual-block sample proves the candidate arithmetic for 15 blocks only; it does not authorize production ingestion. This registry check used repository files only; no production database was queried or changed.


## Wider individual-block validation gate — implementation update

The staging capture script now includes a second, wider read-only check over the latest **150 individual blocks**. It requests ten consecutive 15-block pages, retains each raw page and SHA-256, normalizes records by exact block height, rejects conflicting hashes for the same height, and reports:

- missing heights and duplicate block hashes;
- invalid/missing hash, timestamp, fee, or reward fields;
- timestamps that are not monotonic by block height;
- deviations from the current 312,500,000-satoshi subsidy;
- a diagnostic window ratio calculated as `sum(totalFees) / sum(reward - totalFees)` over the same validated blocks.

The normalized rows are written to the staging artifact as `individual-block-window.json`. The wider check is a **required staging gate**: a failed or incomplete validation makes the capture workflow fail. Its ratio remains candidate-only and is not written to the database or scenario.

**Execution status at this commit:** implementation committed as `982fc772b708f98485e6c68a84a928dfbd5cad06`; the wider capture has **not yet been executed**, so no 150-block result is claimed. The earlier 15-block check remains the only executed individual-block sample (15/15 arithmetic checks passed). The next verification must run the staging workflow against this commit and review the raw page hashes, full height coverage, field checks and ratio before proceeding. If any block is missing or the subsidy check fails, do not use the aggregate candidate.

This still does not resolve the repository contract mismatch: the exact rolling window/frequency and source-ID/runtime mapping must be reconciled before production acceptance. ETF flow and DXY remain blocked. No production database access or writes are authorized.

## Staging gate artifact observability update

Commit `d33d100cf19b02aa84ee15020ace26b59baade70` updates the capture script so the final staging gate is recorded inside `manifest.json` **before** the artifact upload step. The recorded gate combines required source captures, at least one successful ETF page capture, and the 150-block validation result; the script exit code is derived from that same recorded status. This avoids relying only on console output when reviewing an artifact.

**Execution evidence is not yet confirmed here.** The code change is pushed to the PR branch, but the new staging run and its uploaded artifact still need to be retrieved and inspected before the 150-block gate can be called passed. This observability change does not approve any production ingestion or scenario input.

## First 150-block staging execution — failure found and corrected

The first execution of the wider gate was [BTC Public Source Staging #20](https://github.com/olegsh247-stack/Crypto/actions/runs/38356997453). It captured all ten 15-block pages and produced an artifact, but the required gate correctly failed because the implementation required timestamps to be monotonic by block height. That assumption is invalid for Bitcoin: consensus timestamps may move backwards relative to the immediately preceding block.

The artifact reported 150 unique blocks, no missing heights, no invalid field rows, no subsidy mismatches and no duplicate hashes; the failure was the timestamp check. The candidate aggregate ratio in that failed artifact is diagnostic only and is not accepted.

Commit `9261e934b0e5a914c54b938598c67ee03dfb495f` corrects the check: each block with 11 predecessors is checked against the median timestamp of those preceding 11 blocks, and all block timestamps are checked against Bitcoin's two-hour future-time bound. This is more faithful to Bitcoin consensus than strict monotonicity.

**Status:** correction pushed; a fresh staging run and artifact review are still required. No production ingestion or scenario use is approved.

### Follow-up execution note

The immediate rerun [BTC Public Source Staging #22](https://github.com/olegsh247-stack/Crypto/actions/runs/38357193802) failed before source capture because the timestamp-consensus field insertion contained literal escaped newlines, producing a JavaScript syntax error. This was corrected in commit `f794b046f50743d6f7535b6bde7485f08e3a00da`. The next staging run must confirm both syntax and the corrected consensus-time gate; no 150-block pass is claimed yet.

## Wider individual-block staging result — PASS candidate only

The corrected capture completed successfully in [BTC Public Source Staging #23](https://github.com/olegsh247-stack/Crypto/actions/runs/38357233407), commit `f794b046f50743d6f7535b6bde7485f08e3a00da`. The uploaded artifact is [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38357233407/artifacts/11792344913), SHA-256 `9b3019625b2f150e7c80cbe533dafbf0dec431e73d09954a4ea242edfbe649f0`.

- 150 unique blocks validated, heights **971053–971202**.
- Missing heights: **0**; invalid field rows: **0**; subsidy mismatches: **0**; duplicate hashes: **0**.
- Timestamp consensus checks: median-time-past violations **0**; future timestamps beyond the two-hour bound **0**.
- Candidate aggregate: total fees `295212981` raw units; derived subsidy total `46875000000` raw units; `sum(totalFees) / sum(reward - totalFees) = 0.006297876928` (about **0.630%**).

**Decision:** the wider staging validation is **PASS — CANDIDATE ONLY**. It confirms the capture and internal checks over this 150-block window, not the final production metric contract. Raw-unit interpretation remains provisional; the JSON/SQL/runtime source-ID mismatch and fee/subsidy frequency/window contract still need reconciliation. No production ingestion, database duplicate dry-run, or scenario write has occurred.

## BTC metric/source contract reconciliation — proposal, not canonical acceptance

### Source IDs are use-specific today

- `market.kraken` is the source ID in the JSON metric/source registries and in `infrastructure/postgres/seed-v1.sql` for the point-in-time BTC/USD Trades observation candidate.
- `market_kraken` is inserted by `2026-10-11-market-data-sources.sql` and used by the daily-candle worker for its Kraken OHLC fallback. That is a separate candle-ingestion path, not the same observation contract.
- Do not silently alias or rename either identifier. The spot-price observation path must be explicitly mapped to `market.kraken`; the daily candle adapter can continue to use `market_kraken` until a separate reviewed consolidation is chosen. This is a source-domain distinction to document, not evidence that the BTC candidate has already been registered in a live database.

### Proposed fee/subsidy metric contract

The JSON registry currently specifies `frequency: 1d` and a 48-hour freshness window, but does not define the formula or block window. The SQL metric description says “documented rolling block window” without specifying its size. The staged evidence supports the following proposal for review:

- **Cadence:** one candidate point per day; freshness remains 48 hours.
- **Window:** latest **144 individual blocks** (roughly one day in block count, not a fixed 24-hour clock window).
- **Formula:** `sum(extras.totalFees) / sum(extras.reward - extras.totalFees)` across exactly the same 144 blocks.
- **Timestamp contract:** `period_start` is the first metric-window block timestamp, `period_end` and `observed_at` are the final metric-window block timestamp; include first/last block heights and method version `mempool-fee-subsidy-144-block-v1` in provenance.
- **Validation:** capture 165 blocks total — 144 metric-window blocks plus 21 earlier context blocks — so the 11-block median-time-past rule can be checked for every block in the metric window. The extra context is not included in the ratio.
- **Unit:** the raw fields are internally consistent with satoshis in the successful sample, but the unit remains provisional until the source contract is confirmed.

This is a **proposal only**. The canonical metric registry has not been changed and the candidate ratio is not approved for production ingestion. The new 165-block staging run must pass before the proposed 144-block ratio is added to the review artifact.

Authoritative endpoint references: [Mempool REST API — GET Blocks (v1)](https://mempool.space/docs/api/rest#get-blocks-v1) describes individual block records with mining details in `extras`; [Bitcoin Developer Reference — block chain](https://developer.bitcoin.org/reference/block_chain.html) documents the previous-11-block median timestamp and two-hour future-time constraints.

### 165-block / 144-block proposal run and output-label correction

Staging run [#25](https://github.com/olegsh247-stack/Crypto/actions/runs/38357391827) passed the 165-block integrity gate: 165 unique blocks, no missing heights, no invalid fields, no subsidy mismatches or duplicate hashes, and zero timestamp-consensus violations. The candidate 144-block window was heights 971059–971202 with ratio `0.0063708074222222225` (about 0.637%). Artifact [ID 11793366272](https://github.com/olegsh247-stack/Crypto/actions/runs/38357391827/artifacts/11793366272), SHA-256 `833f9db6314e76770117b2882306824949df533f239c3fd7c0ea6532b3f98102`.

Review found the validation-window aggregate fields still carried a `150_blocks` suffix after the window was expanded to 165. The values were computed from the 165-block window, but the labels were misleading. Commit `2e69b81e1d9248529468f8d17342b10e9e07371a` corrects those field names; a fresh staging run is required before treating the latest artifact as final evidence.

### Final 165-block staging verification — labels corrected

The rerun [BTC Public Source Staging #26](https://github.com/olegsh247-stack/Crypto/actions/runs/38357451316) completed successfully on commit `2e69b81e1d9248529468f8d17342b10e9e07371a`. Artifact: [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38357451316/artifacts/11793430771), SHA-256 `d92a6925ee0d99aae485535094e8ef5c40092d7cf324e3c7f695998fd1c6925e`.

- Validation window: **165/165** unique blocks, heights **971038–971202**.
- Missing heights, invalid field rows, subsidy mismatches, duplicate hashes: **0** each.
- Median-time-past violations and future timestamps beyond the two-hour bound: **0** each.
- Validation-window diagnostic (165 blocks): `307743303 / 51562500000 = 0.0059683549672727276`.
- Proposed metric window (latest 144 blocks, heights **971059–971202**): fees `286686334`, derived subsidy `45000000000`, ratio **0.0063708074222222225** (about **0.6371%**).

The artifact labels now explicitly distinguish the 165-block validation aggregate from the proposed 144-block metric. Staging status is **PASS — CANDIDATE ONLY**. The 144-block window remains a proposal until the metric contract is accepted; no canonical registry change or production write was made.


## VPS-only build and isolated database rehearsal — PASS

The current BTC source-capture branch also passed [VPS API Build Rehearsal #581](https://github.com/olegsh247-stack/Crypto/actions/runs/38357502720) on commit `ca5946f95b3cc96dd93ed1dc5c2865a07696fcea`.

All 26 job steps completed successfully, including the VPS-only repository check, shared runtime/worker/API builds, API response contract tests, Compose network-boundary validation, clean PostgreSQL bootstrap from repository migrations, canonical BTC input-registry verification, read-only BTC provenance audit, duplicate/idempotency reconciliation rehearsal, PostgreSQL backup/restore, API contract E2E, mutation-contract E2E, worker-ingestion E2E, offline invariants, BTC research-evidence/snapshot-lineage E2E, persisted history/candle finalization E2E, and admin-boundary E2E.

This is isolated CI/rehearsal evidence, not a production deployment or production database audit. It does not resolve the provisional raw-unit contract or approve the 144-block candidate for ingestion. No production observations, scenario states, monitoring events, or published probabilities were changed.


## Kraken source-registry alignment — 2026-10-13

A repository-only cross-check confirmed that the JSON metric registry points `market.spot_price` to `market.kraken`, while the existing SQL source entry `market_kraken` belongs to the separate daily OHLC fallback. These IDs must not be silently aliased because they represent different source paths and observation semantics.

A new idempotent migration, `infrastructure/postgres/migrations/2026-10-13-btc-kraken-trade-source.sql`, now registers `market.kraken` explicitly for the public Kraken Trades endpoint. It documents the XBTUSD request, raw-pair/provenance retention, and XBT-to-BTC normalization boundary. It does not insert observations or rename/remove `market_kraken`.

**Scope and status:** repository metadata alignment prepared; migration has not been applied to production, and no production database was accessed. The runtime adapter/logical-key comparison remains a separate acceptance gate. This change does not approve the captured price for ingestion.
