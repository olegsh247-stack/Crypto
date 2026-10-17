#!/usr/bin/env node
/**
 * Bounded, read-only SoSoValue BTC ETF API check.
 *
 * Requires SOSOVALUE_API_KEY in the environment. Makes one authenticated GET,
 * stores the raw response only in the temporary workspace for a short-lived
 * Actions artifact, and prints metadata only (never response rows or secrets).
 * Does not connect to PostgreSQL or change registry/scenario state.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const API_URL = "https://openapi.sosovalue.com/openapi/v1/etfs/summary-history";
const key = process.env.SOSOVALUE_API_KEY;
if (!key) {
  console.error("SOSOVALUE_API_KEY is missing; no request was sent.");
  process.exit(2);
}

const now = new Date();
const endDate = now.toISOString().slice(0, 10);
const start = new Date(now.getTime());
start.setUTCDate(start.getUTCDate() - 29);
const startDate = start.toISOString().slice(0, 10);
const url = new URL(API_URL);
url.searchParams.set("symbol", "BTC");
url.searchParams.set("country_code", "US");
url.searchParams.set("start_date", startDate);
url.searchParams.set("end_date", endDate);
url.searchParams.set("limit", "300");

const response = await fetch(url, {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-soso-api-key": key,
    "user-agent": "Crypto-Plan100-SoSoValue-ReadOnly-Check/1.0",
  },
  signal: AbortSignal.timeout(25_000),
});
const retrievedAt = new Date().toISOString();
const body = await response.text();
const hash = createHash("sha256").update(body, "utf8").digest("hex");
const outDir = join(process.cwd(), "tmp", "sosovalue-etf-review");
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "response.json"), body, { mode: 0o600 });
await writeFile(join(outDir, "manifest.json"), JSON.stringify({
  schema_version: 1,
  source_id: "institutional.sosovalue.candidate",
  endpoint: API_URL,
  query: { symbol: "BTC", country_code: "US", start_date: startDate, end_date: endDate, limit: 300 },
  retrieved_at: retrievedAt,
  http_status: response.status,
  response_sha256: hash,
  response_bytes: Buffer.byteLength(body, "utf8"),
  api_key_present: true,
  production_database_accessed: false,
  production_writes_performed: false,
  scenario_state_changed: false,
}, null, 2) + "\n", { mode: 0o600 });

const rateHeaders = {
  limit: response.headers.get("x-ratelimit-limit"),
  remaining: response.headers.get("x-ratelimit-remaining"),
  reset: response.headers.get("x-ratelimit-reset"),
};
if (!response.ok) {
  console.error(JSON.stringify({
    result: "HTTP_ERROR",
    http_status: response.status,
    response_sha256: hash,
    response_bytes: Buffer.byteLength(body, "utf8"),
    rate_limit: rateHeaders,
    note: "Response body is preserved in the short-lived review artifact; body and key are not printed.",
  }, null, 2));
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(body);
} catch {
  console.error(JSON.stringify({ result: "INVALID_JSON", http_status: response.status, response_sha256: hash }, null, 2));
  process.exit(1);
}
const rows = Array.isArray(payload) ? payload
  : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.data?.list) ? payload.data.list : null;
if (!rows) {
  console.error(JSON.stringify({
    result: "UNRECOGNIZED_SCHEMA",
    http_status: response.status,
    top_level_type: Array.isArray(payload) ? "array" : typeof payload,
    top_level_keys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 30) : [],
    response_sha256: hash,
    rate_limit: rateHeaders,
  }, null, 2));
  process.exit(1);
}

const dates = rows.map(row => typeof row?.date === "string" ? row.date : null);
const validDates = dates.filter(date => date && /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
const uniqueDates = new Set(validDates);
const duplicates = validDates.length - uniqueDates.size;
const values = rows.map(row => row?.total_net_inflow);
const numericValues = values.filter(value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)));
const missingValues = values.length - numericValues.length;
const fields = [...new Set(rows.flatMap(row => row && typeof row === "object" ? Object.keys(row) : []))].sort();
const summary = {
  result: "OK_SCHEMA_RECOGNIZED",
  http_status: response.status,
  retrieved_at: retrievedAt,
  requested_range: { start_date: startDate, end_date: endDate },
  row_count: rows.length,
  earliest_reporting_date: validDates[0] ?? null,
  latest_reporting_date: validDates.at(-1) ?? null,
  unique_reporting_dates: uniqueDates.size,
  duplicate_reporting_date_rows: duplicates,
  rows_with_numeric_total_net_inflow: numericValues.length,
  rows_with_missing_or_non_numeric_total_net_inflow: missingValues,
  fields,
  response_sha256: hash,
  response_bytes: Buffer.byteLength(body, "utf8"),
  rate_limit: rateHeaders,
  source_semantics: {
    total_net_inflow_unit_from_official_docs: "USD",
    date_semantics_from_official_docs: "trading date yyyy-MM-dd; most recent month only; newest first",
    publication_timestamp: "not established by endpoint schema",
    revision_finality: "not established; compare repeated response hashes/rows",
  },
  production_database_accessed: false,
  production_writes_performed: false,
  scenario_state_changed: false,
};
console.log(JSON.stringify(summary, null, 2));
if (rows.length === 0 || missingValues > 0 || duplicates > 0 || validDates.length !== rows.length) {
  console.error("One or more data-quality checks require review; raw response is not approved for canonical use.");
  process.exit(1);
}
