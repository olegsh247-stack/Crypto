\echo 'BTC_INPUT_PROVENANCE_AUDIT — READ ONLY; no rows are inserted, updated, or deleted.'
\echo 'Required input freshness/source inventory (limits aligned to metric-registry.json; ETF count is distinct recent days):'
WITH required(metric_id, label, max_age_hours, expected_unit) AS (
  VALUES
    ('market.spot_price', 'BTC spot price', 1, 'USD/BTC'),
    ('security.hashrate', 'Network hashrate', 48, 'EH/s'),
    ('security.fee_subsidy_ratio', 'Fee/subsidy ratio', 48, 'ratio'),
    ('macro.dxy', 'DXY macro proxy', 48, 'index'),
    ('institutional.etf_net_flow', 'US spot BTC ETF net flow', 36, 'USD million/day')
),
btc_observations AS (
  SELECT o.*
  FROM observations o
  WHERE o.asset_id = 'btc'
),
latest AS (
  SELECT DISTINCT ON (metric_id)
    metric_id, observed_at, freshness, source_id, source_url, unit,
    value_numeric, value_integer, value_text, period_start, period_end, revision
  FROM btc_observations
  ORDER BY metric_id, observed_at DESC, revision DESC, created_at DESC
),
counts AS (
  SELECT metric_id, count(*) AS observation_count
  FROM btc_observations
  GROUP BY metric_id
),
etf_days AS (
  SELECT count(DISTINCT coalesce(period_start::date, observed_at::date)) AS distinct_current_days
  FROM btc_observations
  WHERE metric_id = 'institutional.etf_net_flow'
    AND observed_at <= now()
    AND observed_at >= now() - interval '14 days'
    AND coalesce(value_numeric::text, value_integer::text, value_text) IS NOT NULL
    AND source_url IS NOT NULL
    AND btrim(source_url) <> ''
    AND EXISTS (SELECT 1 FROM sources s WHERE s.source_id = btc_observations.source_id)
)
SELECT
  r.metric_id,
  r.label,
  coalesce(c.observation_count, 0) AS observation_count,
  l.observed_at AS latest_observed_at,
  CASE WHEN l.observed_at IS NULL THEN NULL
       ELSE round((extract(epoch FROM (now() - l.observed_at)) / 3600)::numeric, 2)
  END AS latest_age_hours,
  l.freshness AS latest_freshness,
  l.source_id AS latest_source_id,
  (l.source_url IS NOT NULL AND btrim(l.source_url) <> '') AS has_source_url,
  (l.source_id IS NOT NULL AND EXISTS (SELECT 1 FROM sources s WHERE s.source_id = l.source_id)) AS source_registered,
  CASE WHEN r.metric_id = 'institutional.etf_net_flow' THEN (SELECT distinct_current_days FROM etf_days) ELSE NULL END AS distinct_current_etf_days_14d,
  CASE WHEN l.observed_at IS NULL THEN 'BLOCKED_MISSING'
       WHEN l.observed_at > now() THEN 'BLOCKED_FUTURE_TIMESTAMP'
       WHEN l.freshness <> 'CURRENT' THEN 'BLOCKED_NOT_CURRENT'
       WHEN l.value_numeric IS NULL AND l.value_integer IS NULL THEN 'BLOCKED_MISSING_NUMERIC_VALUE'
       WHEN l.unit IS DISTINCT FROM r.expected_unit THEN 'BLOCKED_UNIT_MISMATCH'
       WHEN l.source_url IS NULL OR btrim(l.source_url) = '' THEN 'BLOCKED_NO_SOURCE_URL'
       WHEN NOT EXISTS (SELECT 1 FROM sources s WHERE s.source_id = l.source_id) THEN 'BLOCKED_UNREGISTERED_SOURCE'
       WHEN now() - l.observed_at > make_interval(hours => r.max_age_hours) THEN 'BLOCKED_STALE'
       ELSE 'INDIVIDUAL_INPUT_CHECKS_PASS'
  END AS latest_input_check
FROM required r
LEFT JOIN counts c ON c.metric_id = r.metric_id
LEFT JOIN latest l ON l.metric_id = r.metric_id
ORDER BY r.metric_id;

\echo 'Duplicate BTC observation logical keys (preserved; no cleanup is performed):'
SELECT
  metric_id, observed_at, source_id, period_start, period_end, revision,
  count(*) AS row_count,
  count(DISTINCT jsonb_build_object(
    'value_numeric', value_numeric, 'value_integer', value_integer,
    'value_boolean', value_boolean, 'value_text', value_text,
    'value_json', value_json, 'unit', unit, 'source_url', source_url,
    'status', status, 'freshness', freshness
  )::text) AS distinct_payloads
FROM observations
WHERE asset_id = 'btc'
GROUP BY metric_id, observed_at, source_id, period_start, period_end, revision
HAVING count(*) > 1
ORDER BY observed_at DESC, metric_id;

\echo 'Duplicate BTC observation rows with full payload/provenance (read-only; review before any cleanup):'
WITH duplicate_keys AS (
  SELECT
    metric_id, asset_id, source_id, observed_at, period_start, period_end, revision,
    count(*) AS group_row_count,
    count(DISTINCT jsonb_build_object(
      'value_numeric', value_numeric, 'value_integer', value_integer,
      'value_boolean', value_boolean, 'value_text', value_text,
      'value_json', value_json, 'unit', unit, 'source_url', source_url,
      'methodology', methodology, 'status', status, 'freshness', freshness
    )::text) AS distinct_payloads
  FROM observations
  WHERE asset_id = 'btc'
  GROUP BY metric_id, asset_id, source_id, observed_at, period_start, period_end, revision
  HAVING count(*) > 1
)
SELECT
  o.observation_id,
  o.metric_id,
  o.asset_id,
  o.value_numeric,
  o.value_integer,
  o.value_boolean,
  o.value_text,
  o.value_json,
  o.unit,
  o.observed_at,
  o.period_start,
  o.period_end,
  o.source_id,
  o.source_url,
  o.methodology,
  o.status,
  o.freshness,
  o.revision,
  o.created_at,
  d.group_row_count,
  d.distinct_payloads,
  CASE WHEN d.distinct_payloads = 1
       THEN 'EXACT_DUPLICATE_REVIEW_CANDIDATE'
       ELSE 'CONFLICTING_DUPLICATE_REVIEW_REQUIRED'
  END AS review_class
FROM observations o
JOIN duplicate_keys d
  ON o.metric_id = d.metric_id
 AND o.asset_id IS NOT DISTINCT FROM d.asset_id
 AND o.source_id = d.source_id
 AND o.observed_at IS NOT DISTINCT FROM d.observed_at
 AND o.period_start IS NOT DISTINCT FROM d.period_start
 AND o.period_end IS NOT DISTINCT FROM d.period_end
 AND o.revision = d.revision
ORDER BY o.metric_id, o.observed_at DESC, o.created_at, o.observation_id;

\echo 'Current published snapshot evidence/monitoring coverage:'
WITH current_snapshot AS (
  SELECT snapshot_id
  FROM research_snapshots
  WHERE asset_id = 'btc' AND status = 'PUBLISHED'
  ORDER BY version DESC
  LIMIT 1
)
SELECT
  cs.snapshot_id,
  count(e.evidence_id) AS evidence_rows,
  count(DISTINCT rb.block_number) AS evidence_blocks_covered,
  count(*) FILTER (WHERE e.evidence_id IS NOT NULL AND (e.source_id IS NULL OR s.source_id IS NULL)) AS evidence_missing_registered_source,
  count(*) FILTER (WHERE e.evidence_id IS NOT NULL AND (e.observation_id IS NULL OR o.observation_id IS NULL)) AS evidence_missing_observation,
  count(*) FILTER (WHERE e.evidence_id IS NOT NULL AND coalesce(o.source_url, s.base_url) IS NULL) AS evidence_missing_source_url,
  (SELECT count(*) FROM scenario_states st WHERE st.asset_id = 'btc' AND st.snapshot_id = cs.snapshot_id) AS snapshot_linked_scenario_states,
  (SELECT count(*) FROM monitoring_events me WHERE me.asset_id = 'btc') AS monitoring_event_rows,
  (SELECT count(*) FROM monitoring_signals ms WHERE ms.asset_id = 'btc' AND ms.metric_id IS NOT NULL) AS signals_linked_to_metric,
  (SELECT count(*) FROM monitoring_signals ms WHERE ms.asset_id = 'btc' AND ms.critical_factor_id IS NOT NULL) AS signals_linked_to_factor
FROM current_snapshot cs
LEFT JOIN evidence e ON e.snapshot_id = cs.snapshot_id
LEFT JOIN sources s ON s.source_id = e.source_id
LEFT JOIN observations o ON o.observation_id = e.observation_id
LEFT JOIN research_blocks rb ON rb.research_block_id = e.research_block_id
GROUP BY cs.snapshot_id;
