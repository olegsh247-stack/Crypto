import { neon } from "@neondatabase/serverless";
import legacy from "./index";

interface Env { DATABASE_URL: string; }

function withJson(response: Response, mutate: (data: any) => any): Promise<Response> {
  return response.json().then((data) => Response.json(mutate(data), {
    status: response.status,
    headers: response.headers,
  }));
}

function assetIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/api\/assets\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]).toLowerCase() : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.includes("/api/pairs/") && url.pathname.endsWith("/history")) {
      const response = await legacy.fetch(request, env);
      return withJson(response, (data) => {
        if (!data || data.status === "error") return data;
        return {
          ...data,
          interpretation: {
            relative_strength: "A rising pair value means the base asset is outperforming the quote asset over the selected period; a falling value means the quote asset is outperforming the base asset.",
          },
        };
      });
    }

    const assetId = assetIdFromPath(url.pathname);
    if (assetId && request.method === "GET") {
      const response = await legacy.fetch(request, env);
      if (!env.DATABASE_URL) return response;
      try {
        const sql = neon(env.DATABASE_URL);
        const freshness = await sql`select status, reason, last_research_at, last_major_update_at, next_review_at from research_status where asset_id=${assetId} limit 1`;
        return withJson(response, (data) => ({
          ...data,
          research_freshness: freshness[0] ? {
            status: freshness[0].status,
            reason: freshness[0].reason,
            last_research_at: freshness[0].last_research_at,
            last_major_update_at: freshness[0].last_major_update_at,
            next_review_at: freshness[0].next_review_at,
          } : null,
        }));
      } catch {
        return response;
      }
    }

    return legacy.fetch(request, env);
  },
};
