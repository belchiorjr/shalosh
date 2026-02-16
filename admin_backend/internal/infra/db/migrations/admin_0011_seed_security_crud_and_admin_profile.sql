CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS user_profiles_profile_id_idx
  ON user_profiles (profile_id);

INSERT INTO permissions (code, name, description, active, created, updated)
VALUES
  ('users.create', 'users.create', 'Permite cadastrar usuários', TRUE, NOW(), NOW()),
  ('users.read', 'users.read', 'Permite visualizar usuários', TRUE, NOW(), NOW()),
  ('users.update', 'users.update', 'Permite editar usuários', TRUE, NOW(), NOW()),
  ('users.delete', 'users.delete', 'Permite excluir usuários', TRUE, NOW(), NOW()),
  ('permissions.create', 'permissions.create', 'Permite cadastrar permissões', TRUE, NOW(), NOW()),
  ('permissions.read', 'permissions.read', 'Permite visualizar permissões', TRUE, NOW(), NOW()),
  ('permissions.update', 'permissions.update', 'Permite editar permissões', TRUE, NOW(), NOW()),
  ('permissions.delete', 'permissions.delete', 'Permite excluir permissões', TRUE, NOW(), NOW()),
  ('profiles.create', 'profiles.create', 'Permite cadastrar perfis', TRUE, NOW(), NOW()),
  ('profiles.read', 'profiles.read', 'Permite visualizar perfis', TRUE, NOW(), NOW()),
  ('profiles.update', 'profiles.update', 'Permite editar perfis', TRUE, NOW(), NOW()),
  ('profiles.delete', 'profiles.delete', 'Permite excluir perfis', TRUE, NOW(), NOW())
ON CONFLICT ((LOWER(code))) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = TRUE,
  updated = NOW();

DO $$
DECLARE
  admin_profile_id UUID;
  admin_user_id UUID;
BEGIN
  INSERT INTO profiles (name, description, active, created, updated)
  VALUES (
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
  WHERE LOWER(user_record.login) IN (LOWER('admin'), LOWER('admi'))
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
