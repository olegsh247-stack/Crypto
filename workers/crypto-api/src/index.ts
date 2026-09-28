import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "public, max-age=30",
      ...corsHeaders
    }
  });
}

function getAssetId(pathname: string): string | null {
  const match = pathname.match(/^\/api\/assets\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      return json({ status: "ok", service: "crypto-api" });
    }

    if (url.pathname === "/api/db-health") {
      if (!env.DATABASE_URL) {
        return json({ status: "error", service: "crypto-api", database: "not_configured" }, 500);
      }
      try {
        const sql = neon(env.DATABASE_URL);
        const result = await sql`select now() as now`;
        return json({ status: "ok", service: "crypto-api", database: "ok", now: result[0]?.now ?? null });
      } catch {
        return json({ status: "error", service: "crypto-api", database: "unavailable" }, 503);
      }
    }

    if (url.pathname === "/api/assets" || url.pathname === "/api/assets/") {
      if (!env.DATABASE_URL) {
        return json({ status: "error", service: "crypto-api", database: "not_configured" }, 500);
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const assets = await sql`
          select
            a.asset_id,
            a.symbol,
            a.name,
            a.category,
            a.research_tier,
            a.enabled,
            a.binance_symbol,
            a.fallback_symbols,
            a.research_reason,
            a.primary_asset_type_id,
            at.code as asset_type_code,
            at.name as asset_type_name,
            rs.status as research_status,
            rs.reason as research_status_reason,
            rs.last_research_at
          from assets a
          left join asset_types at on at.id::text = a.primary_asset_type_id
          left join research_status rs on rs.asset_id = a.asset_id
          where a.enabled = true
          order by
            case a.research_tier when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end,
            a.symbol
        `;

        return json({ api_version: "1.1.0", assets, count: assets.length, max_assets: 50 });
      } catch {
        return json({ status: "error", service: "crypto-api", error: "database_query_failed" }, 503);
      }
    }

    const assetId = getAssetId(url.pathname);
    if (assetId) {
      if (!env.DATABASE_URL) {
        return json({ status: "error", service: "crypto-api", database: "not_configured" }, 500);
      }

      try {
        const sql = neon(env.DATABASE_URL);

        const assets = await sql`
          select
            a.asset_id,
            a.symbol,
            a.name,
            a.category,
            a.research_tier,
            a.enabled,
            a.binance_symbol,
            a.fallback_symbols,
            a.research_reason,
            a.primary_asset_type_id,
            a.secondary_asset_type_id,
            at.code as asset_type_code,
            at.name as asset_type_name,
            at.description as asset_type_description,
            rs.status as research_status,
            rs.reason as research_status_reason,
            rs.last_research_at,
            rs.last_major_update_at,
            rs.next_review_at
          from assets a
          left join asset_types at on at.id::text = a.primary_asset_type_id
          left join research_status rs on rs.asset_id = a.asset_id
          where a.asset_id = ${assetId}
          limit 1
        `;

        if (!assets[0]) {
          return json({ status: "error", service: "crypto-api", error: "asset_not_found", asset_id: assetId }, 404);
        }

        const [metrics, history, researchSnapshots, scenarios, events, sources, blocks, domains, factors, scores, signals] =
          await Promise.all([
            sql`
              select distinct on (o.metric_id)
                o.metric_id,
                coalesce(o.value_numeric, o.value_integer::numeric) as value,
                o.value_boolean,
                o.value_text,
                o.value_json,
                o.unit,
                o.observed_at,
                o.source_id,
                o.source_url,
                o.status,
                case
                  when o.freshness = 'CURRENT' then 'fresh'
                  when o.freshness = 'STALE' then 'stale'
                  when o.freshness = 'EXPIRED' then 'unknown'
                  else 'unknown'
                end as freshness,
                o.revision
              from observations o
              where o.asset_id = ${assetId}
              order by o.metric_id, o.observed_at desc, o.revision desc
            `,
            sql`
              select candle_open_at, candle_close_at, open_price, high_price, low_price, close_price,
                     volume, quote_volume, trade_count, source_id, source_symbol
              from market_daily_candles
              where asset_id = ${assetId}
              order by candle_open_at desc
              limit 30
            `,
            sql`
              select snapshot_id, version, status, title, content, published_at, created_at
              from research_snapshots
              where asset_id = ${assetId}
              order by version desc
              limit 1
            `,
            sql`
              select scenario_id, state, confidence, rationale, indicators, observed_at, snapshot_id
              from scenario_states
              where asset_id = ${assetId}
              order by observed_at desc
              limit 20
            `,
            sql`
              select event_id, metric_id, event_type, severity, observed_at, details, status, created_at, closed_at
              from monitoring_events
              where asset_id = ${assetId}
              order by observed_at desc
              limit 50
            `,
            sql`
              select distinct s.source_id, s.name, s.source_type, s.base_url, s.trust_level, s.description
              from sources s
              join observations o on o.source_id = s.source_id
              where o.asset_id = ${assetId}
              order by s.source_id
            `,
            sql`
              select
                rb.id,
                rb.block_number,
                rb.title,
                rb.status,
                rb.summary,
                rb.analysis,
                rb.confidence,
                coalesce(
                  json_agg(
                    json_build_object(
                      'code', rd.code,
                      'name', rd.name,
                      'relevance_weight', rbd.relevance_weight,
                      'display_order', rbd.display_order
                    ) order by rbd.display_order nulls last, rd.display_order
                  ) filter (where rd.id is not null),
                  '[]'::json
                ) as domains
              from research_blocks rb
              left join research_block_domains rbd on rbd.research_block_id = rb.id
              left join research_domains rd on rd.id = rbd.research_domain_id
              where rb.research_snapshot_id = (
                select snapshot_id from research_snapshots where asset_id = ${assetId} order by version desc limit 1
              )
              group by rb.id
              order by rb.block_number
            `,
            sql`
              select id, code, name, description, display_order
              from research_domains
              order by display_order
            `,
            sql`
              select id, name, description, importance_weight, current_state, trend, confidence,
                     thesis_impact, monitoring_priority, research_snapshot_id
              from critical_factors
              where asset_id = ${assetId}
              order by monitoring_priority nulls last, name
            `,
            sql`
              select id, score_type, value, scale_min, scale_max, methodology_version, confidence,
                     explanation, calculated_at, research_snapshot_id
              from scores
              where asset_id = ${assetId}
              order by calculated_at desc, score_type
            `,
            sql`
              select id, critical_factor_id, metric_id, monitoring_event_id, name, current_value,
                     previous_value, direction, threshold, threshold_type, thesis_impact, status,
                     confidence, last_updated_at
              from monitoring_signals
              where asset_id = ${assetId}
              order by status, name
            `
          ]);

        const normalizedMetrics = metrics.map((metric: any) => ({
          metric_id: metric.metric_id,
          value: metric.value !== null && metric.value !== undefined
            ? Number(metric.value)
            : metric.value_text ?? metric.value_boolean ?? metric.value_json ?? null,
          unit: metric.unit,
          observed_at: metric.observed_at,
          source_id: metric.source_id,
          source_url: metric.source_url,
          status: metric.status,
          freshness: metric.freshness,
          revision: metric.revision
        }));

        const snapshot = researchSnapshots[0]
          ? {
              snapshot_id: researchSnapshots[0].snapshot_id,
              research_version: String(researchSnapshots[0].version),
              methodology_version: "CryptoResearch v2",
              research_date: researchSnapshots[0].published_at ?? researchSnapshots[0].created_at,
              title: researchSnapshots[0].title,
              content: researchSnapshots[0].content,
              status: researchSnapshots[0].status
            }
          : null;

        return json({
          api_version: "1.1.0",
          engine: "DynamicAssetEngine",
          asset: assets[0],
          metrics: normalizedMetrics,
          history: history.reverse(),
          research_snapshot: snapshot,
          research_blocks: blocks,
          research_domains: domains,
          critical_factors: factors,
          scores,
          monitoring_signals: signals,
          scenario_states: scenarios,
          monitoring_events: events,
          sources
        });
      } catch {
        return json({ status: "error", service: "crypto-api", error: "database_query_failed" }, 503);
      }
    }

    return json({ status: "ok", service: "crypto-api", message: "Crypto API is running" });
  }
};
