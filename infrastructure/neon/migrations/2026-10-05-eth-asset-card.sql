-- ETH production Asset Card ingestion
-- Idempotent seed from research/assets/ETH/ETH-RESEARCH-01-15.md
-- No fabricated numeric scores or live metrics are inserted.

INSERT INTO assets (asset_id, symbol, name, category, research_tier, enabled, research_reason)
VALUES ('eth', 'ETH', 'Ethereum', 'core', 'A', true, 'First production Asset Card implementation for Structure 1 / Research Engine v2.')
ON CONFLICT (asset_id) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  research_tier = EXCLUDED.research_tier,
  enabled = EXCLUDED.enabled,
  research_reason = EXCLUDED.research_reason,
  updated_at = now();

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('ethereum_org', 'Ethereum.org', 'official', 'https://ethereum.org/', 'high', 'Primary public Ethereum protocol and roadmap source.'),
  ('ethereum_foundation', 'Ethereum Foundation', 'official', 'https://blog.ethereum.org/', 'high', 'Primary Ethereum Foundation announcements and protocol research source.')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO research_snapshots (snapshot_id, asset_id, version, status, title, content, published_at)
VALUES (
  'eth-research-2026-10-v1',
  'eth',
  1,
  'PUBLISHED',
  'Ethereum (ETH) — Deep Research 01–15',
  '{"methodology":"CryptoResearch v2 / Structure 1","source_artifact":"research/assets/ETH/ETH-RESEARCH-01-15.md","asset_type":"L1 / Settlement Asset","note":"Analytical baseline; market and ecosystem metrics require Monitoring refresh."}'::jsonb,
  now()
)
ON CONFLICT (snapshot_id) DO NOTHING;

WITH blocks(block_number,title,status,summary,confidence) AS (
  VALUES
  (1,'Essence & Role','complete','Ethereum is a general-purpose smart-contract settlement network; ETH serves as gas, staking collateral, economic security and reserve/collateral asset. Strategic role is increasingly settlement and security for a multi-layer execution environment.','0.90'),
  (2,'Technology & Architecture','complete','Proof-of-stake with separate execution and consensus layers; scaling centers on L2s and data availability. Pectra and Fusaka are live; Glamsterdam is the next major upgrade focus.','0.90'),
  (3,'Tokenomics','complete','ETH has no fixed maximum supply. Issuance and EIP-1559 burn determine net supply; durable demand depends on staking, settlement and ecosystem activity.','0.85'),
  (4,'Network / Protocol State','complete','Ethereum is in an active scaling phase. Fusaka is live and Glamsterdam is under development; roadmap work includes gas limits, data availability, censorship resistance and post-quantum readiness.','0.90'),
  (5,'Ecosystem','complete','Deep ecosystem across DeFi, stablecoins, tokenization, DAOs, infrastructure and L2s; strategic shift toward a coordinated settlement/data-availability ecosystem.','0.85'),
  (6,'Users & Activity','complete','Activity is distributed across L1 and L2. Analysis must track settlement demand, blobs/data demand, L2 activity, transfers, staking and fee/burn dynamics together.','0.70'),
  (7,'Institutions & Capital','complete','ETH combines programmable settlement, staking yield and broad ecosystem exposure; institutional demand must be distinguished from capital merely deployed on Ethereum.','0.70'),
  (8,'Governance / Protocol Economics','complete','Governance is social and technical across core developers, client teams, validators, application developers and community; coordination risk remains.','0.90'),
  (9,'Macro','complete','ETH is exposed to liquidity, real yields, risk appetite, regulation and institutional allocation; valuation is regime-dependent.','0.70'),
  (10,'Competition & Alternatives','complete','Competition includes Solana and other L1s, L2 ecosystems and alternative settlement environments. Ethereum defense is security, liquidity, developer depth, standards, decentralization and settlement credibility.','0.85'),
  (11,'Risks','complete','Key risks include weak ETH value accrual, L2 fragmentation, competition, governance failures, security failures, staking/infrastructure concentration, regulation and cryptographic transition risk.','0.80'),
  (12,'Catalysts','complete','Catalysts include successful upgrades, higher capacity, stronger L2 interoperability, stablecoin/RWA growth, institutional staking, improved ETH value accrual and UX/account abstraction.','0.80'),
  (13,'Scenarios','complete','Bull: scaling plus stronger value accrual; Base: leading settlement ecosystem with moderate value accrual; Bear: competitive migration and weak ETH value accrual. Current scenario: Base with positive catalysts.','0.80'),
  (14,'Conclusion','complete','ETH thesis is positive but conditional. The decisive question is whether Ethereum economic activity translates into durable ETH demand through gas, staking, collateral and monetary demand.','0.85'),
  (15,'Monitoring','complete','Critical factors: network adoption, settlement demand, value accrual, ecosystem growth, L2/data demand and institutional demand. Monitoring must preserve DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS.','0.85')
)
INSERT INTO research_blocks (snapshot_id, block_number, title, status, summary, confidence)
SELECT 'eth-research-2026-10-v1', block_number, title, status, summary, confidence::numeric FROM blocks
ON CONFLICT (snapshot_id, block_number) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  confidence = EXCLUDED.confidence;

INSERT INTO research_block_domains (research_block_id, research_domain_id, relevance_weight, display_order)
SELECT rb.research_block_id, d.research_domain_id, 1.0, d.display_order
FROM research_blocks rb
JOIN research_domains d ON d.research_domain_id = CASE
  WHEN rb.block_number IN (1,3) THEN 'foundation'
  WHEN rb.block_number IN (2,4) THEN 'technology_infrastructure'
  WHEN rb.block_number IN (5,6) THEN 'economics_ecosystem'
  WHEN rb.block_number IN (7,8) THEN 'adoption_capital'
  WHEN rb.block_number IN (9,10) THEN 'competition_environment'
  ELSE 'thesis_outlook'
END
WHERE rb.snapshot_id = 'eth-research-2026-10-v1'
ON CONFLICT (research_block_id, research_domain_id) DO NOTHING;

INSERT INTO critical_factors (asset_id, snapshot_id, name, description, importance_weight, current_state, trend, confidence, thesis_impact, monitoring_priority)
VALUES
 ('eth','eth-research-2026-10-v1','Network Adoption','Growth and distribution of Ethereum usage across L1 and L2 environments.',0.17,'Strong ecosystem; activity increasingly distributed.','mixed',0.70,'positive',1),
 ('eth','eth-research-2026-10-v1','Settlement Demand','Demand for Ethereum as a settlement and security layer.',0.18,'Strategically important; live demand requires monitoring.','improving',0.75,'positive',1),
 ('eth','eth-research-2026-10-v1','Value Accrual','Degree to which ecosystem activity creates durable ETH demand.',0.22,'Core unresolved thesis variable.','mixed',0.75,'mixed',1),
 ('eth','eth-research-2026-10-v1','Ecosystem Growth','Depth and breadth of applications, stablecoins, tokenization and L2s.',0.14,'Deep and diversified ecosystem.','improving',0.80,'positive',2),
 ('eth','eth-research-2026-10-v1','L2 / Data Demand','L2 activity and data-availability demand that settles through Ethereum.',0.15,'Strategically central; live metrics require refresh.','improving',0.65,'positive',1),
 ('eth','eth-research-2026-10-v1','Institutional Demand','Institutional ETH allocation, staking and tokenized-asset activity.',0.14,'Strong potential; realized demand requires monitoring.','mixed',0.65,'positive',2)
ON CONFLICT (snapshot_id, name) DO UPDATE SET
  description=EXCLUDED.description, importance_weight=EXCLUDED.importance_weight, current_state=EXCLUDED.current_state,
  trend=EXCLUDED.trend, confidence=EXCLUDED.confidence, thesis_impact=EXCLUDED.thesis_impact, monitoring_priority=EXCLUDED.monitoring_priority;

INSERT INTO research_scores (asset_id, snapshot_id, score_type, value, scale_min, scale_max, methodology_version, confidence, explanation)
VALUES
 ('eth','eth-research-2026-10-v1','health',NULL,0,100,'CryptoResearch-v2',0.85,'Qualitative baseline only; numeric health score intentionally deferred until live metric refresh.'),
 ('eth','eth-research-2026-10-v1','thesis',NULL,0,100,'CryptoResearch-v2',0.85,'Positive but conditional thesis; no fabricated numeric score.'),
 ('eth','eth-research-2026-10-v1','value_accrual',NULL,0,100,'CryptoResearch-v2',0.75,'Value accrual is the decisive unresolved variable; live data required.'),
 ('eth','eth-research-2026-10-v1','confidence',NULL,0,100,'CryptoResearch-v2',0.80,'Composite numeric confidence deferred until evidence is normalized.'),
 ('eth','eth-research-2026-10-v1','competitive_position',NULL,0,100,'CryptoResearch-v2',0.85,'Strong but not uncontested; numeric scoring deferred.' )
ON CONFLICT (snapshot_id, score_type, methodology_version) DO UPDATE SET explanation=EXCLUDED.explanation, confidence=EXCLUDED.confidence;

INSERT INTO research_scenarios (snapshot_id, scenario_type, probability, assumptions, supporting_evidence, invalidation_conditions, thesis_impact, confidence)
VALUES
 ('eth-research-2026-10-v1','bull',NULL,'Ethereum scales L1 and blobs, L2 activity grows, settlement/data demand rises, institutional ETH demand strengthens and value accrual improves.','Successful upgrades, growing settlement/data demand and institutional demand.','Persistent value-accrual weakness or major competitive migration.','positive',0.80),
 ('eth-research-2026-10-v1','base',NULL,'Ethereum remains a leading settlement ecosystem while L2s capture much user activity and ETH remains important through security, collateral and settlement.','Current research baseline.','Sustained competitive share loss combined with weak ETH demand.','positive',0.85),
 ('eth-research-2026-10-v1','bear',NULL,'Execution migrates toward competing environments, Ethereum remains fragmented and ETH value accrual fails to keep pace with ecosystem growth.','Competitive pressure and weak value accrual are the key risk combination.','Improved ETH value accrual and successful scaling would invalidate the bear case.','negative',0.80)
ON CONFLICT (snapshot_id, scenario_type) DO UPDATE SET assumptions=EXCLUDED.assumptions, supporting_evidence=EXCLUDED.supporting_evidence, invalidation_conditions=EXCLUDED.invalidation_conditions, thesis_impact=EXCLUDED.thesis_impact, confidence=EXCLUDED.confidence;

INSERT INTO research_status (asset_id, snapshot_id, status, reason, last_research_at, last_major_update_at, next_review_at)
VALUES ('eth','eth-research-2026-10-v1','current','Initial Structure 1 baseline ingested; live metrics and monitoring must refresh before treating market-sensitive claims as current.',now(),now(),now()+interval '7 days')
ON CONFLICT (asset_id) DO UPDATE SET
  snapshot_id=EXCLUDED.snapshot_id, status=EXCLUDED.status, reason=EXCLUDED.reason,
  last_research_at=EXCLUDED.last_research_at, last_major_update_at=EXCLUDED.last_major_update_at,
  next_review_at=EXCLUDED.next_review_at, updated_at=now();

INSERT INTO schema_migrations (version)
VALUES ('2026-10-05-eth-asset-card')
ON CONFLICT (version) DO NOTHING;
