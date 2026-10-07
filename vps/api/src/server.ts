import http from "node:http";
import { createPostgresSql } from "./db.js";

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "127.0.0.1";
const { sql, close } = createPostgresSql(process.env.DATABASE_URL ?? "");

const corsHeaders: Record<string,string> = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin"
};

function send(res: http.ServerResponse, data: unknown, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders });
  res.end(body);
}

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown> | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>; } catch { return null; }
}

function admin(req: http.IncomingMessage) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) return { status: 503, body: { status: "error", error: "admin_auth_not_configured" } };
  return req.headers.authorization === `Bearer ${configured}`
    ? null
    : { status: 401, body: { status: "error", error: "admin_auth_required" } };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "OPTIONS") return send(res, null, 204);

    if (url.pathname === "/api/health" && req.method === "GET")
      return send(res, { status: "ok", service: "crypto-api-vps" });

    if (url.pathname === "/api/db-health" && req.method === "GET") {
      try {
        const rows = await sql`select now() as now`;
        return send(res, { status: "ok", service: "crypto-api-vps", database: "ok", now: rows[0]?.now ?? null });
      } catch {
        return send(res, { status: "error", service: "crypto-api-vps", database: "unavailable" }, 503);
      }
    }

    if (url.pathname === "/api/admin/db-schema" && req.method === "GET") {
      const auth = admin(req); if (auth) return send(res, auth.body, auth.status);
      const [tables, columns, constraints, indexes] = await Promise.all([
        sql`select table_schema,table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') and table_type='BASE TABLE' order by table_schema,table_name`,
        sql`select table_schema,table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema not in ('pg_catalog','information_schema') order by table_schema,table_name,ordinal_position`,
        sql`select tc.table_schema,tc.table_name,tc.constraint_name,tc.constraint_type,kcu.column_name,ccu.table_schema as foreign_table_schema,ccu.table_name as foreign_table_name,ccu.column_name as foreign_column_name from information_schema.table_constraints tc left join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema and tc.table_name=kcu.table_name left join information_schema.constraint_column_usage ccu on tc.constraint_name=ccu.constraint_name and tc.table_schema=ccu.table_schema where tc.table_schema not in ('pg_catalog','information_schema') order by tc.table_schema,tc.table_name,tc.constraint_name,kcu.ordinal_position`,
        sql`select schemaname as table_schema,tablename as table_name,indexname as index_name,indexdef as definition from pg_indexes where schemaname not in ('pg_catalog','information_schema') order by schemaname,tablename,indexname`
      ]);
      return send(res,{status:"ok",service:"crypto-api-vps",schema_source:"postgres_information_schema",read_only:true,generated_at:new Date().toISOString(),tables,columns,constraints,indexes});
    }

    return send(res, { status: "ok", service: "crypto-api-vps", message: "VPS API runtime is alive", migration_stage: "adapter-foundation" });
  } catch {
    return send(res, { status: "error", service: "crypto-api-vps", error: "internal_server_error" }, 500);
  }
});

server.listen(PORT, HOST, () => console.log(`crypto-api-vps listening on ${HOST}:${PORT}`));

async function shutdown() { await close(); server.close(() => process.exit(0)); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
