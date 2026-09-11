import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import { INITIAL_SPECIALITIES } from './initialSpecialities';

declare global {
  var _sqliteDb: Database.Database | undefined;
}

const dbPath = process.env.DATABASE_URL || 'sqlite.db';
const resolvedPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

// Automatically create parent directory if it does not exist (e.g. /app/data on Railway)
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function getSqliteInstance() {
  if (globalThis._sqliteDb) {
    return globalThis._sqliteDb;
  }

  const sqlite = new Database(resolvedPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 10000');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');

  // Ensure all database tables exist automatically
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      goc_number TEXT NOT NULL,
      subscribe_updates INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS specialities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'service',
      group_name TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'approved'
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      slug TEXT NOT NULL UNIQUE,
      practice_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      goc_number TEXT NOT NULL,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city TEXT NOT NULL,
      postcode TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      website TEXT,
      description TEXT,
      subscribe_updates INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      edit_token TEXT NOT NULL UNIQUE,
      rejection_reason TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listing_specialities (
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      speciality_id INTEGER NOT NULL REFERENCES specialities(id) ON DELETE CASCADE,
      offered_by TEXT NOT NULL DEFAULT 'practice',
      referral_type TEXT NOT NULL DEFAULT 'self_referral',
      PRIMARY KEY (listing_id, speciality_id)
    );

    CREATE TABLE IF NOT EXISTS tag_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      postcode TEXT,
      radius_miles INTEGER NOT NULL DEFAULT 25,
      specialities TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'general',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Auto-seed initial specialities using direct execution without dangling prepared statements
  try {
    const row = sqlite.prepare('SELECT count(*) as count FROM specialities').get() as
      | { count: number }
      | undefined;
    if (!row || row.count === 0) {
      for (const item of INITIAL_SPECIALITIES) {
        const nameEsc = item.name.replace(/'/g, "''");
        const slugEsc = item.slug.replace(/'/g, "''");
        const catEsc = item.category;
        const groupEsc = item.groupName ? `'${item.groupName.replace(/'/g, "''")}'` : 'NULL';
        const descEsc = item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL';

        sqlite.exec(`
          INSERT OR IGNORE INTO specialities (name, slug, category, group_name, description, status)
          VALUES ('${nameEsc}', '${slugEsc}', '${catEsc}', ${groupEsc}, ${descEsc}, 'approved');
        `);
      }
    }
  } catch (err) {
    console.error('Error auto-seeding initial specialities:', err);
  }

  globalThis._sqliteDb = sqlite;
  return sqlite;
}

const sqlite = getSqliteInstance();
export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
