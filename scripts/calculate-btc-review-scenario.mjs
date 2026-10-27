#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateBtcScenarioV1 } from "./btc-scenario-direction.mjs";

const dateOK = x => typeof x === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(x);
const num = x => typeof x === "number" && Number.isFinite(x);

export function calculateBtcReviewScenario(manifest, candidates) {
  const sources = Array.isArray(manifest?.sources) ? manifest.sources : [];
  const btc = sources.find(s => s.name === "kraken-xbtusd-ohlc-1h-history" && s.status === "CAPTURED");
  assert.ok(btc, "captured Kraken hourly BTC/USD history is required");
  assert.equal(btc.quote_unit, "USD/BTC");
  assert.equal(btc.methodology, "kraken-xbtusd-hourly-closed-candle-close-to-close-7d-v1");
  const start = btc.seven_day_reference_candle, end = btc.latest_closed_candle;
  assert.ok(start && end && num(start.close_usd_per_btc) && num(end.close_usd_per_btc), "closed BTC/USD candles required");
  assert.equal(btc.seven_day_reference_delta_seconds, 604800, "reference candle must be exactly seven days earlier");
  const priceReturn = (end.close_usd_per_btc / start.close_usd_per_btc - 1) * 100;
  assert.ok(Math.abs(priceReturn - btc.seven_day_close_to_close_return_pct) < 1e-9, "BTC return does not reconcile");

  const rows = Array.isArray(candidates?.etf_review_rows) ? candidates.etf_review_rows : [];
  const usable = id => rows.filter(r => r.source_id === id && r.candidate_state === "REVIEW_ONLY"
    && dateOK(r.period_start) && r.period_start === r.period_end && num(r.value_numeric));
  const farside = usable("institutional.primary").filter(r =>
    r.row_status === "REPORTED_CANDIDATE" && r.reconciliation_status === "MATCHES_DISPLAY_ROUNDING");
  let etfRows = farside, etfSource = "institutional.primary", fallbackReason = null;
  if (farside.length < 5) {
    etfRows = usable("institutional.sosovalue");
    if (etfRows.length < 5) throw new Error("Need five accepted Farside sessions or five SoSoValue fallback sessions");
    etfSource = "institutional.sosovalue";
    fallbackReason = "Farside had fewer than five rows passing reported-row and reconciliation checks";
  }
  const distinct = new Map();
  for (const row of etfRows) if (!distinct.has(row.period_start)) distinct.set(row.period_start, row);
  const sessions = [...distinct.values()].sort((a,b) => a.period_start.localeCompare(b.period_start)).slice(-5);
  if (sessions.length !== 5) throw new Error("ETF rule requires five distinct sessions");
  const etfSum = sessions.reduce((sum, r) => sum + r.value_numeric, 0);
  const result = evaluateBtcScenarioV1({
    readiness_status: "ready_for_rule_evaluation",
    price_return_7d_pct: priceReturn,
    etf_net_flow_5d_usd_millions: etfSum,
    // Hashrate and DXY are omitted unless this capture supplies verified period changes.
    fee_subsidy_ratio: null
  });
  return {
    schema_version: 1,
    calculation_id: "btc-current-review-rule-v1",
    mode: "read-only-current-capture-review",
    captured_at: manifest.retrieved_at ?? null,
    provenance: {
      btc_price: {
        source_id: btc.source_id, source_url: btc.url,
        source_payload_sha256: btc.source_payload_sha256 ?? btc.body_sha256 ?? null,
        unit: "USD/BTC", methodology: btc.methodology, methodology_version: btc.methodology_version,
        start_candle: start, end_candle: end, interval_seconds: 604800,
        formula: "(end_close / start_close - 1) * 100", value_pct: priceReturn
      },
      etf_net_flow: {
        source_id: etfSource, fallback_reason: fallbackReason, unit: "USD million/session",
        method: "sum five latest distinct rows; no weekend or missing-as-zero assumptions",
        sessions: sessions.map(r => ({
          date:r.period_start, value_usd_millions:r.value_numeric,
          row_status:r.row_status, reconciliation_status:r.reconciliation_status,
          source_row_key:r.source_row_key, source_payload_sha256:r.source_payload_sha256 ?? null
        })),
        formula: sessions.map(r => r.value_numeric).join(" + "), value_usd_millions: etfSum,
        publication_time_finality_and_provider_revision_verified: false
      }
    },
    intermediate_calculations: {
      price_return_7d_pct:priceReturn,
      price_score:result.signals.find(s=>s.input==="price_return_7d_pct")?.score ?? null,
      etf_net_flow_5d_usd_millions:etfSum,
      etf_score:result.signals.find(s=>s.input==="etf_net_flow_5d_usd_millions")?.score ?? null,
      directional_score:result.directional_score
    },
    output:result,
    safety:{
      live_data_fetched_by_calculator:false, database_accessed:false, database_writes_performed:false,
      scenario_state_persisted:false, monitoring_events_written:false,
      baseline_probabilities_changed:false, can_persist_scenario_state:false,
      approved_for_production_ingestion:false
    },
    note:"Deterministic calculation from a captured read-only artifact. ETF values remain review-only because publication time, finality and revision semantics are unverified."
  };
}

async function main() {
  const manifestPath=resolve(process.argv[2] ?? "tmp/btc-source-review/manifest.json");
  const candidatesPath=resolve(process.argv[3] ?? join(dirname(manifestPath),"observation-candidates.json"));
  const outputPath=resolve(process.argv[4] ?? join(dirname(manifestPath),"btc-current-scenario-review.json"));
  const report=calculateBtcReviewScenario(JSON.parse(readFileSync(manifestPath,"utf8")),JSON.parse(readFileSync(candidatesPath,"utf8")));
  writeFileSync(outputPath,JSON.stringify(report,null,2)+"\\n","utf8");
  process.stdout.write(JSON.stringify({
    status:report.output.status, scenario_type:report.output.scenario_type,
    directional_score:report.output.directional_score,
    price_return_7d_pct:report.intermediate_calculations.price_return_7d_pct,
    etf_net_flow_5d_usd_millions:report.intermediate_calculations.etf_net_flow_5d_usd_millions,
    etf_source:report.provenance.etf_net_flow.source_id, output:outputPath, ...report.safety
  },null,2)+"\\n");
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
