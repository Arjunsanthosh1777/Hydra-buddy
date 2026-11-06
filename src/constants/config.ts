import type { AchievementDefinition } from '../types/index.ts';

export const QUICK_ADD_AMOUNTS_ML = [100, 200, 250, 300, 500] as const;

export const CONTAINER_PRESETS = [
  'Glass',
  'Water Bottle',
  'Tumbler',
  'Carafe',
  'Sports Bottle',
] as const;

export const GOAL_PRESETS_ML = [1500, 2000, 2500, 3000, 3500] as const;

export const REMINDER_INTERVAL_OPTIONS = [
  { minutes: 15, label: 'Every 15 min' },
  { minutes: 30, label: 'Every 30 min' },
  { minutes: 45, label: 'Every 45 min' },
  { minutes: 60, label: 'Every 1 hour' },
  { minutes: 90, label: 'Every 1.5 hours' },
  { minutes: 120, label: 'Every 2 hours' },
] as const;

export const HYDRATION_LIMITS = {
  MIN_ENTRY_ML: 10,
  MAX_ENTRY_ML: 5000,
  MIN_GOAL_ML: 500,
  MAX_GOAL_ML: 10000,
  DEFAULT_GOAL_ML: 2500,
  DEFAULT_START_TIME: '08:00',
  DEFAULT_END_TIME: '21:00',
  DEFAULT_INTERVAL_MINUTES: 60,
} as const;

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'first_glass',
    title: 'First Glass',
    description: 'Log your first water intake entry in HydraBuddy.',
    targetLabel: '1 entry logged',
    category: 'milestone',
  },
  {
    type: 'hydration_starter',
    title: 'Hydration Starter',
    description: 'Reach at least 1,000 ml of water in a single day.',
    targetLabel: '1,000 ml in one day',
    category: 'milestone',
  },
  {
    type: 'goal_crusher',
    title: 'Goal Crusher',
    description: 'Complete 100% of your daily hydration target.',
    targetLabel: '1 daily goal completed',
    category: 'goal',
  },
  {
    type: 'three_day_streak',
    title: '3-Day Streak',
    description: 'Meet your daily hydration goal for 3 consecutive days.',
    targetLabel: '3 consecutive days',
    category: 'streak',
  },
  {
    type: 'seven_day_streak',
    title: '7-Day Streak',
    description: 'Maintain your daily hydration goal for a full 7-day week.',
    targetLabel: '7 consecutive days',
    category: 'streak',
  },
  {
    type: 'steady_sipper',
    title: 'Steady Sipper',
    description: 'Record 10 or more individual hydration entries.',
    targetLabel: '10 entries recorded',
    category: 'milestone',
  },
  {
    type: 'ten_liter_club',
    title: '10-Liter Milestone',
    description: 'Log 10,000 ml of cumulative hydration across all days.',
    targetLabel: '10,000 ml lifetime total',
    category: 'milestone',
  },
  {
    type: 'overachiever',
    title: 'Hydration Champion',
    description: 'Exceed 125% of your daily hydration target in one day.',
    targetLabel: '125% of daily goal',
    category: 'goal',
  },
];

/**
 * Formats a Date into a strict local calendar YYYY-MM-DD key
 * without UTC shifting so late-evening entries never jump days.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date at midday (12:00)
 * to avoid DST midnight boundary shifts.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

/**
 * Adds or subtracts calendar days from a YYYY-MM-DD key safely in local time.
 */
export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const d = parseLocalDateKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return getLocalDateKey(d);
}

export function formatDisplayDate(dateKey: string, referenceTodayKey?: string): string {
  const todayKey = referenceTodayKey ?? getLocalDateKey(new Date());
  const yesterdayKey = addDaysToDateKey(todayKey, -1);
  if (dateKey === todayKey) {
    return 'Today';
  }
  if (dateKey === yesterdayKey) {
    return 'Yesterday';
  }
  const date = parseLocalDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFullHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeFromIso(isoOrTime: string): string {
  if (/^\d{2}:\d{2}$/.test(isoOrTime)) {
    const [hStr, mStr] = isoOrTime.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
  const parsed = new Date(isoOrTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrTime;
  }
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getGreetingForHour(hour: number, name: string): string {
  const cleanName = name.trim() || 'Friend';
  if (hour < 12) {
    return `Good morning, ${cleanName}`;
  }
  if (hour < 17) {
    return `Good afternoon, ${cleanName}`;
  }
  return `Good evening, ${cleanName}`;
}
