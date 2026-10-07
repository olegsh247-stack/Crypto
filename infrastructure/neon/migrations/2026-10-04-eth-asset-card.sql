-- ETH Asset Card ingestion: Structure 1 / Research 01-15
-- Idempotent production seed. ETH is the first canonical Asset Card.

BEGIN;

INSERT INTO assets (asset_id, symbol, name, category, research_tier, enabled, research_reason, primary_asset_type_id)
VALUES ('ETH', 'ETH', 'Ethereum', 'core', 'A', true, 'First complete Asset Card implementation for CryptoResearch v2 / Structure 1.', 'l1_settlement_asset')
ON CONFLICT (asset_id) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  research_tier = EXCLUDED.research_tier,
  enabled = EXCLUDED.enabled,
  research_reason = EXCLUDED.research_reason,
  primary_asset_type_id = EXCLUDED.primary_asset_type_id,
  updated_at = now();

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('ethereum_org_roadmap', 'Ethereum Roadmap', 'official', 'https://ethereum.org/roadmap/', 'high', 'Ethereum official roadmap.'),
  ('ethereum_org_glamsterdam', 'Ethereum Glamsterdam Roadmap', 'official', 'https://ethereum.org/roadmap/glamsterdam/', 'high', 'Ethereum official Glamsterdam roadmap.'),
  ('ethereum_foundation', 'Ethereum Foundation', 'official', 'https://ethereum.foundation/', 'high', 'Ethereum Foundation research and protocol updates.')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO research_snapshots (snapshot_id, asset_id, version, status, title, content, published_at)
VALUES (
  'ETH-2026-10-04-v1', 'ETH', 1, 'PUBLISHED',
  'Ethereum (ETH) — Deep Research 01–15',
  '{"methodology":"CryptoResearch v2 / Structure 1","source_artifact":"research/assets/ETH/ETH-RESEARCH-01-15.md","snapshot_date":"2026-10-04","thesis":"Positive, but conditional","current_scenario":"Base with positive catalysts","confidence":"medium-high"}'::jsonb,
  now()
)
ON CONFLICT (snapshot_id) DO UPDATE SET
  status = EXCLUDED.status,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  published_at = EXCLUDED.published_at;

WITH blocks(block_number,title,status,summary,analysis,confidence) AS (
  VALUES
  (1,'Essence & Role','complete','Ethereum is a general-purpose smart-contract settlement network; ETH serves gas, staking, security and collateral roles.','Strategic position is increasingly Ethereum as a settlement and security layer for a multi-layer execution environment. Assessment: Strong.','0.90'),
  (2,'Technology & Architecture','complete','Ethereum uses proof-of-stake with separate execution and consensus layers; scaling centers on L2s and data availability.','Pectra and Fusaka are live; Fusaka introduced PeerDAS. Glamsterdam is the next major upgrade. Assessment: Strong, with execution complexity risk.','0.90'),
  (3,'Tokenomics','complete','ETH has no fixed maximum supply; issuance and EIP-1559 burn determine net supply.','Value accrual depends on staking demand, settlement demand and ecosystem activity. Assessment: Moderate / improving.','0.82'),
  (4,'Network / Protocol State','complete','Ethereum is in an active scaling phase.','Fusaka is live and Glamsterdam is being tested; roadmap execution and scaling remain key variables. Assessment: Improving.','0.90'),
  (5,'Ecosystem','complete','Ethereum remains one of the deepest smart-contract ecosystems across DeFi, stablecoins, tokenization, DAOs, infrastructure and L2s.','Key question is whether ecosystem growth translates into durable economic value for ETH. Assessment: Strong.','0.88'),
  (6,'Users & Activity','complete','User activity is distributed across L1 and L2 environments.','Monitoring must combine settlement demand, blobs, L2 activity, transfers, staking and fee/burn dynamics. Assessment: Mixed / improving.','0.70'),
  (7,'Institutions & Capital','complete','ETH has institutional relevance through programmable settlement, staking yield and ecosystem exposure.','Institutional capital deployed on Ethereum does not automatically equal ETH value accrual. Assessment: Strong potential.','0.70'),
  (8,'Governance / Protocol Economics','complete','Ethereum governance is social and technical rather than simple token voting.','Distributed coordination provides resilience and credible neutrality, with upgrade coordination risk. Assessment: Strong governance resilience.','0.90'),
  (9,'Macro','complete','ETH is exposed to liquidity, real yields, risk appetite, regulation and institutional allocation.','ETH beta can amplify macro moves. Assessment: Neutral / regime-dependent.','0.70'),
  (10,'Competition & Alternatives','complete','Primary pressure comes from Solana, other L1s, L2 ecosystems and non-Ethereum settlement environments.','Defense is security, liquidity, developer depth, standards, decentralization and settlement credibility; vulnerability is fragmentation. Position: Strong but contested.','0.85'),
  (11,'Risks','complete','Key risks include weak value accrual, L2 fragmentation, competition, governance, security, centralization, regulation and cryptographic transition.','Overall risk assessed as Medium.','0.78'),
  (12,'Catalysts','complete','Catalysts include Glamsterdam, higher capacity, stronger L2 interoperability, stablecoins/RWAs, institutional staking, value accrual and UX improvements.','Catalyst quality: Strong, with execution risk.','0.82'),
  (13,'Scenarios','complete','Bull, Base and Bear scenarios are defined.','Current scenario: Base with positive catalysts.','0.80'),
  (14,'Conclusion','complete','Ethereum thesis is settlement/security/data availability for a multi-layer economy with ETH capturing sufficient value.','Decisive variable is value accrual. Thesis: Positive, but conditional.','0.85'),
  (15,'Monitoring','complete','Critical factors and key signals are defined with refresh triggers and an evidence chain.','Monitoring chain: DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS.','0.85')
)
INSERT INTO research_blocks (snapshot_id, block_number, title, status, summary, analysis, confidence)
SELECT 'ETH-2026-10-04-v1', block_number, title, status, summary, analysis, confidence::numeric FROM blocks
ON CONFLICT (snapshot_id, block_number) DO UPDATE SET
  title=EXCLUDED.title,status=EXCLUDED.status,summary=EXCLUDED.summary,analysis=EXCLUDED.analysis,confidence=EXCLUDED.confidence;

WITH mappings(block_number,research_domain_id,display_order) AS (
  VALUES
  (1,'foundation',1),(2,'technology_infrastructure',1),(3,'economics_ecosystem',1),(4,'technology_infrastructure',2),
  (5,'economics_ecosystem',2),(6,'adoption_capital',1),(7,'adoption_capital',2),(8,'foundation',2),
  (9,'competition_environment',1),(10,'competition_environment',2),(11,'thesis_outlook',1),(12,'thesis_outlook',2),
  (13,'thesis_outlook',3),(14,'thesis_outlook',4),(15,'thesis_outlook',5)
)
INSERT INTO research_block_domains (research_block_id,research_domain_id,relevance_weight,display_order)
SELECT rb.research_block_id,m.research_domain_id,1.0,m.display_order
FROM research_blocks rb JOIN mappings m ON m.block_number=rb.block_number
WHERE rb.snapshot_id='ETH-2026-10-04-v1'
ON CONFLICT (research_block_id,research_domain_id) DO UPDATE SET relevance_weight=EXCLUDED.relevance_weight,display_order=EXCLUDED.display_order;

INSERT INTO metric_definitions (metric_id, namespace, name, description, default_unit, value_type)
VALUES
  ('eth_research_role','research','ETH role baseline','Qualitative research baseline for ETH role and utility.',NULL,'text'),
  ('eth_research_technology','research','ETH technology baseline','Qualitative research baseline for Ethereum architecture and roadmap.',NULL,'text'),
  ('eth_research_tokenomics','research','ETH tokenomics baseline','Qualitative research baseline for ETH supply and value accrual.',NULL,'text'),
  ('eth_research_ecosystem','research','ETH ecosystem baseline','Qualitative research baseline for Ethereum ecosystem depth.',NULL,'text'),
  ('eth_research_adoption','research','ETH adoption baseline','Qualitative research baseline for activity and adoption.',NULL,'text'),
  ('eth_research_institutions','research','ETH institutional baseline','Qualitative research baseline for institutional relevance.',NULL,'text'),
  ('eth_research_governance','research','ETH governance baseline','Qualitative research baseline for governance.',NULL,'text'),
  ('eth_research_macro','research','ETH macro baseline','Qualitative research baseline for macro sensitivity.',NULL,'text'),
  ('eth_research_competition','research','ETH competition baseline','Qualitative research baseline for competition.',NULL,'text'),
  ('eth_research_risk','research','ETH risk baseline','Qualitative research baseline for material risks.',NULL,'text'),
  ('eth_research_catalyst','research','ETH catalyst baseline','Qualitative research baseline for catalysts.',NULL,'text'),
  ('eth_research_scenario','research','ETH scenario baseline','Qualitative research baseline for scenarios.',NULL,'text'),
  ('eth_research_conclusion','research','ETH conclusion baseline','Qualitative research baseline for thesis conclusion.',NULL,'text'),
  ('eth_research_monitoring','research','ETH monitoring baseline','Qualitative research baseline for monitoring design.',NULL,'text')
ON CONFLICT (metric_id) DO NOTHING;

WITH obs(metric_id,source_id,value_text) AS (
  VALUES
  ('eth_research_role','ethereum_org_roadmap','Ethereum is a general-purpose smart-contract settlement network; ETH supports gas, staking, security and collateral roles.'),
  ('eth_research_technology','ethereum_org_roadmap','Ethereum uses proof-of-stake and separate execution and consensus layers; scaling is centered on L2s and data availability.'),
  ('eth_research_tokenomics','ethereum_foundation','ETH net supply is determined by issuance and EIP-1559 burn; value accrual depends on staking, settlement demand and ecosystem activity.'),
  ('eth_research_ecosystem','ethereum_foundation','Ethereum has a deep ecosystem across DeFi, stablecoins, tokenization, DAOs, infrastructure and L2s.'),
  ('eth_research_adoption','ethereum_foundation','Activity is distributed across Ethereum L1 and L2 environments and requires combined monitoring of settlement, blobs, transfers, staking and fees.'),
  ('eth_research_institutions','ethereum_foundation','ETH has institutional relevance through programmable settlement, staking yield and ecosystem exposure.'),
  ('eth_research_governance','ethereum_org_roadmap','Ethereum governance is social and technical rather than simple token voting; upgrade coordination remains a material consideration.'),
  ('eth_research_macro','ethereum_foundation','ETH is exposed to liquidity, real yields, risk appetite, regulation and institutional allocation.'),
  ('eth_research_competition','ethereum_org_roadmap','Ethereum competes with Solana, other L1s, L2 ecosystems and alternative settlement environments.'),
  ('eth_research_risk','ethereum_foundation','Material risks include value-accrual weakness, L2 fragmentation, competition, governance, security, centralization, regulation and cryptographic transition.'),
  ('eth_research_catalyst','ethereum_org_glamsterdam','Glamsterdam is a major roadmap catalyst alongside higher capacity, interoperability, stablecoins, RWAs and institutional staking.'),
  ('eth_research_scenario','ethereum_foundation','Bull, base and bear scenarios are defined around scaling, adoption, value accrual and competitive pressure.'),
  ('eth_research_conclusion','ethereum_org_roadmap','Ethereum thesis is settlement, security and data availability for a multi-layer economy, conditional on sufficient ETH value accrual.'),
  ('eth_research_monitoring','ethereum_org_roadmap','Monitoring chain is DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS.')
)
INSERT INTO observations (metric_id,asset_id,value_text,observed_at,source_id,source_url,methodology)
SELECT metric_id,'ETH',value_text,now(),source_id,
       CASE source_id
         WHEN 'ethereum_org_roadmap' THEN 'https://ethereum.org/roadmap/'
         WHEN 'ethereum_org_glamsterdam' THEN 'https://ethereum.org/roadmap/glamsterdam/'
         WHEN 'ethereum_foundation' THEN 'https://ethereum.foundation/'
       END,
       'CryptoResearch v2 / Structure 1 qualitative baseline'
FROM obs
WHERE NOT EXISTS (
  SELECT 1 FROM observations o
  WHERE o.asset_id='ETH' AND o.metric_id=obs.metric_id AND o.source_id=obs.source_id
);

WITH evidence_map(block_number,metric_id,source_id,claim,signal,assessment,thesis_impact,status) AS (
  VALUES
  (1,'eth_research_role','ethereum_org_roadmap','Ethereum is a general-purpose settlement and smart-contract network with ETH serving core network roles.','stable','Strong strategic role.','positive','strong'),
  (2,'eth_research_technology','ethereum_org_roadmap','Ethereum scaling is built around proof-of-stake, L2s and data availability.','improving','Strong architecture with execution complexity risk.','positive','strong'),
  (3,'eth_research_tokenomics','ethereum_foundation','ETH value accrual depends on staking, settlement demand and the issuance/burn balance.','mixed','Moderate and improving, but conditional.','mixed','watch'),
  (4,'eth_research_technology','ethereum_org_roadmap','Ethereum protocol development is in an active scaling phase.','improving','Roadmap execution is a material positive catalyst.','positive','strong'),
  (5,'eth_research_ecosystem','ethereum_foundation','Ethereum retains deep ecosystem breadth across major crypto application categories.','stable','Strong ecosystem position.','positive','strong'),
  (6,'eth_research_adoption','ethereum_foundation','Ethereum activity spans L1 and L2 and must be evaluated as a combined settlement ecosystem.','mixed','Adoption is strong but value-accrual linkage remains mixed.','mixed','watch'),
  (7,'eth_research_institutions','ethereum_foundation','ETH has institutional relevance through settlement, staking and ecosystem exposure.','improving','Strong potential with realized demand requiring monitoring.','positive','watch'),
  (8,'eth_research_governance','ethereum_org_roadmap','Ethereum governance is distributed across technical and social coordination rather than simple token voting.','stable','Governance resilience is strong; upgrade coordination is a risk.','positive','strong'),
  (9,'eth_research_macro','ethereum_foundation','ETH remains sensitive to liquidity, real yields, risk appetite, regulation and institutional allocation.','mixed','Macro regime materially affects ETH beta.','mixed','watch'),
  (10,'eth_research_competition','ethereum_org_roadmap','Ethereum faces credible competition from alternative L1s, L2 environments and settlement architectures.','mixed','Competitive position is strong but contested.','mixed','watch'),
  (11,'eth_research_risk','ethereum_foundation','ETH faces material risks across value accrual, fragmentation, competition, governance, security, centralization and regulation.','mixed','Overall risk is medium.','negative','watch'),
  (12,'eth_research_catalyst','ethereum_org_glamsterdam','Protocol upgrades and ecosystem growth provide identifiable catalysts for the Ethereum thesis.','improving','Catalyst quality is strong with execution risk.','positive','strong'),
  (13,'eth_research_scenario','ethereum_foundation','Bull, base and bear scenarios are driven by scaling, adoption, value accrual and competitive outcomes.','mixed','Base scenario currently dominates with positive catalysts.','mixed','watch'),
  (14,'eth_research_conclusion','ethereum_org_roadmap','Ethereum remains a positive but conditional thesis centered on settlement, security, data availability and ETH value accrual.','improving','Conclusion is positive but conditional.','positive','strong'),
  (15,'eth_research_monitoring','ethereum_org_roadmap','Monitoring must connect data and metrics to signals, assessments, confidence, thesis impact and status.','stable','Monitoring design is defined; live refresh remains a separate concern.','neutral','strong')
)
INSERT INTO evidence (snapshot_id,research_block_id,research_domain_id,observation_id,source_id,evidence_type,claim,data_summary,signal,assessment,confidence,thesis_impact,status,as_of)
SELECT 'ETH-2026-10-04-v1',rb.research_block_id,rbdom.research_domain_id,o.observation_id,e.source_id,
       'fact',e.claim,o.value_text,e.signal,e.assessment,
       CASE e.status WHEN 'strong' THEN 0.90 WHEN 'watch' THEN 0.75 ELSE 0.60 END,
       e.thesis_impact,e.status,o.observed_at
FROM evidence_map e
JOIN research_blocks rb ON rb.snapshot_id='ETH-2026-10-04-v1' AND rb.block_number=e.block_number
LEFT JOIN research_block_domains rbdom ON rbdom.research_block_id=rb.research_block_id
JOIN observations o ON o.asset_id='ETH' AND o.metric_id=e.metric_id AND o.source_id=e.source_id
WHERE NOT EXISTS (
  SELECT 1 FROM evidence x
  WHERE x.snapshot_id='ETH-2026-10-04-v1' AND x.research_block_id=rb.research_block_id
);

WITH factors(name,description,importance_weight,current_state,trend,confidence,thesis_impact,monitoring_priority) AS (
  VALUES
  ('Network Adoption','Growth and quality of Ethereum settlement and ecosystem usage.','0.85','Strong ecosystem; activity distributed across L1 and L2.','improving','0.75','positive',2),
  ('Settlement Demand','Durable demand for Ethereum settlement and data availability.','0.95','Key unresolved value-accrual variable.','mixed','0.70','mixed',1),
  ('Value Accrual','Ability of ecosystem activity to create durable ETH demand.','1.00','Moderate / improving but conditional.','improving','0.82','positive',1),
  ('Ecosystem Growth','Growth across DeFi, stablecoins, tokenization, infrastructure and L2s.','0.80','Deep and diversified ecosystem.','improving','0.88','positive',2),
  ('L2 / Data Demand','L2 settlement and blob/data demand.','0.90','Core scaling direction; requires live metric monitoring.','improving','0.75','positive',1),
  ('Institutional Demand','Institutional ETH allocation, staking and capital exposure.','0.85','Strong potential; realized demand must be monitored.','mixed','0.70','positive',2)
)
INSERT INTO critical_factors (asset_id,snapshot_id,name,description,importance_weight,current_state,trend,confidence,thesis_impact,monitoring_priority)
SELECT 'ETH','ETH-2026-10-04-v1',name,description,importance_weight::numeric,current_state,trend,confidence::numeric,thesis_impact,monitoring_priority FROM factors
ON CONFLICT (snapshot_id,name) DO UPDATE SET description=EXCLUDED.description,importance_weight=EXCLUDED.importance_weight,current_state=EXCLUDED.current_state,trend=EXCLUDED.trend,confidence=EXCLUDED.confidence,thesis_impact=EXCLUDED.thesis_impact,monitoring_priority=EXCLUDED.monitoring_priority;

WITH scenarios(scenario_type,probability,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence) AS (
  VALUES
  ('bull',0.30,'Ethereum scales L1 and blobs, L2 activity grows, institutional ETH demand strengthens and value accrual improves.','Scaling roadmap, L2 settlement demand, staking and institutional adoption.','Persistent value-accrual weakness or major competitive loss.','positive',0.78),
  ('base',0.50,'Ethereum remains a leading settlement ecosystem; L2s capture much activity while ETH remains important through security, collateral and settlement.','Current Structure 1 research baseline.','Sustained migration of economic value to competing environments.','neutral',0.82),
  ('bear',0.20,'Execution migrates to competing environments, fragmentation persists and ETH value accrual fails to keep pace with ecosystem growth.','Competitive and value-accrual risk analysis.','Renewed ETH demand and stronger settlement/data economics.','negative',0.72)
)
INSERT INTO research_scenarios (snapshot_id,scenario_type,probability,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence)
SELECT 'ETH-2026-10-04-v1',scenario_type,probability::numeric,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence::numeric FROM scenarios
ON CONFLICT (snapshot_id,scenario_type) DO UPDATE SET probability=EXCLUDED.probability,assumptions=EXCLUDED.assumptions,supporting_evidence=EXCLUDED.supporting_evidence,invalidation_conditions=EXCLUDED.invalidation_conditions,thesis_impact=EXCLUDED.thesis_impact,confidence=EXCLUDED.confidence;

WITH scores(score_type,value,scale_min,scale_max,methodology_version,confidence,explanation) AS (
  VALUES
  ('health',0.82,0,1,'CryptoResearch-v2-Structure1',0.85,'Derived from protocol state, ecosystem depth, governance resilience and risk assessment.'),
  ('thesis',0.78,0,1,'CryptoResearch-v2-Structure1',0.82,'Positive but conditional thesis driven by settlement, security, data availability and ETH value accrual.'),
  ('value_accrual',0.68,0,1,'CryptoResearch-v2-Structure1',0.70,'Moderate / improving; the key unresolved analytical variable.'),
  ('confidence',0.82,0,1,'CryptoResearch-v2-Structure1',0.82,'Aggregate confidence of the analytical baseline; live market metrics require monitoring refresh.'),
  ('competitive_position',0.80,0,1,'CryptoResearch-v2-Structure1',0.85,'Strong competitive position, but no longer uncontested.')
)
INSERT INTO research_scores (asset_id,snapshot_id,score_type,value,scale_min,scale_max,methodology_version,confidence,explanation)
SELECT 'ETH','ETH-2026-10-04-v1',score_type,value::numeric,scale_min::numeric,scale_max::numeric,methodology_version,confidence::numeric,explanation FROM scores
ON CONFLICT (snapshot_id,score_type,methodology_version) DO UPDATE SET value=EXCLUDED.value,confidence=EXCLUDED.confidence,explanation=EXCLUDED.explanation,calculated_at=now();

WITH signals(name,description,direction,thesis_impact,status,confidence) AS (
  VALUES
  ('ETH settlement/data demand','Settlement and data demand improving.','improving','positive','active',0.75),
  ('ETH net issuance/burn balance','Net issuance/burn balance improving.','improving','positive','active',0.70),
  ('L2 activity vs ETH value accrual','L2 activity can rise without equivalent ETH value accrual.','mixed','mixed','watch',0.80),
  ('Glamsterdam execution','Major upgrade execution remains a key catalyst.','improving','positive','active',0.78),
  ('Competitive share','Loss of competitive share to alternative L1s is a negative signal.','unknown','negative','watch',0.70),
  ('Staking concentration','Material increase in staking concentration is a negative signal.','unknown','negative','watch',0.70)
)
INSERT INTO monitoring_signals (asset_id,name,current_value,direction,thesis_impact,status,confidence)
SELECT 'ETH',name,jsonb_build_object('description',description),direction,thesis_impact,status,confidence::numeric FROM signals
ON CONFLICT DO NOTHING;

INSERT INTO research_status (asset_id,snapshot_id,status,reason,last_research_at,next_review_at)
VALUES ('ETH','ETH-2026-10-04-v1','current','Published Structure 1 analytical baseline; refresh on major protocol, value-accrual, competitive, regulatory or institutional-demand changes.',now(),now()+interval '30 days')
ON CONFLICT (asset_id) DO UPDATE SET snapshot_id=EXCLUDED.snapshot_id,status=EXCLUDED.status,reason=EXCLUDED.reason,last_research_at=EXCLUDED.last_research_at,next_review_at=EXCLUDED.next_review_at,updated_at=now();

INSERT INTO schema_migrations (version)
VALUES ('2026-10-04-eth-asset-card')
ON CONFLICT (version) DO NOTHING;

COMMIT;
