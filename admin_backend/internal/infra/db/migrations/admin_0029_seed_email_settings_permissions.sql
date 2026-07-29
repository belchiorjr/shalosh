INSERT INTO permissions (code, name, description, active, created, updated)
VALUES
  ('email_settings.read', 'email_settings.read', 'Permite visualizar a configuração de e-mail', TRUE, NOW(), NOW()),
  ('email_settings.update', 'email_settings.update', 'Permite editar a configuração de e-mail', TRUE, NOW(), NOW())
ON CONFLICT ((LOWER(code))) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = TRUE,
  updated = NOW();

DO $$
DECLARE
  admin_profile_id UUID;
BEGIN
  SELECT profile.id
    INTO admin_profile_id
  FROM profiles profile
  WHERE LOWER(profile.name) = LOWER('Administrator')
  LIMIT 1;

  IF admin_profile_id IS NOT NULL THEN
    INSERT INTO profile_permissions (profile_id, permission_id, created)
    SELECT admin_profile_id, permission.id, NOW()
    FROM permissions permission
    WHERE permission.code IN ('email_settings.read', 'email_settings.update')
    ON CONFLICT (profile_id, permission_id) DO NOTHING;
  END IF;
END $$;
