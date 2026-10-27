# BTC read-only recapture — 2026-10-27 08:05 UTC

**Mode:** public-source capture and offline review only. No production database access or writes.  
**Workflow:** [BTC Public Source Staging (Read Only), run 40471108936](https://github.com/olegsh247-stack/Crypto/actions/runs/40471108936)  
**Artifact:** `btc-public-source-review`, artifact ID `12718750633`.  
**Code SHA:** `8ed46df441285a5341b1d0a346bf006083bd698b`.

## Latest observations

| Input | Captured value | Provenance / interpretation |
|---|---:|---|
| BTC spot | **79,795.50 USD/BTC** | Kraken XBT/USD latest trade at 2026-10-27 08:05:19.523 UTC; retrieved 08:05:22.106 UTC. Raw response SHA-256: `7876552d26eec37cac58bf1ac7cabdf4004fc6fa3ee4fc82c8a6902747fbb2af`. |
| BTC 7-day return | **−2.199510%** | Kraken completed hourly candle close-to-close; latest closed candle close 79,662.90 USD at candle start 07:00 UTC; reference candle 7 days earlier. Raw OHLC response SHA-256: `16086f52592276a39a03c18d534974bc30bbefa3be4bedd0111aea3df4a915e6`. This is not the same calculation as current trade versus a trade exactly seven days ago. |
| BTC spot cross-checks | Binance market-data-only **79,941.97 USDT/BTC**; OKX **79,944.10 USDT/BTC** | Both captured, but denominated in USDT, not USD; not blended into canonical Kraken USD quote. Binance primary endpoint returned HTTP 451; Bybit returned HTTP 403. |
| BTC spot ETF flows | **−115.2 million USD across five sessions** | Farside priority values: 20 Oct +23.2m; 21 Oct +524.8m; 22 Oct −635.6m; 23 Oct −137.9m; 26 Oct +110.3m. Raw all-data response SHA-256: `13e13f1589ad21913a667bfdf6ceb274d40151bb1447d8fec56110014f91705e`. Farside landing page returned HTTP 403; all-data page returned HTTP 200. |
| Fees / protocol subsidy | **0.505070%** | Mempool.space, 144 blocks 973226–973369; total fees 227,281,372 sats, protocol subsidy 45,000,000,000 sats. Start/end boundary hashes and tip hash matched before/after capture. Review-only; not a directional Rule v1 input. |
| DXY | **Not included** | Optional context only. Yahoo candidate remains blocked under existing access/retention contract; exchangerate.dev is a reconstructed basket, not official ICE DXY. |
| Hashrate / protocol issuance | Captured for research | Supporting/semantic context only, not required by BTC Rule v1. Protocol-issued supply must not be mislabeled as economic circulating supply. |

## Offline rule result

The captured closed-hourly return is **−2.199510%**. The five-session Farside total is **−115.2m USD**. Under BTC Scenario Rule v1, both directional signals score 0, so the review-only output is:

- **Scenario:** `base`
- **Directional score:** 0
- **Confidence:** low
- **Readiness assessment:** `ready_for_rule_evaluation`, zero blockers under the current review gate
- Same-input recalculation: byte-identical report

This is not a published/persisted live scenario state, investment advice, or production ingestion approval.

## Remaining gates and safety

- **Still blocked for production ingestion:** ETF provider publication timestamp, revision/finality semantics, and durable retention/restore policy on future self-hosted infrastructure. The reporting session date and retrieval timestamp are known; actual provider publication time is not.
- DXY is optional and must not block BTC readiness.
- No production database access/writes, ingestion, source-priority change, scenario-state/probability/monitoring persistence, deployment, or merge.
