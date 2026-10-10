-- ETH numeric observation registry and idempotency contract.
-- Additive only. Rehearsed in disposable PostgreSQL; do not run against production
-- outside the explicitly approved migration/cutover process.

BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('ethereum_public_rpc', 'Public Ethereum Execution JSON-RPC', 'public_rpc',
   'https://ethereum-rpc.publicnode.com', 'medium',
   'Public execution-layer JSON-RPC source for block-timestamped chain observations.'),
  ('ethsupply_fyi', 'ethsupply.fyi ETH supply and staking history API', 'public_api',
   'https://ethsupply.fyi', 'medium',
   'Third-party source with published ETH supply/issuance/burn accounting methodology and historical staking queue series; cross-check required before signal evaluation.')
ON CONFLICT (source_id) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  trust_level = EXCLUDED.trust_level,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO metric_definitions (metric_id, namespace, name, description, default_unit, value_type)
VALUES
  ('eth.market_spot_price', 'eth.market', 'ETH spot price',
   'ETH/USDT spot ticker. Provider response lacks a provider-issued observation timestamp; capture time must be labelled as a proxy and must not alone trigger thesis evaluation.',
   'USDT/ETH', 'numeric'),
  ('eth.base_fee_burned_per_block', 'eth.fees', 'ETH base-fee burn per block',
   'Execution block baseFeePerGas multiplied by gasUsed for that block. Excludes priority fees; not total fees or a daily aggregate.',
   'ETH/block', 'numeric'),
  ('eth.gross_issuance_per_interval', 'eth.supply', 'Gross ETH issuance per provider interval',
   'Provider-reported issuanceWei converted from wei to ETH for one 30-epoch (960-slot) historical interval. Source cross-check required.',
   'ETH/interval', 'numeric'),
  ('eth.execution_fee_burn_per_interval', 'eth.supply', 'ETH execution fee burn per provider interval',
   'Provider-reported burnWei (base-fee plus blob-fee burn) converted from wei to ETH for one 30-epoch (960-slot) historical interval; excludes consensus penalties and other execution destruction.',
   'ETH/interval', 'numeric'),
  ('eth.consensus_penalties_per_interval', 'eth.supply', 'ETH consensus penalties per provider interval',
   'Provider-reported consensusPenaltiesWei converted from wei to ETH for one 30-epoch (960-slot) historical interval.',
   'ETH/interval', 'numeric'),
  ('eth.other_execution_burn_per_interval', 'eth.supply', 'Other ETH execution burn per provider interval',
   'Provider-reported otherExecutionBurnWei converted from wei to ETH for one 30-epoch (960-slot) historical interval, including other proven execution-layer destruction.',
   'ETH/interval', 'numeric'),
  ('eth.net_supply_flow_per_interval', 'eth.supply', 'Net ETH supply flow per provider interval',
   'Provider-reported netWei converted from wei to ETH for one 30-epoch (960-slot) historical interval. May be negative; not a daily aggregate.',
   'ETH/interval', 'numeric'),
  ('eth.base_fee_burn_per_interval', 'eth.fees', 'ETH base-fee burn per provider interval',
   'Provider-reported baseFeeBurnWei converted from wei to ETH for one 30-epoch (960-slot) historical interval.',
   'ETH/interval', 'numeric'),
  ('eth.blob_fee_burn_per_interval', 'eth.fees', 'ETH blob fee burn per provider interval',
   'Provider-reported blobBaseFeeBurnWei converted from wei to ETH for one 30-epoch (960-slot) historical interval.',
   'ETH/interval', 'numeric'),
  ('eth.pending_deposit_queue_eth', 'eth.staking', 'Pending ETH deposit queue balance',
   'Provider-reported pendingDepositsGwei converted from Gwei to ETH at the observation timestamp; not validator concentration.',
   'ETH', 'numeric'),
  ('eth.scheduled_activation_queue_eth', 'eth.staking', 'Scheduled ETH activation queue balance',
   'Provider-reported scheduledActivationsGwei converted from Gwei to ETH at the observation timestamp; separate from pending deposits.',
   'ETH', 'numeric'),
  ('eth.scheduled_exit_queue_eth', 'eth.staking', 'Scheduled ETH exit queue balance',
   'Provider-reported scheduledExitsGwei converted from Gwei to ETH at the observation timestamp; not an exit queue wait time.',
   'ETH', 'numeric'),
  ('eth.entry_queue_wait_seconds', 'eth.staking', 'ETH entry queue wait time',
   'Provider-reported entryQueueWaitSeconds point observation; seconds, not queue balance.',
   'seconds', 'numeric'),
  ('eth.exit_queue_wait_seconds', 'eth.staking', 'ETH exit queue wait time',
   'Provider-reported exitQueueWaitSeconds point observation; seconds, not queue balance.',
   'seconds', 'numeric')
ON CONFLICT (metric_id) DO UPDATE SET
  namespace = EXCLUDED.namespace,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_unit = EXCLUDED.default_unit,
  value_type = EXCLUDED.value_type,
  updated_at = now();

-- The logical key allows a deliberate correction by incrementing revision.
-- Normalize nullable asset/window fields so retries of the same observation are
-- idempotent across PostgreSQL versions without relying on NULLS NOT DISTINCT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM observations
    GROUP BY
      metric_id,
      COALESCE(asset_id, ''),
      source_id,
      observed_at,
      COALESCE(period_start, '-infinity'::timestamptz),
      COALESCE(period_end, '-infinity'::timestamptz),
      revision
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add observations idempotency index: existing duplicate natural keys require review';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS observations_natural_key_uidx
ON observations (
  metric_id,
  (COALESCE(asset_id, '')),
  source_id,
  observed_at,
  (COALESCE(period_start, '-infinity'::timestamptz)),
  (COALESCE(period_end, '-infinity'::timestamptz)),
  revision
);

INSERT INTO schema_migrations (version)
VALUES ('2026-10-13-eth-observation-registry-and-idempotency')
ON CONFLICT (version) DO NOTHING;

COMMIT;
