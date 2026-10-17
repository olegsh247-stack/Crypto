import test from "node:test";
import assert from "node:assert/strict";
import { parseWindow } from "./capture-btc-fee-subsidy-window.mjs";

function fixture() {
  const start = 900000;
  const blocks = Array.from({length:144},(_,i)=>({
    height:start+i,id:(i+1).toString(16).padStart(64,"0"),
    previousblockhash:i===0?"f".repeat(64):i.toString(16).padStart(64,"0"),
    timestamp:1800000000+i,extras:{totalFees:1000}
  }));
  // previousblockhash for height start+i must equal the prior block's id
  for(let i=1;i<blocks.length;i++) blocks[i].previousblockhash=blocks[i-1].id;
  const subsidy=blocks.reduce((s,b)=>s+Number((50n*100000000n >> BigInt(Math.floor(b.height/210000)))-(50n*100000000n >> BigInt(Math.floor((b.height-1)/210000)))),0);
  return {
    stats:{startBlock:start,endBlock:start+143,totalFee:144000,totalReward:144000+subsidy},
    pages:[{url:"test",raw:"{}",blocks}],
    before:{start:blocks[0].id,end:blocks.at(-1).id},
    after:{start:blocks[0].id,end:blocks.at(-1).id},
    tipBefore:{height:start+143,hash:blocks.at(-1).id},
    tipAfter:{height:start+143,hash:blocks.at(-1).id}
  };
}
test("accepts exactly 144 contiguous blocks when fees, subsidy and boundaries reconcile",async()=>{
 const f=fixture();
 const r=await parseWindow(f.stats,f.pages,f.before,f.after,f.tipBefore,f.tipAfter);
 assert.equal(r.status,"REVIEW_ONLY_PER_BLOCK_WINDOW_VERIFIED");
 assert.equal(r.window.block_count,144);
 assert.equal(r.total_fees_sats,144000);
 assert.equal(r.aggregate_fee_reconciliation,"MATCH");
 assert.equal(r.aggregate_subsidy_reconciliation,"MATCH");
});
test("rejects an interior parent-link mismatch",async()=>{
 const f=fixture(); f.pages[0].blocks[50].previousblockhash="e".repeat(64);
 await assert.rejects(()=>parseWindow(f.stats,f.pages,f.before,f.after,f.tipBefore,f.tipAfter),/Parent hash mismatch/);
});
test("rejects fee aggregate disagreement",async()=>{
 const f=fixture(); f.stats.totalFee++;
 await assert.rejects(()=>parseWindow(f.stats,f.pages,f.before,f.after,f.tipBefore,f.tipAfter),/does not match aggregate/);
});
test("rejects a changed canonical boundary or tip",async()=>{
 const f=fixture(); f.after.start="d".repeat(64);
 await assert.rejects(()=>parseWindow(f.stats,f.pages,f.before,f.after,f.tipBefore,f.tipAfter),/boundary block hash changed/);
});
test("rejects incomplete or duplicate block coverage",async()=>{
 const f=fixture(); f.pages[0].blocks.pop();
 await assert.rejects(()=>parseWindow(f.stats,f.pages,f.before,f.after,f.tipBefore,f.tipAfter),/Expected 144 distinct/);
});
