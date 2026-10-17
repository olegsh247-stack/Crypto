# DXY provider probe — actual responses — 2026-10-17

## Capture metadata

- Workflow: [DXY Public Source Probe (Read Only) #39029711852](https://github.com/olegsh247-stack/Crypto/actions/runs/39029711852)
- Captured at: `2026-10-17T11:42:19.053180Z`
- Mode: direct HTTP GETs from a GitHub Actions runner; no API credentials; no database writes.
- Artifact: [dxy-public-source-probe](https://github.com/olegsh247-stack/Crypto/actions/runs/39029711852/artifacts/12099577539), 50,716 bytes, SHA-256 `82da3b080a8021f0bcffd13143ee3f5756a20bb858cc1e27081b1919fe282b02`, expires 2026-10-24 11:42:21 UTC. Raw response files and a parsed report are in the artifact; not committed to Git.

## Actual request results

| Source / exact request | HTTP result | Returned data / evidence | DXY conclusion |
|---|---:|---|---|
| Yahoo Finance chart: `query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=5d&interval=1d` | 200, JSON, 1,707 bytes | Instrument `DX-Y.NYB`, currency USD. `regularMarketPrice=101.779`; source market time `2026-10-16T20:59:59Z`; last daily candle close `101.8399963` (candle timestamp epoch corresponds to 2026-10-16 04:00Z). Response SHA-256 `5bbceb331b8dc3be4e1e7fbcf90ca5329f1ba62cdd83d9f6a53d93f9c8f1f757`. | **Actual DXY quote retrieved.** Daily observation is the completed Friday session; the regular-market quote timestamp is explicit. This confirms technical accessibility, not permission to automate/retain/redistribute. |
| Alpha Vantage: `function=INDEX_DATA&symbol=DXY&interval=daily&apikey=demo` | 200, JSON, 220 bytes | Response says the demo key is for demo purposes only and asks for a real API key. SHA-256 `e8ddc218d89ff77ad7e395782b4c4d28d10d328ae90c3ba597a8e7d3689b9585`. | **No DXY value returned.** |
| Alpha Vantage index catalogue: `function=INDEX_CATALOG&apikey=demo` | 200, JSON, 18,352 bytes | Catalogue returned, but exact search over symbol/name fields found **zero** matches for DXY or Dollar Index. SHA-256 `d30b409a7263ea2c39b412b1770b3657a14c06f8a813691e2454d3289016cd54`. | No catalogue evidence that this API's index catalogue serves DXY. Its index-data endpoint is documented as premium. |
| FXMacroData: `https://api.fxmacrodata.com/v1/data_catalogue/usd` | 200, JSON, 113,981 bytes | Catalogue contains Federal Reserve's `broad_dollar_index`, `afe_dollar_index`, `eme_dollar_index` and BIS `trade_weighted_index`. Metadata says broad Fed index latest available date 2026-10-09, daily, Jan 2006=100. Its own `standardization_note` explicitly says the Fed series and BIS series are **not** ICE DXY and must not be spliced or compared level-for-level. No DXY instrument was present. SHA-256 `e1e14bf1f59c68015c993464797062cb9e78d4acd31b0235bf2848a3deedcaa3`. | A real no-key catalogue response, but it identifies other dollar indices, **not DXY**. The catalogue response does not itself return the latest index value. |
| Live-Rates: `https://www.live-rates.com/api/rates` without a key | 200, JSON, 36 bytes | Body: `[{"error":"Invalid Authentication"}]`. No instruments were returned. SHA-256 `be4fe8174e300459bc567b4960d05da6cfc1a572d18622cfe227d2dd471f94f1`. | **No quote received.** Despite the public page's keyless-tier claim, this actual endpoint request rejected unauthenticated access at capture time. No DXY row can be asserted. |
| FRED public CSV: `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS` | 200, CSV, 104,637 bytes | Latest row: `2026-10-09,121.6023`; daily nominal broad dollar index, Jan 2006=100. SHA-256 `a7b6e593bf1c9dd6c4601c1bd52de979b148eb2e98679ce1cafcda789f372d59`. | **Actual data retrieved, but not DXY.** It is a distinct Federal Reserve broad-dollar index; do not substitute under DXY identity. |

## Outcome

1. The only actual ICE DXY quote retrieved without a user API key was Yahoo Finance's `DX-Y.NYB` chart endpoint (HTTP 200). The value was 101.779 at source time 2026-10-16 20:59:59 UTC; the last daily candle close was about 101.84 for 2026-10-16.
2. Alpha Vantage returned no DXY data with its demo key and its public index catalogue contains no DXY/Dollar Index match. A valid user key would be needed to test the premium endpoint; this probe does not prove what a paid subscription might unlock.
3. FXMacroData returned a large USD data catalogue, but only distinct Fed/BIS dollar-index series were identified; no ICE DXY.
4. Live-Rates returned `Invalid Authentication` for the unauthenticated API request, so its public keyless claim was not borne out by this actual request. Do not count it as a usable no-key source unless a new successful response proves otherwise.
5. FRED's CSV works without an API key, but the series is a different broad dollar index.

**Operational decision:** do not create keys or promote any provider automatically based on this probe. Yahoo is the sole technically successful direct DXY retrieval in this five-provider test; legal permission for automated collection and raw retention remains unresolved, so this result is evidence only and does not approve production collection. No runtime source-priority change, DB write, scenario evaluation/state change, deployment, or merge occurred.
