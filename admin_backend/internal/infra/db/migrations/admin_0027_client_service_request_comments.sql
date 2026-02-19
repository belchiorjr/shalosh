CREATE TABLE IF NOT EXISTS client_service_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES client_service_requests(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES client_service_request_comments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  comment TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_service_request_comments_author_check CHECK (
    user_id IS NOT NULL OR client_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS client_service_request_comments_request_id_idx
  ON client_service_request_comments (service_request_id);

CREATE INDEX IF NOT EXISTS client_service_request_comments_parent_id_idx
  ON client_service_request_comments (parent_comment_id);

CREATE INDEX IF NOT EXISTS client_service_request_comments_user_id_idx
  ON client_service_request_comments (user_id);

CREATE INDEX IF NOT EXISTS client_service_request_comments_client_id_idx
  ON client_service_request_comments (client_id);

CREATE TABLE IF NOT EXISTS client_service_request_comment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_comment_id UUID NOT NULL REFERENCES client_service_request_comments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_service_request_comment_files_comment_id_idx
  ON client_service_request_comment_files (service_request_comment_id);
