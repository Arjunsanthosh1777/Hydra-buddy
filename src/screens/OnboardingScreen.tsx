import { ArrowLeft, ArrowRight, Bell, Check, Droplets, Target } from 'lucide-react';
import { useState } from 'react';
import {
  GOAL_PRESETS_ML,
  HYDRATION_LIMITS,
  REMINDER_INTERVAL_OPTIONS,
} from '../constants/config.ts';
import type {
  NotificationPermissionState,
  UserSettings,
} from '../types/index.ts';

interface OnboardingScreenProps {
  settings: UserSettings;
  notificationPermission: NotificationPermissionState;
  onRequestNotifications: () => Promise<NotificationPermissionState>;
  onCompleteOnboarding: (
    patch: Partial<Omit<UserSettings, 'id' | 'updated_at'>>
  ) => Promise<boolean>;
  saving?: boolean;
}

const HERO_IMAGE_SRC =
  '/src/assets/images/onboarding_hydration_hero_1793968625295.jpg';

export function OnboardingScreen({
  settings,
  notificationPermission,
  onRequestNotifications,
  onCompleteOnboarding,
  saving = false,
}: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [heroError, setHeroError] = useState(false);

  const [userName, setUserName] = useState(settings.user_name || 'Friend');
  const [goalInput, setGoalInput] = useState(String(settings.daily_goal_ml));
  const [goalError, setGoalError] = useState<string | null>(null);

  const [remindersEnabled, setRemindersEnabled] = useState(
    settings.reminders_enabled
  );
  const [startTime, setStartTime] = useState(settings.reminder_start_time);
  const [endTime, setEndTime] = useState(settings.reminder_end_time);
  const [intervalMinutes, setIntervalMinutes] = useState(
    settings.reminder_interval_minutes
  );

  const validateAndProceedFromStep2 = () => {
    const trimmed = goalInput.trim();
    const num = Number(trimmed);
    if (!trimmed || !Number.isFinite(num) || !Number.isInteger(num)) {
      setGoalError('Please enter a valid whole number in milliliters.');
      return;
    }
    if (
      num < HYDRATION_LIMITS.MIN_GOAL_ML ||
      num > HYDRATION_LIMITS.MAX_GOAL_ML
    ) {
      setGoalError(
        `Daily goal must be between ${HYDRATION_LIMITS.MIN_GOAL_ML} ml and ${HYDRATION_LIMITS.MAX_GOAL_ML.toLocaleString()} ml.`
      );
      return;
    }
    setGoalError(null);
    setStep(3);
  };

  const handleFinish = async () => {
    const parsedGoal = Math.max(
      HYDRATION_LIMITS.MIN_GOAL_ML,
      Math.min(
        HYDRATION_LIMITS.MAX_GOAL_ML,
        Math.round(Number(goalInput) || HYDRATION_LIMITS.DEFAULT_GOAL_ML)
      )
    );

    await onCompleteOnboarding({
      user_name: userName.trim() || 'Friend',
      daily_goal_ml: parsedGoal,
      reminders_enabled: remindersEnabled,
      reminder_start_time: startTime,
      reminder_end_time: endTime,
      reminder_interval_minutes: intervalMinutes,
      onboarding_completed: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F9FD] flex flex-col justify-center px-4 sm:px-6 py-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-3xl border border-sky-950/8 shadow-sm overflow-hidden">
        {/* Progress Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-sky-950/6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0284C7] text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-display text-base font-extrabold tracking-tight text-[#0B1F3A]">
              HYDRABUDDY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#647D9B] tabular-nums">
              Step {step} of 3
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === step
                      ? 'w-6 bg-[#0284C7]'
                      : idx < step
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-sky-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Welcome & Overview */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-sky-700">
                  Daily Hydration Companion
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] text-balance leading-tight">
                  Build consistent daily hydration habits
                </h1>
                <p className="text-sm sm:text-base text-[#3B5575] leading-relaxed">
                  HydraBuddy helps you record water intake in seconds, track
                  daily goals, inspect weekly trends, and maintain healthy
                  streaks with customizable reminders.
                </p>

                <ul className="space-y-3 pt-2 text-sm text-[#0B1F3A]">
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span>One-tap quick-add presets and custom volumes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span>Persistent SQLite history, charts, and streak badges</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span>Configurable reminder schedules on your terms</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[48px] px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Set Your Daily Goal</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#F4F9FD] min-h-[240px] lg:min-h-[420px] relative overflow-hidden">
              {!heroError ? (
                <img
                  src={HERO_IMAGE_SRC}
                  alt="Crystal glass carafe and tumbler filled with fresh water in morning sunlight"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-50 flex flex-col items-center justify-center p-8 text-center">
                  <Droplets
                    className="w-16 h-16 text-sky-600 mb-3"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-bold text-[#0B1F3A]">
                    Pure Daily Hydration
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Personalize Name & Daily Target */}
        {step === 2 && (
          <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Target className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#0B1F3A]">
                Personalize your daily target
              </h2>
              <p className="text-sm text-[#3B5575]">
                Choose a daily water intake goal that matches your routine. You
                can edit this anytime from the dashboard or settings.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-name"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Your Name
              </label>
              <input
                id="onboarding-name"
                type="text"
                maxLength={40}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Friend"
                className="w-full min-h-[48px] px-4 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#3B5575]">
                Select a Preset Goal (ml)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {GOAL_PRESETS_ML.map((preset) => {
                  const selected = Number(goalInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setGoalInput(String(preset));
                        setGoalError(null);
                      }}
                      className={`min-h-[48px] rounded-xl text-sm font-bold tabular-nums transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#0284C7] text-white shadow-xs'
                          : 'bg-[#F4F9FD] text-[#0B1F3A] border border-sky-950/10 hover:border-sky-400'
                      }`}
                    >
                      {preset.toLocaleString()} ml
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-goal"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Or Enter Custom Daily Target (ml)
              </label>
              <div className="relative">
                <input
                  id="onboarding-goal"
                  type="number"
                  inputMode="numeric"
                  min={HYDRATION_LIMITS.MIN_GOAL_ML}
                  max={HYDRATION_LIMITS.MAX_GOAL_ML}
                  step={50}
                  value={goalInput}
                  onChange={(e) => {
                    setGoalInput(e.target.value);
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

            <p className="text-xs text-[#647D9B] bg-[#F4F9FD] rounded-xl p-3.5 border border-sky-950/6">
              Note: Daily hydration goals in HydraBuddy are user-configurable
              personal wellness targets and are not medical advice.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] px-4 rounded-xl text-sm font-semibold text-[#3B5575] hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={validateAndProceedFromStep2}
                className="min-h-[48px] px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Configure Reminders</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Hydration Reminders Setup */}
        {step === 3 && (
          <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#0B1F3A]">
                Configure hydration reminders
              </h2>
              <p className="text-sm text-[#3B5575]">
                Stay on schedule between your waking hours without duplicate
                alerts.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F4F9FD] border border-sky-950/8 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-sm font-bold text-[#0B1F3A]">
                  Enable Hydration Reminders
                </p>
                <p className="text-xs text-[#647D9B] mt-0.5">
                  Receive periodic prompts during your chosen active window
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={remindersEnabled}
                onClick={() => setRemindersEnabled((prev) => !prev)}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  remindersEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-[#3B5575]'
                }`}
              >
                {remindersEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {remindersEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="onboarding-start-time"
                      className="block text-xs font-semibold text-[#3B5575]"
                    >
                      Start Time
                    </label>
                    <input
                      id="onboarding-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] tabular-nums"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="onboarding-end-time"
                      className="block text-xs font-semibold text-[#3B5575]"
                    >
                      End Time
                    </label>
                    <input
                      id="onboarding-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
                      const active = intervalMinutes === opt.minutes;
                      return (
                        <button
                          key={opt.minutes}
                          type="button"
                          onClick={() => setIntervalMinutes(opt.minutes)}
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

                <div className="rounded-2xl bg-[#F4F9FD] border border-sky-950/8 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#0B1F3A]">
                      Browser Notification Permission
                    </p>
                    <p className="text-xs text-[#647D9B] mt-0.5">
                      {notificationPermission === 'granted'
                        ? 'Browser notifications are allowed.'
                        : notificationPermission === 'denied'
                          ? 'Browser notifications blocked; in-app reminder banners will still alert you.'
                          : 'Allow browser alerts or rely on in-app reminder prompts.'}
                    </p>
                  </div>
                  {notificationPermission !== 'granted' &&
                    notificationPermission !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={onRequestNotifications}
                        className="min-h-[40px] px-3.5 rounded-xl bg-white border border-sky-950/12 text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
                      >
                        Enable Notifications
                      </button>
                    )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] px-4 rounded-xl text-sm font-semibold text-[#3B5575] hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                className="min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <span>{saving ? 'Starting...' : 'Start Tracking'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
