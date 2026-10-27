import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const outDir = "tmp/dxy-source-review";
await mkdir(outDir, { recursive: true });

const sources = [
  {
    id: "yahoo_ice_dxy",
    url: "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=5d&interval=1h",
    parse(body) {
      const j = JSON.parse(body);
      const result = j?.chart?.result?.[0];
      if (!result?.timestamp?.length) throw new Error("Yahoo response has no chart observations");
      const quote = result.indicators?.quote?.[0];
      const rows = result.timestamp.map((ts, i) => ({
        observation_time_utc: new Date(ts * 1000).toISOString(),
        close: quote?.close?.[i] ?? null,
        open: quote?.open?.[i] ?? null,
        high: quote?.high?.[i] ?? null,
        low: quote?.low?.[i] ?? null,
        volume: quote?.volume?.[i] ?? null
      })).filter(x => x.close !== null);
      if (!rows.length) throw new Error("Yahoo response has no non-null close values");
      return { series: "DX-Y.NYB (Yahoo symbol; provider metadata required before treating as official ICE DXY)", currency_or_unit: "index points", meta: result.meta, observations: rows };
    }
  },
  {
    id: "exchangerate_dev_reconstructed_dxy",
    url: "https://api.exchangerate.dev/v1/indices/dxy-reconstructed",
    parse(body) {
      const j = JSON.parse(body);
      const root = j?.data ?? j;
      const value = root?.value ?? root?.dxy ?? root?.index;
      if (!(typeof value === "number" || (typeof value === "string" && Number.isFinite(Number(value))))) {
        throw new Error("No numeric DXY reconstruction value in response");
      }
      return { series: "reconstructed DXY (not official ICE index)", currency_or_unit: "index points", payload: j };
    }
  },
  {
    id: "stooq_dxy_candidate",
    url: "https://stooq.com/q/d/l/?s=dx.f&i=d",
    parse(body) {
      const lines = body.trim().split(/\r?\n/);
      if (lines.length < 2 || !/^Date,/.test(lines[0])) throw new Error("Stooq CSV has no recognized daily observations");
      return { series: "Stooq DX.F candidate (instrument identity not independently confirmed)", currency_or_unit: "provider units; verify identity", latest_csv_rows: lines.slice(-6) };
    }
  },
  {
    id: "fred_broad_usd_proxy",
    url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS",
    parse(body) {
      const lines = body.trim().split(/\r?\n/);
      if (lines.length < 2 || !/^observation_date,/.test(lines[0])) throw new Error("FRED CSV has no recognized observations");
      const rows = lines.slice(1).filter(x => x && !x.endsWith(",.")).slice(-5);
      if (!rows.length) throw new Error("FRED CSV has no non-missing recent observations");
      return { series: "DTWEXBGS nominal broad US dollar index (not DXY)", currency_or_unit: "FRED index points", latest_csv_rows: rows };
    }
  }
];

const results = [];
for (const source of sources) {
  const retrievedAt = new Date().toISOString();
  let record = { source_id: source.id, url: source.url, retrieved_at_utc: retrievedAt };
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": "Crypto-project-read-only-source-review/1.0", "accept": "application/json,text/csv,*/*" },
      signal: AbortSignal.timeout(12000)
    });
    const body = await response.text();
    const hash = createHash("sha256").update(body).digest("hex");
    await writeFile(`${outDir}/${source.id}.raw.txt`, body);
    record = { ...record, http_status: response.status, final_url: response.url, content_type: response.headers.get("content-type"), response_sha256: hash, response_bytes: Buffer.byteLength(body) };
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = source.parse(body);
    record = { ...record, status: "parsed", parsed };
  } catch (error) {
    record = { ...record, status: "failed", error: String(error?.message ?? error) };
  }
  results.push(record);
  console.log(JSON.stringify(record));
}
const manifest = {
  captured_at_utc: new Date().toISOString(),
  mode: "read-only research capture; no registry, database, runtime priority, or scenario state changes",
  note: "Provider response availability and parseability are recorded separately from source identity/quality approval.",
  results
};
await writeFile(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
if (!results.some(x => x.status === "parsed")) process.exitCode = 1;
