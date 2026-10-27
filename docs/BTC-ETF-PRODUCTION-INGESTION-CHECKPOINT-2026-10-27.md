# ETF session freshness and revision gate — implementation checkpoint (2026-10-27)

**Status: research/test contract only. ETF remains blocked from production ingestion.**

## Implemented in this change

- Added `scripts/assess-btc-etf-session-freshness.mjs`: resolves the latest completed U.S. ETF session using the versioned 2026–2028 calendar, New York timezone, regular 16:00 close, early closes, weekends, and full closures.
- Added deterministic tests for pre-/post-close behavior, Thanksgiving, early close, incomplete rows, and the missing publication-window policy.
- Freshness is measured against the expected session date and a reviewed, explicit session-lag policy—not a generic elapsed-hour threshold.
- Added `data/CryptoDataModel/calendars/btc-etf-publication-freshness-policy.json`. Farside's official page says updates are in real time and typically occur in the US evening/night. The operational rule allows a 12-hour post-close grace period spanning midnight, then requires a complete reconciled row no more than one scheduled trading session behind. This is a conservative local acceptance threshold, not a provider guarantee.
- The helper never fabricates `observed_at`; exact provider publication timestamps remain unknown. Missing/incomplete rows are never treated as zero.
- Added `scripts/capture-etf-source-evidence.mjs` to hash the exact HTTP response-body bytes from official NYSE and Nasdaq calendar pages and the Farside ETF page, preserving retrieval time, status, final URL, content type and SHA-256 in the read-only CI artifact. These hashes are per-capture evidence and do not alter production state.

## Revision policy

Farside remains the priority research source; SoSoValue is comparison-only; TFTC is supplemental and may overlap in lineage. No averaging and no automatic source substitution. Each capture is immutable evidence identified by retrieval timestamp and SHA-256. If a row changes, preserve both old and new row values/status and both enclosing payload hashes; classify the change for review. A placeholder-to-reported transition is a status transition, not proof that an earlier zero was real. No silent overwrite.

The existing snapshot comparator already detects changed overlapping rows, added/removed sessions, and payload-hash changes. Its output is review-only and must not be interpreted as finality or ingestion approval.

## Remaining production blockers

1. Capture and record SHA-256 hashes of the exact upstream NYSE/Nasdaq calendar payloads (the normalized fixture's current metadata explicitly says these hashes are not captured).
2. Review and document Farside's publication-window convention from evidence; until then session freshness intentionally fails closed.
3. Exercise the revision policy against an actual provider revision when one occurs; synthetic regression tests only verify behavior.
4. Prove durable storage, independent retrieval, and backup restore on the user's own infrastructure. CI artifacts are not durable operational storage evidence.
5. Only after the above: rerun the full readiness gate and offline BTC scenario. No registry/runtime source-priority changes or production ingestion are part of this patch.

## Safety boundary

No production DB writes, live ingestion, registry/runtime source-priority changes, scenario-state/probability persistence, deployment, or merge.
