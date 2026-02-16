ALTER TABLE client_addresses
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS street_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS street_name TEXT NOT NULL DEFAULT '';

UPDATE client_addresses
SET
  country = COALESCE(NULLIF(TRIM(country), ''), 'Brasil'),
  street_type = CASE
    WHEN LOWER(TRIM(street)) LIKE 'rua %' THEN 'rua'
    WHEN LOWER(TRIM(street)) LIKE 'av %'
      OR LOWER(TRIM(street)) LIKE 'av.%'
      OR LOWER(TRIM(street)) LIKE 'avenida %' THEN 'avenida'
    WHEN LOWER(TRIM(street)) LIKE 'trav %'
      OR LOWER(TRIM(street)) LIKE 'trav.%'
      OR LOWER(TRIM(street)) LIKE 'tv %'
      OR LOWER(TRIM(street)) LIKE 'tv.%'
      OR LOWER(TRIM(street)) LIKE 'travessa %' THEN 'travessa'
    WHEN LOWER(TRIM(street)) LIKE 'al %'
      OR LOWER(TRIM(street)) LIKE 'al.%'
      OR LOWER(TRIM(street)) LIKE 'alameda %' THEN 'alameda'
    WHEN LOWER(TRIM(street)) LIKE 'rod %'
      OR LOWER(TRIM(street)) LIKE 'rod.%'
      OR LOWER(TRIM(street)) LIKE 'rodovia %' THEN 'rodovia'
    ELSE COALESCE(NULLIF(TRIM(street_type), ''), '')
  END
WHERE COALESCE(NULLIF(TRIM(street_type), ''), '') = '';

UPDATE client_addresses
SET street_name = CASE
  WHEN LOWER(TRIM(street)) LIKE 'rua %' THEN TRIM(SUBSTRING(street FROM 5))
  WHEN LOWER(TRIM(street)) LIKE 'avenida %' THEN TRIM(SUBSTRING(street FROM 9))
  WHEN LOWER(TRIM(street)) LIKE 'av. %' THEN TRIM(SUBSTRING(street FROM 5))
  WHEN LOWER(TRIM(street)) LIKE 'av %' THEN TRIM(SUBSTRING(street FROM 4))
  WHEN LOWER(TRIM(street)) LIKE 'travessa %' THEN TRIM(SUBSTRING(street FROM 10))
  WHEN LOWER(TRIM(street)) LIKE 'trav. %' THEN TRIM(SUBSTRING(street FROM 7))
  WHEN LOWER(TRIM(street)) LIKE 'trav %' THEN TRIM(SUBSTRING(street FROM 6))
  WHEN LOWER(TRIM(street)) LIKE 'tv. %' THEN TRIM(SUBSTRING(street FROM 5))
  WHEN LOWER(TRIM(street)) LIKE 'tv %' THEN TRIM(SUBSTRING(street FROM 4))
  WHEN LOWER(TRIM(street)) LIKE 'alameda %' THEN TRIM(SUBSTRING(street FROM 9))
  WHEN LOWER(TRIM(street)) LIKE 'al. %' THEN TRIM(SUBSTRING(street FROM 5))
  WHEN LOWER(TRIM(street)) LIKE 'al %' THEN TRIM(SUBSTRING(street FROM 4))
  WHEN LOWER(TRIM(street)) LIKE 'rodovia %' THEN TRIM(SUBSTRING(street FROM 9))
  WHEN LOWER(TRIM(street)) LIKE 'rod. %' THEN TRIM(SUBSTRING(street FROM 6))
  WHEN LOWER(TRIM(street)) LIKE 'rod %' THEN TRIM(SUBSTRING(street FROM 5))
  ELSE TRIM(street)
END
WHERE COALESCE(NULLIF(TRIM(street_name), ''), '') = '';

UPDATE client_addresses
SET street = CASE
  WHEN street_name = '' THEN street
  WHEN street_type = 'rua' THEN 'Rua ' || street_name
  WHEN street_type = 'avenida' THEN 'Avenida ' || street_name
  WHEN street_type = 'travessa' THEN 'Travessa ' || street_name
  WHEN street_type = 'alameda' THEN 'Alameda ' || street_name
  WHEN street_type = 'rodovia' THEN 'Rodovia ' || street_name
  ELSE street_name
END
WHERE COALESCE(NULLIF(TRIM(street), ''), '') = ''
  OR COALESCE(NULLIF(TRIM(street_name), ''), '') <> '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_addresses_street_type_check'
      AND conrelid = 'client_addresses'::regclass
  ) THEN
    ALTER TABLE client_addresses DROP CONSTRAINT client_addresses_street_type_check;
  END IF;
END $$;

ALTER TABLE client_addresses
  ADD CONSTRAINT client_addresses_street_type_check CHECK (
    street_type IN ('', 'rua', 'avenida', 'travessa', 'alameda', 'rodovia', 'outro')
  );

CREATE INDEX IF NOT EXISTS client_addresses_location_idx
  ON client_addresses (state, city, neighborhood);
