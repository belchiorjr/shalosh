CREATE TABLE IF NOT EXISTS profile_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, permission_id)
);

CREATE INDEX IF NOT EXISTS profile_permissions_permission_id_idx
  ON profile_permissions (permission_id);
