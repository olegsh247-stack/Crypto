# BTC Economic Circulating-Supply Candidate — CoinGecko — 2026-10-23

**Status:** source candidate only; not captured in the current BTC staging artifact, not accepted, not registered as canonical, and not approved for ingestion.

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

## Current decision

CoinGecko is the next economic-circulating-supply candidate to test, not an approved replacement. The current staging artifact did not capture this endpoint, so no live value, observation timestamp, payload hash, or freshness result is claimed here. The Mempool value remains protocol-scheduled issuance; the Blockchain.com chart remains its own provider-defined total-mined series. Neither is promoted to canonical `monetary.circulating_supply`.

BTC remains `not_evaluable` until the required supply contract and all other mandatory input gates pass. No registry/runtime/source-priority/seed change, production observation, ingestion, scenario evaluation, or deployment is authorized by this candidate note.

## Official references

- [CoinGecko API](https://www.coingecko.com/en/api)
- [CoinGecko Supply Methodology](https://support.coingecko.com/articles/6758974979-coingecko-supply-methodology)
- [CoinGecko Public API rate limit](https://support.coingecko.com/articles/5125303456-what-is-the-rate-limit-for-coingecko-api-public-plan)
