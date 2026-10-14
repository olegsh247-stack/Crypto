# BTC Block-Window Capture Hardening

**Date:** 2026-10-13  
**Scope:** Read-only BTC candidate capture; no production ingestion.

## What changed

A separate capture path was added so the candidate window can be validated without merging the broad, divergent source-capture branch.

- Captures the initial Mempool.space tip height and hash.
- Fetches 330 recent individual blocks in 22 bounded pages of 15, providing a buffer around the latest completed UTC day.
- Preserves every raw response and its URL, retrieval time, HTTP status, content type, and SHA-256 digest.
- Rejects malformed pages, missing/unexpected heights, duplicate heights or hashes, invalid fields, subsidy mismatches, timestamp checks, and a changed tip anchor.
- Derives expected subsidy from block height using the 210,000-block halving schedule.
- Computes both a latest-144-block diagnostic candidate and a completed UTC-day candidate only after the 330-block validation set passes. The UTC-day calculation requires at least a six-hour timestamp buffer before and after the day boundaries.
- Writes local review artifacts under `tmp/btc-block-window-review`; does not access PostgreSQL or mutate product state.

## Deterministic checks

Run with Node.js 20 or later:

```sh
node --check scripts/capture-btc-block-window.mjs
node --test scripts/btc-block-window-validation.test.mjs
```

The tests cover halving boundaries, invalid heights, complete page height ranges, duplicate/gapped pages, and tip-anchor changes.

## Interpretation and limits

A successful capture is labelled `PASS_CANDIDATE_ONLY`, not production accepted. The canonical metric registry declares frequency `1d`, so the completed UTC-day candidate is the recommended persisted-observation contract. The rolling 144-block ratio remains a diagnostic candidate unless the canonical metric and monitoring contracts are deliberately revised. Both values remain candidate-only; this branch does not update the canonical metric registry, source registry, monitoring matrix, probabilities, scenario state, or database.

The capture intentionally fails closed if the tip height or hash changes during collection. In that case, preserve the manifest/raw pages and rerun later; do not force a candidate through.

## Next gates

1. Run the deterministic tests and script syntax check in CI.
2. Review the live capture artifact and both candidate calculations, including exact UTC-day boundary coverage.
3. Confirm API field units against a pinned upstream implementation/version and known fixtures; record the chosen UTC-day contract in metric/source/monitoring documentation before accepting any observation.
4. Keep BTC scenario readiness at `not_evaluable` until all required inputs and contracts are accepted.
