import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';
import path from 'path';

async function main() {
  console.log('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
