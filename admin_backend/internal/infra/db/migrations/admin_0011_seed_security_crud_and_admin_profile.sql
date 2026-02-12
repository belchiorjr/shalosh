CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS user_profiles_profile_id_idx
  ON user_profiles (profile_id);

INSERT INTO permissions (id, code, name, description, active, created, updated)
VALUES
  ('perm_users_create', 'users.create', 'users.create', 'Permite cadastrar usuários', TRUE, NOW(), NOW()),
  ('perm_users_read', 'users.read', 'users.read', 'Permite visualizar usuários', TRUE, NOW(), NOW()),
  ('perm_users_update', 'users.update', 'users.update', 'Permite editar usuários', TRUE, NOW(), NOW()),
  ('perm_users_delete', 'users.delete', 'users.delete', 'Permite excluir usuários', TRUE, NOW(), NOW()),
  ('perm_permissions_create', 'permissions.create', 'permissions.create', 'Permite cadastrar permissões', TRUE, NOW(), NOW()),
  ('perm_permissions_read', 'permissions.read', 'permissions.read', 'Permite visualizar permissões', TRUE, NOW(), NOW()),
  ('perm_permissions_update', 'permissions.update', 'permissions.update', 'Permite editar permissões', TRUE, NOW(), NOW()),
  ('perm_permissions_delete', 'permissions.delete', 'permissions.delete', 'Permite excluir permissões', TRUE, NOW(), NOW()),
  ('perm_profiles_create', 'profiles.create', 'profiles.create', 'Permite cadastrar perfis', TRUE, NOW(), NOW()),
  ('perm_profiles_read', 'profiles.read', 'profiles.read', 'Permite visualizar perfis', TRUE, NOW(), NOW()),
  ('perm_profiles_update', 'profiles.update', 'profiles.update', 'Permite editar perfis', TRUE, NOW(), NOW()),
  ('perm_profiles_delete', 'profiles.delete', 'profiles.delete', 'Permite excluir perfis', TRUE, NOW(), NOW())
ON CONFLICT ((LOWER(code))) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = TRUE,
  updated = NOW();

DO $$
DECLARE
  admin_profile_id TEXT;
  admin_user_id TEXT;
BEGIN
  INSERT INTO profiles (id, name, description, active, created, updated)
  VALUES (
    'profile_administrator',
    'Administrator',
    'Administrador do sistema com acesso total a todas as permissões',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT ((LOWER(name))) DO UPDATE
  SET
    description = EXCLUDED.description,
    active = TRUE,
    updated = NOW()
  RETURNING id INTO admin_profile_id;

  INSERT INTO profile_permissions (profile_id, permission_id, created)
  SELECT admin_profile_id, permission.id, NOW()
  FROM permissions permission
  ON CONFLICT (profile_id, permission_id) DO NOTHING;

  SELECT user_record.id
    INTO admin_user_id
  FROM users user_record
  WHERE LOWER(user_record.login) = LOWER('admin')
     OR user_record.id = 'admin'
  ORDER BY
    CASE
      WHEN LOWER(user_record.login) = LOWER('admin') THEN 0
      ELSE 1
    END,
    user_record.created,
    user_record.id
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (user_id, profile_id, created)
    VALUES (admin_user_id, admin_profile_id, NOW())
    ON CONFLICT (user_id, profile_id) DO NOTHING;
  END IF;
END $$;
