import test from "node:test";
import assert from "node:assert/strict";
import { validateBtcFeeWindow } from "./validate-btc-fee-window.mjs";
import { calculateProtocolIssuedSupplySats } from "./btc-protocol-supply.mjs";
function fixture(){
 const start=900000;
 const blocks=Array.from({length:144},(_,i)=>({height:start+i,hash:(i+1).toString(16).padStart(64,"0"),previousblockhash:i?i.toString(16).padStart(64,"0"):"f".repeat(64),total_fees_sats:1000,timestamp:1800000000+i}));
 const subsidy=blocks.reduce((s,b)=>s+Number(calculateProtocolIssuedSupplySats(b.height)-calculateProtocolIssuedSupplySats(b.height-1)),0);
 const boundary={start:blocks[0].hash,end:blocks.at(-1).hash};
 return {stats:{startBlock:start,endBlock:start+143,totalFee:144000,totalReward:144000+subsidy},blocks,boundary,tip:{height:start+143,hash:blocks.at(-1).hash}};
}
test("accepts 144 contiguous blocks with matching fee and subsidy aggregates",()=>{
 const f=fixture();const r=validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,f.tip);
 assert.equal(r.status,"REVIEW_ONLY_PER_BLOCK_WINDOW_VERIFIED");assert.equal(r.block_count,144);assert.equal(r.total_fees_sats,144000);
});
test("rejects parent hash mismatch",()=>{const f=fixture();f.blocks[50].previousblockhash="e".repeat(64);assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,f.tip),/parent hash mismatch/);});
test("rejects aggregate fee disagreement",()=>{const f=fixture();f.stats.totalFee++;assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,f.tip),/fee sum disagrees/);});
test("rejects subsidy disagreement",()=>{const f=fixture();f.stats.totalReward++;assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,f.tip),/subsidy disagrees/);});
test("rejects changed boundary or tip",()=>{const f=fixture();assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,{...f.boundary,start:"e".repeat(64)},f.boundary,f.tip,f.tip),/boundary hashes changed/);assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,{...f.tip,height:f.tip.height+1}),/tip changed/);});
test("rejects incomplete coverage",()=>{const f=fixture();f.blocks.pop();assert.throws(()=>validateBtcFeeWindow(f.stats,f.blocks,f.boundary,f.boundary,f.tip,f.tip),/expected 144 block records/);});
