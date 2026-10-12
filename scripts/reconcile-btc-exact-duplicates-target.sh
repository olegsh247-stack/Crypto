#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${EXPECTED_DATABASE_NAME:?Set EXPECTED_DATABASE_NAME to the exact restored target database name}"
if [[ "${ALLOW_BTC_EXACT_DUPLICATE_RECONCILIATION:-}" != "1" ]]; then
  echo "Refusing cleanup: set ALLOW_BTC_EXACT_DUPLICATE_RECONCILIATION=1 only after reviewing the restored target audit." >&2
  exit 2
fi
actual_database="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c 'SELECT current_database()')"
if [[ "$actual_database" != "$EXPECTED_DATABASE_NAME" ]]; then
  echo "Refusing cleanup: connected database '$actual_database' does not match EXPECTED_DATABASE_NAME." >&2
  exit 2
fi
PGOPTIONS="${PGOPTIONS:+$PGOPTIONS }-c app.allow_btc_exact_duplicate_reconciliation=1" \
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/reconcile-btc-exact-duplicates-target.sql
