ALTER TABLE project_monthly_charges
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';

UPDATE project_monthly_charges
SET status = CASE
  WHEN LOWER(TRIM(status)) IN ('pago', 'recebido') THEN 'pago'
  WHEN LOWER(TRIM(status)) IN ('cancelada', 'cancelado') THEN 'cancelada'
  WHEN active = FALSE THEN 'cancelada'
  ELSE 'pendente'
END;

ALTER TABLE project_monthly_charges
  DROP CONSTRAINT IF EXISTS project_monthly_charges_status_check;

ALTER TABLE project_monthly_charges
  ADD CONSTRAINT project_monthly_charges_status_check CHECK (
    status IN ('pendente', 'pago', 'cancelada')
  );
