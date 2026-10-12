# Worker London Day-Boundary Fix — 2026-10-13

## Finding

The current main implementation had a regex that matched a literal backslash before the digit class, so numeric UTC offsets such as GMT+01:00 were not parsed. It also sampled the offset at noon UTC, which can be on the other side of a daylight-saving transition from London midnight.

## Correction

- Parse numeric GMT offsets with the intended digit classes.
- Determine the offset at UTC midnight for the target London calendar date.
- Return directly for GMT and fail explicitly on unexpected offset formats rather than silently treating them as zero.
- Add regression tests for winter, summer, and both DST transition boundaries.
- Run Worker tests as part of the VPS API Build Rehearsal.

This patch changes only the London day-boundary conversion and its regression coverage. It does not change ingestion policy, database schema, source selection, scenario evaluation, production data, or deployment state.

## Validation

Validation is pending the current-main GitHub Actions run. No Worker deployment or production write is performed by this commit.
