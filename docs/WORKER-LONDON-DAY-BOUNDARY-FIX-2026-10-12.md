# Worker London Day-Boundary Fix — 2026-10-12

## Scope

This patch is limited to the conversion of a London calendar date to its UTC midnight instant in `vps/worker/src/scheduler.ts`, regression tests, and CI execution of those tests.

## Defect and correction

The previous offset parser used a regular expression that matched a literal backslash before `d`, so numeric offsets such as `GMT+01:00` did not match. It also sampled the offset at noon UTC, which can be the wrong side of a daylight-saving transition for the London date being converted.

The corrected function:
- parses numeric offsets with the intended digit classes;
- samples the offset at UTC midnight, which yields the offset needed for the target London date at midnight on the tested GMT/BST boundaries;
- fails explicitly on an unexpected offset representation instead of silently treating it as zero.

No ingestion policy, metric/source contract, database schema, scenario evaluation, persistence, scheduling time, or production deployment behavior was otherwise changed.

## Regression coverage

The test suite checks:
- a winter GMT date;
- a summer BST date;
- the spring DST transition date and the following date;
- the autumn DST transition date and the following date.

Expected boundary instants are asserted exactly in UTC. The VPS API Build Rehearsal now runs the Worker tests after compiling the Worker.

## Safety and status

Changes are on a dedicated branch and proposed in a pull request. No production data or secrets were accessed or modified. The Worker was not deployed, the PR was not merged, and no production state was written by this patch.
