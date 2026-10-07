import pg from "pg";
const { Pool } = pg;

export type SqlRow = Record<string, unknown>;
export type Sql = <T extends SqlRow = SqlRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

function compileQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = "";
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += "$" + params.length;
    }
  }
  return { text, params };
}

export function createPostgresSql(databaseUrl: string): { sql: Sql; close: () => Promise<void> } {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT_MS ?? 10000)
  });

  const sql: Sql = async <T extends SqlRow = SqlRow>(strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = compileQuery(strings, values);
    const result = await pool.query(query.text, query.params);
    return result.rows as T[];
  };

  return { sql, close: () => pool.end() };
}
