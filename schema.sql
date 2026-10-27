-- The database tables. Safe to run more than once: IF NOT EXISTS skips
-- anything that is already there. Run it with: npm run build

CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username      text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guestbook (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    msg        text NOT NULL,
    -- If an account is deleted, its messages stay but lose their author
    author_id  uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);

-- The guestbook is always read newest-last, so keep it sorted
CREATE INDEX IF NOT EXISTS guestbook_created_at_idx ON guestbook (created_at);

-- Login sessions, so logins survive restarts and deploys.
-- connect-pg-simple reads and writes this table and deletes expired rows.
CREATE TABLE IF NOT EXISTS session (
    sid    varchar PRIMARY KEY,
    sess   json NOT NULL,
    expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS session_expire_idx ON session (expire);
