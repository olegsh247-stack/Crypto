import { runScheduledIngestion } from "./scheduler.js";

const intervalMs=Number(process.env.WORKER_INTERVAL_MS??86400000);
const env={DATABASE_URL:process.env.DATABASE_URL??""};

async function run(){
  try{
    const result=await runScheduledIngestion(env);
    console.log(JSON.stringify({status:"ok",service:"crypto-worker-vps",...result}));
  }catch(error){
    console.error(JSON.stringify({status:"error",service:"crypto-worker-vps",error:error instanceof Error?error.message:"worker_failed"}));
  }
}

let timer:NodeJS.Timeout|undefined;
void run();
if(intervalMs>0) timer=setInterval(run,intervalMs);

function shutdown(){
  if(timer)clearInterval(timer);
  process.exit(0);
}
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);
