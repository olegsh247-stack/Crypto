#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

# Deterministic bootstrap: create the base schema once, then apply every
# versioned migration in lexical order. Each migration is guarded by its
# schema_migrations marker so reruns are safe.
has_schema=$(psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align   --command="SELECT CASE WHEN to_regclass('public.assets') IS NULL THEN '0' ELSE '1' END;")

if [ "$has_schema" = "0" ]; then
  echo "BOOTSTRAP: applying infrastructure/neon/schema-v1.sql"
  psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --single-transaction     --file=infrastructure/neon/schema-v1.sql
fi

for migration in infrastructure/neon/migrations/*.sql; do
  version="$(basename "$migration" .sql)"
  applied=$(psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align     --command="SELECT CASE WHEN EXISTS (SELECT 1 FROM schema_migrations WHERE version='$version') THEN '1' ELSE '0' END;")
  if [ "$applied" = "1" ]; then
    echo "SKIP: $version"
  else
    echo "APPLY: $version"
    psql "$DATABASE_URL" --set=ON_ERROR_STOP=1 --single-transaction --file="$migration"
  fi
done

echo "NEON_MIGRATIONS_OK"
