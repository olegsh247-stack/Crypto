import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "crypto-api"
      });
    }

    if (url.pathname === "/api/db-health") {
      if (!env.DATABASE_URL) {
        return Response.json(
          { status: "error", service: "crypto-api", database: "not_configured" },
          { status: 500 }
        );
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const result = await sql`select now() as now`;
        return Response.json({
          status: "ok",
          service: "crypto-api",
          database: "ok",
          now: result[0]?.now ?? null
        });
      } catch {
        return Response.json(
          { status: "error", service: "crypto-api", database: "unavailable" },
          { status: 503 }
        );
      }
    }

    return Response.json({
      status: "ok",
      service: "crypto-api",
      message: "Crypto API is running"
    });
  }
};
