# Repository-wide working rules

## Mandatory external-integration documentation gate

Before adding, changing, debugging, or relying on any external integration—API, website, data feed, SDK, package, database/cloud provider, authentication provider, storage, hosting service, or third-party automation—you MUST read the provider's official documentation first.

Follow `docs/EXTERNAL-INTEGRATION-POLICY.md`. Do not begin implementation or guess endpoints until the documentation review is recorded. If official docs/API specifications cannot be found, explicitly record that fact and treat undocumented behavior as unverified; do not pretend a public web page is an API specification.

A live HTTP error (including 401, 403, 404, 429, or 5xx) is evidence to investigate against the documented access model—not permission to bypass controls, rotate identities, spoof browser fingerprints, scrape through an unapproved mirror, or silently change providers. Do not substitute another provider or metric without documenting semantic equivalence and obtaining the required project approval.

For every integration, document source-of-truth links, review date, access/auth requirements, terms/licensing, rate limits, payload/schema, units, timestamps/time zones, freshness, errors/retries, pagination, versioning/deprecation, security/secrets, and validation in the actual target runtime (local/CI/VPS). If an item is not documented, label it unknown and fail closed where correctness depends on it.

Do not claim an integration is ready merely because unit tests pass. Distinguish fixture tests, live-source access, runtime registration, and production acceptance. Do not perform production writes, deploy/cut over, merge PRs, or alter scenario state without explicit user authorization.
