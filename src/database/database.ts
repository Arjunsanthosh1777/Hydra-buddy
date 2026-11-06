import { DatabaseSync } from 'node:sqlite';
import os from 'node:os';
import path from 'node:path';
import { initializeDatabaseSchema } from './schema.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  if (process.env.HYDRABUDDY_DB_PATH) {
    return process.env.HYDRABUDDY_DB_PATH;
  }
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'hydrabuddy.db');
  }
  return path.resolve(process.cwd(), 'hydrabuddy.db');
}

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new DatabaseSync(dbPath);
    initializeDatabaseSchema(dbInstance);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
