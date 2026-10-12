# BTC Public Source Capture Review — 2026-10-13

**Mode:** read-only public-source capture; no database connection and no observation/scenario writes.  
**Workflow:** [BTC Public Source Staging #8](https://github.com/olegsh247-stack/Crypto/actions/runs/38311619595)  
**Artifact:** `btc-public-source-review`, ID `11774921851`, SHA-256 `57fc13f80b94b3f851bffdf6d3a6e8b830fd8863fafb599868829c8a3039503e`. GitHub artifact retention expires 2026-10-19; retain this summary because the artifact is temporary.  
**Capture time:** 2026-10-12 21:35:59–21:36:00 UTC.

## Captured source results

| Input | Capture result | Parsed observation/context | Acceptance |
|---|---|---|---|
| BTC spot — Kraken public Trades API | HTTP 200; 1,000 trade rows | Latest trade: 82,801.10 USD/BTC at 2026-10-12 21:35:56.915 UTC. Source pair key `XXBTZUSD`; raw-body SHA-256 `a690b26dce2ce2720b936761d9bd236ee3ba66b254e40184c788ef21d15faa40`. | **Candidate only.** Price and source timestamp parse cleanly. Confirm the canonical source-registry ID, allowed capture method, and freshness threshold before promoting to an observation. |
| Hashrate — mempool.space `/api/v1/mining/hashrate/1w` | HTTP 200; 7 series points | Latest series timestamp 2026-10-12 00:00 UTC; average hashrate 1,028.594876 EH/s after converting the raw value from hashes/s. Response also exposes `currentHashrate` (~993.863 EH/s), which is a different field/semantics. Raw-body SHA-256 `e5e0bca349c7a595b52e62adb778e402aa5efe1d2101c93b913f9725955796d1`. | **Candidate only.** Keep the daily series value separate from currentHashrate. Confirm bucket/window semantics and metric definition before accepting. |
| Block fee series — mempool.space `/api/v1/mining/blocks/fees/1w` | HTTP 200; 825 records | Records contain `avgHeight`, `timestamp`, `avgFees`, and `USD`. Latest record: height 971141, timestamp 2026-10-12 21:29:38 UTC, `avgFees=4060857`, `USD=82997`. Raw-body SHA-256 `1431324fd7eeea3b3ebd332f07fc521ac78da5c3ae15cbbce32aec070209f555`. | **Raw input only.** The capture does not establish fee units, whether `avgFees` means per-block fee totals or a rolling statistic, nor the matching subsidy denominator. Do not calculate or insert a fee/subsidy ratio yet. |
| Farside BTC ETF flow page | HTTP 403 | Response body and hash retained in the artifact; raw-body SHA-256 `3cc6f1ac463de8053f1f17e3885e2ba9ac7d185e677389a1f664c38ebb408b5a`. | **Unavailable in this runner.** No flow value inferred. A failed page capture is not zero flow. |
| TFTC ETF flow JSON mirror | HTTP 200; 705 daily rows | `updatedThrough=2026-10-09`; unit declared as USD; license CC BY 4.0; attribution TFTC. Declared lineage combines SoSoValue daily aggregates/per-fund flows, Farside per-fund history through mid-2026, and mempool.space BTC price marks around 21:00 UTC. Raw-body SHA-256 `dd2168e41af07cbeab4bc263bf3cbfd88152a5312486f20d4a6fa3ba3230b87e`. | **Unapproved candidate, not canonical input.** It is not current enough for the 36-hour ETF freshness rule at capture time, and its mixed lineage, revisions, publication-time semantics and treatment of zero-valued per-fund fields still need review. |

## Input-quality conclusions

1. The public capture confirms that Kraken and mempool endpoints returned parseable responses at capture time. It does **not** itself register or persist these values in PostgreSQL.
2. The hashrate parser now supports both a root array and object-wrapped `hashrates`/`data` series; the capture is still raw review evidence, not acceptance of the metric definition.
3. Fee data must be reconciled to a documented unit and matching subsidy denominator over a fixed UTC/block window. No ratio has been computed.
4. Farside remains inaccessible to the runner (403). TFTC is a candidate mirror only; its most recent reported day is 2026-10-09 and must not be treated as fresh merely because the JSON endpoint returns HTTP 200.
5. DXY remains missing. Do not substitute a broad USD index or a provider quote without a reviewed source and timestamp contract.
6. The older source-database audit's nine duplicate logical-key groups / eighteen rows remain a separate data-cleanup issue. This capture does not authorize deletion or rewriting of any database rows.

## Next step

Review the raw artifact against the canonical source/metric registry and document a per-input acceptance decision: source identity, unit, observation time, retrieval time, aggregation window, revision semantics, freshness rule and duplicate key. Only accepted inputs may be used in a deterministic offline BTC scenario evaluation. Keep scenario-state and monitoring-event persistence disabled.

No production database was accessed; no observations, snapshots, scenario states or monitoring events were written.
