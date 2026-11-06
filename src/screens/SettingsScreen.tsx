import {
  AlertTriangle,
  Bell,
  Compass,
  Download,
  Info,
  RotateCcw,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  formatTimeFromIso,
  GOAL_PRESETS_ML,
  HYDRATION_LIMITS,
  REMINDER_INTERVAL_OPTIONS,
} from '../constants/config.ts';
import { useSettingsForm } from '../hooks/useSettings.ts';
import { computeReminderSlots } from '../services/notificationService.ts';
import type {
  HydrationSnapshot,
  NotificationPermissionState,
  UserSettings,
} from '../types/index.ts';

interface SettingsScreenProps {
  snapshot: HydrationSnapshot;
  storageMode: 'sqlite' | 'browser';
  mutating: boolean;
  notificationPermission: NotificationPermissionState;
  onUpdateSettings: (
    patch: Partial<Omit<UserSettings, 'id' | 'updated_at'>>,
    toastMsg?: string
  ) => Promise<boolean>;
  onResetData: (resetSettings: boolean) => Promise<boolean>;
  onRequestNotifications: () => Promise<NotificationPermissionState>;
  onSendTestReminder: () => void;
  onReopenOnboarding: () => void;
}

export function SettingsScreen({
  snapshot,
  storageMode,
  mutating,
  notificationPermission,
  onUpdateSettings,
  onResetData,
  onRequestNotifications,
  onSendTestReminder,
  onReopenOnboarding,
}: SettingsScreenProps) {
  const { settings } = snapshot;
  const form = useSettingsForm(settings);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const previewSlots = computeReminderSlots(
    form.startTime,
    form.endTime,
    form.intervalMinutes
  );

  const handleSaveGoalAndProfile = async (e: FormEvent) => {
    e.preventDefault();
    const check = form.validateGoal(form.dailyGoalInput);
    if (!check.valid) {
      setGoalError(check.error || 'Invalid daily goal');
      return;
    }
    setGoalError(null);
    await onUpdateSettings(
      {
        user_name: form.userName.trim() || 'Friend',
        daily_goal_ml: check.value,
      },
      'Profile and daily goal saved'
    );
  };

  const handleSaveReminders = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(
      {
        reminders_enabled: form.remindersEnabled,
        reminder_start_time: form.startTime,
        reminder_end_time: form.endTime,
        reminder_interval_minutes: form.intervalMinutes,
        sound_enabled: form.soundEnabled,
      },
      'Reminder preferences saved'
    );
  };

  const handleToggleRemindersImmediate = async () => {
    const nextValue = !form.remindersEnabled;
    form.setRemindersEnabled(nextValue);
    await onUpdateSettings(
      { reminders_enabled: nextValue },
      nextValue ? 'Hydration reminders enabled' : 'Hydration reminders paused'
    );
  };

  const handleExportJson = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      application: 'HYDRABUDDY – Smart Water Intake Tracker',
      settings: snapshot.settings,
      statistics: snapshot.statistics,
      historyGroups: snapshot.historyGroups,
      achievements: snapshot.achievements.filter((a) => a.unlocked),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydrabuddy-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-[#647D9B]">
          Personal hydration target, reminder schedule, and local SQLite data
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daily Goal & Reminder Preferences */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Hydration Goal & Profile Card */}
          <form
            onSubmit={handleSaveGoalAndProfile}
            className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-7 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Target className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                  Daily Water Goal &amp; Profile
                </h2>
                <p className="text-xs text-[#647D9B]">
                  Customize your daily consumption target
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="settings-user-name"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Display Name
              </label>
              <input
                id="settings-user-name"
                type="text"
                maxLength={40}
                value={form.userName}
                onChange={(e) => form.setUserName(e.target.value)}
                className="w-full min-h-[46px] px-4 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#3B5575]">
                Quick Goal Presets (ml)
              </span>
              <div className="grid grid-cols-5 gap-2">
                {GOAL_PRESETS_ML.map((preset) => {
                  const active = Number(form.dailyGoalInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        form.setDailyGoalInput(String(preset));
                        setGoalError(null);
                      }}
                      className={`min-h-[44px] rounded-xl text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-[#F4F9FD] text-[#0B1F3A] border border-sky-950/10 hover:border-sky-400'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="settings-daily-goal"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Daily Hydration Target (ml)
              </label>
              <div className="relative">
                <input
                  id="settings-daily-goal"
                  type="number"
                  inputMode="numeric"
                  min={HYDRATION_LIMITS.MIN_GOAL_ML}
                  max={HYDRATION_LIMITS.MAX_GOAL_ML}
                  step={50}
                  value={form.dailyGoalInput}
                  onChange={(e) => {
                    form.setDailyGoalInput(e.target.value);
                    if (goalError) setGoalError(null);
                  }}
                  className="w-full min-h-[48px] px-4 pr-14 rounded-xl bg-[#F4F9FD] border border-sky-950/12 font-display text-lg font-bold text-[#0B1F3A] tabular-nums focus:outline-none focus:border-sky-600 focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#647D9B]">
                  ml
                </span>
              </div>
              {goalError && (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {goalError}
                </p>
              )}
            </div>

            <p className="text-xs text-[#647D9B] leading-relaxed bg-[#F4F9FD] rounded-xl p-3.5 border border-sky-950/6">
              Hydration targets are user-configurable personal wellness goals and
              not medical advice. Changing your goal updates today&apos;s
              remaining water and streak calculations immediately.
            </p>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutating}
                className="min-h-[46px] px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save Goal &amp; Profile
              </button>
            </div>
          </form>

          {/* Hydration Reminders & Notification Settings */}
          <form
            onSubmit={handleSaveReminders}
            className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-7 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                    Hydration Reminders
                  </h2>
                  <p className="text-xs text-[#647D9B]">
                    Configure active window and reminder interval
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.remindersEnabled}
                onClick={handleToggleRemindersImmediate}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  form.remindersEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-[#3B5575]'
                }`}
              >
                {form.remindersEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="settings-start-time"
                  className="block text-xs font-semibold text-[#3B5575]"
                >
                  Reminder Start Time
                </label>
                <input
                  id="settings-start-time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => form.setStartTime(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="settings-end-time"
                  className="block text-xs font-semibold text-[#3B5575]"
                >
                  Reminder End Time
                </label>
                <input
                  id="settings-end-time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => form.setEndTime(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#3B5575]">
                Reminder Interval
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REMINDER_INTERVAL_OPTIONS.map((opt) => {
                  const active = form.intervalMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => form.setIntervalMinutes(opt.minutes)}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-[#F4F9FD] text-[#3B5575] border border-sky-950/10 hover:text-[#0B1F3A]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gentle Sound Chime Toggle */}
            <div className="rounded-2xl bg-[#F4F9FD] border border-sky-950/6 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {form.soundEnabled ? (
                  <Volume2
                    className="w-4 h-4 text-sky-700 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <VolumeX
                    className="w-4 h-4 text-[#647D9B] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-[#0B1F3A]">
                    Gentle Water Chime
                  </p>
                  <p className="text-xs text-[#647D9B]">
                    Play a soft acoustic chime when a reminder triggers
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.soundEnabled}
                onClick={() => form.setSoundEnabled((prev) => !prev)}
                className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  form.soundEnabled
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-slate-200 text-[#3B5575]'
                }`}
              >
                {form.soundEnabled ? 'Sound On' : 'Muted'}
              </button>
            </div>

            {/* Browser Notification Permission & Test Trigger */}
            <div className="rounded-2xl bg-[#F4F9FD] border border-sky-950/6 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#0B1F3A]">
                    Browser Notification Permission
                  </p>
                  <p className="text-xs text-[#647D9B] mt-0.5">
                    {notificationPermission === 'granted'
                      ? 'Permission granted — native browser notifications & in-app alerts active.'
                      : notificationPermission === 'denied'
                        ? 'Permission denied by browser — in-app reminder banners remain active.'
                        : notificationPermission === 'unsupported'
                          ? 'Native OS notifications unavailable in this frame — in-app reminder banners active.'
                          : 'Request browser permission for desktop/mobile system alerts.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {notificationPermission !== 'granted' &&
                    notificationPermission !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={onRequestNotifications}
                        className="min-h-[40px] px-3.5 rounded-xl bg-white border border-sky-950/12 text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
                      >
                        Request Permission
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={onSendTestReminder}
                    className="min-h-[40px] px-3.5 rounded-xl bg-sky-100 hover:bg-sky-200/80 text-xs font-semibold text-sky-900 cursor-pointer"
                  >
                    Send Test Reminder
                  </button>
                </div>
              </div>

              {form.remindersEnabled && previewSlots.length > 0 && (
                <div className="pt-2 border-t border-sky-950/6">
                  <p className="text-xs text-[#647D9B] mb-1.5 tabular-nums">
                    Daily Schedule Preview ({previewSlots.length} reminders):
                  </p>
                  <p className="text-xs font-medium text-[#0B1F3A] leading-relaxed tabular-nums">
                    {previewSlots
                      .slice(0, 12)
                      .map((s) => formatTimeFromIso(s))
                      .join(' · ')}
                    {previewSlots.length > 12
                      ? ` · +${previewSlots.length - 12} more`
                      : ''}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutating}
                className="min-h-[46px] px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save Reminder Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Data Management & Application Information */}
        <div className="lg:col-span-5 space-y-6">
          {/* Data Management & Reset */}
          <section className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
              Data Management
            </h2>
            <p className="text-xs text-[#647D9B] leading-relaxed">
              Export your complete hydration history or clear stored water
              intake entries from SQLite.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full min-h-[46px] px-4 rounded-2xl bg-[#F4F9FD] hover:bg-sky-50 border border-sky-950/8 text-xs font-semibold text-[#0B1F3A] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Export Hydration History (JSON)</span>
                <Download className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onReopenOnboarding}
                className="w-full min-h-[46px] px-4 rounded-2xl bg-[#F4F9FD] hover:bg-sky-50 border border-sky-950/8 text-xs font-semibold text-[#0B1F3A] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Re-open Setup Walkthrough</span>
                <Compass className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="w-full min-h-[46px] px-4 rounded-2xl bg-red-50/70 hover:bg-red-100/80 border border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Reset Hydration Data</span>
                <RotateCcw className="w-4 h-4 text-red-600" aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* Application Information */}
          <section className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                About HYDRABUDDY
              </h2>
            </div>

            <p className="text-xs text-[#3B5575] leading-relaxed">
              HYDRABUDDY is a smart water intake tracker designed to help build
              steady daily hydration habits through quick logging, customizable
              targets, streak tracking, and scheduled reminders.
            </p>

            <div className="divide-y divide-sky-950/6 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-[#647D9B]">Storage Engine</span>
                <span className="font-semibold text-[#0B1F3A]">
                  {storageMode === 'sqlite'
                    ? 'SQLite Persistent Database'
                    : 'Browser Local Storage'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-[#647D9B]">Reminder Delivery</span>
                <span className="font-semibold text-[#0B1F3A]">
                  Web Notifications + In-App Scheduler
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-[#647D9B]">Recorded Entries</span>
                <span className="font-semibold text-[#0B1F3A] tabular-nums">
                  {snapshot.statistics.totalEntries} entries
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/45 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-sky-950/10 shadow-xl p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3
                  id="reset-confirm-title"
                  className="font-display text-lg font-bold text-[#0B1F3A]"
                >
                  Confirm Data Reset
                </h3>
                <p className="text-xs text-[#3B5575] mt-1 leading-relaxed">
                  This permanently deletes all recorded water intake entries and
                  unlocked achievement badges from your SQLite database.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={mutating}
                onClick={async () => {
                  const ok = await onResetData(false);
                  if (ok) setResetModalOpen(false);
                }}
                className="w-full min-h-[46px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Entries &amp; Badges (Keep Preferences)
              </button>

              <button
                type="button"
                disabled={mutating}
                onClick={async () => {
                  const ok = await onResetData(true);
                  if (ok) setResetModalOpen(false);
                }}
                className="w-full min-h-[46px] px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Everything to Factory Defaults
              </button>

              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="w-full min-h-[46px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#3B5575] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
