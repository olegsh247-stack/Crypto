import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const targets = [
  { id: "nyse-hours-calendars", url: "https://www.nyse.com/trade/hours-calendars" },
  { id: "nasdaq-us-equity-calendar", url: "https://nasdaqtrader.com/Trader.aspx?id=Calendar" },
  { id: "nyse-2026-yearly-trading-calendar-pdf", url: "https://www.nyse.com/publicdocs/nyse/ICE_NYSE_2026_Yearly_Trading_Calendar.pdf" },
  { id: "farside-btc-etf-all-data-page", url: "https://farside.co.uk/bitcoin-etf-flow-all-data/" }
];
const outDir = "tmp/btc-source-review/calendar-source-evidence";
await mkdir(outDir, { recursive: true });
const retrievedAt = new Date().toISOString();
const records = [];
for (const target of targets) {
  try {
    const response = await fetch(target.url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    const record = {
      source_id: target.id,
      requested_url: target.url,
      final_url: response.url,
      retrieved_at: retrievedAt,
      http_status: response.status,
      content_type: response.headers.get("content-type"),
      body_bytes: bytes.length,
      body_sha256: createHash("sha256").update(bytes).digest("hex"),
      capture_encoding: "HTTP response body bytes; SHA-256 computed before text decoding",
      status: response.ok ? "CAPTURED" : "HTTP_ERROR"
    };
    records.push(record);
    await writeFile(join(outDir, `${target.id}.body`), bytes);
    console.log(JSON.stringify(record));
  } catch (error) {
    const record = {
      source_id: target.id, requested_url: target.url, retrieved_at: retrievedAt,
      status: "CAPTURE_ERROR", error: String(error)
    };
    records.push(record);
    console.log(JSON.stringify(record));
  }
}
const manifest = {
  schema_version: "1.0",
  retrieved_at: retrievedAt,
  purpose: "Read-only source provenance; not production ingestion",
  records
};
await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
if (records.some(record => record.status !== "CAPTURED")) process.exitCode = 1;
