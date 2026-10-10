import { postgresSql } from "@crypto/vps-runtime";
import { londonDayBoundary } from "./schedule.js";

export interface WorkerEnv { DATABASE_URL: string; }

const COINGECKO_IDS:Record<string,string>={BTC:"bitcoin",DASH:"dash",ETH:"ethereum",SOL:"solana",CAKE:"pancakeswap-token",BCH:"bitcoin-cash",LTC:"litecoin",XRP:"ripple",TRX:"tron"};
const KRAKEN_USD_PAIRS:Record<string,string>={BTC:"XBTUSD",ETH:"ETHUSD",LTC:"LTCUSD",BCH:"BCHUSD",XRP:"XRPUSD",SOL:"SOLUSD"};

async function binanceKlines(symbol:string,interval:string,limit:number){
 const query=`symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
 const endpoints=[`https://data-api.binance.vision/api/v3/klines?${query}`,`https://api-gcp.binance.com/api/v3/klines?${query}`,`https://api.binance.com/api/v3/klines?${query}`];
 for(const endpoint of endpoints){
  try{
   const response=await fetch(endpoint,{headers:{Accept:"application/json"}});
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
 const response=await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1440`,{headers:{Accept:"application/json"}});
 if(!response.ok)throw new Error(`Kraken ${asset}: ${response.status}`);
 const data=await response.json() as any;
 const key=Object.keys(data?.result??{}).find(k=>k!=="last");
 const rows=key?data.result[key]:[];
 return Array.isArray(rows)?rows.map((r:any)=>({time:new Date(Number(r[0])*1000).toISOString(),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[6]??0)})).filter((r:any)=>Number.isFinite(r.close)&&r.close>0):[];
}

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
  const openAt=londonDayBoundary(new Date(row.time));
  const closeAt=londonDayBoundary(new Date(openAt.getTime()+36*60*60*1000));
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

async function refreshResearchReviewStatus(sql:any){
 // Market-candle ingestion does not recalculate monitoring signals. Do not touch
 // their last_updated_at: that timestamp must describe signal evaluation, not worker activity.
 await sql`update research_status set status='outdated',reason='Scheduled market-data ingestion: published research is past its review date.',updated_at=now() where status='current' and next_review_at is not null and next_review_at < now()`;
}



export async function runScheduledIngestion(env:WorkerEnv){
  if(!env.DATABASE_URL)return {assets:0,successful:0,written:0};
  const sql=postgresSql(env.DATABASE_URL);
  const assets=await sql`select asset_id,symbol,binance_symbol from assets where enabled=true order by symbol`;
  const ingestionResults=await Promise.allSettled(assets.map(async asset=>ingestAssetDaily(sql,asset)));
  const successfulIngestion=ingestionResults.filter((result): result is PromiseFulfilledResult<{asset_id:string;rows:number;source:string|null}> => result.status==="fulfilled" && result.value.rows>0);
  if(successfulIngestion.length>0){
    try{await refreshResearchReviewStatus(sql);}catch{}
  }
  return {assets:assets.length,successful:successfulIngestion.length,written:successfulIngestion.reduce((sum,result)=>sum+result.value.rows,0)};
}
