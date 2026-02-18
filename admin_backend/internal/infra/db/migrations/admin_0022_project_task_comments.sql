CREATE TABLE IF NOT EXISTS project_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES project_task_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_task_comments_task_id_idx
  ON project_task_comments (project_task_id);

CREATE INDEX IF NOT EXISTS project_task_comments_parent_comment_id_idx
  ON project_task_comments (parent_comment_id);

CREATE TABLE IF NOT EXISTS project_task_comment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_task_comment_id UUID NOT NULL REFERENCES project_task_comments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_task_comment_files_comment_id_idx
  ON project_task_comment_files (project_task_comment_id);
