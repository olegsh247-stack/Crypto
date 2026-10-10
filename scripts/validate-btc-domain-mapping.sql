\set ON_ERROR_STOP on
DO $$
DECLARE
  actual_count integer;
  mismatch_count integer;
  domain_count integer;
BEGIN
  SELECT count(*)
    INTO actual_count
  FROM research_block_domains rbd
  JOIN research_blocks rb ON rb.research_block_id = rbd.research_block_id
  WHERE rb.snapshot_id = 'BTC-2026-10-07-v1';

  IF actual_count <> 22 THEN
    RAISE EXCEPTION 'BTC mapping expected 22 links, found %', actual_count;
  END IF;

  WITH expected(block_number, domain_id, weight, display_order) AS (
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
  ),
  actual(block_number, domain_id, weight, display_order) AS (
    SELECT rb.block_number, rbd.research_domain_id, rbd.relevance_weight, rbd.display_order
    FROM research_block_domains rbd
    JOIN research_blocks rb ON rb.research_block_id = rbd.research_block_id
    WHERE rb.snapshot_id = 'BTC-2026-10-07-v1'
  ),
  differences AS (
    (SELECT * FROM expected EXCEPT SELECT * FROM actual)
    UNION ALL
    (SELECT * FROM actual EXCEPT SELECT * FROM expected)
  )
  SELECT count(*) INTO mismatch_count FROM differences;

  IF mismatch_count <> 0 THEN
    RAISE EXCEPTION 'BTC mapping contract mismatch: % differing rows', mismatch_count;
  END IF;

  SELECT count(*) INTO domain_count FROM research_domains;
  IF domain_count <> 6 THEN
    RAISE EXCEPTION 'Expected exactly 6 Dashboard Domains, found %', domain_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM research_blocks rb
    JOIN research_block_domains rbd ON rbd.research_block_id = rb.research_block_id
    WHERE rb.snapshot_id = 'BTC-2026-10-07-v1'
      AND rbd.research_domain_id = 'monitoring'
  ) THEN
    RAISE EXCEPTION 'Monitoring must not be introduced as a seventh Dashboard Domain';
  END IF;
END $$;

SELECT 'BTC_DOMAIN_MAPPING_OK links=22 domains=6 primary_weight=1.0 secondary_weight=0.5' AS result;
