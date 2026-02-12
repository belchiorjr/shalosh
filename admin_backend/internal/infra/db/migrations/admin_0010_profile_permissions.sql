CREATE TABLE IF NOT EXISTS profile_permissions (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, permission_id)
);

CREATE INDEX IF NOT EXISTS profile_permissions_permission_id_idx
  ON profile_permissions (permission_id);
