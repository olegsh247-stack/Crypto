# SECRET INVENTORY — Crypto VPS

Updated: 2026-10-12

This file records secret purposes and lifecycle only. Secret values must never be committed.

## Target host runtime

| Variable | Purpose | Storage | Status |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection for API and worker | VPS environment file outside Git; restricted file permissions | Create after VPS purchase |
| `ADMIN_TOKEN` | API administrative authorization | VPS environment and authorized CI secret store only | Generate and rotate before cutover |
| `POSTGRES_PASSWORD` | PostgreSQL role authentication | VPS environment file outside Git | Generate after VPS purchase |
| `CORS_ORIGIN` | Allowed frontend origin | VPS environment/configuration | Set after domain selection |
| `BACKUP_DIR_HOST` | Local backup destination | VPS environment/configuration | Set and test before cutover |
| `DEPLOY_SSH_KEY` | Automated deployment access | GitHub Actions secret; dedicated deploy account | Create only when VPS is ready |

## Required controls

- [ ] Use a dedicated application database role and a separate migration/maintenance role.
- [ ] Restrict SSH to key-based access and least-privilege deploy account.
- [ ] Never expose PostgreSQL publicly.
- [ ] Store encrypted backups off-host and prove restore works.
- [ ] Rotate the admin token before public cutover.
- [ ] Never paste secret values into Git, issues, audit documents, chat, or logs.
- [ ] Remove obsolete secret entries from repository settings only after checking all remaining workflows and completing the migration rollback window.

No secret values are stored in this document.
