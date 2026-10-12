# PostgreSQL schema and migrations

This directory contains the canonical PostgreSQL schema, versioned migrations, and deterministic seed fixtures for the self-hosted Crypto deployment.

Apply schema and migrations from the repository root with:

`DATABASE_URL=postgresql://... bash scripts/migrate-postgres.sh`

The runner bootstraps the base schema once and applies migrations in lexical order using `schema_migrations` markers. Re-running it is safe. Seed fixtures are intended for controlled initialization or disposable-database tests; do not apply them to production without a reviewed migration plan.

The same migration set is used by local CI rehearsals and the target VPS deployment. Never commit credentials or database connection strings.
