import { readFile } from "node:fs/promises";
function normalizeBlocks(snapshot){
 if(!snapshot||snapshot.status!=="REVIEW_ONLY_PER_BLOCK_WINDOW_VERIFIED"||!Array.isArray(snapshot.blocks))throw Error("snapshot is not a verified review-only fee window");
 const map=new Map();
 for(const b of snapshot.blocks){if(!Number.isInteger(b.height)||map.has(b.height))throw Error("invalid or duplicate block height");map.set(b.height,b);}
 if(map.size!==144)throw Error("snapshot must contain 144 blocks");
 const heights=[...map.keys()].sort((a,b)=>a-b);
 for(let i=1;i<heights.length;i++)if(heights[i]!==heights[i-1]+1)throw Error("snapshot block heights must be contiguous");
 return map;
}
export function compareBtcFeeWindows(olderSnapshot,newerSnapshot,minAdvance=6){
 const older=normalizeBlocks(olderSnapshot),newer=normalizeBlocks(newerSnapshot);
 const oldEnd=Math.max(...older.keys()),newEnd=Math.max(...newer.keys());
 if(newEnd-oldEnd<minAdvance)throw Error(`new window must advance at least ${minAdvance} blocks beyond older end`);
 const overlap=[...older.keys()].filter(h=>newer.has(h)).sort((a,b)=>a-b);
 if(overlap.length===0)throw Error("snapshots have no overlapping block heights to compare");
 const changed=[];
 for(const h of overlap){const a=older.get(h),b=newer.get(h);if(a.hash!==b.hash||a.previousblockhash!==b.previousblockhash||a.total_fees_sats!==b.total_fees_sats)changed.push({height:h,older:{hash:a.hash,previousblockhash:a.previousblockhash,total_fees_sats:a.total_fees_sats},newer:{hash:b.hash,previousblockhash:b.previousblockhash,total_fees_sats:b.total_fees_sats}});}
 return {status:changed.length?"REORG_OR_ROW_REVISION_REVIEW_REQUIRED":"OVERLAP_UNCHANGED_AFTER_CONFIRMATION_INTERVAL",older_window:{start_height:Math.min(...older.keys()),end_height:oldEnd},newer_window:{start_height:Math.min(...newer.keys()),end_height:newEnd},minimum_advance_blocks:minAdvance,actual_advance_blocks:newEnd-oldEnd,overlap_block_count:overlap.length,changed_blocks:changed,acceptance_boundary:"Review only. An unchanged overlap describes these two captures; it does not prove permanent finality or pin the deployed API version."};
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
 const [a,b]=process.argv.slice(2);if(!a||!b){console.error("Usage: node scripts/compare-btc-fee-windows.mjs older-window.json newer-window.json");process.exit(2);}
 const result=compareBtcFeeWindows(JSON.parse(await readFile(a,"utf8")),JSON.parse(await readFile(b,"utf8")));console.log(JSON.stringify(result,null,2));if(result.changed_blocks.length)process.exitCode=1;
}
