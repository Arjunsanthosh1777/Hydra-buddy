import {
  getLocalDateKey,
  HYDRATION_LIMITS,
} from '../constants/config.ts';
import {
  buildHydrationSnapshot,
  evaluateAchievements,
} from './hydrationService.ts';
import { computeHydrationStatistics } from './statisticsService.ts';
import type {
  AchievementRecord,
  AchievementType,
  HydrationSnapshot,
  UserSettings,
  WaterEntry,
} from '../types/index.ts';

const STORAGE_KEYS = {
  SETTINGS: 'hydrabuddy_v1_settings',
  ENTRIES: 'hydrabuddy_v1_entries',
  ACHIEVEMENTS: 'hydrabuddy_v1_achievements',
  NEXT_ID: 'hydrabuddy_v1_next_id',
} as const;

function getDefaultSettings(): UserSettings {
  return {
    id: 1,
    user_name: 'Friend',
    daily_goal_ml: HYDRATION_LIMITS.DEFAULT_GOAL_ML,
    reminders_enabled: true,
    reminder_start_time: HYDRATION_LIMITS.DEFAULT_START_TIME,
    reminder_end_time: HYDRATION_LIMITS.DEFAULT_END_TIME,
    reminder_interval_minutes: HYDRATION_LIMITS.DEFAULT_INTERVAL_MINUTES,
    sound_enabled: true,
    onboarding_completed: false,
    updated_at: new Date().toISOString(),
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function syncBrowserAchievements(
  eligibleTypes: AchievementType[]
): AchievementType[] {
  const existing = readJson<AchievementRecord[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
  const existingSet = new Set(existing.map((a) => a.achievement_type));
  const eligibleSet = new Set(eligibleTypes);
  const newlyUnlocked: AchievementType[] = [];
  const nowIso = new Date().toISOString();

  const updated = existing.filter((rec) =>
    eligibleSet.has(rec.achievement_type)
  );
  let nextId = updated.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  for (const type of eligibleTypes) {
    if (!existingSet.has(type)) {
      updated.push({
        id: nextId++,
        achievement_type: type,
        unlocked_at: nowIso,
      });
      newlyUnlocked.push(type);
    }
  }

  writeJson(STORAGE_KEYS.ACHIEVEMENTS, updated);
  return newlyUnlocked;
}

function getSyncedBrowserSnapshot(todayDateKey: string): HydrationSnapshot {
  const storedSettings = readJson<UserSettings | null>(
    STORAGE_KEYS.SETTINGS,
    null
  );
  const settings = storedSettings
    ? { ...getDefaultSettings(), ...storedSettings }
    : getDefaultSettings();

  if (!storedSettings) {
    writeJson(STORAGE_KEYS.SETTINGS, settings);
  }

  const entries = readJson<WaterEntry[]>(STORAGE_KEYS.ENTRIES, []);
  const unlocked = readJson<AchievementRecord[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
  const stats = computeHydrationStatistics(
    entries,
    settings.daily_goal_ml,
    todayDateKey
  );
  const { eligibleTypes } = evaluateAchievements(
    entries,
    settings,
    unlocked,
    stats
  );
  const newlyUnlocked = syncBrowserAchievements(eligibleTypes);
  const updatedUnlocked = readJson<AchievementRecord[]>(
    STORAGE_KEYS.ACHIEVEMENTS,
    []
  );

  return buildHydrationSnapshot(
    entries,
    settings,
    updatedUnlocked,
    todayDateKey,
    newlyUnlocked
  );
}

export const clientStorageService = {
  getSnapshot(todayDateKey: string = getLocalDateKey(new Date())): HydrationSnapshot {
    return getSyncedBrowserSnapshot(todayDateKey);
  },

  addEntry(input: {
    amount_ml: number;
    consumed_at: string;
    local_date: string;
    note?: string | null;
  }): HydrationSnapshot {
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

    const entries = readJson<WaterEntry[]>(STORAGE_KEYS.ENTRIES, []);
    const storedNextId = readJson<number>(STORAGE_KEYS.NEXT_ID, 1);
    const maxExistingId = entries.reduce((max, e) => Math.max(max, e.id), 0);
    const id = Math.max(storedNextId, maxExistingId + 1);

    const newEntry: WaterEntry = {
      id,
      amount_ml: amount,
      consumed_at: input.consumed_at,
      local_date: input.local_date,
      note: input.note ? input.note.trim().slice(0, 80) : null,
      created_at: new Date().toISOString(),
    };

    writeJson(STORAGE_KEYS.ENTRIES, [newEntry, ...entries]);
    writeJson(STORAGE_KEYS.NEXT_ID, id + 1);

    return getSyncedBrowserSnapshot(input.local_date);
  },

  deleteEntry(entryId: number, todayDateKey: string): HydrationSnapshot {
    const entries = readJson<WaterEntry[]>(STORAGE_KEYS.ENTRIES, []);
    const filtered = entries.filter((e) => e.id !== entryId);
    writeJson(STORAGE_KEYS.ENTRIES, filtered);
    return getSyncedBrowserSnapshot(todayDateKey);
  },

  updateSettings(
    patch: Partial<Omit<UserSettings, 'id' | 'updated_at'>>,
    todayDateKey: string
  ): HydrationSnapshot {
    const current = {
      ...getDefaultSettings(),
      ...readJson<Partial<UserSettings>>(STORAGE_KEYS.SETTINGS, {}),
    };

    const nextGoal =
      patch.daily_goal_ml !== undefined
        ? Math.round(Number(patch.daily_goal_ml))
        : current.daily_goal_ml;

    if (
      !Number.isFinite(nextGoal) ||
      nextGoal < HYDRATION_LIMITS.MIN_GOAL_ML ||
      nextGoal > HYDRATION_LIMITS.MAX_GOAL_ML
    ) {
      throw new Error(
        `Daily goal must be between ${HYDRATION_LIMITS.MIN_GOAL_ML} ml and ${HYDRATION_LIMITS.MAX_GOAL_ML} ml.`
      );
    }

    const nextSettings: UserSettings = {
      ...current,
      user_name:
        patch.user_name !== undefined
          ? patch.user_name.trim().slice(0, 40) || 'Friend'
          : current.user_name,
      daily_goal_ml: nextGoal,
      reminders_enabled:
        patch.reminders_enabled !== undefined
          ? patch.reminders_enabled
          : current.reminders_enabled,
      reminder_start_time:
        patch.reminder_start_time ?? current.reminder_start_time,
      reminder_end_time: patch.reminder_end_time ?? current.reminder_end_time,
      reminder_interval_minutes:
        patch.reminder_interval_minutes ?? current.reminder_interval_minutes,
      sound_enabled:
        patch.sound_enabled !== undefined
          ? patch.sound_enabled
          : current.sound_enabled,
      onboarding_completed:
        patch.onboarding_completed !== undefined
          ? patch.onboarding_completed
          : current.onboarding_completed,
      updated_at: new Date().toISOString(),
    };

    writeJson(STORAGE_KEYS.SETTINGS, nextSettings);
    return getSyncedBrowserSnapshot(todayDateKey);
  },

  resetAllData(
    resetSettings: boolean,
    todayDateKey: string
  ): HydrationSnapshot {
    writeJson(STORAGE_KEYS.ENTRIES, []);
    writeJson(STORAGE_KEYS.ACHIEVEMENTS, []);
    if (resetSettings) {
      writeJson(STORAGE_KEYS.SETTINGS, getDefaultSettings());
    }
    return getSyncedBrowserSnapshot(todayDateKey);
  },
};
