# BTC Public-Source Refresh — 2026-10-13

**Mode:** read-only source capture; no database connection or product-state writes.  
**Workflow:** [BTC Block Window Validation #38422001808](https://github.com/olegsh247-stack/Crypto/actions/runs/38422001808)  
**Artifact:** [btc-public-source-review-38422001808](https://github.com/olegsh247-stack/Crypto/actions/runs/38422001808/artifacts/11826249171)  
**Artifact SHA-256:** `b3ca27c5157d3ab016d2566377ce8d892263beb4f2723832a366a8a77981eda5`  
**Capture time:** 2026-10-13 15:26:13–15:26:14 UTC.

The five raw response bodies were independently checked against the manifest's SHA-256 values. This is a source-review artifact, not a production ingestion batch.

## 1. Candidate inputs

| Metric | Current capture | Freshness / semantics decision |
|---|---|---|
| `market.spot_price` | Kraken `XBTUSD` pair key `XXBTZUSD`; latest trade **83,588.10 USD/BTC** at `2026-10-13T15:26:08.170Z`; retrieved `15:26:13.228Z`; 1,000 trades returned; HTTP 200. | Very fresh at capture time and uses the selected repository source ID `market.kraken`. **Candidate only** until the live production source registry/adapter is independently verified. |
| `security.hashrate` | Mempool `/api/v1/mining/hashrate/1w`; latest series timestamp `2026-10-13T00:00:00Z`; raw value converted to **999.342299 EH/s**; 7 series points; HTTP 200. | Within the registry's 48-hour age budget at capture time. **Candidate only**: verify whether each timestamp labels the daily bucket start/end and document the estimator/smoothing semantics. Do not substitute `currentHashrate` for this dated series. |
| `security.fee_subsidy_ratio` | Mempool `/api/v1/mining/blocks/fees/1w`; HTTP 200; 845 records. | Raw series captured, but the row-level `avgFees` field is not used in the calculation. The accepted candidate ratio comes from block-level `extras.totalFees` and expected subsidy over a matched UTC-day block set, documented separately. |
| `institutional.etf_net_flow` | Farside page HTTP 200; TFTC JSON HTTP 200 and `updatedThrough=2026-10-12`. Farside's 12 Oct total is **−65.4 USD million**; TFTC reports **−65.401 USD million** for the same date. | Latest completed session candidate reconciles to Farside's displayed rounding. The 13 Oct Farside row has dashes and a displayed 0.0; this is **not** a confirmed zero. Farside exposes the session date but this capture does not establish its publication time, so the 36-hour freshness gate cannot yet be certified from the date alone. TFTC remains an unapproved mirror, not a canonical fallback. |
| `macro.dxy` | No capture in this workflow. | **Blocked**: select a specific DXY source, endpoint and daily-close/observation-time convention. Do not substitute a broad trade-weighted USD index or mix vendor quotes. |

## 2. ETF-flow reconciliation

Farside's 12 Oct 2026 row reports `(65.4)` USD million, and TFTC's daily aggregate is `-65,401,000.00000001` USD. The values agree to Farside's one-decimal display precision. The source page also has a 13 Oct row with dashes across the fund columns and a displayed `0.0` total; that row must remain unreported/placeholder, not numeric zero.

The recent capture contains at least five completed sessions (5–9 Oct and 12 Oct). However, the source's exact publication time, the canonical interpretation of the row date as `observed_at`, and the 36-hour freshness rule's evaluation convention still require an explicit contract. Do not promote the candidate merely because the page was retrieved successfully.

## 3. Cross-input decision

- **Spot price:** candidate current; source registration and adapter must be confirmed in the target runtime.
- **Hashrate:** candidate current; bucket convention and estimator method remain to be documented.
- **Fee/subsidy:** the completed UTC-day candidate for 12 Oct is `0.0060225208`; see [BTC UTC-Day Candidate Review](BTC-UTC-DAY-CANDIDATE-REVIEW-2026-10-13.md). It is not an accepted observation.
- **ETF flows:** 12 Oct candidate reconciles across Farside/TFTC to displayed precision, but exact observation/publication-time semantics and 36-hour freshness remain unresolved. No fallback priority change is authorized.
- **DXY:** still blocked.

## 4. Required next gate

Create a review-only staging manifest and dry-run diff for the candidate spot price, hashrate, daily fee/subsidy ratio, and ETF-flow row. The diff must identify the canonical metric/source IDs, units, logical observation key, source and retrieval timestamps, freshness calculation, raw-body hash, and whether the candidate is an insert, no-op, conflict, or rejected. This remains a no-write review. Resolve the DXY source contract separately.

No production database was accessed. No observation, historical row, registry, monitoring event, scenario state, score, probability or published snapshot was changed. BTC remains `not_evaluable`.
