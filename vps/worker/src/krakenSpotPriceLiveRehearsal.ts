import { spawnSync } from "node:child_process";
import {
  fetchKrakenBtcUsdSpotCandidate,
  toKrakenObservationCandidateRow
} from "./krakenSpotPrice.js";

function assertDisposableDatabase(databaseUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("Refusing live candidate rehearsal: DATABASE_URL must use PostgreSQL");
  }
  if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) {
    throw new Error("Refusing live candidate rehearsal: PostgreSQL host must be loopback");
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName.endsWith("_test")) {
    throw new Error("Refusing live candidate rehearsal: database name must end in _test");
  }
  console.log(`BTC_KRAKEN_LIVE_REHEARSAL_TARGET_OK host=${parsed.hostname} database=${databaseName}`);
  return parsed;
}

function sqlLiteral(value: string | number): string {
  const text = String(value);
  if (text.includes("\0")) throw new Error("SQL value contains a NUL byte");
  return "'" + text.replace(/'/g, "''") + "'";
}

function runPsql(databaseUrl: string, sql: string): string {
  const result = spawnSync("psql", [
    databaseUrl, "-X", "--no-psqlrc", "--set=ON_ERROR_STOP=1", "--tuples-only", "--no-align", "--command", sql
  ], { encoding: "utf8", timeout: 30_000 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`psql rehearsal failed (exit ${result.status}): ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  assertDisposableDatabase(databaseUrl);

  // The live network request happens only after the DB safety guard passed.
  const capture = await fetchKrakenBtcUsdSpotCandidate();
  const row = toKrakenObservationCandidateRow(capture);
  if (row.freshness !== "CURRENT") throw new Error("Refusing stale BTC spot candidate");
  const candidateAt = sqlLiteral(row.observed_at);
  const metric = sqlLiteral(row.metric_id);
  const asset = sqlLiteral(row.asset_id);
  const value = sqlLiteral(row.value_numeric);
  const unit = sqlLiteral(row.unit);
  const source = sqlLiteral(row.source_id);
  const sourceUrl = sqlLiteral(row.source_url);
  const methodology = sqlLiteral(row.methodology);
  const status = sqlLiteral(row.status);
  const freshness = sqlLiteral(row.freshness);
  const revision = sqlLiteral(row.revision);

  const insert = `INSERT INTO observations (
    metric_id, asset_id, value_numeric, unit, observed_at, source_id,
    source_url, methodology, status, freshness, revision
  ) VALUES (
    ${metric}, ${asset}, ${value}::numeric, ${unit}, ${candidateAt}::timestamptz,
    ${source}, ${sourceUrl}, ${methodology}, ${status}, ${freshness}, ${revision}::integer
  ) ON CONFLICT DO NOTHING`;

  const sql = `
BEGIN;
DO $rehearsal$
DECLARE first_count integer; duplicate_count integer; row_count integer;
  found_value numeric; found_unit text; found_url text; found_methodology text;
  found_status text; found_freshness text; found_revision integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assets WHERE asset_id = ${asset}) THEN RAISE EXCEPTION 'BTC asset missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM metric_definitions WHERE metric_id = ${metric} AND default_unit = ${unit} AND value_type = 'numeric') THEN RAISE EXCEPTION 'BTC metric/unit missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM sources WHERE source_id = ${source} AND base_url = 'https://api.kraken.com/0/public/Trades') THEN RAISE EXCEPTION 'Kraken source missing'; END IF;
  IF to_regclass('public.observations_btc_natural_key_revision_uq') IS NULL THEN RAISE EXCEPTION 'BTC natural-key index missing'; END IF;
  ${insert}; GET DIAGNOSTICS first_count = ROW_COUNT;
  IF first_count <> 1 THEN RAISE EXCEPTION 'expected first insert, got %', first_count; END IF;
  ${insert}; GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  IF duplicate_count <> 0 THEN RAISE EXCEPTION 'expected duplicate no-op, got %', duplicate_count; END IF;
  SELECT count(*) INTO row_count FROM observations WHERE metric_id=${metric} AND asset_id=${asset} AND source_id=${source} AND observed_at=${candidateAt}::timestamptz AND revision=${revision}::integer;
  IF row_count <> 1 THEN RAISE EXCEPTION 'expected one logical row, found %', row_count; END IF;
  SELECT value_numeric, unit, source_url, methodology, status, freshness, revision INTO found_value, found_unit, found_url, found_methodology, found_status, found_freshness, found_revision FROM observations WHERE metric_id=${metric} AND asset_id=${asset} AND source_id=${source} AND observed_at=${candidateAt}::timestamptz AND revision=${revision}::integer;
  IF found_value <> ${value}::numeric OR found_unit <> ${unit} OR found_url <> ${sourceUrl} OR found_methodology <> ${methodology} OR found_status <> ${status} OR found_freshness <> ${freshness} OR found_revision <> ${revision}::integer THEN RAISE EXCEPTION 'stored observation differs from captured candidate'; END IF;
  RAISE NOTICE 'BTC_KRAKEN_LIVE_CANDIDATE_REHEARSAL_OK first_insert=1 duplicate_insert=0 row_count=1 fields_match=1';
END
$rehearsal$;
ROLLBACK;
SELECT 'BTC_KRAKEN_LIVE_CANDIDATE_REHEARSAL_OK' AS result;
`;

  // psql command script is transaction-scoped and ends in ROLLBACK. If any assertion
  // fails, psql exits and closes its connection, which rolls back the open transaction.
  const output = runPsql(databaseUrl, sql);
  if (!output.includes("BTC_KRAKEN_LIVE_CANDIDATE_REHEARSAL_OK")) {
    throw new Error("BTC live candidate rehearsal did not emit its success marker");
  }
  console.log(JSON.stringify({
    status: "ok",
    rehearsal: "BTC_KRAKEN_LIVE_CANDIDATE_REHEARSAL_OK",
    acceptance_status: capture.acceptance_status,
    asset_id: row.asset_id,
    metric_id: row.metric_id,
    source_id: row.source_id,
    value_usd_per_btc: row.value_numeric,
    observed_at: row.observed_at,
    retrieved_at: capture.retrieved_at,
    age_seconds: capture.age_seconds,
    freshness: row.freshness,
    http_status: capture.http_status,
    source_url: row.source_url,
    returned_pair_key: capture.returned_pair_key,
    raw_payload_sha256: capture.raw_payload_sha256,
    database_writes: "rolled_back",
    duplicate_key_behavior: "one_row_only"
  }));
}

main().catch(error => {
  console.error("BTC_KRAKEN_LIVE_CANDIDATE_REHEARSAL_FAILED", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
