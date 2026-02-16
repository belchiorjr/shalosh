CREATE TABLE IF NOT EXISTS project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_categories_code_lower_key
  ON project_categories ((LOWER(code)));

CREATE UNIQUE INDEX IF NOT EXISTS project_categories_name_lower_key
  ON project_categories ((LOWER(name)));

CREATE TABLE IF NOT EXISTS project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_types_code_lower_key
  ON project_types ((LOWER(code)));

CREATE UNIQUE INDEX IF NOT EXISTS project_types_category_name_lower_key
  ON project_types (category_id, LOWER(name));

CREATE INDEX IF NOT EXISTS project_types_category_id_idx
  ON project_types (category_id);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  project_type_id UUID REFERENCES project_types(id) ON DELETE SET NULL,
  lifecycle_type TEXT NOT NULL DEFAULT 'temporario',
  has_monthly_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_lifecycle_type_check CHECK (
    lifecycle_type IN ('temporario', 'recorrente')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS projects_name_lower_key
  ON projects ((LOWER(name)));

CREATE TABLE IF NOT EXISTS project_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, client_id)
);

CREATE INDEX IF NOT EXISTS project_clients_project_id_idx
  ON project_clients (project_id);

CREATE INDEX IF NOT EXISTS project_clients_client_id_idx
  ON project_clients (client_id);

CREATE TABLE IF NOT EXISTS project_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_on DATE,
  received_on DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_revenues_status_check CHECK (
    status IN ('pendente', 'recebido', 'cancelado')
  )
);

CREATE INDEX IF NOT EXISTS project_revenues_project_id_idx
  ON project_revenues (project_id);

CREATE TABLE IF NOT EXISTS project_revenue_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_revenue_id UUID NOT NULL REFERENCES project_revenues(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  issued_on DATE,
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_revenue_receipts_revenue_id_idx
  ON project_revenue_receipts (project_revenue_id);

CREATE TABLE IF NOT EXISTS project_monthly_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_day SMALLINT NOT NULL DEFAULT 1,
  starts_on DATE,
  ends_on DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_monthly_charges_due_day_check CHECK (due_day BETWEEN 1 AND 31)
);

CREATE INDEX IF NOT EXISTS project_monthly_charges_project_id_idx
  ON project_monthly_charges (project_id);

CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  starts_on DATE,
  ends_on DATE,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_phases_project_id_idx
  ON project_phases (project_id);

CREATE TABLE IF NOT EXISTS project_phase_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_phase_files_phase_id_idx
  ON project_phase_files (project_phase_id);

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  starts_on DATE,
  ends_on DATE,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_tasks_status_check CHECK (
    status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')
  )
);

CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx
  ON project_tasks (project_id);

CREATE INDEX IF NOT EXISTS project_tasks_phase_id_idx
  ON project_tasks (project_phase_id);

CREATE TABLE IF NOT EXISTS project_task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_task_files_task_id_idx
  ON project_task_files (project_task_id);

INSERT INTO project_categories (code, name, description, active, created, updated)
VALUES
  ('site', 'Sites', 'Projetos de sites institucionais e landing pages', TRUE, NOW(), NOW()),
  ('webpage', 'Webpages', 'Projetos de páginas web e campanhas digitais', TRUE, NOW(), NOW()),
  ('sistema', 'Sistemas', 'Projetos de sistemas e aplicações internas/externas', TRUE, NOW(), NOW()),
  ('manutencao', 'Manutenções', 'Projetos de manutenção recorrente e suporte', TRUE, NOW(), NOW())
ON CONFLICT ((LOWER(code))) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = TRUE,
  updated = NOW();

INSERT INTO project_types (category_id, code, name, description, active, created, updated)
SELECT category_record.id, project_type_record.code, project_type_record.name, project_type_record.description, TRUE, NOW(), NOW()
FROM (
  VALUES
    ('site', 'site-institucional', 'Site Institucional', 'Criação de site institucional completo'),
    ('webpage', 'landing-page', 'Landing Page', 'Criação de landing page para campanhas'),
    ('sistema', 'sistema-web', 'Sistema Web', 'Desenvolvimento de sistema web sob medida'),
    ('manutencao', 'manutencao-mensal', 'Manutenção Mensal', 'Pacote de manutenção recorrente mensal')
) AS project_type_record(category_code, code, name, description)
INNER JOIN project_categories category_record
  ON LOWER(category_record.code) = LOWER(project_type_record.category_code)
ON CONFLICT ((LOWER(code))) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = TRUE,
  updated = NOW();
