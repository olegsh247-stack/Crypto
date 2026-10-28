import { closePool, createSqlClient } from "@crypto/vps-runtime";
import { refreshBtcObservationInputs } from "./btc-observations.js";

export interface WorkerEnv { DATABASE_URL: string; BTC_OBSERVATION_INGESTION_ENABLED?: string; }

const KRAKEN_USD_PAIRS:Record<string,string>={BTC:"XBTUSD",ETH:"ETHUSD",LTC:"LTCUSD",BCH:"BCHUSD",XRP:"XRPUSD",SOL:"SOLUSD"};

async function binanceKlines(symbol:string,interval:string,limit:number){
 const query=`symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
 const endpoints=[`https://data-api.binance.vision/api/v3/klines?${query}`,`https://api-gcp.binance.com/api/v3/klines?${query}`,`https://api.binance.com/api/v3/klines?${query}`];
 for(const endpoint of endpoints){
  try{
   const response=await fetch(endpoint,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(10_000)});
   if(response.ok){
    const rows=await response.json() as unknown[];
    if(Array.isArray(rows)&&rows.length)return rows.map((r:any)=>({time:new Date(Number(r[0])).toISOString(),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])}));
   }
  }catch{}
 }
 throw new Error(`Binance ${symbol}: unavailable`);
}

async function krakenUsdKlines(asset:string){
 const pair=KRAKEN_USD_PAIRS[asset];
 if(!pair)return [];
 const response=await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1440`,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(10_000)});
 if(!response.ok)throw new Error(`Kraken ${asset}: ${response.status}`);
 const data=await response.json() as any;
 const key=Object.keys(data?.result??{}).find(k=>k!=="last");
 const rows=key?data.result[key]:[];
 return Array.isArray(rows)?rows.map((r:any)=>({time:new Date(Number(r[0])*1000).toISOString(),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[6])})).filter((r:any)=>Number.isFinite(r.close)&&r.close>0):[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DailyCandleRow { time:string; open:number; high:number; low:number; close:number; volume:number; sourceId?:string; sourceSymbol?:string; }

export function mergeRecentDailyCandleRows(binanceRows:DailyCandleRow[],krakenRows:DailyCandleRow[],assetSymbol:string,binanceSymbol:string,now:Date){
 const expectedOpenTimes=Array.from({length:8},(_,index)=>utcDayBoundary(now).getTime()-(index+1)*DAY_MS);
 const rowsByOpenTime=new Map<number,DailyCandleRow>();
 for(const row of binanceRows){
  const openAt=utcDayBoundary(new Date(row.time));
  if(isClosedUtcDailyCandle(openAt,now)&&expectedOpenTimes.includes(openAt.getTime()))rowsByOpenTime.set(openAt.getTime(),{...row,sourceId:"market_binance",sourceSymbol:binanceSymbol});
 }
 // Fill only dates missing from Binance. Binance remains the preferred source for overlapping dates.
 const missingDays=expectedOpenTimes.filter(openTime=>!rowsByOpenTime.has(openTime));
 const krakenPair=KRAKEN_USD_PAIRS[assetSymbol];
 if(krakenPair){
  for(const row of krakenRows){
   const openAt=utcDayBoundary(new Date(row.time));
   if(isClosedUtcDailyCandle(openAt,now)&&missingDays.includes(openAt.getTime())&&!rowsByOpenTime.has(openAt.getTime())){
    rowsByOpenTime.set(openAt.getTime(),{...row,sourceId:"market_kraken",sourceSymbol:krakenPair});
   }
  }
 }
 return [...rowsByOpenTime.entries()].sort((a,b)=>a[0]-b[0]).map(([,row])=>row);
}

async function ingestAssetDaily(sql:any, asset:any){
 const assetSymbol=String(asset.symbol).toUpperCase();
 const binanceSymbol=String(asset.binance_symbol||assetSymbol+"USDT").toUpperCase();
 const now=new Date();
 let binanceRows:DailyCandleRow[]=[];
 const fetchFailures:Array<{source:string;reason:string}>=[];
 try{binanceRows=await binanceKlines(binanceSymbol,"1d",10);}
 catch(error){fetchFailures.push({source:"market_binance",reason:error instanceof Error?error.message:"binance_fetch_failed"});}
 const binanceTimes=new Set(binanceRows.filter(row=>isClosedUtcDailyCandle(new Date(row.time),now)).map(row=>utcDayBoundary(new Date(row.time)).getTime()));
 const expectedOpenTimes=Array.from({length:8},(_,index)=>utcDayBoundary(now).getTime()-(index+1)*DAY_MS);
 const missingDays=expectedOpenTimes.some(openTime=>!binanceTimes.has(openTime));
 let krakenRows:DailyCandleRow[]=[];
 if(missingDays&&KRAKEN_USD_PAIRS[assetSymbol]){
  try{krakenRows=await krakenUsdKlines(assetSymbol);}
  catch(error){fetchFailures.push({source:"market_kraken",reason:error instanceof Error?error.message:"kraken_fetch_failed"});}
 }
 const rows=mergeRecentDailyCandleRows(binanceRows,krakenRows,assetSymbol,binanceSymbol,now);
 if(!rows.length)return {asset_id:asset.asset_id,rows:0,source:null,fetch_failures:fetchFailures};
 let written=0;
 const writtenSources=new Set<string>();
 for(const row of rows){
  const openAt=utcDayBoundary(new Date(row.time));
  const closeAt=new Date(openAt.getTime()+DAY_MS);
  const openPrice=Number(row.open),high=Number(row.high),low=Number(row.low),close=Number(row.close),volume=Number(row.volume);
  if(![openAt.getTime(),closeAt.getTime(),openPrice,high,low,close,volume].every(Number.isFinite))continue;
  if(openPrice<=0||high<=0||low<=0||close<=0||volume<0)continue;
  const upserted = await sql`insert into market_daily_candles(asset_id,candle_open_at,candle_close_at,open_price,high_price,low_price,close_price,volume,source_id,source_symbol)
    values(${asset.asset_id},${openAt.toISOString()},${closeAt.toISOString()},${openPrice},${high},${low},${close},${volume},${row.sourceId},${row.sourceSymbol})
    on conflict(asset_id,candle_open_at) do update set
      candle_close_at=excluded.candle_close_at,open_price=excluded.open_price,high_price=excluded.high_price,low_price=excluded.low_price,close_price=excluded.close_price,volume=excluded.volume,
      source_id=excluded.source_id,source_symbol=excluded.source_symbol
    where (case when excluded.source_id='market_binance' then 2 else 1 end)
      >= (case when market_daily_candles.source_id='market_binance' then 2 else 1 end)
    returning asset_id`;
  // PostgreSQL returns no row when the conflict precedence rule intentionally skips the update.
  // Count only rows actually inserted or updated, not attempted upserts.
  if (upserted.length > 0) {
    written++;
    writtenSources.add(row.sourceId??"unknown");
  }
 }
 return {asset_id:asset.asset_id,rows:written,source:writtenSources.size===1?[...writtenSources][0]:[...writtenSources].sort().join("+"),fetch_failures:fetchFailures};
}
export function utcDayBoundary(input:Date){
 return new Date(Date.UTC(input.getUTCFullYear(),input.getUTCMonth(),input.getUTCDate()));
}

export function isClosedUtcDailyCandle(openAt:Date,now:Date=new Date()){
 const start=utcDayBoundary(openAt).getTime();
 return Number.isFinite(start)&&start+DAY_MS<=now.getTime();
}

async function refreshResearchReviewStatus(sql:any){
 await sql`update research_status set status='outdated',reason='Scheduled ingestion review: published research is past its review date.',updated_at=now() where status='current' and next_review_at is not null and next_review_at < now()`;
}



export async function runScheduledIngestion(env:WorkerEnv){
  if(!env.DATABASE_URL)return {assets:0,successful:0,written:0};
  const sql=createSqlClient(env.DATABASE_URL);
  try {
    const assets=await sql`select asset_id,symbol,binance_symbol from assets where enabled=true order by symbol`;
    const ingestionResults=await Promise.allSettled(assets.map(async asset=>ingestAssetDaily(sql,asset)));
    const successfulIngestion=ingestionResults.filter((result): result is PromiseFulfilledResult<{asset_id:string;rows:number;source:string|null;fetch_failures?:Array<{source:string;reason:string}>}> => result.status==="fulfilled" && result.value.rows>0);
    const ingestionFailures=ingestionResults.flatMap((result,index)=>result.status==="rejected"
      ? [{asset_id:assets[index].asset_id,symbol:assets[index].symbol,source:"database",reason:result.reason instanceof Error?result.reason.message:"candle_ingestion_failed"}]
      : result.value.fetch_failures.map(failure=>({asset_id:assets[index].asset_id,symbol:assets[index].symbol,...failure})));
    // Review deadlines are independent of whether a market candle was fetched successfully.
    try{await refreshResearchReviewStatus(sql);}catch{}
    const btcObservations = env.BTC_OBSERVATION_INGESTION_ENABLED === "true"
      ? await refreshBtcObservationInputs(env.DATABASE_URL)
      : {status:"disabled",candidate_count:0,inserted:0,revised:0,unchanged:0,failures:[],unresolved_metrics:[]};
    return {assets:assets.length,successful:successfulIngestion.length,written:successfulIngestion.reduce((sum,result)=>sum+result.value.rows,0),candle_ingestion:{failures:ingestionFailures},btc_observations:btcObservations};
  } finally {
    await closePool();
  }
}
