import type { DatabaseSync } from 'node:sqlite';
import { HYDRATION_LIMITS } from '../constants/config.ts';

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS water_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount_ml INTEGER NOT NULL CHECK(amount_ml > 0 AND amount_ml <= 10000),
    consumed_at TEXT NOT NULL,
    local_date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_water_entries_local_date
    ON water_entries(local_date);

  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    user_name TEXT NOT NULL DEFAULT 'Friend',
    daily_goal_ml INTEGER NOT NULL DEFAULT 2500 CHECK(daily_goal_ml >= 500 AND daily_goal_ml <= 10000),
    reminders_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_start_time TEXT NOT NULL DEFAULT '08:00',
    reminder_end_time TEXT NOT NULL DEFAULT '21:00',
    reminder_interval_minutes INTEGER NOT NULL DEFAULT 60,
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_type TEXT NOT NULL UNIQUE,
    unlocked_at TEXT NOT NULL
  );
`;

export function initializeDatabaseSchema(db: DatabaseSync): void {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(CREATE_TABLES_SQL);

  // Ensure any incremental columns exist if opening an existing database file
  const columns = db.prepare('PRAGMA table_info(user_settings)').all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((c) => c.name));

  if (!columnNames.has('user_name')) {
    db.exec("ALTER TABLE user_settings ADD COLUMN user_name TEXT NOT NULL DEFAULT 'Friend';");
  }
  if (!columnNames.has('sound_enabled')) {
    db.exec('ALTER TABLE user_settings ADD COLUMN sound_enabled INTEGER NOT NULL DEFAULT 1;');
  }
  if (!columnNames.has('onboarding_completed')) {
    db.exec('ALTER TABLE user_settings ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0;');
  }

  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO user_settings (
      id,
      user_name,
      daily_goal_ml,
      reminders_enabled,
      reminder_start_time,
      reminder_end_time,
      reminder_interval_minutes,
      sound_enabled,
      onboarding_completed,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    1,
    'Friend',
    HYDRATION_LIMITS.DEFAULT_GOAL_ML,
    1,
    HYDRATION_LIMITS.DEFAULT_START_TIME,
    HYDRATION_LIMITS.DEFAULT_END_TIME,
    HYDRATION_LIMITS.DEFAULT_INTERVAL_MINUTES,
    1,
    0,
    nowIso
  );
}
