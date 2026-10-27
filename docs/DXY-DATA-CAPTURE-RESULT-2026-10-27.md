# DXY candidate data capture — 2026-10-27

## Result

A read-only GitHub Actions capture succeeded on a GitHub-hosted runner. No production database, source registry, runtime priority, or scenario state was changed.

- Workflow run: https://github.com/olegsh247-stack/Crypto/actions/runs/40467835838
- Artifact (raw responses + manifest; retained 7 days): https://github.com/olegsh247-stack/Crypto/actions/runs/40467835838/artifacts/12717615675
- Capture time: 2026-10-27T07:33:40Z to 2026-10-27T07:33:41Z
- Artifact ZIP SHA-256: `20f6f3b6d445c5e0892665ee54f6f4fe68c6fa58fd35ef0290148fd354883f28`

## Source observations

| Source | Result | Freshness / identity | Raw response SHA-256 |
|---|---|---|---|
| Yahoo Finance chart `DX-Y.NYB`, 1-hour interval | HTTP 200; parsed. Provider metadata reports `longName=US Dollar Index`, `shortName=ICE US Dollar Index - Index - C`, `exchangeName=NYB`, `fullExchangeName=ICE Futures`; `regularMarketPrice=102.128`, `regularMarketTime` corresponds to 2026-10-27 07:23:38 UTC. | Best current candidate in this capture. Latest hourly observation timestamp is 2026-10-27T07:23:38Z; retrieved 2026-10-27T07:33:40.068Z (~10 minutes later). Treat as provider-reported ICE US Dollar Index, not exchange-verified. | `1056a94e604d8786b05beef57f73363fe97bd032e35a128964f9267934a6a439` |
| exchangerate.dev reconstructed DXY | HTTP 200; parsed value **102.154912**. | Explicitly reconstructed six-currency index, not official ICE DXY. Provider `data_updated_at=2026-10-27T07:17:59Z`; retrieved 2026-10-27T07:33:40.271Z (~16 minutes later). Provider says `stale=false`. | `d335305fb46dc497d3406fa090287b6bb29e89d02f612f3b1d7629896624a640` |
| Stooq `dx.f` candidate | HTTP 403. | Dropped for this capture; do not retry as a blocking source. | `a713d8bf53ff4362f0f6df7c3a301e7d703dbb02d74fe2f74d203e6f0fb5962c` |
| FRED `DTWEXBGS` | HTTP 200; latest available rows: 2026-10-19 121.3248; 2026-10-20 121.1160; 2026-10-21 121.3422; 2026-10-22 121.3531; 2026-10-23 121.3202. | This is a daily nominal broad US dollar index, **not DXY**. Last observation in this response is 2026-10-23, so use only as a separately labeled slower proxy. | `8080a7d962c8e8976e4394a5dbdb2e4a2ddb984c1c5aefc581aa42b715fd6932` |

## Decision for research capture

1. Use Yahoo `DX-Y.NYB` as the current market-DXY candidate for the research-only capture, retaining the full raw response, observation timestamp, retrieval timestamp, provider metadata, and hash.
2. Keep exchangerate.dev as a separately labeled reconstruction/cross-check. Do not average it with Yahoo or silently substitute it under the official DXY name.
3. Drop Stooq `dx.f` for now because the endpoint returned HTTP 403.
4. Keep FRED `DTWEXBGS` only as a daily broad-dollar proxy; it is not a substitute for DXY.
5. This is a successful source-acquisition test, not approval for production ingestion or a source-registry/runtime-priority change. DXY remains optional supporting context for the first BTC scenario.
