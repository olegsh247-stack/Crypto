import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "public, max-age=30"
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

    if (url.pathname === "/api/health") {
      return json({
        status: "ok",
        service: "crypto-api"
      });
    }

    if (url.pathname === "/api/db-health") {
      if (!env.DATABASE_URL) {
        return json(
          { status: "error", service: "crypto-api", database: "not_configured" },
          500
        );
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const result = await sql`select now() as now`;
        return json({
          status: "ok",
          service: "crypto-api",
          database: "ok",
          now: result[0]?.now ?? null
        });
      } catch {
        return json(
          { status: "error", service: "crypto-api", database: "unavailable" },
          503
        );
      }
    }

    if (url.pathname === "/api/assets" || url.pathname === "/api/assets/") {
      if (!env.DATABASE_URL) {
        return json(
          { status: "error", service: "crypto-api", database: "not_configured" },
          500
        );
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const assets = await sql`
          select
            asset_id,
            symbol,
            name,
            category,
            research_tier,
            enabled,
            binance_symbol,
            fallback_symbols,
            research_reason
          from assets
          where enabled = true
          order by
            case research_tier when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end,
            symbol
        `;

        return json({
          api_version: "1.0.0",
          assets,
          count: assets.length,
          max_assets: 50
        });
      } catch {
        return json(
          { status: "error", service: "crypto-api", error: "database_query_failed" },
          503
        );
      }
    }

    const assetId = getAssetId(url.pathname);
    if (assetId) {
      if (!env.DATABASE_URL) {
        return json(
          { status: "error", service: "crypto-api", database: "not_configured" },
          500
        );
      }

      try {
        const sql = neon(env.DATABASE_URL);

        const assets = await sql`
          select
            asset_id,
            symbol,
            name,
            category,
            research_tier,
            enabled,
            binance_symbol,
            fallback_symbols,
            research_reason
          from assets
          where asset_id = ${assetId}
          limit 1
        `;

        if (!assets[0]) {
          return json(
            { status: "error", service: "crypto-api", error: "asset_not_found", asset_id: assetId },
            404
          );
        }

        const [metrics, history, researchSnapshots, scenarios, events, sources] =
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
              select
                candle_open_at,
                candle_close_at,
                open_price,
                high_price,
                low_price,
                close_price,
                volume,
                quote_volume,
                trade_count,
                source_id,
                source_symbol
              from market_daily_candles
              where asset_id = ${assetId}
              order by candle_open_at desc
              limit 30
            `,
            sql`
              select
                snapshot_id,
                version,
                status,
                title,
                content,
                published_at,
                created_at
              from research_snapshots
              where asset_id = ${assetId}
              order by version desc
              limit 1
            `,
            sql`
              select
                scenario_id,
                state,
                confidence,
                rationale,
                indicators,
                observed_at,
                snapshot_id
              from scenario_states
              where asset_id = ${assetId}
              order by observed_at desc
              limit 20
            `,
            sql`
              select
                event_id,
                metric_id,
                event_type,
                severity,
                observed_at,
                details,
                status,
                created_at,
                closed_at
              from monitoring_events
              where asset_id = ${assetId}
              order by observed_at desc
              limit 50
            `,
            sql`
              select distinct
                s.source_id,
                s.name,
                s.source_type,
                s.base_url,
                s.trust_level,
                s.description
              from sources s
              join observations o on o.source_id = s.source_id
              where o.asset_id = ${assetId}
              order by s.source_id
            `
          ]);

        const normalizedMetrics = metrics.map((metric: any) => ({
          metric_id: metric.metric_id,
          value:
            metric.value !== null && metric.value !== undefined
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
          api_version: "1.0.0",
          asset: assets[0],
          metrics: normalizedMetrics,
          history: history.reverse(),
          research_snapshot: snapshot,
          scenario_states: scenarios,
          monitoring_events: events,
          sources
        });
      } catch {
        return json(
          { status: "error", service: "crypto-api", error: "database_query_failed" },
          503
        );
      }
    }

    return json({
      status: "ok",
      service: "crypto-api",
      message: "Crypto API is running"
    });
  }
};
