import http from "node:http";
import { closePool } from "@crypto/vps-runtime";
import app, { type Env } from "./app.js";

const port=Number(process.env.PORT??8080);
const host=process.env.HOST??"127.0.0.1";
const env:Env={DATABASE_URL:process.env.DATABASE_URL??"",ADMIN_TOKEN:process.env.ADMIN_TOKEN};

const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const server=http.createServer(async(req,res)=>{
  const startedAt = Date.now();
  res.on("finish", () => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    console.log(JSON.stringify({ status: "request", method: req.method, path: pathname, status_code: res.statusCode, elapsed_ms: Date.now() - startedAt }));
  });
  try{
    const hostHeader=req.headers.host??"localhost";
    const url=new URL(req.url??"/",`http://${hostHeader}`);
    const declaredLength = Number(req.headers["content-length"] ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
      res.statusCode = 413;
      res.setHeader("content-type", "application/json");
      res.setHeader("connection", "close");
      res.end(JSON.stringify({ status: "error", error: "request_too_large" }));
      req.resume();
      return;
    }
    const chunks:Buffer[]=[];
    let bodyBytes = 0;
    for await(const chunk of req) {
      const bytes = Buffer.from(chunk);
      bodyBytes += bytes.length;
      if (bodyBytes > MAX_REQUEST_BODY_BYTES) {
        res.statusCode = 413;
        res.setHeader("content-type", "application/json");
        res.setHeader("connection", "close");
        res.end(JSON.stringify({ status: "error", error: "request_too_large" }));
        req.resume();
        return;
      }
      chunks.push(bytes);
    }
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
    console.error(JSON.stringify({status:"error",service:"crypto-api-vps",error:"request_failed",name:error instanceof Error?error.name:"unknown"}));
    res.statusCode=500;res.setHeader("content-type","application/json");res.end(JSON.stringify({status:"error",error:"internal_server_error"}));
  }
});
server.requestTimeout = 35_000;
server.headersTimeout = 30_000;
server.keepAliveTimeout = 5_000;
server.setTimeout(30_000, socket => socket.destroy());
server.listen(port,host,()=>console.log(`crypto-api-vps listening on ${host}:${port}`));
async function shutdown(){await closePool();server.close(()=>process.exit(0));}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
