# Metric-to-Endpoint Contract Detail — 2026-10-19

## Purpose and boundary

This is the next, read-only pass after the [semantic parity audit](METRIC-ENDPOINT-SEMANTIC-PARITY-AUDIT-2026-10-19.md). It records what the current registry and source catalog actually establish for individual metrics, what remains unproven, and the safe order of remediation.

This is a repository-contract review, not a live provider capture. No metric/source priority was changed, no production database was accessed, and no scenario was evaluated. BTC remains `not_evaluable`.

## Contract-by-contract disposition

| Metric | Declared unit / freshness | Current registry source | Concrete catalog contract | Disposition |
|---|---|---|---|---|
| `market.spot_price` | `USD/BTC`, 1h | `market.kraken` | Kraken Trades `XBTUSD`; trade-event timestamps; individual trades; raw response and trade identity required | **Candidate, not yet sufficient by itself.** Runtime ticker code uses a separate Kraken Ticker endpoint and labels retrieval time as timestamp; that is not the same contract as the registry's Trades URL. Keep the runtime ticker response separate from a metric observation until the selected endpoint and aggregation rule are aligned. |
| `security.hashrate` | `EH/s`, 48h | `network.primary`, `analytics` | Mempool `/api/v1/mining/hashrate/1w`; declared unit only after verified normalization; bucket/window semantics unconfirmed | **Review only.** Confirm returned field, whether value is instantaneous or a weekly estimate, unit conversion, bucket timestamp and methodology before accepting. |
| `security.difficulty` | `difficulty`, 3d | `network.primary` | No metric-specific concrete endpoint/field contract found | **Missing contract.** Define endpoint, exact field, retarget timestamp/height, and numeric representation. |
| `security.block_time` | `minutes`, 48h | `network.primary` | No metric-specific concrete endpoint/field contract found | **Missing contract.** Define sample window and formula; distinguish target interval from observed mean block interval. |
| `security.fee_subsidy_ratio` | `ratio`, deferred/on-demand | `network.primary` | Catalog's Mempool block-fees endpoint is a fee-rate series and explicitly not mapped to a metric; not the realized-fees/subsidy calculation | **Use derived-metric contract.** For a defined block window: sum realized transaction fees in sats divided by sum block subsidies in sats; record start/end heights, block hashes, reorg/boundary checks, window length and calculation version. Do not use projected fee-rate estimates as realized fees. |
| `monetary.circulating_supply` | `BTC`, 48h | `network.primary` | No accepted metric-specific endpoint/field contract; existing candidate cumulative issuance is not proven economic circulating supply | **Semantics unresolved.** Decide whether the product means scheduled issuance, UTXO-set supply, or economic circulating supply. Do not relabel the Mempool cumulative issuance candidate as circulating supply. |
| `monetary.max_supply` | `BTC`, 1y | `protocol.primary` | Bitcoin Developer Reference is documentation-only | **Static protocol constant.** Store the value and protocol/methodology version as a reviewed constant; documentation URL alone is not a machine-readable observation endpoint. |
| `monetary.block_subsidy` | `BTC/block`, 48h | `protocol.primary`, `network.primary` | No per-metric RPC/endpoint contract | **Define height-aware calculation.** Subsidy depends on block height/halving schedule; record height, block hash, protocol rule/version and exact BTC/sats units. |
| `network.transaction_count` | `transactions/day`, 48h | `network.primary` | No metric-specific concrete endpoint/field contract found | **Missing contract.** Define calendar/session boundaries and whether counts are confirmed transactions or mempool transactions. |
| `network.mempool_size` | `MB`, 1h | `network.primary` | No metric-specific endpoint/field contract found | **Missing contract.** Select count/size endpoint and specify bytes/vbytes/MB conversion and observation timestamp. |
| `network.utxo_count` | `UTXOs`, 48h | `network.primary` | No metric-specific concrete endpoint/field contract found | **Missing contract.** Identify source field or reproducible node/RPC calculation and chain height. |
| `network.lightning_capacity` | `BTC`, 48h | `lightning.primary` | Catalog currently documents the API only; no verified capture call site/endpoint contract | **Documentation is not evidence of ingestion.** Define endpoint, capacity semantics, timestamp, unit and runtime use before acceptance. |
| `institutional.etf_net_flow` | `USD million/day`, 36h | `institutional.primary` | Farside all-data page; reporting/session date; publication time and revision/finality still need explicit evidence | **Research candidate with existing acceptance gates.** Preserve the reporting date separately from observation/publication/retrieval time; require complete fund rows, payload hash, revision/finality decision and snapshot/archive evidence. |
| `institutional.etf_btc_holdings` | `BTC`, 36h | `institutional.primary` | Farside endpoint reports `USD million/day` flow, not holdings in BTC | **Incompatible mapping.** Do not use the flow endpoint for holdings. A source-priority correction requires explicit approval and a verified holdings endpoint. |
| `institutional.corporate_btc_holdings` | `BTC`, 48h | `institutional.primary`, `analytics` | Farside is flow-only; Glassnode entry is generic provider landing page with no metric-specific contract | **Unverified.** Need entity universe, holdings definition, endpoint/field, time semantics, licensing and revision policy. |
| `market.futures_open_interest` | `USD`, 6h | `market.primary` | Placeholder; no selected concrete endpoint | **Blocked.** Provider, instrument universe, USD conversion, aggregation and timestamp contract required. |
| `market.perpetual_funding` | `percent/8h`, 6h | `market.primary` | Placeholder; no selected concrete endpoint | **Blocked.** Specify venues/contracts, signed-rate convention, interval normalization and aggregation. |
| `market.options_open_interest` | `USD`, 6h | `market.primary` | Placeholder; no selected concrete endpoint | **Blocked.** Specify venues, expiry universe, notional convention and USD valuation timestamp. |
| `macro.dxy` | `index`, 48h | none (optional) | Yahoo Finance was technically retrievable for manual research, but automated-access rights and source-time/freshness contract are unresolved | **Optional/manual research only.** Do not promote or automate Yahoo collection absent permission clearance; do not substitute a different dollar index. |
| `macro.us_10y_yield` | `percent`, 48h | `macro.primary` | Placeholder; no selected concrete endpoint | **Blocked.** Select a source and specify observation/session date, yield definition, publication time and unit scale. |
| `technology.bitcoin_core_version` | `version`, 30d | `protocol.primary` | Documentation-only source | **Needs release metadata contract.** Use official release artifact/tag or node `getnetworkinfo` output with retrieval time and binary/build identity; a general docs page is insufficient. |
| `technology.critical_vulnerability` | `boolean/event`, until reviewed | `protocol.primary` | Documentation-only source | **Needs reviewed event contract.** Define authoritative advisory/release sources, affected-version matching, review state and evidence links; a bare boolean is not a reproducible source observation. |

## Runtime consistency finding: BTC spot

The metric registry approves the Kraken public Trades URL and requires the actual trade timestamp to be retained. The API's current ticker helper separately calls Kraken's Ticker endpoint and assigns `new Date().toISOString()` as the timestamp. That timestamp is retrieval time, not provider trade time. The API helper also has alternate Binance ticker fallbacks, while the metric registry's canonical BTC readiness source is Kraken `XBTUSD` in `USD/BTC`.

This does not prove the UI ticker is incorrect for display; it does mean the UI ticker response must not be silently treated as a canonical readiness observation. A future code change should make the display-ticker contract and the readiness-observation contract explicit and separate, with a test that rejects retrieval time masquerading as provider observation time.

## Safe remediation order

1. **No source-priority changes yet.** First write metric-specific contracts and tests; source eligibility is a separate reviewed decision.
2. **Close the BTC required inputs first:** Kraken trade selection/aggregation and actual trade time; ETF reporting-date/publication/revision/finality; then hashrate window semantics and realized fee/subsidy calculation.
3. **Resolve circulating-supply meaning** before choosing an endpoint or mapping the existing issuance candidate.
4. **Separate documentation facts from data observations** for protocol constants, Core version and vulnerability events.
5. **Leave placeholders blocked** until an actual provider endpoint and field-level contract exist.
6. Keep DXY optional and manual until automated access terms are cleared.

## Verification and safety status

- Registry, catalog and runtime files were inspected at branch head `de2767ac4e57e237260786ba3967925963a64f5f`.
- VPS API Build Rehearsal [#39284388890](https://github.com/olegsh247-stack/Crypto/actions/runs/39284388890) completed successfully for the journal commit. This verifies the repository build/rehearsal, not live data correctness or a deployed VPS.
- No live provider capture, production database access/write, ingestion, source-priority change, scenario evaluation/state change, deployment or merge was performed.
- BTC remains `not_evaluable`.
