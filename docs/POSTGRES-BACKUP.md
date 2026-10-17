# PostgreSQL backup script

`scripts/backup-postgres.sh` creates a PostgreSQL custom-format dump, validates that PostgreSQL can read its archive index, records a SHA-256 checksum, restricts file permissions, and prunes only matching dumps older than the configured retention period.

Example on a trusted host with PostgreSQL client installed:

```bash
DATABASE_URL="$DATABASE_URL" \
BACKUP_DIR=/var/backups/crypto \
BACKUP_RETENTION_DAYS=14 \
bash scripts/backup-postgres.sh
```

The production Compose stack also provides an `ops`-profile backup utility; run it with `docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml --profile ops run --rm backup`. A systemd timer template schedules it daily at 02:00 UTC. The output includes the dump path and checksum, not the database connection string. Keep the destination directory private. A dump stored only on the same VPS is not sufficient disaster recovery: copy it to an independent, access-controlled destination and encrypt it according to the host's backup policy. Verify copied checksums and rehearse a restore before relying on a backup.

The CI rehearsal uses disposable PostgreSQL only; it never backs up or restores production data.
