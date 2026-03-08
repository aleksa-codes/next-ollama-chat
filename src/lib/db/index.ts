import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import * as schema from '@/lib/db/schema';

const DATABASE_DIR = path.join(process.cwd(), 'data');
const DATABASE_PATH = path.join(DATABASE_DIR, 'app.db');

type DatabaseGlobals = typeof globalThis & {
  __ollamaSqlite?: Database.Database;
  __ollamaDbInitialized?: boolean;
};

const globalForDatabase = globalThis as DatabaseGlobals;

function createSqliteDatabase() {
  mkdirSync(DATABASE_DIR, { recursive: true });

  const sqlite = new Database(DATABASE_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return sqlite;
}

export const sqlite = globalForDatabase.__ollamaSqlite ?? createSqliteDatabase();

if (!globalForDatabase.__ollamaSqlite) {
  globalForDatabase.__ollamaSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

function hasTable(tableName: string) {
  const result = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get(tableName);

  return Boolean(result);
}

function bootstrapLegacyMigrations(migrationsFolder: string) {
  const hasChatsTable = hasTable('chats');
  const hasPreferencesTable = hasTable('preferences');
  const hasMigrationsTable = hasTable('__drizzle_migrations');

  if (!hasChatsTable && !hasPreferencesTable) {
    return;
  }

  const migrations = readMigrationFiles({ migrationsFolder });
  const latestMigration = migrations.at(-1);

  if (!hasMigrationsTable) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at NUMERIC
      );
    `);
  }

  if (!latestMigration) {
    return;
  }

  const migrationCount = sqlite.prepare('SELECT COUNT(*) as count FROM __drizzle_migrations').get() as {
    count: number;
  };
  if (migrationCount.count > 0) {
    return;
  }

  sqlite
    .prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)')
    .run(latestMigration.hash, latestMigration.folderMillis);
}

export function ensureDatabase() {
  if (globalForDatabase.__ollamaDbInitialized) {
    return;
  }

  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  bootstrapLegacyMigrations(migrationsFolder);
  migrate(db, { migrationsFolder });

  globalForDatabase.__ollamaDbInitialized = true;
}
