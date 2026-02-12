INSERT INTO users (id, name, email, login, senha, ativo, created, updated)
VALUES (
  'admin',
  'administrador',
  'admin@shalosh.local',
  'admi',
  'Admin@123',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (login) DO NOTHING;
