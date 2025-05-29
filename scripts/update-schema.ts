import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function updateSchema() {
  console.log('Starting database schema update...');

  try {
    // Add OAuth fields to users table if they don't exist
    console.log('Adding OAuth fields to users table...');
    
    // Check if provider column exists
    const providerColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'provider'
    `);
    
    if (providerColumnCheck.rows.length === 0) {
      console.log('Adding provider column...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local'
      `);
    }
    
    // Check if provider_id column exists
    const providerIdColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'provider_id'
    `);
    
    if (providerIdColumnCheck.rows.length === 0) {
      console.log('Adding provider_id column...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider_id TEXT
      `);
    }
    
    // Check if provider_data column exists
    const providerDataColumnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'provider_data'
    `);
    
    if (providerDataColumnCheck.rows.length === 0) {
      console.log('Adding provider_data column...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider_data JSONB
      `);
    }
    
    // Make password column nullable
    console.log('Updating password column to be nullable...');
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN password DROP NOT NULL
    `);
    
    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

updateSchema();