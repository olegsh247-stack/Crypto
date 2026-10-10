-- Reconcile the published BTC snapshot's block-to-domain links with Structure 1.
-- Primary links use relevance 1.0; secondary links use 0.5. Idempotent for this snapshot only.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM research_snapshots
    WHERE snapshot_id = 'BTC-2026-10-07-v1' AND asset_id = 'btc'
  ) THEN
    RAISE EXCEPTION 'Expected published BTC snapshot BTC-2026-10-07-v1 is missing';
  END IF;
END $$;

-- Replace only this snapshot's derived mapping rows; leave all other assets/snapshots untouched.
DELETE FROM research_block_domains rbd
USING research_blocks rb
WHERE rbd.research_block_id = rb.research_block_id
  AND rb.snapshot_id = 'BTC-2026-10-07-v1';

WITH expected(block_number, research_domain_id, relevance_weight, display_order) AS (
  VALUES
    (1,  'foundation',                1.00000::numeric, 1),
    (2,  'technology_infrastructure', 1.00000::numeric, 1),
    (3,  'economics_ecosystem',       1.00000::numeric, 1),
    (4,  'technology_infrastructure', 1.00000::numeric, 2),
    (4,  'adoption_capital',          0.50000::numeric, 1),
    (4,  'economics_ecosystem',       0.50000::numeric, 2),
    (5,  'economics_ecosystem',       1.00000::numeric, 3),
    (5,  'technology_infrastructure', 0.50000::numeric, 3),
    (6,  'adoption_capital',          1.00000::numeric, 2),
    (7,  'adoption_capital',          1.00000::numeric, 3),
    (7,  'economics_ecosystem',       0.50000::numeric, 4),
    (8,  'economics_ecosystem',       1.00000::numeric, 5),
    (8,  'thesis_outlook',            0.50000::numeric, 1),
    (9,  'competition_environment',   1.00000::numeric, 1),
    (9,  'thesis_outlook',            0.50000::numeric, 2),
    (10, 'competition_environment',   1.00000::numeric, 2),
    (10, 'thesis_outlook',            0.50000::numeric, 3),
    (11, 'thesis_outlook',            1.00000::numeric, 4),
    (12, 'thesis_outlook',            1.00000::numeric, 5),
    (13, 'thesis_outlook',            1.00000::numeric, 6),
    (14, 'thesis_outlook',            1.00000::numeric, 7),
    (15, 'thesis_outlook',            1.00000::numeric, 8)
)
INSERT INTO research_block_domains
  (research_block_id, research_domain_id, relevance_weight, display_order)
SELECT rb.research_block_id, e.research_domain_id, e.relevance_weight, e.display_order
FROM expected e
JOIN research_blocks rb
  ON rb.snapshot_id = 'BTC-2026-10-07-v1'
 AND rb.block_number = e.block_number
JOIN research_domains rd
  ON rd.research_domain_id = e.research_domain_id;

-- Fail the migration rather than silently publish a partial mapping.
DO $$
DECLARE
  actual_count integer;
BEGIN
  SELECT count(*)
    INTO actual_count
  FROM research_block_domains rbd
  JOIN research_blocks rb ON rb.research_block_id = rbd.research_block_id
  WHERE rb.snapshot_id = 'BTC-2026-10-07-v1';

  IF actual_count <> 22 THEN
    RAISE EXCEPTION 'BTC domain mapping expected 22 links, found %', actual_count;
  END IF;
END $$;

INSERT INTO schema_migrations(version)
VALUES ('2026-10-11-btc-domain-mapping')
ON CONFLICT (version) DO NOTHING;

COMMIT;
