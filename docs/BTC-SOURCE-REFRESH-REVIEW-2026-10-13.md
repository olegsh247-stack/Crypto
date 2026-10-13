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
| Fee/subsidy — Mempool.space | 835 records from each of the fees and rewards endpoints; both series match on all 835 `avgHeight` values. Latest matched point: height 971198 at 2026-10-13 05:29:20 UTC; `avgFees=929,443`, `avgRewards=313,429,443`, candidate denominator `312,500,000`, candidate ratio `0.0029742176`. Fees payload SHA-256 `97a18a42b555fb96f645f2a53674acc8331a68f8474fbd28cc9637f29df29c7b`; rewards payload SHA-256 `777c561ca223fada12e39eb73ad7b7c8c94f246354a5bbfefab8c2f4956695d8` | **Candidate calculation available, not accepted.** Pairing by exact `avgHeight` is possible; confirm the units/meaning of `avgFees` and `avgRewards`, bucket averaging semantics and denominator interpretation before accepting the ratio. Row count is not block count. | Raw evidence only; no ratio calculated. |
| ETF flows — Farside | HTTP 403 at 05:38:45.026 UTC; response hash `2e8f98d028b1e992517e4d35d55f0eec9eb91ce1354c06df71fb892bb0d22f63` | No usable flow observation returned | Blocked. HTTP failure is not zero flow. |
| ETF flows — TFTC mirror | HTTP 200; 705 rows; `updatedThrough=2026-10-09`; retrieved 05:42:22.010 UTC; raw payload SHA-256 `dd2168e41af07cbeab4bc263bf3cbfd88152a5312486f20d4a6fa3ba3230b87e` | Too old for the 36-hour latest-row gate; mixed lineage/revision semantics unresolved | Unapproved fallback candidate only; do not promote it silently. |
| DXY | No capture | No approved specific DXY endpoint and daily-close timestamp convention | Blocked; no substitute value used. |

## Candidate manifest and duplicate comparison

The companion file [`BTC-CANDIDATE-MANIFEST-2026-10-13.json`](./data-review/BTC-CANDIDATE-MANIFEST-2026-10-13.json) records the candidates and decisions in machine-readable form. **Zero candidates are approved for production ingestion.**

A fresh database dry-run diff was not produced: that requires a separately authorized read-only comparison against current production observation rows and source registry. The previous audit's nine exact-duplicate groups / eighteen rows remain historical classification evidence only; this capture neither rechecks nor modifies those rows. No UPDATE/DELETE or ingestion was attempted.

## Next action

1. Resolve exact Mempool endpoint semantics and define the fee/subsidy calculation from matched block-window inputs.
2. Select a specific DXY source and timestamp convention.
3. Resolve ETF canonical-source access/lineage without turning unavailable or missing values into zero.
4. Run a separately approved read-only production registry/duplicate audit, then create a candidate-vs-existing logical-key dry-run diff.
5. Only after all required inputs pass acceptance, run the BTC scenario deterministically in offline/read-only mode. No scenario or monitoring writes are authorized by this review.

## Endpoint contract references

- [Mempool REST API — GET Block Fees](https://mempool.space/docs/api/rest#get-block-fees) documents the endpoint as average total fees for blocks over a trailing time period.
- [Mempool REST API — GET Block Rewards](https://mempool.space/docs/api/rest#get-block-rewards) documents the matching average block-reward series.
- [TFTC ETF flow tracker and methodology](https://www.tftc.io/bitcoin-etf-flows) states that the latest session can be revised, older days are corrected automatically, and the published history combines SoSoValue daily aggregates with issuer/Farside history. That is useful lineage evidence, but it does not cure the current 36-hour freshness failure (latest row 9 Oct) or make TFTC canonical automatically.

The fee/reward capture is internally consistent: all 835 `avgHeight` keys matched; for the latest pair, `avgRewards - avgFees = 312,500,000` raw units, which equals the current 3.125 BTC block subsidy expressed in satoshis. This is a strong consistency check, **not final approval**: the exact raw-unit convention and the endpoint's averaging/bucket semantics still need to be recorded in the metric contract and tested against a source-defined sample before promoting the ratio.
