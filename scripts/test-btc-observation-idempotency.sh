#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"

actual_database="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c 'SELECT current_database()')"
if [[ "$actual_database" != "crypto_test" ]]; then
  echo "This rehearsal is only allowed against crypto_test; got '$actual_database'." >&2
  exit 2
fi

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'DROP INDEX IF EXISTS observations_btc_natural_key_revision_uq; DROP INDEX IF EXISTS observations_btc_source_row_revision_uq; DROP INDEX IF EXISTS observations_btc_legacy_natural_key_revision_uq'
# Insert a deterministic fixture because clean seed data intentionally has no live numeric BTC inputs.
base_id="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at, source_id, source_url,
  methodology, status, freshness, revision
) VALUES (
  'market.spot_price', 'btc', 80000, 'USD/BTC', now() - interval '1 hour',
  'market_binance', 'https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT',
  'Disposable idempotency test fixture', 'NORMAL', 'CURRENT', 1
) RETURNING observation_id;
SQL
)"
test -n "$base_id"

# Create an exact duplicate with a new generated observation ID.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v base_id="$base_id" <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
  unit, observed_at, period_start, period_end, source_id, source_url, methodology, status, freshness, revision
)
SELECT metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
       unit, observed_at, period_start, period_end, source_id, source_url, methodology, status, freshness, revision
FROM observations WHERE observation_id = :'base_id'::uuid;
SQL

# The wrapper must fail closed without the explicit confirmation flag.
if EXPECTED_DATABASE_NAME="$actual_database" scripts/reconcile-btc-exact-duplicates-target.sh >/dev/null 2>&1; then
  echo "Expected reconciliation wrapper to reject missing confirmation." >&2
  exit 1
fi

ALLOW_BTC_EXACT_DUPLICATE_RECONCILIATION=1 EXPECTED_DATABASE_NAME="$actual_database" \
  scripts/reconcile-btc-exact-duplicates-target.sh
remaining="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "
  SELECT count(*) FROM (
    SELECT metric_id,source_id,observed_at,coalesce(period_start,'-infinity'::timestamptz),coalesce(period_end,'-infinity'::timestamptz),revision
    FROM observations WHERE asset_id='btc'
    GROUP BY metric_id,source_id,observed_at,coalesce(period_start,'-infinity'::timestamptz),coalesce(period_end,'-infinity'::timestamptz),revision
    HAVING count(*)>1
  ) d")"
test "$remaining" = "0"

# Verify conflicting payloads are not automatically reconciled.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'DROP INDEX IF EXISTS observations_btc_natural_key_revision_uq'
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v base_id="$base_id" <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
  unit, observed_at, period_start, period_end, source_id, source_url, methodology, status, freshness, revision
)
SELECT metric_id, asset_id, value_numeric + 1, value_integer, value_boolean, value_text, value_json,
       unit, observed_at, period_start, period_end, source_id, source_url, methodology, status, freshness, revision
FROM observations WHERE observation_id = :'base_id'::uuid;
SQL

if ALLOW_BTC_EXACT_DUPLICATE_RECONCILIATION=1 EXPECTED_DATABASE_NAME="$actual_database" \
  scripts/reconcile-btc-exact-duplicates-target.sh >/dev/null 2>&1; then
  echo "Expected conflicting duplicate group to be rejected." >&2
  exit 1
fi

conflicting_rows="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "
  SELECT count(*) FROM observations a
  JOIN observations b ON a.observation_id < b.observation_id
   AND a.asset_id='btc' AND b.asset_id='btc'
   AND a.metric_id=b.metric_id AND a.source_id=b.source_id
   AND a.observed_at=b.observed_at
   AND coalesce(a.period_start,'-infinity'::timestamptz)=coalesce(b.period_start,'-infinity'::timestamptz)
   AND coalesce(a.period_end,'-infinity'::timestamptz)=coalesce(b.period_end,'-infinity'::timestamptz)
   AND a.revision=b.revision
  WHERE a.metric_id='market.spot_price'")"
test "$conflicting_rows" -ge 1

# Remove only the deliberately inserted conflicting fixture row in disposable CI.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
WITH ranked AS (
  SELECT observation_id,
         row_number() OVER (
           PARTITION BY metric_id, source_id, observed_at,
                        coalesce(period_start, '-infinity'::timestamptz),
                        coalesce(period_end, '-infinity'::timestamptz),
                        revision
           ORDER BY created_at ASC, observation_id ASC
         ) AS row_rank
  FROM observations WHERE asset_id='btc' AND metric_id='market.spot_price'
)
DELETE FROM observations o USING ranked r
WHERE o.observation_id=r.observation_id AND r.row_rank>1;
SQL

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f infrastructure/postgres/migrations/2026-10-13-btc-observation-natural-key.sql
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f infrastructure/postgres/migrations/2026-10-15-btc-source-row-key-idempotency.sql

# Distinct provider rows at the exact same timestamp must remain distinct.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v base_id="$base_id" <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at, source_id, source_url,
  methodology, status, freshness, revision, source_row_key
)
SELECT metric_id, asset_id, value_numeric + 10, unit, observed_at, 'market_kraken',
       'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
       'Disposable source-row identity fixture', status, freshness, revision, 'test-trade-a'
FROM observations WHERE observation_id = :'base_id'::uuid;

INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at, source_id, source_url,
  methodology, status, freshness, revision, source_row_key
)
SELECT metric_id, asset_id, value_numeric + 20, unit, observed_at, 'market_kraken',
       'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
       'Disposable source-row identity fixture', status, freshness, revision, 'test-trade-b'
FROM observations WHERE observation_id = :'base_id'::uuid;

-- Replaying the same provider row identity must not create another row.
INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at, source_id, source_url,
  methodology, status, freshness, revision, source_row_key
)
SELECT metric_id, asset_id, value_numeric + 10, unit, observed_at, 'market_kraken',
       'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
       'Disposable source-row identity fixture', status, freshness, revision + 1, 'test-trade-a'
FROM observations WHERE observation_id = :'base_id'::uuid
ON CONFLICT DO NOTHING;
SQL

row_count="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "SELECT count(*) FROM observations WHERE asset_id='btc' AND source_id='market_kraken' AND source_row_key IN ('test-trade-a','test-trade-b')")"
test "$row_count" = "2"
source_index_exists="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "SELECT to_regclass('public.observations_btc_source_row_revision_uq') IS NOT NULL")"
legacy_index_exists="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "SELECT to_regclass('public.observations_btc_legacy_natural_key_revision_uq') IS NOT NULL")"
test "$source_index_exists" = "t"
test "$legacy_index_exists" = "t"
echo "BTC_OBSERVATION_IDEMPOTENCY_OK exact_legacy_duplicates_removed=1 conflicting_legacy_payloads_rejected=1 distinct_source_rows_at_same_timestamp=2 source_row_replay_idempotent=1"
