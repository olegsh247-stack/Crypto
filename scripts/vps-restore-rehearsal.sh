#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: $0 path/to/backup.dump" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BACKUP="$(realpath "$1")"
COMPOSE=(docker compose --env-file "${ENV_FILE:-vps/.env}" -f vps/docker-compose.yml)
DB="crypto_restore_check_$(date -u +%Y%m%d%H%M%S)_$$"
cleanup() {
  "${COMPOSE[@]}" exec -T postgres psql --username "${POSTGRES_USER:-crypto}" --dbname postgres --set=ON_ERROR_STOP=1 --command="select pg_terminate_backend(pid) from pg_stat_activity where datname='$DB'; drop database if exists \"$DB\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

"${COMPOSE[@]}" exec -T postgres createdb --username "${POSTGRES_USER:-crypto}" "$DB"
"${COMPOSE[@]}" exec -T postgres pg_restore --format=custom --no-owner --no-privileges --username "${POSTGRES_USER:-crypto}" --dbname "$DB" < "$BACKUP"
TABLES=$("${COMPOSE[@]}" exec -T postgres psql --username "${POSTGRES_USER:-crypto}" --dbname "$DB" --tuples-only --no-align --set=ON_ERROR_STOP=1 --command="select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';" | tr -d '\r')
test "${TABLES:-0}" -gt 0
"${COMPOSE[@]}" exec -T postgres psql --username "${POSTGRES_USER:-crypto}" --dbname "$DB" --set=ON_ERROR_STOP=1 --command="select count(*) from assets;" >/dev/null
echo "Restore rehearsal passed in isolated database $DB (public_tables=$TABLES). Original database was not modified."
