#!/usr/bin/env node
/**
 * Evaluate the latest public BTC capture against the read-only readiness gate.
 * This is an offline/review-only assessment. It never connects to a database,
 * writes scenario state, calculates probabilities, or authorizes ingestion.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { assessBtcScenarioReadiness } from "./btc-scenario-readiness.mjs";

const manifestPath = resolve(process.argv[2] ?? "tmp/btc-source-review/manifest.json");
const candidatesPath = resolve(process.argv[3] ?? join(dirname(manifestPath), "observation-candidates.json"));
const outputPath = resolve(process.argv[4] ?? join(dirname(manifestPath), "readiness-assessment.json"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const captured = JSON.parse(readFileSync(candidatesPath, "utf8"));

const spotRows = (captured.candidates ?? [])
  .filter(row => row?.metric_id === "market.spot_price" && row?.candidate_state === "REVIEW_ONLY")
  .map(row => ({
    ...row,
    freshness: row.freshness_status,
    expected_unit: row.unit,
    source_registered: true,
  }));

const etfRows = (captured.etf_review_rows ?? [])
  .filter(row => row?.metric_id === "institutional.etf_net_flow"
    && row?.candidate_state === "REVIEW_ONLY"
    && Number.isFinite(Number(row?.value_numeric))
    && row?.row_status !== "UNREPORTED_PLACEHOLDER"
    && row?.reconciliation_status !== "UNREPORTED")
  .map(row => ({
    ...row,
    freshness: "CURRENT",
    expected_unit: row.expected_unit ?? row.unit,
    source_registered: row.source_registered === true,
  }));

const result = assessBtcScenarioReadiness([...spotRows, ...etfRows], manifest.retrieved_at);
const report = {
  evaluated_at: manifest.retrieved_at,
  mode: "offline-review-only",
  source_capture_mode: manifest.mode ?? null,
  production_database_accessed: manifest.production_database_accessed === true,
  production_writes_performed: manifest.production_writes_performed === true,
  source_capture: {
    retrieved_at: manifest.retrieved_at ?? null,
    spot_candidate_count: spotRows.length,
    numeric_etf_review_row_count: etfRows.length,
    artifact_inputs: [manifestPath, candidatesPath],
  },
  readiness: result,
};
writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify({
  status: result.status,
  blockers: result.blockers,
  output: outputPath,
  can_persist_scenario_state: result.can_persist_scenario_state,
  production_database_accessed: report.production_database_accessed,
  production_writes_performed: report.production_writes_performed,
}) + "\n");
