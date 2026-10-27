import test from "node:test";
import assert from "node:assert/strict";
import { compareBtcReviewScenarios } from "./compare-btc-review-scenarios.mjs";
const report=(captured,price=1,flow=10,scenario="base",score=0)=>({
 schema_version:1,captured_at:captured,
 intermediate_calculations:{price_return_7d_pct:price,etf_net_flow_5d_usd_millions:flow},
 provenance:{btc_price:{start_candle:{close_usd_per_btc:100},end_candle:{close_usd_per_btc:100+price},source_payload_sha256:"a"},
 etf_net_flow:{source_id:"institutional.primary",sessions:[{date:"2026-10-26",value_usd_millions:flow,source_row_key:"row-1",source_payload_sha256:"b"}]}},
 output:{status:"evaluated",scenario_type:scenario,directional_score:score,confidence_band:"low",signals:[{input:"price",score:0}]},
});
test("identical inputs and outputs across capture times are stable",()=>{
 const result=compareBtcReviewScenarios(report("t1"),report("t2"));
 assert.deepEqual(result.changed_sections,[]);
 assert.equal(result.inputs_unchanged,true); assert.equal(result.scenario_unchanged,true);
 assert.equal(result.safety.database_writes_performed,false);
});
test("input revisions are reported even when scenario classification stays the same",()=>{
 const result=compareBtcReviewScenarios(report("t1"),report("t2",1.5,20));
 assert.deepEqual(result.changed_sections,["price","etf"]);
 assert.equal(result.inputs_unchanged,false); assert.equal(result.scenario_changed,false);
});
test("scenario output change is explicitly detected",()=>{
 const result=compareBtcReviewScenarios(report("t1"),report("t2",6,600,"bull",3));
 assert.equal(result.scenario_changed,true);
 assert.ok(result.changed_sections.includes("output"));
});
test("rejects non-v1 reports",()=>{
 assert.throws(()=>compareBtcReviewScenarios({},report("t2")),/schema_version 1 required/);
});
