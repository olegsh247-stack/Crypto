#!/usr/bin/env node
/**
 * Read-only candidate capture for the ICE US Dollar Index as displayed by Yahoo Finance.
 * This is an unauthenticated third-party candidate only, not an approved canonical DXY source.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SYMBOL = "DX-Y.NYB";
const SOURCE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?range=1mo&interval=1d";

export function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function dateInNewYork(timestampSeconds) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(timestampSeconds * 1000));
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseYahooDxyChart(body, { now = new Date(), retrievedAt = now.toISOString(), rawSha256 = null } = {}) {
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  const chart = payload?.chart;
  if (chart?.error) throw new Error(`yahoo_chart_error:${chart.error.code ?? "unknown"}`);
  const result = chart?.result?.[0];
  if (!result || result.meta?.symbol !== SYMBOL) throw new Error("yahoo_dxy_symbol_mismatch");
  const timestamps = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(closes) || timestamps.length !== closes.length) {
    throw new Error("yahoo_dxy_series_shape_invalid");
  }

  const todayNewYork = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now);
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const close = closes[i];
    if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw new Error("yahoo_dxy_timestamp_invalid");
    if (timestamp * 1000 > now.getTime()) throw new Error("yahoo_dxy_future_timestamp");
    if (close === null) continue;
    if (typeof close !== "number" || !Number.isFinite(close) || close <= 0) throw new Error("yahoo_dxy_close_invalid");
    const sessionDate = dateInNewYork(timestamp);
    if (seen.has(sessionDate)) throw new Error(`yahoo_dxy_duplicate_session:${sessionDate}`);
    seen.add(sessionDate);
    // Daily chart bars may include an in-progress current-session value. Exclude the current
    // New York calendar date; the exact ICE close/publication timestamp is not in this payload.
    if (sessionDate >= todayNewYork) continue;
    rows.push({ session_date_new_york: sessionDate, timestamp_utc: new Date(timestamp * 1000).toISOString(), close });
  }
  rows.sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc));
  if (rows.length < 6) throw new Error("yahoo_dxy_fewer_than_six_completed_sessions");
  const latest = rows.at(-1);
  const prior = rows.at(-6);
  return {
    source_id_candidate: "macro.yahoo_dxy",
    metric_id_candidate: "macro.dxy",
    source_url: SOURCE_URL,
    displayed_symbol: SYMBOL,
    displayed_instrument: "ICE US Dollar Index (Yahoo Finance distribution)",
    unit: "index",
    retrieved_at: retrievedAt,
    raw_body_sha256: rawSha256,
    completed_session_count: rows.length,
    latest_completed_session_date_new_york: latest.session_date_new_york,
    latest_completed_close: latest.close,
    close_five_sessions_prior: prior.close,
    five_session_change: latest.close / prior.close - 1,
    five_session_change_method: "(latest completed daily close / close five observed trading sessions earlier) - 1",
    timestamp_contract: "Yahoo daily-bar timestamp mapped to America/New_York session date; exact ICE close/publication time not supplied in the captured response",
    freshness_gate: "BLOCKED_SOURCE_CONTRACT_REVIEW",
    acceptance_status: "CANDIDATE_ONLY",
    acceptance_blockers: [
      "Yahoo Finance is a third-party distribution, not a verified licensed canonical feed for this project",
      "captured response does not establish the exact ICE daily close/publication timestamp needed for the 48-hour metric freshness contract",
      "macro.primary source priority remains unchanged"
    ],
    points: rows
  };
}

export async function runCapture({ fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  try {
    const response = await fetchImpl(SOURCE_URL, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 Crypto-BTC-DXY-Review/1.0" },
      signal: AbortSignal.timeout(20_000)
    });
    const body = await response.text();
    const evidence = {
      source_url: SOURCE_URL,
      http_status: response.status,
      retrieved_at: retrievedAt,
      raw_body_sha256: sha256(body),
      raw_body: body
    };
    if (!response.ok) return { status: "BLOCKED_FETCH", evidence, error: `http_${response.status}` };
    try {
      return { status: "PASS_CANDIDATE_ONLY", evidence, parsed: parseYahooDxyChart(body, { now, retrievedAt, rawSha256: evidence.raw_body_sha256 }) };
    } catch (error) {
      return { status: "BLOCKED_PARSE", evidence, error: error instanceof Error ? error.message : String(error) };
    }
  } catch (error) {
    return { status: "BLOCKED_FETCH", error: error instanceof Error ? error.message : String(error), retrieved_at: retrievedAt, source_url: SOURCE_URL };
  }
}

async function main() {
  const now = new Date();
  const output = {
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: now.toISOString(),
    mode: "read-only-candidate-capture",
    production_database_accessed: false,
    production_writes_performed: false,
    result: await runCapture({ now })
  };
  const outDir = join(process.cwd(), "tmp", "btc-dxy-candidate-review");
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "BTC-DXY-CANDIDATE-MANIFEST.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
  const safe = structuredClone(output);
  if (safe.result?.evidence?.raw_body !== undefined) safe.result.evidence.raw_body = "[retained in manifest artifact]";
  console.log(JSON.stringify(safe, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
