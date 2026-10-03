import { neon } from "@neondatabase/serverless";

export type EngineDb = ReturnType<typeof neon>;

const DEFAULT_ASSET_CATEGORY = "core";

export async function addAsset(sql: EngineDb, input: { symbol: string; name: string }) {
  const symbol = input.symbol.trim().toUpperCase();
  const name = input.name.trim();
  const rows = await sql`
    insert into assets (asset_id, symbol, name, category, enabled, research_reason)
    values (${symbol.toLowerCase()}, ${symbol}, ${name}, ${DEFAULT_ASSET_CATEGORY}, true, 'Added through Dynamic Asset Engine')
    on conflict (asset_id) do update
      set enabled = true, name = excluded.name
    returning asset_id, symbol, name, category, enabled, research_reason
  `;
  return rows[0];
}

export async function disableAsset(sql: EngineDb, id: string) {
  const rows = await sql`
    update assets
    set enabled = false
    where asset_id = ${id.toLowerCase()}
    returning asset_id, symbol, name, enabled
  `;
  return rows[0] ?? null;
}

export async function addPair(sql: EngineDb, input: { symbol: string; exchange?: string }) {
  const [base, quote] = input.symbol.split("/").map((v) => v.trim().toUpperCase());
  if (!base || !quote || base === quote) throw new Error("invalid_pair");

  const assets = await sql`
    select asset_id, symbol from assets
    where upper(symbol) in (${base}, ${quote})
    limit 2
  `;
  if (assets.length < 2) throw new Error("pair_assets_not_found");

  const baseAsset = assets.find((a: any) => String(a.symbol).toUpperCase() === base);
  const quoteAsset = assets.find((a: any) => String(a.symbol).toUpperCase() === quote);
  if (!baseAsset || !quoteAsset) throw new Error("pair_assets_not_found");

  const rows = await sql`
    insert into market_pairs (symbol, base_asset_id, quote_asset_id, exchange, enabled)
    values (${`${base}/${quote}`}, ${baseAsset.asset_id}, ${quoteAsset.asset_id}, ${input.exchange?.trim() || null}, true)
    on conflict (symbol) do update
      set enabled = true, exchange = excluded.exchange, disabled_at = null
    returning id, symbol, base_asset_id, quote_asset_id, exchange, enabled
  `;
  return rows[0];
}

export async function disablePair(sql: EngineDb, id: string) {
  const rows = await sql`
    update market_pairs
    set enabled = false, disabled_at = now()
    where id = ${id}::uuid
    returning id, symbol, enabled
  `;
  return rows[0] ?? null;
}

export async function addCommodity(sql: EngineDb, input: { symbol: string; name: string; unit?: string }) {
  const symbol = input.symbol.trim().toUpperCase();
  const name = input.name.trim();
  const rows = await sql`
    insert into commodities (symbol, name, unit, enabled)
    values (${symbol}, ${name}, ${input.unit?.trim() || null}, true)
    on conflict (symbol) do update
      set enabled = true, name = excluded.name, unit = excluded.unit, disabled_at = null
    returning id, symbol, name, unit, enabled
  `;
  return rows[0];
}

export async function disableCommodity(sql: EngineDb, id: string) {
  const rows = await sql`
    update commodities
    set enabled = false, disabled_at = now()
    where id = ${id}::uuid
    returning id, symbol, name, enabled
  `;
  return rows[0] ?? null;
}
