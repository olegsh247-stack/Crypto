#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
if [[ ! "$retention_days" =~ ^[0-9]+$ ]]; then
  echo "BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 2
fi

umask 077
mkdir -p "$BACKUP_DIR"
BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump="$BACKUP_DIR/crypto-postgres-$stamp.dump"
tmp="$BACKUP_DIR/.crypto-postgres-$stamp.dump.tmp.$$"
list_tmp="$tmp.list"
sha_tmp="$tmp.sha256"
trap 'rm -f -- "$tmp" "$list_tmp" "$sha_tmp"' EXIT

pg_dump --format=custom --no-owner --no-acl --file="$tmp" "$DATABASE_URL"
pg_restore --list "$tmp" > "$list_tmp"
checksum="$(sha256sum "$tmp" | awk '{print $1}')"
printf '%s  %s\n' "$checksum" "$dump" > "$sha_tmp"

mv -- "$tmp" "$dump"
mv -- "$list_tmp" "$dump.list"
mv -- "$sha_tmp" "$dump.sha256"
chmod 600 "$dump" "$dump.list" "$dump.sha256"

while IFS= read -r -d '' old_dump; do
  rm -f -- "$old_dump" "$old_dump.list" "$old_dump.sha256"
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'crypto-postgres-*.dump' -mtime "+$retention_days" -print0)

echo "POSTGRES_BACKUP_OK file=$dump sha256=$checksum retention_days=$retention_days"
