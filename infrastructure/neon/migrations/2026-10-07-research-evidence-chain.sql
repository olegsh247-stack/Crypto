-- ETH Research Evidence Chain
-- Additive migration for the already-published ETH snapshot.

BEGIN;

INSERT INTO metric_definitions (metric_id, namespace, name, description, value_type)
VALUES
('eth_research_role','research','ETH role baseline','Qualitative ETH role evidence.','text'),
('eth_research_technology','research','ETH technology baseline','Qualitative Ethereum architecture evidence.','text'),
('eth_research_tokenomics','research','ETH tokenomics baseline','Qualitative ETH tokenomics evidence.','text'),
('eth_research_ecosystem','research','ETH ecosystem baseline','Qualitative Ethereum ecosystem evidence.','text'),
('eth_research_adoption','research','ETH adoption baseline','Qualitative Ethereum adoption evidence.','text'),
('eth_research_institutions','research','ETH institutional baseline','Qualitative institutional evidence.','text'),
('eth_research_governance','research','ETH governance baseline','Qualitative governance evidence.','text'),
('eth_research_macro','research','ETH macro baseline','Qualitative macro evidence.','text'),
('eth_research_competition','research','ETH competition baseline','Qualitative competition evidence.','text'),
('eth_research_risk','research','ETH risk baseline','Qualitative risk evidence.','text'),
('eth_research_catalyst','research','ETH catalyst baseline','Qualitative catalyst evidence.','text'),
('eth_research_scenario','research','ETH scenario baseline','Qualitative scenario evidence.','text'),
('eth_research_conclusion','research','ETH conclusion baseline','Qualitative thesis conclusion evidence.','text'),
('eth_research_monitoring','research','ETH monitoring baseline','Qualitative monitoring design evidence.','text')
ON CONFLICT (metric_id) DO NOTHING;

WITH x(metric_id,source_id,value_text) AS (VALUES
('eth_research_role','ethereum_org_roadmap','Ethereum is a general-purpose smart-contract settlement network; ETH supports gas, staking, security and collateral roles.'),
('eth_research_technology','ethereum_org_roadmap','Ethereum uses proof-of-stake with separate execution and consensus layers; scaling centers on L2s and data availability.'),
('eth_research_tokenomics','ethereum_foundation','ETH value accrual depends on staking, settlement demand and issuance/burn dynamics.'),
('eth_research_ecosystem','ethereum_foundation','Ethereum has deep DeFi, stablecoin, tokenization, DAO, infrastructure and L2 ecosystems.'),
('eth_research_adoption','ethereum_foundation','Ethereum activity is distributed across L1 and L2 environments and requires combined monitoring.'),
('eth_research_institutions','ethereum_foundation','ETH has institutional relevance through programmable settlement, staking and ecosystem exposure.'),
('eth_research_governance','ethereum_org_roadmap','Ethereum governance is social and technical rather than simple token voting.'),
('eth_research_macro','ethereum_foundation','ETH is exposed to liquidity, real yields, risk appetite, regulation and institutional allocation.'),
('eth_research_competition','ethereum_org_roadmap','Ethereum competes with alternative L1s, L2 ecosystems and settlement environments.'),
('eth_research_risk','ethereum_foundation','Material risks include value accrual, fragmentation, competition, governance, security and regulation.'),
('eth_research_catalyst','ethereum_org_glamsterdam','Glamsterdam and scaling work provide identifiable protocol catalysts.'),
('eth_research_scenario','ethereum_foundation','Bull, base and bear scenarios depend on scaling, adoption, value accrual and competition.'),
('eth_research_conclusion','ethereum_org_roadmap','Ethereum remains a positive but conditional thesis centered on settlement, security, data availability and ETH value accrual.'),
('eth_research_monitoring','ethereum_org_roadmap','Monitoring chain connects data, metrics, signals, assessment, confidence, thesis impact and status.')
)
INSERT INTO observations(metric_id,asset_id,value_text,observed_at,source_id,source_url,methodology)
SELECT x.metric_id,'eth',x.value_text,now(),x.source_id,
CASE x.source_id WHEN 'ethereum_org_roadmap' THEN 'https://ethereum.org/roadmap/' WHEN 'ethereum_org_glamsterdam' THEN 'https://ethereum.org/roadmap/glamsterdam/' ELSE 'https://ethereum.foundation/' END,
'CryptoResearch v2 / Structure 1 qualitative baseline'
FROM x
WHERE NOT EXISTS (SELECT 1 FROM observations o WHERE o.asset_id='eth' AND o.metric_id=x.metric_id AND o.source_id=x.source_id);

WITH e(block_number,metric_id,source_id,claim,signal,assessment,impact,status) AS (VALUES
(1,'eth_research_role','ethereum_org_roadmap','Ethereum is a general-purpose settlement and smart-contract network with ETH serving core network roles.','stable','Strong strategic role.','positive','strong'),
(2,'eth_research_technology','ethereum_org_roadmap','Ethereum scaling is built around proof-of-stake, L2s and data availability.','improving','Strong architecture with execution complexity risk.','positive','strong'),
(3,'eth_research_tokenomics','ethereum_foundation','ETH value accrual depends on staking, settlement demand and issuance/burn balance.','mixed','Moderate and improving, but conditional.','mixed','watch'),
(4,'eth_research_technology','ethereum_org_roadmap','Ethereum protocol development is in an active scaling phase.','improving','Roadmap execution is a positive catalyst.','positive','strong'),
(5,'eth_research_ecosystem','ethereum_foundation','Ethereum retains deep ecosystem breadth.','stable','Strong ecosystem position.','positive','strong'),
(6,'eth_research_adoption','ethereum_foundation','Ethereum activity spans L1 and L2 and should be evaluated as a combined settlement ecosystem.','mixed','Adoption is strong but value-accrual linkage is mixed.','mixed','watch'),
(7,'eth_research_institutions','ethereum_foundation','ETH has institutional relevance through settlement, staking and ecosystem exposure.','improving','Strong potential; realized demand requires monitoring.','positive','watch'),
(8,'eth_research_governance','ethereum_org_roadmap','Ethereum governance is distributed across technical and social coordination.','stable','Governance resilience is strong; upgrade coordination is a risk.','positive','strong'),
(9,'eth_research_macro','ethereum_foundation','ETH remains sensitive to liquidity, real yields, risk appetite, regulation and institutional allocation.','mixed','Macro regime materially affects ETH beta.','mixed','watch'),
(10,'eth_research_competition','ethereum_org_roadmap','Ethereum faces credible competition from alternative L1s, L2s and settlement architectures.','mixed','Competitive position is strong but contested.','mixed','watch'),
(11,'eth_research_risk','ethereum_foundation','ETH faces material risks across value accrual, fragmentation, competition, governance, security and regulation.','mixed','Overall risk is medium.','negative','watch'),
(12,'eth_research_catalyst','ethereum_org_glamsterdam','Protocol upgrades and ecosystem growth provide identifiable catalysts.','improving','Catalyst quality is strong with execution risk.','positive','strong'),
(13,'eth_research_scenario','ethereum_foundation','Bull, base and bear scenarios are driven by scaling, adoption, value accrual and competitive outcomes.','mixed','Base currently dominates with positive catalysts.','mixed','watch'),
(14,'eth_research_conclusion','ethereum_org_roadmap','Ethereum remains a positive but conditional thesis.','improving','Conclusion is positive but conditional.','positive','strong'),
(15,'eth_research_monitoring','ethereum_org_roadmap','Monitoring must connect data and metrics to signals, assessments, confidence, thesis impact and status.','stable','Monitoring design is defined; live refresh is separate.','neutral','strong'))
INSERT INTO evidence(snapshot_id,research_block_id,research_domain_id,observation_id,source_id,evidence_type,claim,data_summary,signal,assessment,confidence,thesis_impact,status,as_of)
SELECT 'ETH-2026-10-04-v1',rb.research_block_id,rd.research_domain_id,o.observation_id,e.source_id,'fact',e.claim,o.value_text,e.signal,e.assessment,
CASE e.status WHEN 'strong' THEN .90 WHEN 'watch' THEN .75 ELSE .60 END,e.impact,e.status,o.observed_at
FROM e JOIN research_blocks rb ON rb.snapshot_id='ETH-2026-10-04-v1' AND rb.block_number=e.block_number
LEFT JOIN research_block_domains rd ON rd.research_block_id=rb.research_block_id
JOIN observations o ON o.asset_id='eth' AND o.metric_id=e.metric_id AND o.source_id=e.source_id
WHERE NOT EXISTS (SELECT 1 FROM evidence z WHERE z.snapshot_id='ETH-2026-10-04-v1' AND z.research_block_id=rb.research_block_id);

INSERT INTO schema_migrations(version) VALUES ('2026-10-07-research-evidence-chain') ON CONFLICT (version) DO NOTHING;
COMMIT;
