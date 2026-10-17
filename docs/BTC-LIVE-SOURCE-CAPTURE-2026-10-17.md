# BTC live source capture — 2026-10-17

**Capture run:** [BTC Public Source Staging (Read Only) #39023003456](https://github.com/olegsh247-stack/Crypto/actions/runs/39023003456)  
**Commit:** [3803d624c3f6e767b3f665a8ec18e8d10d53dc76](https://github.com/olegsh247-stack/Crypto/commit/3803d624c3f6e767b3f665a8ec18e8d10d53dc76)  
**Capture time:** 2026-10-17 09:56:42–09:56:45 UTC  
**Result:** read-only source capture and candidate normalization succeeded. CI validation and capture jobs both succeeded.

## BTC spot

| Field | Captured evidence |
|---|---|
| Source | Kraken public Trades API, pair XBTUSD |
| Price | **81,612.50 USD/BTC** |
| Source trade time (`observed_at`) | 2026-10-17T09:56:37.159Z |
| Retrieval time | 2026-10-17T09:56:42.077Z |
| Age at retrieval | 4.918 seconds — within the 1-hour policy |
| Response | HTTP 200 |
| Response SHA-256 | `74e6b6414f9f27861312c69b69b54735d47aeb3f657ea88dfac74a556327ea9d` |
| Candidate | `REVIEW_ONLY`, `persistable=false` |

The spot input now has real freshness/provenance evidence and passes its current freshness window. It remains a review candidate, not an ingested or scenario-approved observation.

## ETF source capture and cross-check

- Farside all-data page: HTTP 200; 14 recent rows parsed from **2026-09-29 through 2026-10-16**. The separate `/btc/` page returned HTTP 403; the all-data endpoint worked.
- TFTC JSON: HTTP 200; 709 rows; `updatedThrough=2026-10-15`; explicit CC BY 4.0 license and attribution metadata returned.
- Farside response SHA-256: `8ab4141abae990466c4a23a8407123f9429859fb6e731391ae3b2122910f19fb`.
- TFTC response SHA-256: `19a606661db3372d4552cdf0b9ab10a2b285ca70dc50401c7db66247f1003ae7`.
- Five latest overlapping trading dates are available and reconciled to a **$0.65m screening band**. This band is a diagnostic tolerance, not a source acceptance rule.

| Trading date | Farside total (USD m) | TFTC total (USD m) | TFTC − Farside (USD m) | Screening |
|---|---:|---:|---:|---|
| 2026-10-09 | 21.100 | 21.128 | +0.028 | Within band |
| 2026-10-12 | -65.400 | -65.401 | -0.001 | Within band |
| 2026-10-13 | 175.700 | 175.617 | -0.083 | Within band |
| 2026-10-14 | -261.400 | -261.462 | -0.062 | Within band |
| 2026-10-15 | 5.100 | 5.055 | -0.045 | Within band |

The historical discrepancy on **2026-10-07 remains material**: Farside reports **−$484.9m**, TFTC reports **−$487.067m**, difference **−$2.167m** (TFTC minus Farside), driven mainly by the BRRR row (**−$2.114m** difference). Do not overwrite either source with the other. The last five overlapping dates do not erase this earlier conflict.

The offline research calculation has generated `arithmetic_mean_2_sources` rows for the overlapping dates, but those rows have `OFFLINE_RESEARCH_ONLY`, no verified observation/publication timestamp, and unknown finalization. They are not canonical inputs.

## Evidence artifact

The raw responses, manifest, hashes, and normalized review-only candidates are in the temporary GitHub Actions artifact **`btc-public-source-review`**, run #39023003456, artifact ZIP SHA-256 `aa749adb9341e7f2037775c5dceb952da2ade10954cf8fca2d45f0727b737710`. GitHub reports expiry at **2026-10-24 09:56:45 UTC** (7-day retention). Artifact is for review, not a durable archive; raw payloads were not committed to Git or written to a database.

## What this capture resolves — and what it does not

**Resolved now**
- A real Kraken BTC/USD trade is captured with source event time, retrieval time, units, response hash, and freshness evidence.
- Farside and TFTC both responded in the same capture window.
- At least five recent overlapping ETF trading dates are present, with row-level comparison and an explicit material historical discrepancy.
- Source capture and normalization completed successfully in CI.

**Still required before BTC can become `evaluable`**
1. A second qualifying Farside/TFTC capture **at least 24 hours after this capture**, followed by row-level comparison against these response hashes and values. One capture cannot establish historical stability or revisions.
2. Provider publication/observation time and provider revision/finality semantics remain unexposed; the project-side repeat-capture policy is not provider-declared finality.
3. TFTC has a documented CC BY 4.0 license. Farside's source-specific rights for long-term raw-response retention/reuse are still not established. Do not move raw payloads into a durable archive without that clearance.
4. The durable private archive and independent backup/restore for real ETF evidence are not operational. The existing archive test is synthetic and does not attest a real archive.
5. Human review of the named snapshots is still required. No automatic scenario evaluation is permitted.

## Safety boundary

No production database was accessed or written. No ingestion, runtime registry/source-priority change, scenario evaluation/state/probability change, deployment, or PR merge occurred. BTC remains `not_evaluable` until the remaining real evidence gates pass.
