import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
require("dotenv").config();
import * as schema from './schema';




const migrateDB = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('🔄 Migration started...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Allow both direct execution and import
if (require.main === module) {
  migrateDB().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

export { migrateDB };