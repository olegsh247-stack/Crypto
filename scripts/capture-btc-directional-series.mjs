#!/usr/bin/env node
/**
 * Read-only BTC directional-series candidate capture.
 * Captures Kraken daily OHLC and Mempool historical hashrate; never connects to a database.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DAY_SECONDS = 86_400;
const DAY_MS = DAY_SECONDS * 1000;
const KRAKEN_URL = "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440";
const HASHRATE_URL = "https://mempool.space/api/v1/mining/hashrate/6m";

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function finitePositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function utcDay(timestampMs) {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

function requireEightConsecutive(points, name) {
  if (points.length < 8) throw new Error(`${name}: fewer than 8 completed daily points`);
  const ordered = [...points].sort((a, b) => a.timestampMs - b.timestampMs);
  const seen = new Set();
  for (let i = 0; i < ordered.length; i++) {
    const day = utcDay(ordered[i].timestampMs);
    if (seen.has(day)) throw new Error(`${name}: duplicate UTC date ${day}`);
    seen.add(day);
    if (i > 0 && ordered[i].timestampMs - ordered[i - 1].timestampMs !== DAY_MS) {
      throw new Error(`${name}: daily gap between ${utcDay(ordered[i - 1].timestampMs)} and ${day}`);
    }
  }
  const latest = ordered.at(-1);
  const prior = ordered.at(-8);
  if (utcDay(latest.timestampMs) !== utcDay(prior.timestampMs + 7 * DAY_MS)) {
    throw new Error(`${name}: seven-day endpoints are not exactly seven UTC days apart`);
  }
  return { ordered, latest, prior };
}

export function parseKrakenOhlc(body, now = new Date()) {
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  if (Array.isArray(payload?.error) && payload.error.length) {
    throw new Error(`kraken_api_error: ${payload.error.join(", ")}`);
  }
  const result = payload?.result ?? {};
  const pairKey = Object.keys(result).find(key => key !== "last");
  if (!pairKey || !Array.isArray(result[pairKey])) throw new Error("kraken_ohlc_rows_missing");
  const points = [];
  for (const row of result[pairKey]) {
    if (!Array.isArray(row) || row.length < 8) throw new Error("kraken_ohlc_row_malformed");
    const seconds = Number(row[0]);
    const timestampMs = seconds * 1000;
    const open = finitePositive(row[1]);
    const high = finitePositive(row[2]);
    const low = finitePositive(row[3]);
    const close = finitePositive(row[4]);
    if (!Number.isSafeInteger(seconds) || seconds <= 0 || !open || !high || !low || !close) {
      throw new Error("kraken_ohlc_invalid_time_or_price");
    }
    if (low > Math.min(open, close) || high < Math.max(open, close) || low > high) {
      throw new Error("kraken_ohlc_inconsistent_ohlc");
    }
    if (timestampMs > now.getTime()) throw new Error("kraken_ohlc_future_timestamp");
    // Kraken may return the currently forming daily candle. Only accept a candle whose
    // entire 24-hour interval ended before capture time.
    if (timestampMs + DAY_MS > now.getTime()) continue;
    points.push({ timestampMs, open, high, low, close, volume: Number(row[6]), tradeCount: Number(row[7]) });
  }
  const { ordered, latest, prior } = requireEightConsecutive(points, "kraken_ohlc");
  return {
    source_id_candidate: "market_kraken",
    canonical_source_mapping: "BLOCKED_REVIEW_REQUIRED: registry market.spot_price currently prioritizes market.kraken (Trades), distinct from market_kraken (daily OHLC)",
    source_url: KRAKEN_URL,
    pair_key: pairKey,
    interval_minutes: 1440,
    candle_timestamp_convention: "UTC candle start; only candles with start + 24h <= retrieved_at are included",
    completed_candle_count: ordered.length,
    first_completed_day: utcDay(ordered[0].timestampMs),
    latest_completed_day: utcDay(latest.timestampMs),
    latest_completed_close_usd_per_btc: latest.close,
    close_seven_days_prior_usd_per_btc: prior.close,
    seven_day_return: latest.close / prior.close - 1,
    seven_day_return_method: "(latest completed UTC daily close / close exactly 7 UTC days earlier) - 1",
    points: ordered.map(p => ({ date_utc: utcDay(p.timestampMs), timestamp: new Date(p.timestampMs).toISOString(), open: p.open, high: p.high, low: p.low, close: p.close, volume: p.volume, trade_count: p.tradeCount })),
    acceptance_status: "CANDIDATE_ONLY"
  };
}

export function parseHashrateSeries(body, now = new Date()) {
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  const rows = Array.isArray(payload) ? payload
    : Array.isArray(payload?.hashrates) ? payload.hashrates
    : Array.isArray(payload?.data) ? payload.data
    : [];
  if (!rows.length) throw new Error("mempool_hashrate_rows_missing");
  const points = [];
  for (const row of rows) {
    const seconds = Number(row?.timestamp);
    const timestampMs = seconds * 1000;
    const rawHashrate = finitePositive(row?.avgHashrate ?? row?.hashrate ?? row?.value);
    if (!Number.isSafeInteger(seconds) || seconds <= 0 || !rawHashrate) {
      throw new Error("mempool_hashrate_invalid_row");
    }
    if (timestampMs > now.getTime()) throw new Error("mempool_hashrate_future_timestamp");
    // Do not use a point belonging to the current UTC date; provider bucket semantics are
    // explicitly preserved for review rather than assumed to be an instantaneous value.
    if (utcDay(timestampMs) >= utcDay(now.getTime())) continue;
    points.push({ timestampMs, valueEhS: rawHashrate / 1e18 });
  }
  const { ordered, latest, prior } = requireEightConsecutive(points, "mempool_hashrate");
  return {
    source_id_candidate: "network.primary",
    source_url: HASHRATE_URL,
    value_unit: "EH/s",
    raw_value_unit: "H/s (conversion divisor 1e18; verify against current provider payload/schema)",
    bucket_timestamp_convention: "NOT YET AUTHORITATIVELY CONFIRMED; raw timestamps preserved and acceptance remains blocked",
    completed_daily_point_count: ordered.length,
    first_point_day_utc: utcDay(ordered[0].timestampMs),
    latest_point_day_utc: utcDay(latest.timestampMs),
    latest_value_eh_s: latest.valueEhS,
    value_seven_days_prior_eh_s: prior.valueEhS,
    seven_day_change: latest.valueEhS / prior.valueEhS - 1,
    seven_day_change_method: "(latest candidate daily point / point exactly 7 UTC days earlier) - 1",
    points: ordered.map(p => ({ timestamp: new Date(p.timestampMs).toISOString(), date_utc: utcDay(p.timestampMs), value_eh_s: p.valueEhS })),
    acceptance_status: "CANDIDATE_ONLY"
  };
}

async function capture(url, parser, now) {
  const retrievedAt = now.toISOString();
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Crypto-BTC-Directional-Series-Review/1.0" },
    signal: AbortSignal.timeout(20_000)
  });
  const body = await response.text();
  const evidence = {
    source_url: url,
    http_status: response.status,
    retrieved_at: retrievedAt,
    raw_body_sha256: sha256(body),
    raw_body: body
  };
  if (!response.ok) throw Object.assign(new Error(`http_${response.status}`), { evidence });
  try {
    return { evidence, parsed: parser(body, now) };
  } catch (error) {
    return { evidence, parse_error: error instanceof Error ? error.message : String(error) };
  }
}

export async function runCapture({ fetchImpl = fetch, now = new Date() } = {}) {
  const captureWithFetch = async (url, parser) => {
    const retrievedAt = now.toISOString();
    const response = await fetchImpl(url, {
      headers: { accept: "application/json", "user-agent": "Crypto-BTC-Directional-Series-Review/1.0" },
      signal: AbortSignal.timeout(20_000)
    });
    const body = await response.text();
    const evidence = { source_url: url, http_status: response.status, retrieved_at: retrievedAt, raw_body_sha256: sha256(body), raw_body: body };
    if (!response.ok) return { evidence, parse_error: `http_${response.status}` };
    try { return { evidence, parsed: parser(body, now) }; }
    catch (error) { return { evidence, parse_error: error instanceof Error ? error.message : String(error) }; }
  };
  const [spot, hashrate] = await Promise.all([
    captureWithFetch(KRAKEN_URL, parseKrakenOhlc),
    captureWithFetch(HASHRATE_URL, parseHashrateSeries)
  ]);
  const passed = Boolean(spot.parsed && hashrate.parsed);
  return {
    schema_version: 1,
    asset_id: "btc",
    retrieved_at: now.toISOString(),
    mode: "read-only-candidate-capture",
    production_database_accessed: false,
    production_writes_performed: false,
    overall_status: passed ? "PASS_CANDIDATE_ONLY" : "BLOCKED",
    sources: { kraken_daily_ohlc: spot, mempool_hashrate_history: hashrate },
    note: "Even a complete candidate capture does not approve source mapping or scenario evaluation. Raw bodies are retained in the artifact for independent review."
  };
}

async function main() {
  const now = new Date();
  const output = await runCapture({ now });
  const outDir = join(process.cwd(), "tmp", "btc-directional-series-review");
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "BTC-DIRECTIONAL-SERIES-MANIFEST.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ...output, sources: Object.fromEntries(Object.entries(output.sources).map(([key, value]) => [key, { ...value, evidence: { ...value.evidence, raw_body: "[retained in manifest artifact]" } }])) }, null, 2));
  if (output.overall_status !== "PASS_CANDIDATE_ONLY") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
