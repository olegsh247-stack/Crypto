# BTC Economic Circulating-Supply Candidate — CoinGecko — 2026-10-23

**Status:** public API candidate captured in read-only staging; not accepted, not registered as canonical, and not approved for ingestion.

## Candidate

- Provider: CoinGecko.
- Candidate endpoint: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin`.
- Fields to inspect in a real response: `circulating_supply`, `total_supply`, `max_supply`, `last_updated`, plus HTTP status, response headers and full payload hash.
- Unit expected: BTC.
- Why test it: unlike a protocol subsidy sum or a chart labelled total mined bitcoins, CoinGecko explicitly exposes a provider-defined `circulating_supply` field.
- Official supply methodology: [CoinGecko Supply Methodology](https://support.coingecko.com/articles/6758974979-coingecko-supply-methodology) says that for proof-of-work coins CoinGecko queries a block-explorer API for the amount of coins available, and includes premine coins where whoever controls them can sell them. CoinGecko's Bitcoin explainer says Bitcoin had no premine and its total and circulating supply are effectively the same figure. This is a provider methodology, not proof that a specific API response is current or correct.
- Official API plan information says the public endpoint is rate-limited variably; a Demo account offers a more stable allowance. The single low-frequency candidate check is suitable for research staging, but repeated polling should respect the provider's published limits.

## Critical timestamp distinction

Do not assume the response field `last_updated` is the exact observation time for circulating supply unless CoinGecko documents that meaning for this field. It may describe the market-data object/update rather than a supply-specific observation. Preserve it as provider metadata and keep `observed_at` unaccepted until its semantics are established.

## Required read-only capture before any acceptance decision

1. Capture the actual HTTPS response and HTTP status through the existing bounded BTC public-source staging workflow; save the raw body and SHA-256.
2. Record `retrieved_at`, response schema, `circulating_supply` value/unit, `last_updated`, exact URL and source lineage.
3. Validate that all three supply fields are numeric or explicitly null, positive where required, and `circulating_supply <= total_supply <= max_supply` when the provider supplies those fields.
4. Compare the captured circulating-supply value with the current Mempool protocol-scheduled issuance and Blockchain.com chart, but treat the three values as different source/method evidence. Do not average them or silently substitute one for another.
5. Establish whether the provider's timestamp supports the registry's 48-hour freshness contract; if not, retain the candidate as review-only.
6. Preserve the existing registry/seed mismatch as a separate blocker: `network.primary` currently maps to Mempool while the historical seed methodology names Bitcoin Core and has no source URL. Do not change source priority, registry, seed or runtime merely to admit this candidate.

## Read-only API capture — 2026-10-23

BTC Public Source Staging [run #39922803413](https://github.com/olegsh247-stack/Crypto/actions/runs/39922803413), artifact 12487238469, recaptured the candidate endpoint with HTTP 200 after fixing a manifest-field collision. The raw response was preserved in the review artifact; SHA-256 of the response body: `721d8f022a9c5444c4cb12b1274cecff064124ae9071b7aef14b8e5ef67aa379`.

- `circulating_supply`: **20,102,221 BTC**
- `total_supply`: **20,102,234 BTC**
- `max_supply`: **21,000,000 BTC**
- Provider field `last_updated`: `2026-10-23T08:08:54Z`
- Capture retrieval time: `2026-10-23T08:10:46.889Z`
- Captured row identity: provider asset ID `bitcoin`, symbol `btc`.
- The response passed the candidate parser's basic value checks: circulating supply is positive and no greater than total supply; total supply is no greater than max supply.

The Mempool protocol-scheduled issuance capture in the same run was `20,102,312.5 BTC` at height `972739`, block hash `0000000000000000000071977ba12083b0e6ad3c20ed23bfaa818dd51fc5139a`. That is 91.5 BTC above CoinGecko's circulating supply and 78.5 BTC above CoinGecko's total supply. Blockchain.com reports `20,101,440.625 BTC` with its latest chart point dated `2026-10-21T11:11:52Z`; it is stale relative to this capture. Preserve all three values and their semantics; do not average or silently substitute them. The gap between protocol-scheduled issuance and provider supply needs reconciliation (for example, protocol-scheduled subsidies can exceed actually claimed coinbase rewards), not an automatic conclusion that any one source is wrong.

**Timestamp gate remains blocked:** `last_updated` is a field on CoinGecko's market-data row; this capture does not prove it is the exact observation time of the supply field. Do not promote it to `observed_at` or use it to pass the 48-hour freshness contract without provider-field semantics evidence. The captured row remains review-only, with `observed_at: null`.

## Current decision

CoinGecko is a tested public API candidate, not an approved replacement. The response shape, numeric fields, response hash and retrieval time are captured. The official API schema describes `last_updated` generically as the coin market-data update timestamp; it does not establish that this is a supply-specific observation time. CoinGecko also documents historical `/coins/{id}/circulating_supply_chart` endpoints, but its changelog identifies historical supply chart endpoints as Enterprise-plan exclusive, so availability under the current public endpoint/plan is not established. Do not treat `last_updated` as `observed_at`; the candidate remains blocked on timestamp semantics and freshness acceptance. The existing registry/seed provenance mismatch remains open. The candidate is not linked to canonical `monetary.circulating_supply`.

BTC remains `not_evaluable` until the required supply contract and all other mandatory input gates pass. No registry/runtime/source-priority/seed change, production observation, ingestion, scenario evaluation, or deployment is authorized by this candidate note.

## Official references

- [CoinGecko API](https://www.coingecko.com/en/api)
- [Official CoinGecko API changelog](https://docs.coingecko.com/v3.0.1/changelog/update-frequency-improvements-for-selected-pro-api-endpoints) — documents the circulating-supply chart endpoint family and plan limits.
- [Official CoinGecko TypeScript schema](https://github.com/coingecko/coingecko-typescript/blob/main/src/resources/coins/markets.ts) — defines `last_updated` as the coin market-data update timestamp, not specifically a supply observation timestamp.
- [CoinGecko Supply Methodology](https://support.coingecko.com/articles/6758974979-coingecko-supply-methodology)
- [CoinGecko Public API rate limit](https://support.coingecko.com/articles/5125303456-what-is-the-rate-limit-for-coingecko-api-public-plan)
