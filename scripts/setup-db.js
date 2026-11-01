// Creates the tables in schema.sql. Run with: npm run build
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

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        await client.query(fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8'));
        console.log('Database tables are ready');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
});
