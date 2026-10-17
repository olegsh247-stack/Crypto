# SoSoValue BTC ETF API Candidate Check — 2026-10-17

## Decision

SoSoValue is retained as a **keyed, daily cross-check candidate** for US spot BTC ETF flows. The user confirmed that the published Demo API quota is sufficient for this project. This is not approval to make SoSoValue canonical, add it to metric `source_priority`, or change runtime selection.

## Official documentation reviewed

- Developer dashboard: https://sosovalue.com/developer/dashboard
- API getting started: https://sodex.com/documentation/for-developers/api-reference/getting-started
- ETF summary-history endpoint: https://sodex.com/documentation/for-developers/api-reference/market-data-api/etf/summary-history
- Market Data API: https://sodex.com/documentation/for-developers/api-reference/market-data-api
- Authentication and limits: https://sodex.com/documentation/for-developers/api-reference/authentication-and-limits
- Common definitions: https://sodex.com/documentation/for-developers/api-reference/common-definitions

The developer dashboard says the Demo API plan is available to all SoSoValue users at zero cost. The documented authentication header is `x-soso-api-key`; the documented quota is 100,000 requests/month and 20 requests/minute. Those limits are sufficient. A key is account-specific and must be created in the developer dashboard; do not paste it into chat, commit it, or place it in a source file.

The documented API base URL is `https://openapi.sosovalue.com/openapi/v1`. The catalog's current endpoint is `/etfs/summary-history`.

## Existing repository contract

The source catalog already records:

- `institutional.sosovalue.etf-summary` → source `institutional.sosovalue`
- `institutional.sosovalue.etf-candidate-output` → source `institutional.sosovalue.candidate`
- Access: API key, environment name `SOSOVALUE_API_KEY`
- Role: `cross_check`; operational status: `candidate`
- Frequency: daily/event-driven, not 15-minute polling
- Intended data: US spot BTC ETFs, normalized to USD/day (or USD million/day only after explicit scale validation)
- Trading date is available as a date field; publication timestamp and revision/finality semantics remain unresolved.

The candidate output identity is for offline preparation and must not be promoted to metric `source_priority` without a separate review and approval.

## Checks still required against an authenticated response

1. Confirm the key works from a controlled test environment and capture HTTP status, response schema and retrieval timestamp without logging the key.
2. Request the longest documented history the endpoint supports; record earliest/latest dates, count of rows and pagination/limit behavior. Do not fabricate missing history.
3. Verify at least five recent completed US trading sessions, plus per-fund fields and the aggregate. Preserve raw response before normalization.
4. Confirm whether values are USD, USD thousands, or USD millions from the actual schema/examples; test aggregate arithmetic and sign convention. Do not infer units from magnitude alone.
5. Confirm date/session timezone, ordering, duplicates, null/missing rows and whether the provider exposes publication/update timestamps.
6. Re-query overlapping historical dates on separate runs to detect corrections/revisions. Until revision/finality semantics are documented or empirically characterized, retain each raw capture and flag changed rows rather than silently overwriting them.
7. Review applicable API terms and permitted retention/archival of responses before enabling recurring capture. Publicly accessible documentation and a free key do not by themselves establish unrestricted redistribution rights.

## Polling and secret handling

- ETF summary/history: daily or event-driven, after provider updates; never poll at 15-minute intervals merely because market-price sources use that cadence.
- Market quote sources may use 15–60 minutes where the provider supports it.
- Store the API key only in a secret manager / GitHub Actions secret named `SOSOVALUE_API_KEY` when the test is ready. Do not put the secret in the repository, logs, artifacts, prompts or journal.
- No key has been supplied or tested in this documentation-only step.

## Acceptance gate

SoSoValue remains a cross-check candidate until authenticated history, dates, units, ≥5 recent trading days, revision behavior and retention terms are checked. No live BTC capture, production database write, runtime registry/source-priority change, scenario evaluation, scenario-state change or deployment is authorized by this report.

## Result

**Documentation-first stage complete; authenticated data validation remains pending.** The next action is to run a bounded, read-only test with the key supplied securely through an environment secret, then record measured history depth and response semantics.

## Authenticated read-only check — completed 2026-10-17

GitHub Actions [SoSoValue BTC ETF API Check #39019097937](https://github.com/olegsh247-stack/Crypto/actions/runs/39019097937) completed successfully on commit `33220fdf3580546c7efe7e1c06507ed298ffabcd`. The `SOSOVALUE_API_KEY` secret was present (the value was not printed); one GET request to the documented endpoint returned HTTP 200. No database access, production writes, or scenario changes occurred.

Request window: `2026-09-18` through `2026-10-17`, `symbol=BTC`, `country_code=US`, `limit=300`. The endpoint returned 21 rows, earliest `2026-09-18`, latest `2026-10-16`; all 21 reporting dates were unique, and all 21 `total_net_inflow` values were numeric. The response contained `date`, `total_net_inflow`, `total_value_traded`, `total_net_assets`, and `cum_net_inflow`. The observed response SHA-256 was `6fe2f5e5c57b6d9a30ca28ccd698c2011d593ea8c496c0df9d2c413ef9b2cfb5`. Raw response and manifest are held only in a 3-day Actions review artifact, not committed to the repository.

Official endpoint documentation confirms that `total_net_inflow` is USD, negative values indicate net outflow, `date` is the trading date (`yyyy-MM-dd`), newest rows come first, non-trading days are excluded, and the endpoint only supports the most recent one month. Therefore this endpoint does **not** satisfy the full-history requirement for all ETF holdings; it is a short rolling summary-history feed.

Latest five returned sessions (USD million/day, converted from documented USD values):

| Trading date | SoSoValue net flow |
|---|---:|
| 2026-10-16 | -82.389 |
| 2026-10-15 | +5.055 |
| 2026-10-14 | -261.462 |
| 2026-10-13 | +175.617 |
| 2026-10-12 | -65.401 |
| **Five-session sum** | **-228.580** |

Cross-check: for 2026-10-07 SoSoValue returned `-487.0674115` USD million, which rounds to `-487.1m` and matches the previously observed TFTC total at displayed precision; the previously observed Farside total was `-484.9m`. This supports keeping both source observations and the discrepancy visible; it does not establish which source is authoritative.

## Remaining acceptance blockers

- Only a one-month rolling history is documented; no full historical archive was demonstrated.
- The endpoint response has no publication timestamp or revision/finality indicator. The response hash is a baseline only; a later repeated capture is needed to detect corrections, and a changed hash alone does not identify which row changed.
- Five recent trading sessions are present, but freshness should be checked again after the next US trading-session publication.
- The API endpoint documentation establishes the data schema and programmatic access; it does not, by itself, settle long-term archival or redistribution rights. Keep raw captures short-lived and internal until applicable API terms are reviewed.

**Decision:** authenticated access and the one-month summary schema are verified. SoSoValue remains a daily **cross-check candidate only**, not canonical ingestion and not an ETF-holdings archive. No registry or metric priority was changed.
