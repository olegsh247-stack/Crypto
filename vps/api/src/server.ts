import http from "node:http";
import { closePool } from "./db.js";
import app, { type Env } from "./app.js";

const port=Number(process.env.PORT??8080);
const host=process.env.HOST??"127.0.0.1";
const env:Env={DATABASE_URL:process.env.DATABASE_URL??"",ADMIN_TOKEN:process.env.ADMIN_TOKEN};

const server=http.createServer(async(req,res)=>{
  try{
    const hostHeader=req.headers.host??"localhost";
    const url=new URL(req.url??"/",`http://${hostHeader}`);
    const chunks:Buffer[]=[];
    for await(const chunk of req) chunks.push(Buffer.from(chunk));
    const body=chunks.length?Buffer.concat(chunks):undefined;
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers)){
      if(value!==undefined) headers.set(key,Array.isArray(value)?value.join(","):value);
    }
    const request=new Request(url,{method:req.method,headers,body:req.method==="GET"||req.method==="HEAD"?undefined:body as BodyInit|undefined});
    const response=await app.fetch(request,env);
    res.statusCode=response.status;
    response.headers.forEach((value,key)=>res.setHeader(key,value));
    const bytes=new Uint8Array(await response.arrayBuffer());
    res.end(Buffer.from(bytes));
  }catch(error){
    res.statusCode=500;res.setHeader("content-type","application/json");res.end(JSON.stringify({status:"error",error:"internal_server_error"}));
  }
});
server.listen(port,host,()=>console.log(`crypto-api-vps listening on ${host}:${port}`));
async function shutdown(){await closePool();server.close(()=>process.exit(0));}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
