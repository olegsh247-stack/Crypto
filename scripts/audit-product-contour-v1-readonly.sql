-- Product Contour v1 representative-asset audit.
-- READ ONLY: this file contains SELECT statements only; it does not mutate Neon.
-- Run with: psql "$DATABASE_URL" -X --set=ON_ERROR_STOP=1 --file=scripts/audit-product-contour-v1-readonly.sql
-- Target assets: BTC, ETH, SOL, CAKE. Compare latest published snapshot lineage and payload completeness.

WITH target_assets(asset_id) AS (
  VALUES ('btc'), ('eth'), ('sol'), ('cake')
),
latest_snapshot AS (
  SELECT DISTINCT ON (rs.asset_id)
    rs.asset_id,
    rs.snapshot_id,
    rs.version,
    rs.published_at
  FROM research_snapshots rs
  JOIN target_assets ta ON ta.asset_id = rs.asset_id
  WHERE rs.status = 'PUBLISHED'
  ORDER BY rs.asset_id, rs.version DESC
)
SELECT
  ta.asset_id,
  ls.snapshot_id AS latest_published_snapshot_id,
  ls.version AS latest_published_version,
  ls.published_at,
  (SELECT COUNT(*) FROM research_blocks rb WHERE rb.snapshot_id = ls.snapshot_id) AS block_rows,
  (SELECT COUNT(*) FROM research_blocks rb WHERE rb.snapshot_id = ls.snapshot_id AND rb.status = 'complete') AS complete_blocks,
  (SELECT COUNT(*) FROM research_blocks rb WHERE rb.snapshot_id = ls.snapshot_id AND rb.status = 'n_a') AS na_blocks,
  (SELECT COUNT(*) FROM research_domains) AS domain_registry_rows,
  (SELECT COUNT(*) FROM research_block_domains rbd JOIN research_blocks rb ON rb.research_block_id = rbd.research_block_id WHERE rb.snapshot_id = ls.snapshot_id) AS block_domain_links,
  (SELECT COUNT(*) FROM critical_factors cf WHERE cf.asset_id = ta.asset_id AND cf.snapshot_id = ls.snapshot_id) AS factor_rows,
  (SELECT COUNT(*) FROM critical_factors cf WHERE cf.asset_id = ta.asset_id AND cf.snapshot_id = ls.snapshot_id AND (cf.name IS NULL OR NULLIF(BTRIM(cf.name), '') IS NULL)) AS factors_missing_name,
  (SELECT COUNT(*) FROM research_scores sc WHERE sc.asset_id = ta.asset_id AND sc.snapshot_id = ls.snapshot_id) AS score_rows,
  (SELECT COUNT(*) FROM research_scores sc WHERE sc.asset_id = ta.asset_id AND sc.snapshot_id = ls.snapshot_id AND sc.value IS NULL) AS scores_missing_value,
  (SELECT COUNT(*) FROM research_scenarios sc WHERE sc.snapshot_id = ls.snapshot_id) AS scenario_definition_rows,
  (SELECT COUNT(*) FROM scenario_states ss WHERE ss.asset_id = ta.asset_id AND ss.snapshot_id = ls.snapshot_id) AS scenario_states_on_latest_snapshot,
  (SELECT COUNT(*) FROM scenario_states ss WHERE ss.asset_id = ta.asset_id AND ss.snapshot_id IS DISTINCT FROM ls.snapshot_id) AS scenario_states_legacy_or_other_snapshot,
  (SELECT COUNT(*) FROM scenario_states ss WHERE ss.asset_id = ta.asset_id AND ss.snapshot_id = ls.snapshot_id AND NOT EXISTS (
    SELECT 1 FROM research_scenarios sc WHERE sc.snapshot_id = ls.snapshot_id AND sc.research_scenario_id::text = ss.scenario_id
  )) AS current_snapshot_states_without_matching_definition,
  (SELECT COUNT(*) FROM monitoring_signals ms WHERE ms.asset_id = ta.asset_id AND ms.status <> 'disabled') AS enabled_monitoring_signals,
  (SELECT COUNT(*) FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id) AS evidence_rows,
  (SELECT COUNT(*) FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id AND ev.observation_id IS NULL) AS evidence_missing_observation,
  (SELECT COUNT(*) FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id AND ev.source_id IS NULL) AS evidence_missing_source,
  (SELECT COUNT(*) FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id AND NULLIF(BTRIM(ev.claim), '') IS NULL) AS evidence_missing_claim,
  (SELECT COUNT(*) FROM evidence ev LEFT JOIN observations o ON o.observation_id = ev.observation_id
    WHERE ev.snapshot_id = ls.snapshot_id AND ev.observation_id IS NOT NULL AND o.observation_id IS NULL) AS evidence_orphan_observations,
  (SELECT COUNT(*) FROM evidence ev JOIN observations o ON o.observation_id = ev.observation_id
    WHERE ev.snapshot_id = ls.snapshot_id AND (o.source_url IS NULL OR BTRIM(o.source_url) = '')) AS evidence_observations_missing_source_url,
  (SELECT COUNT(DISTINCT ev.source_id) FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id AND ev.source_id IS NOT NULL) AS distinct_evidence_sources,
  (SELECT COUNT(DISTINCT source_id) FROM (
    SELECT o.source_id FROM observations o WHERE o.asset_id = ta.asset_id
    UNION ALL
    SELECT ev.source_id FROM evidence ev WHERE ev.snapshot_id = ls.snapshot_id AND ev.source_id IS NOT NULL
  ) source_union) AS expected_top_level_source_rows
FROM target_assets ta
LEFT JOIN latest_snapshot ls ON ls.asset_id = ta.asset_id
ORDER BY ta.asset_id;

-- Detail: count historical or unlineaged records that the current dashboard contract must exclude.
-- Nonzero counts can be legitimate history; this is a diagnostic, not a blanket pass/fail assertion.
WITH target_assets(asset_id) AS (
  VALUES ('btc'), ('eth'), ('sol'), ('cake')
),
latest_snapshot AS (
  SELECT DISTINCT ON (rs.asset_id) rs.asset_id, rs.snapshot_id
  FROM research_snapshots rs
  JOIN target_assets ta ON ta.asset_id = rs.asset_id
  WHERE rs.status = 'PUBLISHED'
  ORDER BY rs.asset_id, rs.version DESC
)
SELECT ta.asset_id, 'critical_factors' AS record_type, COUNT(*) AS historical_or_nonlatest_rows
FROM target_assets ta
JOIN critical_factors cf ON cf.asset_id = ta.asset_id
LEFT JOIN latest_snapshot ls ON ls.asset_id = ta.asset_id
WHERE cf.snapshot_id IS DISTINCT FROM ls.snapshot_id
GROUP BY ta.asset_id
UNION ALL
SELECT ta.asset_id, 'research_scores', COUNT(*)
FROM target_assets ta
JOIN research_scores sc ON sc.asset_id = ta.asset_id
LEFT JOIN latest_snapshot ls ON ls.asset_id = ta.asset_id
WHERE sc.snapshot_id IS DISTINCT FROM ls.snapshot_id
GROUP BY ta.asset_id
UNION ALL
SELECT ta.asset_id, 'scenario_states', COUNT(*)
FROM target_assets ta
JOIN scenario_states ss ON ss.asset_id = ta.asset_id
LEFT JOIN latest_snapshot ls ON ls.asset_id = ta.asset_id
WHERE ss.snapshot_id IS DISTINCT FROM ls.snapshot_id
GROUP BY ta.asset_id
ORDER BY asset_id, record_type;
