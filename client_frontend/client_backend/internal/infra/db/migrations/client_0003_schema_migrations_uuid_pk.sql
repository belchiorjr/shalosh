CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS id UUID;
UPDATE schema_migrations SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE schema_migrations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE schema_migrations ALTER COLUMN id SET NOT NULL;
ALTER TABLE schema_migrations ALTER COLUMN version SET NOT NULL;

DO $$
DECLARE
  current_pk_name TEXT;
  has_pk_on_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'schema_migrations'::regclass
      AND c.contype = 'p'
      AND a.attname = 'id'
  ) INTO has_pk_on_id;

  IF NOT has_pk_on_id THEN
    SELECT conname
      INTO current_pk_name
    FROM pg_constraint
    WHERE conrelid = 'schema_migrations'::regclass
      AND contype = 'p'
    LIMIT 1;

    IF current_pk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE schema_migrations DROP CONSTRAINT %I', current_pk_name);
    END IF;

    ALTER TABLE schema_migrations
      ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS schema_migrations_version_key
  ON schema_migrations (version);
