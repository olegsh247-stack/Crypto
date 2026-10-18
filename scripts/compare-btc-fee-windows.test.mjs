import test from "node:test";
import assert from "node:assert/strict";
import { compareBtcFeeWindows } from "./compare-btc-fee-windows.mjs";
function window(start,end){const blocks=[];for(let h=start;h<=end;h++){blocks.push({height:h,hash:h.toString(16).padStart(64,"0"),previousblockhash:(h-1).toString(16).padStart(64,"0"),total_fees_sats:h*10});}return {status:"REVIEW_ONLY_PER_BLOCK_WINDOW_VERIFIED",blocks};}
test("accepts unchanged overlap after six blocks",()=>{const r=compareBtcFeeWindows(window(100,243),window(106,249));assert.equal(r.status,"OVERLAP_UNCHANGED_AFTER_CONFIRMATION_INTERVAL");assert.equal(r.actual_advance_blocks,6);assert.equal(r.overlap_block_count,138);});
test("flags changed hash or fee on an overlapping height",()=>{const a=window(100,243),b=window(106,249);b.blocks.find(x=>x.height===200).hash="f".repeat(64);const r=compareBtcFeeWindows(a,b);assert.equal(r.status,"REORG_OR_ROW_REVISION_REVIEW_REQUIRED");assert.equal(r.changed_blocks.length,1);});
test("requires six-block advance",()=>assert.throws(()=>compareBtcFeeWindows(window(100,243),window(102,245)),/advance at least 6 blocks/));
test("rejects incomplete snapshot",()=>{const a=window(100,243);a.blocks.pop();assert.throws(()=>compareBtcFeeWindows(a,window(106,249)),/144 blocks/);});

test("flags parent-hash changes on overlapping heights",()=>{const a=window(100,243),b=window(106,249);b.blocks.find(x=>x.height===200).previousblockhash="e".repeat(64);const r=compareBtcFeeWindows(a,b);assert.equal(r.status,"REORG_OR_ROW_REVISION_REVIEW_REQUIRED");assert.equal(r.changed_blocks[0].height,200);});
test("flags fee changes on overlapping heights",()=>{const a=window(100,243),b=window(106,249);b.blocks.find(x=>x.height===200).total_fees_sats+=1;const r=compareBtcFeeWindows(a,b);assert.equal(r.status,"REORG_OR_ROW_REVISION_REVIEW_REQUIRED");assert.equal(r.changed_blocks[0].height,200);});
test("rejects discontinuous block heights",()=>{const a=window(100,243);a.blocks[10].height=999;assert.throws(()=>compareBtcFeeWindows(a,window(106,249)),/contiguous/);});
