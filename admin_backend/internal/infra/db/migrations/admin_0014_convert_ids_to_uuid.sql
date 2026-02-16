CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_try_parse_uuid(value TEXT)
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
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN
    SELECT
      con.conrelid::regclass AS table_name,
      con.conname
    FROM pg_constraint con
    INNER JOIN pg_class rel
      ON rel.oid = con.conrelid
    WHERE con.contype = 'f'
      AND rel.relname IN (
        'user_profiles',
        'profile_permissions',
        'client_addresses',
        'client_phones'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I',
      fk_record.table_name,
      fk_record.conname
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_users_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM users;

    UPDATE users u
    SET id = m.new_id::TEXT
    FROM tmp_users_id_map m
    WHERE u.id = m.old_id;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'user_id'
    ) THEN
      UPDATE user_profiles up
      SET user_id = m.new_id::TEXT
      FROM tmp_users_id_map m
      WHERE up.user_id::TEXT = m.old_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_profiles_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM profiles;

    UPDATE profiles p
    SET id = m.new_id::TEXT
    FROM tmp_profiles_id_map m
    WHERE p.id = m.old_id;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'profile_id'
    ) THEN
      UPDATE user_profiles up
      SET profile_id = m.new_id::TEXT
      FROM tmp_profiles_id_map m
      WHERE up.profile_id::TEXT = m.old_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profile_permissions'
        AND column_name = 'profile_id'
    ) THEN
      UPDATE profile_permissions pp
      SET profile_id = m.new_id::TEXT
      FROM tmp_profiles_id_map m
      WHERE pp.profile_id::TEXT = m.old_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'permissions'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_permissions_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM permissions;

    UPDATE permissions p
    SET id = m.new_id::TEXT
    FROM tmp_permissions_id_map m
    WHERE p.id = m.old_id;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profile_permissions'
        AND column_name = 'permission_id'
    ) THEN
      UPDATE profile_permissions pp
      SET permission_id = m.new_id::TEXT
      FROM tmp_permissions_id_map m
      WHERE pp.permission_id::TEXT = m.old_id;
    END IF;
  END IF;
END $$;

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
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM clients;

    UPDATE clients c
    SET id = m.new_id::TEXT
    FROM tmp_clients_id_map m
    WHERE c.id = m.old_id;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'client_addresses'
        AND column_name = 'client_id'
    ) THEN
      UPDATE client_addresses ca
      SET client_id = m.new_id::TEXT
      FROM tmp_clients_id_map m
      WHERE ca.client_id::TEXT = m.old_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'client_phones'
        AND column_name = 'client_id'
    ) THEN
      UPDATE client_phones cp
      SET client_id = m.new_id::TEXT
      FROM tmp_clients_id_map m
      WHERE cp.client_id::TEXT = m.old_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'client_addresses'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_client_addresses_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM client_addresses;

    UPDATE client_addresses ca
    SET id = m.new_id::TEXT
    FROM tmp_client_addresses_id_map m
    WHERE ca.id = m.old_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'client_phones'
      AND column_name = 'id'
      AND data_type <> 'uuid'
  ) THEN
    CREATE TEMP TABLE tmp_client_phones_id_map ON COMMIT DROP AS
    SELECT id AS old_id, COALESCE(admin_try_parse_uuid(id), gen_random_uuid()) AS new_id
    FROM client_phones;

    UPDATE client_phones cp
    SET id = m.new_id::TEXT
    FROM tmp_client_phones_id_map m
    WHERE cp.id = m.old_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE permissions ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE clients ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE client_addresses ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_phones' AND column_name = 'id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE client_phones ALTER COLUMN id TYPE UUID USING id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE user_profiles ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'profile_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE user_profiles ALTER COLUMN profile_id TYPE UUID USING profile_id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_permissions' AND column_name = 'profile_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE profile_permissions ALTER COLUMN profile_id TYPE UUID USING profile_id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_permissions' AND column_name = 'permission_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE profile_permissions ALTER COLUMN permission_id TYPE UUID USING permission_id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_addresses' AND column_name = 'client_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE client_addresses ALTER COLUMN client_id TYPE UUID USING client_id::UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'client_phones' AND column_name = 'client_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE client_phones ALTER COLUMN client_id TYPE UUID USING client_id::UUID;
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE permissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE clients ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_addresses ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE client_phones ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE profile_permissions ADD COLUMN IF NOT EXISTS id UUID;
UPDATE profile_permissions SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE profile_permissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE profile_permissions ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_permissions_pkey'
      AND conrelid = 'profile_permissions'::regclass
  ) THEN
    ALTER TABLE profile_permissions DROP CONSTRAINT profile_permissions_pkey;
  END IF;
END $$;
ALTER TABLE profile_permissions ADD CONSTRAINT profile_permissions_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS profile_permissions_profile_permission_unique_idx
  ON profile_permissions (profile_id, permission_id);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS id UUID;
UPDATE user_profiles SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE user_profiles ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_pkey'
      AND conrelid = 'user_profiles'::regclass
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_pkey;
  END IF;
END $$;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_profile_unique_idx
  ON user_profiles (user_id, profile_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_user_id_fkey'
      AND conrelid = 'user_profiles'::regclass
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_profile_id_fkey'
      AND conrelid = 'user_profiles'::regclass
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_permissions_profile_id_fkey'
      AND conrelid = 'profile_permissions'::regclass
  ) THEN
    ALTER TABLE profile_permissions
      ADD CONSTRAINT profile_permissions_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_permissions_permission_id_fkey'
      AND conrelid = 'profile_permissions'::regclass
  ) THEN
    ALTER TABLE profile_permissions
      ADD CONSTRAINT profile_permissions_permission_id_fkey
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_addresses_client_id_fkey'
      AND conrelid = 'client_addresses'::regclass
  ) THEN
    ALTER TABLE client_addresses
      ADD CONSTRAINT client_addresses_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_phones_client_id_fkey'
      AND conrelid = 'client_phones'::regclass
  ) THEN
    ALTER TABLE client_phones
      ADD CONSTRAINT client_phones_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP FUNCTION IF EXISTS admin_try_parse_uuid(TEXT);
