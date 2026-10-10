-- ETH numeric observation registry and idempotency contract.
-- Additive only. Rehearsed in disposable PostgreSQL; do not run against production
-- outside the explicitly approved migration/cutover process.

BEGIN;

INSERT INTO sources (source_id, name, source_type, base_url, trust_level, description)
VALUES
  ('ethereum_public_rpc', 'Public Ethereum Execution JSON-RPC', 'public_rpc',
   'https://ethereum-rpc.publicnode.com', 'medium',
   'Public execution-layer JSON-RPC source for block-timestamped chain observations.')
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
   'ETH/block', 'numeric')
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
