# BTC Block-Window Capture Hardening

**Date:** 2026-10-13  
**Scope:** Read-only BTC candidate capture; no production ingestion.

## What changed

A separate capture path was added so the candidate window can be validated without merging the broad, divergent source-capture branch.

- Captures the initial Mempool.space tip height and hash.
- Fetches 165 recent individual blocks in 11 bounded pages of 15.
- Preserves every raw response and its URL, retrieval time, HTTP status, content type, and SHA-256 digest.
- Rejects malformed pages, missing/unexpected heights, duplicate heights or hashes, invalid fields, subsidy mismatches, timestamp checks, and a changed tip anchor.
- Derives expected subsidy from block height using the 210,000-block halving schedule.
- Computes a separate latest-144-block candidate only after the 165-block validation set passes.
- Writes local review artifacts under `tmp/btc-block-window-review`; does not access PostgreSQL or mutate product state.

## Deterministic checks

Run with Node.js 20 or later:

```sh
node --check scripts/capture-btc-block-window.mjs
node --test scripts/btc-block-window-validation.test.mjs
```

The tests cover halving boundaries, invalid heights, complete page height ranges, duplicate/gapped pages, and tip-anchor changes.

## Interpretation and limits

A successful capture is labelled `PASS_CANDIDATE_ONLY`, not production accepted. The metric contract still has an unresolved conflict between a completed UTC-day definition and a rolling 144-block definition. This branch implements the rolling-window proposal only as a candidate rehearsal; it does not update the canonical metric registry, source registry, monitoring matrix, probabilities, scenario state, or database.

The capture intentionally fails closed if the tip height or hash changes during collection. In that case, preserve the manifest/raw pages and rerun later; do not force a candidate through.

## Next gates

1. Run the deterministic tests and script syntax check in CI.
2. Review a live read-only capture result and its manifest; confirm API field units against a pinned upstream implementation/version and known fixtures.
3. Decide the canonical metric window and align metric/source/monitoring contracts before accepting any observation.
4. Keep BTC scenario readiness at `not_evaluable` until all required inputs and contracts are accepted.
