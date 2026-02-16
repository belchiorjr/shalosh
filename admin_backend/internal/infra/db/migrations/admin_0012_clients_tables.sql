CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_email_lower_key
  ON clients ((LOWER(email)));

CREATE UNIQUE INDEX IF NOT EXISTS clients_login_lower_key
  ON clients ((LOWER(login)));

CREATE TABLE IF NOT EXISTS client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Brasil',
  zipcode TEXT NOT NULL DEFAULT '',
  street_type TEXT NOT NULL DEFAULT '',
  street_name TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  number TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  complement TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_addresses_street_type_check CHECK (
    street_type IN ('', 'rua', 'avenida', 'travessa', 'alameda', 'rodovia', 'outro')
  )
);

CREATE INDEX IF NOT EXISTS client_addresses_client_id_idx
  ON client_addresses (client_id);

CREATE TABLE IF NOT EXISTS client_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL,
  is_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_phones_client_id_idx
  ON client_phones (client_id);
