# Infrastructure v1 — self-hosted target

Status: superseded by the VPS-only architecture.

The Crypto product is intended to run on the user's own VPS using Docker Compose, PostgreSQL 16, Node.js/TypeScript API, a separate scheduled worker, Caddy HTTPS, and off-host backups. No additional hosted runtime or database service is part of the target.

Use these current documents:
- [VPS migration execution status](../docs/VPS-MIGRATION-EXECUTION-STATUS.md)
- [VPS infrastructure batch](../docs/INFRA-BATCH-1.md)
- [PostgreSQL migration runbook](../docs/POSTGRES-MIGRATION-RUNBOOK.md)

The active release gate must test only against disposable PostgreSQL. Production cutover requires the purchased host, verified restore, contract checks, backup/restore evidence, and explicit approval.
