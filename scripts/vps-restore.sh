#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${RESTORE_CONFIRM:-}" != "YES" ]]; then
  echo "Refusing restore: set RESTORE_CONFIRM=YES only after verifying the target and backup." >&2
  exit 2
fi
if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: RESTORE_CONFIRM=YES $0 path/to/backup.dump" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BACKUP="$(realpath "$1")"
if [[ -f "$BACKUP.sha256" ]]; then
  (cd "$(dirname "$BACKUP")" && sha256sum --check "$(basename "$BACKUP").sha256")
fi
COMPOSE=(docker compose --env-file "${ENV_FILE:-vps/.env}" -f vps/docker-compose.yml)
echo "WARNING: restoring into ${POSTGRES_DB:-crypto} replaces existing objects in that database."
"${COMPOSE[@]}" exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges --username "${POSTGRES_USER:-crypto}" --dbname "${POSTGRES_DB:-crypto}" < "$BACKUP"
"${COMPOSE[@]}" exec -T postgres psql --username "${POSTGRES_USER:-crypto}" --dbname "${POSTGRES_DB:-crypto}" --set=ON_ERROR_STOP=1 --command="select count(*) as asset_rows from assets;"
echo "Restore command completed. Application-level parity checks are still required before serving traffic."
