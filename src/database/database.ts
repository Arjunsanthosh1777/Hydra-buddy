import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { initializeDatabaseSchema } from './schema.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  return process.env.HYDRABUDDY_DB_PATH || path.resolve(process.cwd(), 'hydrabuddy.db');
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
