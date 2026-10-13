#!/usr/bin/env node
/**
 * Read-only candidate capture for CryptoETF.today BTC daily net flows.
 * No database access. Uses the public no-key MCP endpoint by default; REST key is optional.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const URL = "https://api.cryptoetf.today/api/v1/flows/btc";
const MAX_AGE_MS = 36 * 60 * 60 * 1000;

export function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function validDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseCryptoEtfBtcFlows(body, { now = new Date(), retrievedAt = now.toISOString(), rawSha256 = null, sourceUrl = URL } = {}) {
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  if (payload?.symbol !== "BTC" || payload?.asset !== "bitcoin" || !Array.isArray(payload?.days)) {
    throw new Error("cryptoetf_btc_schema_mismatch");
  }
  if (!Number.isFinite(Date.parse(payload.updatedAt))) throw new Error("cryptoetf_updated_at_invalid");
  if (!Number.isInteger(payload.windowDays) || payload.windowDays < 1) throw new Error("cryptoetf_window_days_invalid");

  const seen = new Set();
  const days = payload.days.map(row => {
    if (!validDateOnly(row?.date) || !Number.isFinite(row?.netFlowUsdM)) {
      throw new Error("cryptoetf_flow_row_invalid");
    }
    if (seen.has(row.date)) throw new Error(`cryptoetf_duplicate_date:${row.date}`);
    seen.add(row.date);
    if (new Date(`${row.date}T00:00:00.000Z`).getTime() > now.getTime()) {
      throw new Error(`cryptoetf_future_flow_date:${row.date}`);
    }
    return {
      date_utc: row.date,
      net_flow_usd_million: row.netFlowUsdM,
      published_at_utc: typeof row.publishedAt === "string" && Number.isFinite(Date.parse(row.publishedAt))
        ? new Date(row.publishedAt).toISOString()
        : null
    };
  }).sort((a, b) => a.date_utc.localeCompare(b.date_utc));

  if (!days.length) throw new Error("cryptoetf_flow_history_empty");
  if (payload.windowDays > 30) throw new Error("cryptoetf_window_exceeds_documented_free_history");
  const latest = days.at(-1);
  const latestDateMs = new Date(`${latest.date_utc}T00:00:00.000Z`).getTime();
  const latestPublishedAtMs = latest.published_at_utc ? Date.parse(latest.published_at_utc) : null;
  const latestFreshnessTimestampMs = latestPublishedAtMs ?? latestDateMs;
  const latestDataDateAgeMs = now.getTime() - latestDateMs;
  const latestFreshnessAgeMs = now.getTime() - latestFreshnessTimestampMs;
  const latestDataDateAgeHours = latestDataDateAgeMs / 3_600_000;
  const latestFreshnessAgeHours = latestFreshnessAgeMs / 3_600_000;
  const recentDistinctTradingDays = days.filter(row => {
    const age = now.getTime() - new Date(`${row.date_utc}T00:00:00.000Z`).getTime();
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  // updatedAt is an API-level timestamp, not necessarily the publication timestamp for
  // the latest flow row. Do not use it to pass the metric's 36-hour freshness gate.
  const publicationTimestampAvailable = latest.published_at_utc !== null;
  const freshness = latestFreshnessAgeMs >= 0 && latestFreshnessAgeMs <= MAX_AGE_MS && publicationTimestampAvailable;
  return {
    source_id_candidate: "institutional.cryptoetf_today",
    source_url: sourceUrl,
    metric_id_candidate: "institutional.etf_net_flow",
    unit: "USD million/day",
    provider_updated_at: payload.updatedAt,
    provider_updated_at_semantics: "API-level timestamp; not accepted as the latest flow row's publication time",
    retrieved_at: retrievedAt,
    raw_body_sha256: rawSha256,
    history_window_days: payload.windowDays,
    row_count: days.length,
    latest_flow_date_utc: latest.date_utc,
    latest_flow_usd_million: latest.net_flow_usd_million,
    latest_data_date_age_hours: Number(latestDataDateAgeHours.toFixed(3)),
    latest_freshness_timestamp_utc: latest.published_at_utc,
    latest_freshness_age_hours: Number(latestFreshnessAgeHours.toFixed(3)),
    distinct_flow_days_in_last_7_calendar_days: recentDistinctTradingDays,
    publication_timestamp_available_per_latest_row: publicationTimestampAvailable,
    metric_freshness_window_hours: 36,
    freshness_gate: freshness ? "PASS_CANDIDATE_ONLY" : "BLOCKED",
    freshness_blockers: [
      ...(latestFreshnessAgeMs < 0 ? ["latest row publication timestamp is in the future"] : []),
      ...(latestFreshnessAgeMs > MAX_AGE_MS ? ["latest flow publication timestamp (or conservative date fallback) is outside the 36-hour window"] : []),
      ...(!publicationTimestampAvailable ? ["response lacks a per-row publication timestamp; provider updatedAt cannot prove row publication freshness"] : [])
    ],
    days,
    acceptance_status: "CANDIDATE_ONLY",
    production_database_accessed: false,
    production_writes_performed: false
  };
}

const MCP_URL = "https://mcp.cryptoetf.today/api/mcp";

async function readJsonRpcResponse(response) {
  const type = response.headers.get("content-type") ?? "";
  const body = await response.text();
  if (!response.ok) throw new Error(`mcp_http_${response.status}`);
  if (!body.trim()) return null;
  const payloadText = type.includes("text/event-stream")
    ? body.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).filter(Boolean).at(-1)
    : body.trim();
  if (!payloadText) return null;
  return JSON.parse(payloadText);
}

async function callMcp(fetchImpl, method, params, id, sessionId) {
  const response = await fetchImpl(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId, "MCP-Protocol-Version": "2025-03-26" } : {})
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(20_000)
  });
  const nextSessionId = response.headers.get("mcp-session-id") ?? sessionId;
  const contentType = response.headers.get("content-type") ?? "";
  const payload = await readJsonRpcResponse(response);
  if (!payload) throw new Error(`mcp_empty_response:${method}:http_${response.status}:${contentType}`);
  if (payload?.error) throw new Error(`mcp_${payload.error.code ?? "error"}:${payload.error.message ?? "unknown"}`);
  return { payload, sessionId: nextSessionId };
}

async function captureViaPublicMcp({ fetchImpl, now, retrievedAt }) {
  let sessionId = null;
  const initialized = await callMcp(fetchImpl, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "crypto-btc-etf-review", version: "1.0.0" }
  }, 1, sessionId);
  sessionId = initialized.sessionId;
  const notification = await fetchImpl(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId, "MCP-Protocol-Version": "2025-03-26" } : {})
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    signal: AbortSignal.timeout(20_000)
  });
  if (!notification.ok) throw new Error(`mcp_initialized_http_${notification.status}`);

  const listed = await callMcp(fetchImpl, "tools/list", {}, 2, sessionId);
  sessionId = listed.sessionId;
  const tools = listed.payload?.result?.tools;
  if (!Array.isArray(tools)) throw new Error(`mcp_tools_list_missing:${JSON.stringify(listed.payload).slice(0,1200)}`);
  const tool = tools.find(item => item.name === "get_asset_flows");
  if (!tool) throw new Error("mcp_get_asset_flows_missing");
  const schema = tool.inputSchema ?? {};
  const properties = schema.properties ?? {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const candidateKey = [...required, ...Object.keys(properties)].find(key => /^(asset|symbol|ticker)$/i.test(key)) ?? "asset";
  const called = await callMcp(fetchImpl, "tools/call", {
    name: "get_asset_flows",
    arguments: { [candidateKey]: "btc" }
  }, 3, sessionId);
  const result = called.payload?.result;
  if (result?.isError) throw new Error("mcp_get_asset_flows_returned_error");
  let data = result?.structuredContent;
  if (!data && Array.isArray(result?.content)) {
    const textContent = result.content.find(item => item.type === "text" && typeof item.text === "string")?.text;
    if (textContent) {
      try { data = JSON.parse(textContent); }
      catch { throw new Error("mcp_flow_result_not_json"); }
    }
  }
  if (!data || typeof data !== "object") throw new Error("mcp_flow_result_missing");
  const body = JSON.stringify(data);
  const evidence = {
    source_url: MCP_URL,
    transport: "MCP Streamable HTTP, tools/call get_asset_flows",
    http_status: 200,
    retrieved_at: retrievedAt,
    raw_body_sha256: sha256(body),
    raw_body: body
  };
  try {
    return {
      schema_version: 1,
      asset_id: "btc",
      capture_status: "PASS_CANDIDATE_ONLY",
      evidence,
      parsed: parseCryptoEtfBtcFlows(data, { now, retrievedAt, rawSha256: evidence.raw_body_sha256, sourceUrl: MCP_URL }),
      production_database_accessed: false,
      production_writes_performed: false
    };
  } catch (error) {
    return {
      schema_version: 1, asset_id: "btc", capture_status: "BLOCKED_SCHEMA",
      error: error instanceof Error ? error.message : String(error), evidence,
      production_database_accessed: false, production_writes_performed: false
    };
  }
}

export async function capture({ apiKey = process.env.CRYPTOETF_API_KEY, fetchImpl = fetch, now = new Date() } = {}) {
  const retrievedAt = now.toISOString();
  if (!apiKey) {
    try {
      return await captureViaPublicMcp({ fetchImpl, now, retrievedAt });
    } catch (error) {
      return {
        schema_version: 1, asset_id: "btc", source_url: MCP_URL, retrieved_at: retrievedAt,
        capture_status: "BLOCKED_MCP",
        error: error instanceof Error ? error.message : String(error),
        production_database_accessed: false, production_writes_performed: false
      };
    }
  }
  const response = await fetchImpl(URL, {
    headers: { accept: "application/json, text/event-stream", authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20_000)
  });
  const body = await response.text();
  const evidence = { source_url: URL, http_status: response.status, retrieved_at: retrievedAt, raw_body_sha256: sha256(body), raw_body: body };
  if (!response.ok) {
    return { schema_version: 1, asset_id: "btc", capture_status: "BLOCKED_HTTP", error: `http_${response.status}`, evidence, production_database_accessed: false, production_writes_performed: false };
  }
  try {
    return { schema_version: 1, asset_id: "btc", capture_status: "PASS_CANDIDATE_ONLY", evidence, parsed: parseCryptoEtfBtcFlows(body, { now, retrievedAt, rawSha256: evidence.raw_body_sha256 }), production_database_accessed: false, production_writes_performed: false };
  } catch (error) {
    return { schema_version: 1, asset_id: "btc", capture_status: "BLOCKED_SCHEMA", error: error instanceof Error ? error.message : String(error), evidence, production_database_accessed: false, production_writes_performed: false };
  }
}

async function main() {
  const result = await capture();
  const outDir = join(process.cwd(), "tmp", "btc-etf-flow-review");
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "BTC-ETF-FLOW-CANDIDATE.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
  const printable = structuredClone(result);
  if (printable.evidence?.raw_body) printable.evidence.raw_body = "[retained in artifact]";
  console.log(JSON.stringify(printable, null, 2));
  if (result.capture_status === "BLOCKED_SCHEMA") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
