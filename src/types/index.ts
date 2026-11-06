export interface WaterEntry {
  id: number;
  amount_ml: number;
  consumed_at: string;
  local_date: string;
  note: string | null;
  created_at: string;
}

export interface UserSettings {
  id: number;
  user_name: string;
  daily_goal_ml: number;
  reminders_enabled: boolean;
  reminder_start_time: string;
  reminder_end_time: string;
  reminder_interval_minutes: number;
  sound_enabled: boolean;
  onboarding_completed: boolean;
  updated_at: string;
}

export type AchievementType =
  | 'first_glass'
  | 'hydration_starter'
  | 'goal_crusher'
  | 'three_day_streak'
  | 'seven_day_streak'
  | 'steady_sipper'
  | 'ten_liter_club'
  | 'overachiever';

export interface AchievementRecord {
  id: number;
  achievement_type: AchievementType;
  unlocked_at: string;
}

export interface AchievementDefinition {
  type: AchievementType;
  title: string;
  description: string;
  targetLabel: string;
  category: 'milestone' | 'streak' | 'goal';
}

export interface AchievementStatus extends AchievementDefinition {
  unlocked: boolean;
  unlocked_at: string | null;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
}

export interface DailySummary {
  date: string;
  totalMl: number;
  goalMl: number;
  remainingMl: number;
  surplusMl: number;
  percentage: number;
  rawPercentage: number;
  goalAchieved: boolean;
  entryCount: number;
}

export interface DayHistoryGroup {
  date: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
  goalAchieved: boolean;
  entries: WaterEntry[];
}

export interface WeeklyDayPoint {
  date: string;
  dayShort: string;
  dayFull: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
  goalMet: boolean;
}

export interface BestHydrationDay {
  date: string;
  totalMl: number;
}

export interface HydrationStatistics {
  todayIntakeMl: number;
  weeklyIntakeMl: number;
  activeDailyAverageMl: number;
  calendarDailyAverageMl: number;
  bestDay: BestHydrationDay | null;
  goalCompletionRate: number;
  daysLogged: number;
  daysGoalMet: number;
  currentStreak: number;
  longestStreak: number;
  lifetimeTotalMl: number;
  totalEntries: number;
  weeklySeries: WeeklyDayPoint[];
}

export interface HydrationSnapshot {
  settings: UserSettings;
  todaySummary: DailySummary;
  todayEntries: WaterEntry[];
  historyGroups: DayHistoryGroup[];
  statistics: HydrationStatistics;
  achievements: AchievementStatus[];
  newlyUnlocked?: AchievementStatus[];
}

export type TabRoute = 'home' | 'history' | 'statistics' | 'achievements' | 'settings';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface InAppReminderAlert {
  id: string;
  title: string;
  message: string;
  triggeredAt: string;
  slotTime: string;
}
