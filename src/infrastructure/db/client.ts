import path from "node:path";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

/**
 * `file:./dailyred.db` locally; a `libsql://…` Turso URL (+ DATABASE_AUTH_TOKEN) in production;
 * `:memory:` in tests.
 */
export function createDatabase(url: string, authToken?: string): Database {
  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  return drizzle(client, { schema });
}

export async function migrateDatabase(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/**
 * Startup for a real database. For a local SQLite file, WAL + synchronous=NORMAL avoids a
 * full disk flush on every write (each battle move is a write); without it a move took
 * ~130 ms on Windows. Remote Turso databases manage this themselves.
 */
export async function prepareDatabase(db: Database, url: string): Promise<void> {
  if (url.startsWith("file:")) {
    await db.run(sql`PRAGMA journal_mode = WAL`);
    await db.run(sql`PRAGMA synchronous = NORMAL`);
  }
  await migrateDatabase(db);
}
