# Neon to self-hosted PostgreSQL migration runbook

Status: **preparation only — not executed against production**  
Target: PostgreSQL 16 on the Crypto VPS, managed by Docker Compose.

This runbook is a gated procedure, not authorization to migrate. Do not disable Cloudflare or Neon, run production ingestion, change secrets, or restore over any database until the migration window and cutover are explicitly approved.

## 0. Current boundary

- Current production remains Cloudflare Worker + Neon.
- VPS API/Worker and PostgreSQL have passed disposable-database Build Rehearsal checks.
- CI is independent of the live Cloudflare API.
- No VPS has been confirmed provisioned, and no production database migration is complete.

## 1. Preflight gates

All items must be true before a production dump is restored anywhere:

- [ ] VPS exists, is secured, and Docker Compose runs the target PostgreSQL/API stack.
- [ ] PostgreSQL is private to the Docker network; port 5432 is not publicly exposed.
- [ ] A database backup destination exists **off the VPS** and has sufficient capacity.
- [ ] A restore rehearsal has succeeded using a production-like dump in an isolated, disposable target database.
- [ ] The source PostgreSQL version is recorded with `SHOW server_version;`. Confirm a PostgreSQL 16 target can accept the dump. If the source major version is newer than 16, stop and resolve compatibility before proceeding.
- [ ] A current, independent backup of Neon exists and its checksum is recorded.
- [ ] Required environment variables/secrets are available to the operator without printing them into logs or committing them.
- [ ] The migration window, write freeze, rollback owner, and acceptance checks are agreed.

## 2. Make and protect a source backup

Use a trusted machine with a compatible PostgreSQL client. Do not enable shell tracing (`set -x`) while handling connection strings.

```bash
set -euo pipefail
umask 077
: "${SOURCE_DATABASE_URL:?Set the source connection string securely}"
: "${BACKUP_DIR:?Set an encrypted/off-host backup directory}"
mkdir -p "$BACKUP_DIR"
DUMP_FILE="$BACKUP_DIR/crypto-neon-$(date -u +%Y%m%dT%H%M%SZ).dump"

psql "$SOURCE_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc 'show server_version;'
pg_dump --version
pg_dump --format=custom --no-owner --no-acl --file="$DUMP_FILE" "$SOURCE_DATABASE_URL"
pg_restore --list "$DUMP_FILE" > "$DUMP_FILE.list"
sha256sum "$DUMP_FILE" | tee "$DUMP_FILE.sha256"
```

Keep the dump, inventory, and checksum off the VPS. Verify the copied checksum before restore. A dump is not considered a proven backup until the restore rehearsal and post-restore checks succeed.

## 3. Restore into an empty target database

Use a newly created, isolated database. Do **not** use `--clean` against a database that might contain data.

```bash
set -euo pipefail
: "${TARGET_DATABASE_URL:?Set the isolated target connection string securely}"
: "${DUMP_FILE:?Set the verified dump file path}"

psql "$TARGET_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc 'select current_database(), version();'
pg_restore --exit-on-error --no-owner --no-acl --dbname="$TARGET_DATABASE_URL" "$DUMP_FILE"
```

If restore fails, stop and investigate. Do not work around errors by skipping objects or applying migrations to a partially restored database. Recreate the isolated target from a clean state and repeat only after the cause is understood.

## 4. Compare every public table row count

Run the same inventory query against the source and restored target. It emits a stable `table|count` list for all public base tables.

```bash
table_counts() {
  local url="$1"
  psql "$url" -X -A -t -F '|' -v ON_ERROR_STOP=1 -c "
    SELECT format(
      'SELECT %L AS table_name, count(*)::bigint AS row_count FROM %I.%I;',
      table_schema || '.' || table_name, table_schema, table_name
    )
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  " | psql "$url" -X -A -t -F '|' -v ON_ERROR_STOP=1
}

table_counts "$SOURCE_DATABASE_URL" | sort > source-table-counts.txt
table_counts "$TARGET_DATABASE_URL" | sort > target-table-counts.txt
diff -u source-table-counts.txt target-table-counts.txt
```

A non-empty diff is a hard stop. Counts are necessary but not sufficient: continue with schema, key, and API checks below.

## 5. Data and schema acceptance checks

Run read-only queries against both source and target and compare results. Do not use production ingestion to “fix” discrepancies during this phase.

- [ ] All public tables and `schema_migrations` exist; migration markers have no duplicate versions.
- [ ] Asset Registry and Market Registry match, including enabled flags and pair identities.
- [ ] Published research snapshots, research blocks, critical factors, scores, scenarios, monitoring signals/events, observations, sources, and evidence relationships match.
- [ ] BTC has the expected current published snapshot and complete research-block set; preserve source identifiers, timestamps, revisions, and status fields.
- [ ] Daily candle keys have no duplicates; OHLCV constraints hold; candle counts and latest timestamps match.
- [ ] Foreign keys, unique constraints, indexes, and extensions are present and valid.
- [ ] Run the VPS API read-only contract checks for `/api/health`, `/api/db-health`, `/api/assets`, `/api/pairs`, `/api/assets/btc`, `/api/assets/eth`, and daily history.
- [ ] Confirm daily history calculations exclude any candle whose `candle_close_at > now()`; the API must label in-progress candles explicitly.
- [ ] Confirm API output has no unexpected missing research/evidence fields. Compare representative BTC responses field-by-field with production.

Do not approve cutover on row counts alone. Record the exact source/target server versions, dump checksum, inventory diff result, test run URL, and any accepted differences.

## 6. Final cutover sequence

Only after preflight and restore rehearsal pass:

1. Announce and enter the approved maintenance/write-freeze window.
2. Pause all production writers/ingestion using the approved operational controls. Do not make speculative changes to Cloudflare secrets or deploy settings.
3. Take a final source dump, copy it to the target securely, verify its checksum, and restore into a clean final target database.
4. Repeat table counts, integrity checks, and read-only API checks against the final restored target.
5. Point the intended public API route to the VPS using the approved routing/deployment procedure.
6. Keep the VPS Worker scheduler disabled until API acceptance is complete; then enable it deliberately and verify the first scheduled run from logs.
7. Verify API health, asset and pair contracts, BTC research/evidence, persisted history, and monitoring behavior. Record the exact verification time.
8. Keep Neon and the legacy Worker intact for the agreed rollback window. Do not delete the source or its backups as part of cutover.

## 7. Rollback rules

- Before any VPS-only writes occur, route traffic back to the previous API and preserve the VPS database for diagnosis.
- After VPS ingestion or API mutations have written data, **do not blindly switch back** to Neon: that would lose or fork post-cutover changes. Pause writes and reconcile/forward-sync the delta under a separate reviewed procedure first.
- Never restore a backup over the source Neon database as a rollback shortcut.
- Do not disable or delete Neon until acceptance is signed off and the retention/rollback window has ended.

## 8. Completion record

The migration is complete only when the operator records:

- [ ] Approved maintenance window and cutover timestamp (UTC)
- [ ] Source/target PostgreSQL versions
- [ ] Backup filename, off-host location, and verified SHA-256
- [ ] Source/target table-count diff: empty
- [ ] Integrity/schema checks and API acceptance: passed
- [ ] First VPS Worker scheduled run: verified
- [ ] Rollback window end and Neon retirement decision

Until then, production must be treated as Cloudflare + Neon, even if local development and CI use only VPS-compatible code and disposable PostgreSQL.
