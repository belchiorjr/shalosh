DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id
    INTO target_user_id
  FROM users
  WHERE LOWER(login) = LOWER('admin')
  LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    UPDATE users
    SET name = 'administrador',
        senha = 'Admin@123',
        ativo = TRUE,
        updated = NOW()
    WHERE id = target_user_id;
    RETURN;
  END IF;

  SELECT id
    INTO target_user_id
  FROM users
  WHERE LOWER(login) = LOWER('admi')
  ORDER BY created, id
  LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    UPDATE users
    SET name = 'administrador',
        login = 'admin',
        senha = 'Admin@123',
        ativo = TRUE,
        updated = NOW()
    WHERE id = target_user_id;
    RETURN;
  END IF;

  INSERT INTO users (name, email, login, senha, ativo, created, updated)
  VALUES (
    'administrador',
    'admin@shalosh.local',
    'admin',
    'Admin@123',
    TRUE,
    NOW(),
    NOW()
  );
END $$;
