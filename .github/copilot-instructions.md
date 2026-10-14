# Crypto repository instructions

Follow the repository-wide `/AGENTS.md` instructions and `docs/EXTERNAL-INTEGRATION-POLICY.md`.

**Mandatory first step for every external integration:** read the provider's official documentation before inspecting implementation details as the basis for a fix, guessing URLs, adding dependencies, or changing adapters. Record the official links and review date. Verify documented authentication, terms/licensing, rate limits, schema, units, timestamp semantics, freshness, error behavior, retries, pagination, versioning, secrets, and access from the intended runtime. Unknowns must remain explicit blockers.

Never bypass HTTP 403 or other access controls, spoof clients, or silently replace the canonical provider. A mirror is not equivalent without a documented semantic comparison and approval. Report separately: tests on fixtures, live provider access, runtime registration, and production acceptance. No production writes, deployment/cutover, PR merge, or scenario-state change without explicit authorization.
