-- Narrow the source references for BTC protocol-level Evidence claims.
-- This corrects source metadata only: values, observed_at/as_of, assessments,
-- scenario weights, links and scenario state are not changed.
-- Rehearsed by the normal disposable-PostgreSQL migration gate; never apply
-- to production except through the separately approved migration process.

BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('bitcoin_faq_primary', 'Bitcoin.org FAQ — issuance and monetary supply', 'official',
   'https://bitcoin.org/en/faq', 'high',
   'Official Bitcoin FAQ describing decentralized operation, predictable issuance and the 21 million supply limit.'),
  ('bitcoin_validation_primary', 'Bitcoin Core — Validation', 'official',
   'https://bitcoin.org/en/bitcoin-core/features/validation', 'high',
   'Bitcoin Core explanation of full validation and rejection of invalid blocks.'),
  ('bitcoin_devguide_blockchain', 'Bitcoin Developer Guide — Block Chain', 'official',
   'https://developer.bitcoin.org/devguide/block_chain.html', 'high',
   'Technical guide to blocks, coinbase rewards, transaction fees and blockchain mechanics.')
ON CONFLICT (source_id) DO NOTHING;

-- Update only the source identity/URL for the matching qualitative BTC research
-- observations. Do not touch the observation value, unit, observed_at, status,
-- freshness, methodology or snapshot timestamps.
UPDATE observations
SET source_id = 'bitcoin_faq_primary',
    source_url = 'https://bitcoin.org/en/faq'
WHERE asset_id = 'btc'
  AND metric_id IN ('btc_research_role', 'btc_research_tokenomics')
  AND source_id IN ('bitcoin_org_core', 'bitcoin_faq_primary');

UPDATE observations
SET source_id = 'bitcoin_devguide_blockchain',
    source_url = 'https://developer.bitcoin.org/devguide/block_chain.html'
WHERE asset_id = 'btc'
  AND metric_id = 'btc_research_technology'
  AND source_id IN ('bitcoin_org_development', 'bitcoin_devguide_blockchain');

UPDATE observations
SET source_id = 'bitcoin_validation_primary',
    source_url = 'https://bitcoin.org/en/bitcoin-core/features/validation'
WHERE asset_id = 'btc'
  AND metric_id = 'btc_research_network'
  AND source_id IN ('bitcoin_org_core', 'bitcoin_validation_primary');

-- Keep Evidence source IDs aligned with their linked observation. Evidence
-- claims and as_of timestamps are preserved.
UPDATE evidence e
SET source_id = o.source_id
FROM research_blocks rb, observations o
WHERE e.snapshot_id = 'BTC-2026-10-07-v1'
  AND rb.snapshot_id = e.snapshot_id
  AND rb.research_block_id = e.research_block_id
  AND o.asset_id = 'btc'
  AND o.observation_id = e.observation_id
  AND (
    (rb.block_number = 1 AND o.metric_id = 'btc_research_role')
    OR (rb.block_number = 2 AND o.metric_id = 'btc_research_technology')
    OR (rb.block_number = 3 AND o.metric_id = 'btc_research_tokenomics')
    OR (rb.block_number = 4 AND o.metric_id = 'btc_research_network')
  );

-- Fail the rehearsal if a clean bootstrap did not expose all four target
-- observations/Evidence rows or if the metadata did not converge as intended.
DO $$
DECLARE
  observation_count integer;
  evidence_count integer;
BEGIN
  SELECT count(*) INTO observation_count
  FROM observations
  WHERE asset_id = 'btc'
    AND (
      (metric_id = 'btc_research_role' AND source_id = 'bitcoin_faq_primary' AND source_url = 'https://bitcoin.org/en/faq')
      OR (metric_id = 'btc_research_technology' AND source_id = 'bitcoin_devguide_blockchain' AND source_url = 'https://developer.bitcoin.org/devguide/block_chain.html')
      OR (metric_id = 'btc_research_tokenomics' AND source_id = 'bitcoin_faq_primary' AND source_url = 'https://bitcoin.org/en/faq')
      OR (metric_id = 'btc_research_network' AND source_id = 'bitcoin_validation_primary' AND source_url = 'https://bitcoin.org/en/bitcoin-core/features/validation')
    );

  SELECT count(*) INTO evidence_count
  FROM evidence e
  JOIN research_blocks rb ON rb.research_block_id = e.research_block_id
  JOIN observations o ON o.observation_id = e.observation_id
  WHERE e.snapshot_id = 'BTC-2026-10-07-v1'
    AND rb.snapshot_id = e.snapshot_id
    AND (
      (rb.block_number = 1 AND o.metric_id = 'btc_research_role' AND e.source_id = 'bitcoin_faq_primary')
      OR (rb.block_number = 2 AND o.metric_id = 'btc_research_technology' AND e.source_id = 'bitcoin_devguide_blockchain')
      OR (rb.block_number = 3 AND o.metric_id = 'btc_research_tokenomics' AND e.source_id = 'bitcoin_faq_primary')
      OR (rb.block_number = 4 AND o.metric_id = 'btc_research_network' AND e.source_id = 'bitcoin_validation_primary')
    );

  IF observation_count <> 4 THEN
    RAISE EXCEPTION 'BTC source precision migration expected 4 matching observations, found %', observation_count;
  END IF;
  IF evidence_count <> 4 THEN
    RAISE EXCEPTION 'BTC source precision migration expected 4 matching Evidence rows, found %', evidence_count;
  END IF;
END $$;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-14-btc-protocol-evidence-source-precision')
ON CONFLICT (version) DO NOTHING;

COMMIT;
