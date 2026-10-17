#!/usr/bin/env node
// Read-only capture of per-block fees and chain identity for the latest 144 blocks.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validateBtcFeeWindow } from "./validate-btc-fee-window.mjs";
const out=join(process.cwd(),"tmp","btc-source-review");
await mkdir(out,{recursive:true});
const base="https://mempool.space/api";
async function get(url){const r=await fetch(url,{headers:{"user-agent":"Crypto-BTC-Source-Review/1.0",accept:"application/json,text/plain,*/*"},signal:AbortSignal.timeout(20000)});const body=await r.text();if(!r.ok)throw Error("HTTP "+r.status+" "+url);return {url,body,json:()=>JSON.parse(body)};}
async function main(){
 const agg=await get(base+"/v1/mining/reward-stats/144"),stats=agg.json();
 const [th1,hh1]=await Promise.all([get(base+"/blocks/tip/height"),get(base+"/blocks/tip/hash")]);
 const tip={height:Number(th1.body.trim()),hash:hh1.body.trim().toLowerCase()};
 const start=Number(stats.startBlock),end=Number(stats.endBlock);
 if(!Number.isInteger(start)||!Number.isInteger(end)||end-start+1!==144)throw Error("aggregate endpoint did not return 144 contiguous heights");
 const [s1,e1]=await Promise.all([get(base+"/block-height/"+start),get(base+"/block-height/"+end)]);
 const boundary={start:s1.body.trim().toLowerCase(),end:e1.body.trim().toLowerCase()};
 const pages=[];
 for(let h=end;h>=start;h-=15){const p=await get(base+"/v1/blocks/"+h);pages.push({url:p.url,body:p.body,blocks:p.json()});}
 const blocks=[];
 for(const p of pages)for(const b of p.blocks){const h=Number(b.height);if(h>=start&&h<=end)blocks.push({height:h,hash:String(b.id??"").toLowerCase(),previousblockhash:String(b.previousblockhash??"").toLowerCase(),total_fees_sats:Number(b.extras?.totalFees),timestamp:Number(b.timestamp)});}
 const [s2,e2,th2,hh2]=await Promise.all([get(base+"/block-height/"+start),get(base+"/block-height/"+end),get(base+"/blocks/tip/height"),get(base+"/blocks/tip/hash")]);
 const boundaryAfter={start:s2.body.trim().toLowerCase(),end:e2.body.trim().toLowerCase()};
 const tipAfter={height:Number(th2.body.trim()),hash:hh2.body.trim().toLowerCase()};
 const checked=validateBtcFeeWindow(stats,blocks,boundary,boundaryAfter,tip,tipAfter);
 const evidence={...checked,source:"Mempool.space public API",source_id:"network.primary",retrieved_at:new Date().toISOString(),aggregate:{url:agg.url,body:stats},boundary_before:boundary,boundary_after:boundaryAfter,tip_before:tip,tip_after:tipAfter,blocks,provenance:{aggregate_url:agg.url,page_urls:pages.map(p=>p.url),page_payloads:pages.map(p=>({url:p.url,body:p.body})),note:"Review-only. Boundary hashes and tip are rechecked; all 144 parent links must be contiguous. Re-capture after confirmation interval before acceptance."}};
 await writeFile(join(out,"btc-fee-subsidy-window-144.json"),JSON.stringify(evidence,null,2)+"\n");
 console.log(JSON.stringify({status:checked.status,start_height:start,end_height:end,total_fees_sats:checked.total_fees_sats,protocol_subsidy_sats:checked.protocol_subsidy_sats,fee_subsidy_ratio:checked.fee_subsidy_ratio}));
}
main().catch(async e=>{const failure={status:"BLOCKED_PER_BLOCK_FEE_SUBSIDY_AUDIT",retrieved_at:new Date().toISOString(),error:e instanceof Error?e.message:String(e),no_ingestion:true};await writeFile(join(out,"btc-fee-subsidy-window-144.json"),JSON.stringify(failure,null,2)+"\n");console.error(JSON.stringify(failure));process.exitCode=1;});
