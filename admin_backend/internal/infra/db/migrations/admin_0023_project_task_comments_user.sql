ALTER TABLE project_task_comments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_task_comments_user_id_idx
  ON project_task_comments (user_id);
