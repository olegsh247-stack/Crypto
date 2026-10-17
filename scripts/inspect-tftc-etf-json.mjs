#!/usr/bin/env node
/**
 * Offline-only structural validator for an already available TFTC ETF JSON file.
 * No network, writes, database access, or scenario evaluation. It does not download data.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function rowsFrom(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;
  for (const key of ["days", "data", "rows", "flows"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return null;
}
export function inspectTftcEtfJson(bytes) {
  const raw = Buffer.isBuffer(bytes) ? bytes : Buffer.from(String(bytes));
  const digest = createHash("sha256").update(raw).digest("hex");
  let data;
  try { data = JSON.parse(raw.toString("utf8")); }
  catch { return { status: "BLOCKED_INVALID_JSON", sha256: digest, bytes: raw.length, production_writes_performed: false }; }
  const rows = rowsFrom(data);
  if (!rows) return {
    status: "BLOCKED_UNRECOGNIZED_TOP_LEVEL_SCHEMA",
    sha256: digest, bytes: raw.length,
    top_level_shape: Array.isArray(data) ? "array" : typeof data,
    top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data).sort() : [],
    production_writes_performed: false
  };
  const seen = new Set();
  const duplicateDates = new Set();
  const invalidDateRows = [];
  const missingValueRows = [];
  const invalidValueRows = [];
  const dates = [];
  let numericRows = 0;
  let zeroRows = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const date = row && typeof row === "object" ? (row.date ?? row.day) : null;
    const value = row && typeof row === "object" ? row.netFlowUsd : undefined;
    if (!validDate(date)) invalidDateRows.push(i);
    else {
      dates.push(date);
      if (seen.has(date)) duplicateDates.add(date);
      seen.add(date);
    }
    if (value === null || value === undefined || value === "") missingValueRows.push(i);
    else if (typeof value !== "number" || !Number.isFinite(value)) invalidValueRows.push(i);
    else {
      numericRows += 1;
      if (value === 0) zeroRows += 1;
    }
  }
  const structuralErrors = invalidDateRows.length + missingValueRows.length + invalidValueRows.length + duplicateDates.size;
  return {
    status: rows.length > 0 && structuralErrors === 0 ? "STRUCTURE_VALID_REVIEW_REQUIRED" : "BLOCKED_DATA_QUALITY",
    sha256: digest,
    bytes: raw.length,
    row_count: rows.length,
    numeric_net_flow_rows: numericRows,
    zero_value_rows: zeroRows,
    min_reporting_date: dates.length ? [...dates].sort()[0] : null,
    max_reporting_date: dates.length ? [...dates].sort().at(-1) : null,
    invalid_date_row_indexes: invalidDateRows,
    missing_value_row_indexes: missingValueRows,
    invalid_value_row_indexes: invalidValueRows,
    duplicate_reporting_dates: [...duplicateDates].sort(),
    value_field: "netFlowUsd",
    value_unit_assumption: "USD as labelled by current project candidate mapping; verify against current TFTC documentation before use",
    publication_timestamp: null,
    provider_revision: null,
    finality: "unknown",
    upstream_lineage: data && typeof data === "object" && !Array.isArray(data) ? (data.sources ?? null) : null,
    note: "Structural validation only. A zero is reported as a numeric zero, not inferred from a missing row. This does not establish licensing at capture time, semantic correctness, completeness, finality, source independence, archive durability, or scenario eligibility.",
    production_database_accessed: false,
    production_writes_performed: false,
    network_access_performed: false
  };
}
function inputPath(argv) {
  if (argv.length !== 2 || argv[0] !== "--input" || !argv[1] || argv[1].startsWith("--")) {
    throw new Error("Usage: node scripts/inspect-tftc-etf-json.mjs --input <existing-local-json-file>");
  }
  return resolve(argv[1]);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = inputPath(process.argv.slice(2));
    const result = inspectTftcEtfJson(await readFile(path));
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    if (result.status !== "STRUCTURE_VALID_REVIEW_REQUIRED") process.exitCode = 1;
  } catch (error) {
    process.stderr.write("TFTC offline inspection blocked: " + (error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
