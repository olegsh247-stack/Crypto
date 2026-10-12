-- BTC Asset Card ingestion: Structure 1 / Research 01-15
-- Idempotent production seed. BTC is the canonical Monetary Asset implementation.

BEGIN;

INSERT INTO assets (asset_id, symbol, name, category, research_tier, enabled, research_reason, primary_asset_type_id)
VALUES ('btc', 'BTC', 'Bitcoin', 'core', 'A', true, 'Canonical Monetary Asset implementation for CryptoResearch v2 / Structure 1.', 'monetary_asset')
ON CONFLICT (asset_id) DO UPDATE SET
  symbol=EXCLUDED.symbol, name=EXCLUDED.name, category=EXCLUDED.category,
  research_tier=EXCLUDED.research_tier, enabled=EXCLUDED.enabled,
  research_reason=EXCLUDED.research_reason, primary_asset_type_id=EXCLUDED.primary_asset_type_id,
  updated_at=now();

INSERT INTO sources (source_id,name,source_type,base_url,trust_level,description)
VALUES
 ('bitcoin_org_development','Bitcoin Development','official','https://bitcoin.org/en/development','high','Bitcoin official development and contribution information.'),
 ('bitcoin_org_core','Bitcoin Core','official','https://bitcoin.org/en/bitcoin-core/','high','Bitcoin Core project and decentralization information.'),
 ('bitcoin_org_releases','Bitcoin Core Releases','official','https://bitcoin.org/en/version-history','high','Bitcoin Core version history and releases.'),
 ('bitcoin_bips','Bitcoin Improvement Proposals','official','https://bitcoin.org/en/bips/','high','Bitcoin Improvement Proposal registry.'),
 ('sec_crypto_2026','SEC Crypto Asset Interpretation 2026','regulator','https://www.sec.gov/rules-regulations/2026/03/s7-2026-09','high','U.S. SEC/CFTC 2026 crypto-asset interpretive framework.'),
 ('sec_custody_2026','SEC Crypto Custody Proposal 2026','regulator','https://www.sec.gov/newsroom/press-releases/2026-100-sec-proposal-would-address-how-investment-advisers-and-funds-can-custody-crypto-assets-under-federal','high','October 2026 proposed custody framework.')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO research_snapshots (snapshot_id,asset_id,version,status,title,content,published_at)
VALUES (
 'BTC-2026-10-07-v1','btc',1,'PUBLISHED',
 'Bitcoin (BTC) — Deep Research 01–15',
 '{"methodology":"CryptoResearch v2 / Structure 1","source_artifact":"research/assets/BTC/BTC-RESEARCH-01-15.md","snapshot_date":"2026-10-07","asset_type":"Monetary Asset","thesis":"Positive, with meaningful macro and adoption sensitivity","current_scenario":"Base with positive institutional and regulatory catalysts","confidence":"high"}'::jsonb,
 now()
)
ON CONFLICT (snapshot_id) DO UPDATE SET
 status=EXCLUDED.status,title=EXCLUDED.title,content=EXCLUDED.content,published_at=EXCLUDED.published_at;

WITH blocks(block_number,title,status,summary,analysis,confidence) AS (
 VALUES
 (1,'Essence & Role','complete','Bitcoin is a decentralized monetary network and scarce digital bearer asset.','The core investment role is monetary: censorship-resistant ownership, settlement, predictable issuance and a 21 million maximum supply. Assessment: Strong.','0.95'),
 (2,'Technology','complete','Bitcoin uses proof-of-work, a UTXO model and a conservative base-layer design.','Security and verifiability are prioritized over application-layer flexibility. Bitcoin Core remains actively maintained. Assessment: Strong.','0.92'),
 (3,'Tokenomics','complete','BTC has a hard maximum supply of 21 million and declining subsidy issuance.','Scarcity is the primary monetary property; long-term security economics as subsidy declines remain a monitoring question. Assessment: Very strong.','0.95'),
 (4,'Network / On-chain','complete','Network security depends on proof-of-work, miners, nodes and independent validation.','Key metrics are hash rate, difficulty, miner revenue, fees, block-space demand, UTXO behavior, exchange flows and node/client concentration. Assessment: Strong.','0.82'),
 (5,'Ecosystem','complete','Bitcoin has a narrower ecosystem centered on wallets, exchanges, custody, mining, institutional products and second layers.','Breadth is less important than strengthening monetary utility, liquidity, self-custody and settlement without weakening decentralization. Assessment: Strong.','0.90'),
 (6,'Users & Activity','complete','Bitcoin activity is primarily monetary: holding, settlement, exchange and second-layer use.','Raw transaction count is insufficient; transaction composition, fees, UTXO behavior and holder flows require monitoring. Assessment: Strong but activity quality requires monitoring.','0.78'),
 (7,'Institutions & Capital','complete','Institutional access is now structural through regulated products, custody and treasury strategies.','Institutional access is improving, while custody/intermediary concentration remains a risk. Assessment: Strong and improving.','0.90'),
 (8,'Development / Adoption','complete','Bitcoin development is intentionally incremental and consensus-driven.','Core maintenance and infrastructure adoption are improving without requiring aggressive base-layer change. Assessment: Improving.','0.88'),
 (9,'Macro','complete','BTC is highly sensitive to liquidity, real yields, dollar conditions, risk appetite and institutional capital.','Valuation is primarily monetary and market-based, making macro regime a major driver. Assessment: Regime-dependent.','0.88'),
 (10,'Competition & Alternatives','complete','Bitcoin competes primarily for monetary capital rather than smart-contract execution.','Gold, sovereign currencies, cash, other crypto assets and equities are relevant alternatives. Competitive position remains strongest among crypto monetary assets.','0.88'),
 (11,'Risks','complete','Major risks include volatility, miner economics, mining/custody concentration, regulation, monetary competition and technical risks.','Protocol thesis is stronger than short-term price stability; overall asset risk remains Medium-High.','0.82'),
 (12,'Catalysts','complete','Catalysts include institutional allocation, treasury adoption, regulatory clarity, second-layer utility and demand for non-sovereign assets.','Catalyst quality is strong but highly dependent on liquidity and capital allocation.','0.86'),
 (13,'Scenarios','complete','Bull, Base and Bear scenarios are defined around monetary demand, institutional flows, liquidity and security economics.','Current scenario: Base with positive institutional and regulatory catalysts.','0.84'),
 (14,'Conclusion','complete','Bitcoin thesis is monetary credibility built on scarcity, proof-of-work, decentralized validation, liquidity and institutional accessibility.','The decisive long-term variables are monetary demand and the evolution of fee-market support for miner economics. Thesis: Positive.','0.90'),
 (15,'Monitoring','complete','Critical factors and key signals are defined for monetary demand, security, institutional access and fee economics.','Monitoring chain: DATA → METRIC → SIGNAL → ASSESSMENT → CONFIDENCE → THESIS IMPACT → STATUS.','0.90')
)
INSERT INTO research_blocks(snapshot_id,block_number,title,status,summary,analysis,confidence)
SELECT 'BTC-2026-10-07-v1',block_number,title,status,summary,analysis,confidence::numeric FROM blocks
ON CONFLICT (snapshot_id,block_number) DO UPDATE SET
 title=EXCLUDED.title,status=EXCLUDED.status,summary=EXCLUDED.summary,analysis=EXCLUDED.analysis,confidence=EXCLUDED.confidence;

WITH mappings(block_number,research_domain_id,display_order) AS (
 VALUES
 (1,'foundation',1),(2,'technology_infrastructure',1),(3,'economics_ecosystem',1),(4,'technology_infrastructure',2),
 (5,'economics_ecosystem',2),(6,'adoption_capital',1),(7,'adoption_capital',2),(8,'foundation',2),
 (9,'competition_environment',1),(10,'competition_environment',2),(11,'thesis_outlook',1),(12,'thesis_outlook',2),
 (13,'thesis_outlook',3),(14,'thesis_outlook',4),(15,'thesis_outlook',5)
)
INSERT INTO research_block_domains(research_block_id,research_domain_id,relevance_weight,display_order)
SELECT rb.research_block_id,m.research_domain_id,1.0,m.display_order
FROM research_blocks rb JOIN mappings m ON m.block_number=rb.block_number
WHERE rb.snapshot_id='BTC-2026-10-07-v1'
ON CONFLICT (research_block_id,research_domain_id) DO UPDATE SET
 relevance_weight=EXCLUDED.relevance_weight,display_order=EXCLUDED.display_order;

WITH defs(metric_id,name,description) AS (
 VALUES
 ('btc_research_role','BTC role baseline','Qualitative research baseline for Bitcoin monetary role.'),
 ('btc_research_technology','BTC technology baseline','Qualitative research baseline for Bitcoin architecture and development.'),
 ('btc_research_tokenomics','BTC tokenomics baseline','Qualitative research baseline for Bitcoin scarcity and issuance.'),
 ('btc_research_network','BTC network baseline','Qualitative research baseline for network security and on-chain state.'),
 ('btc_research_ecosystem','BTC ecosystem baseline','Qualitative research baseline for Bitcoin ecosystem.'),
 ('btc_research_users','BTC users baseline','Qualitative research baseline for user activity.'),
 ('btc_research_institutions','BTC institutional baseline','Qualitative research baseline for institutional adoption.'),
 ('btc_research_development','BTC development baseline','Qualitative research baseline for development and adoption.'),
 ('btc_research_macro','BTC macro baseline','Qualitative research baseline for macro sensitivity.'),
 ('btc_research_competition','BTC competition baseline','Qualitative research baseline for monetary competition.'),
 ('btc_research_risk','BTC risk baseline','Qualitative research baseline for material risks.'),
 ('btc_research_catalyst','BTC catalyst baseline','Qualitative research baseline for catalysts.'),
 ('btc_research_scenario','BTC scenario baseline','Qualitative research baseline for scenarios.'),
 ('btc_research_conclusion','BTC conclusion baseline','Qualitative research baseline for thesis conclusion.'),
 ('btc_research_monitoring','BTC monitoring baseline','Qualitative research baseline for monitoring design.')
)
INSERT INTO metric_definitions(metric_id,namespace,name,description,default_unit,value_type)
SELECT metric_id,'research',name,description,NULL,'text' FROM defs
ON CONFLICT (metric_id) DO NOTHING;

WITH obs(metric_id,source_id,value_text) AS (
 VALUES
 ('btc_research_role','bitcoin_org_core','Bitcoin is a decentralized monetary network and scarce digital bearer asset.'),
 ('btc_research_technology','bitcoin_org_development','Bitcoin uses proof-of-work, UTXO validation and a conservative base-layer design.'),
 ('btc_research_tokenomics','bitcoin_org_core','BTC has a maximum supply of 21 million and declining protocol subsidy issuance.'),
 ('btc_research_network','bitcoin_org_core','Network security depends on proof-of-work, miners, nodes and independent validation.'),
 ('btc_research_ecosystem','bitcoin_org_core','Bitcoin ecosystem depth centers on wallets, custody, exchanges, mining, institutional products and second layers.'),
 ('btc_research_users','bitcoin_org_core','Bitcoin activity is primarily monetary, settlement and second-layer usage rather than broad smart-contract execution.'),
 ('btc_research_institutions','sec_custody_2026','U.S. regulatory developments in 2026 are improving the framework for institutional crypto custody.'),
 ('btc_research_development','bitcoin_org_releases','Bitcoin Core remains actively maintained through 2026 releases.'),
 ('btc_research_macro','sec_crypto_2026','Bitcoin valuation remains highly sensitive to liquidity, risk appetite and institutional capital conditions.'),
 ('btc_research_competition','bitcoin_org_core','Bitcoin competes primarily for monetary capital against gold, fiat, cash and other crypto assets.'),
 ('btc_research_risk','bitcoin_org_development','Long-term risks include miner economics, concentration, regulation and technical/security risks.'),
 ('btc_research_catalyst','sec_custody_2026','Improving institutional custody and regulated access can broaden Bitcoin capital access.'),
 ('btc_research_scenario','bitcoin_org_core','Bull, Base and Bear scenarios are driven by monetary demand, institutional flows, liquidity and security economics.'),
 ('btc_research_conclusion','bitcoin_org_core','Bitcoin thesis is monetary credibility based on scarcity, proof-of-work, decentralization and liquidity.'),
 ('btc_research_monitoring','bitcoin_org_development','Monitoring must connect data and metrics to signals, assessments, confidence, thesis impact and status.')
)
INSERT INTO observations(metric_id,asset_id,value_text,observed_at,source_id,source_url,methodology)
SELECT metric_id,'btc',value_text,now(),source_id,
 CASE source_id
  WHEN 'bitcoin_org_development' THEN 'https://bitcoin.org/en/development'
  WHEN 'bitcoin_org_core' THEN 'https://bitcoin.org/en/bitcoin-core/'
  WHEN 'bitcoin_org_releases' THEN 'https://bitcoin.org/en/version-history'
  WHEN 'sec_crypto_2026' THEN 'https://www.sec.gov/rules-regulations/2026/03/s7-2026-09'
  WHEN 'sec_custody_2026' THEN 'https://www.sec.gov/newsroom/press-releases/2026-100-sec-proposal-would-address-how-investment-advisers-and-funds-can-custody-crypto-assets-under-federal'
 END,
 'CryptoResearch v2 / Structure 1 qualitative baseline'
FROM obs
WHERE NOT EXISTS (
 SELECT 1 FROM observations o WHERE o.asset_id='btc' AND o.metric_id=obs.metric_id AND o.source_id=obs.source_id
);

WITH evidence_map(block_number,metric_id,source_id,claim,signal,assessment,thesis_impact,status) AS (
 VALUES
 (1,'btc_research_role','bitcoin_org_core','Bitcoin is a decentralized monetary network and scarce digital bearer asset.','stable','Strong monetary role.','positive','strong'),
 (2,'btc_research_technology','bitcoin_org_development','Bitcoin prioritizes proof-of-work security, independent validation and conservative protocol evolution.','stable','Strong architecture; flexibility is intentionally constrained.','positive','strong'),
 (3,'btc_research_tokenomics','bitcoin_org_core','BTC scarcity is governed by a 21 million maximum supply and declining issuance.','stable','Very strong monetary scarcity.','positive','strong'),
 (4,'btc_research_network','bitcoin_org_core','Bitcoin security depends on proof-of-work, miners, nodes and independent validation.','stable','Strong security model; fee economics require monitoring.','positive','watch'),
 (5,'btc_research_ecosystem','bitcoin_org_core','Bitcoin ecosystem depth centers on monetary infrastructure and second layers.','improving','Strong and strategically coherent.','positive','strong'),
 (6,'btc_research_users','bitcoin_org_core','Bitcoin activity is primarily monetary, settlement and second-layer usage.','mixed','Strong demand but activity quality requires monitoring.','positive','watch'),
 (7,'btc_research_institutions','sec_custody_2026','Institutional access and custody frameworks are becoming more mature.','improving','Strong institutional catalyst with concentration risk.','positive','strong'),
 (8,'btc_research_development','bitcoin_org_releases','Bitcoin Core development remains active and security-focused.','stable','Strong development process.','positive','strong'),
 (9,'btc_research_macro','sec_crypto_2026','BTC is sensitive to liquidity, real yields, risk appetite and institutional capital.','mixed','Macro regime is a major valuation driver.','mixed','watch'),
 (10,'btc_research_competition','bitcoin_org_core','Bitcoin competes primarily for monetary capital rather than application execution.','stable','Strongest crypto monetary position, but alternatives remain credible.','positive','strong'),
 (11,'btc_research_risk','bitcoin_org_development','Material risks include volatility, miner economics, concentration, regulation and technical risks.','mixed','Asset risk is medium-high.','negative','watch'),
 (12,'btc_research_catalyst','sec_custody_2026','Regulatory and custody improvements can expand institutional access.','improving','Catalyst quality is strong but policy-dependent.','positive','strong'),
 (13,'btc_research_scenario','bitcoin_org_core','Scenarios are driven by monetary demand, institutional flows, liquidity and security economics.','mixed','Base scenario currently dominates.','mixed','watch'),
 (14,'btc_research_conclusion','bitcoin_org_core','Bitcoin remains a positive monetary thesis based on scarcity, security, decentralization and liquidity.','stable','Positive thesis with macro and adoption sensitivity.','positive','strong'),
 (15,'btc_research_monitoring','bitcoin_org_development','Monitoring must connect data to metrics, signals, assessments, confidence, thesis impact and status.','stable','Monitoring design is defined.','neutral','strong')
)
INSERT INTO evidence(snapshot_id,research_block_id,research_domain_id,observation_id,source_id,evidence_type,claim,data_summary,signal,assessment,confidence,thesis_impact,status,as_of)
SELECT 'BTC-2026-10-07-v1',rb.research_block_id,rbdom.research_domain_id,o.observation_id,e.source_id,
 'fact',e.claim,o.value_text,e.signal,e.assessment,
 CASE e.status WHEN 'strong' THEN 0.90 WHEN 'watch' THEN 0.78 ELSE 0.65 END,
 e.thesis_impact,e.status,o.observed_at
FROM evidence_map e
JOIN research_blocks rb ON rb.snapshot_id='BTC-2026-10-07-v1' AND rb.block_number=e.block_number
LEFT JOIN research_block_domains rbdom ON rbdom.research_block_id=rb.research_block_id
JOIN observations o ON o.asset_id='btc' AND o.metric_id=e.metric_id AND o.source_id=e.source_id
WHERE NOT EXISTS (
 SELECT 1 FROM evidence x WHERE x.snapshot_id='BTC-2026-10-07-v1' AND x.research_block_id=rb.research_block_id
);

WITH factors(name,description,importance_weight,current_state,trend,confidence,thesis_impact,monitoring_priority) AS (
 VALUES
 ('Monetary Demand','Demand for BTC as a scarce non-sovereign monetary / reserve asset.','1.00','Strong strategic demand; highly macro-sensitive.','improving','0.88','positive',1),
 ('Institutional Allocation','Institutional ownership, regulated products and treasury demand.','0.95','Structural institutional access is established and expanding.','improving','0.90','positive',1),
 ('Network Security','Proof-of-work security, hash rate, difficulty and miner economics.','0.95','Strong security model; long-term fee economics require monitoring.','stable','0.82','positive',1),
 ('Fee-Market Strength','Transaction-fee demand as a growing component of miner economics.','0.90','Long-term unresolved variable as subsidy declines.','mixed','0.76','mixed',1),
 ('Decentralization','Distribution of nodes, miners, custody and infrastructure.','0.90','Strong protocol decentralization with concentration risks to monitor.','mixed','0.80','positive',2),
 ('Regulatory / Custody Environment','Access, custody and regulatory treatment across major markets.','0.85','Institutional framework is improving but remains policy-sensitive.','improving','0.88','positive',2)
)
INSERT INTO critical_factors(asset_id,snapshot_id,name,description,importance_weight,current_state,trend,confidence,thesis_impact,monitoring_priority)
SELECT 'btc','BTC-2026-10-07-v1',name,description,importance_weight::numeric,current_state,trend,confidence::numeric,thesis_impact,monitoring_priority FROM factors
ON CONFLICT (snapshot_id,name) DO UPDATE SET
 description=EXCLUDED.description,importance_weight=EXCLUDED.importance_weight,current_state=EXCLUDED.current_state,
 trend=EXCLUDED.trend,confidence=EXCLUDED.confidence,thesis_impact=EXCLUDED.thesis_impact,monitoring_priority=EXCLUDED.monitoring_priority;

WITH scenarios(scenario_type,probability,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence) AS (
 VALUES
 ('bull',0.30,'Institutional allocation expands, regulated access improves, treasury adoption grows, monetary demand strengthens and network security remains robust.','Institutional access, scarcity and non-sovereign monetary demand.','Persistent institutional outflows, severe liquidity contraction or material security concerns.','positive',0.84),
 ('base',0.50,'Bitcoin remains the dominant crypto monetary asset; institutionalization continues while price remains cyclical and macro-sensitive.','Current Structure 1 research baseline.','Sustained loss of monetary demand or credible deterioration in security economics.','neutral',0.88),
 ('bear',0.20,'Liquidity tightens, institutional flows reverse, regulatory/custody barriers increase and prolonged fee weakness pressures confidence in long-term security economics.','Macro, regulatory and miner-economics risks.','Renewed monetary demand and improving institutional access.','negative',0.78)
)
INSERT INTO research_scenarios(snapshot_id,scenario_type,probability,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence)
SELECT 'BTC-2026-10-07-v1',scenario_type,probability::numeric,assumptions,supporting_evidence,invalidation_conditions,thesis_impact,confidence::numeric FROM scenarios
ON CONFLICT (snapshot_id,scenario_type) DO UPDATE SET
 probability=EXCLUDED.probability,assumptions=EXCLUDED.assumptions,supporting_evidence=EXCLUDED.supporting_evidence,
 invalidation_conditions=EXCLUDED.invalidation_conditions,thesis_impact=EXCLUDED.thesis_impact,confidence=EXCLUDED.confidence;

WITH scores(score_type,value,scale_min,scale_max,methodology_version,confidence,explanation) AS (
 VALUES
 ('health',0.86,0,1,'CryptoResearch-v2-Structure1',0.88,'Strong monetary architecture, liquidity, decentralization and institutional access; mining economics remain a watch item.'),
 ('thesis',0.88,0,1,'CryptoResearch-v2-Structure1',0.90,'Positive monetary thesis based on scarcity, proof-of-work, decentralization and liquidity.'),
 ('value_accrual',0.82,0,1,'CryptoResearch-v2-Structure1',0.84,'BTC value accrual is monetary rather than cash-flow based; scarcity and demand are the core mechanisms.'),
 ('confidence',0.88,0,1,'CryptoResearch-v2-Structure1',0.90,'High confidence in the structural thesis; market regime remains uncertain.'),
 ('competitive_position',0.90,0,1,'CryptoResearch-v2-Structure1',0.92,'Strongest crypto monetary position, with competition primarily from non-crypto monetary assets.')
)
INSERT INTO research_scores(asset_id,snapshot_id,score_type,value,scale_min,scale_max,methodology_version,confidence,explanation)
SELECT 'btc','BTC-2026-10-07-v1',score_type,value::numeric,scale_min::numeric,scale_max::numeric,methodology_version,confidence::numeric,explanation FROM scores
ON CONFLICT (snapshot_id,score_type,methodology_version) DO UPDATE SET
 value=EXCLUDED.value,confidence=EXCLUDED.confidence,explanation=EXCLUDED.explanation,calculated_at=now();

WITH signals(name,description,direction,thesis_impact,status,confidence) AS (
 VALUES
 ('Institutional BTC demand','Institutional allocation and regulated access are structural demand drivers.','improving','positive','active',0.88),
 ('Network security','Hash rate and difficulty stability support the security thesis.','stable','positive','active',0.82),
 ('Fee-market strength','Fee revenue must increasingly support miner economics as subsidy declines.','mixed','mixed','watch',0.76),
 ('Monetary demand','Demand for BTC as scarce non-sovereign money remains the central thesis variable.','improving','positive','active',0.88),
 ('Mining concentration','Material increase in mining or power concentration is a negative signal.','unknown','negative','watch',0.78),
 ('Custody concentration','Material concentration in institutional custody/intermediaries is a negative signal.','unknown','negative','watch',0.78),
 ('Regulatory access','Broader regulated custody and investment access is a positive signal.','improving','positive','active',0.88)
)
INSERT INTO monitoring_signals(asset_id,name,current_value,direction,thesis_impact,status,confidence)
SELECT 'btc',name,jsonb_build_object('description',description),direction,thesis_impact,status,confidence::numeric FROM signals
ON CONFLICT DO NOTHING;

INSERT INTO research_status(asset_id,snapshot_id,status,reason,last_research_at,next_review_at)
VALUES ('btc','BTC-2026-10-07-v1','current','Published Structure 1 monetary-asset baseline; refresh on major protocol, mining-security, institutional-flow, regulatory/custody or monetary-demand changes.',now(),now()+interval '30 days')
ON CONFLICT (asset_id) DO UPDATE SET
 snapshot_id=EXCLUDED.snapshot_id,status=EXCLUDED.status,reason=EXCLUDED.reason,
 last_research_at=EXCLUDED.last_research_at,next_review_at=EXCLUDED.next_review_at,updated_at=now();

INSERT INTO schema_migrations(version)
VALUES ('2026-10-07-btc-asset-card')
ON CONFLICT (version) DO NOTHING;

COMMIT;
