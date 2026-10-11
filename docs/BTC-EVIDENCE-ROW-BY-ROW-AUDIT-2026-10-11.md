# BTC Evidence row-by-row source alignment audit — 2026-10-11

**Scope:** BTC published snapshot `BTC-2026-10-07-v1`, 15 qualitative Evidence rows.  
**Review basis:** row definitions and source mapping in `infrastructure/neon/migrations/2026-10-07-btc-asset-card.sql`, plus the existing BTC Evidence review and market-observation baseline. This is a repository-contract review, not a fresh query of production or Neon. Live row IDs and current API payloads have not been re-read in this step.  
**Safety:** documentation only; no migration, database write, deployment, PR merge or scenario-state creation.

## Overall finding

The 15 rows are qualitative research summaries stored as Evidence. The source ID is not enough to make the source direct proof of the claim. Several rows cite broad project homepages, and two particularly important claims use sources that are semantically mismatched:

- the macro-sensitivity claim cites an SEC interpretive release, which describes legal classification/application, not a BTC price/liquidity relationship;
- the development claim cites Bitcoin Core release history, which can prove release activity, not necessarily the claim's broader “security-focused” conclusion.

No new scenario links should be added based on this inventory alone. The two existing SEC proposal links remain narrow and defensible as already documented. Base stays unlinked until its central comparative claim has direct support or is reframed to a directly supportable claim.

## Row-by-row classification

“Directness” here describes whether the mapped source type/URL can substantiate the full stored claim, not whether the qualitative assessment is necessarily false.

| Block | Stored Evidence claim (abridged) | Mapped source | Classification | Required next action |
|---:|---|---|---|---|
| 1 | Bitcoin is a decentralized monetary network and scarce digital bearer asset | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Partial / broad source.** A project landing page is not a precise citation for all monetary, decentralization and scarcity subclaims. | Split into narrower claims or use claim-specific protocol documentation plus a defined comparative/adoption dataset for monetary role. |
| 2 | PoW security, independent validation and conservative evolution are prioritized | `bitcoin_org_development` → https://bitcoin.org/en/development | **Partial / broad source.** Development overview may describe process, but does not by itself prove security outcomes. | Cite the developer reference for consensus/validation mechanics; treat “security” as a design property, not a guarantee. |
| 3 | Scarcity is governed by a 21 million maximum and declining issuance | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Claim support plausible, citation insufficiently specific.** | Use precise consensus/subsidy documentation or a deterministic chain-derived supply method; preserve source/as-of semantics. |
| 4 | Security depends on PoW, miners, nodes and independent validation | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Partial / broad source.** Mechanism claim can be sourced more precisely; “security” is broader than any single page or hashrate figure. | Use scoped technical sources; for current state, require dated difficulty/hashrate and other relevant measures. |
| 5 | Ecosystem depth centers on monetary infrastructure and second layers | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Insufficient for the whole claim.** A Core page is not an ecosystem inventory. | Define what “ecosystem depth” means and use a dated, reproducible inventory; otherwise keep as an explicitly labelled analyst assessment. |
| 6 | Activity is primarily monetary, settlement and second-layer usage | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Insufficient for an empirical activity claim.** Protocol description does not measure the composition of current use. | Require a methodology and dated activity dataset; avoid treating transaction counts alone as usage classification. |
| 7 | Institutional access and custody frameworks are becoming more mature | `sec_custody_2026` → SEC proposal, 2026-10-01 | **Partial, narrowly relevant.** The proposal establishes a potential regulatory/custody catalyst, not realized access, allocations or adoption. | Keep the existing link narrow; clearly label proposal status and do not infer realized flows. |
| 8 | Bitcoin Core development remains active and security-focused | `bitcoin_org_releases` → https://bitcoin.org/en/version-history | **Partial.** Release history can show releases/activity; it does not independently establish security focus or security outcomes. | Link release activity only to an activity claim; support security-focused interpretation separately or qualify it as analyst assessment. |
| 9 | BTC is sensitive to liquidity, real yields, risk appetite and institutional capital | `sec_crypto_2026` → https://www.sec.gov/rules-regulations/2026/03/s7-2026-09 | **Mismatched source.** The SEC interpretation concerns legal classification/application, not an empirical macro/valuation relationship. | Do not link to Bear as proof. Find a reproducible empirical analysis or preserve as a qualitative hypothesis with explicit uncertainty. |
| 10 | BTC competes primarily for monetary capital; strongest crypto monetary position | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Insufficient for comparative ranking.** Protocol docs cannot establish market position versus other assets. | Define comparison universe and metric(s), date the comparison and retain the calculation method; otherwise label the superlative as analyst judgment. |
| 11 | Risks include volatility, miner economics, concentration, regulation and technical risks | `bitcoin_org_development` → https://bitcoin.org/en/development | **Broad risk synthesis, not directly substantiated as a whole.** Several distinct risk categories need distinct evidence. | Split into risk-specific claims/sources. Miner economics needs measured revenue/fee/cost inputs; concentration needs defined metrics. |
| 12 | Regulatory/custody improvements can expand institutional access | `sec_custody_2026` → SEC proposal, 2026-10-01 | **Direct for existence of a potential proposal/catalyst; not for outcome.** | Existing Bull `supports` link is acceptable only with the narrow rationale already documented. No claim of final adoption or realized demand. |
| 13 | Scenarios are driven by monetary demand, flows, liquidity and security economics | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Insufficient as scenario evidence.** This is a framework statement, not an observation that any driver currently supports a scenario. | Keep as scenario-method/context, not direct support. Add measurable driver observations only after their data contracts are reviewed. |
| 14 | Positive thesis based on scarcity, security, decentralization and liquidity | `bitcoin_org_core` → https://bitcoin.org/en/bitcoin-core/ | **Analyst synthesis; source too broad for combined conclusion.** | Keep the thesis explicitly as analysis, trace each premise to separate evidence and do not present one URL as proving the conclusion. |
| 15 | Monitoring must connect data, metrics, signals, assessment, confidence, impact and status | `bitcoin_org_development` → https://bitcoin.org/en/development | **Source mismatch for a product-methodology claim.** This is Crypto's internal monitoring design, not a Bitcoin development fact. | Treat as internal methodology/documentation, not external Bitcoin Evidence; if retained in Evidence, cite the project's own methodology artifact and classify appropriately. |

## Scenario consequences

### Base
- No row directly supports the central comparative assumption “Bitcoin remains the dominant crypto monetary asset.”
- Block 3's scarcity claim can be made more precise with a better protocol citation, but scarcity alone does not establish dominance, market value or a 50% scenario weight.
- Blocks 1, 4, 10 and 14 are too broad or comparative to support Base as currently phrased.
- **Decision: keep Base unlinked.** Do not turn technical facts into proof of a market-ranking claim.

### Bull
- Block 12 is the one narrowly supportable regulatory-catalyst row. The source is a proposal, so the link supports the *existence of a possible catalyst*, not realized institutional demand.
- Blocks 7 and 1 do not independently prove treasury adoption, realized institutional allocation or sustained monetary demand.
- **Decision: preserve the existing single narrow SEC `supports` link; add none from this inventory.**

### Bear
- Block 9's SEC source does not substantiate macro sensitivity.
- Block 11 is a generic risk summary, not evidence of current deterioration in mining economics.
- Block 4 identifies fee economics as something to monitor, but does not measure prolonged fee weakness.
- Existing stale ETF flow data cannot establish persistent outflows; one dated observation is not a trend.
- **Decision: preserve the existing SEC proposal `context` link; add no Bear `supports` or `invalidation` links from these rows.**

## Next technical work, in order

1. Repair source precision for the protocol-level claims (especially scarcity/subsidy and validation mechanics) using a separate additive migration only after exact target rows/natural keys and API semantics are verified.
2. Reclassify block 15 as internal methodology rather than external fact, if the schema can represent that distinction without breaking existing contracts. Do not silently delete or rewrite published history.
3. Define the required measured inputs for the unsupported comparative and macro claims:
   - comparative monetary-asset position: universe, timestamp, market-cap/liquidity/adoption methodology;
   - institutional flows: consistent dated series, provider methodology, direction convention and missing-data policy;
   - miner/fee economics: interval fees, subsidy/revenue, difficulty/hashrate and clearly stated lookback; profitability claims need cost assumptions/data;
   - macro context: selected series, units, cadence, revision policy and explicit limits on causal interpretation.
4. Only after data/source contracts exist, decide whether to create new Evidence rows and whether they are appropriate to link to Bull/Base/Bear.
5. Keep all historical timestamps and stale statuses honest. No invented thresholds, weights or scenario states.

## Acceptance status

- Source-to-claim mapping audit: **completed from repository definitions**.
- Fresh live Evidence row query: **not performed in this step**.
- Evidence links: **no change recommended**.
- Base direct evidence: **gap remains**.
- Bear direct quantitative evidence: **gap remains**.
- Production, Neon, Worker, VPS and PR merge: **untouched**.
