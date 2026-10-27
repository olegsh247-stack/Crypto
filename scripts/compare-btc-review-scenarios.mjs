#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pick = report => ({
  captured_at: report.captured_at ?? null,
  price: {
    value_pct: report.intermediate_calculations?.price_return_7d_pct ?? null,
    start: report.provenance?.btc_price?.start_candle ?? null,
    end: report.provenance?.btc_price?.end_candle ?? null,
    hash: report.provenance?.btc_price?.source_payload_sha256 ?? null
  },
  etf: {
    source_id: report.provenance?.etf_net_flow?.source_id ?? null,
    sessions: (report.provenance?.etf_net_flow?.sessions ?? []).map(x => ({
      date:x.date, value_usd_millions:x.value_usd_millions,
      source_row_key:x.source_row_key, hash:x.source_payload_sha256 ?? null
    })),
    value_usd_millions: report.intermediate_calculations?.etf_net_flow_5d_usd_millions ?? null
  },
  output: {
    status: report.output?.status ?? null,
    scenario_type: report.output?.scenario_type ?? null,
    directional_score: report.output?.directional_score ?? null,
    confidence_band: report.output?.confidence_band ?? null,
    signals: report.output?.signals ?? []
  }
});
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function compareBtcReviewScenarios(previous, current) {
  assert.equal(previous?.schema_version,1,"previous report schema_version 1 required");
  assert.equal(current?.schema_version,1,"current report schema_version 1 required");
  const a=pick(previous), b=pick(current);
  const changes=[];
  for (const key of ["price","etf","output"]) {
    if (!same(a[key],b[key])) changes.push(key);
  }
  return {
    schema_version:1,
    mode:"read-only-review-capture-comparison",
    previous_capture_at:a.captured_at,
    current_capture_at:b.captured_at,
    changed_sections:changes,
    inputs_unchanged:same(a.price,b.price)&&same(a.etf,b.etf),
    scenario_unchanged:same(a.output,b.output),
    previous:{price_return_7d_pct:a.price.value_pct,etf_net_flow_5d_usd_millions:a.etf.value_usd_millions,etf_source:a.etf.source_id,scenario:a.output.scenario_type,directional_score:a.output.directional_score,confidence_band:a.output.confidence_band},
    current:{price_return_7d_pct:b.price.value_pct,etf_net_flow_5d_usd_millions:b.etf.value_usd_millions,etf_source:b.etf.source_id,scenario:b.output.scenario_type,directional_score:b.output.directional_score,confidence_band:b.output.confidence_band},
    price_input_changed:!same(a.price,b.price),
    etf_input_changed:!same(a.etf,b.etf),
    scenario_changed:!same(a.output,b.output),
    safety:{database_accessed:false,database_writes_performed:false,scenario_state_persisted:false,baseline_probabilities_changed:false,approved_for_production_ingestion:false}
  };
}
async function main(){
  const prev=JSON.parse(readFileSync(resolve(process.argv[2]??"previous.json"),"utf8"));
  const curr=JSON.parse(readFileSync(resolve(process.argv[3]??"current.json"),"utf8"));
  const output=compareBtcReviewScenarios(prev,curr);
  const path=resolve(process.argv[4]??"btc-review-stability-comparison.json");
  writeFileSync(path,JSON.stringify(output,null,2)+"\n","utf8");
  process.stdout.write(JSON.stringify({...output,output_path:path},null,2)+"\n");
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname) main();
