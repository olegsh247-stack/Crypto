# VPS production deployment skeleton

Status: **prepared, not deployed**. No VPS, public DNS, production secrets, or production database cutover is provisioned by this document.

## Components and exposure

- Caddy is the only service publishing public ports (80/443) and terminates HTTPS for `CADDY_DOMAIN`.
- API is reachable only on the internal Compose edge network; it has no published host port.
- PostgreSQL is reachable only on the backend network; it has no published host port.
- Worker shares the backend network so it can reach PostgreSQL and external market data sources.
- API and Worker use the same PostgreSQL database.
- The Worker schedule defaults to 00:30 UTC and does not ingest immediately at process startup.

## Prepare the host

1. Provision a supported Linux VPS, secure SSH, configure firewall rules for SSH and TCP 80/443 only, and install Docker Engine plus the Compose plugin.
2. Point the chosen public DNS name to the VPS. Caddy needs working public DNS and inbound 80/443 to obtain and renew a certificate.
3. Clone the repository to a stable path such as `/opt/crypto`.
4. Copy `vps/.env.production.example` to `vps/.env.production`; edit it on the host only. The real file is ignored by Git.
5. Generate strong hex-only secrets. For example, run `openssl rand -hex 32` for `POSTGRES_PASSWORD` and `openssl rand -hex 48` for `ADMIN_TOKEN`. Hex-only keeps the database password safe in the connection URI. Never paste secrets into logs, tickets, or commits.
6. Set `CADDY_DOMAIN` to the DNS name and `CORS_ORIGIN` to the exact trusted browser origin. Do not leave example values.

## Start sequence

Run from the repository root; the env file path is explicit:

```bash
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml config --quiet
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml up -d postgres
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml --profile ops run --rm migrate
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml up -d --build api worker caddy
```

The migration command applies the repository's versioned migrations. On a new empty database it also bootstraps the base schema. Do not point this command at Neon or any other production database as a rehearsal. Production migration is a separate approved operation governed by `NEON-TO-POSTGRES-MIGRATION-RUNBOOK.md`.

## Verify

```bash
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml ps
curl --fail --silent --show-error "https://${CADDY_DOMAIN}/api/health"
curl --fail --silent --show-error "https://${CADDY_DOMAIN}/api/db-health"
```

Also verify the API asset/pair contracts and the BTC research response. Check that port 5432 is not listening on the public interface and that only the intended public API route is reachable. Inspect Worker logs; the first scheduled run should be at the next configured UTC occurrence, not immediately after startup.

## Local backup schedule

Create the configured host directory with restrictive permissions before enabling the timer:

```bash
sudo install -d -m 700 -o root -g root /var/backups/crypto
docker compose --env-file vps/.env.production -f vps/docker-compose.production.yml --profile ops run --rm backup
sudo install -m 644 vps/systemd/crypto-backup.service /etc/systemd/system/crypto-backup.service
sudo install -m 644 vps/systemd/crypto-backup.timer /etc/systemd/system/crypto-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now crypto-backup.timer
systemctl list-timers crypto-backup.timer
```

The timer runs at 02:00 UTC with a small randomized delay and retains 14 days by default. Test the service manually and verify the generated checksum/archive before enabling the timer. This is a **local VPS backup only**; configure an encrypted independent off-host copy and test restoration before production cutover.


## Data and backups

This Compose file defines persistence volumes but does not, by itself, provide an off-host backup or a proven restore. Configure encrypted off-host backups and perform a restore test before production cutover. Use the gated migration runbook for the Neon dump, target restore, row-count/integrity comparison, final write freeze, acceptance, and rollback conditions.

## Important boundaries

- Do not deploy this skeleton to a public VPS until DNS, firewall, secrets, backup/restore, and migration gates are complete.
- Do not disable Cloudflare or Neon as part of a routine `docker compose up`.
- Do not enable production Worker ingestion until the restored target database and API have passed acceptance checks.
