#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose --env-file "${ENV_FILE:-vps/.env}" -f vps/docker-compose.yml)
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/crypto-$STAMP.dump"
TMP="$OUT.partial"
trap 'rm -f "$TMP"' EXIT

"${COMPOSE[@]}" exec -T postgres pg_dump --format=custom --no-owner --no-privileges --username "${POSTGRES_USER:-crypto}" "${POSTGRES_DB:-crypto}" > "$TMP"
test -s "$TMP"
"${COMPOSE[@]}" exec -T postgres pg_restore --list < "$TMP" >/dev/null
mv "$TMP" "$OUT"
chmod 600 "$OUT"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$OUT")" > "$(basename "$OUT").sha256")
chmod 600 "$OUT.sha256"
echo "Backup created and archive listing validated: $OUT"
