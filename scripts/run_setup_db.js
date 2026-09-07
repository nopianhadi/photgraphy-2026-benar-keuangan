import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

async function runSql() {
    // Using the pooler connection string which likely has an IPv4 address
    const client = new Client({
        connectionString: process.env.VITE_SUPABASE_URL || 'postgresql://postgres.gpqlyqktdujyqbnyxhmf:Gedangburuk22@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database via pooler...');

        const schemaPath = path.join(process.cwd(), 'database', '01_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing SQL from 01_schema.sql...');
        await client.query(schemaSql);
        console.log('01_schema.sql executed successfully.');

        const seedPath = path.join(process.cwd(), 'database', '02_seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Executing SQL from 02_seed.sql...');
        await client.query(seedSql);
        console.log('02_seed.sql executed successfully.');

    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

runSql();
