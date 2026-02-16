CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION client_try_parse_uuid(value TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN value::UUID;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clients'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_clients_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(client_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM clients;

    UPDATE clients c
    SET id = m.new_id::TEXT
    FROM tmp_clients_id_map m
    WHERE c.id = m.old_id;

    ALTER TABLE clients ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

ALTER TABLE clients ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP FUNCTION IF EXISTS client_try_parse_uuid(TEXT);
