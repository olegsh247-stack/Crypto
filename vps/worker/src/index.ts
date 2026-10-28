import { runScheduledIngestion } from "./scheduler.js";

const scheduleUtc=process.env.WORKER_SCHEDULE_UTC??"00:30";
const match=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(scheduleUtc);
if(!match)throw new Error("WORKER_SCHEDULE_UTC must use HH:mm in UTC, e.g. 00:30");
const [scheduleHour,scheduleMinute]=scheduleUtc.split(":").map(Number);
const env={DATABASE_URL:process.env.DATABASE_URL??"",BTC_OBSERVATION_INGESTION_ENABLED:process.env.BTC_OBSERVATION_INGESTION_ENABLED??"false"}

async function run(){
  try{
    const result=await runScheduledIngestion(env);
    const partial=(result as any).btc_observations?.status==="partial"
      || ((result as any).candle_ingestion?.failures?.length ?? 0) > 0;
    console.log(JSON.stringify({status:partial?"partial":"ok",service:"crypto-worker-vps",...result}));
    return !partial;
  }catch(error){
    console.error(JSON.stringify({status:"error",service:"crypto-worker-vps",error:error instanceof Error?error.message:"worker_failed"}));
    return false;
  }
}

function nextRunAt(now=new Date()){
  const next=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),scheduleHour,scheduleMinute,0,0));
  if(next.getTime()<=now.getTime())next.setUTCDate(next.getUTCDate()+1);
  return next;
}

const runOnce=process.env.WORKER_RUN_ONCE==="1";
let timer:NodeJS.Timeout|undefined;
let stopped=false;
if(runOnce){
  void run().then(ok=>{process.exitCode=ok?0:1;});
}
function scheduleNext(){
  if(stopped||runOnce)return;
  const next=nextRunAt();
  const delay=Math.max(1,next.getTime()-Date.now());
  console.log(JSON.stringify({status:"scheduled",service:"crypto-worker-vps",schedule_utc:scheduleUtc,next_run_at:next.toISOString()}));
  timer=setTimeout(async()=>{
    await run();
    scheduleNext();
  },delay);
}

scheduleNext();

function shutdown(){
  stopped=true;
  if(timer)clearTimeout(timer);
  process.exit(0);
}
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);
