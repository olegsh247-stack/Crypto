# BTC UTC-Day Fee/Subsidy Candidate Review — 2026-10-13

**Status:** candidate evidence passed validation; canonical acceptance remains pending.  
**Capture run:** [BTC Block Window Validation #38421354649](https://github.com/olegsh247-stack/Crypto/actions/runs/38421354649)  
**Artifact:** [btc-block-window-review-38421354649](https://github.com/olegsh247-stack/Crypto/actions/runs/38421354649/artifacts/11825714284)  
**Artifact SHA-256:** `dde8265c9ff0ac1791751d5907f95509c50b6dc64011ca8d05bcc4083beabdcc`

## 1. Capture integrity

- Capture interval: `2026-10-13T15:21:36.811Z`–`2026-10-13T15:21:40.501Z`.
- Source: Mempool.space public REST API over HTTPS.
- Tip anchor remained unchanged at height `971261`, hash `000000000000000000015a88be0889bec9e1959ffc22dc4d13d98681dd1dbcbc`.
- 22 pages returned HTTP 200 and JSON content; each page's raw-body SHA-256 was independently checked against the manifest.
- 330 unique, contiguous blocks validated: heights `970932–971261`.
- Missing heights, duplicate heights, duplicate hashes, future timestamp violations, and Median Time Past violations: all zero.
- Observed timestamp range: `2026-10-11T12:40:07Z`–`2026-10-13T15:18:51Z`, which provides more than six hours of buffer before and after the target UTC-day boundaries.
- Manifest status: `PASS_CANDIDATE_ONLY`; anchor recheck: `PASS`; error: none.

## 2. Completed UTC-day candidate

The repository metric registry declares `security.fee_subsidy_ratio` with `frequency: 1d`. For that reason, a completed UTC calendar day is the recommended persisted observation window; the rolling 144-block ratio remains a diagnostic unless the registry is intentionally revised.

| Field | Candidate result |
|---|---:|
| UTC day | 2026-10-12 00:00:00–2026-10-13 00:00:00 (end exclusive) |
| Blocks included | 152 |
| Height range | 971006–971157 |
| Total fees | 286,069,738 sats |
| Total subsidy | 47,500,000,000 sats |
| Fee/subsidy ratio | 0.0060225208 (about 0.602252%) |
| Production approval | No |

The daily candidate was independently recomputed from the normalized block evidence. The selected rows cover the full UTC day and form a contiguous height range. Fees and subsidy use the same included blocks.

## 3. Rolling 144-block diagnostic

| Field | Candidate result |
|---|---:|
| Height range | 971118–971261 |
| Total fees | 260,468,982 sats |
| Total subsidy | 45,000,000,000 sats |
| Fee/subsidy ratio | 0.0057881996 (about 0.578820%) |
| Production approval | No |

The daily candidate is approximately 4.05% higher than the rolling 144-block diagnostic. This difference is expected to be possible because the two windows contain different blocks and are not interchangeable observations. It is not evidence of a trend by itself.


## Source-field semantics cross-check

The Mempool.space implementation was reviewed at a pinned upstream commit: [`backend/src/api/blocks.ts` at `7e790680`](https://github.com/mempool/mempool/blob/7e79068004e97ecc73415f4c0b1a5aeab347faa0/backend/src/api/blocks.ts). The code assigns `extras.reward` from the sum of coinbase transaction outputs and `extras.totalFees` from the block statistics `totalfee` field. The corresponding frontend displays both fields using its satoshi amount component and converts reward from satoshis to BTC when deriving fees. This supports interpreting both raw values as satoshis for this API implementation version.

This cross-check is version-pinned source evidence, not a guarantee that the public API can never change. The capture's invariant `reward - totalFees = expected subsidy at block height` passed for all 330 blocks and is retained as an independent consistency check.

## 4. Contract decision recommendation

**Recommended contract:** one observation per completed UTC calendar day, using each included block's source timestamp in UTC; calculate `sum(block fees in sats) / sum(expected block subsidy in sats)` over the exact same included block set. Persist the logical observation identity by the UTC date, not by fetch time. Keep the rolling 144-block result diagnostic-only.

Before canonical acceptance, the project still needs to document this formula and timestamp rule consistently in the metric/source/monitoring contracts, confirm Mempool.space field semantics against a pinned upstream contract or known fixture, and run the observation idempotency/dry-run review. This document records a recommendation and a reproducible candidate, not an approved registry change.

## 5. Safety boundary

No production database was accessed or changed. No observation, historical row, registry, monitoring event, scenario state, score, probability, or published snapshot was written. Both values are `CANDIDATE_ONLY_NOT_ACCEPTED`; BTC remains `not_evaluable`.


## Official Mempool API documentation review — 2026-10-14

Reviewed the provider's [official REST API documentation](https://mempool.space/docs/api/rest) before relying on the source contract. The docs describe mining endpoints for aggregate reward/fee statistics, but the exact block-page response contract used by this capture (`GET /api/v1/blocks/:startHeight`, including `extras.totalFees` and `extras.reward`) is not fully specified in the REST reference page reviewed. The field semantics were therefore cross-checked separately against the pinned upstream implementation linked above, rather than inferred from similarly named aggregate endpoints.

### Reviewed integration facts and limits

- Intended runtime access method: unauthenticated HTTPS GET to the public Mempool.space REST host; no credentials are used by the candidate capture.
- Captured endpoint family: `/api/blocks/tip/height`, `/api/blocks/tip/hash`, and `/api/v1/blocks/:startHeight`.
- Current implementation assumptions: block-page entries contain integer `height`, block hash `id`, Unix-seconds `timestamp`, and `extras.totalFees` / `extras.reward` expressed in satoshis. The capture validates these assumptions and checks `reward - totalFees` against the consensus subsidy expected at that height.
- The REST documentation reviewed does not establish a durable per-response publication timestamp, a guaranteed service-level availability contract, or an endpoint-specific request quota for this use. Capture time is retained as retrieval time only; it is not misrepresented as source observation time.
- The provider docs reviewed do not by themselves establish permission to redistribute or indefinitely republish captured payloads. Raw response retention here is limited to local candidate evidence/artifacts; licensing/retention terms must be checked before making this a public hosted data product.
- The capture uses sequential GET requests with a timeout and fails closed on non-200 status, unexpected content type, malformed values, missing/duplicate heights, duplicate hashes, inconsistent reward/subsidy, or a changed tip anchor. It currently does not implement a retry loop; a failed request fails the candidate run rather than silently falling back.
- Live capture and deterministic validation prove a reproducible candidate, not a production adapter or target-database registration. No production source activation or database write is authorized.

### Decision

The official documentation review supports continuing the read-only candidate path, with the pinned implementation serving as supplemental field-semantics evidence. It does **not** by itself close production access/terms, runtime registration, or ingestion acceptance. Keep the UTC-day ratio as the proposed persisted contract aligned with `frequency: 1d`; keep rolling 144-block values diagnostic-only until the metric contract is formally reconciled. No registry, database, scenario, monitoring or published snapshot state was changed by this documentation review.
