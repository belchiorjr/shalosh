CREATE TABLE IF NOT EXISTS project_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_managers_project_id_idx
  ON project_managers (project_id);

CREATE INDEX IF NOT EXISTS project_managers_user_id_idx
  ON project_managers (user_id);

ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_tasks_responsible_user_id_idx
  ON project_tasks (responsible_user_id);

ALTER TABLE project_task_comments
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_task_comments_client_id_idx
  ON project_task_comments (client_id);
