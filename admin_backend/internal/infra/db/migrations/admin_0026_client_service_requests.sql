CREATE TABLE IF NOT EXISTS client_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'aberta',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_service_requests_status_check CHECK (
    status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')
  )
);

CREATE INDEX IF NOT EXISTS client_service_requests_client_id_idx
  ON client_service_requests (client_id);

CREATE INDEX IF NOT EXISTS client_service_requests_project_id_idx
  ON client_service_requests (project_id);

CREATE INDEX IF NOT EXISTS client_service_requests_status_idx
  ON client_service_requests (status);

CREATE TABLE IF NOT EXISTS client_service_request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES client_service_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_service_request_files_request_id_idx
  ON client_service_request_files (service_request_id);
