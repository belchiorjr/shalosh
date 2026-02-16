INSERT INTO users (name, email, login, senha, ativo, created, updated)
VALUES (
  'administrador',
  'admin@shalosh.local',
  'admi',
  'Admin@123',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (login) DO NOTHING;
