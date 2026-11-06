import {
  ACHIEVEMENT_DEFINITIONS,
  getLocalDateKey,
} from '../constants/config.ts';
import {
  computeHydrationStatistics,
  groupDailyTotals,
} from './statisticsService.ts';
import type {
  AchievementRecord,
  AchievementStatus,
  AchievementType,
  DailySummary,
  DayHistoryGroup,
  HydrationSnapshot,
  HydrationStatistics,
  UserSettings,
  WaterEntry,
} from '../types/index.ts';

export function computeDailySummary(
  entries: WaterEntry[],
  dateKey: string,
  dailyGoalMl: number
): DailySummary {
  const safeGoal = dailyGoalMl > 0 ? dailyGoalMl : 2500;
  const dayEntries = entries.filter((e) => e.local_date === dateKey);
  const totalMl = dayEntries.reduce((sum, entry) => sum + entry.amount_ml, 0);
  const remainingMl = Math.max(0, safeGoal - totalMl);
  const surplusMl = Math.max(0, totalMl - safeGoal);
  const rawPercentage = Math.round((totalMl / safeGoal) * 100);
  const percentage = Math.min(100, rawPercentage);
  const goalAchieved = totalMl >= safeGoal;

  return {
    date: dateKey,
    totalMl,
    goalMl: safeGoal,
    remainingMl,
    surplusMl,
    percentage,
    rawPercentage,
    goalAchieved,
    entryCount: dayEntries.length,
  };
}

export function computeHistoryGroups(
  entries: WaterEntry[],
  dailyGoalMl: number
): DayHistoryGroup[] {
  const safeGoal = dailyGoalMl > 0 ? dailyGoalMl : 2500;
  const grouped = new Map<string, WaterEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.local_date);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.local_date, [entry]);
    }
  }

  const dates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return dates.map((date) => {
    const dayEntries = grouped.get(date) ?? [];
    dayEntries.sort(
      (a, b) =>
        b.consumed_at.localeCompare(a.consumed_at) || b.id - a.id
    );
    const totalMl = dayEntries.reduce((sum, item) => sum + item.amount_ml, 0);
    const percentage = Math.min(100, Math.round((totalMl / safeGoal) * 100));
    return {
      date,
      totalMl,
      goalMl: safeGoal,
      percentage,
      goalAchieved: totalMl >= safeGoal,
      entries: dayEntries,
    };
  });
}

export function evaluateAchievements(
  entries: WaterEntry[],
  settings: UserSettings,
  unlockedRecords: AchievementRecord[],
  stats: HydrationStatistics
): {
  statuses: AchievementStatus[];
  eligibleTypes: AchievementType[];
} {
  const safeGoal = settings.daily_goal_ml > 0 ? settings.daily_goal_ml : 2500;
  const dailyTotals = groupDailyTotals(entries);
  let maxDailyMl = 0;
  for (const total of dailyTotals.values()) {
    if (total > maxDailyMl) {
      maxDailyMl = total;
    }
  }

  const unlockedMap = new Map<AchievementType, string>();
  for (const record of unlockedRecords) {
    unlockedMap.set(record.achievement_type, record.unlocked_at);
  }

  const eligibleTypes: AchievementType[] = [];

  const statuses: AchievementStatus[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    let currentValue = 0;
    let targetValue = 1;
    let isEligible = false;

    switch (def.type) {
      case 'first_glass': {
        currentValue = Math.min(1, stats.totalEntries);
        targetValue = 1;
        isEligible = stats.totalEntries >= 1;
        break;
      }
      case 'hydration_starter': {
        currentValue = Math.min(1000, maxDailyMl);
        targetValue = 1000;
        isEligible = maxDailyMl >= 1000;
        break;
      }
      case 'goal_crusher': {
        currentValue = Math.min(1, stats.daysGoalMet);
        targetValue = 1;
        isEligible = stats.daysGoalMet >= 1;
        break;
      }
      case 'three_day_streak': {
        currentValue = Math.min(3, stats.longestStreak);
        targetValue = 3;
        isEligible = stats.longestStreak >= 3;
        break;
      }
      case 'seven_day_streak': {
        currentValue = Math.min(7, stats.longestStreak);
        targetValue = 7;
        isEligible = stats.longestStreak >= 7;
        break;
      }
      case 'steady_sipper': {
        currentValue = Math.min(10, stats.totalEntries);
        targetValue = 10;
        isEligible = stats.totalEntries >= 10;
        break;
      }
      case 'ten_liter_club': {
        currentValue = Math.min(10000, stats.lifetimeTotalMl);
        targetValue = 10000;
        isEligible = stats.lifetimeTotalMl >= 10000;
        break;
      }
      case 'overachiever': {
        const target125 = Math.round(safeGoal * 1.25);
        currentValue = Math.min(target125, maxDailyMl);
        targetValue = target125;
        isEligible = maxDailyMl >= target125;
        break;
      }
    }

    if (isEligible) {
      eligibleTypes.push(def.type);
    }

    const progressPercent =
      targetValue > 0
        ? Math.min(100, Math.round((currentValue / targetValue) * 100))
        : 0;

    return {
      ...def,
      unlocked: isEligible,
      unlocked_at: isEligible ? unlockedMap.get(def.type) ?? new Date().toISOString() : null,
      currentValue,
      targetValue,
      progressPercent,
    };
  });

  return { statuses, eligibleTypes };
}

export function buildHydrationSnapshot(
  entries: WaterEntry[],
  settings: UserSettings,
  unlockedRecords: AchievementRecord[],
  todayDateKey: string = getLocalDateKey(new Date()),
  newlyUnlockedTypes: AchievementType[] = []
): HydrationSnapshot {
  const todaySummary = computeDailySummary(
    entries,
    todayDateKey,
    settings.daily_goal_ml
  );
  const todayEntries = entries
    .filter((e) => e.local_date === todayDateKey)
    .sort((a, b) => b.consumed_at.localeCompare(a.consumed_at) || b.id - a.id);

  const historyGroups = computeHistoryGroups(entries, settings.daily_goal_ml);
  const statistics = computeHydrationStatistics(
    entries,
    settings.daily_goal_ml,
    todayDateKey
  );
  const { statuses } = evaluateAchievements(
    entries,
    settings,
    unlockedRecords,
    statistics
  );

  const newlyUnlockedSet = new Set(newlyUnlockedTypes);
  const newlyUnlocked = statuses.filter((a) => newlyUnlockedSet.has(a.type));

  return {
    settings,
    todaySummary,
    todayEntries,
    historyGroups,
    statistics,
    achievements: statuses,
    newlyUnlocked: newlyUnlocked.length > 0 ? newlyUnlocked : undefined,
  };
}

export function getMotivationalMessage(
  summary: DailySummary,
  stats: HydrationStatistics
): { headline: string; detail: string } {
  if (summary.goalAchieved) {
    if (stats.currentStreak >= 7) {
      return {
        headline: 'Daily goal reached — 7+ day streak active',
        detail:
          summary.surplusMl > 0
            ? `You have logged ${summary.totalMl.toLocaleString()} ml today (+${summary.surplusMl.toLocaleString()} ml beyond your target).`
            : `You reached your ${summary.goalMl.toLocaleString()} ml goal and kept your ${stats.currentStreak}-day streak going.`,
      };
    }
    return {
      headline: 'Daily hydration goal completed',
      detail:
        summary.surplusMl > 0
          ? `Great consistency today — ${summary.totalMl.toLocaleString()} ml logged (+${summary.surplusMl.toLocaleString()} ml above target).`
          : `You hit ${summary.goalMl.toLocaleString()} ml for today. Keep sipping steadily through the evening.`,
    };
  }

  if (summary.totalMl === 0) {
    return {
      headline: 'Ready for your first glass',
      detail: `Log a quick 250 ml glass to begin today's ${summary.goalMl.toLocaleString()} ml target.`,
    };
  }

  if (summary.percentage >= 75) {
    return {
      headline: 'Almost at your daily target',
      detail: `Only ${summary.remainingMl.toLocaleString()} ml remaining to complete your ${summary.goalMl.toLocaleString()} ml goal today.`,
    };
  }

  if (summary.percentage >= 40) {
    return {
      headline: 'Steady hydration pace',
      detail: `You are ${summary.percentage}% of the way there with ${summary.remainingMl.toLocaleString()} ml left for today.`,
    };
  }

  return {
    headline: 'Good start to the day',
    detail: `${summary.totalMl.toLocaleString()} ml logged so far — ${summary.remainingMl.toLocaleString()} ml remaining today.`,
  };
}
