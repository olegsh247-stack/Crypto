# DXY candidate data capture — 2026-10-27

## Result

A read-only GitHub Actions capture succeeded on a GitHub-hosted runner. No production database, source registry, runtime priority, or scenario state was changed.

- First run: https://github.com/olegsh247-stack/Crypto/actions/runs/40467835838
- First artifact: https://github.com/olegsh247-stack/Crypto/actions/runs/40467835838/artifacts/12717615675
- First capture time: 2026-10-27T07:33:40Z to 2026-10-27T07:33:41Z
- First artifact ZIP SHA-256: `20f6f3b6d445c5e0892665ee54f6f4fe68c6fa58fd35ef0290148fd354883f28`

## Repeat capture

- Workflow run: https://github.com/olegsh247-stack/Crypto/actions/runs/40468277270
- Artifact (raw responses + manifest; retained 7 days): https://github.com/olegsh247-stack/Crypto/actions/runs/40468277270/artifacts/12717128711
- Capture time: 2026-10-27T07:38:02Z to 2026-10-27T07:38:03Z
- Artifact ZIP SHA-256: `71999d7d0e0ffe2e2c1870c593f7f965fbefcadec7e7376bbb0f0637cd039c5b`

| Source | First capture | Repeat capture | Result |
|---|---|---|---|
| Yahoo Finance `DX-Y.NYB` | 102.128; provider market time 07:23:38Z; retrieved 07:33:40.068Z; raw SHA-256 `1056a94e604d8786b05beef57f73363fe97bd032e35a128964f9267934a6a439` | 102.127; provider market time 07:27:59Z; retrieved 07:38:02.163Z; raw SHA-256 `636228127b55bdca61671a79e9b6f8c17081222029220bcc4da983f60a777a48` | **PASS** — fresh provider observations on both captures, prices differ by 0.001 index points. |
| exchangerate.dev reconstructed DXY | 102.154912; data updated 07:17:59Z; retrieved 07:33:40.271Z; raw SHA-256 `d335305fb46dc497d3406fa090287b6bb29e89d02f612f3b1d7629896624a640` | 102.135058; data updated 07:22:59Z; retrieved 07:38:02.298Z; raw SHA-256 `d9b6a1c09b2f6010dd838e7ca8462545a57d9ceb5797a2d85c8788cb73626e04` | **PASS as separate cross-check** — updated reconstruction; not official ICE DXY. |
| Stooq `dx.f` | HTTP 403; raw SHA-256 `a713d8bf53ff4362f0f6df7c3a301e7d703dbb02d74fe2f74d203e6f0fb5962c` | HTTP 403; same raw SHA-256 | **DROP** — endpoint remains unavailable; no further retries planned. |
| FRED `DTWEXBGS` | HTTP 200; last rows through 2026-10-23; raw SHA-256 `8080a7d962c8e8976e4394a5dbdb2e4a2ddb984c1c5aefc581aa42b715fd6932` | HTTP 200; same last rows and same raw SHA-256 | **PASS only as daily broad-dollar proxy**, not DXY. |

## Source decision

1. Use Yahoo `DX-Y.NYB` as the primary *research-capture candidate* for market DXY. Preserve raw response, provider observation time, retrieval time, metadata, and SHA-256.
2. Keep exchangerate.dev as a separately named reconstruction/cross-check. Do not average it with Yahoo or label it official DXY.
3. Drop Stooq `dx.f` because it returned HTTP 403 twice.
4. Keep FRED `DTWEXBGS` only as a daily broad-dollar proxy; do not substitute it for DXY.
5. Repeat capture verifies that the data path is reproducible and refreshes. This does not approve production ingestion or change source-registry/runtime priority. DXY remains optional supporting context for the first BTC scenario.
