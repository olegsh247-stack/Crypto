-- Reviewed BTC scenario evidence links for snapshot BTC-2026-10-07-v1.
-- This is an unapplied repository migration artifact, not a production write.
-- Requires 2026-10-11-research-scenario-evidence-links to be approved/applied first.
-- Intentionally only one supports link and one contextual link: current evidence
-- does not justify stronger Base/Bear claims. Scenario weights/states are untouched.

BEGIN;

INSERT INTO research_scenario_evidence
  (snapshot_id, research_scenario_id, evidence_id, relation_type, rationale)
SELECT s.snapshot_id, s.research_scenario_id, e.evidence_id, 'supports',
  'The SEC source documents a proposed custody framework that could reduce regulatory friction for advisers and regulated funds. This supports only the existence of a potential institutional-access catalyst; the proposal is not final and does not prove realized adoption, net inflows, or price appreciation.'
FROM research_scenarios s
JOIN evidence e
  ON e.snapshot_id = s.snapshot_id
 AND e.evidence_id = 'cb2704be-210b-42e2-925f-977d5889acdd'::uuid
WHERE s.snapshot_id = 'BTC-2026-10-07-v1'
  AND s.scenario_type = 'bull'
ON CONFLICT (snapshot_id, research_scenario_id, evidence_id, relation_type)
DO NOTHING;

INSERT INTO research_scenario_evidence
  (snapshot_id, research_scenario_id, evidence_id, relation_type, rationale)
SELECT s.snapshot_id, s.research_scenario_id, e.evidence_id, 'context',
  'This SEC proposal is countervailing policy context to the Bear assumption that custody barriers increase. It is only a proposal, not an adopted rule, and neither disproves Bear nor establishes that barriers will fall.'
FROM research_scenarios s
JOIN evidence e
  ON e.snapshot_id = s.snapshot_id
 AND e.evidence_id = 'cb2704be-210b-42e2-925f-977d5889acdd'::uuid
WHERE s.snapshot_id = 'BTC-2026-10-07-v1'
  AND s.scenario_type = 'bear'
ON CONFLICT (snapshot_id, research_scenario_id, evidence_id, relation_type)
DO NOTHING;

INSERT INTO schema_migrations (version)
VALUES ('2026-10-12-btc-scenario-evidence-links-seed')
ON CONFLICT (version) DO NOTHING;

COMMIT;
