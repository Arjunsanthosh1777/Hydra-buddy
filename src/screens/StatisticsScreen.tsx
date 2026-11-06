import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Droplets,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { StatisticsCard } from '../components/StatisticsCard.tsx';
import { WeeklyProgressChart } from '../components/WeeklyProgressChart.tsx';
import { formatDisplayDate, getLocalDateKey } from '../constants/config.ts';
import type { HydrationSnapshot } from '../types/index.ts';

interface StatisticsScreenProps {
  snapshot: HydrationSnapshot;
}

export function StatisticsScreen({ snapshot }: StatisticsScreenProps) {
  const { settings, todaySummary, statistics } = snapshot;
  const todayKey = getLocalDateKey(new Date());

  const bestDayValue = statistics.bestDay
    ? `${statistics.bestDay.totalMl.toLocaleString()} ml`
    : 'No entries';
  const bestDayDetail = statistics.bestDay
    ? formatDisplayDate(statistics.bestDay.date, todayKey)
    : 'Record water intake to set a personal best';

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-[#647D9B] tabular-nums">
          <span>Calculated from {statistics.totalEntries} stored entries</span>
          <span aria-hidden="true"> · </span>
          <span>{statistics.daysLogged} active days</span>
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
          Statistics &amp; Progress
        </h1>
      </div>

      {/* 6 Calculated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatisticsCard
          label="Today's Consumption"
          value={`${statistics.todayIntakeMl.toLocaleString()} ml`}
          detail={`${todaySummary.percentage}% of ${settings.daily_goal_ml.toLocaleString()} ml daily goal`}
          icon={<Droplets className="w-4 h-4" />}
          accentTone={todaySummary.goalAchieved ? 'mint' : 'blue'}
        />

        <StatisticsCard
          label="7-Day Total Intake"
          value={`${statistics.weeklyIntakeMl.toLocaleString()} ml`}
          detail={`${(statistics.weeklyIntakeMl / 1000).toFixed(2)} liters over the past 7 days`}
          icon={<BarChart3 className="w-4 h-4" />}
          accentTone="blue"
        />

        <StatisticsCard
          label="Average Daily Intake"
          value={`${statistics.activeDailyAverageMl.toLocaleString()} ml`}
          detail={
            statistics.weeklyIntakeMl > 0
              ? `Per active day (${statistics.calendarDailyAverageMl.toLocaleString()} ml 7-day avg)`
              : 'No weekly intake recorded yet'
          }
          icon={<TrendingUp className="w-4 h-4" />}
          accentTone="navy"
        />

        <StatisticsCard
          label="Best Hydration Day"
          value={bestDayValue}
          detail={bestDayDetail}
          icon={<Award className="w-4 h-4" />}
          accentTone="mint"
        />

        <StatisticsCard
          label="Goal Completion Rate"
          value={`${statistics.goalCompletionRate}%`}
          detail={
            statistics.daysLogged > 0
              ? `${statistics.daysGoalMet} of ${statistics.daysLogged} logged days met target`
              : 'Log your first day to measure consistency'
          }
          icon={<Calendar className="w-4 h-4" />}
          accentTone="navy"
        />

        <StatisticsCard
          label="Hydration Streak"
          value={`${statistics.currentStreak} ${
            statistics.currentStreak === 1 ? 'day' : 'days'
          }`}
          detail={`Longest streak: ${statistics.longestStreak} ${
            statistics.longestStreak === 1 ? 'day' : 'days'
          }`}
          icon={<Flame className="w-4 h-4" />}
          accentTone={statistics.currentStreak > 0 ? 'mint' : 'navy'}
        />
      </div>

      {/* Interactive Weekly Progress Chart */}
      <WeeklyProgressChart
        weeklySeries={statistics.weeklySeries}
        dailyGoalMl={settings.daily_goal_ml}
      />

      {/* 7-Day Daily Breakdown Table/List */}
      <section className="rounded-3xl bg-white border border-sky-950/8 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-sky-950/6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#0B1F3A]">
              Trailing 7-Day Breakdown
            </h2>
            <p className="text-xs text-[#647D9B]">
              Daily intake compared against your{' '}
              {settings.daily_goal_ml.toLocaleString()} ml target
            </p>
          </div>
        </div>

        <div className="divide-y divide-sky-950/6">
          {[...statistics.weeklySeries].reverse().map((day) => (
            <div
              key={day.date}
              className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[170px]">
                <span className="font-display text-sm font-bold text-[#0B1F3A]">
                  {day.date === todayKey ? 'Today' : day.dayFull}
                </span>
                {day.goalMet && (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    aria-label="Goal achieved"
                  />
                )}
              </div>

              <div className="flex-1 max-w-md w-full">
                <div className="w-full h-2.5 rounded-full bg-sky-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      day.goalMet ? 'bg-emerald-600' : 'bg-[#0284C7]'
                    }`}
                    style={{ width: `${day.percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[140px]">
                <span className="font-display text-sm font-bold text-[#0B1F3A] tabular-nums">
                  {day.totalMl.toLocaleString()} ml
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    day.goalMet ? 'text-emerald-700' : 'text-[#647D9B]'
                  }`}
                >
                  {day.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
