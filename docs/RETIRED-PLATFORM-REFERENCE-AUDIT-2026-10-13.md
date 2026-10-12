# Retired Platform Reference Audit

Date: 2026-10-13

## Scope and conclusion

- The current tracked working tree was audited separately from Git history.
- At baseline commit `e6771976189a49f18152a2813e6134dbc59d58f2`, the current `main` tree had no matches for the retired-platform reference set used in the audit.
- A separate scan of historical Git blobs and commit messages found legacy references in prior revisions. Those references remain in repository history; no history rewrite or force-push is authorized by this audit.
- Ordinary terms such as `Workers` and `scheduled jobs` remain valid when they describe background jobs, not a retired hosting provider.

## Continuous verification

The repository gate is implemented by `scripts/check-vps-only-repository.mjs` and is run by `.github/workflows/vps-api-build.yml` as the `Verify repository is VPS-only` step.

The workflow triggers on every pull request, pushes to any branch, manual dispatch, and reusable workflow calls. The scanner examines repository paths and non-binary text files, excluding Git internals and generated/dependency directories. It intentionally checks the current working tree, not historical Git objects.

## Recorded evidence

- Main baseline: `e6771976189a49f18152a2813e6134dbc59d58f2`
- Main baseline build/rehearsal run: [38307186107](https://github.com/olegsh247-stack/Crypto/actions/runs/38307186107) — completed successfully; the repository gate step passed.
- Pull request gate run: [38306652115](https://github.com/olegsh247-stack/Crypto/actions/runs/38306652115) — completed successfully; the repository gate step passed.
- Workflow trigger policy was broadened in commit `c980e49d787ffbc251cd82d2775b2460aa9a29a3` so pushes to branches other than `main` also run the gate. The subsequent run on the audit-document commit is the final verification of this policy and current `main`.

## Decision

Keep Git history intact for now. Rewriting history is a separate destructive maintenance operation and is not required to keep the current tree clean. If a credential is ever found in historical content, revoke or rotate it independently; do not treat deleting a file from the current tree as secret revocation.
