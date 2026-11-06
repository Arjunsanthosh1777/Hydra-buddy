import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalDateKey } from '../constants/config.ts';
import {
  getBrowserNotificationPermission,
  notificationScheduler,
  requestBrowserNotificationPermission,
} from '../services/notificationService.ts';
import type {
  AchievementStatus,
  HydrationSnapshot,
  InAppReminderAlert,
  NotificationPermissionState,
  UserSettings,
} from '../types/index.ts';

export function useHydration() {
  const [snapshot, setSnapshot] = useState<HydrationSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutating, setMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unlockedBanner, setUnlockedBanner] = useState<AchievementStatus[]>([]);
  const [reminderAlert, setReminderAlert] = useState<InAppReminderAlert | null>(
    null
  );
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(() =>
      getBrowserNotificationPermission()
    );

  const remainingMlRef = useRef<number>(2500);
  useEffect(() => {
    if (snapshot) {
      remainingMlRef.current = snapshot.todaySummary.remainingMl;
    }
  }, [snapshot]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (unlockedBanner.length === 0) return;
    const timer = window.setTimeout(() => setUnlockedBanner([]), 5500);
    return () => window.clearTimeout(timer);
  }, [unlockedBanner]);

  const fetchHydration = useCallback(async () => {
    try {
      setError(null);
      const todayKey = getLocalDateKey(new Date());
      const res = await fetch(
        `/api/hydration?date=${encodeURIComponent(todayKey)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to load hydration data.');
      }
      const data = (await res.json()) as HydrationSnapshot;
      setSnapshot(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to connect to database.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHydration();
  }, [fetchHydration]);

  // Keep notification scheduler synchronized with persisted user settings without duplicates
  useEffect(() => {
    if (!snapshot) return;
    notificationScheduler.syncSchedule(
      snapshot.settings,
      () => remainingMlRef.current,
      (alert) => setReminderAlert(alert)
    );
    return () => {
      notificationScheduler.clearScheduledReminders();
    };
  }, [
    snapshot?.settings.reminders_enabled,
    snapshot?.settings.reminder_start_time,
    snapshot?.settings.reminder_end_time,
    snapshot?.settings.reminder_interval_minutes,
    snapshot?.settings.sound_enabled,
    snapshot?.settings.daily_goal_ml,
  ]);

  const addWaterIntake = useCallback(
    async (
      amountMl: number,
      options?: { note?: string; consumedAtIso?: string; localDateKey?: string }
    ): Promise<boolean> => {
      try {
        setMutating(true);
        setError(null);
        const todayKey = options?.localDateKey ?? getLocalDateKey(new Date());
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_ml: amountMl,
            consumed_at: options?.consumedAtIso ?? new Date().toISOString(),
            local_date: todayKey,
            note: options?.note ?? null,
          }),
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to record water intake.');
        }

        const nextSnapshot = payload.snapshot as HydrationSnapshot;
        setSnapshot(nextSnapshot);
        showToast(`Logged +${amountMl.toLocaleString()} ml`);

        if (
          nextSnapshot.newlyUnlocked &&
          nextSnapshot.newlyUnlocked.length > 0
        ) {
          setUnlockedBanner(nextSnapshot.newlyUnlocked);
        }
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to log water intake.';
        setError(message);
        return false;
      } finally {
        setMutating(false);
      }
    },
    [showToast]
  );

  const deleteWaterEntry = useCallback(
    async (entryId: number): Promise<boolean> => {
      try {
        setMutating(true);
        setError(null);
        const todayKey = getLocalDateKey(new Date());
        const res = await fetch(
          `/api/entries/${entryId}?date=${encodeURIComponent(todayKey)}`,
          { method: 'DELETE' }
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to delete entry.');
        }
        setSnapshot(payload.snapshot as HydrationSnapshot);
        showToast('Entry removed');
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove entry.'
        );
        return false;
      } finally {
        setMutating(false);
      }
    },
    [showToast]
  );

  const updateSettings = useCallback(
    async (
      patch: Partial<Omit<UserSettings, 'id' | 'updated_at'>>,
      customToast?: string
    ): Promise<boolean> => {
      try {
        setMutating(true);
        setError(null);
        const todayKey = getLocalDateKey(new Date());
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...patch,
            local_date: todayKey,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to save settings.');
        }
        const nextSnapshot = payload.snapshot as HydrationSnapshot;
        setSnapshot(nextSnapshot);
        if (customToast) {
          showToast(customToast);
        }
        if (
          nextSnapshot.newlyUnlocked &&
          nextSnapshot.newlyUnlocked.length > 0
        ) {
          setUnlockedBanner(nextSnapshot.newlyUnlocked);
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update settings.'
        );
        return false;
      } finally {
        setMutating(false);
      }
    },
    [showToast]
  );

  const resetAllData = useCallback(
    async (resetSettings: boolean = false): Promise<boolean> => {
      try {
        setMutating(true);
        setError(null);
        const todayKey = getLocalDateKey(new Date());
        const res = await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetSettings,
            local_date: todayKey,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to reset data.');
        }
        setSnapshot(payload.snapshot as HydrationSnapshot);
        setUnlockedBanner([]);
        showToast(
          resetSettings
            ? 'All entries and settings reset'
            : 'Water intake history cleared'
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset data.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [showToast]
  );

  const requestNotifications = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Browser notifications enabled');
    } else if (perm === 'denied') {
      showToast('Browser blocked OS alerts; in-app reminders active');
    } else {
      showToast('In-app hydration reminders active');
    }
    return perm;
  }, [showToast]);

  const sendTestReminder = useCallback(() => {
    if (!snapshot) return;
    notificationScheduler.triggerNotification(
      snapshot.settings,
      snapshot.todaySummary.remainingMl,
      (alert) => setReminderAlert(alert),
      'Test Reminder'
    );
  }, [snapshot]);

  return {
    snapshot,
    loading,
    mutating,
    error,
    clearError: () => setError(null),
    toastMessage,
    unlockedBanner,
    dismissUnlockedBanner: () => setUnlockedBanner([]),
    reminderAlert,
    dismissReminderAlert: () => setReminderAlert(null),
    notificationPermission,
    refreshHydration: fetchHydration,
    addWaterIntake,
    deleteWaterEntry,
    updateSettings,
    resetAllData,
    requestNotifications,
    sendTestReminder,
  };
}
