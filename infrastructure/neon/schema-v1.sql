-- CryptoDataModel v1 — PostgreSQL schema
-- Target: Neon Postgres
-- Source of truth remains the normalized observation model.

create extension if not exists pgcrypto;

create table if not exists assets (
  asset_id text primary key,
  symbol text not null,
  name text not null,
  category text not null,
  research_tier text not null check (research_tier in ('A','B','C')),
  enabled boolean not null default true,
  binance_symbol text,
  fallback_symbols jsonb not null default '{}'::jsonb,
  research_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists metric_definitions (
  metric_id text primary key,
  namespace text not null,
  name text not null,
  description text,
  default_unit text,
  value_type text not null check (value_type in ('numeric','integer','boolean','text','json')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sources (
  source_id text primary key,
  name text not null,
  source_type text not null,
  base_url text,
  trust_level text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists observations (
  observation_id uuid primary key default gen_random_uuid(),
  metric_id text not null references metric_definitions(metric_id),
  asset_id text references assets(asset_id),
  value_numeric numeric,
  value_integer bigint,
  value_boolean boolean,
  value_text text,
  value_json jsonb,
  unit text,
  observed_at timestamptz not null,
  period_start timestamptz,
  period_end timestamptz,
  source_id text not null references sources(source_id),
  source_url text,
  methodology text,
  status text not null default 'NORMAL' check (status in ('NORMAL','WATCH','REVIEW')),
  freshness text not null default 'CURRENT' check (freshness in ('CURRENT','STALE','EXPIRED')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  check (
    num_nonnulls(value_numeric, value_integer, value_boolean, value_text, value_json) = 1
  ),
  check (
    period_end is null or period_start is null or period_end >= period_start
  )
);

create index if not exists observations_metric_asset_time_idx
  on observations (metric_id, asset_id, observed_at desc);

create index if not exists observations_asset_time_idx
  on observations (asset_id, observed_at desc);

create index if not exists observations_source_time_idx
  on observations (source_id, observed_at desc);

create table if not exists research_snapshots (
  snapshot_id text primary key,
  asset_id text not null references assets(asset_id),
  version integer not null check (version > 0),
  status text not null check (status in ('DRAFT','PUBLISHED','SUPERSEDED')),
  title text not null,
  content jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (asset_id, version)
);

create index if not exists research_snapshots_asset_status_idx
  on research_snapshots (asset_id, status);

create table if not exists monitoring_events (
  event_id uuid primary key default gen_random_uuid(),
  asset_id text references assets(asset_id),
  metric_id text references metric_definitions(metric_id),
  event_type text not null,
  severity text not null check (severity in ('INFO','WATCH','REVIEW')),
  observed_at timestamptz not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','CLOSED')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists monitoring_events_asset_time_idx
  on monitoring_events (asset_id, observed_at desc);

create table if not exists scenario_states (
  scenario_state_id uuid primary key default gen_random_uuid(),
  asset_id text not null references assets(asset_id),
  scenario_id text not null,
  state text not null,
  confidence text,
  rationale text,
  indicators jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null,
  snapshot_id text references research_snapshots(snapshot_id),
  created_at timestamptz not null default now()
);

create index if not exists scenario_states_asset_time_idx
  on scenario_states (asset_id, observed_at desc);

-- Permanent market history used by the website's 1D / 7D views.
-- Realtime 1H / 4H data is intentionally not persisted here.
create table if not exists market_daily_candles (
  asset_id text not null references assets(asset_id),
  candle_open_at timestamptz not null,
  candle_close_at timestamptz not null,
  open_price numeric not null,
  high_price numeric not null,
  low_price numeric not null,
  close_price numeric not null,
  volume numeric,
  quote_volume numeric,
  trade_count bigint,
  source_id text not null references sources(source_id),
  source_symbol text,
  created_at timestamptz not null default now(),
  primary key (asset_id, candle_open_at),
  check (high_price >= greatest(open_price, close_price)),
  check (low_price <= least(open_price, close_price)),
  check (candle_close_at >= candle_open_at)
);

create index if not exists market_daily_candles_asset_time_idx
  on market_daily_candles (asset_id, candle_open_at desc);

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
