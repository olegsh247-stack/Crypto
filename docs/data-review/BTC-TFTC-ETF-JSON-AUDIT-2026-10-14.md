# BTC ETF TFTC JSON candidate audit — 2026-10-14

**Decision: HOLD — not approved as canonical `institutional.etf_net_flow`.**  
**Purpose:** one-time audit of the captured source shape and semantics; not a recurring daily flow calculation.  
**Capture:** BTC Public Source Staging #63, 2026-10-14T17:36:39Z.  
**Artifact:** `btc-public-source-review` (run artifact ID `11916511968`; 7-day retention).  
**Endpoint:** `https://www.tftc.io/bitcoin-etf-flows/data.json`  
**Raw response SHA-256:** `7de15bff268133dffb3621da9f2355ff07204464bb0f53ecee073791dcccd51d`

## 1. Observed schema

- Top-level fields include `name`, `description`, `url`, `license`, `attribution`, `sources`, `units`, `updatedThrough`, and `days`.
- `days` contains 707 rows from `2024-01-11` through `2026-10-13`.
- Each row normally has `date`, `netFlowUsd`, `totalNetAssetsUsd`, `btcCloseUsd`, and `perEtfUsd`.
- The declared unit is `USD`, not the canonical metric unit `USD million/day`. A future reviewed parser would need to convert the aggregate `netFlowUsd` into millions of USD and retain the raw value and conversion method.
- `updatedThrough` is only a date (`2026-10-13`); it is not an observation/publication timestamp or a revision/finalization marker.
- The stated lineage is mixed: SoSoValue for daily aggregates and per-fund flows, Farside-tabulated issuer disclosures for per-fund history through mid-2026, and mempool.space for a BTC price reference around 21:00 UTC. This is useful attribution but not a row-level lineage/version contract.

## 2. One-time structural checks

| Check | Result |
|---|---|
| Rows | 707 |
| Duplicate dates in this snapshot | 0 |
| Weekend dates | 0 |
| Rows with numeric aggregate flow | 707 |
| Rows with per-fund breakdown | 691 |
| Rows with zero aggregate and no per-fund breakdown/assets | 16 |
| Per-fund sum differs from aggregate by more than $1 | 306 of the 691 rows with a breakdown |
| Rows with absolute per-fund/aggregate difference above $1 million | 33 |
| Largest observed absolute difference | $30,647,252.17 on 2026-04-08 |

The $1 difference threshold is a diagnostic, not an acceptance threshold; floating-point/rounding differences can produce tiny mismatches. The larger discrepancies are material: on 2026-04-08, the aggregate is `-$124,547,252.17`, while the sum of per-fund values is `-$93,900,000`. That discrepancy needs source-level explanation before the two fields can be treated as interchangeable.

The 16 zero rows have no `perEtfUsd` breakdown and no total assets. The JSON does not supply a per-row status that distinguishes a confirmed zero-flow trading session from a market holiday/unreported placeholder. They must not be ingested as confirmed zero flows merely because `netFlowUsd` is zero.

## 3. Timestamp, revision and source comparison blockers

- A row's `date` is a logical reporting/session date and can be considered for `period_start` only after the provider's session convention is approved.
- No row-level publication/observation timestamp is supplied. Manifest `retrieved_at` describes when the JSON was fetched and must not be substituted for `observed_at`.
- The snapshot does not expose a clear revision number, per-row updated timestamp, or finalization policy. Re-fetching the same date could revise historical values without a reliable revision identity.
- The canonical Farside page returned HTTP 403 from this GitHub runner during this capture. A previously reviewed Farside snapshot for 5–9 October differs from some TFTC aggregate values, including a material discrepancy on 7 October; this is unresolved cross-snapshot evidence, not proof that either snapshot is authoritative.
- TFTC's declared license and attribution are recorded, but those alone do not resolve mixed lineage, row revision semantics or reconciliation.

## 4. Required decision before promotion

1. Confirm the authority and effective date of each upstream source and explain historical lineage changes.
2. Define how holidays/unreported sessions are represented; zero must mean a confirmed zero, not missing data.
3. Define the canonical aggregate field and a tolerance/reconciliation policy for aggregate versus per-fund sums, with explicit treatment for material discrepancies.
4. Obtain a defensible observation/publication timestamp policy, plus revision/finalization semantics.
5. Define a stable logical row key (candidate form: `tftc:YYYY-MM-DD`) and how corrected rows increment `revision` without overwriting history.
6. Re-run the review against a captured immutable artifact. Only then consider a separate, explicit source-priority change.

**Current implementation:** the review-only mapper intentionally blocks TFTC ETF rows. It does not write observations or change source priority. BTC remains `not_evaluable`; the first scenario must not use these values yet.


## 5. Comparison with the previously staged Farside snapshot

The repository's Farside staging artifact was retrieved on 2026-10-12 and explicitly records date-only retrieval precision, `observed_at: null`, and a HOLD decision. Its rounded completed-session totals compare with the TFTC JSON snapshot captured on 2026-10-14 as follows:

| Session date | Farside staged value (USD million) | TFTC aggregate (USD million) | TFTC minus Farside (USD million) |
|---|---:|---:|---:|
| 2026-10-05 | -89.800000 | -89.897783 | -0.097783 |
| 2026-10-06 | 118.800000 | 118.862452 | 0.062452 |
| 2026-10-07 | -484.900000 | -487.067412 | -2.167412 |
| 2026-10-08 | -244.100000 | -244.125629 | -0.025629 |
| 2026-10-09 | 21.100000 | 21.128079 | 0.028079 |

Most differences are consistent with the display precision of the staged Farside totals, but 7 October differs by about **$2.17 million**. The Farside artifact is a prior snapshot, and the live Farside endpoint returned HTTP 403 from the current runner; this is therefore a cross-snapshot discrepancy that needs reconciliation, not a claim that one provider is definitively wrong. TFTC's per-fund values sum to its own aggregate for these five recent dates, but that does not establish agreement with Farside or prove source authority.

## 6. Component-level follow-up — 2026-10-14

A component-level review of the captured TFTC row and the previously staged Farside row narrows the 7 October difference:

| Field | Farside staged snapshot | TFTC captured JSON |
|---|---:|---:|
| BRRR | 0.0 USD million | -2.1 USD million |
| Displayed daily total | -484.9 USD million | -487.1 USD million |
| TFTC minus Farside total | — | -2.167412 USD million using TFTC's unrounded aggregate |

The BRRR row is therefore a plausible explanation for most of the difference: the -2.1 million BRRR component accounts for the majority of the -2.167 million aggregate delta, with the remainder consistent with displayed rounding/precision. The other listed fund components in the reviewed 7 October rows appear aligned at the displayed 0.1-million precision.

**This narrows the discrepancy but does not resolve source authority.** The comparison is between snapshots captured/retrieved at different times; the old Farside artifact does not include a provider publication timestamp or revision identity, and the live Farside endpoint was inaccessible from the GitHub runner. We cannot establish from these artifacts alone whether BRRR was revised, reported differently, or captured at a different source revision. Do not overwrite either value or promote TFTC based on this comparison.

This is a one-time source reconciliation, not a recurring daily calculation. The next meaningful step is to obtain a comparable, immutable Farside response (or an authorized primary-source row-level record) and retain its retrieval time, raw-body hash, reporting date, and any available publication/revision metadata. Until then, keep the ETF input blocked and BTC `not_evaluable`.
