import { getDatabase } from './database.ts';
import { HYDRATION_LIMITS } from '../constants/config.ts';
import type {
  AchievementRecord,
  AchievementType,
  UserSettings,
  WaterEntry,
} from '../types/index.ts';

interface RawSettingsRow {
  id: number;
  user_name: string;
  daily_goal_ml: number;
  reminders_enabled: number;
  reminder_start_time: string;
  reminder_end_time: string;
  reminder_interval_minutes: number;
  sound_enabled: number;
  onboarding_completed: number;
  updated_at: string;
}

interface RawWaterEntryRow {
  id: number;
  amount_ml: number;
  consumed_at: string;
  local_date: string;
  note: string | null;
  created_at: string;
}

interface RawAchievementRow {
  id: number;
  achievement_type: string;
  unlocked_at: string;
}

function mapSettingsRow(row: RawSettingsRow): UserSettings {
  return {
    id: Number(row.id),
    user_name: String(row.user_name || 'Friend'),
    daily_goal_ml: Number(row.daily_goal_ml),
    reminders_enabled: Boolean(row.reminders_enabled),
    reminder_start_time: String(row.reminder_start_time),
    reminder_end_time: String(row.reminder_end_time),
    reminder_interval_minutes: Number(row.reminder_interval_minutes),
    sound_enabled: Boolean(row.sound_enabled),
    onboarding_completed: Boolean(row.onboarding_completed),
    updated_at: String(row.updated_at),
  };
}

function mapEntryRow(row: RawWaterEntryRow): WaterEntry {
  return {
    id: Number(row.id),
    amount_ml: Number(row.amount_ml),
    consumed_at: String(row.consumed_at),
    local_date: String(row.local_date),
    note: row.note ? String(row.note) : null,
    created_at: String(row.created_at),
  };
}

export class WaterRepository {
  getSettings(): UserSettings {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM user_settings WHERE id = ?')
      .get(1) as RawSettingsRow | undefined;

    if (!row) {
      throw new Error('User settings record not found in database.');
    }
    return mapSettingsRow(row);
  }

  updateSettings(
    patch: Partial<Omit<UserSettings, 'id' | 'updated_at'>>
  ): UserSettings {
    const db = getDatabase();
    const current = this.getSettings();

    const nextUserName =
      patch.user_name !== undefined
        ? patch.user_name.trim().slice(0, 40) || 'Friend'
        : current.user_name;

    const nextDailyGoal =
      patch.daily_goal_ml !== undefined
        ? Math.round(Number(patch.daily_goal_ml))
        : current.daily_goal_ml;

    if (
      !Number.isFinite(nextDailyGoal) ||
      nextDailyGoal < HYDRATION_LIMITS.MIN_GOAL_ML ||
      nextDailyGoal > HYDRATION_LIMITS.MAX_GOAL_ML
    ) {
      throw new Error(
        `Daily goal must be between ${HYDRATION_LIMITS.MIN_GOAL_ML} ml and ${HYDRATION_LIMITS.MAX_GOAL_ML} ml.`
      );
    }

    const nextRemindersEnabled =
      patch.reminders_enabled !== undefined
        ? patch.reminders_enabled
        : current.reminders_enabled;

    const nextStartTime =
      patch.reminder_start_time !== undefined
        ? patch.reminder_start_time
        : current.reminder_start_time;

    const nextEndTime =
      patch.reminder_end_time !== undefined
        ? patch.reminder_end_time
        : current.reminder_end_time;

    if (!/^\d{2}:\d{2}$/.test(nextStartTime) || !/^\d{2}:\d{2}$/.test(nextEndTime)) {
      throw new Error('Reminder start and end times must use HH:MM format.');
    }

    const nextInterval =
      patch.reminder_interval_minutes !== undefined
        ? Math.round(Number(patch.reminder_interval_minutes))
        : current.reminder_interval_minutes;

    if (!Number.isFinite(nextInterval) || nextInterval < 5 || nextInterval > 480) {
      throw new Error('Reminder interval must be between 5 and 480 minutes.');
    }

    const nextSoundEnabled =
      patch.sound_enabled !== undefined ? patch.sound_enabled : current.sound_enabled;

    const nextOnboarding =
      patch.onboarding_completed !== undefined
        ? patch.onboarding_completed
        : current.onboarding_completed;

    const nowIso = new Date().toISOString();

    db.prepare(
      `UPDATE user_settings
       SET user_name = ?,
           daily_goal_ml = ?,
           reminders_enabled = ?,
           reminder_start_time = ?,
           reminder_end_time = ?,
           reminder_interval_minutes = ?,
           sound_enabled = ?,
           onboarding_completed = ?,
           updated_at = ?
       WHERE id = ?`
    ).run(
      nextUserName,
      nextDailyGoal,
      nextRemindersEnabled ? 1 : 0,
      nextStartTime,
      nextEndTime,
      nextInterval,
      nextSoundEnabled ? 1 : 0,
      nextOnboarding ? 1 : 0,
      nowIso,
      1
    );

    return this.getSettings();
  }

  getAllEntries(): WaterEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM water_entries ORDER BY local_date DESC, consumed_at DESC, id DESC'
      )
      .all() as unknown as RawWaterEntryRow[];
    return rows.map(mapEntryRow);
  }

  getEntriesByDate(localDate: string): WaterEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM water_entries WHERE local_date = ? ORDER BY consumed_at DESC, id DESC'
      )
      .all(localDate) as unknown as RawWaterEntryRow[];
    return rows.map(mapEntryRow);
  }

  getEntryById(id: number): WaterEntry | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM water_entries WHERE id = ?')
      .get(id) as RawWaterEntryRow | undefined;
    return row ? mapEntryRow(row) : null;
  }

  insertWaterEntry(input: {
    amount_ml: number;
    consumed_at: string;
    local_date: string;
    note?: string | null;
  }): WaterEntry {
    const db = getDatabase();
    const amount = Math.round(Number(input.amount_ml));

    if (
      !Number.isFinite(amount) ||
      amount < HYDRATION_LIMITS.MIN_ENTRY_ML ||
      amount > HYDRATION_LIMITS.MAX_ENTRY_ML
    ) {
      throw new Error(
        `Water amount must be between ${HYDRATION_LIMITS.MIN_ENTRY_ML} ml and ${HYDRATION_LIMITS.MAX_ENTRY_ML} ml.`
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.local_date)) {
      throw new Error('Invalid local date format; expected YYYY-MM-DD.');
    }

    const cleanNote = input.note ? input.note.trim().slice(0, 80) : null;
    const createdAt = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO water_entries (amount_ml, consumed_at, local_date, note, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(amount, input.consumed_at, input.local_date, cleanNote || null, createdAt);

    const insertedId = Number(result.lastInsertRowid);
    const created = this.getEntryById(insertedId);
    if (!created) {
      throw new Error('Failed to retrieve newly created water entry.');
    }
    return created;
  }

  deleteWaterEntry(id: number): boolean {
    const db = getDatabase();
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return false;
    }
    const result = db
      .prepare('DELETE FROM water_entries WHERE id = ?')
      .run(numericId);
    return Number(result.changes) > 0;
  }

  getUnlockedAchievements(): AchievementRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM achievements ORDER BY unlocked_at ASC')
      .all() as unknown as RawAchievementRow[];
    return rows.map((r) => ({
      id: Number(r.id),
      achievement_type: r.achievement_type as AchievementType,
      unlocked_at: String(r.unlocked_at),
    }));
  }

  syncAchievements(eligibleTypes: AchievementType[]): AchievementType[] {
    const db = getDatabase();
    const existing = this.getUnlockedAchievements();
    const existingSet = new Set(existing.map((a) => a.achievement_type));
    const eligibleSet = new Set(eligibleTypes);
    const newlyUnlocked: AchievementType[] = [];
    const nowIso = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE;');
    try {
      const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO achievements (achievement_type, unlocked_at) VALUES (?, ?)'
      );
      for (const type of eligibleTypes) {
        if (!existingSet.has(type)) {
          insertStmt.run(type, nowIso);
          newlyUnlocked.push(type);
        }
      }

      // Remove any achievement if entries were deleted and its condition is no longer met
      const deleteStmt = db.prepare(
        'DELETE FROM achievements WHERE achievement_type = ?'
      );
      for (const record of existing) {
        if (!eligibleSet.has(record.achievement_type)) {
          deleteStmt.run(record.achievement_type);
        }
      }

      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }

    return newlyUnlocked;
  }

  resetAllData(resetSettingsToDefaults: boolean = false): UserSettings {
    const db = getDatabase();
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare('DELETE FROM water_entries').run();
      db.prepare('DELETE FROM achievements').run();

      if (resetSettingsToDefaults) {
        const nowIso = new Date().toISOString();
        db.prepare(
          `UPDATE user_settings
           SET user_name = ?,
               daily_goal_ml = ?,
               reminders_enabled = ?,
               reminder_start_time = ?,
               reminder_end_time = ?,
               reminder_interval_minutes = ?,
               sound_enabled = ?,
               onboarding_completed = ?,
               updated_at = ?
           WHERE id = ?`
        ).run(
          'Friend',
          HYDRATION_LIMITS.DEFAULT_GOAL_ML,
          1,
          HYDRATION_LIMITS.DEFAULT_START_TIME,
          HYDRATION_LIMITS.DEFAULT_END_TIME,
          HYDRATION_LIMITS.DEFAULT_INTERVAL_MINUTES,
          1,
          0,
          nowIso,
          1
        );
      }

      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }

    return this.getSettings();
  }
}

export const waterRepository = new WaterRepository();
