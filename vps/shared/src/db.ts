import pg from "pg";
const { Pool } = pg;

export type Sql = <T = any>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>;

let pool: InstanceType<typeof Pool> | null = null;

function getPool(databaseUrl: string) {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT_MS ?? 30000),
      connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT_MS ?? 10000)
    });
  }
  return pool;
}

export function createSqlClient(databaseUrl: string): Sql {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const p = getPool(databaseUrl);
  return async <T = any>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = "";
    const params: unknown[] = [];
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        text += "$" + params.length;
      }
    }
    const result = await p.query(text, params);
    return result.rows as T[];
  };
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}


export interface SqlTransactionClient {
  query(text: string, values?: any[]): Promise<{ rows: any[] }>;
  release(): void;
}

/** Run related observation reads/writes on one PostgreSQL connection and transaction. */
export async function withSqlTransaction<T>(
  databaseUrl: string,
  callback: (client: SqlTransactionClient) => Promise<T>
): Promise<T> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const client = await getPool(databaseUrl).connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
