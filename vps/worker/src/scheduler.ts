import { neon } from "../../api/src/db.js";

export interface WorkerEnv { DATABASE_URL: string; }

async function ingestAssetDaily(sql:any, asset:any){
 const assetSymbol=String(asset.symbol).toUpperCase();
 const binanceSymbol=String(asset.binance_symbol||assetSymbol+"USDT").toUpperCase();
 let rows:any[]=[];
 let sourceId="market_binance";
 try{rows=await binanceKlines(binanceSymbol,"1d",8);}catch{}
 if(!rows.length){
  try{rows=await krakenUsdKlines(assetSymbol);sourceId="market_kraken";}catch{}
 }
 if(!rows.length){
  try{
   const gecko=coingeckoDaily(await coingeckoUsdKlines(assetSymbol,14));
   rows=gecko.map((r:any)=>({time:r.time,open:r.close,high:r.close,low:r.close,close:r.close,volume:0}));
   sourceId="market_coingecko";
  }catch{}
 }
 if(!rows.length)return {asset_id:asset.asset_id,rows:0,source:null};
 let written=0;
 const sourceSymbol=sourceId==="market_kraken"?(KRAKEN_USD_PAIRS[assetSymbol]??binanceSymbol):sourceId==="market_coingecko"?COINGECKO_IDS[assetSymbol]??binanceSymbol:binanceSymbol;
 for(const row of rows.slice(-8)){
  const openAt=new Date(row.time);
  const closeAt=new Date(openAt.getTime()+24*60*60*1000);
  const openPrice=Number(row.open??row.close),high=Number(row.high??row.close),low=Number(row.low??row.close),close=Number(row.close),volume=Number(row.volume??0);
  if(![openAt.getTime(),closeAt.getTime(),openPrice,high,low,close].every(Number.isFinite))continue;
  await sql`insert into market_daily_candles(asset_id,candle_open_at,candle_close_at,open_price,high_price,low_price,close_price,volume,source_id,source_symbol)
    values(${asset.asset_id},${openAt.toISOString()},${closeAt.toISOString()},${openPrice},${high},${low},${close},${volume||null},${sourceId},${sourceSymbol})
    on conflict(asset_id,candle_open_at) do update set
      candle_close_at=excluded.candle_close_at,open_price=excluded.open_price,high_price=excluded.high_price,
      low_price=excluded.low_price,close_price=excluded.close_price,volume=excluded.volume,
      source_id=excluded.source_id,source_symbol=excluded.source_symbol`;
  written++;
 }
 return {asset_id:asset.asset_id,rows:written,source:sourceId};
}

async function coingeckoUsdKlines(asset:string,days:number){
 const id=COINGECKO_IDS[asset];
 if(!id)return [];
 const endpoint=`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${Math.max(1,Math.min(days,90))}`;
 const response=await fetch(endpoint,{headers:{Accept:"application/json"}});
 if(!response.ok)throw new Error(`CoinGecko ${asset}: ${response.status}`);
 const data=await response.json() as any;
 return Array.isArray(data?.prices)?data.prices.map((r:any)=>({time:new Date(Number(r[0])).toISOString(),close:Number(r[1])})).filter((r:any)=>Number.isFinite(r.close)&&r.close>0):[];
}

function coingeckoDaily(rows:any[]){
 const byDay=new Map<string,any>();
 for(const row of rows){
  const day=new Date(row.time).toISOString().slice(0,10);
  byDay.set(day,row);
 }
 return [...byDay.values()].sort((a,b)=>a.time.localeCompare(b.time));
}

async function refreshMonitoring(sql:any){
 await sql`update monitoring_signals set last_updated_at=now() where status <> 'disabled'`;
 await sql`update research_status set status='outdated',reason='Scheduled monitoring refresh: published research is past its review date.',updated_at=now() where status='current' and next_review_at is not null and next_review_at < now()`;
}



export async function runScheduledIngestion(env:WorkerEnv){
  if(!env.DATABASE_URL)return {assets:0,successful:0,written:0};
  const sql=neon(env.DATABASE_URL);
  const assets=await sql`select asset_id,symbol,binance_symbol from assets where enabled=true order by symbol`;
  const ingestionResults=await Promise.allSettled(assets.map(async asset=>ingestAssetDaily(sql,asset)));
  const successfulIngestion=ingestionResults.filter((result): result is PromiseFulfilledResult<{asset_id:string;rows:number;source:string|null}> => result.status==="fulfilled" && result.value.rows>0);
  if(successfulIngestion.length>0){
    try{await refreshMonitoring(sql);}catch{}
  }
  return {assets:assets.length,successful:successfulIngestion.length,written:successfulIngestion.reduce((sum,result)=>sum+result.value.rows,0)};
}
