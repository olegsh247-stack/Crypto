-- Disposable rehearsal only: verifies canonical BTC spot observation constraints and
-- natural-key idempotency, then rolls back every test row.
BEGIN;

DO $$
DECLARE
  candidate_at timestamptz := date_trunc('second', now() - interval '30 seconds');
  inserted_rows integer;
  matching_rows integer;
  index_exists boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assets WHERE asset_id = 'btc') THEN
    RAISE EXCEPTION 'BTC candidate rehearsal blocked: asset btc is not registered';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM metric_definitions WHERE metric_id = 'market.spot_price' AND default_unit = 'USD/BTC' AND value_type = 'numeric') THEN
    RAISE EXCEPTION 'BTC candidate rehearsal blocked: canonical metric contract is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM sources WHERE source_id = 'market.kraken' AND base_url = 'https://api.kraken.com/0/public/Trades') THEN
    RAISE EXCEPTION 'BTC candidate rehearsal blocked: Kraken source contract is missing';
  END IF;
  SELECT to_regclass('public.observations_btc_natural_key_revision_uq') IS NOT NULL INTO index_exists;
  IF NOT index_exists THEN
    RAISE EXCEPTION 'BTC candidate rehearsal blocked: natural-key unique index is missing';
  END IF;

  INSERT INTO observations (
    metric_id, asset_id, value_numeric, unit, observed_at,
    source_id, source_url, methodology, status, freshness, revision
  ) VALUES (
    'market.spot_price', 'btc', 83500.50, 'USD/BTC', candidate_at,
    'market.kraken', 'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
    'kraken-trades-candidate-v1;retrieved_at=' || now()::text ||
      ';raw_payload_sha256=' || repeat('a', 64) || ';pair=XXBTZUSD',
    'NORMAL', 'CURRENT', 1
  ) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_rows = ROW_COUNT;
  IF inserted_rows <> 1 THEN
    RAISE EXCEPTION 'BTC candidate rehearsal expected first insert, inserted % rows', inserted_rows;
  END IF;

  -- Repeat the same logical observation. The natural-key/revision index must prevent
  -- a duplicate while preserving the original row.
  INSERT INTO observations (
    metric_id, asset_id, value_numeric, unit, observed_at,
    source_id, source_url, methodology, status, freshness, revision
  ) VALUES (
    'market.spot_price', 'btc', 83500.50, 'USD/BTC', candidate_at,
    'market.kraken', 'https://api.kraken.com/0/public/Trades?pair=XBTUSD',
    'kraken-trades-candidate-v1;retrieved_at=' || now()::text ||
      ';raw_payload_sha256=' || repeat('a', 64) || ';pair=XXBTZUSD',
    'NORMAL', 'CURRENT', 1
  ) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_rows = ROW_COUNT;
  IF inserted_rows <> 0 THEN
    RAISE EXCEPTION 'BTC candidate rehearsal expected duplicate to be ignored, inserted % rows', inserted_rows;
  END IF;

  SELECT count(*) INTO matching_rows
  FROM observations
  WHERE metric_id = 'market.spot_price'
    AND asset_id = 'btc'
    AND source_id = 'market.kraken'
    AND observed_at = candidate_at
    AND revision = 1;
  IF matching_rows <> 1 THEN
    RAISE EXCEPTION 'BTC candidate rehearsal expected one logical row, found %', matching_rows;
  END IF;

  -- Verify the metric foreign key fails closed for an unknown metric. The nested
  -- exception block rolls back this deliberately invalid statement.
  BEGIN
    INSERT INTO observations (
      metric_id, asset_id, value_numeric, unit, observed_at, source_id
    ) VALUES (
      'test.missing.metric', 'btc', 1, 'USD/BTC', candidate_at, 'market.kraken'
    );
    RAISE EXCEPTION 'BTC candidate rehearsal failed: unknown metric was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- Verify the source foreign key fails closed for an unknown source.
  BEGIN
    INSERT INTO observations (
      metric_id, asset_id, value_numeric, unit, observed_at, source_id
    ) VALUES (
      'market.spot_price', 'btc', 1, 'USD/BTC', candidate_at, 'test.missing.source'
    );
    RAISE EXCEPTION 'BTC candidate rehearsal failed: unknown source was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  RAISE NOTICE 'BTC_KRAKEN_OBSERVATION_CONTRACT_OK first_insert=1 duplicate_insert=0 row_count=1 metric_fk=1 source_fk=1';
END $$;

ROLLBACK;
