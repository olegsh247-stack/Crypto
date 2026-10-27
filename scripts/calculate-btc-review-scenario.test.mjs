import test from "node:test";
import assert from "node:assert/strict";
import { calculateBtcReviewScenario } from "./calculate-btc-review-scenario.mjs";
const c=(v,t)=>({candle_start_epoch_seconds:t,close_usd_per_btc:v});
const manifest={retrieved_at:"2026-10-27T06:44:00Z",sources:[{
 name:"kraken-xbtusd-ohlc-1h-history",status:"CAPTURED",source_id:"market.kraken",
 url:"https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60",quote_unit:"USD/BTC",
 methodology:"kraken-xbtusd-hourly-closed-candle-close-to-close-7d-v1",methodology_version:"1",
 source_payload_sha256:"a".repeat(64),seven_day_reference_delta_seconds:604800,
 seven_day_reference_candle:c(100,1000),latest_closed_candle:c(98,605800),
 seven_day_close_to_close_return_pct:-2
}]};
const dates=["2026-10-20","2026-10-21","2026-10-22","2026-10-23","2026-10-26"];
const row=(d,v,s="institutional.primary")=>({source_id:s,candidate_state:"REVIEW_ONLY",
 period_start:d,period_end:d,value_numeric:v,row_status:"REPORTED_CANDIDATE",
 reconciliation_status:"MATCHES_DISPLAY_ROUNDING",source_row_key:s+":"+d,source_payload_sha256:"b".repeat(64)});
test("primary five-session calculation is reproducible and review-only",()=>{
 const report=calculateBtcReviewScenario(manifest,{etf_review_rows:dates.map((d,i)=>row(d,[23.2,524.8,-635.6,-137.9,110.3][i]))});
 assert.ok(Math.abs(report.intermediate_calculations.price_return_7d_pct+2)<1e-9);
 assert.ok(Math.abs(report.intermediate_calculations.etf_net_flow_5d_usd_millions+115.2)<1e-9);
 assert.equal(report.output.status,"not_evaluable");
 assert.equal(report.output.reason,"input_quality_gate_not_passed");
 assert.equal(report.output.scenario_type,undefined);
 assert.equal(report.output.directional_score,undefined);
 assert.equal(report.output.missing_required_inputs,undefined);
 assert.ok(report.readiness_blockers.some(x=>x.includes("ETF publication-time")));
 assert.equal(report.safety.database_writes_performed,false); assert.equal(report.safety.can_persist_scenario_state,false);
});
test("fallback to SoSoValue is explicit when Farside lacks five accepted rows",()=>{
 const primary=[row(dates[0],23.2),row(dates[4],110.3)];
 const values=[23.16242251,528.40023714,-635.492639395,-137.93636481,110.34412];
 const fallback=dates.map((d,i)=>row(d,values[i],"institutional.sosovalue"));
 const report=calculateBtcReviewScenario(manifest,{etf_review_rows:[...primary,...fallback]});
 assert.equal(report.provenance.etf_net_flow.source_id,"institutional.sosovalue");
 assert.ok(report.provenance.etf_net_flow.fallback_reason);
 assert.ok(Math.abs(report.intermediate_calculations.etf_net_flow_5d_usd_millions+111.522224555)<1e-8);
});
test("fails closed without BTC historical candles",()=>{
 assert.throws(()=>calculateBtcReviewScenario({sources:[]},{etf_review_rows:[]}),/hourly BTC\/USD history/);
});
