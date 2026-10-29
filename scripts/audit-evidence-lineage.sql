\echo 'EVIDENCE_LINEAGE_AUDIT — READ ONLY; SELECT statements only.'
BEGIN TRANSACTION READ ONLY;

\echo '1) Evidence coverage and nullable lineage by snapshot.'
SELECT rs.asset_id, e.snapshot_id, rs.status AS snapshot_status,
       count(*) AS evidence_rows,
       count(*) FILTER (WHERE e.research_block_id IS NULL) AS without_block,
       count(*) FILTER (WHERE e.research_domain_id IS NULL) AS without_domain,
       count(*) FILTER (WHERE e.observation_id IS NULL) AS without_observation,
       count(*) FILTER (WHERE e.source_id IS NULL) AS without_evidence_source
FROM evidence e JOIN research_snapshots rs USING (snapshot_id)
GROUP BY rs.asset_id, e.snapshot_id, rs.status
ORDER BY rs.asset_id, e.snapshot_id;

\echo '2) Evidence block missing or attached to a different snapshot.'
SELECT e.evidence_id, e.snapshot_id, e.research_block_id,
       rb.snapshot_id AS block_snapshot_id,
       CASE WHEN rb.research_block_id IS NULL THEN 'MISSING_BLOCK'
            ELSE 'BLOCK_SNAPSHOT_MISMATCH' END AS issue
FROM evidence e LEFT JOIN research_blocks rb USING (research_block_id)
WHERE e.research_block_id IS NOT NULL
  AND (rb.research_block_id IS NULL OR rb.snapshot_id <> e.snapshot_id)
ORDER BY e.snapshot_id, e.evidence_id;

\echo '3) Evidence domain not associated with its research block.'
SELECT e.evidence_id, e.snapshot_id, e.research_block_id, e.research_domain_id
FROM evidence e
WHERE e.research_block_id IS NOT NULL AND e.research_domain_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM research_block_domains rbd
    WHERE rbd.research_block_id=e.research_block_id
      AND rbd.research_domain_id=e.research_domain_id
  )
ORDER BY e.snapshot_id, e.evidence_id;

\echo '4) Evidence source differs from observation source.'
SELECT e.evidence_id, e.snapshot_id, e.observation_id,
       e.source_id AS evidence_source_id, o.source_id AS observation_source_id,
       es.name AS evidence_source_name, os.name AS observation_source_name
FROM evidence e JOIN observations o USING (observation_id)
LEFT JOIN sources es ON es.source_id=e.source_id
LEFT JOIN sources os ON os.source_id=o.source_id
WHERE e.source_id IS DISTINCT FROM o.source_id
ORDER BY e.snapshot_id, e.evidence_id;

\echo '5) Observation asset differs from snapshot asset.'
SELECT e.evidence_id, e.snapshot_id, rs.asset_id AS snapshot_asset_id,
       e.observation_id, o.asset_id AS observation_asset_id, o.metric_id, o.observed_at
FROM evidence e JOIN research_snapshots rs USING (snapshot_id)
JOIN observations o USING (observation_id)
WHERE o.asset_id IS DISTINCT FROM rs.asset_id
ORDER BY e.snapshot_id, e.evidence_id;

\echo '6) Neither evidence source base URL nor observation source URL is available.'
SELECT e.evidence_id, e.snapshot_id, e.source_id, e.observation_id, e.claim
FROM evidence e
LEFT JOIN sources es ON es.source_id=e.source_id
LEFT JOIN observations o ON o.observation_id=e.observation_id
WHERE nullif(btrim(es.base_url), '') IS NULL
  AND nullif(btrim(o.source_url), '') IS NULL
ORDER BY e.snapshot_id, e.evidence_id;

\echo '7) Duplicate-looking evidence groups; review only, no deduplication.'
SELECT snapshot_id, research_block_id, research_domain_id, observation_id,
       source_id, evidence_type, claim, count(*) AS row_count,
       array_agg(evidence_id ORDER BY created_at, evidence_id) AS evidence_ids
FROM evidence
GROUP BY snapshot_id, research_block_id, research_domain_id, observation_id,
         source_id, evidence_type, claim
HAVING count(*) > 1
ORDER BY snapshot_id, row_count DESC;

\echo '8) Evidence attached to non-published snapshots.'
SELECT rs.asset_id, e.snapshot_id, rs.status, count(*) AS evidence_rows
FROM evidence e JOIN research_snapshots rs USING (snapshot_id)
WHERE rs.status <> 'PUBLISHED'
GROUP BY rs.asset_id, e.snapshot_id, rs.status
ORDER BY rs.asset_id, e.snapshot_id;

COMMIT;
