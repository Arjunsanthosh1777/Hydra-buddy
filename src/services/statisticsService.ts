import {
  addDaysToDateKey,
  getLocalDateKey,
  parseLocalDateKey,
} from '../constants/config.ts';
import type {
  BestHydrationDay,
  HydrationStatistics,
  WaterEntry,
  WeeklyDayPoint,
} from '../types/index.ts';

export function groupDailyTotals(entries: WaterEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const prev = totals.get(entry.local_date) ?? 0;
    totals.set(entry.local_date, prev + entry.amount_ml);
  }
  return totals;
}

export function computeHydrationStatistics(
  entries: WaterEntry[],
  dailyGoalMl: number,
  todayDateKey: string = getLocalDateKey(new Date())
): HydrationStatistics {
  const dailyTotals = groupDailyTotals(entries);
  const safeGoal = dailyGoalMl > 0 ? dailyGoalMl : 2500;

  const todayIntakeMl = dailyTotals.get(todayDateKey) ?? 0;

  // Build 7-day trailing series ending on todayDateKey
  const weeklySeries: WeeklyDayPoint[] = [];
  let weeklyIntakeMl = 0;
  let activeDaysInWeek = 0;

  for (let offset = -6; offset <= 0; offset += 1) {
    const dateKey = addDaysToDateKey(todayDateKey, offset);
    const totalMl = dailyTotals.get(dateKey) ?? 0;
    const parsed = parseLocalDateKey(dateKey);
    const dayShort = parsed.toLocaleDateString('en-US', { weekday: 'short' });
    const dayFull = parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const percentage = Math.min(100, Math.round((totalMl / safeGoal) * 100));
    const goalMet = totalMl >= safeGoal;

    weeklyIntakeMl += totalMl;
    if (totalMl > 0) {
      activeDaysInWeek += 1;
    }

    weeklySeries.push({
      date: dateKey,
      dayShort,
      dayFull,
      totalMl,
      goalMl: safeGoal,
      percentage,
      goalMet,
    });
  }

  const activeDailyAverageMl =
    activeDaysInWeek > 0 ? Math.round(weeklyIntakeMl / activeDaysInWeek) : 0;
  const calendarDailyAverageMl =
    weeklyIntakeMl > 0 ? Math.round(weeklyIntakeMl / 7) : 0;

  // Compute lifetime metrics, best day, and goal completion rate
  let bestDay: BestHydrationDay | null = null;
  let daysGoalMet = 0;
  let lifetimeTotalMl = 0;
  const metDateKeys: string[] = [];

  for (const [dateKey, totalMl] of dailyTotals.entries()) {
    lifetimeTotalMl += totalMl;
    if (totalMl >= safeGoal) {
      daysGoalMet += 1;
      metDateKeys.push(dateKey);
    }

    if (
      !bestDay ||
      totalMl > bestDay.totalMl ||
      (totalMl === bestDay.totalMl && dateKey > bestDay.date)
    ) {
      bestDay = { date: dateKey, totalMl };
    }
  }

  const daysLogged = dailyTotals.size;
  const goalCompletionRate =
    daysLogged > 0 ? Math.round((daysGoalMet / daysLogged) * 100) : 0;

  // Compute current consecutive-day streak
  let currentStreak = 0;
  const todayMet = (dailyTotals.get(todayDateKey) ?? 0) >= safeGoal;
  const yesterdayKey = addDaysToDateKey(todayDateKey, -1);
  const yesterdayMet = (dailyTotals.get(yesterdayKey) ?? 0) >= safeGoal;

  let cursorKey: string | null = todayMet
    ? todayDateKey
    : yesterdayMet
      ? yesterdayKey
      : null;

  while (cursorKey && (dailyTotals.get(cursorKey) ?? 0) >= safeGoal) {
    currentStreak += 1;
    cursorKey = addDaysToDateKey(cursorKey, -1);
  }

  // Compute longest consecutive-day streak across all logged history
  metDateKeys.sort((a, b) => a.localeCompare(b));
  let longestStreak = 0;
  let runningStreak = 0;
  let previousMetKey: string | null = null;

  for (const dateKey of metDateKeys) {
    if (previousMetKey && dateKey === addDaysToDateKey(previousMetKey, 1)) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    previousMetKey = dateKey;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    todayIntakeMl,
    weeklyIntakeMl,
    activeDailyAverageMl,
    calendarDailyAverageMl,
    bestDay,
    goalCompletionRate,
    daysLogged,
    daysGoalMet,
    currentStreak,
    longestStreak,
    lifetimeTotalMl,
    totalEntries: entries.length,
    weeklySeries,
  };
}
