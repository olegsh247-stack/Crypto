# BTC ETF Two-Snapshot Acceptance — 2026-10-17

## Current Farside primary-source snapshot

Read-only capture: [BTC Public Source Staging run #39056347133](https://github.com/olegsh247-stack/Crypto/actions/runs/39056347133). Artifact is named `btc-public-source-review` and is retained for 7 days by the workflow.

- Official all-data URL: https://farside.co.uk/bitcoin-etf-flow-all-data/
- HTTP: `200`; captured at `2026-10-17T18:02:33.561Z`; HTTP Date header: `Sat, 17 Oct 2026 18:02:34 GMT`.
- Page-generated date: `2026-10-17`; latest reported session date: `2026-10-16`.
- Parsed dated rows: `710`; latest row has all 12 fund values present.
- Latest total: `-82.4 USD million/day`; calculated sum of fund rows: `-82.4 USD million/day`; reconciliation: `MATCHES_DISPLAY_ROUNDING`.
- Exact source payload SHA-256: `9a0b79f6b9605d9b3a0bcbac04a1116da10784399e731dd13835c5d76235cfe3`.
- HTTP `Last-Modified` and `ETag` were absent. The page date is not an exact publication or observation timestamp.

The regular Farside page endpoint returned HTTP 403 from the staging runner, but the official all-data page succeeded. The all-data URL is the captured canonical review endpoint for this gate; no source-priority or runtime registry was changed.

## Comparison procedure

The read-only utility `scripts/compare-btc-etf-snapshots.mjs` compares two saved `manifest.json` files. It validates source identity and capture chronology, enforces at least 24 hours between captures, compares overlapping dates per fund and aggregate, and reports added/removed rows and detected revisions. It never changes the raw values or silently substitutes TFTC/SoSoValue.

Example:

```bash
node scripts/compare-btc-etf-snapshots.mjs /path/to/older/manifest.json /path/to/newer/manifest.json
```

Expected report statuses:
- `BLOCKED_INTERVAL_UNDER_24H`: wait for a valid interval.
- `ROW_REVISIONS_DETECTED_REVIEW_REQUIRED`: inspect changed dates and retain both source payloads.
- `TWO_SNAPSHOT_COMPARISON_COMPLETE_NO_ROW_REVISIONS_DETECTED`: no overlapping-row changes were detected in the captured window.

A changed page hash without row changes is not a row revision. An unchanged row comparison does not prove the provider never revises data; it only describes the two observed snapshots. The comparison always remains review-only.

## Remaining acceptance gates

1. Capture a second successful Farside all-data snapshot at least 24 hours after the snapshot above.
2. Compare the two snapshots and review every changed row, including any changes to older overlapping rows.
3. Confirm archival/retention permissions for source payloads; keep source hashes and allowed evidence regardless of whether raw-page retention is permitted.
4. Approve a session-aware freshness rule based on U.S. trading sessions; do not invent `observed_at` from the reporting date or HTTP Date.
5. Keep TFTC as a control source only. No silent fallback or averaging.

**Status:** latest-session freshness evidence is now present, but canonical ETF acceptance remains blocked until the two-snapshot/revision/retention gates pass. BTC remains `not_evaluable`. No production DB access/writes, ingestion, scenario-state changes, or runtime registry changes occurred.
