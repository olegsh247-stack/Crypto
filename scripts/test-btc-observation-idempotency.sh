#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"

actual_database="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c 'SELECT current_database()')"
if [[ "$actual_database" != "crypto_test" ]]; then
  echo "This rehearsal is only allowed against crypto_test; got '$actual_database'." >&2
  exit 2
fi

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'DROP INDEX IF EXISTS observations_btc_natural_key_revision_uq; DROP INDEX IF EXISTS observations_btc_source_row_revision_uq'
# Insert a deterministic fixture because clean seed data intentionally has no live numeric BTC inputs.
base_id="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, unit, observed_at, source_id, source_url, retrieved_at, source_row_key, source_payload_sha256,
  methodology, status, freshness, revision
) VALUES (
  'market.spot_price', 'btc', 80000, 'USD/BTC', date_trunc('minute', now()) - interval '1 hour',
  'market.kraken', 'https://api.kraken.com/0/public/Trades?pair=XBTUSD', now(), 'kraken:XBTUSD:test-fixture', repeat('a',64),
  'Disposable idempotency test fixture', 'NORMAL', 'CURRENT', 1
) RETURNING observation_id;
SQL
)"
test -n "$base_id"

# Create an exact duplicate with a new generated observation ID.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v base_id="$base_id" <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
  unit, observed_at, period_start, period_end, source_id, source_url, retrieved_at, source_row_key, source_payload_sha256, methodology, status, freshness, revision
)
SELECT metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
       unit, observed_at, period_start, period_end, source_id, source_url, retrieved_at, source_row_key, source_payload_sha256, methodology, status, freshness, revision
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
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'DROP INDEX IF EXISTS observations_btc_natural_key_revision_uq; DROP INDEX IF EXISTS observations_btc_source_row_revision_uq'
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v base_id="$base_id" <<'SQL'
INSERT INTO observations (
  metric_id, asset_id, value_numeric, value_integer, value_boolean, value_text, value_json,
  unit, observed_at, period_start, period_end, source_id, source_url, retrieved_at, source_row_key, source_payload_sha256, methodology, status, freshness, revision
)
SELECT metric_id, asset_id, value_numeric + 1, value_integer, value_boolean, value_text, value_json,
       unit, observed_at, period_start, period_end, source_id, source_url, retrieved_at, source_row_key, source_payload_sha256, methodology, status, freshness, revision
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

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
CREATE UNIQUE INDEX IF NOT EXISTS observations_btc_source_row_revision_uq
ON observations (metric_id, source_id, source_row_key)
WHERE asset_id = 'btc' AND source_row_key IS NOT NULL;
SQL
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f infrastructure/postgres/migrations/2026-10-13-btc-observation-natural-key.sql
index_exists="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "SELECT to_regclass('public.observations_btc_natural_key_revision_uq') IS NOT NULL")"
test "$index_exists" = "t"
observed_at="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "SELECT to_char(observed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') FROM observations WHERE observation_id='$base_id'::uuid")"
DATABASE_URL="$DATABASE_URL" BTC_TEST_OBSERVED_AT="$observed_at" node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { persistBtcObservation } from "./vps/worker/dist/btc-observations.js";

const candidate = {
  metricId: "market.spot_price",
  sourceId: "market.kraken",
  sourceUrl: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
  valueNumeric: 80000,
  unit: "USD/BTC",
  observedAt: new Date(process.env.BTC_TEST_OBSERVED_AT),
  retrievedAt: new Date(),
  sourceRowKey: "kraken:XBTUSD:test-fixture",
  sourcePayloadSha256: "a".repeat(64),
  periodStart: null,
  periodEnd: null,
  methodology: "Disposable idempotency test fixture",
  status: "NORMAL",
  freshness: "CURRENT",
};
assert.equal((await persistBtcObservation(process.env.DATABASE_URL, candidate)).action, "unchanged");
const revised = await persistBtcObservation(process.env.DATABASE_URL, { ...candidate, valueNumeric: 80001 });
assert.deepEqual(revised, { action: "revised", revision: 2 });
const unchanged = await persistBtcObservation(process.env.DATABASE_URL, { ...candidate, valueNumeric: 80001 });
assert.deepEqual(unchanged, { action: "unchanged", revision: 2 });
console.log("BTC_OBSERVATION_REVISION_OK initial=1 correction=2 repeated_payload=unchanged");
NODE

echo "BTC_OBSERVATION_IDEMPOTENCY_OK exact_duplicates_removed=1 conflicting_payloads_rejected=1 unique_index=present"

# End-to-end historical test: persist synthetic collector-shaped observations, read them
# back from disposable PostgreSQL, derive metrics from those stored rows, then evaluate
# the pure preliminary rule. This never targets a non-crypto_test database.
DATABASE_URL="$DATABASE_URL" node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { withSqlTransaction } from "./vps/shared/dist/index.js";
import { persistBtcObservation } from "./vps/worker/dist/btc-observations.js";
import { assessBtcScenarioReadiness } from "./vps/shared/dist/btc-scenario-readiness.js";
import { evaluateBtcScenarioV1 } from "./scripts/btc-scenario-direction.mjs";

const databaseUrl = process.env.DATABASE_URL;
const dbName = await withSqlTransaction(databaseUrl, async client => {
  const result = await client.query("SELECT current_database() AS name");
  return result.rows[0].name;
});
assert.equal(dbName, "crypto_test", "integration rehearsal must only use disposable crypto_test");
const now = new Date();
const hash = "c".repeat(64);
const daysAgo = n => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const day = d => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const make = (metricId, sourceId, sourceUrl, valueNumeric, unit, observedAt, sourceRowKey, periodStart = null, periodEnd = null) => ({
  metricId, sourceId, sourceUrl, valueNumeric, unit, observedAt, retrievedAt: now,
  sourceRowKey, sourcePayloadSha256: hash, periodStart, periodEnd,
  methodology: "Synthetic historical DB-to-scenario integration fixture; not market data.",
  status: "NORMAL", freshness: "CURRENT",
});
const spotUrl = "https://api.kraken.com/0/public/Trades?pair=XBTUSD";
const hashUrl = "https://mempool.space/api/v1/mining/hashrate/1w";
const etfUrl = "https://farside.co.uk/btc/";
const candidates = [
  make("market.spot_price","market.kraken",spotUrl,83679.46,"USD/BTC",new Date(now.getTime()-10_000),"btc-e2e:spot:current"),
  make("market.spot_price","market.kraken",spotUrl,80000,"USD/BTC",daysAgo(7),"btc-e2e:spot:anchor",day(daysAgo(7)),day(daysAgo(6))),
  make("security.hashrate","network.primary",hashUrl,260,"EH/s",day(daysAgo(1)),"btc-e2e:hashrate:current",day(daysAgo(1)),day(now)),
  make("security.hashrate","network.primary",hashUrl,247.5,"EH/s",day(daysAgo(8)),"btc-e2e:hashrate:anchor",day(daysAgo(8)),day(daysAgo(7))),
];
const flows = [-89.8,118.8,-484.9,-244.1,21.1];
for (let i=0;i<5;i++) {
  const reportDay = day(daysAgo(4-i));
  candidates.push(make("institutional.etf_net_flow","institutional.primary",etfUrl,flows[i],"USD million/day",
    new Date(now.getTime()-5_000),`btc-e2e:etf:${reportDay.toISOString().slice(0,10)}`,reportDay,new Date(reportDay.getTime()+86400000)));
}
for (const candidate of candidates) await persistBtcObservation(databaseUrl,candidate);

const stored = await withSqlTransaction(databaseUrl, async client => {
  const result = await client.query(`
    SELECT o.metric_id,o.asset_id,o.value_numeric,o.value_integer,o.unit,
      o.observed_at,o.source_updated_at,o.retrieved_at,o.period_start,o.period_end,
      o.source_id,o.source_url,o.source_row_key,o.source_payload_sha256,
      o.methodology,o.methodology_version,o.freshness,o.revision,
      EXISTS (SELECT 1 FROM sources s WHERE s.source_id=o.source_id) AS source_registered
    FROM observations o
    WHERE o.asset_id='btc' AND o.source_row_key LIKE 'btc-e2e:%'
    ORDER BY o.observed_at,o.period_start
  `);
  return result.rows;
});
assert.equal(stored.length,candidates.length,"all synthetic candidates must be read back from PostgreSQL");
const rows = stored.map(row => ({...row, expected_unit:row.unit}));
const readiness = assessBtcScenarioReadiness(rows,now);
assert.equal(readiness.status,"ready_for_rule_evaluation",JSON.stringify(readiness.blockers));

const spots = rows.filter(row=>row.metric_id==="market.spot_price").sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at));
const hashrates = rows.filter(row=>row.metric_id==="security.hashrate").sort((a,b)=>Date.parse(b.period_end)-Date.parse(a.period_end));
const etfByDay = new Map();
for (const row of rows.filter(row=>row.metric_id==="institutional.etf_net_flow").sort((a,b)=>Date.parse(b.period_start)-Date.parse(a.period_start))) {
  const reportDay = new Date(row.period_start).toISOString().slice(0,10);
  if (!etfByDay.has(reportDay)) etfByDay.set(reportDay,row);
}
const latestSpot = spots[0];
const anchorSpot = spots.find(row=>Date.parse(row.observed_at)<=now.getTime()-6.5*86400000);
const latestHashrate = hashrates[0];
const anchorHashrate = hashrates.find(row=>Date.parse(row.period_end)<=now.getTime()-6.5*86400000);
const latestFiveEtf = [...etfByDay.values()].slice(0,5);
assert.ok(latestSpot && anchorSpot && latestHashrate && anchorHashrate);
assert.equal(latestFiveEtf.length,5);
const inputs = {
  readiness_status: readiness.status,
  price_return_7d_pct: (Number(latestSpot.value_numeric)/Number(anchorSpot.value_numeric)-1)*100,
  etf_net_flow_5d_usd_millions: latestFiveEtf.reduce((sum,row)=>sum+Number(row.value_numeric),0),
  hashrate_change_7d_pct: (Number(latestHashrate.value_numeric)/Number(anchorHashrate.value_numeric)-1)*100,
  // DXY and fee/subsidy are intentionally optional context.
};
const result = evaluateBtcScenarioV1(inputs);
assert.equal(result.status,"evaluated");
assert.equal(result.scenario_type,"base");
assert.equal(result.baseline_probabilities_changed,false);
assert.equal(result.can_persist_scenario_state,false);
console.log(JSON.stringify({test:"BTC_DB_TO_PRELIMINARY_RESULT_OK",stored_observations:stored.length,derived_inputs:inputs,result:{scenario_type:result.scenario_type,directional_score:result.directional_score,can_persist_scenario_state:result.can_persist_scenario_state},database_access:"disposable crypto_test only"}));
NODE
