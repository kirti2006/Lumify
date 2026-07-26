import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/database/client.js';

async function run() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}
run();
