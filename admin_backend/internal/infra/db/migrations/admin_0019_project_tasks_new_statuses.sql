ALTER TABLE project_tasks
  DROP CONSTRAINT IF EXISTS project_tasks_status_check;

UPDATE project_tasks
SET status = 'planejada'
WHERE status = 'pendente';

UPDATE project_tasks
SET status = 'iniciada'
WHERE status = 'em_andamento';

ALTER TABLE project_tasks
  ALTER COLUMN status SET DEFAULT 'planejada';

ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_status_check CHECK (
    status IN ('planejada', 'iniciada', 'concluida', 'cancelada')
  );
