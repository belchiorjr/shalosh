ALTER TABLE project_monthly_charges
  ADD COLUMN IF NOT EXISTS installment TEXT NOT NULL DEFAULT '';
