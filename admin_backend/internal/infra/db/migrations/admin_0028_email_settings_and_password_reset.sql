CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'turbosmtp',
  api_url TEXT NOT NULL DEFAULT 'https://api.turbo-smtp.com/api/v2/mail/send',
  auth_user TEXT NOT NULL DEFAULT '',
  auth_password TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  admin_reset_url TEXT NOT NULL DEFAULT 'http://localhost:3001/reset-password',
  client_reset_url TEXT NOT NULL DEFAULT 'http://localhost:3002/reset-password',
  token_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_settings_token_ttl_check CHECK (
    token_ttl_minutes BETWEEN 5 AND 1440
  )
);

-- Configuração é única (singleton): garante no máximo uma linha na tabela.
CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton_idx
  ON email_settings ((id IS NOT NULL));

INSERT INTO email_settings (provider, created, updated)
SELECT 'turbosmtp', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM email_settings);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL,
  subject_id UUID NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT password_reset_tokens_audience_check CHECK (
    audience IN ('admin', 'client')
  )
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_subject_idx
  ON password_reset_tokens (audience, subject_id);

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON password_reset_tokens (expires_at);
