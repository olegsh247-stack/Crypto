// Pure checks for a 144-block BTC fee/subsidy evidence window.
import { calculateProtocolIssuedSupplySats } from "./btc-protocol-supply.mjs";
export function validateBtcFeeWindow(stats, blocks, boundary, boundaryAfter, tip, tipAfter) {
  const start=Number(stats.startBlock), end=Number(stats.endBlock);
  if (!Number.isInteger(start)||!Number.isInteger(end)||end-start+1!==144) throw Error("window must contain exactly 144 heights");
  if (!Array.isArray(blocks)||blocks.length!==144) throw Error("expected 144 block records");
  const ordered=[...blocks].sort((a,b)=>a.height-b.height);
  for(let i=0;i<144;i++){
    const b=ordered[i];
    if(b.height!==start+i||!/^[0-9a-f]{64}$/i.test(b.hash)||!/^[0-9a-f]{64}$/i.test(b.previousblockhash)||!Number.isSafeInteger(b.total_fees_sats)||b.total_fees_sats<0) throw Error("invalid/missing block at expected height "+(start+i));
    if(i&&b.previousblockhash!==ordered[i-1].hash) throw Error("parent hash mismatch at "+b.height);
  }
  const fees=ordered.reduce((s,b)=>s+b.total_fees_sats,0);
  if(fees!==Number(stats.totalFee)) throw Error("per-block fee sum disagrees with aggregate");
  const subsidy=ordered.reduce((s,b)=>s+Number(calculateProtocolIssuedSupplySats(b.height)-calculateProtocolIssuedSupplySats(b.height-1)),0);
  if(subsidy!==Number(stats.totalReward)-Number(stats.totalFee)) throw Error("subsidy disagrees with aggregate reward minus fees");
  if(boundary.start!==boundaryAfter.start||boundary.end!==boundaryAfter.end) throw Error("boundary hashes changed");
  if(boundary.start!==ordered[0].hash||boundary.end!==ordered.at(-1).hash) throw Error("boundary hash mismatch");
  if(tip.height!==tipAfter.height||tip.hash!==tipAfter.hash||tipAfter.height<end) throw Error("tip changed or behind window");
  return {status:"REVIEW_ONLY_PER_BLOCK_WINDOW_VERIFIED",start_height:start,end_height:end,block_count:144,total_fees_sats:fees,protocol_subsidy_sats:subsidy,fee_subsidy_ratio:fees/subsidy};
}
