import { pool, db } from "../server/db";
import { sql } from "drizzle-orm";

(async () => {
  try {
    console.log("Checking if role column exists...");
    
    // Check if column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding role column to users table...");
      
      // Add the role column with default value 'user'
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
      `);
      
      console.log("Role column added successfully.");
      
      // Update first user to be admin
      console.log("Setting first user as admin...");
      await db.execute(sql`
        UPDATE users 
        SET role = 'admin' 
        WHERE id = (SELECT MIN(id) FROM users)
      `);
      
      console.log("First user updated to admin role.");
    } else {
      console.log("Role column already exists.");
    }
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await pool.end();
  }
})();