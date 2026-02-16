INSERT INTO permissions (code, name, description, active, created, updated)
VALUES
  ('project_categories.read', 'project_categories.read', 'Permite visualizar categorias de projeto', TRUE, NOW(), NOW()),
  ('project_types.create', 'project_types.create', 'Permite cadastrar tipos de projeto', TRUE, NOW(), NOW()),
  ('project_types.read', 'project_types.read', 'Permite visualizar tipos de projeto', TRUE, NOW(), NOW()),
  ('project_types.update', 'project_types.update', 'Permite editar tipos de projeto', TRUE, NOW(), NOW()),
  ('projects.create', 'projects.create', 'Permite cadastrar projetos', TRUE, NOW(), NOW()),
  ('projects.read', 'projects.read', 'Permite visualizar projetos', TRUE, NOW(), NOW()),
  ('projects.update', 'projects.update', 'Permite editar projetos', TRUE, NOW(), NOW()),
  ('projects.delete', 'projects.delete', 'Permite desativar projetos', TRUE, NOW(), NOW()),
  ('project_revenues.create', 'project_revenues.create', 'Permite cadastrar receitas de projetos', TRUE, NOW(), NOW()),
  ('project_revenues.read', 'project_revenues.read', 'Permite visualizar receitas de projetos', TRUE, NOW(), NOW()),
  ('project_revenues.update', 'project_revenues.update', 'Permite editar receitas de projetos', TRUE, NOW(), NOW()),
  ('project_monthly_charges.create', 'project_monthly_charges.create', 'Permite cadastrar cobranças mensais dos projetos', TRUE, NOW(), NOW()),
  ('project_monthly_charges.read', 'project_monthly_charges.read', 'Permite visualizar cobranças mensais dos projetos', TRUE, NOW(), NOW()),
  ('project_monthly_charges.update', 'project_monthly_charges.update', 'Permite editar cobranças mensais dos projetos', TRUE, NOW(), NOW()),
  ('project_phases.create', 'project_phases.create', 'Permite cadastrar fases de projetos', TRUE, NOW(), NOW()),
  ('project_phases.read', 'project_phases.read', 'Permite visualizar fases de projetos', TRUE, NOW(), NOW()),
  ('project_phases.update', 'project_phases.update', 'Permite editar fases de projetos', TRUE, NOW(), NOW()),
  ('project_tasks.create', 'project_tasks.create', 'Permite cadastrar tarefas de projetos', TRUE, NOW(), NOW()),
  ('project_tasks.read', 'project_tasks.read', 'Permite visualizar tarefas de projetos', TRUE, NOW(), NOW()),
  ('project_tasks.update', 'project_tasks.update', 'Permite editar tarefas de projetos', TRUE, NOW(), NOW())
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
