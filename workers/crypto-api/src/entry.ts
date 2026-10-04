import { neon } from "@neondatabase/serverless";
import { deriveResearchLifecycle } from "../../../shared/research-status-contract";
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

function blockIsComplete(status: unknown): boolean {
  return ["complete", "completed", "published", "done", "research complete"].includes(String(status ?? "").trim().toLowerCase());
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/api/assets" || url.pathname === "/api/assets/")) {
      const response = await legacy.fetch(request, env);
      if (!env.DATABASE_URL) return response;
      try {
        const sql = neon(env.DATABASE_URL);
        const lifecycleRows = await sql`with latest as (select distinct on (asset_id) asset_id,snapshot_id from research_snapshots order by asset_id,version desc) select l.asset_id,count(*) filter(where lower(coalesce(rb.status,'')) in ('complete','completed','published','done','research complete'))::int as completed,coalesce(bool_or(rb.block_number=15 and lower(coalesce(rb.status,'')) in ('complete','completed','published','done','research complete')),false) as monitoring from latest l left join research_blocks rb on rb.snapshot_id=l.snapshot_id group by l.asset_id`;
        const freshnessRows = await sql`select asset_id,status,reason,last_research_at,last_major_update_at,next_review_at from research_status`;
        const lifecycle = new Map(lifecycleRows.map((r:any) => [r.asset_id, deriveResearchLifecycle(Number(r.completed ?? 0), 15, Boolean(r.monitoring))]));
        const freshness = new Map(freshnessRows.map((r:any) => [r.asset_id, r]));
        return withJson(response, (data) => ({
          ...data,
          assets: (data.assets ?? []).map((asset:any) => ({
            ...asset,
            research_status: lifecycle.get(asset.asset_id) ?? "not_started",
            research_status_source: "server_engine",
            research_freshness: freshness.get(asset.asset_id) ? {
              status: freshness.get(asset.asset_id).status,
              reason: freshness.get(asset.asset_id).reason,
              last_research_at: freshness.get(asset.asset_id).last_research_at,
              last_major_update_at: freshness.get(asset.asset_id).last_major_update_at,
              next_review_at: freshness.get(asset.asset_id).next_review_at,
            } : null,
          })),
        }));
      } catch {
        return response;
      }
    }

    if (request.method === "GET" && url.pathname.includes("/api/pairs/") && url.pathname.endsWith("/history")) {
      const response = await legacy.fetch(request, env);
      return withJson(response, (data) => {
        if (!data || data.status === "error") return data;
        return { ...data, interpretation: { relative_strength: "A rising pair value means the base asset is outperforming the quote asset over the selected period; a falling value means the quote asset is outperforming the base asset." } };
      });
    }

    const assetId = assetIdFromPath(url.pathname);
    if (assetId && request.method === "GET") {
      const response = await legacy.fetch(request, env);
      if (!env.DATABASE_URL) return response;
      try {
        const sql = neon(env.DATABASE_URL);
        const freshness = await sql`select status, reason, last_research_at, last_major_update_at, next_review_at from research_status where asset_id=${assetId} limit 1`;
        return withJson(response, (data) => ({ ...data, research_freshness: freshness[0] ? {
          status: freshness[0].status,
          reason: freshness[0].reason,
          last_research_at: freshness[0].last_research_at,
          last_major_update_at: freshness[0].last_major_update_at,
          next_review_at: freshness[0].next_review_at,
        } : null }));
      } catch {
        return response;
      }
    }

    return legacy.fetch(request, env);
  },
};
