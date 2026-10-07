import pg from "pg";
const { Pool } = pg;

export type Sql = <T = any>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>;

let pool: InstanceType<typeof Pool> | null = null;
function getPool(databaseUrl: string) {
  if (!pool) pool = new Pool({connectionString:databaseUrl,max:Number(process.env.PGPOOL_MAX??10),idleTimeoutMillis:Number(process.env.PGPOOL_IDLE_TIMEOUT_MS??30000),connectionTimeoutMillis:Number(process.env.PGPOOL_CONNECTION_TIMEOUT_MS??10000)});
  return pool;
}
export function neon(databaseUrl: string): Sql {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const p=getPool(databaseUrl);
  return async <T=any>(strings: TemplateStringsArray,...values:unknown[])=>{
    let text=""; const params:unknown[]=[];
    for(let i=0;i<strings.length;i++){text+=strings[i];if(i<values.length){params.push(values[i]);text+="$"+params.length;}}
    const result=await p.query(text,params); return result.rows as T[];
  };
}
export async function closePool(){if(pool){await pool.end();pool=null;}}
