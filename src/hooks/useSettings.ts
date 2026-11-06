import { useEffect, useState } from 'react';
import { HYDRATION_LIMITS } from '../constants/config.ts';
import type { UserSettings } from '../types/index.ts';

export function useSettingsForm(settings: UserSettings | undefined) {
  const [userName, setUserName] = useState(settings?.user_name ?? 'Friend');
  const [dailyGoalInput, setDailyGoalInput] = useState(
    String(settings?.daily_goal_ml ?? HYDRATION_LIMITS.DEFAULT_GOAL_ML)
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    settings?.reminders_enabled ?? true
  );
  const [startTime, setStartTime] = useState(
    settings?.reminder_start_time ?? HYDRATION_LIMITS.DEFAULT_START_TIME
  );
  const [endTime, setEndTime] = useState(
    settings?.reminder_end_time ?? HYDRATION_LIMITS.DEFAULT_END_TIME
  );
  const [intervalMinutes, setIntervalMinutes] = useState(
    settings?.reminder_interval_minutes ??
      HYDRATION_LIMITS.DEFAULT_INTERVAL_MINUTES
  );
  const [soundEnabled, setSoundEnabled] = useState(
    settings?.sound_enabled ?? true
  );

  useEffect(() => {
    if (!settings) return;
    setUserName(settings.user_name);
    setDailyGoalInput(String(settings.daily_goal_ml));
    setRemindersEnabled(settings.reminders_enabled);
    setStartTime(settings.reminder_start_time);
    setEndTime(settings.reminder_end_time);
    setIntervalMinutes(settings.reminder_interval_minutes);
    setSoundEnabled(settings.sound_enabled);
  }, [settings]);

  const validateGoal = (raw: string): { valid: boolean; value: number; error?: string } => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, value: 0, error: 'Please enter a daily goal.' };
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
      return { valid: false, value: 0, error: 'Enter a whole number in ml.' };
    }
    if (
      num < HYDRATION_LIMITS.MIN_GOAL_ML ||
      num > HYDRATION_LIMITS.MAX_GOAL_ML
    ) {
      return {
        valid: false,
        value: num,
        error: `Goal must be between ${HYDRATION_LIMITS.MIN_GOAL_ML} ml and ${HYDRATION_LIMITS.MAX_GOAL_ML.toLocaleString()} ml.`,
      };
    }
    return { valid: true, value: num };
  };

  return {
    userName,
    setUserName,
    dailyGoalInput,
    setDailyGoalInput,
    remindersEnabled,
    setRemindersEnabled,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    intervalMinutes,
    setIntervalMinutes,
    soundEnabled,
    setSoundEnabled,
    validateGoal,
  };
}
