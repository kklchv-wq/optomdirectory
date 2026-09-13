import { drizzle } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import { INITIAL_SPECIALITIES } from './initialSpecialities';

declare global {
  var _libsqlClient: Client | undefined;
  var _libsqlInitialized: boolean | undefined;
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

function getLibsqlInstance(): Client {
  if (globalThis._libsqlClient) {
    return globalThis._libsqlClient;
  }

  const client = createClient({
    url: `file:${resolvedPath}`,
  });

  globalThis._libsqlClient = client;
  return client;
}

export const client = getLibsqlInstance();

// Run table DDL & schema migrations asynchronously without blocking main thread
async function initDatabaseTables() {
  if (globalThis._libsqlInitialized) return;
  globalThis._libsqlInitialized = true;

  try {
    await client.execute(`PRAGMA journal_mode = WAL;`);
    await client.execute(`PRAGMA busy_timeout = 10000;`);
    await client.execute(`PRAGMA synchronous = NORMAL;`);
    await client.execute(`PRAGMA foreign_keys = ON;`);
    await client.executeMultiple(`
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
        offered_by TEXT,
        referral_type TEXT,
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

    // Safely ensure listing_specialities offered_by & referral_type columns are nullable
    try {
      const tableInfo = await client.execute(`PRAGMA table_info(listing_specialities);`);
      const offeredByCol = tableInfo.rows.find((r: any) => r.name === 'offered_by');
      if (offeredByCol && Number(offeredByCol.notnull) === 1) {
        await client.execute(`PRAGMA foreign_keys = OFF;`);
        await client.executeMultiple(`
          CREATE TABLE listing_specialities_new (
            listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            speciality_id INTEGER NOT NULL REFERENCES specialities(id) ON DELETE CASCADE,
            offered_by TEXT,
            referral_type TEXT,
            PRIMARY KEY (listing_id, speciality_id)
          );
          INSERT INTO listing_specialities_new SELECT listing_id, speciality_id, offered_by, referral_type FROM listing_specialities;
          DROP TABLE listing_specialities;
          ALTER TABLE listing_specialities_new RENAME TO listing_specialities;
        `);
        await client.execute(`PRAGMA foreign_keys = ON;`);
      }
    } catch (migErr) {
      console.error('Error migrating listing_specialities nullable constraint:', migErr);
    }

    // Safely ensure columns added in later schema updates exist on persistent volumes
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN subscribe_updates INTEGER NOT NULL DEFAULT 1;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE listings ADD COLUMN subscribe_updates INTEGER NOT NULL DEFAULT 1;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE listings ADD COLUMN working_days TEXT;`);
    } catch {}

    // Auto-seed initial specialities if missing
    for (const item of INITIAL_SPECIALITIES) {
      const nameEsc = item.name.replace(/'/g, "''");
      const slugEsc = item.slug.replace(/'/g, "''");
      const catEsc = item.category;
      const groupEsc = item.groupName ? `'${item.groupName.replace(/'/g, "''")}'` : 'NULL';
      const descEsc = item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL';

      await client.execute(`
        INSERT OR IGNORE INTO specialities (name, slug, category, group_name, description, status)
        VALUES ('${nameEsc}', '${slugEsc}', '${catEsc}', ${groupEsc}, ${descEsc}, 'approved');
      `);
    }
  } catch (err) {
    console.error('Error initializing database DDL:', err);
  }
}

initDatabaseTables();

export const db = drizzle(client, { schema });
export { schema };
