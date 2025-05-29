import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon Serverless
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Run the migration
async function main() {
  console.log('Connecting to the database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Pushing schema to database...');
  
  try {
    // This will create all the tables and indexes
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }

  await pool.end();
}

main();