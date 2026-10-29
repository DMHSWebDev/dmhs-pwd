// db.js - the ONLY file that knows how our data is stored
// Data lives in Postgres on Neon. The tables are in schema.sql.
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env (or in Render\'s Environment settings)');
    process.exit(1);
}

// One pool for the whole app. It keeps a few connections open and
// shares them between requests, instead of connecting every time.
// DATABASE_URL is Neon's pooled address, the right one for a web server.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MAX_ENTRIES = 50;

// Postgres uses snake_case column names; the rest of the app expects
// camelCase. "AS" renames each column on the way out.
const USER_COLUMNS = `id, username, password_hash AS "passwordHash", role, created_at AS "createdAt"`;
const ENTRY_COLUMNS = `id, name, msg, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"`;
const ORDER_COLUMNS = `id, stripe_session_id AS "sessionId", status, total_cents AS "totalCents", created_at AS "createdAt", paid_at AS "paidAt",
    shipping_cents AS "shippingCents", shipping_method AS "shippingMethod", shipping_name AS "shippingName", shipping_address AS "shippingAddress"`;

// ----- Private helpers (not exported) -----

// Postgres rejects a badly shaped id with an error. Anyone can type
// /api/guestbook/banana, so check the shape first and treat it as "not found".
function isUuid(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ----- Public functions (exported) -----
// $1, $2... are placeholders. pg sends the values separately from the SQL,
// so nothing a user types can change the query (no SQL injection).

async function getUserByUsername(username) {
    const { rows } = await pool.query(
        `SELECT ${USER_COLUMNS} FROM users WHERE username = $1`,
        [username.toLowerCase()]
    );
    return rows[0] || null;
}

// Takes a passwordHash, never a password
async function addUser({ username, passwordHash, role = 'user' }) {
    const { rows } = await pool.query(
        `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)
         RETURNING ${USER_COLUMNS}`,
        [username.toLowerCase(), passwordHash, role]
    );
    return rows[0];
}

// Also takes a passwordHash, never a password
async function updateUserPassword(id, passwordHash) {
    await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [id, passwordHash]);
}

async function getAllEntries() {
    const { rows } = await pool.query(`SELECT ${ENTRY_COLUMNS} FROM guestbook ORDER BY created_at`);
    return rows;
}

async function getEntryById(id) {
    if (!isUuid(id)) return null;
    const { rows } = await pool.query(`SELECT ${ENTRY_COLUMNS} FROM guestbook WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function addEntry({ name, msg, authorId }) {
    const { rows } = await pool.query(
        `INSERT INTO guestbook (name, msg, author_id) VALUES ($1, $2, $3)
         RETURNING ${ENTRY_COLUMNS}`,
        [name, msg, authorId]
    );
    // Keep only the newest MAX_ENTRIES, like the JSON version did
    await pool.query(
        `DELETE FROM guestbook WHERE id NOT IN
         (SELECT id FROM guestbook ORDER BY created_at DESC LIMIT $1)`,
        [MAX_ENTRIES]
    );
    return rows[0];
}

async function updateEntry(id, { name, msg }) {
    if (!isUuid(id)) return null;
    const { rows } = await pool.query(
        `UPDATE guestbook SET name = $2, msg = $3, updated_at = now() WHERE id = $1
         RETURNING ${ENTRY_COLUMNS}`,
        [id, name, msg]
    );
    return rows[0] || null;
}

async function deleteEntry(id) {
    if (!isUuid(id)) return false;
    const { rowCount } = await pool.query(`DELETE FROM guestbook WHERE id = $1`, [id]);
    return rowCount > 0; // false if nothing matched
}

// ----- Shop orders -----

// Saves a new "pending" order and its items together. The transaction
// (BEGIN ... COMMIT) means we never end up with an order missing its items.
async function addOrder({ sessionId, totalCents, items }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO orders (stripe_session_id, total_cents) VALUES ($1, $2) RETURNING id`,
            [sessionId, totalCents]
        );
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, name, unit_cents, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [rows[0].id, item.productId, item.name, item.unitCents, item.quantity]
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release(); // give the connection back to the pool
    }
}

async function getOrderBySessionId(sessionId) {
    const { rows } = await pool.query(
        `SELECT ${ORDER_COLUMNS} FROM orders WHERE stripe_session_id = $1`,
        [sessionId]
    );
    if (!rows[0]) return null;
    const items = await pool.query(
        `SELECT name, unit_cents AS "unitCents", quantity FROM order_items WHERE order_id = $1 ORDER BY name`,
        [rows[0].id]
    );
    return { ...rows[0], items: items.rows };
}

// Only a pending order can become paid or expired, so a late or repeated
// message from Stripe can't change an order that is already settled
async function markOrderPaid(sessionId, { email, shippingCents, shippingMethod, shippingName, shippingAddress }) {
    await pool.query(
        `UPDATE orders SET status = 'paid', paid_at = now(), email = $2,
             shipping_cents = $3, shipping_method = $4, shipping_name = $5, shipping_address = $6
         WHERE stripe_session_id = $1 AND status = 'pending'`,
        [sessionId, email || null, shippingCents ?? null, shippingMethod || null, shippingName || null, shippingAddress || null]
    );
}

async function markOrderExpired(sessionId) {
    await pool.query(
        `UPDATE orders SET status = 'expired' WHERE stripe_session_id = $1 AND status = 'pending'`,
        [sessionId]
    );
}

module.exports = {
    addOrder, getOrderBySessionId, markOrderPaid, markOrderExpired,
    getAllEntries, getEntryById, addEntry, updateEntry, deleteEntry,
    getUserByUsername, addUser, updateUserPassword,
    pool // shared with the session store in server.js
};
