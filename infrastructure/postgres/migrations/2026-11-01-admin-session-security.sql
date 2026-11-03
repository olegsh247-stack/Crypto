-- Durable admin login throttling and server-side session revocation.
-- No existing application data is modified.
BEGIN;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  key_hash char(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id varchar(64) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT admin_sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS admin_sessions_active_expiry_idx
  ON admin_sessions (expires_at)
  WHERE revoked_at IS NULL;

INSERT INTO schema_migrations (version)
VALUES ('2026-11-01-admin-session-security')
ON CONFLICT (version) DO NOTHING;

COMMIT;
