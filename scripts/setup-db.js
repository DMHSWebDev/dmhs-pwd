// Creates the tables in schema.sql. Run with: npm run build
// Add --import to also copy users.json and guestbook.json into the database
// (one time, when moving off the JSON files). Rows already there are skipped.
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');

// Schema changes use the direct (unpooled) address, as Neon recommends
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
    console.error('Missing DATABASE_URL in .env (or in Render\'s Environment settings)');
    process.exit(1);
}

function readJson(file) {
    const full = path.join(ROOT, file);
    return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : [];
}

async function importJson(client) {
    const users = readJson('users.json');
    for (const u of users) {
        await client.query(
            `INSERT INTO users (id, username, password_hash, role, created_at)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [u.id, u.username, u.passwordHash, u.role || 'user', u.createdAt]
        );
    }

    const entries = readJson('guestbook.json');
    for (const e of entries) {
        await client.query(
            `INSERT INTO guestbook (id, name, msg, author_id, created_at, updated_at)
             VALUES ($1, $2, $3, (SELECT id FROM users WHERE id = $4), $5, $6)
             ON CONFLICT DO NOTHING`,
            [e.id, e.name, e.msg, e.authorId || null, e.createdAt, e.updatedAt || null]
        );
    }
    console.log(`Imported ${users.length} users and ${entries.length} guestbook entries (duplicates skipped)`);
}

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        await client.query(fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8'));
        console.log('Database tables are ready');
        if (process.argv.includes('--import')) await importJson(client);
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
});
