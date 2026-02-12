UPDATE users
SET login = CASE
  WHEN TRIM(login) = '' THEN 'user_' || id
  ELSE LOWER(TRIM(login))
END;

WITH ranked AS (
  SELECT
    id,
    login,
    ROW_NUMBER() OVER (PARTITION BY LOWER(login) ORDER BY created, id) AS row_number
  FROM users
),
duplicates AS (
  SELECT id, LOWER(login) AS normalized_login
  FROM ranked
  WHERE row_number > 1
)
UPDATE users u
SET login = d.normalized_login || '_' || u.id
FROM duplicates d
WHERE u.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS users_login_lower_key ON users ((LOWER(login)));
