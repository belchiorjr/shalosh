ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planejamento';

UPDATE projects project
SET status = CASE
  WHEN LOWER(TRIM(project.status)) IN ('planejamento', 'andamento', 'concluido', 'cancelado')
    THEN LOWER(TRIM(project.status))
  WHEN project.active = FALSE
    THEN 'cancelado'
  WHEN COALESCE(task_stats.total_non_cancelled, 0) > 0
    AND COALESCE(task_stats.total_non_cancelled, 0) = COALESCE(task_stats.total_completed, 0)
    THEN 'concluido'
  WHEN COALESCE(task_stats.total_started, 0) > 0
    OR COALESCE(task_stats.total_completed, 0) > 0
    THEN 'andamento'
  ELSE 'planejamento'
END
FROM (
  SELECT
    task.project_id,
    COUNT(*) FILTER (WHERE task.status <> 'cancelada') AS total_non_cancelled,
    COUNT(*) FILTER (WHERE task.status IN ('iniciada', 'concluida')) AS total_started,
    COUNT(*) FILTER (WHERE task.status = 'concluida') AS total_completed
  FROM project_tasks task
  GROUP BY task.project_id
) AS task_stats
WHERE task_stats.project_id = project.id;

UPDATE projects
SET status = CASE
  WHEN active = FALSE THEN 'cancelado'
  ELSE 'planejamento'
END
WHERE LOWER(TRIM(status)) NOT IN ('planejamento', 'andamento', 'concluido', 'cancelado');

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check CHECK (
    status IN ('planejamento', 'andamento', 'concluido', 'cancelado')
  );

CREATE INDEX IF NOT EXISTS projects_status_idx
  ON projects (status);
