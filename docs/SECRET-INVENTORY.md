# SECRET INVENTORY — Crypto

Дата: 2026-10-07
Статус: PRE-CUTOVER INVENTORY

This document records secret names, purpose, owner/source and rotation status only. Secret values must never be committed here.

## Known GitHub Actions secrets

| Secret | Current use | Target during VPS migration | Status |
|---|---|---|---|
| `NEON_DATABASE_URL` | Neon migrations, seed, scheduled ingestion verification | Temporary migration/rollback only; replace with VPS DB credentials | INVENTORY REQUIRED |
| `CLOUDFLARE_API_TOKEN` | Worker deploy and workers.dev management | Temporary rollback/deploy only; remove after decommission | INVENTORY REQUIRED |
| `CLOUDFLARE_ACCOUNT_ID` | Worker deployment/account API | Temporary rollback/deploy only | INVENTORY REQUIRED |
| `CRYPTO_ADMIN_TOKEN` | Worker `ADMIN_TOKEN` | New VPS API `ADMIN_TOKEN`; rotate before cutover | ROTATION REQUIRED |

## Runtime secrets

Current Worker runtime: `DATABASE_URL`, `ADMIN_TOKEN`.

Target VPS runtime: `DATABASE_URL`, `ADMIN_TOKEN`.

Additional runtime secrets may exist only if confirmed by the actual deployment/account inventory.

## Required actions before cutover

- [ ] Confirm every GitHub Actions secret above exists and is still required.
- [ ] Record where each secret is sourced from.
- [ ] Rotate `CRYPTO_ADMIN_TOKEN`.
- [ ] Create a dedicated VPS PostgreSQL application credential.
- [ ] Create a separate migration/maintenance credential.
- [ ] Store VPS secrets outside Git.
- [ ] Confirm no secret value appears in repository history or logs.
- [ ] Update deployment workflow to use VPS secrets.
- [ ] Verify rollback credentials remain valid until rollback window ends.
- [ ] After decommission: remove obsolete Cloudflare/Neon credentials from active workflows.

## Security rule

Never paste secret values into GitHub files, issues, audit documents, chat, logs or screenshots.

The audit records existence and lifecycle, not values.
