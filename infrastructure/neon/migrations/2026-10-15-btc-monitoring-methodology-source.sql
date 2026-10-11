-- Reclassify BTC block 15's monitoring-chain statement as internal Crypto methodology.
-- Preserve the published snapshot, observation value/as-of/status/freshness and Evidence row.
-- This changes only the provenance URL/source identity; it does not assert anything
-- about Bitcoin itself and does not alter the published research conclusion.

BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES (
  'crypto_research_methodology',
  'Crypto Research Methodology v1',
  'internal_methodology',
  'https://github.com/olegsh247-stack/Crypto/blob/main/docs/RESEARCH_METHOD.md',
  'primary',
  'Internal methodology governing the research and monitoring workflow; not an external Bitcoin fact source.'
)
ON CONFLICT (source_id) DO NOTHING;

UPDATE observations
SET source_id = 'crypto_research_methodology',
    source_url = 'https://github.com/olegsh247-stack/Crypto/blob/main/docs/RESEARCH_METHOD.md'
WHERE asset_id = 'btc'
  AND metric_id = 'btc_research_monitoring'
  AND source_id = 'bitcoin_org_development';

UPDATE evidence e
SET source_id = o.source_id
FROM observations o
WHERE e.snapshot_id = 'BTC-2026-10-07-v1'
  AND e.observation_id = o.observation_id
  AND o.asset_id = 'btc'
  AND o.metric_id = 'btc_research_monitoring'
  AND o.source_id = 'crypto_research_methodology';

DO $$
DECLARE
  observation_count integer;
  evidence_count integer;
BEGIN
  SELECT count(*) INTO observation_count
  FROM observations
  WHERE asset_id = 'btc'
    AND metric_id = 'btc_research_monitoring'
    AND source_id = 'crypto_research_methodology'
    AND source_url = 'https://github.com/olegsh247-stack/Crypto/blob/main/docs/RESEARCH_METHOD.md';

  SELECT count(*) INTO evidence_count
  FROM evidence e
  JOIN observations o ON o.observation_id = e.observation_id
  WHERE e.snapshot_id = 'BTC-2026-10-07-v1'
    AND o.asset_id = 'btc'
    AND o.metric_id = 'btc_research_monitoring'
    AND e.source_id = 'crypto_research_methodology';

  IF observation_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one BTC internal methodology observation, found %', observation_count;
  END IF;
  IF evidence_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one BTC internal methodology Evidence row, found %', evidence_count;
  END IF;
END $$;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-15-btc-monitoring-methodology-source')
ON CONFLICT (version) DO NOTHING;

COMMIT;
