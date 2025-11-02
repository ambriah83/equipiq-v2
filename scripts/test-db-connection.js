/**
 * Test Postgres Connection
 */
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('Testing database connection...');
console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('\nConnecting...');
    await client.connect();
    console.log('✓ Connected successfully!');

    console.log('\nTesting query...');
    const result = await client.query('SELECT NOW()');
    console.log('✓ Query successful:', result.rows[0].now);

    console.log('\nChecking equipment_types table...');
    const etResult = await client.query('SELECT COUNT(*) FROM equipment_types');
    console.log(`✓ Found ${etResult.rows[0].count} equipment types`);

    console.log('\nChecking knowledge_chunks table...');
    const kcResult = await client.query('SELECT COUNT(*) FROM knowledge_chunks');
    console.log(`✓ Found ${kcResult.rows[0].count} knowledge chunks`);

    await client.end();
    console.log('\n✓ Connection test complete!');
  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

testConnection();
