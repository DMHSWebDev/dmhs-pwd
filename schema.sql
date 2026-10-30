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

-- Shop orders for the Storefront example. A row is made "pending" when a
-- visitor starts checkout, and only becomes "paid" once Stripe confirms it.
-- Prices are saved in cents (whole numbers), so there are no rounding errors.
CREATE TABLE IF NOT EXISTS orders (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id text NOT NULL UNIQUE,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
    total_cents       integer NOT NULL CHECK (total_cents >= 0),
    email             text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    paid_at           timestamptz
);

-- What was in each order, with the name and price at the time of purchase,
-- so later price changes in the CMS don't rewrite old orders
CREATE TABLE IF NOT EXISTS order_items (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id  text NOT NULL,
    name        text NOT NULL,
    unit_cents  integer NOT NULL CHECK (unit_cents >= 0),
    quantity    integer NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- Shipping, added after the orders table already existed. ADD COLUMN IF NOT
-- EXISTS adds these to the live table once, and skips them after that.
-- total_cents (above) is the items only; the customer paid total + shipping.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cents   integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- Inventory: true when this item's stock was held in Sanity at checkout,
-- so we know to give it back if the checkout expires unpaid
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS held boolean NOT NULL DEFAULT false;
