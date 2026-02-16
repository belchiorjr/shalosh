INSERT INTO permissions (code, name, description, active, created, updated)
VALUES
  ('clients.create', 'clients.create', 'Permite cadastrar clientes', TRUE, NOW(), NOW()),
  ('clients.read', 'clients.read', 'Permite visualizar clientes', TRUE, NOW(), NOW()),
  ('clients.update', 'clients.update', 'Permite editar clientes', TRUE, NOW(), NOW()),
  ('clients.delete', 'clients.delete', 'Permite desativar clientes', TRUE, NOW(), NOW()),
  ('client_addresses.create', 'client_addresses.create', 'Permite cadastrar endereços de clientes', TRUE, NOW(), NOW()),
  ('client_addresses.read', 'client_addresses.read', 'Permite visualizar endereços de clientes', TRUE, NOW(), NOW()),
  ('client_addresses.update', 'client_addresses.update', 'Permite editar endereços de clientes', TRUE, NOW(), NOW()),
  ('client_addresses.delete', 'client_addresses.delete', 'Permite excluir endereços de clientes', TRUE, NOW(), NOW()),
  ('client_phones.create', 'client_phones.create', 'Permite cadastrar telefones de clientes', TRUE, NOW(), NOW()),
  ('client_phones.read', 'client_phones.read', 'Permite visualizar telefones de clientes', TRUE, NOW(), NOW()),
  ('client_phones.update', 'client_phones.update', 'Permite editar telefones de clientes', TRUE, NOW(), NOW()),
  ('client_phones.delete', 'client_phones.delete', 'Permite excluir telefones de clientes', TRUE, NOW(), NOW()),
  ('clients.password.update', 'clients.password.update', 'Permite alterar a senha de acesso do cliente', TRUE, NOW(), NOW())
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
