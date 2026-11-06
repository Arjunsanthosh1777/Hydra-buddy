import { Award, Bell, CheckCircle2, Droplets, Flame, Plus } from 'lucide-react';
import { IntakeCard } from '../components/IntakeCard.tsx';
import { QuickAddButtons } from '../components/QuickAddButtons.tsx';
import { WaterProgress } from '../components/WaterProgress.tsx';
import {
  formatFullHeaderDate,
  formatTimeFromIso,
  getGreetingForHour,
} from '../constants/config.ts';
import { getMotivationalMessage } from '../services/hydrationService.ts';
import { getNextReminderSlot } from '../services/notificationService.ts';
import type { HydrationSnapshot, TabRoute } from '../types/index.ts';

interface HomeScreenProps {
  snapshot: HydrationSnapshot;
  mutating: boolean;
  onQuickAdd: (amountMl: number) => Promise<boolean>;
  onDeleteEntry: (entryId: number) => Promise<boolean>;
  onOpenAddModal: () => void;
  onOpenGoalModal: () => void;
  onSendTestReminder: () => void;
  onNavigateTab: (tab: TabRoute) => void;
}

export function HomeScreen({
  snapshot,
  mutating,
  onQuickAdd,
  onDeleteEntry,
  onOpenAddModal,
  onOpenGoalModal,
  onSendTestReminder,
  onNavigateTab,
}: HomeScreenProps) {
  const { settings, todaySummary, todayEntries, statistics, achievements } =
    snapshot;

  const now = new Date();
  const greeting = getGreetingForHour(now.getHours(), settings.user_name);
  const formattedDate = formatFullHeaderDate(now);
  const motivation = getMotivationalMessage(todaySummary, statistics);
  const nextReminder = getNextReminderSlot(settings, now);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Greeting & Unboxed Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-[#647D9B]">
            <span>{formattedDate}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              Daily Target {todaySummary.goalMl.toLocaleString()} ml
            </span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A] text-balance">
            {greeting}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="min-h-[46px] px-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer sm:hidden"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Log Custom Water</span>
        </button>
      </div>

      {/* Congratulatory Goal Achieved Banner */}
      {todaySummary.goalAchieved && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 flex items-start gap-3.5">
          <CheckCircle2
            className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="font-display text-sm sm:text-base font-bold text-emerald-950">
              {motivation.headline}
            </p>
            <p className="text-xs sm:text-sm text-emerald-800">
              {motivation.detail}
            </p>
          </div>
        </div>
      )}

      {/* Main 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Primary Column (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Focal Anchor Card: Circular Hydration Ring & Quick Add */}
          <section className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-7 shadow-xs space-y-7">
            <WaterProgress
              summary={todaySummary}
              onEditGoalClick={onOpenGoalModal}
            />

            <div className="pt-2 border-t border-sky-950/6">
              <QuickAddButtons
                onQuickAdd={onQuickAdd}
                onOpenCustomModal={onOpenAddModal}
                disabled={mutating}
              />
            </div>
          </section>

          {/* Today's Water Intake Log */}
          <section className="rounded-3xl bg-white border border-sky-950/8 shadow-xs overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-sky-950/6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#0B1F3A]">
                  Today&apos;s Water Intake
                </h2>
                <p className="text-xs text-[#647D9B] tabular-nums">
                  {todayEntries.length === 0
                    ? 'No glasses recorded yet today'
                    : `${todayEntries.length} ${
                        todayEntries.length === 1 ? 'entry' : 'entries'
                      } · ${todaySummary.totalMl.toLocaleString()} ml total`}
                </p>
              </div>

              {todayEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('history')}
                  className="min-h-[40px] px-3 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Full History
                </button>
              )}
            </div>

            {todayEntries.length === 0 ? (
              <div className="py-10 px-6 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Droplets className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-display text-sm font-bold text-[#0B1F3A]">
                  Your daily log is ready
                </p>
                <p className="text-xs text-[#647D9B] mt-1 max-w-xs">
                  Tap any quick-add button above to log your first glass of
                  water and track progress toward your{' '}
                  {todaySummary.goalMl.toLocaleString()} ml goal.
                </p>
              </div>
            ) : (
              <div>
                {todayEntries.map((entry) => (
                  <IntakeCard
                    key={entry.id}
                    entry={entry}
                    onDelete={onDeleteEntry}
                    disabled={mutating}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right / Companion Column (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Hydration Summary & Motivation */}
          <section className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                Daily Summary
              </h2>
              <span className="text-xs font-semibold text-sky-700 tabular-nums">
                {todaySummary.percentage}% complete
              </span>
            </div>

            <p className="text-sm font-semibold text-[#0B1F3A]">
              {motivation.headline}
            </p>
            <p className="text-xs text-[#3B5575] leading-relaxed">
              {motivation.detail}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-[#F4F9FD] p-3.5 border border-sky-950/6">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Current Streak</span>
                </div>
                <p className="font-display text-xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums">
                  {statistics.currentStreak}{' '}
                  {statistics.currentStreak === 1 ? 'day' : 'days'}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F4F9FD] p-3.5 border border-sky-950/6">
                <div className="flex items-center gap-1.5 text-sky-700 text-xs font-medium">
                  <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Badges</span>
                </div>
                <p className="font-display text-xl font-extrabold text-[#0B1F3A] mt-1 tabular-nums">
                  {unlockedCount} / {achievements.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('statistics')}
              className="w-full min-h-[44px] rounded-xl bg-[#F4F9FD] hover:bg-sky-100/70 text-xs font-semibold text-sky-800 transition-colors cursor-pointer"
            >
              View Weekly Statistics
            </button>
          </section>

          {/* Hydration Reminder Schedule Card */}
          <section className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                  Hydration Reminders
                </h2>
              </div>
              <span
                className={`text-xs font-semibold ${
                  settings.reminders_enabled
                    ? 'text-emerald-700'
                    : 'text-[#647D9B]'
                }`}
              >
                {settings.reminders_enabled ? 'Active' : 'Paused'}
              </span>
            </div>

            {settings.reminders_enabled && nextReminder ? (
              <div className="rounded-2xl bg-[#F4F9FD] p-4 border border-sky-950/6 space-y-1">
                <p className="text-xs text-[#647D9B]">Next Scheduled Reminder</p>
                <p className="font-display text-xl font-extrabold text-[#0B1F3A] tabular-nums">
                  {nextReminder.formattedTime}
                  {nextReminder.isTomorrow ? ' (Tomorrow)' : ''}
                </p>
                <p className="text-xs text-[#3B5575] tabular-nums">
                  Every {settings.reminder_interval_minutes} min ·{' '}
                  {formatTimeFromIso(settings.reminder_start_time)} to{' '}
                  {formatTimeFromIso(settings.reminder_end_time)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#647D9B] leading-relaxed">
                Hydration reminders are currently turned off. Enable them in
                Settings to receive periodic water prompts.
              </p>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSendTestReminder}
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Test Reminder
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#F4F9FD] hover:bg-slate-200/70 text-[#0B1F3A] text-xs font-semibold transition-colors cursor-pointer"
              >
                Schedule Settings
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
