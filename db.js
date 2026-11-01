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

// Postgres uses snake_case column names; the rest of the app expects
// camelCase. "AS" renames each column on the way out.
const ORDER_COLUMNS = `id, stripe_session_id AS "sessionId", status, total_cents AS "totalCents", created_at AS "createdAt", paid_at AS "paidAt",
    shipping_cents AS "shippingCents", shipping_method AS "shippingMethod", shipping_name AS "shippingName", shipping_address AS "shippingAddress"`;

// ----- Public functions (exported) -----
// $1, $2... are placeholders. pg sends the values separately from the SQL,
// so nothing a user types can change the query (no SQL injection).

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
                `INSERT INTO order_items (order_id, product_id, name, unit_cents, quantity, held)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [rows[0].id, item.productId, item.name, item.unitCents, item.quantity, Boolean(item.held)]
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

// Marks a pending order expired and hands its held items to giveBack(items),
// which returns them to stock. Both happen in one transaction: if giving the
// stock back fails, the order stays pending so Stripe's retry can try again.
// A repeated message finds the order already expired and gives nothing back.
async function expireOrder(sessionId, giveBack) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `UPDATE orders SET status = 'expired' WHERE stripe_session_id = $1 AND status = 'pending'
             RETURNING id`,
            [sessionId]
        );
        if (rows[0]) {
            const items = await client.query(
                `SELECT product_id AS "productId", quantity FROM order_items WHERE order_id = $1 AND held`,
                [rows[0].id]
            );
            if (items.rows.length > 0) await giveBack(items.rows);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    addOrder, getOrderBySessionId, markOrderPaid, expireOrder,
    pool // shared with the session store in server.js
};
