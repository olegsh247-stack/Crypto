# External Integration Policy

**Status:** mandatory for all new and existing external integrations  
**Applies to:** data sources, APIs, websites, SDKs, libraries, cloud/hosting/database services, auth, storage, CI/CD, and automation  
**Required before implementation, repair, or operational use.**

## 1. Required sequence

1. **Find and read official documentation first.** Start with the provider's official developer docs, API reference, access guide, terms/licensing, changelog/deprecation notices, and status page where relevant. Search results, examples, community posts, SDK code, and the page's visible data are secondary evidence—not a substitute for official documentation.
2. **Record the documentation review.** Capture official URLs, date reviewed, the exact documented product/endpoint/version, and the integration purpose in the relevant source registry or project decision note. If no official API/specification exists, state that plainly. Do not infer an API from an ordinary website.
3. **Establish the contract before coding.** Verify:
   - supported access method and endpoint/host;
   - auth, account/plan requirements, and required permissions;
   - terms of service, licensing, redistribution/storage limits, and attribution;
   - quotas, rate limits, request frequency, pagination, and backoff/retry guidance;
   - response format/schema, units, sign conventions, precision, identifiers, and error payloads;
   - timestamp meanings (event/observation/publication/retrieval), timezone, calendar, revisions and historical corrections;
   - freshness expectations, source lineage, availability/status, versioning and deprecation;
   - secret handling, data minimization, and security requirements;
   - access from the actual intended environment (local development, GitHub Actions, and/or VPS).
4. **Test safely and separately.** Start with read-only requests and sanitized fixtures. Test parser behavior on representative documented payloads, including missing fields, explicit zero, malformed data, changed schema, stale data, rate limits, and access errors. Never write to production as part of source discovery.
5. **Gate readiness.** Report each separately: (a) fixture/unit tests pass, (b) live provider access verified, (c) runtime/source registration verified, (d) end-to-end acceptance verified. Passing one does not imply the others.
6. **Document the decision and only then proceed.** Record blockers and their owners/approval needs. Keep the metric/provider disabled or blocked if an unknown affects correctness, authorization, or safety.

## 2. HTTP errors and source changes

- Treat 401/403 as an access/authentication/policy blocker until official documentation or provider support clarifies the intended access path.
- Do not evade access controls, impersonate a browser, rotate IPs/identities, use proxies, or build anti-bot workarounds unless the provider explicitly documents and authorizes the method.
- Treat 404 as a possible endpoint/version change and verify against official docs before changing URLs.
- Respect 429 and documented quotas; do not retry aggressively. Use documented retry/backoff rules for transient failures.
- Treat 5xx/timeouts as availability failures; preserve diagnostics and use bounded retries.
- Do not silently change to a mirror or a similarly named metric. Compare definitions, coverage, methodology, units, timestamp semantics, revisions and licensing; obtain project approval before changing the canonical source.
- Preserve raw payloads/hashes and retrieval metadata when allowed, without misrepresenting retrieval time as publication or observation time.

## 3. Evidence required in the repository

For each external integration, retain a durable record (in the source registry, integration note, or data contract) containing:

- provider/product and intended metric/capability;
- official documentation and terms links, review date, and version/access plan;
- endpoint and access/auth expectations;
- schema/units/time semantics/freshness/error behavior;
- tested environments and the date/result of live access checks;
- source priority, fallback policy, known limitations and unresolved blockers;
- validation tests and readiness status.

If official documentation is absent or ambiguous, contact the provider or seek project-owner approval for a constrained research-only experiment. Do not promote undocumented behavior to a canonical production dependency.

## 4. Farside BTC ETF source review (2026-10-14)

Official source pages reviewed:

- [Bitcoin ETF Flow – All Data](https://farside.co.uk/bitcoin-etf-flow-all-data/)
- [Bitcoin ETF Flow](https://farside.co.uk/btc/)
- [Farside team/contact page](https://farside.co.uk/team/)

The published all-data page describes the table as automatically generated in real time and includes a disclaimer that Farside is not liable for errors or inaccuracies. It presents a dated table in US$ millions with fund columns and a Total column; dashes appear in cells and must not be coerced to numeric zero. The pages reviewed do **not** provide a public API specification, documented machine-access endpoint, per-row publication timestamp contract, or explicit scraping/access policy. Therefore, do not assume a supported API or infer source publication time from HTTP retrieval time.

GitHub Actions read-only capture on 2026-10-14 returned HTTP 403 for both the legacy page route and the all-data route. Search/index access to a rendered page does not establish that automated retrieval is authorized or available. Do not bypass the 403 or designate TFTC as canonical just because its endpoint is accessible. ETF flow remains blocked for scenario use until Farside's intended machine-access method and relevant usage terms are clarified, the source can be accessed through an authorized route, and parser/schema/freshness/runtime acceptance are verified. If necessary, use the provider's contact channel to ask for an approved data-access method.

This review is not permission to activate ETF data or write to production.
