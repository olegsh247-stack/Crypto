#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point to a disposable PostgreSQL database}"

seed_file="infrastructure/neon/seed-v1.sql"
psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --file="$seed_file"

target_count() {
  psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="
    SELECT count(*)
    FROM observations
    WHERE asset_id='btc'
      AND metric_id IN (
        'market.spot_price',
        'security.hashrate',
        'monetary.block_subsidy',
        'monetary.max_supply',
        'monetary.circulating_supply',
        'institutional.etf_net_flow'
      );" | tr -d '[:space:]'
}

first_count="$(target_count)"
test "$first_count" = "9"

# A revision of an existing daily ETF-flow observation must remain representable.
# The fixture value is intentionally synthetic and exists only in disposable CI.
psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at,
  period_start, period_end, source_id, source_url, methodology,
  status, freshness, revision
)
SELECT
  'institutional.etf_net_flow', 'btc', 999.9, 'USD million/day',
  '2026-09-18T00:00:00Z'::timestamptz, NULL, NULL,
  'institutional.primary', 'https://example.invalid/test-fixture',
  'Synthetic idempotency test fixture only; not market data.',
  'WATCH', 'STALE', 2
WHERE NOT EXISTS (
  SELECT 1 FROM observations
  WHERE metric_id='institutional.etf_net_flow'
    AND asset_id='btc'
    AND source_id='institutional.primary'
    AND observed_at='2026-09-18T00:00:00Z'::timestamptz
    AND period_start IS NULL
    AND period_end IS NULL
    AND revision=2
);
SQL

psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --file="$seed_file"
second_count="$(target_count)"
test "$second_count" = "10"

revision_two="$(psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="
  SELECT count(*) FROM observations
  WHERE metric_id='institutional.etf_net_flow'
    AND asset_id='btc'
    AND source_id='institutional.primary'
    AND observed_at='2026-09-18T00:00:00Z'::timestamptz
    AND period_start IS NULL AND period_end IS NULL AND revision=2;" | tr -d '[:space:]')"
test "$revision_two" = "1"

duplicate_keys="$(psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command="
  SELECT count(*) FROM (
    SELECT metric_id, asset_id, source_id, observed_at, period_start, period_end, revision
    FROM observations
    WHERE asset_id='btc'
      AND metric_id IN (
        'market.spot_price',
        'security.hashrate',
        'monetary.block_subsidy',
        'monetary.max_supply',
        'monetary.circulating_supply',
        'institutional.etf_net_flow'
      )
    GROUP BY metric_id, asset_id, source_id, observed_at, period_start, period_end, revision
    HAVING count(*) > 1
  ) duplicates;" | tr -d '[:space:]')"
test "$duplicate_keys" = "0"

echo "SEED_OBSERVATION_IDEMPOTENCY_OK first_run_rows=$first_count second_run_rows=$second_count revision_2_preserved=$revision_two duplicate_natural_keys=$duplicate_keys"
