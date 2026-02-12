DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created'
  ) THEN
    ALTER TABLE users RENAME COLUMN created_at TO created;
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS created TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS senha TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated TIMESTAMPTZ;

UPDATE users SET created = COALESCE(created, NOW());
UPDATE users SET login = COALESCE(login, lower(split_part(email, '@', 1)) || '_' || id);
UPDATE users SET senha = COALESCE(senha, '');
UPDATE users SET ativo = COALESCE(ativo, TRUE);
UPDATE users SET updated = COALESCE(updated, NOW());

ALTER TABLE users ALTER COLUMN created SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN ativo SET DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN updated SET DEFAULT NOW();

ALTER TABLE users ALTER COLUMN created SET NOT NULL;
ALTER TABLE users ALTER COLUMN login SET NOT NULL;
ALTER TABLE users ALTER COLUMN senha SET NOT NULL;
ALTER TABLE users ALTER COLUMN ativo SET NOT NULL;
ALTER TABLE users ALTER COLUMN updated SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_login_key ON users (login);
