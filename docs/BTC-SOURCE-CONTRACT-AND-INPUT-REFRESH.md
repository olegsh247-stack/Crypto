# BTC Source Contract and Controlled Input Refresh v1

**Review date:** 2026-10-12  
**Asset:** BTC  
**Research snapshot:** \`BTC-2026-10-07-v1\`  
**Status:** source contract defined; candidate refresh reviewed; **not approved for production ingestion**  
**Safety boundary:** this document is a review artifact. It does not write observations, change historical rows, create scenario states/events, or change published probabilities.

## 1. Required observation contract

Every observation submitted for review must contain:

- \`asset_id\` = \`btc\`;
- canonical \`metric_id\` from the registry (no ad-hoc metric IDs);
- numeric value and explicit canonical unit;
- \`observed_at\` in ISO-8601 UTC, representing the actual observation time/window, not the page-fetch time;
- \`source_id\` that already exists in the \`sources\` registry and \`source_url\` using HTTPS;
- freshness status derived at ingestion time from the canonical metric registry;
- source publication/update time where available, retrieval time, method/window, revision/raw-row identity;
- idempotency key based on the metric's logical observation window, not retrieval time.

**Frequency is source-defined, not forced to a uniform polling interval.** For Kraken Trades, the observation is an individual trade and its source-provided epoch timestamp; the metric registry uses `event-driven`, while the one-hour value is a maximum accepted age, not a promise that the source emits a trade every hour or every 15 minutes. For daily series, preserve the provider's documented bucket/session semantics. Always keep `observed_at`, source publication/update time (when provided), and `retrieved_at` distinct. A successful retrieval only proves the endpoint answered; it does not make the returned observation current.

The readiness gate now also enforces the approved source identity **and endpoint URL prefix** for each metric, not merely that some source ID is registered and the URL uses HTTPS. The current BTC candidates are constrained to Kraken's public Trades endpoint, the selected Mempool.space endpoint per metric, and Farside's official BTC landing page or linked all-data page. The all-data page is the preferred capture endpoint because the GitHub runner received HTTP 200 there while `/btc/` returned HTTP 403; this is an endpoint correction within the same canonical source identity, not a source-priority change. ETF input must use `institutional.primary` (Farside) until a separately reviewed source-priority change is approved. `institutional.tftc` remains a candidate and cannot pass the canonical-source gate. DXY has no approved source ID or URL yet, so it intentionally remains blocked even if a row is recent, numeric, registered, and HTTPS; `macro.primary` is too generic to establish a DXY feed.

Do not manufacture an observation timestamp from a web page's crawl time. Do not treat missing, dash, placeholder, or unreported values as numeric zero. Preserve source payloads and review metadata so that a candidate can be reproduced.

## 2. Canonical metric contract and gates

The freshness gates below are aligned to \`data/CryptoDataModel/registry/metric-registry.json\`, rather than looser scenario-specific limits.

| Metric ID | Unit | Registry freshness window | Additional acceptance rule |
|---|---|---:|---|
| \`market.spot_price\` | \`USD/BTC\` | 1 h | One named exchange/pair and actual timestamp; never average unrelated exchange quotes into a synthetic point |
| \`security.hashrate\` | \`EH/s\` | 48 h | Store source's raw daily estimate and documented aggregation; distinguish daily estimate from rolling mean |
| \`security.fee_subsidy_ratio\` | \`ratio\` | 48 h | Value must state numerator, denominator, block/window range and calculation version; one 144-block point is context, not a validated rolling trend |
| \`macro.dxy\` | \`index\` | 48 h | One selected provider and defined daily close/time convention; reconcile materially conflicting vendor values before acceptance |
| \`institutional.etf_net_flow\` | \`USD million/day\` | 36 h | At least five distinct recent trading dates; latest source row must be valid/current; dashes or a placeholder total are not zero |

For every metric, the observation's \`unit\` must match both the required canonical unit and \`metric_definitions.default_unit\`. The source ID must be registered. Invalid latest observations block readiness; they must not be bypassed by silently falling back to older rows.

### Registry audit finding — blockers remain

The repository registry has now been inspected directly:

- `security.hashrate` and `security.fee_subsidy_ratio` point first to registered `network.primary` (Mempool.space); the exact endpoint, aggregation window and stored-method mapping still need to be confirmed.
- `institutional.etf_net_flow` still points to `institutional.primary` (Farside Investors) in the metric registry. `institutional.tftc` is registered in repository JSON and SQL seed as an unvalidated fallback candidate, but is deliberately not added to `source_priority` pending lineage, discrepancy and observation-time review. Neither source candidate has been verified in the live production `sources` table.
- `market.spot_price` points to `market.kraken` in the metric registry and the source registry. A repository audit found that `infrastructure/postgres/seed-v1.sql` had not seeded this source, so a clean database could reject Kraken observations as unregistered. The seed now includes `market.kraken` with the public Trades endpoint for `XBTUSD`; this is a repository-only correction and does not alter any deployed database. The actual production `sources` table and adapter still require independent verification. Preserve the raw trade payload and convert Kraken's returned trade epoch timestamp to UTC.
- `macro.dxy` currently points to generic `macro.primary` (Treasury/Federal Reserve/BLS) rather than a specific registered DXY data endpoint and close-time convention. This input is **blocked by source specificity**.
- Historical audit note (superseded by the 2026-10-14 scope decision): hashrate is supporting context and fee/subsidy is deferred, so neither is a mandatory first-scenario input. Their older registry freshness windows do not make them required. For ETF history, the latest observation must pass the 36-hour gate; the five-session sample is separately validated as a traceable 14-day historical series.

Kraken's BTC/USD raw trade is now staged in a review artifact with a source-provided trade timestamp, but it has not been ingested into the database. The live production registry/adapter remain unverified. No DXY vendor has been selected because its endpoint and observation-time convention remain unresolved.

## 3. Candidate refresh review — 2026-10-12

These are source-review candidates only. They have **not** been inserted into the database. The five ETF session values are also captured in the reproducible review artifact [`docs/data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json`](data-review/BTC-ETF-FLOW-STAGING-2026-10-12.json); it deliberately leaves `observed_at` null until a defensible publication/observation timestamp is confirmed.

| Metric | Candidate evidence found | Source / timestamp semantics | Decision |
|---|---|---|---|
| BTC spot price | A public ChartExchange page showed a composite BTCUSD quote on 12 Oct, but this is not the selected venue and is not an auditable raw trade record | [ChartExchange BTCUSD history](https://chartexchange.com/symbol/crypto-btcusd/historical/). The selected venue is Kraken, using the [public Trades endpoint](https://api.kraken.com/0/public/Trades?pair=XBTUSD), which returns individual trade prices and Unix timestamps. | **Hold** until a raw Kraken response is fetched and the newest trade timestamp, pair key, price, and response are recorded. Do not substitute a page timestamp. |
| US spot BTC ETF flows | Farside lists completed-session totals: 5 Oct −89.8m, 6 Oct +118.8m, 7 Oct −484.9m, 8 Oct −244.1m, 9 Oct +21.1m USD million. Sum = −678.9m across five distinct sessions. | [Farside Investors BTC ETF flows](https://farside.co.uk/btc/), page reviewed 2026-10-12. The 12 Oct row shows dashes across funds and a displayed total of 0.0; this is a placeholder/unreported session, **not a confirmed zero flow**. | **Historical candidate series only**: retain the five completed trading dates with source provenance. The current all-data capture contains confirmed reporting rows through 13 Oct 2026; 14 Oct is still an all-dash placeholder with displayed total 0.0 and must remain unreported, not zero. The latest confirmed row's actual publication/observation timestamp remains unverified, so the 36 h freshness gate cannot yet be certified; no placeholder row may be ingested. |
| Network hashrate | Satoshi Gazette's documented series gives about 961 EH/s for 9 Oct, last complete UTC day in the retrieved series; it documents three-day smoothing of mempool.space daily estimates. | [Dated mining series](https://satoshigazette.org/data/mining?end=2026-10-10&window=30) and [mempool.space API docs](https://mempool.space/docs/api/rest). | **Hold for current refresh**: source evidence is reproducible but only through 9 Oct; retrieve the raw source series through the latest complete UTC day and persist method/window. Do not relabel an estimate as instantaneous hashrate. |
| Fee/subsidy ratio | A prior source review estimated 0.0129 BTC average fees per block / 3.125 BTC subsidy = 0.004128 ratio over a recent 144-block window. | [mempool.space mining dashboard](https://mempool.space/mining). This is a short-window point, not a rolling seven-day series. | **Blocked**: obtain and calculate a consistent series with explicit window and source observations; do not pass the old point estimate as a validated trend. |
| DXY | Current vendor pages disagree: Investing.com page values around 102.21–102.42 for 12 Oct depending on localized page; Reuters reported 102.39 during the day. | [Investing.com historical DXY](https://www.investing.com/indices/usdollar-historical-data), [Reuters 12 Oct coverage](https://www.reuters.com/world/asia-pacific/dollar-stays-near-18-month-high-mideast-conflict-inflation-data-focus-2026-10-12/). | **Hold**: choose and register one provider, define the close/time convention, and retain its actual timestamp. Do not mix values from different vendors or times. |

## 4. Freshness and provenance review result

- **ETF flows:** five distinct completed dates are visible, but the latest confirmed value is 9 Oct. The 12 Oct displayed 0.0 is not a valid observation because the individual fund cells are dashes. The latest-row freshness gate must decide whether the 9 Oct record is still within 36 hours at evaluation time; never fabricate a 12 Oct zero.
- **Spot price:** Kraken is selected in the repository registry, but the live raw trade response has not yet been staged and the database source registry/adapter path still needs verification. It is not ready for production ingestion.
- **Hashrate:** dated data and methodology exist, but the series needs refreshing through the latest complete UTC day and ingestion with its aggregation method.
- **Fee/subsidy:** the existing point estimate is not enough to satisfy the required rolling-series definition.
- **DXY:** provider/time disagreement must be resolved by selecting one canonical source and observation convention.
- **Units:** expected units are \`USD/BTC\`, \`EH/s\`, \`ratio\`, \`index\`, and \`USD million/day\`. Unit validation must check both the observation and metric registry.
- **Repeated observations:** do not delete duplicate history. First export every row in each logical-key group; classify exact duplicates, revisions, conflicting values, and missing provenance. Define a deterministic winner/retention rule, preserve audit lineage, and only then propose a separate reviewed remediation.
- **Readiness:** BTC remains `not_evaluable` because the current price observation has not been accepted through the source contract, canonical DXY is unapproved, and ETF latest-row freshness/provenance plus the five-day series must pass. Hashrate and fee/subsidy are not first-scenario blockers under the 2026-10-14 scope decision.

## 4A. Read-only database audit — 2026-10-12 18:20 UTC

A read-only query was executed against the currently connected `Crypto` production branch. No rows were inserted, updated, or deleted.

| Check | Result | Interpretation |
|---|---|---|
| `market.spot_price` latest row | 81,043 USD/BTC at 2026-09-19 06:38 UTC; age 563.70 h; source `market.primary`; `STALE` | Fails the 1 h gate and does not use the selected Kraken source |
| `security.hashrate` latest row | 1,001 EH/s at 2026-09-19 00:00 UTC; age 570.33 h; `STALE` | Fails the 48 h gate |
| `security.fee_subsidy_ratio` | No observation | Fails the required-input gate |
| `macro.dxy` | No observation | Fails the required-input gate |
| `institutional.etf_net_flow` latest row | 324.6 USD million/day at 2026-09-18 00:00 UTC; age 594.33 h; `STALE` | Fails the 36 h gate |
| Source registry in the live database | `market.kraken` absent; `market.primary` remains present with no base URL | The repository seed correction has not been deployed to the database; production source registration remains unverified |
| Duplicate observation groups | 9 groups, 18 rows, 9 extra rows; all 9 groups have identical payloads and 0 conflicting groups | Exact-duplicate candidates are identified; all rows must be preserved pending a separately reviewed remediation |
| Published snapshot evidence | `BTC-2026-10-07-v1`: 15 evidence rows across 15 blocks; 0 missing registered sources, observations, or source URLs | Evidence linkage check passes for this snapshot |
| Scenario/monitoring persistence | 0 snapshot-linked scenario states; 0 BTC monitoring events; 0 monitoring signals linked to a metric or critical factor | No current persisted scenario/monitoring output was found by this query |

The nine exact-duplicate groups cover spot price, hashrate, block subsidy, circulating supply, maximum supply, and four ETF flow dates (15–18 September). This is a classification result only. No deduplication was performed.

**Current readiness: `not_evaluable`.** The source seed mismatch is corrected in GitHub only. The production database remains unchanged, and current inputs still fail freshness/completeness checks. The Kraken API page could be opened but the web retrieval returned no readable trade payload, so no current trade price or trade timestamp has been fabricated or staged.

## 4B. Raw public-source capture — 2026-10-12 18:21 UTC

A repository-controlled, read-only capture workflow now preserves source responses and a provenance manifest in a short-lived GitHub Actions artifact. It does not connect to PostgreSQL or write observations. The capture summary is retained in [`docs/data-review/BTC-PUBLIC-SOURCE-CAPTURE-2026-10-12.json`](data-review/BTC-PUBLIC-SOURCE-CAPTURE-2026-10-12.json).

- **Kraken:** latest repeat capture returned HTTP 200; newest returned `XBTUSD` trade was 82,419.60 USD/BTC at **2026-10-12 18:24:24.922 UTC**, retrieved at 18:24:27.046 UTC. Pair key `XXBTZUSD`; 1,000 trade rows returned. The timestamp comes from the exchange trade record, not page-fetch time. This is a current candidate, but it was **not ingested** because the production `sources` table did not yet contain `market.kraken`; only the repository SQL seed was corrected.
- **Hashrate:** Mempool returned HTTP 200 and seven daily series points. The latest point is timestamped 2026-10-12 00:00 UTC at 1,028.594876 EH/s; the prior point is 2026-10-11 00:00 UTC at 1,024.763229 EH/s. The payload's `currentHashrate` field (995.638072 EH/s) has no matching observation timestamp in that field. The daily series is still blocked until timestamp-to-bucket semantics and an explicit method ID are reviewed; a fresh timestamp alone is insufficient.
- **Fee/subsidy:** Mempool returned HTTP 200 with 830 rows; the newest row is timestamped 2026-10-12 18:14:47 UTC. [Mempool's REST documentation](https://mempool.space/docs/api/rest) describes this endpoint as returning average total fees for blocks in the requested time period, ordered oldest to newest, but does not establish a canonical fee unit or the subsidy denominator for this product metric. The capture does not calculate a ratio. Response row count must not be interpreted as a fixed block window without validating each row's `avgHeight`/timestamp semantics.
- **ETF flows:** Farside returned HTTP 403 from the runner. A candidate TFTC JSON mirror was captured successfully and reports data updated through 2026-10-09. Its five daily totals (USD million) are −89.897783, +118.862452, −487.067412, −244.125629, and +21.128079 for 5–9 Oct. Four are compatible with Farside's displayed one-decimal rounding; 7 Oct differs by about −$2.17m from Farside's −$484.9m. The five-session TFTC sum is −$681.100m versus Farside's displayed −$678.9m, a −$2.200m discrepancy. TFTC's stated lineage mixes SoSoValue daily aggregates with Farside issuer-history and provides only `updatedThrough` (a date), not a defensible publication timestamp. Keep this series as a reconciliation candidate, not canonical ingestion; it is stale for the 36 h gate.
- **DXY:** still blocked until a canonical accessible DXY feed and daily observation-time convention are selected.

The capture workflow run is [#38290669941](https://github.com/olegsh247-stack/Crypto/actions/runs/38290669941) and completed successfully: the required public APIs and TFTC JSON candidate were captured, while Farside's HTTP 403 was retained as a source-access blocker. Raw responses and manifest were uploaded as artifact `btc-public-source-review` (artifact ID `11766330405`, retention through 2026-10-19). The permanent summary is [`docs/data-review/BTC-PUBLIC-SOURCE-CAPTURE-2026-10-12.json`](data-review/BTC-PUBLIC-SOURCE-CAPTURE-2026-10-12.json). This is not a production ingestion run and did not modify the database.

## 5. Safe ingestion and duplicate-control procedure

1. Fetch source payloads with a retrieval timestamp and preserve the raw response or immutable review artifact.
2. Normalize into a staging manifest; no production writes during review.
3. Validate registered source, HTTPS URL, metric ID, unit, numeric value, observation timestamp, freshness and calculation window.
4. Calculate the metric-specific logical key. For ETF flows this is at minimum \`metric_id + trading_date + source_id\`; for point quotes it includes provider/pair and observation timestamp; derived rolling metrics include window and method version.
5. Compare candidate keys with all existing rows. Classify exact duplicates separately from same-key conflicting revisions. Never collapse separate source observations merely because dates match.
6. Generate a dry-run diff: insert candidates, exact duplicate/no-op candidates, conflicting keys, rejected stale/untraceable rows, and reasons. No UPDATE/DELETE by default.
7. Require review of that diff before any ingestion is executed.
8. Re-run the read-only provenance audit and readiness gate. Acceptance requires zero unresolved duplicate logical-key groups for the selected inputs and all source/unit/freshness checks passing.

## 6. Boundary before scenario evaluation

Passing the input gate only permits a **read-only, reproducible rule evaluation** after the rule and its thresholds are separately reviewed. It does not authorize a scenario-state write or monitoring-event write.

Keep the published research probabilities unchanged: Bull 30%, Base 50%, Bear 20%. Do not wire the offline directional prototype into production, and do not recalibrate probabilities in this task. Record rule version, exact input observation IDs, source URLs, UTC windows, transformations and result in a dry-run artifact only. Scenario persistence requires a separate explicit review and release.

## 7. Completion checklist

- [ ] Canonical source IDs confirmed against the repository source registry.
- [ ] Current BTC quote fetched from the selected registered exchange feed.
- [ ] Five distinct completed ETF-flow sessions staged; placeholder rows excluded; latest-row freshness checked at run time.
- [ ] Hashrate raw series refreshed through latest complete UTC day and method recorded.
- [ ] Fee/subsidy rolling series computed from documented raw observations.
- [ ] DXY provider and daily observation convention selected; discrepancies resolved.
- [ ] Staging rows pass source, unit, timestamp, freshness and numeric validation.
- [ ] Duplicate-group payloads classified; dry-run remediation reviewed; no blind historical deletion.
- [ ] Readiness passes on the reviewed candidate set.
- [ ] Reproducible scenario evaluation is run read-only only after separate rule review.
- [ ] No scenario state/event persistence and no probability changes.


## 4C. Method review — 2026-10-14 (documentation-only; no live capture)

The official Mempool REST reference documents `/api/v1/mining/hashrate/:timePeriod` only as returning network-wide hashrate and difficulty figures over a trailing period. It does not specify in that endpoint description whether each returned series timestamp denotes the beginning, end, or representative time of a daily bucket, nor the estimator/smoothing window for the stored point. The prior capture's 00:00 UTC labels are evidence of the returned labels, not proof of bucket boundaries. **Decision: do not approve a hashrate methodology ID yet.** Keep the daily input blocked until the exact response schema/implementation and the timestamp-to-observation-window mapping are documented. Do not substitute the un-timestamped `currentHashrate` field.

For `security.fee_subsidy_ratio`, the official reference describes the selected endpoint as average total fees for blocks in a trailing period, ordered oldest to newest. That description alone does not establish an auditable per-row block denominator or an observation window aligned with protocol subsidy. The 830 rows in the historical capture are not a valid block count. **Decision: no ratio calculated and no methodology approved.**

A candidate methodology to evaluate against source documentation (not approved or implemented): for a fixed, explicitly versioned window of 144 consecutive confirmed block heights, compute
`sum(transaction_fees_btc for those heights) / sum(protocol_subsidy_btc for those same heights)`.
The numerator must exclude subsidy; the denominator must be the protocol subsidy for each exact height, not total miner reward and not reward-minus-fees inferred from a provider aggregate. The raw block heights, timestamps, fees, subsidy schedule/version, window endpoints, and calculation version must be retained. This is only a proposal: before approval, verify that the selected provider's block-level payload exposes the needed fields with documented BTC units and that the full height range can be captured consistently. If not, choose a documented block-level source deliberately and review its identity/endpoint before any source-registry change. Do not use the aggregate fees endpoint as a shortcut.

No live API was queried for this review. The 2026-10-12 capture remains historical evidence only. No database was accessed or written, no observation was staged, no scenario was evaluated, and no source-priority or production setting was changed. ETF/Farside access and DXY provider selection remain independent blockers and must not be resolved by silent substitution.

Reference: [Mempool REST API documentation](https://mempool.space/docs/api/rest) (reviewed 2026-10-14).


## 4D. Upstream implementation review — 2026-10-14

Reviewed Mempool's public API documentation and current upstream implementation (`backend/src/api/mining/mining.ts`, `backend/src/repositories/HashratesRepository.ts`, `backend/src/api/mining/mining-routes.ts`, `backend/src/repositories/BlocksRepository.ts`). Source-code review only: no endpoint was called and no live payload was refreshed.

### Hashrate: timestamp semantics clarified, acceptance still blocked

The upstream implementation builds each daily hashrate point for the interval `[UTC midnight - 24 hours, UTC midnight)`; it requests Bitcoin Core's network-hashrate estimate using the number of blocks in that interval and the last block height. It stores the timestamp at the **end boundary** (UTC midnight). The public response groups daily points by UTC-day timestamp and returns `timestamp` and `avgHashrate`; with one point per day, the label denotes the UTC midnight boundary ending the represented day. Therefore a label `2026-10-12T00:00:00Z` represents the preceding UTC day, 2026-10-11, rather than the day beginning at that timestamp. The response's separate `currentHashrate` is estimated over the most recent 1008 blocks and must not be substituted for the daily series.

This resolves the source-code interpretation of the timestamp convention. It does **not** yet authorize ingestion: the public service's deployed version has not been pinned to the reviewed upstream implementation, and the captured value remains historical. Keep the metric blocked until endpoint/deployment parity is verified and the current observation passes freshness. Preserve both the source timestamp and the derived interval `period_start`/`period_end` in UTC; don't store the end-boundary timestamp as though it were the day start.

### Fee endpoint: row semantics clarified

The upstream implementation of `/api/v1/mining/blocks/fees/:timePeriod` computes `AVG(fees)`, `AVG(height)`, and `AVG(blockTimestamp)` grouped into fixed-duration time buckets. Each returned row is an **aggregate bucket**, not a block; `avgHeight` is an average height and cannot be treated as a precise endpoint for a block range. The historical 830 rows therefore do not mean 830 blocks, and the last 144 rows do not mean the last 144 blocks. The endpoint is unsuitable as a direct numerator for a block-count-based fee/subsidy ratio.

A better candidate to inspect next is Mempool's `/api/v1/mining/reward-stats/144`: upstream code selects the most recent 144 non-stale block rows and returns their minimum/maximum heights plus summed `reward` and `fees`. Before adopting it, verify the public response schema and units, confirm `reward` means total coinbase reward including fees in the deployed version, check that the selected heights are consecutive/canonical and handle reorgs, and document the exact denominator. No ratio has been calculated and no method ID has been approved.

**Disposition (historical source research):** these data-quality questions matter only if hashrate is later promoted to a scenario input or fee/subsidy research is resumed; they do not block the first BTC scenario under the 2026-10-14 scope decision. No ratio has been calculated and no method ID has been approved.


## 4E. Reward-stats candidate review — 2026-10-14 (source-code only)

Reviewed the upstream implementation of `BlocksRepository.$getBlockStats(blockCount)`, called by `/api/v1/mining/reward-stats/:blockCount`. It selects rows where `stale = 0`, orders by height descending, limits the selection to the requested count, then returns `startBlock = MIN(height)`, `endBlock = MAX(height)`, `totalReward = SUM(reward)`, `totalFee = SUM(fees)`, and `totalTx = SUM(tx_count)`.

This is a better-structured candidate than the time-bucketed fees endpoint, but it is **not accepted**. The query returns only min/max heights, not the complete selected height list, and does not itself prove the requested rows are consecutive or that the public deployment matches the reviewed source. The REST documentation describes reward stats generally but does not specify numeric units or enough field semantics to independently certify `totalReward` as a BTC-denominated total coinbase reward. The dashboard's human-readable BTC display is not a unit contract for this API payload.

Before approval, verify deployed-version parity; capture and validate the actual public response schema only in a separately authorized capture step; establish units for both sums; prove the selected height set is consecutive and canonical (or use a block-level approach that makes this auditable); define reorg/revision handling; and specify the protocol subsidy for each exact height/window. Do not treat `totalReward - totalFee` as a substitute for a documented subsidy series without validating the provider's units and reward semantics. No ratio or methodology ID is approved.

No endpoint was called in this review. No live data was fetched, no database was accessed or written, and no scenario, monitoring event, or published probability was changed. BTC remains `not_evaluable`.


## 4F. Reward-stats response-schema follow-up — 2026-10-14 (documentation/source review only)

The official Mempool API documentation includes an example response for GET /v1/mining/reward-stats/:blockCount with startBlock, endBlock, totalReward, totalFee, and totalTx. The three sums are shown as numeric strings. The endpoint description says the result covers the past requested number of blocks, but does not declare the units of totalReward or totalFee. Example magnitudes are consistent with satoshi-denominated sums, but magnitude is not an authoritative unit contract; do not normalize as satoshis without confirming the implementation/data model and deployed API version.

The reviewed SQL selects up to N rows where stale = 0, ordered by descending height, and returns only minimum/maximum height and sums. It does not return the full height list and does not prove the selected heights are consecutive. Nor does the endpoint summary alone establish whether the selected set has a complete canonical chain after a reorg, or define a protocol-subsidy denominator for the exact same block set.

Decision remains blocked. Do not calculate fee_subsidy_ratio, infer protocol subsidy from totalReward minus totalFee, or approve a methodology ID. Required before reconsideration: (1) verify deployed-version parity; (2) establish units and the exact meaning of reward/fees from the source model and API contract; (3) prove the exact height range is consecutive and canonical, with reorg/revision handling; and (4) define protocol subsidy per height for that exact range. If the aggregate endpoint cannot provide enough evidence, use an explicitly reviewed block-level source rather than inventing semantics.

CI for the three documentation commits passed: [VPS API Build Rehearsal #1101](https://github.com/olegsh247-stack/Crypto/actions/runs/38586798822), [#1102](https://github.com/olegsh247-stack/Crypto/actions/runs/38586810854), and [#1103](https://github.com/olegsh247-stack/Crypto/actions/runs/38586823731). No live endpoint was queried, no database was accessed/written, and no scenario/monitoring state or probability changed.

## 4G. Reward-stats upstream field semantics — 2026-10-14 (source-code review only)

Upstream implementation review resolves the field meaning more strongly than the REST example alone. In `backend/src/api/blocks.ts`, `extras.reward` is the sum of coinbase transaction outputs; `extras.totalFees` is populated from Bitcoin Core block stats `totalfee`. `BlocksRepository` stores those values and `reward-stats` aggregates `SUM(reward)` and `SUM(fees)` for selected rows with `stale = 0`. Mempool's block UI passes both `extras.reward` and `extras.totalFees` to satoshi-aware amount components. For the reviewed upstream revision, `totalReward` therefore means the sum of total coinbase payouts (subsidy + fees), and the sums are satoshi-denominated. References: [upstream block construction](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/backend/src/api/blocks.ts), [database persistence and aggregate query](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/backend/src/repositories/BlocksRepository.ts), [satoshi-aware block display](https://github.com/mempool/mempool/blob/92afa5893c6c6f4dffe7de933f66e65993f336d7/frontend/src/app/components/block/block.component.html).

This is a verified interpretation of the reviewed upstream revision, not proof that the public deployment runs that revision. Acceptance remains blocked until deployment parity is established; selected heights are proven consecutive and canonical; reorg/revision handling is defined; and the protocol subsidy is computed per exact height for the same window. Do not use totalReward as subsidy, do not calculate the fee/subsidy ratio yet, and do not approve a methodology ID. Source-code review only: no live endpoint call or database operation.

## 4H. Reward-stats continuity and block-level alternative — 2026-10-14

The aggregate `reward-stats/:blockCount` query selects up to N rows with `stale = 0`, orders by descending height, and returns minimum/maximum heights plus summed fields. It does not return the selected-row count or every selected height, so the response alone cannot prove that all heights in the interval are present and consecutive.

A better auditable candidate is a **block-level window**: retain an expected explicit height list and one record per height, including height, canonical hash, block timestamp, reward, and fees. The reviewed upstream repository has a block-by-height lookup restricted to `stale = 0`; whether the public endpoint and deployed revision expose all required fields still needs separate confirmation. For each capture, validate exact height coverage, no duplicates, one canonical block per height, units, timestamp, and reorg/revision handling. Join the protocol subsidy schedule by the same exact height and calculate only after those checks pass.

This is a source-design decision, not acceptance of live data. No live endpoint was called and no aggregate was calculated. The public deployment's revision is unverified, and fee/subsidy remains blocked until the per-height contract and capture are reviewed.


## 5. Indicator utility and calculation scope — 2026-10-14

The first BTC scenario should not calculate every available metric by default. Each indicator must answer a named research question and have a defined role in the scenario.

- **BTC spot price — required reference context.** Anchors the market state at evaluation time; not a directional conclusion on its own. Use source-observed time separately from retrieval time, with event-driven cadence and a maximum age of one hour. Do not force a 15-minute or hourly polling cadence.
- **US spot BTC ETF net flows — core institutional-demand factor.** Relevant to the existing institutional-catalyst thesis. Use canonical Farside data unless source priority is formally reviewed. Sum or trend only distinct completed reporting days with explicit units and revision/missing-day rules. HTTP failure, dash, blank, and placeholder are not zero. TFTC is not an automatic substitute.
- **DXY — core macro context for the current thesis, but currently blocked.** The scenario is documented as macro-sensitive, so an unknown DXY must remain explicitly unknown. Approve a specific feed, stable endpoint, timestamp convention and unit before use; no proxy substitution.
- **Hashrate — supporting network-health evidence, not a default directional score.** It can identify material network/security regime changes but does not directly establish short-term BTC direction. Preserve the represented UTC interval and compare like-for-like periods. It should become a hard scenario input only if the scenario's explicit rules depend on mining/security conditions.
- **Fee/subsidy ratio — deferred, not required for the current scenario.** It describes transaction fees relative to protocol subsidy and is mainly useful for a miner-economics / long-horizon network-security question. It is indirect for the present institutional/macro-catalyst scenario, and a short-window ratio may be noisy. **Do not calculate or approve a method ID now.** Reopen only if a specific research hypothesis needs the metric.

### Consequence for implementation

This was the pre-implementation scope note. It has since been applied to the readiness gate, tests and metric registry (see Section 6). Do not remove source provenance or research notes already collected, but do not build or run a recurring fee calculation just to populate a field. The aggregate Mempool reward-stats endpoint remains insufficient as sole continuity evidence; no ratio has been calculated, no live API was queried, no database was accessed or written, and no scenario/monitoring/probability was changed. BTC remains not_evaluable until the active inputs and scenario rules pass their own gates.

 
## 6. Scope decision applied to the readiness gate — 2026-10-14

The first-scenario scope decision has now been applied in code:

- Removed hashrate and fee/subsidy ratio from the mandatory readiness list. Hashrate remains supporting network-health context; fee/subsidy remains deferred and is not calculated.
- The metric registry now labels fee/subsidy ratio as manual/on-demand with no active freshness expectation while deferred. Its identity is retained for future research; it is not a live required input.
- Tests were updated so the two deferred/context metrics do not block readiness, while provenance tests continue to cover mandatory inputs.

CI follow-up found that the VPS E2E test still asserted that missing fee/subsidy data must block readiness. That stale assertion contradicted the approved scope and has been corrected in `.github/workflows/vps-api-build.yml`; the new run is pending. BTC remains `not_evaluable` until its actual required inputs pass all source, freshness, unit and series checks. This change does not authorize scenario evaluation, probability changes, persisted state, production ingestion, database writes or deployment.


## 7. Exchange price-source review — 2026-10-14

Binance, OKX and Bybit are valid candidates for independent market-data corroboration. They should not be ignored, but their prices must not be blended into an unlabeled synthetic BTC/USD observation.

- **Canonical point-price candidate remains Kraken XBT/USD trades** for the current contract because an individual trade carries an exchange-provided trade timestamp and the quote currency is USD. The actual response still needs to be captured and accepted through controlled staging.
- **Binance Spot, OKX Spot and Bybit Spot** expose public market-data endpoints. Their common liquid BTC spot markets are generally BTC/USDT, while the selected Kraken pair is XBT/USD. USDT is not identical to USD; BTC/USDT cannot be represented as canonical `USD/BTC` without a separately sourced, timestamp-aligned USDT/USD conversion or an explicitly different metric/unit.
- Keep each venue/pair as its own source observation, with venue, exact symbol, price, source event timestamp (where provided), retrieval timestamp, raw payload hash and unit. A ticker endpoint without a price-event timestamp cannot by itself establish the observation time required by the current gate; prefer timestamped trades for point observations.
- Use exchange observations to assess availability, freshness, unit semantics and price dispersion. Do not average them into one quote, silently convert USDT to USD, or substitute another venue for Kraken without an approved source-priority change. First step: read-only staging comparison, with no PostgreSQL writes.
- DXY remains a separate blocker. ICE identifies itself as administrator of the ICE U.S. Dollar Index and lists intraday, daily and historical data delivery, but this review has not established an accessible, approved endpoint and observation-time convention for the project. Do not relabel a broad trade-weighted dollar series as DXY or scrape a vendor page as if it were a canonical feed.

Source references for API contract review: [Binance public Spot market-data documentation](https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md), [OKX API v5 documentation](https://www.okx.com/docs-v5/en/), [Bybit V5 market tickers](https://bybit-exchange.github.io/docs/v5/market/tickers), and [ICE U.S. Dollar Index product information](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices). These references establish candidate API documentation, not current observations or source acceptance.


## 8. Read-only exchange capture result — 2026-10-14

The updated capture completed successfully in [workflow run #61](https://github.com/olegsh247-stack/Crypto/actions/runs/38601923755). The raw responses and manifest are preserved in the seven-day artifact [btc-public-source-review](https://github.com/olegsh247-stack/Crypto/actions/runs/38601923755/artifacts/11912919926). A permanent summary is recorded in [BTC-EXCHANGE-CROSSCHECK-2026-10-14.json](data-review/BTC-EXCHANGE-CROSSCHECK-2026-10-14.json).

- Kraken returned HTTP 200. The newest captured XBT/USD trade was 81,826.70 USD/BTC at 2026-10-14 16:53:33.584 UTC.
- OKX returned HTTP 200. The newest captured BTC-USDT trade was 81,914.10 USDT/BTC at 2026-10-14 16:53:33.741 UTC. Keep this as an independent cross-check; do not calculate a USD spread from these values without a timestamp-aligned USDT/USD conversion.
- Binance returned HTTP 451 and Bybit HTTP 403 from this GitHub Actions capture environment. These access outcomes do not establish that either exchange is globally unavailable; keep both as candidates and review alternate permitted public-data access before deciding.
- Farside returned HTTP 403; TFTC's JSON candidate returned HTTP 200 with 707 rows. TFTC remains a reconciliation candidate only, not the canonical ETF source, until source lineage, reporting dates, revisions and observation/publication time are validated.
- Mempool raw hashrate and aggregate fee responses were captured for research continuity only. Hashrate is not a mandatory directional input; no fee/subsidy ratio was calculated.

**Acceptance outcome:** no source is promoted by this capture alone. Kraken remains the canonical price candidate; OKX is a unit-distinct cross-check; ETF evidence and DXY remain blockers. The workflow accessed no PostgreSQL database and wrote no observations, scenario states, monitoring events or probabilities.


## 9. DXY provider decision and exchange-source guard tests — 2026-10-14

### DXY: official index is identifiable, but the feed is not yet accepted

ICE's own documentation identifies ICE as administrator of the ICE U.S. Dollar Index (DXY) and describes intraday and daily data products. Its methodology says the official closing level is the last calculated level disseminated on the index business day; regular intraday calculation/publishing hours differ by weekday. These semantics can anchor a daily-close contract, but they do not establish that this project has access to the licensed data delivery endpoint.

- Official product documentation: [ICE Currency Indices](https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices).
- Official methodology: [ICE FX Indices methodology](https://www.theice.com/publicdocs/data/ICE_FX_Indexes_Methodology.pdf).
- The source registry now includes `macro.ice_dxy_candidate` explicitly as an **unapproved candidate**. Its URL is documentation, not a data endpoint. The source ID has not been added to `macro.dxy`'s metric `source_priority`, and the readiness gate still fails closed for DXY.
- FRED's `DTWEXBGS` is the Federal Reserve's Nominal Broad U.S. Dollar Index, with a different basket and index base. It is not DXY and is not an acceptable replacement for the existing DXY factor. See [FRED series notes](https://fred.stlouisfed.org/series/DTWEXBGS).

**Decision:** do not select a random public chart/scrape or silently substitute a broad USD index. Before accepting DXY, identify an actually accessible provider feed, confirm access/licensing, obtain a real response, preserve the provider's source date/time and retrieval time separately, and define how its official close maps to the UTC observation contract. Until then, DXY remains a blocker.

### Exchange candidates cannot bypass canonical price provenance

Added three automated readiness tests covering registered Binance, OKX and Bybit sources. Even if the observation is numeric, current, registered and timestamped, each is rejected for `market.spot_price` unless the canonical source contract is explicitly changed. This protects against accidentally promoting a BTC/USDT quote into the required USD/BTC input. Source-registry notes now mark those venues as cross-check candidates only; Kraken remains the sole canonical candidate.

Validation: BTC Scenario Readiness Gate run [#186](https://github.com/olegsh247-stack/Crypto/actions/runs/38604259925) passed after the three tests were added. The follow-up registry and documentation commits also passed the BTC Scenario Readiness Gate [#188](https://github.com/olegsh247-stack/Crypto/actions/runs/38604442941) and current-head VPS Build Rehearsal [#1136](https://github.com/olegsh247-stack/Crypto/actions/runs/38604493446).


## 10. ETF source options — official SoSoValue API candidate — 2026-10-14

Farside remains the intended canonical source under the current contract, but its page returned HTTP 403 from GitHub Actions. TFTC remains a reconciliation mirror, not an approved substitute. A further candidate has now been registered for investigation: **SoSoValue's documented ETF Summary History API**.

- Official API docs: [ETF Summary History](https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/summary-history); base URL `https://openapi.sosovalue.com/openapi/v1`; endpoint `GET /etfs/summary-history`; request requires `symbol=BTC` and `country_code=US`, with optional date range and limit. The API requires an `x-soso-api-key` header; no key was supplied or queried in this review.
- The documented response provides `date` (trading date) and `total_net_inflow` (USD) along with traded value, net assets and cumulative flow. It is reverse-chronological, excludes non-trading days and only supports the most recent month. Normalize USD to the registry's USD-million unit only with an explicit, tested conversion.
- The docs provide a trading date, not an exact publication timestamp. A daily total may be revised as issuers report or provider data is refreshed; this review has not established a publication/finalization timestamp or revision policy from the primary API documentation. Therefore do not manufacture `observed_at` from retrieval time or treat the API's latest date as proof that all issuer reports are complete.
- Registry entry `institutional.sosovalue` is candidate-only and is not in `institutional.etf_net_flow` source priority. The readiness gate continues to allow only Farside. Do not add a secret or query the API until the access path and terms are intentionally arranged.
- Before any source-priority decision, compare at least five distinct completed US trading dates against Farside and TFTC, preserve raw payloads, identify revised/partial rows, confirm date/time conventions, quantify discrepancies, and document a deterministic rule for excluding unreported fund rows. No automatic source substitution.

This candidate is potentially more machine-readable than a scraped page, but it is not yet accepted and does not remove the current ETF blocker.


## 11. ETF reporting date is mandatory — 2026-10-14

The read-only readiness gate now requires every ETF flow row to carry an explicit `period_start` representing the provider's logical trading/reporting date. It no longer falls back to `observed_at` to invent a session date. These fields have different meanings:

- `period_start`: the completed ETF reporting/trading date that the flow value belongs to;
- `observed_at`: the source observation/publication time, when defensible;
- `retrieved_at`: when the capture process fetched the source.

The latest row must have a valid reporting date no more than 14 days old, and must separately pass the existing 36-hour observation freshness gate. Historical rows count toward the five-session minimum only when their reporting date is explicit, valid, not future-dated, and inside the 14-day window. Missing reporting dates fail closed; duplicate rows are still deduplicated by logical reporting date, not by fetch time.

A regression test removes `period_start` while leaving the observation timestamp current and confirms that ETF readiness is blocked. This is a contract/test change only: it does not backfill existing observations, access a database, or promote a source. Farside remains the intended canonical source; TFTC and SoSoValue remain unapproved candidates.


## 12. Storage contract for source provenance metadata — 2026-10-14

The PostgreSQL observation model previously had `observed_at`, `period_start`, `period_end`, `source_url`, `methodology`, and `revision`, but no dedicated fields for retrieval time, provider update/publication time, raw source-row identity, payload hash, or methodology version. That made the documented provenance contract more complete than the physical schema.

The schema and a forward migration now add nullable metadata columns:

| Column | Meaning |
|---|---|
| `source_updated_at` | Provider-supplied publication/update time, when the source exposes one |
| `retrieved_at` | Time the collector fetched the provider response |
| `source_row_key` | Stable provider row/event identity when available |
| `source_payload_sha256` | SHA-256 fingerprint of the exact source row/payload representation retained for review; 64 hexadecimal characters |
| `methodology_version` | Version of the calculation/normalization method, especially for derived metrics |

These fields are intentionally nullable for backward compatibility and do not invent metadata for existing observations. `observed_at` remains the actual observation time/window; `period_start`/`period_end` remain the logical measurement interval. The migration adds schema only: it does not backfill rows, ingest market data, rewrite revisions, or change scenario state. Collectors and acceptance checks must be updated before claiming these fields are populated in runtime data.


## 13. Readiness-to-database provenance handoff — 2026-10-14

The BTC API readiness query now passes `period_start` and the persisted provenance fields into the read-only gate: `source_updated_at`, `retrieved_at`, `source_row_key`, `source_payload_sha256`, `methodology`, and `methodology_version`. The selected offline input object preserves these fields so a reviewer can inspect exactly which source row and method were accepted.

For core inputs that can make the first BTC scenario evaluable, the gate now requires a valid non-future retrieval timestamp and a non-empty stable source-row key. A supplied SHA-256 payload hash must be 64 hexadecimal characters. Historical rows lacking retrieval/key metadata remain in storage but cannot silently qualify as current scenario inputs; there is no automatic backfill. ETF history applies the same retrieval/key checks while still requiring the explicit provider reporting date `period_start`.

This is a repository/CI contract change only. It does not insert observations, infer source timestamps, apply a production migration, calculate a scenario, or persist a scenario state. The capture script remains a review-only artifact producer; mapping raw capture artifacts into persisted observations is a separate controlled ingestion task.


## 14. Review-only capture-to-observation mapping — 2026-10-14

Added `scripts/prepare-btc-observation-candidates.mjs` as a deliberately non-persistent handoff. It reads a capture manifest and emits a normalized candidate artifact only for the approved Kraken XBT/USD latest-trade shape, mapping the value, `USD/BTC` unit, source event time, retrieval time, source URL/ID, stable row key, payload SHA-256, method/version, revision placeholder and raw-body filename to the observation contract.

The output explicitly says `candidate_state: REVIEW_ONLY` and `persistable: false`; it never opens PostgreSQL or writes observations. It rejects missing/invalid source timestamps, row key, hash, canonical URL, or unit. USDT exchange cross-checks are not promoted to canonical observations. ETF capture remains blocked because row-level values, provider reporting dates and defensible publication/observation timing are not yet normalized. DXY remains unresolved.

The candidate mapper has unit tests for successful Kraken mapping, missing row/hash rejection, quote-unit separation and the ETF hold. BTC Scenario Readiness Gate #194 passed after the mapper and its tests were added: https://github.com/olegsh247-stack/Crypto/actions/runs/38607850897. The workflow was then updated to include the same paths for pull requests as well as pushes; the resulting current-head gate is tracked separately.

This closes only the **review-only mapping** step. It does not approve ingestion or source priority, and it does not change the current `not_evaluable` scenario status.


## 15. Capture-to-candidate CI rehearsal — 2026-10-14

The read-only staging workflow now runs the normalizer immediately after source capture and uploads the normalized candidate artifact with the raw responses and manifest. Run #63 passed: https://github.com/olegsh247-stack/Crypto/actions/runs/38608092736. The workflow reported one normalized candidate and two blocked ETF source entries; the output explicitly states that no production database was accessed and no writes were performed.

Capture evidence at this run:
- Kraken XBT/USD returned HTTP 200. Its latest trade in the capture was **81,735.9 USD/BTC at 2026-10-14T17:36:36.135Z**. This is a point-in-time review candidate, not a persisted observation.
- OKX BTC-USDT returned HTTP 200 and remains a USDT cross-check only.
- Binance returned HTTP 451 and Bybit HTTP 403 from this GitHub runner. Those responses do not establish that either venue is globally unavailable.
- Farside returned HTTP 403 in this run. TFTC's candidate JSON returned HTTP 200 with 707 rows, but it remains unapproved and is not converted into canonical ETF observations.
- DXY remains unresolved; no broad USD index is substituted.

The latest VPS Build Rehearsal #1164 passed on the same code head `53c4b38d`: https://github.com/olegsh247-stack/Crypto/actions/runs/38608092710. This validates the current schema/migration and application rehearsal; it is not a production migration or deployment.

Next, review the actual normalized artifact and the ETF candidate schema/reporting-date contract. Do not persist this Kraken candidate or promote TFTC/Farside until duplicate/revision rules and source acceptance are explicit.


## 16. Candidate artifact field-by-field verification — 2026-10-14

Read-only capture run #64 produced artifact `11916637750`; the normalized candidate was compared against the archived Kraken raw response. The raw-response SHA-256 matched both the manifest and candidate; price and event timestamp matched the latest trade row; and the deterministic `source_row_key` matched the raw trade fields. BTC Scenario Readiness Gate #197 passed with the explicit cross-check-blocking tests: https://github.com/olegsh247-stack/Crypto/actions/runs/38608820923. Capture run #64 passed and reported one candidate plus five blocked entries: https://github.com/olegsh247-stack/Crypto/actions/runs/38608794818.

The five blocked entries are deliberate: Binance and Bybit could not be retrieved from this runner (HTTP 451/403), OKX was retrieved but is a USDT quote, and both ETF sources lack accepted row-level reporting-time normalization. These outcomes are retained as evidence, not silently omitted or promoted. The source contract still does not permit ingestion.


## 17. DXY source contract — 2026-10-14

The metric registry no longer lists generic `macro.primary` as canonical for `macro.dxy`; its `source_priority` is empty until a specific feed is approved. `macro.ice_dxy_candidate` remains a candidate only. The registry notes now explicitly say that the ICE catalog URL is product documentation, not a public quote endpoint, and that access/license, actual feed schema, daily-close field and timestamps remain unverified.

The detailed decision and acceptance gates are in [BTC-DXY-SOURCE-CONTRACT-2026-10-14.md](data-review/BTC-DXY-SOURCE-CONTRACT-2026-10-14.md). The required observation contract keeps the ICE index business date (`period_start`), actual provider timestamp (`observed_at`), and our retrieval time (`retrieved_at`) separate. A provider-supplied update timestamp must not be invented; the endpoint and current methodology must be verified against an actual authorized feed before acceptance.

This is registry/documentation/test hardening only. The runtime DXY allowlist remains empty and BTC remains `not_evaluable`. No production data or scenario state was changed.


### Farside ETF aggregate reconciliation — parser v2

The read-only HTML parser now reports both the provider's displayed aggregate and the calculated sum of all 12 per-fund values when every fund value is present:

- `calculated_fund_sum_usd_million`
- `fund_sum_minus_reported_total_usd_million`
- `reconciliation_status`: `MATCHES_DISPLAY_ROUNDING`, `MATERIAL_DIFFERENCE`, `INCOMPLETE`, or `UNREPORTED`.

The parser uses a diagnostic maximum rounding envelope of **0.65 USD million**: twelve fund values displayed to one decimal can each contribute up to 0.05m of rounding, and the displayed aggregate can contribute another 0.05m. This is a transparent screening threshold, not an ingestion approval or a guarantee that source values are correct. Rows outside it stay visibly discrepant; the parser never adjusts a fund value or overwrites the provider total to force a match. Rows with missing fund values are not assigned a calculated sum, and all-dash placeholder rows remain unreported rather than zero observations.

The parser still does not infer `observed_at`, publication time, finalization, or revision from the reporting date, HTTP Date, retrieval time, or response headers. Those remain separate blockers for accepting ETF observations.


## 18. ETF reporting-time, retrieval, and revision contract — 2026-10-14

ETF rows must not be normalized into accepted observations until the following timestamps and revision fields have distinct meanings. The Farside HTML parser currently provides the reporting date and flow values; it deliberately leaves `observed_at` null. This section defines the contract without inventing missing source facts.

| Field | Required meaning for an ETF row | Current Farside capture status |
|---|---|---|
| `period_start` / `period_end` | Provider's displayed reporting/trading session date, normalized to the date only; same day for a daily flow row | Available from the dated table row |
| `observed_at` | Timestamp that the source explicitly associates with the published observation, or a separately documented and approved observation-time convention | **Unresolved**; do not copy the reporting date into a timestamp |
| `source_updated_at` | Provider-supplied publication/update timestamp only, with its source field/semantics recorded | **Unresolved**; HTTP `Date` is response metadata, not a provider publication timestamp |
| `retrieved_at` | UTC timestamp when this collector retrieved the HTTP response | Available in the capture manifest |
| `http_date` | HTTP response `Date` header, retained as transport metadata | Captured when present; never maps automatically to `observed_at` or `source_updated_at` |
| `provider_last_modified`, `etag`, `cache_control`, `expires` | Exact response headers, nullable if absent | Captured when present; current Farside response had no `Last-Modified` or `ETag` |
| `source_payload_sha256` | SHA-256 of the exact captured response body; retain raw body alongside the digest | Available in the read-only capture |
| `source_row_key` | Deterministic identity for one provider reporting date and source table/row; must not depend on retrieval time | To be defined in the ETF row normalizer; do not reuse the whole-page hash as if it were a row identity |
| `revision` | Monotonic provider revision only if the provider exposes one; otherwise a locally recorded capture/version identifier must be explicitly typed as such and must not masquerade as provider revision | No provider revision identifier verified |
| `finalization_status` | `unknown`, `provisional`, or `final`, based only on explicit provider documentation/evidence | **unknown**; do not infer finalization from a date being in the past |
| `reconciliation_status` | Parser's sum-vs-total result; independent of time/finality acceptance | Available from parser v2; diagnostic only |

### Acceptance rules

1. Keep the provider's session date, observation timestamp, provider update timestamp, retrieval timestamp, and HTTP response metadata in separate fields.
2. Never derive a publication timestamp from HTTP `Date`, `Last-Modified`, ETag presence, crawler time, GitHub artifact creation time, or retrieval time.
3. A page-level SHA-256 proves which response body was captured; it does not establish the publication time, the revision number of an individual row, or whether a row was final.
4. A row may be represented as a review candidate with `observed_at: null`, `finalization_status: "unknown"`, and `persistable: false`. It must not qualify as a current scenario input until the accepted observation-time convention and revision/finality policy are supported by source evidence.
5. For revision comparisons, preserve each capture's retrieval time, response metadata, full-body hash and raw body. Compare normalized row values across captures by reporting date; label the comparison as capture-to-capture only unless the provider documents revision identifiers or publication semantics.
6. The parser's `MATCHES_DISPLAY_ROUNDING` status is not a substitute for timestamp, source-row identity, finality, or revision acceptance. `MATERIAL_DIFFERENCE`, `INCOMPLETE`, and `UNREPORTED` remain explicit review outcomes.
7. Do not treat the latest visible date as proof of latest completed session. For the 14 Oct all-dash row, the correct interpretation remains `UNREPORTED_PLACEHOLDER`, not zero flow.

### Current decision

**ETF source remains blocked for ingestion and scenario readiness.** The official all-data endpoint is reachable and its table parser/reconciliation checks are working, but no defensible provider publication timestamp, provider revision ID, or finalization signal has been established. The next technical step is a review-only row normalizer that emits the contract above and carries the response-level provenance unchanged; it must leave unavailable fields null/unknown and set `persistable: false`. Do not change the source priority, run scenario evaluation, or write production observations as part of that step.
