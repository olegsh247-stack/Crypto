-- Stage 3 observation inventory for BTC/ETH/SOL/CAKE.
-- READ ONLY: SELECT statements only. This query does not reconcile or mutate observations.
-- Duplicate grouping mirrors the BTC natural-key dimensions and is audit-only for all assets;
-- it does not imply that the BTC partial unique index exists for ETH/SOL/CAKE.
\echo 'STAGE3_OBSERVATION_INVENTORY — READ ONLY; no rows are inserted, updated, or deleted.'

WITH target_assets AS (
  SELECT asset_id, symbol, enabled
  FROM assets
  WHERE asset_id IN ('btc', 'eth', 'sol', 'cake')
),
observation_stats AS (
  SELECT
    a.asset_id,
    a.symbol,
    a.enabled,
    count(o.observation_id)::bigint AS observation_rows,
    count(DISTINCT o.metric_id)::bigint AS distinct_metric_count,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.observed_at IS NULL)::bigint AS missing_observed_at,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.retrieved_at IS NULL)::bigint AS missing_retrieved_at,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.unit IS NULL OR btrim(o.unit) = ''))::bigint AS missing_unit,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.source_id IS NULL)::bigint AS missing_source_id,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.source_url IS NULL OR btrim(o.source_url) = ''))::bigint AS missing_source_url,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.methodology IS NULL OR btrim(o.methodology) = ''))::bigint AS missing_methodology,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.source_payload_sha256 IS NULL OR btrim(o.source_payload_sha256) = ''))::bigint AS missing_payload_sha256,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.source_payload_sha256 !~* '^[a-f0-9]{64}
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.source_id IS NULL OR s.source_id IS NULL))::bigint AS missing_registered_source,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'CURRENT')::bigint AS freshness_current,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'STALE')::bigint AS freshness_stale,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'EXPIRED')::bigint AS freshness_expired,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'UNCLASSIFIED')::bigint AS freshness_unclassified,
    max(o.observed_at) AS latest_observed_at
  FROM target_assets a
  LEFT JOIN observations o ON o.asset_id = a.asset_id
  LEFT JOIN sources s ON s.source_id = o.source_id
  GROUP BY a.asset_id, a.symbol, a.enabled
)
SELECT *
FROM observation_stats
ORDER BY asset_id;

\echo 'Duplicate logical-key groups across target assets (review only; no cleanup is performed).'
WITH duplicate_groups AS (
  SELECT
    asset_id,
    metric_id,
    source_id,
    observed_at,
    coalesce(period_start, '-infinity'::timestamptz) AS period_start_key,
    coalesce(period_end, '-infinity'::timestamptz) AS period_end_key,
    revision,
    count(*)::bigint AS row_count,
    count(DISTINCT jsonb_build_object(
      'value_numeric', value_numeric,
      'value_integer', value_integer,
      'value_boolean', value_boolean,
      'value_text', value_text,
      'value_json', value_json,
      'unit', unit,
      'source_url', source_url,
      'source_row_key', source_row_key,
      'source_payload_sha256', source_payload_sha256,
      'retrieved_at', retrieved_at,
      'source_updated_at', source_updated_at,
      'methodology', methodology,
      'methodology_version', methodology_version,
      'status', status,
      'freshness', freshness
    )::text)::bigint AS distinct_payloads
  FROM observations
  WHERE asset_id IN ('btc', 'eth', 'sol', 'cake')
  GROUP BY
    asset_id, metric_id, source_id, observed_at,
    coalesce(period_start, '-infinity'::timestamptz),
    coalesce(period_end, '-infinity'::timestamptz),
    revision
  HAVING count(*) > 1
)
SELECT
  o.asset_id,
  o.observation_id,
  o.metric_id,
  o.source_id,
  o.observed_at,
  o.period_start,
  o.period_end,
  o.revision,
  o.value_numeric,
  o.value_integer,
  o.value_boolean,
  o.value_text,
  o.value_json,
  o.unit,
  o.source_url,
  o.source_row_key,
  o.source_payload_sha256,
  o.methodology,
  o.methodology_version,
  o.status,
  o.freshness,
  o.created_at,
  d.row_count AS duplicate_group_row_count,
  d.distinct_payloads,
  CASE
    WHEN d.distinct_payloads = 1 THEN 'EXACT_DUPLICATE_REVIEW_CANDIDATE'
    ELSE 'CONFLICTING_DUPLICATE_REVIEW_REQUIRED'
  END AS review_class
FROM observations o
JOIN duplicate_groups d
  ON o.asset_id = d.asset_id
 AND o.metric_id = d.metric_id
 AND o.source_id IS NOT DISTINCT FROM d.source_id
 AND o.observed_at IS NOT DISTINCT FROM d.observed_at
 AND coalesce(o.period_start, '-infinity'::timestamptz) = d.period_start_key
 AND coalesce(o.period_end, '-infinity'::timestamptz) = d.period_end_key
 AND o.revision IS NOT DISTINCT FROM d.revision
ORDER BY o.asset_id, o.metric_id, o.observed_at DESC, o.created_at, o.observation_id;
)::bigint AS invalid_payload_sha256,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.source_row_key IS NULL OR btrim(o.source_row_key) = ''))::bigint AS missing_source_row_key,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND (o.source_id IS NULL OR s.source_id IS NULL))::bigint AS missing_registered_source,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'CURRENT')::bigint AS freshness_current,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'STALE')::bigint AS freshness_stale,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'EXPIRED')::bigint AS freshness_expired,
    count(*) FILTER (WHERE o.observation_id IS NOT NULL AND o.freshness = 'UNCLASSIFIED')::bigint AS freshness_unclassified,
    max(o.observed_at) AS latest_observed_at
  FROM target_assets a
  LEFT JOIN observations o ON o.asset_id = a.asset_id
  LEFT JOIN sources s ON s.source_id = o.source_id
  GROUP BY a.asset_id, a.symbol, a.enabled
)
SELECT *
FROM observation_stats
ORDER BY asset_id;

\echo 'Duplicate logical-key groups across target assets (review only; no cleanup is performed).'
WITH duplicate_groups AS (
  SELECT
    asset_id,
    metric_id,
    source_id,
    observed_at,
    coalesce(period_start, '-infinity'::timestamptz) AS period_start_key,
    coalesce(period_end, '-infinity'::timestamptz) AS period_end_key,
    revision,
    count(*)::bigint AS row_count,
    count(DISTINCT jsonb_build_object(
      'value_numeric', value_numeric,
      'value_integer', value_integer,
      'value_boolean', value_boolean,
      'value_text', value_text,
      'value_json', value_json,
      'unit', unit,
      'source_url', source_url,
      'methodology', methodology,
      'status', status,
      'freshness', freshness
    )::text)::bigint AS distinct_payloads
  FROM observations
  WHERE asset_id IN ('btc', 'eth', 'sol', 'cake')
  GROUP BY
    asset_id, metric_id, source_id, observed_at,
    coalesce(period_start, '-infinity'::timestamptz),
    coalesce(period_end, '-infinity'::timestamptz),
    revision
  HAVING count(*) > 1
)
SELECT
  o.asset_id,
  o.observation_id,
  o.metric_id,
  o.source_id,
  o.observed_at,
  o.period_start,
  o.period_end,
  o.revision,
  o.value_numeric,
  o.value_integer,
  o.value_boolean,
  o.value_text,
  o.value_json,
  o.unit,
  o.source_url,
  o.source_row_key,
  o.source_payload_sha256,
  o.methodology,
  o.methodology_version,
  o.status,
  o.freshness,
  o.created_at,
  d.row_count AS duplicate_group_row_count,
  d.distinct_payloads,
  CASE
    WHEN d.distinct_payloads = 1 THEN 'EXACT_DUPLICATE_REVIEW_CANDIDATE'
    ELSE 'CONFLICTING_DUPLICATE_REVIEW_REQUIRED'
  END AS review_class
FROM observations o
JOIN duplicate_groups d
  ON o.asset_id = d.asset_id
 AND o.metric_id = d.metric_id
 AND o.source_id IS NOT DISTINCT FROM d.source_id
 AND o.observed_at IS NOT DISTINCT FROM d.observed_at
 AND coalesce(o.period_start, '-infinity'::timestamptz) = d.period_start_key
 AND coalesce(o.period_end, '-infinity'::timestamptz) = d.period_end_key
 AND o.revision IS NOT DISTINCT FROM d.revision
ORDER BY o.asset_id, o.metric_id, o.observed_at DESC, o.created_at, o.observation_id;
