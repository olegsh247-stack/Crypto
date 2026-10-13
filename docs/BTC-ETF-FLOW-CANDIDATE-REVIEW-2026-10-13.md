# BTC ETF Flow Candidate Review — 2026-10-13

**Decision: candidate adapter implemented; canonical acceptance blocked.**
**Scope:** BTC ETF flow only, read-only. No production database access or writes.

## Provider and data contract

Candidate provider: CryptoETF.today REST API.

- Endpoint: `GET https://api.cryptoetf.today/api/v1/flows/btc`
- REST authentication: API key in `Authorization: Bearer …` (also documents `X-API-Key`). A public read-only MCP endpoint is available without a key at `https://mcp.cryptoetf.today/api/mcp`, with `get_asset_flows` tool.
- Metric: daily net BTC spot-ETF flows in USD millions; positive means inflow, negative means outflow.
- History: free tier documents 30 days; rows are ordered oldest to newest; dates are UTC.
- Publication convention: provider describes flows as T+1 (previous trading day's flows published next morning UTC); latest row may be revised later that day.
- API `updatedAt` is a response-level update timestamp. The current documented row schema does not include a publication timestamp per individual daily flow row. Therefore `updatedAt` alone is **not** sufficient evidence that the latest row itself was published or revised within the metric registry's 36-hour freshness window.

References:
- API contract: https://docs.cryptoetf.today/
- Provider overview and current public dashboard: https://cryptoetf.today/en/api
- Public flow page: https://cryptoetf.today/en

## Implementation

- `scripts/capture-btc-etf-flow-candidate.mjs` captures the endpoint response read-only, records HTTP status, retrieval time, raw body SHA-256 and parsed rows, and writes only a local CI artifact.
- `scripts/capture-btc-etf-flow-candidate.test.mjs` tests schema/units, negative and zero flows, duplicate dates, invalid rows, no zero-filling, credential absence and raw-payload hashing.
- `.github/workflows/btc-public-source-staging.yml` runs the tests and captures via the public no-key MCP endpoint by default. The optional GitHub Actions secret `CRYPTOETF_API_KEY` switches capture to REST; no credential is stored in source control.
- The parser intentionally does not infer a publication time from `updatedAt`, and it never fills absent trading dates with zero.

## Acceptance status

**Not accepted for scenario input.** Two independent requirements remain:

1. A valid API key must be provisioned as the repository Actions secret `CRYPTOETF_API_KEY` before the authenticated endpoint can be captured. No key is present in the repository and no authenticated request was attempted by this implementation.
2. The current response schema must provide or be paired with an auditable per-row publication/revision timestamp (or the metric owner must formally approve a documented, conservative date-based freshness method). The global `updatedAt` must not silently stand in for the row publication timestamp.

The provider's published example currently identifies Friday 2026-10-09 flows as published Saturday 2026-10-10 at 05:47 UTC; this is older than the 36-hour window at the current review time on 2026-10-13. That public display is useful as a freshness warning, not as authenticated source data for ingestion.

## Safety and next action

No production DB connection, observation writes, scenario-state writes, monitoring writes, or published-probability changes were made. This adapter does not add `institutional.cryptoetf_today` to canonical metric source priority and does not alter registry files.

Next:
1. Run the staging workflow with `CRYPTOETF_API_KEY` provisioned through GitHub Actions secrets.
2. Review exact returned dates, units, publication semantics, payload hash and revisions.
3. Keep the metric blocked unless at least five distinct recent trading-day rows and the 36-hour freshness contract can be demonstrated.
4. Resolve whether this source is accepted as canonical or only a fallback; do not silently replace `institutional.primary`.

## Staging execution — 2026-10-13 08:31 UTC

Read-only workflow [run #38369827976](https://github.com/olegsh247-stack/Crypto/actions/runs/38369827976) passed both BTC series and ETF parser test suites, completed the public-source candidate captures, and uploaded artifact [11797928912](https://github.com/olegsh247-stack/Crypto/actions/runs/38369827976/artifacts/11797928912). At that commit the ETF capture was still REST-only and returned `BLOCKED_NO_CREDENTIAL`; subsequent work added the public no-key MCP fallback. The new MCP path is covered by mocked transport tests and is awaiting a fresh live staging run.

The same run refreshed candidate-only Kraken OHLC and Mempool history:
- Kraken HTTP 200 at `2026-10-13T08:31:32.276Z`; latest completed close on 2026-10-12 was 81,737.1 USD/BTC; seven-day return −4.6814%; raw SHA-256 `b034d2510eec7a39354a388dfcc16b32aa6669f922e438bfd1062490a2a1e347`.
- Mempool HTTP 200 at the same retrieval time; latest daily point 2026-10-12 was 1,028.5949 EH/s; seven-day candidate change +8.6770%; raw SHA-256 `dc38aea6b983053359689f4b655eb586bfe9aa2bf7561e0ad7e4c078921d3539`.

Artifact archive includes the raw source payloads. These values remain candidate-only pending source mapping and bucket semantics.
